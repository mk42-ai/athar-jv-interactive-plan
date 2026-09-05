#!/usr/bin/env python3
"""Build a protected, COMPLETE SQLite derivative without modifying any original.

Requires Python 3.10+, SQLite FTS5 and the existing ingest_documents.py (PyMuPDF).
Optional native OCR uses installed Tesseract and prepare_source_views.py/LibreOffice.
No network, provider, formula execution, external-link fetching or source rewriting.

  python3 -B scripts/build_complete_corpus.py --input-dir /private/inputs \
      --output-dir /private/ingestion --manifest /private/manifest.json \
      [--reuse-corpus /private/previous-corpus] [--skip-ocr]

index.json remains athar-corpus/v1, including its original rich chunk IDs. The
complete retrieval/viewer contract is corpus.sqlite + schema.md + coverage.json.
All explicit worksheet cells (including styled empties) retain their complete raw
record JSON. Full-content chunks are bounded and indexed, NOT sampled. Formula
lexemes, shared-formula reconstruction provenance and absent/empty caches survive.
Run in an OS-isolated/offline worker for defense-in-depth with untrusted documents.
"""
from __future__ import annotations
import argparse
from collections import Counter
import contextlib
import csv
import datetime as dt
import gzip
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile

sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location("athar_base_ingestion", Path(__file__).with_name("ingest_documents.py"))
ing = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ing)
VERSION = "athar-complete-corpus/1.0.0"
SCHEMA_VERSION = "athar-complete-corpus/v1"
MAX_TEXT = 8000
MAX_CELLS = 96
BATCH = 1000
DDL = '''
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID;
CREATE TABLE documents (
 id TEXT PRIMARY KEY, sha256 TEXT NOT NULL UNIQUE, slug TEXT NOT NULL,
 kind TEXT NOT NULL, title TEXT NOT NULL, aliases_json TEXT NOT NULL,
 original_file TEXT NOT NULL, raw_file TEXT NOT NULL, json TEXT NOT NULL
) WITHOUT ROWID;
CREATE TABLE cells (
 document_id TEXT NOT NULL REFERENCES documents(id), sheet TEXT NOT NULL,
 row INTEGER NOT NULL CHECK(row>0), col INTEGER NOT NULL CHECK(col>0),
 address TEXT NOT NULL, raw_line INTEGER NOT NULL, json TEXT NOT NULL,
 PRIMARY KEY(document_id,sheet,row,col)
) WITHOUT ROWID;
CREATE TABLE records (
 document_id TEXT NOT NULL REFERENCES documents(id), line INTEGER NOT NULL,
 record_type TEXT NOT NULL, sheet TEXT, page INTEGER, slide INTEGER, part TEXT,
 json TEXT NOT NULL, PRIMARY KEY(document_id,line)
) WITHOUT ROWID;
CREATE TABLE sheets (
 document_id TEXT NOT NULL REFERENCES documents(id), sheet TEXT NOT NULL,
 sheet_index INTEGER NOT NULL, state TEXT NOT NULL, dimension TEXT,
 min_row INTEGER, max_row INTEGER, min_col INTEGER, max_col INTEGER,
 cell_count INTEGER NOT NULL, nonempty_cell_count INTEGER NOT NULL,
 json TEXT NOT NULL, PRIMARY KEY(document_id,sheet)
) WITHOUT ROWID;
CREATE TABLE chunks (
 rowid INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE,
 document_id TEXT NOT NULL REFERENCES documents(id), kind TEXT NOT NULL,
 sheet TEXT, page INTEGER, slide INTEGER, "range" TEXT,
 row_min INTEGER, row_max INTEGER, col_min INTEGER, col_max INTEGER,
 layer TEXT NOT NULL CHECK(layer IN ('rich','complete','ocr')),
 text TEXT NOT NULL, json TEXT NOT NULL
);
CREATE TABLE ocr (
 id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id),
 page INTEGER, slide INTEGER, part TEXT, status TEXT NOT NULL,
 text TEXT NOT NULL, json TEXT NOT NULL
) WITHOUT ROWID;
'''
INDEX_DDL = '''
CREATE UNIQUE INDEX cells_address ON cells(document_id,sheet,address);
CREATE INDEX records_location ON records(document_id,record_type,sheet,page,slide);
CREATE INDEX chunks_location ON chunks(document_id,sheet,row_min,row_max,col_min,col_max);
CREATE INDEX chunks_page ON chunks(document_id,page,slide,kind);
CREATE INDEX chunks_layer ON chunks(layer,kind);
CREATE VIRTUAL TABLE chunks_fts USING fts5(
 text, content='chunks', content_rowid='rowid',
 tokenize='unicode61 remove_diacritics 2'
);
INSERT INTO chunks_fts(chunks_fts) VALUES('rebuild');
'''


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def protected_file(root, relative, prefix=None):
    if not isinstance(relative, str) or any(c in relative for c in ("\\", ":", "\0")):
        raise ValueError("Unsafe derivative path")
    parts = relative.split("/")
    if not parts or any(p in ("", ".", "..") for p in parts) or (prefix and parts[0] != prefix):
        raise ValueError("Unsafe derivative path")
    target = ing.no_symlinks(root.joinpath(*parts))
    if not target.is_relative_to(root):
        raise ValueError("Derivative path leaves protected root")
    return target


def read_inputs(input_dir, manifest_path):
    """Accept both base-extractor manifests and download-audit {files:[...]}.

    Transport URLs/headers/credentials are deliberately never copied to derivatives.
    Every supplied filename/hash assertion must match; aliases never merge hashes.
    """
    data = json.loads(ing.no_symlinks(manifest_path).read_text()) if manifest_path else {}
    entries = data if isinstance(data, list) else data.get("documents", data.get("files", []))
    aliases = {} if isinstance(data, list) else data.get("aliases", {})
    if not isinstance(entries, list) or not isinstance(aliases, dict):
        raise ValueError("Invalid manifest")
    cleaned = []
    for e in entries:
        if not isinstance(e, dict):
            raise ValueError("Invalid manifest entry")
        filename = e.get("file", e.get("filename", e.get("path")))
        if filename is not None and (not isinstance(filename, str) or "://" in filename or "\0" in filename):
            raise ValueError("Manifest filename must be a local identifier")
        item = {"file": filename} if filename is not None else {}
        for key in ("sha256", "slug", "title", "aliases", "version"):
            if key in e:
                item[key] = e[key]
        if "sha256" in item:
            item["sha256"] = str(item["sha256"]).lower()
            if not re.fullmatch(r"[0-9a-f]{64}", item["sha256"]):
                raise ValueError("Invalid manifest hash")
        if not isinstance(item.get("aliases", []), list):
            raise ValueError("Invalid aliases")
        cleaned.append(item)
    normalized_aliases = {ing.normal_name(k): v for k, v in aliases.items()}
    if any(v not in ing.DOCUMENTS for v in normalized_aliases.values()):
        raise ValueError("Unknown manifest alias slug")
    paths, ignored = [], []
    for path in sorted(input_dir.rglob("*"), key=lambda p: str(p.relative_to(input_dir)).casefold()):
        if path.is_symlink():
            raise ValueError("Input symlinks are prohibited")
        if not path.is_file():
            continue
        (paths if path.suffix.lower() in (".pdf", ".pptx", ".xlsx") else ignored).append(path)
    if not paths:
        raise ValueError("No supported inputs")
    files, unique, matched = [], {}, set()
    for path in paths:
        digest = ing.sha_file(path)
        slug, title = ing.detect_document(path, digest, cleaned, normalized_aliases)
        rel = str(path.relative_to(input_dir))
        ident = {"file": rel, "sha256": digest, "bytes": path.stat().st_size, "kind": path.suffix.lower()[1:], "slug": slug}
        files.append(ident)
        entry = unique.setdefault(digest, {"id": digest, "slug": slug, "title": title, "references": [], "aliases": [], "versions": []})
        if entry["slug"] != slug:
            raise ValueError("Conflicting identity for one hash")
        entry["references"].append(rel)
        for i, m in enumerate(cleaned):
            names = [m.get("file", ""), *m.get("aliases", [])]
            named = any(Path(str(n)).name.casefold() == path.name.casefold() for n in names)
            if named and m.get("sha256") and m["sha256"] != digest:
                raise ValueError("Manifest hash mismatch")
            if named or m.get("sha256") == digest:
                matched.add(i)
                entry["aliases"].extend(str(a) for a in m.get("aliases", []))
                if "version" in m and m["version"] not in entry["versions"]:
                    entry["versions"].append(m["version"])
    if len(matched) != len(cleaned):
        raise ValueError("Manifest contains an input that was not found")
    if isinstance(data, dict) and "inputCount" in data and data["inputCount"] != len(files):
        raise ValueError("Input count differs from manifest")
    return {"documents": cleaned, "aliases": aliases}, files, unique, len(ignored)


def validate_base(root, expected):
    file = ing.no_symlinks(root / "index.json")
    index = json.loads(file.read_text(encoding="utf-8"))
    if index.get("schemaVersion") != ing.SCHEMA_VERSION or index.get("extractorVersion") != ing.EXTRACTOR_VERSION:
        raise ValueError("Incompatible base extractor/schema")
    docs = index.get("documents", [])
    if {d["sha256"] for d in docs} != set(expected) or len(docs) != len(expected):
        raise ValueError("Base corpus does not match input hashes")
    for d in docs:
        if d["id"] != d["sha256"] or d["slug"] != expected[d["id"]]["slug"]:
            raise ValueError("Base corpus identity mismatch")
        for key, hash_key, prefix in (("originalFile", "sha256", "originals"), ("rawFile", "rawSha256", "raw")):
            if ing.sha_file(protected_file(root, d[key], prefix)) != d[hash_key]:
                raise ValueError("Base corpus derivative integrity mismatch")
    return index


def prepare_base(input_dir, output_dir, manifest_path=None, reuse_corpus=None):
    normalized, files, unique, ignored = read_inputs(input_dir, manifest_path)
    reuse = ing.no_symlinks(reuse_corpus) if reuse_corpus else output_dir
    reused = False
    if (reuse / "index.json").exists():
        index = validate_base(reuse, unique)
        if reuse != output_dir:
            for d in index["documents"]:
                ing.immutable_original(protected_file(reuse, d["originalFile"], "originals"),
                                       protected_file(output_dir, d["originalFile"], "originals"), d["sha256"])
                with ing.atomic_binary(protected_file(output_dir, d["rawFile"], "raw")) as dst:
                    with protected_file(reuse, d["rawFile"], "raw").open("rb") as src:
                        shutil.copyfileobj(src, dst, 1024 * 1024)
        reused = True
    else:
        safe_manifest = output_dir / "input-manifest.normalized.json"
        ing.write_json(safe_manifest, normalized)
        ing.ingest(input_dir, output_dir, safe_manifest)
        index = validate_base(output_dir, unique)
    for d in index["documents"]:
        entry = unique[d["id"]]
        old_aliases = d.get("aliases", []) + d.get("sourceReferences", [])
        d["sourceReferences"] = sorted(entry["references"])
        d["aliases"] = sorted(set(entry["aliases"] + entry["references"]))
        d["versionLabel"] = "SHA " + d["sha256"][:10]
        if entry["versions"]:
            d["manifestVersions"] = entry["versions"]
        # The exact file SHA is the immutable version even without a declared version.
        d["versionId"] = d["sha256"]
    ing.write_json(output_dir / "index.json", index)
    ing.write_json(output_dir / "input-identities.json", {"files": files, "ignoredFiles": ignored, "deduplication": "same-complete-file-SHA256-only"})
    return index, files, reused, ignored


def cell_text(cell):
    text = ing.exact_cell_text(cell)
    formula = cell.get("formula")
    if formula is not None:
        for key in ("text", "reconstructed", "anchorFormula"):
            if formula.get(key) is not None:
                text += f"\n{cell['cell']} formula.{key}: {formula[key]}"
        cache = cell["cache"]
        text += f"\n{cell['cell']} cache.state: {cache['state']}"
        if cache.get("lexeme") is not None:
            text += f"; cache.lexeme: {cache['lexeme']}"
        text += "; cache freshness unknown; not recalculated"
    return text


class Store:
    def __init__(self, connection):
        self.db = connection
        self.buffers = {"cells": [], "records": [], "chunks": []}
        self.counts = Counter()

    def flush(self):
        sql = {
            "cells": "INSERT INTO cells VALUES(?,?,?,?,?,?,?)",
            "records": "INSERT INTO records VALUES(?,?,?,?,?,?,?,?)",
            "chunks": 'INSERT INTO chunks(id,document_id,kind,sheet,page,slide,"range",row_min,row_max,col_min,col_max,layer,text,json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        }
        for name, rows in self.buffers.items():
            if rows:
                self.db.executemany(sql[name], rows)
                self.counts[name] += len(rows)
                rows.clear()

    def append(self, name, row):
        self.buffers[name].append(row)
        if len(self.buffers[name]) >= BATCH:
            self.flush()

    def chunk(self, item, layer):
        loc = item.get("location", {})
        bounds = (None, None, None, None)
        if loc.get("sheet") and loc.get("range"):
            try:
                c1, r1, c2, r2 = ing.range_bounds(loc["range"])
                bounds = (r1, r2, c1, c2)
            except ValueError:
                pass
        self.append("chunks", (item["id"], item["documentId"], item["kind"], loc.get("sheet"), loc.get("page"), loc.get("slide"), loc.get("range"), *bounds, layer, item["text"], ing.canonical(item)))

    def full_text(self, doc, kind, location, text, metadata=None, layer="complete"):
        text = str(text)
        # Empty pages/notes still get a locator; absence of native text is not OCR.
        total = max(1, (len(text) + MAX_TEXT - 1) // MAX_TEXT)
        for part in range(total):
            loc = dict(location)
            loc["part"] = f"{location.get('part', 'body')}:{part + 1}"
            seed = ing.canonical([VERSION, doc["sha256"], kind, loc])
            value = text[part * MAX_TEXT:(part + 1) * MAX_TEXT]
            meta = {"trust": "untrusted-source-data", "instructionsAreData": True,
                    "corpusLayer": layer, "completeContent": layer == "complete", "sampled": False,
                    "continuation": {"part": part + 1, "total": total, "textOffset": part * MAX_TEXT, "textLength": len(text)},
                    **(metadata or {})}
            label_parts = [doc["title"]]
            for key in ("sheet", "range", "page", "slide"):
                if key in loc:
                    label_parts.append(f"{key}: {loc[key]}")
            self.chunk({"id": "src-" + hashlib.sha256(seed.encode()).hexdigest(),
                        "documentId": doc["id"], "documentSlug": doc["slug"],
                        "kind": kind, "location": loc, "label": " • ".join(label_parts),
                        "text": value, "metadata": meta}, layer)
            self.counts[f"{layer}Chunks"] += 1


class CellChunks:
    def __init__(self, store, document):
        self.store, self.doc = store, document
        self.items = []
        self.length = 0

    def add(self, cell, line):
        text = cell_text(cell)
        if self.items and (cell["sheet"] != self.items[0][0]["sheet"] or len(self.items) >= MAX_CELLS or self.length + len(text) + 1 > MAX_TEXT):
            self.flush()
        self.items.append((cell, line, text))
        self.length += len(text) + 1
        if self.length >= MAX_TEXT:
            self.flush()

    def flush(self):
        if not self.items:
            return
        records = [item[0] for item in self.items]
        sheet = records[0]["sheet"]
        r1, r2 = min(c["row"] for c in records), max(c["row"] for c in records)
        c1, c2 = min(c["columnIndex"] for c in records), max(c["columnIndex"] for c in records)
        ref = f"{ing.col_letters(c1)}{r1}:{ing.col_letters(c2)}{r2}"
        self.store.full_text(self.doc, "cell-range", {"sheet": sheet, "range": ref, "part": f"cells-{self.items[0][1]}-{self.items[-1][1]}"},
                             "\n".join(item[2] for item in self.items),
                             {"cellAddresses": [c["cell"] for c in records], "cellCount": len(records),
                              "rangeIsBoundingBox": True, "formulaExecution": "never", "cacheFreshness": "unverified",
                              "rawSelector": {"documentId": self.doc["id"], "file": self.doc["rawFile"], "recordType": "cell", "sheet": sheet, "range": ref, "serverSideOnly": True},
                              "sourceLines": {"first": self.items[0][1], "last": self.items[-1][1]}})
        self.items.clear()
        self.length = 0


def stream_document(store, root, doc):
    stats = {"documentId": doc["id"], "slug": doc["slug"], "rawRecords": Counter(), "sheets": [], "pages": [], "slides": [], "notes": [], "formulaCaches": Counter(), "nonemptyCellsIndexed": 0, "explicitCellsStored": 0}
    sheet_map = {}
    bundles = CellChunks(store, doc)
    with gzip.open(protected_file(root, doc["rawFile"], "raw"), "rt", encoding="utf-8") as stream:
        for line, raw_json in enumerate(stream, 1):
            obj = json.loads(raw_json)
            if obj["documentId"] != doc["id"]:
                raise ValueError("Foreign document identity in raw stream")
            typ = obj["recordType"]
            stats["rawRecords"][typ] += 1
            if typ == "cell":
                sheet = sheet_map[obj["sheet"]]
                row, col = obj["row"], obj["columnIndex"]
                address = f"{ing.col_letters(col)}{row}"
                if ing.cell_xy(obj["cell"]) != (col, row):
                    raise ValueError("Cell coordinate disagreement")
                store.append("cells", (doc["id"], obj["sheet"], row, col, address, line, raw_json.rstrip("\n")))
                stats["explicitCellsStored"] += 1
                sheet["explicitCells"] += 1
                for key, value, fn in (("minRow", row, min), ("maxRow", row, max), ("minCol", col, min), ("maxCol", col, max)):
                    sheet[key] = value if sheet[key] is None else fn(sheet[key], value)
                if obj.get("formula") is not None:
                    state = obj["cache"]["state"]
                    stats["formulaCaches"][state] += 1
                    sheet["formulaCaches"][state] += 1
                if ing.meaningful(obj):
                    sheet["nonemptyCellsIndexed"] += 1
                    stats["nonemptyCellsIndexed"] += 1
                    bundles.add(obj, line)
                else:
                    sheet["explicitEmptyCells"] += 1
                if line % 25000 == 0:
                    store.flush()
                    store.db.commit()
                continue
            store.append("records", (doc["id"], line, typ, obj.get("sheet"), obj.get("page"), obj.get("slide"), obj.get("part"), raw_json.rstrip("\n")))
            if typ == "sheet":
                bundles.flush()
                sheet_map[obj["sheet"]] = {"sheet": obj["sheet"], "index": obj["index"], "state": obj["state"], "dimension": obj.get("dimension"), "part": obj["part"],
                    "explicitCells": 0, "nonemptyCellsIndexed": 0, "explicitEmptyCells": 0,
                    "formulaCaches": Counter(), "minRow": None, "maxRow": None, "minCol": None, "maxCol": None, "metadata": obj}
            elif typ in ("pdf-page", "slide", "notes", "cell-comment"):
                loc = {k: obj[k] for k in ("sheet", "page", "slide", "part") if obj.get(k) is not None}
                loc["part"] = f"raw-{line}-{obj.get('part', typ)}"
                if typ == "cell-comment":
                    loc["range"] = obj["cell"]
                text = obj.get("text", "\n".join(p["text"] for p in obj.get("paragraphs", [])))
                store.full_text(doc, typ, loc, text, {"rawSelector": {"documentId": doc["id"], "recordType": typ, "line": line, "file": doc["rawFile"], "serverSideOnly": True}, "nativeText": True})
                if typ == "pdf-page":
                    stats["pages"].append({"page": obj["page"], "nativeCharacters": len(text), "images": obj["images"], "rawLine": line})
                elif typ == "slide":
                    stats["slides"].append({"slide": obj["slide"], "part": obj["part"], "nativeCharacters": len(text), "paragraphs": len(obj["paragraphs"]), "hidden": obj["hidden"], "orphan": obj["orphan"], "rawLine": line})
                elif typ == "notes":
                    stats["notes"].append({"slide": obj.get("slide"), "part": obj["part"], "nativeCharacters": len(text), "rawLine": line})
                descriptions = "\n".join(str(s[k]) for s in obj.get("shapes", []) for k in ("description", "title") if s.get(k))
                if descriptions:
                    store.full_text(doc, "shape-metadata", {**loc, "part": loc["part"] + "-alt"}, descriptions, {"nativeText": True, "rawLine": line})
            elif typ == "pdf-table":
                text = "\n".join(" | ".join("" if c is None else str(c) for c in row) for row in obj["rows"])
                store.full_text(doc, "table-region", {"page": obj["page"], "range": obj["table"], "part": f"raw-{line}"}, text, {"rawLine": line, "extractionStrategy": obj["strategy"], "geometricCandidateNotRecalculated": True})
            elif typ == "workbook":
                for i, named in enumerate(obj.get("definedNames", [])):
                    store.full_text(doc, "defined-name", {"part": f"raw-{line}-name-{i}"}, f"{named.get('name', '')}: {named.get('value', '')}", {"rawLine": line, "nativeText": True})
    bundles.flush()
    store.flush()
    if dict(stats["rawRecords"]) != doc["rawRecords"]["byType"] or sum(stats["rawRecords"].values()) != doc["rawRecords"]["total"]:
        raise ValueError("Raw coverage count mismatch")
    for sheet in sheet_map.values():
        store.db.execute("INSERT INTO sheets VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (doc["id"], sheet["sheet"], sheet["index"], sheet["state"], sheet["dimension"], sheet["minRow"], sheet["maxRow"], sheet["minCol"], sheet["maxCol"], sheet["explicitCells"], sheet["nonemptyCellsIndexed"], ing.canonical(sheet)))
        public = {k: v for k, v in sheet.items() if k != "metadata"}
        public["indexCoverage"] = "complete-all-nonempty-cells-and-formulas-no-sampling"
        public["cellStoreCoverage"] = "every-explicit-cell-including-styled-empty"
        stats["sheets"].append(public)
    return stats


def source_audit(root, doc, coverage):
    """Independent OOXML cell/count audit; inventory embedded objects, never execute."""
    original = protected_file(root, doc["originalFile"], "originals")
    result = {"sha256Verified": ing.sha_file(original) == doc["sha256"], "media": [], "embeddedObjects": [], "charts": [], "externalRelationships": [], "limitations": []}
    if not result["sha256Verified"]:
        raise ValueError("Original integrity mismatch")
    if doc["kind"] == "pdf":
        import pymupdf as fitz
        with fitz.open(original) as pdf:
            result.update(pages=pdf.page_count, embeddedFileCount=pdf.embfile_count(), annotations=sum(sum(1 for _ in p.annots() or []) for p in pdf))
            seen = set()
            for page_no, page in enumerate(pdf, 1):
                for image in page.get_images(full=True):
                    if image[0] in seen:
                        continue
                    seen.add(image[0])
                    result["media"].append({"xref": image[0], "maskXref": image[1], "width": image[2], "height": image[3], "firstPage": page_no})
            if pdf.embfile_count():
                result["limitations"].append("PDF attachments preserved in original, not recursively executed/extracted.")
        return result
    with zipfile.ZipFile(original) as archive:
        ing.check_zip(archive)
        names = archive.namelist()
        for name in sorted(names):
            if name.endswith("/"):
                continue
            category = "media" if "/media/" in name else "embeddedObjects" if "/embeddings/" in name else "charts" if "/charts/" in name and name.endswith(".xml") else None
            if category:
                data = archive.read(name)
                result[category].append({"part": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "status": "preserved-in-byte-exact-original-not-executed"})
            if name.endswith(".rels"):
                for rel in ing.xml_part(archive, name):
                    if rel.get("TargetMode") == "External":
                        result["externalRelationships"].append({"part": name, "id": rel.get("Id"), "type": rel.get("Type", "").rsplit("/", 1)[-1], "status": "not-fetched"})
        if doc["kind"] == "xlsx":
            expected = {s["part"]: s for s in coverage["sheets"]}
            worksheet_parts = sorted(n for n in names if re.fullmatch(r"xl/worksheets/[^/]+\.xml", n))
            result["orphanWorksheetParts"] = [n for n in worksheet_parts if n not in expected]
            result["worksheetParts"] = len(worksheet_parts)
            result["sheetCellAudit"] = []
            for part, sheet in expected.items():
                cells, formulas = 0, Counter()
                with ing.xml_stream(archive, part) as stream:
                    for _, element in ET.iterparse(stream, events=("end",)):
                        tag = ing.local_name(element.tag)
                        if tag == "c":
                            cells += 1
                            f, v = element.find(f"{{{ing.S}}}f"), element.find(f"{{{ing.S}}}v")
                            if f is not None:
                                formulas["missing" if v is None else "empty" if not v.text else "present"] += 1
                            element.clear()
                        elif tag == "row":
                            element.clear()
                ok = cells == sheet["explicitCells"] and formulas == sheet["formulaCaches"]
                if not ok:
                    raise ValueError("Independent worksheet cell/cache audit failed")
                result["sheetCellAudit"].append({"sheet": sheet["sheet"], "sourceExplicitCells": cells, "formulaCaches": formulas, "matchesSQLite": ok})
            if result["orphanWorksheetParts"]:
                result["limitations"].append("Unassociated worksheet parts are preserved in the original but not indexed by the base extractor.")
        else:
            result["slideParts"] = sum(bool(re.fullmatch(r"ppt/slides/slide\d+\.xml", n)) for n in names)
            result["notesParts"] = sum(bool(re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", n)) for n in names)
            if result["slideParts"] != len(coverage["slides"]) or result["notesParts"] != len(coverage["notes"]):
                raise ValueError("Presentation slide/notes part coverage mismatch")
        if result["embeddedObjects"]:
            result["limitations"].append("Embedded OLE/binary objects inventoried and hashed, not executed or recursively interpreted; visible slide appearance is covered by preview/OCR when available.")
        if result["charts"]:
            result["limitations"].append("Native chart packages preserved; no chart formula execution or semantic graphic interpretation.")
    return result


def perform_ocr(store, root, index, skip=False, language="eng"):
    result = {"requested": not skip, "language": language, "engine": "tesseract", "items": [], "preview": {}, "limitations": ["OCR is machine transcription, not manually verified source text; low-confidence words are retained and labelled.", "Only the configured OCR language is recognized; native text and originals remain authoritative."]}
    executable = shutil.which("tesseract")
    if skip or not executable:
        result["status"] = "skipped-by-request" if skip else "unavailable-tesseract"
        return result
    import pymupdf as fitz
    version = subprocess.run([executable, "--version"], capture_output=True, text=True, timeout=20, check=False)
    result["engineVersion"] = version.stdout.splitlines()[0] if version.stdout else "unreported"
    if any(d["kind"] == "pptx" for d in index["documents"]):
        preview = subprocess.run([sys.executable, "-B", str(Path(__file__).with_name("prepare_source_views.py")), "--corpus", str(root)], capture_output=True, text=True, timeout=240, check=False)
        result["preview"] = {"status": "verified" if preview.returncode == 0 else "failed", "exitCode": preview.returncode, "renderer": "libreoffice"}
        if preview.returncode == 0:
            try:
                result["preview"].update(json.loads(preview.stdout))
            except (ValueError, TypeError):
                pass
        else:
            result["limitations"].append("Presentation preview conversion failed or was refused; slide-render OCR could not be performed.")
    ocr_dir = ing.private_dir(root / "ocr")

    def capture(doc, location, pixmap, source, native=""):
        key = hashlib.sha256(ing.canonical([doc["id"], source, location, VERSION, language]).encode()).hexdigest()
        identity = "ocr-" + key
        folder = ing.private_dir(ocr_dir / doc["id"])
        image = folder / f"{key}.png"
        with ing.atomic_binary(image) as handle:
            handle.write(pixmap.tobytes("png"))
        command = subprocess.run([executable, str(image), "stdout", "-l", language, "--psm", "11", "tsv"], capture_output=True, text=True, timeout=120, check=False)
        tsv_path = folder / f"{key}.tsv"
        with ing.atomic_binary(tsv_path) as handle:
            handle.write(command.stdout.encode("utf-8"))
        words, lines = [], {}
        if command.returncode == 0:
            for word in csv.DictReader(io.StringIO(command.stdout), delimiter="\t", quoting=csv.QUOTE_NONE):
                if word.get("level") != "5" or not word.get("text", "").strip():
                    continue
                key_line = tuple(word[k] for k in ("page_num", "block_num", "par_num", "line_num"))
                lines.setdefault(key_line, []).append(word["text"])
                words.append({"text": word["text"], "confidence": float(word["conf"]), "bbox": [int(word[k]) for k in ("left", "top", "width", "height")]})
        text = "\n".join(" ".join(line) for line in lines.values())
        recognized = {w.casefold() for w in re.findall(r"\w+", text) if len(w) > 2}
        native_tokens = {w.casefold() for w in re.findall(r"\w+", native) if len(w) > 2}
        status = "recognized-unverified" if text else "no-text-recognized" if command.returncode == 0 else "failed"
        item = {"id": identity, "documentId": doc["id"], "location": location, "source": source, "status": status,
                "engine": "tesseract", "engineVersion": result["engineVersion"], "language": language, "psm": 11,
                "characters": len(text), "wordCount": len(words), "lowConfidenceWords": sum(w["confidence"] < 60 for w in words),
                "meanConfidence": sum(w["confidence"] for w in words) / len(words) if words else None,
                "distinctTokensAbsentFromNativeText": len(recognized - native_tokens), "manuallyVerified": False,
                "raster": str(image.relative_to(root)), "rasterSha256": ing.sha_file(image), "rasterPixels": [pixmap.width, pixmap.height],
                "tsv": str(tsv_path.relative_to(root)), "tsvSha256": ing.sha_file(tsv_path), "exitCode": command.returncode}
        ing.write_json(folder / f"{key}.json", {**item, "text": text, "words": words})
        store.db.execute("INSERT INTO ocr VALUES(?,?,?,?,?,?,?,?)", (identity, doc["id"], location.get("page"), location.get("slide"), location.get("part"), status, text, ing.canonical(item)))
        if text:
            store.full_text(doc, "ocr-text", {**location, "part": identity}, text, {"ocr": True, "manuallyVerified": False, "nativeText": False, "sourceRole": source,
                "ocrRecordId": identity, "confidence": item["meanConfidence"], "rawSelector": {"ocrRecordId": identity, "serverSideOnly": True}}, layer="ocr")
        result["items"].append(item)

    for doc in index["documents"]:
        original = protected_file(root, doc["originalFile"], "originals")
        if doc["kind"] in ("pdf", "pptx"):
            rendered = original if doc["kind"] == "pdf" else root / "views" / f"{doc['id']}.pdf"
            valid_preview = doc["kind"] == "pdf" or result["preview"].get("status") == "verified"
            if valid_preview and rendered.is_file():
                with fitz.open(rendered) as pdf:
                    if pdf.page_count != doc["coverage"]["pages" if doc["kind"] == "pdf" else "slides"]:
                        raise ValueError("OCR preview page count mismatch")
                    for number, page in enumerate(pdf, 1):
                        loc = {"page" if doc["kind"] == "pdf" else "slide": number}
                        capture(doc, loc, page.get_pixmap(dpi=200, alpha=False), "original-pdf-page-render" if doc["kind"] == "pdf" else "libreoffice-slide-render", page.get_text())
                    if doc["kind"] == "pdf":
                        seen = set()
                        for number, page in enumerate(pdf, 1):
                            for image in page.get_images(full=True):
                                if image[0] in seen:
                                    continue
                                seen.add(image[0])
                                try:
                                    pix = fitz.Pixmap(pdf, image[0])
                                    if pix.n - pix.alpha > 3:
                                        pix = fitz.Pixmap(fitz.csRGB, pix)
                                    if pix.alpha:
                                        pix = fitz.Pixmap(pix, 0)
                                    capture(doc, {"page": number, "part": f"image-xref-{image[0]}"}, pix, "original-pdf-image")
                                except (RuntimeError, ValueError) as error:
                                    result["items"].append({"documentId": doc["id"], "part": f"image-xref-{image[0]}", "status": "unavailable", "errorType": type(error).__name__})
        if doc["kind"] in ("pptx", "xlsx"):
            with zipfile.ZipFile(original) as archive:
                # Map each presentation media asset to its actual slide(s), not ZIP order.
                media_locations = {}
                if doc["kind"] == "pptx":
                    rows = store.db.execute("SELECT slide,json FROM records WHERE document_id=? AND record_type='slide'", (doc["id"],))
                    for slide, raw in rows:
                        for relation in json.loads(raw).get("relationships", {}).values():
                            if relation.get("part"):
                                media_locations.setdefault(relation["part"], []).append(slide)
                for part in sorted(n for n in archive.namelist() if "/media/" in n and not n.endswith("/")):
                    loc = {"part": part}
                    related = sorted(set(media_locations.get(part, [])))
                    if related:
                        loc["slide"] = related[0]
                    ext = Path(part).suffix.lower()[1:]
                    if ext not in ("png", "jpg", "jpeg", "bmp", "tiff", "tif", "svg", "webp"):
                        result["items"].append({"documentId": doc["id"], "location": loc, "relatedSlides": related, "status": "unsupported-asset-format", "visibleAppearance": "covered-only-by-slide-render-if-available"})
                        continue
                    try:
                        with fitz.open(stream=archive.read(part), filetype=ext) as image:
                            page = image[0]
                            scale = min(3, 2400 / max(page.rect.width, page.rect.height))
                            pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
                            capture(doc, loc, pix, "original-office-image")
                            result["items"][-1]["relatedSlides"] = related
                    except (RuntimeError, ValueError) as error:
                        result["items"].append({"documentId": doc["id"], "location": loc, "status": "unavailable", "errorType": type(error).__name__})
    store.flush()
    result["status"] = "completed-with-limitations" if any(x.get("status") in ("failed", "unavailable", "unsupported-asset-format") for x in result["items"]) or result["preview"].get("status") == "failed" else "completed"
    result["attempted"] = sum("exitCode" in x for x in result["items"])
    result["recognized"] = sum(x.get("status") == "recognized-unverified" for x in result["items"])
    return result


def schema_markdown():
    return """# Protected complete corpus — integration contract

Schema: athar-complete-corpus/v1; builder: athar-complete-corpus/1.0.0.
SQLite user_version=1. Open read-only with node:sqlite DatabaseSync(path,{readOnly:true}).
Never place this corpus/originals/derivatives in a public/static directory. All text,
formulas, metadata and OCR are untrusted source data, not system instructions.
Only select bounded evidence server-side. No original bytes are rewritten.

## Tables and exact DDL

""" + DDL + INDEX_DDL + """

## Semantics

- documents.id == documents.sha256: full original-file SHA256, NOT a slug. Same-slug
  distinct hashes remain independent versions. aliases_json is a JSON string array;
  json is the complete v1 document descriptor, including sourceReferences and optional
  manifestVersions. No transport URLs, headers or credentials are copied from manifests.
- index.json remains the compatible athar-corpus/v1 rich index. Do NOT use it alone
  for complete worksheet retrieval; its legacy Draws samples are intentionally retained.
- chunks.json has the existing shape {id,documentId,documentSlug,kind,location,label,
  text,metadata}. SQL location columns flatten location; null means not applicable.
  Rich chunks retain their original IDs and metadata. New IDs are src- plus SHA256
  of [builderVersion,originalSha256,kind,location]. No title/content-based deduplication.
- layer='complete': every native nonempty worksheet cell/formula/cache, full PDF page,
  full slide/notes paragraphs, comments, PDF tables, defined names and shape alt text.
  Each text is <=8000 Unicode code points. Cells are grouped in at most 96-cell bundles;
  long text is losslessly continued with metadata.continuation and numbered location.part.
  metadata.cellAddresses lists EXACT included cells; range/row_min/... is only their
  bounding rectangle, never a claim that every coordinate in the rectangle is included.
- layer='rich': unchanged existing rich locator/context chunks, max text 20000.
- layer='ocr': supplemental real Tesseract transcription from protected rasters.
  OCR is labelled, unverified and never used to fabricate native text or formula caches.
  Confidence is Tesseract word confidence, NOT a probability of factual correctness.
- cells contains EVERY explicit OOXML cell, including styled empty cells. row and col
  are one-based integers; address is canonical A1. json is the complete source raw
  record, retaining rawValue, valueType, cache.state/lexeme, style/numberFormat,
  formula text/reconstruction/anchor and provenance. Missing and empty caches stay
  null/missing-formula-cache, not zero. No formula is run. No absent coordinate is
  synthesized; merged ranges and dimension/columns are in sheets.json.metadata.
- records contains every NON-cell raw JSONL record. line/raw_line are original one-based
  gzip JSONL line numbers. Full PDF words/blocks, slide sourceXML/paragraphs/shapes,
  styles, rows, comments, table/sheet metadata and notes can be fetched without gunzip.
- sheets.json contains audited bounds/counts plus the full base sheet metadata.
- ocr.json contains provenance/proof paths/hashes/counts, while ocr.text is full OCR text.
  OCR rasters, TSV with word boxes/confidences and JSON are protected under ocr/.
  PPTX previews are actual LibreOffice PDFs under views/, with source/preview hashes.
- meta.value values are JSON. sourceIndexSha256 binds this DB to compatible index.json.
  counts and completeCoverage are machine-readable. coverage.json contains independent
  source/SQLite cell-count/cache-state comparisons, asset inventory and OCR limitations.
- FTS5 is an EXTERNAL-CONTENT index over chunks.text, joined on chunks.rowid. This DB is
  immutable after build, so no update triggers are necessary. To change it, rebuild.
  FTS tokenization is unicode61: punctuation/decimal separators are token separators.
  Use cells for exact numeric/address/range lookup, not FTS numeric comparisons.

## Parameterized viewer and retrieval queries

SELECT json FROM cells WHERE document_id=? AND sheet=? AND address=?;
SELECT address,row,col,json FROM cells
 WHERE document_id=? AND sheet=? AND row BETWEEN ? AND ? AND col BETWEEN ? AND ?
 ORDER BY row,col LIMIT ?;
SELECT json FROM records WHERE document_id=? AND record_type='pdf-page' AND page=?;
SELECT json FROM records WHERE document_id=? AND record_type='slide' AND slide=?;
SELECT c.json,bm25(chunks_fts) AS rank FROM chunks_fts
 JOIN chunks c ON c.rowid=chunks_fts.rowid
 WHERE chunks_fts MATCH ? AND c.document_id=? ORDER BY rank LIMIT ?;
SELECT json FROM chunks WHERE id=?;

Bound LIMIT/range/response bytes on the server, validate document access BEFORE querying,
parameterize all values, escape FTS terms separately from SQL, and preserve formula/OCR
provenance in citations. Do not blindly append unbounded cells/ocr.text/records to prompts.

## Remaining limitations

OCR may misread numbers or omit visual labels; supported OCR language defaults to eng.
Embedded OLE/binary payloads are inventoried/hashes retained, never executed; visible
appearances are rendered/OCRed where possible. Vector/diagram semantics are not inferred.
Caches remain exactly as saved; freshness and Excel-rendered calculation are unverified.
"""


def build(input_dir, output_dir, manifest_path=None, reuse_corpus=None, skip_ocr=False, language="eng"):
    input_dir = ing.no_symlinks(input_dir)
    if not input_dir.is_dir():
        raise ValueError("Input directory not found")
    root = ing.protected_root(output_dir, input_dir)
    ing.no_symlinks(root / "corpus.sqlite")
    index, files, reused, ignored = prepare_base(input_dir, root, manifest_path, reuse_corpus)
    descriptor, temporary = tempfile.mkstemp(prefix=".corpus-", suffix=".sqlite", dir=root)
    os.fchmod(descriptor, 0o600)
    os.close(descriptor)
    db = sqlite3.connect(temporary)
    try:
        db.executescript("PRAGMA foreign_keys=ON; PRAGMA journal_mode=DELETE; PRAGMA synchronous=NORMAL; PRAGMA temp_store=MEMORY; PRAGMA cache_size=-32768; PRAGMA user_version=1;" + DDL)
        store = Store(db)
        for doc in index["documents"]:
            db.execute("INSERT INTO documents VALUES(?,?,?,?,?,?,?,?,?)", (doc["id"], doc["sha256"], doc["slug"], doc["kind"], doc["title"], ing.canonical(doc["aliases"]), doc["originalFile"], doc["rawFile"], ing.canonical(doc)))
        for chunk in index["chunks"]:
            store.chunk(chunk, "rich")
        store.flush()
        docs = []
        for doc in index["documents"]:
            coverage = stream_document(store, root, doc)
            coverage["sourceAudit"] = source_audit(root, doc, coverage)
            docs.append(coverage)
            db.commit()
        ocr = perform_ocr(store, root, index, skip_ocr, language)
        db.commit()
        db.executescript(INDEX_DDL)
        totals = {name: db.execute(f"SELECT count(*) FROM {name}").fetchone()[0] for name in ("documents", "cells", "records", "chunks", "sheets", "ocr")}
        totals.update({"richChunks": len(index["chunks"]), "completeChunks": store.counts["completeChunks"], "ocrChunks": store.counts["ocrChunks"],
                       "nonemptyCellsIndexed": sum(d["nonemptyCellsIndexed"] for d in docs), "pages": sum(len(d["pages"]) for d in docs), "slides": sum(len(d["slides"]) for d in docs), "notes": sum(len(d["notes"]) for d in docs)})
        formula_states = Counter()
        for d in docs:
            formula_states.update(d["formulaCaches"])
        totals["formulaCaches"] = dict(formula_states)
        if totals["cells"] != sum(d["explicitCellsStored"] for d in docs):
            raise ValueError("SQLite cell count mismatch")
        fk = db.execute("PRAGMA foreign_key_check").fetchall()
        integrity = db.execute("PRAGMA quick_check").fetchone()[0]
        db.execute("INSERT INTO chunks_fts(chunks_fts,rank) VALUES('integrity-check',1)")
        if fk or integrity != "ok":
            raise ValueError("SQLite integrity check failed")
        summary = {"schemaVersion": SCHEMA_VERSION, "builderVersion": VERSION, "createdAt": now(), "inputFiles": len(files),
                   "duplicatesCollapsed": len(files) - len(index["documents"]), "ignoredFiles": ignored,
                   "reusedBaseExtraction": reused, "sourceIndexSchema": index["schemaVersion"], "sourceIndexSha256": ing.sha_file(root / "index.json"),
                   "deduplication": "same-complete-file-SHA256-only", "counts": totals, "documents": docs, "ocr": ocr,
                   "checks": {"allRawCountsMatch": True, "allExplicitCellsStored": True, "allNonemptyCellsIndexed": True, "nativeChunkSampling": False, "sqliteQuickCheck": integrity, "ftsIntegrityCheck": "ok", "foreignKeyCheck": "ok"},
                   "limitations": ["Formula cache freshness is unverified; absent/empty caches were not filled or recalculated.", "Legacy index.json Draws chunks are sampled; complete retrieval must use corpus.sqlite.", "OCR and embedded-object limitations are documented per source; OCR is never source-verified financial data."]}
        for key, value in (("schemaVersion", SCHEMA_VERSION), ("builderVersion", VERSION), ("sourceIndexSha256", summary["sourceIndexSha256"]), ("counts", totals), ("completeCoverage", summary["checks"]), ("maxCompleteChunkText", MAX_TEXT), ("maxCellsPerChunk", MAX_CELLS)):
            db.execute("INSERT INTO meta VALUES(?,?)", (key, ing.canonical(value)))
        db.commit()
        db.execute("ANALYZE")
        db.commit()
        # Rehash every actual input AND immutable original after extraction/OCR.
        for item in files:
            if ing.sha_file(protected_file(input_dir, item["file"])) != item["sha256"]:
                raise ValueError("Input changed during build")
        for doc in index["documents"]:
            if ing.sha_file(protected_file(root, doc["originalFile"], "originals")) != doc["sha256"]:
                raise ValueError("Original changed during build")
        db.close()
        with open(temporary, "rb") as handle:
            os.fsync(handle.fileno())
        os.replace(temporary, root / "corpus.sqlite")
        ing.sync_dir(root)
        summary["sqliteBytes"] = (root / "corpus.sqlite").stat().st_size
        summary["sqliteSha256"] = ing.sha_file(root / "corpus.sqlite")
        summary["checks"]["allInputAndOriginalHashesVerifiedAfterBuild"] = True
        index["fullIndex"] = {"schemaVersion": SCHEMA_VERSION, "file": "corpus.sqlite", "sha256": summary["sqliteSha256"],
                              "counts": totals, "baseIndexSha256": summary["sourceIndexSha256"], "complete": True}
        for doc in index["documents"]:
            doc["versionLabel"] = "SHA " + doc["sha256"][:10]
            for sheet in doc["coverage"].get("sheets", []):
                sheet["completeIndexCoverage"] = "all explicit cells stored; all nonempty cells/formulas indexed in SQLite"
                sheet["fullCellIndexCount"] = sheet["cellCount"]
        ing.write_json(root / "index.json", index)
        ing.write_json(root / "coverage.json", summary)
        with ing.atomic_binary(root / "schema.md") as handle:
            handle.write(schema_markdown().encode("utf-8"))
        return summary
    finally:
        with contextlib.suppress(Exception):
            db.close()
        for suffix in ("", "-journal", "-wal", "-shm"):
            with contextlib.suppress(FileNotFoundError):
                Path(temporary + suffix).unlink()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input-dir", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--reuse-corpus", type=Path, help="Reuse only a hash-verified compatible existing extraction")
    parser.add_argument("--skip-ocr", action="store_true", help="Explicitly skip OCR, recording that limitation")
    parser.add_argument("--ocr-language", default="eng")
    args = parser.parse_args(argv)
    old = os.umask(0o077)
    try:
        report = build(args.input_dir, args.output_dir, args.manifest, args.reuse_corpus, args.skip_ocr, args.ocr_language)
        print(ing.canonical({"ok": True, "schemaVersion": SCHEMA_VERSION, "counts": report["counts"], "sqliteBytes": report["sqliteBytes"], "ocrStatus": report["ocr"]["status"]}))
        return 0
    except Exception as error:
        print(ing.canonical({"ok": False, "errorType": type(error).__name__, "message": "Complete corpus build failed; inspect protected inputs/manifest/dependencies. No document text is logged."}), file=sys.stderr)
        return 1
    finally:
        os.umask(old)


if __name__ == "__main__":
    raise SystemExit(main())
