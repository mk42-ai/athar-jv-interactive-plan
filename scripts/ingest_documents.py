#!/usr/bin/env python3
"""Offline, protected source ingestion. Requires Python 3.10+ and PyMuPDF only.

    python3 scripts/ingest_documents.py --input-dir ../.media \
        --output-dir ../.private/athar-corpus [--manifest aliases.json]

A manifest can be a list of {file, sha256?, slug?, title?, aliases?}, an object
with a ``documents`` list, or {"aliases": {"filename or content title": "slug"}}.
Allowed slugs are listed in DOCUMENTS. Names in a manifest are identifiers, not
paths to fetch: only regular files already beneath --input-dir are ingested.
Repeated files/references collapse by their complete SHA256. Different versions
remain separate documents, even when their slugs match. No network, formula
execution, OCR, model calls, document rewriting, or reconciliation is performed.

Protected output contract:
  index.json                          athar-corpus/v1, bounded search chunks
  originals/<sha256>.<ext>             create-once, byte-exact originals
  raw/<sha256>.records.jsonl.gz        all extraction records, including EVERY
                                      XLSX <c>, even styled/empty cells
Raw lines have recordType, documentId and format-specific fields. Cell lines
have sheet/cell, rawValue, value/valueType, cache.state/lexeme, style/numberFormat,
formula/shared-anchor/reconstruction, and explicit value/display provenance.
Workbook/style/shared-string/sheet/row/table metadata are additional raw lines.
Numbers in chunk text use SOURCE LEXEMES, never a rounded float or recalculation.
Missing and empty formula caches are not zero. Excel-rendered appearance and
cache freshness cannot be verified without the original spreadsheet engine.

Each chunk has a deterministic versioned ID, exact source location, bounded text
and records, and an untrusted-data marker. Only dense Draws simulation bodies
are sampled in the index; their coverage range and exact sample locations are
explicit, with rawSelector for a future *server-side* cell accessor. All other
sheet cells/text, all PDF pages/layout rows/detected tables, and all presentation
slides/note parts are indexed. Long text is losslessly continued across chunks.
Raw/original paths are relative to the protected root, never public URLs.

Only index.generatedAt and the optional safe summary timestamp vary on rerun.
The gzip header has mtime=0. Files are mode 0600, directories 0700; all writes
are atomic. Originals are never replaced, including when a name already exists.
Refuse output beneath a repository/static/client tree, symbolic links and DTDs.
Do not point a static server at this directory or add it to version control.
"""
from __future__ import annotations

import argparse
import contextlib
import datetime as dt
import gzip
import hashlib
import io
import json
import math
import os
from pathlib import Path
import posixpath
import re
import shutil
import stat
import sys
import tempfile
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict

SCHEMA_VERSION = "athar-corpus/v1"
EXTRACTOR_VERSION = "athar-protected-ingest/1.0.0"
MAX_TEXT = 20000
MAX_RECORDS = 240
ROWS_PER_CHUNK = 8
COLS_PER_CHUNK = 12
DRAW_BLOCK_ROWS = 1000
MAX_ZIP_BYTES = 3 * 1024 ** 3
S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
P = "http://schemas.openxmlformats.org/presentationml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
DOCUMENTS = {
    "financial-summary": {"kind": "pdf", "title": "Athar JV — Financial Model Executive Summary"},
    # The deck's preferred original is the PPTX. When only the exact PDF rendering of the deck is
    # provisioned (the same 2-page file the presentation viewer shows), it is accepted as an
    # alternate original: slide N is page N, and the limitation is recorded on the document.
    "executive-presentation": {"kind": "pptx", "alternateKinds": ["pdf"], "title": "Athar JV — Executive Presentation"},
    "financial-model": {"kind": "xlsx", "title": "Athar JV — Financial Model"},
    "implementation-plan": {"kind": "xlsx", "title": "Athar JV — Implementation Plan"},
}
ALTERNATE_KIND_LIMITATION = {
    ("executive-presentation", "pdf"): "Ingested from the exact PDF rendering of the executive-summary deck (the file the presentation viewer displays); the original PPTX was not provisioned. Slide N corresponds to page N; speaker notes and shape metadata are unavailable.",
}


def allowed_kinds(slug):
    return [DOCUMENTS[slug]["kind"], *DOCUMENTS[slug].get("alternateKinds", [])]
# Locators, NOT copied source data. Wider context retains adjacent labels/units.
CRITICAL = {
    "financial-model": {
        "Outputs": [("C6:F13", "B5:F13"), ("B43:L48", "B39:L48"), ("B54:C67", "B50:C67")],
        "Control": [("D20:D25", "B17:F25")],
        "Assumptions": [("D118:M118", "B113:M118")],
        "Risk": [("D10", "B6:G10"), ("D14", "B11:G14")],
        "Draws": [("G11", "B6:J14")],
    },
    "implementation-plan": {"Open Items": [("D31:G46", "A28:G46")]},
}
BUILTIN_FORMATS = {
    0: "General", 1: "0", 2: "0.00", 3: "#,##0", 4: "#,##0.00",
    9: "0%", 10: "0.00%", 11: "0.00E+00", 12: "# ?/?", 13: "# ??/??",
    14: "mm-dd-yy", 15: "d-mmm-yy", 16: "d-mmm", 17: "mmm-yy",
    18: "h:mm AM/PM", 19: "h:mm:ss AM/PM", 20: "h:mm", 21: "h:mm:ss",
    22: "m/d/yy h:mm", 37: "#,##0 ;(#,##0)", 38: "#,##0 ;[Red](#,##0)",
    39: "#,##0.00;(#,##0.00)", 40: "#,##0.00;[Red](#,##0.00)",
    45: "mm:ss", 46: "[h]:mm:ss", 47: "mmss.0", 48: "##0.0E+0", 49: "@",
}
DATE_FORMAT_IDS = set(range(14, 23)) | set(range(27, 37)) | set(range(45, 48)) | set(range(50, 59))
UNITS = re.compile(r"\b(?:AED\s*(?:M\b|mn\b|million\b|billions?\b)?|USD\s*(?:M\b|million\b)?|FTE[ -]months?|seats?|weeks?|months?)|%", re.I)
SCENARIOS = re.compile(r"scenario|proprietary|third[ -]party|base case|upside|downside|\bUAE\b|\bGCC\b", re.I)


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def sha_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def no_symlinks(path):
    path = Path(os.path.abspath(path))
    for parent in [path, *path.parents]:
        if parent.is_symlink():
            raise ValueError("Symbolic links are not allowed in protected input/output paths")
    return path


def private_dir(path):
    path = no_symlinks(path)
    missing = []
    current = path
    while not current.exists():
        missing.append(current)
        current = current.parent
    for part in reversed(missing):
        part.mkdir(mode=0o700)
    if not path.is_dir():
        raise ValueError("Protected directory is not a directory")
    os.chmod(path, 0o700)
    return path


def protected_root(path, input_dir):
    path = no_symlinks(path)
    if path == input_dir or path in input_dir.parents or input_dir in path.parents:
        raise ValueError("Input and output directories must not contain each other")
    forbidden = {"public", "static", "dist", "build", "client", "assets", ".git", "node_modules", ".media"}
    if forbidden.intersection(part.lower() for part in path.parts):
        raise ValueError("Corpus output may not be placed in static/client/source directories")
    if any((parent / ".git").exists() for parent in [path, *path.parents]):
        raise ValueError("Corpus output must be outside all version-controlled repositories")
    private_dir(path)
    private_dir(path / "originals")
    private_dir(path / "raw")
    return path


def sync_dir(path):
    descriptor = os.open(path, os.O_RDONLY | getattr(os, "O_DIRECTORY", 0))
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


@contextlib.contextmanager
def atomic_binary(path):
    path = no_symlinks(path)
    private_dir(path.parent)
    if path.exists() and not path.is_file():
        raise ValueError("Artifact destination is not a regular file")
    descriptor, tmp = tempfile.mkstemp(prefix=".writing-", dir=path.parent)
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "wb") as handle:
            yield handle
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(tmp, path)
        sync_dir(path.parent)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def write_json(path, value):
    with atomic_binary(path) as handle:
        handle.write((canonical(value) + "\n").encode("utf-8"))


def immutable_original(source, dest, digest):
    dest = no_symlinks(dest)
    if dest.exists():
        if not dest.is_file() or sha_file(dest) != digest:
            raise ValueError("An immutable original failed integrity validation; refusing replacement")
        os.chmod(dest, 0o600)
        return
    descriptor, tmp = tempfile.mkstemp(prefix=".original-", dir=dest.parent)
    try:
        os.fchmod(descriptor, 0o600)
        with open(source, "rb") as incoming, os.fdopen(descriptor, "wb") as outgoing:
            shutil.copyfileobj(incoming, outgoing, 1024 * 1024)
            outgoing.flush()
            os.fsync(outgoing.fileno())
        if sha_file(tmp) != digest:
            raise ValueError("Input changed during ingestion")
        try:
            os.link(tmp, dest, follow_symlinks=False)
        except FileExistsError:
            if dest.is_symlink() or sha_file(dest) != digest:
                raise ValueError("Immutable original collision")
        sync_dir(dest.parent)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


class RawWriter:
    def __init__(self, handle, document_id):
        self.handle, self.document_id = handle, document_id
        self.counts = Counter()
        self.line = 0

    def add(self, record_type, **fields):
        self.line += 1
        self.counts[record_type] += 1
        record = {"recordType": record_type, "documentId": self.document_id, **fields}
        self.handle.write((canonical(record) + "\n").encode("utf-8"))
        return self.line


def source_piece(record):
    """Do not let a very long cell make an unbounded records payload."""
    record = dict(record)
    for key in ("value", "rawValue", "displayValue", "formula", "text", "cells"):
        if key in record and len(canonical(record[key])) > 1800:
            record.pop(key)
            record.setdefault("rawOnlyFields", []).append(key)
    return record


class Chunks:
    def __init__(self, document):
        self.document = document
        self.items = []
        self.used_ids = set()

    def add(self, kind, location, label, text, records=None, metadata=None):
        records = records or []
        metadata = {"trust": "untrusted-source-data", "instructionsAreData": True, **(metadata or {})}
        # Full source text is continued, not silently truncated. Location part is stable.
        text_parts = [text[i:i + MAX_TEXT] for i in range(0, max(1, len(text)), MAX_TEXT)]
        record_parts = [records[i:i + MAX_RECORDS] for i in range(0, max(1, len(records)), MAX_RECORDS)]
        count = max(len(text_parts), len(record_parts))
        for index in range(count):
            loc = dict(location)
            if count > 1:
                loc["part"] = f"{loc.get('part', 'body')}.{index + 1}"
            seed = canonical([EXTRACTOR_VERSION, self.document["sha256"], kind, loc])
            identifier = "src-" + hashlib.sha256(seed.encode()).hexdigest()
            if identifier in self.used_ids:
                raise ValueError("Duplicate chunk location within a document")
            self.used_ids.add(identifier)
            item = {
                "id": identifier, "documentId": self.document["id"],
                "documentSlug": self.document["slug"], "kind": kind,
                "location": loc, "label": label,
                "text": text_parts[index] if index < len(text_parts) else "",
                "metadata": dict(metadata),
            }
            if records:
                item["records"] = [source_piece(r) for r in record_parts[index]] if index < len(record_parts) else []
            if count > 1:
                item["metadata"]["continuation"] = {
                    "part": index + 1, "total": count, "sourceLocation": location,
                    "textOffset": index * MAX_TEXT,
                    "textLength": len(text), "recordsArePartitioned": True,
                }
            self.items.append(item)


def local_name(tag):
    return tag.rsplit("}", 1)[-1]


def xml_part(archive, name):
    with xml_stream(archive, name) as handle:
        return ET.parse(handle).getroot()


class SafeXMLReader:
    """Check the entire streamed XML, not only a prefix of an untrusted part."""
    def __init__(self, handle):
        self.handle = handle
        self.tail = b""

    def read(self, size=-1):
        data = self.handle.read(size)
        checked = self.tail + data
        if re.search(br"<!\s*(?:DOCTYPE|ENTITY)\b", checked, re.I):
            raise ValueError("DTD/entity declarations are prohibited")
        self.tail = checked[-80:]
        return data


@contextlib.contextmanager
def xml_stream(archive, name):
    with archive.open(name) as handle:
        yield SafeXMLReader(handle)


def check_zip(archive):
    info = archive.infolist()
    if len(info) > 100000 or sum(p.file_size for p in info) > MAX_ZIP_BYTES:
        raise ValueError("Office package exceeds safety size limits")
    names = set()
    for part in info:
        name = part.filename
        if name in names or "\\" in name or name.startswith("/") or ".." in name.split("/"):
            raise ValueError("Unsafe or duplicate Office package part")
        if part.flag_bits & 1:
            raise ValueError("Encrypted Office packages are unsupported")
        names.add(name)


def relationship_path(part):
    return posixpath.join(posixpath.dirname(part), "_rels", posixpath.basename(part) + ".rels")


def relationships(archive, part):
    rel_path = relationship_path(part)
    result = {}
    if rel_path not in archive.namelist():
        return result
    for rel in xml_part(archive, rel_path):
        attrs = dict(rel.attrib)
        target = attrs.get("Target", "")
        if attrs.get("TargetMode") != "External":
            resolved = posixpath.normpath(target.lstrip("/") if target.startswith("/") else posixpath.join(posixpath.dirname(part), target))
            if resolved.startswith("../") or resolved.startswith("/"):
                raise ValueError("Relationship points outside its Office package")
            attrs["part"] = resolved
        result[attrs.get("Id", "")] = attrs
    return result


def core_properties(archive):
    if "docProps/core.xml" not in archive.namelist():
        return {}
    return {local_name(node.tag): node.text or "" for node in xml_part(archive, "docProps/core.xml")}


def paragraph_text(paragraph, ns=A):
    bits = []
    for node in paragraph.iter():
        if node.tag == f"{{{ns}}}t":
            bits.append(node.text or "")
        elif node.tag == f"{{{ns}}}br":
            bits.append("\n")
        elif node.tag == f"{{{ns}}}tab":
            bits.append("\t")
    return "".join(bits)


def normal_name(value):
    return re.sub(r"\s+", " ", str(value).replace("_", " ").replace("-", " ").lower()).strip()


def read_manifest(path):
    if path is None:
        return [], {}
    data = json.loads(no_symlinks(path).read_text(encoding="utf-8"))
    entries = data if isinstance(data, list) else data.get("documents", [])
    aliases = {} if isinstance(data, list) else data.get("aliases", {})
    if not isinstance(entries, list) or not isinstance(aliases, dict):
        raise ValueError("Invalid manifest schema")
    for entry in entries:
        if not isinstance(entry, dict):
            raise ValueError("Invalid manifest document entry")
        if entry.get("slug") is not None and entry["slug"] not in DOCUMENTS:
            raise ValueError("Unknown manifest slug")
    if any(slug not in DOCUMENTS for slug in aliases.values()):
        raise ValueError("Unknown manifest alias slug")
    return entries, {normal_name(k): v for k, v in aliases.items()}


def detect_document(path, digest, manifest, aliases):
    ext = path.suffix.lower().lstrip(".")
    matching = []
    for entry in manifest:
        file_value = entry.get("file", entry.get("filename", entry.get("path", "")))
        names = [file_value, *entry.get("aliases", [])]
        named = any(Path(str(name)).name.casefold() == path.name.casefold() for name in names)
        if named and entry.get("sha256") and entry["sha256"].lower() != digest:
            raise ValueError("Manifest SHA256 mismatch")
        if named or entry.get("sha256") == digest:
            matching.append(entry)
    guesses = {entry["slug"] for entry in matching if entry.get("slug")}
    content_title = ""
    sheet_names = set()
    if ext in {"xlsx", "pptx"}:
        with zipfile.ZipFile(path) as archive:
            check_zip(archive)
            content_title = core_properties(archive).get("title", "")
            if ext == "xlsx":
                book = xml_part(archive, "xl/workbook.xml")
                sheet_names = {node.get("name", "") for node in book.findall(f"{{{S}}}sheets/{{{S}}}sheet")}
    elif ext == "pdf":
        import pymupdf as fitz
        with fitz.open(path) as pdf:
            if pdf.needs_pass:
                raise ValueError("Password-protected PDF is unsupported")
            content_title = (pdf.metadata or {}).get("title", "")
            if len(pdf):
                content_title += " " + pdf[0].get_text()[:1500]
    else:
        return None
    candidates = [path.name, path.stem, content_title, *[str(e.get("title", "")) for e in matching]]
    for name in candidates:
        slug = aliases.get(normal_name(name))
        if slug:
            guesses.add(slug)
    if not guesses:
        names = " ".join(normal_name(v) for v in candidates)
        if ext == "xlsx":
            if {"Outputs", "Control", "Assumptions", "Risk"} <= sheet_names or re.search(r"athar.*(?:financial|model)", names):
                guesses.add("financial-model")
            if {"Master Task List", "Open Items"} <= sheet_names or re.search(r"(?:implementation plan|6 month implementation)", names):
                guesses.add("implementation-plan")
        elif ext == "pptx" and "athar" in names and any(term in names for term in ("executive", "slide deck")):
            guesses.add("executive-presentation")
        elif ext == "pdf" and "athar" in names and any(term in names for term in ("financial", "executive summary")):
            guesses.add("financial-summary")
    if len(guesses) != 1:
        raise ValueError("Cannot identify one known document; supply an explicit manifest alias")
    slug = next(iter(guesses))
    if ext not in allowed_kinds(slug):
        raise ValueError("Manifest slug does not match document format")
    titles = {entry["title"] for entry in matching if entry.get("title")}
    if len(titles) > 1:
        raise ValueError("Conflicting manifest titles for one source")
    return slug, next(iter(titles), DOCUMENTS[slug]["title"])


def col_number(letters):
    number = 0
    for char in letters.upper().replace("$", ""):
        number = number * 26 + ord(char) - 64
    return number


def col_letters(number):
    result = ""
    while number > 0:
        number, digit = divmod(number - 1, 26)
        result = chr(65 + digit) + result
    return result


def cell_xy(ref):
    match = re.fullmatch(r"\$?([A-Za-z]{1,3})\$?([1-9]\d*)", ref)
    if not match:
        raise ValueError("Invalid cell reference")
    return col_number(match[1]), int(match[2])


def range_bounds(ref):
    start, _, end = ref.partition(":")
    c1, r1 = cell_xy(start)
    c2, r2 = cell_xy(end or start)
    return min(c1, c2), min(r1, r2), max(c1, c2), max(r1, r2)


def in_range(cell, ref):
    c1, r1, c2, r2 = range_bounds(ref)
    return c1 <= cell["columnIndex"] <= c2 and r1 <= cell["row"] <= r2


def translate_formula(formula, anchor, target):
    """Conservative relative-A1 translation; never evaluates a formula.

    Quoted strings/sheet names, absolute references, ranges and whole row/column
    ranges are handled. Structured/external refs are explicitly unsupported,
    rather than guessing. Literal source and anchor remain in every raw record.
    """
    if "[" in formula or "]" in formula:
        return None, "unsupported-structured-or-external-reference"
    ac, ar = cell_xy(anchor)
    tc, tr = cell_xy(target)
    dc, dr = tc - ac, tr - ar
    split = re.split(r'("(?:[^"]|"")*"|\'(?:[^\']|\'\')*\'!)', formula)
    cell_pattern = re.compile(r"(?<![\w.])(?P<ca>\$?)(?P<c>[A-Za-z]{1,3})(?P<ra>\$?)(?P<r>[1-9]\d*)(?![\w.]|\s*\(|!)")

    def replace_cell(match):
        c = col_number(match["c"]) + (0 if match["ca"] else dc)
        r = int(match["r"]) + (0 if match["ra"] else dr)
        if not 1 <= c <= 16384 or not 1 <= r <= 1048576:
            return "#REF!"
        return f"{match['ca']}{col_letters(c)}{match['ra']}{r}"

    def replace_columns(match):
        values = []
        for absolute, column in ((match[1], match[2]), (match[3], match[4])):
            value = col_number(column) + (0 if absolute else dc)
            if not 1 <= value <= 16384:
                return "#REF!"
            values.append(absolute + col_letters(value))
        return ":".join(values)

    def replace_rows(match):
        values = []
        for absolute, row in ((match[1], match[2]), (match[3], match[4])):
            value = int(row) + (0 if absolute else dr)
            if not 1 <= value <= 1048576:
                return "#REF!"
            values.append(absolute + str(value))
        return ":".join(values)

    for i in range(0, len(split), 2):
        text = cell_pattern.sub(replace_cell, split[i])
        text = re.sub(r"(?<![\w.$])(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})(?![\w.])", replace_columns, text)
        text = re.sub(r"(?<![\w.$])(\$?)([1-9]\d*):(\$?)([1-9]\d*)(?![\w.])", replace_rows, text)
        split[i] = text
    return "".join(split), "relative-a1"


def read_styles(archive):
    styles, formats = [], dict(BUILTIN_FORMATS)
    raw_xml = ""
    if "xl/styles.xml" not in archive.namelist():
        return [{"numFmtId": "0", "bold": False}], formats, raw_xml
    root = xml_part(archive, "xl/styles.xml")
    raw_xml = ET.tostring(root, encoding="unicode")
    for fmt in root.findall(f"{{{S}}}numFmts/{{{S}}}numFmt"):
        formats[int(fmt.get("numFmtId"))] = fmt.get("formatCode", "")
    fonts = root.findall(f"{{{S}}}fonts/{{{S}}}font")
    for xf in root.findall(f"{{{S}}}cellXfs/{{{S}}}xf"):
        item = dict(xf.attrib)
        font_id = int(xf.get("fontId", "0"))
        bold = fonts[font_id].find(f"{{{S}}}b") if font_id < len(fonts) else None
        item["bold"] = bold is not None and bold.get("val", "1") not in {"0", "false"}
        for child in xf:
            item[local_name(child.tag)] = dict(child.attrib)
        styles.append(item)
    return styles or [{"numFmtId": "0", "bold": False}], formats, raw_xml


def sheet_metadata(archive, part):
    metadata = {"dimension": None, "mergedRanges": [], "columns": [], "autoFilter": None}
    anchors = {}
    with xml_stream(archive, part) as handle:
        for _, element in ET.iterparse(handle, events=("end",)):
            tag = local_name(element.tag)
            if tag == "c":
                formula = element.find(f"{{{S}}}f")
                if formula is not None and formula.get("t") == "shared" and formula.text:
                    anchors[formula.get("si", "")] = {"cell": element.get("r"), "text": formula.text, "ref": formula.get("ref")}
                element.clear()
            elif tag == "row":
                element.clear()
            elif tag == "dimension":
                metadata["dimension"] = element.get("ref")
            elif tag == "mergeCell":
                metadata["mergedRanges"].append(element.get("ref"))
            elif tag == "col":
                metadata["columns"].append(dict(element.attrib))
            elif tag == "autoFilter":
                metadata["autoFilter"] = dict(element.attrib)
    metadata["relationships"] = relationships(archive, part)
    metadata["tables"] = []
    for rel in metadata["relationships"].values():
        if rel.get("Type", "").endswith("/table") and "part" in rel:
            root = xml_part(archive, rel["part"])
            metadata["tables"].append({
                **root.attrib, "part": rel["part"],
                "columns": [dict(node.attrib) for node in root.findall(f"{{{S}}}tableColumns/{{{S}}}tableColumn")],
                "sourceXML": ET.tostring(root, encoding="unicode"),
            })
    return metadata, anchors


def numeric_value(lexeme):
    try:
        if re.fullmatch(r"[+-]?\d+", lexeme):
            return int(lexeme), "number"
        number = float(lexeme)
        if math.isfinite(number):
            return number, "number"
    except (ValueError, OverflowError):
        pass
    return lexeme, "unparsed-number"


def date_derived(value, fmt_id, fmt_code, date1904):
    stripped = re.sub(r'"[^"]*"|\\.|\[[^\]]*\]', "", fmt_code).lower()
    if fmt_id not in DATE_FORMAT_IDS and not re.search(r"[dy]|h.*m|m.*s", stripped):
        return None
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        return None
    # Excel's fictional 1900-02-29 must not be silently corrected.
    if not date1904 and 60 <= value < 61:
        return "1900-02-29 (Excel fictitious leap day)"
    try:
        base = dt.datetime(1904, 1, 1) if date1904 else dt.datetime(1899, 12, 31)
        adjusted = value if date1904 or value < 60 else value - 1
        date = base + dt.timedelta(days=adjusted)
        return date.isoformat(timespec="seconds") if value % 1 else date.date().isoformat()
    except (OverflowError, ValueError):
        return None


def parse_cell(element, sheet, row_number, fallback_column, strings, styles, formats, anchors, date1904):
    ref = element.get("r", f"{col_letters(fallback_column)}{row_number}")
    column, row = cell_xy(ref)
    source_type = element.get("t", "n")
    v = element.find(f"{{{S}}}v")
    f = element.find(f"{{{S}}}f")
    lexeme = v.text if v is not None else None
    style_id = int(element.get("s", "0"))
    style = styles[style_id] if style_id < len(styles) else {"numFmtId": "0", "unresolvedStyleId": style_id}
    fmt_id = int(style.get("numFmtId", "0"))
    fmt = formats.get(fmt_id, f"[unresolved builtin format {fmt_id}]")
    formula = None
    if f is not None:
        formula = {"type": f.get("t", "normal"), "text": f.text, "attributes": dict(f.attrib), "reconstruction": "source"}
        if f.get("t") == "shared":
            index = f.get("si", "")
            anchor = anchors.get(index)
            formula["sharedIndex"] = index
            formula["anchor"] = anchor["cell"] if anchor else None
            formula["anchorFormula"] = anchor["text"] if anchor else None
            formula["anchorRange"] = anchor.get("ref") if anchor else None
            if not f.text and anchor:
                formula["reconstructed"], formula["reconstruction"] = translate_formula(anchor["text"], anchor["cell"], ref)
            elif not f.text:
                formula["reconstruction"] = "unresolved-shared-anchor"
        elif not f.text:
            formula["reconstruction"] = "source-has-no-formula-text"
    cache_state = ("missing" if v is None else "empty" if lexeme is None or lexeme == "" else "present") if formula else "not-applicable"
    value, value_type = None, "blank"
    if source_type == "inlineStr":
        inline = element.find(f"{{{S}}}is")
        value = "".join(node.text or "" for node in inline.iter(f"{{{S}}}t")) if inline is not None else ""
        value_type = "string"
    elif lexeme is not None:
        if source_type == "s":
            try:
                value, value_type = strings[int(lexeme)], "string"
            except (ValueError, IndexError):
                value, value_type = lexeme, "unresolved-shared-string"
        elif source_type == "b":
            value, value_type = (lexeme == "1"), "boolean"
        elif source_type in {"str", "e", "d"}:
            value, value_type = lexeme, {"str": "string", "e": "error", "d": "date"}[source_type]
        else:
            value, value_type = numeric_value(lexeme)
    if formula and cache_state in {"missing", "empty"}:
        value, value_type = None, "missing-formula-cache"
    derived_date = date_derived(value, fmt_id, fmt, date1904) if value_type == "number" else None
    display = str(value) if value_type in {"string", "date", "error"} else derived_date
    record = {
        "sheet": sheet, "cell": ref, "row": row, "column": col_letters(column), "columnIndex": column,
        "sourceType": source_type, "sourceAttributes": dict(element.attrib),
        "rawValue": lexeme, "value": value, "valueType": value_type,
        "cache": {"state": cache_state, "lexeme": lexeme if formula else None},
        "styleId": style_id, "style": style,
        "numberFormat": {"id": fmt_id, "code": fmt},
        "formula": formula, "displayValue": display,
        "provenance": {
            "value": "missing-formula-cache" if value_type == "missing-formula-cache" else "cached-formula-result" if formula else "source-literal",
            "calculation": "not-evaluated", "cacheFreshness": "unknown" if formula else "not-applicable",
            "display": "format-derived-ISO-date-not-Excel-rendering" if derived_date else "source-text" if display is not None else "not-rendered-source-lexeme-retained",
        },
    }
    inline = element.find(f"{{{S}}}is")
    if inline is not None:
        record["inlineStringXML"] = ET.tostring(inline, encoding="unicode")
    return record


def meaningful(cell):
    return cell["valueType"] != "blank" or cell.get("formula") is not None


def exact_cell_text(cell):
    if cell["valueType"] == "missing-formula-cache":
        formula = cell.get("formula") or {}
        expression = formula.get("text") or formula.get("reconstructed") or "[formula text unavailable; see shared anchor]"
        return f"{cell['cell']}=[{cell['cache']['state']} formula cache; NOT zero] formula: {expression}"
    if cell["valueType"] in {"string", "date", "error", "unresolved-shared-string"}:
        value = str(cell["value"])
    elif cell["valueType"] == "blank":
        value = "[explicit empty cell]"
    else:
        value = cell["rawValue"] if cell["rawValue"] is not None else str(cell["value"])
    suffix = ""
    if cell.get("formula"):
        suffix += " [cached formula result; freshness unverified]"
    if cell.get("displayValue") and cell["valueType"] == "number":
        suffix += f" [format-derived ISO date: {cell['displayValue']}]"
    return f"{cell['cell']}={value}{suffix}"


def compact_cell(cell, role="body"):
    keys = ("sheet", "cell", "row", "column", "columnIndex", "value", "valueType", "rawValue", "cache", "styleId", "numberFormat", "displayValue", "provenance")
    result = {key: cell[key] for key in keys}
    result["role"] = role
    if cell.get("formula"):
        formula = cell["formula"]
        result["formula"] = {key: formula[key] for key in ("type", "text", "sharedIndex", "anchor", "anchorRange", "reconstructed", "reconstruction") if key in formula}
    return result


def row_is_header(cells, table_header_rows):
    if not cells:
        return False
    if cells[0]["row"] in table_header_rows:
        return True
    values = [cell for cell in cells if meaningful(cell)]
    strings = [cell for cell in values if cell["valueType"] == "string"]
    years = [cell for cell in values if cell["valueType"] == "number" and isinstance(cell["value"], int) and 2020 <= cell["value"] <= 2050]
    time_labels = [cell for cell in strings if re.fullmatch(r"(?:Y(?:ear)?\s*\d+|FY\s*\d+|Q[1-4].*|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[ -]?\d{2,4})", cell["value"], re.I)]
    bold_strings = [cell for cell in strings if cell["style"].get("bold")]
    return bool(len(years) >= 2 or len(time_labels) >= 2 or (len(strings) >= 2 and len(bold_strings) >= max(2, len(values) * 0.7)))


def evidence_metadata(cells):
    headers, units, scenarios = [], [], []
    for cell in cells:
        if cell["valueType"] == "string":
            text = cell["value"]
            if UNITS.search(text):
                units.extend({"cell": cell["cell"], "text": match.group(0)} for match in UNITS.finditer(text))
            if SCENARIOS.search(text):
                scenarios.append({"cell": cell["cell"], "text": text[:1000], "continuedInRaw": len(text) > 1000})
    return {"units": units[:80], "scenario": scenarios[:40]}


def emit_sheet_bundle(chunks, sheet, selected, context, location, part, extra=None):
    context_map = {cell["cell"]: cell for cell in context}
    # Selected source cells are ALWAYS emitted, even if also repeated as context.
    # Truncating bounded context must never omit long headers or body records.
    body = list(selected)
    context = sorted(context_map.values(), key=lambda cell: (cell["row"], cell["columnIndex"]))
    # Bound repeated header/context cells. Any remaining source cells still occur
    # in ordinary complete sheet chunks and in the full raw record stream.
    context = context[:56]
    records_context = [compact_cell(cell, "header" if cell["row"] < min((c["row"] for c in selected), default=10**9) else "row-label") for cell in context]
    context_text = "\n".join(exact_cell_text(cell) for cell in context)
    context_text = context_text[:6000]
    records_limit = MAX_RECORDS - len(records_context)
    packs, pack, text_size = [], [], 0
    for cell in body:
        line_len = len(exact_cell_text(cell)) + 1
        if pack and (len(pack) >= records_limit or text_size + line_len > 10000):
            packs.append(pack)
            pack, text_size = [], 0
        pack.append(cell)
        text_size += line_len
    if pack or not packs:
        packs.append(pack)
    for i, pack in enumerate(packs):
        relevant = context + pack
        metadata = {
            "headers": [{"cell": cell["cell"], "text": exact_cell_text(cell)[:800]} for cell in context],
            "mergedLabelAnchorsRetained": True,
            "rawSelector": {"documentId": chunks.document["id"], "file": chunks.document["rawFile"], "sheet": sheet, "range": location["range"], "recordType": "cell", "serverSideOnly": True},
            **evidence_metadata(relevant), **(extra or {}),
        }
        text = f"Sheet: {sheet}; source range: {location['range']}\n"
        if context_text:
            text += "Source headers / adjacent labels (cell-addressed):\n" + context_text + "\n"
        text += "Source records (numeric lexemes unchanged):\n" + "\n".join(exact_cell_text(cell) for cell in pack)
        loc = {"sheet": sheet, **location, "part": f"{part}-{i + 1}"}
        chunks.add("table-region" if extra and extra.get("criticalLocator") else "sheet-rows", loc,
                   f"{sheet} • {location['range']}", text,
                   records_context + [compact_cell(cell) for cell in pack], metadata)


def index_sheet(chunks, sheet, rows, metadata, critical, dense=None):
    if not rows:
        return
    table_headers = {range_bounds(t["ref"])[1] for t in metadata["tables"] if t.get("ref") and t.get("headerRowCount", "1") != "0"}
    meaningful_rows = {number: cells for number, cells in rows.items() if any(meaningful(cell) for cell in cells)}
    header_rows = [number for number, cells in meaningful_rows.items() if row_is_header(cells, table_headers)]
    titles = [number for number, cells in meaningful_rows.items() if 0 < sum(meaningful(c) for c in cells) <= 2 and any(c["valueType"] == "string" for c in cells)]
    first_context = list(meaningful_rows)[:2]
    sorted_numbers = sorted(rows)
    groups, group = [], []
    for number in sorted_numbers:
        if group and (len(group) >= ROWS_PER_CHUNK or number > group[-1] + 1 or number in header_rows or number in titles):
            groups.append(group)
            group = []
        group.append(number)
    if group:
        groups.append(group)
    for group in groups:
        body = [cell for number in group for cell in rows[number]]
        if not body:
            continue
        min_col, max_col = min(c["columnIndex"] for c in body), max(c["columnIndex"] for c in body)
        before_headers = [n for n in header_rows if n <= group[0]][-2:]
        before_titles = [n for n in titles if n <= group[0]][-1:]
        context_rows = set(first_context + before_headers + before_titles)
        for left in range(min_col, max_col + 1, COLS_PER_CHUNK):
            right = min(max_col, left + COLS_PER_CHUNK - 1)
            selected = [c for c in body if left <= c["columnIndex"] <= right]
            if not selected:
                continue
            # Repeat up to the first three source label columns, even when the
            # numeric band is far to the right (e.g. monthly models).
            labels = [c for c in body if c["columnIndex"] < left and c["columnIndex"] <= min_col + 2 and meaningful(c)]
            context = [c for number in sorted(context_rows) for c in rows.get(number, []) if meaningful(c) and (left <= c["columnIndex"] <= right or c["columnIndex"] <= min_col + 2)]
            context += labels
            ref = f"{col_letters(left)}{group[0]}:{col_letters(right)}{group[-1]}"
            emit_sheet_bundle(chunks, sheet, selected, context, {"range": ref}, "complete", {"indexCoverage": "complete", "repeatedLabelColumns": True})
    all_cells = [cell for cells in rows.values() for cell in cells]
    for requested, context_ref in critical:
        selected = [c for c in all_cells if in_range(c, requested)]
        if not selected:
            continue
        context = [c for c in all_cells if in_range(c, context_ref) and not in_range(c, requested) and meaningful(c)]
        # Only context is repeated/truncated, never the requested critical cells.
        emit_sheet_bundle(chunks, sheet, selected, context, {"range": requested}, "critical",
                          {"criticalLocator": True, "contextRanges": [context_ref], "indexCoverage": "complete"})
    for region in dense or []:
        block_start, block_end = region["start"], region["end"]
        samples = [cell for row in sorted(region["rows"]) for cell in region["rows"][row]]
        if not samples:
            continue
        min_col, max_col = region["minCol"], region["maxCol"]
        ref = f"{col_letters(min_col)}{block_start}:{col_letters(max_col)}{block_end}"
        sample_ranges = [f"{col_letters(min_col)}{r}:{col_letters(max_col)}{r}" for r in sorted(region["rows"])]
        context_numbers = [n for n in sorted(rows) if n < block_start][-4:]
        for left in range(min_col, max_col + 1, COLS_PER_CHUNK):
            right = min(max_col, left + COLS_PER_CHUNK - 1)
            selected = [c for c in samples if left <= c["columnIndex"] <= right]
            context = [c for n in context_numbers for c in rows[n] if meaningful(c) and (left <= c["columnIndex"] <= right or c["columnIndex"] <= min_col + 2)]
            emit_sheet_bundle(chunks, sheet, selected, context, {"range": ref}, f"sample-cols-{left}-{right}", {
                "indexCoverage": "deterministic-sample-only", "rawCoverage": "all-source-cells",
                "sampleRanges": sample_ranges, "sampleColumnRange": f"{col_letters(left)}:{col_letters(right)}",
                "samplingRule": "first, middle and last source rows per 1000-row block; no generated distribution statistics",
                "denseNumericBlock": True, "sourceCellCount": region["cellCount"],
                "retrievalNotice": "Index samples are not the full simulation. Retrieve requested exact cells/ranges from protected raw records; do not infer statistics from samples.",
            })


def extract_xlsx(path, document, raw, chunks):
    coverage = {"pages": 0, "slides": 0, "notes": 0, "sheets": [], "cellCount": 0, "formulaCount": 0, "missingFormulaCaches": 0}
    limitations = ["Formulas were not recalculated; stored cache freshness and Excel-rendered formatting are unverified. Source cache lexemes and styles are preserved.", "No OCR or execution of images, charts, macros, OLE objects or external relationships was performed."]
    with zipfile.ZipFile(path) as archive:
        check_zip(archive)
        wb = xml_part(archive, "xl/workbook.xml")
        book_rels = relationships(archive, "xl/workbook.xml")
        wbpr = wb.find(f"{{{S}}}workbookPr")
        date1904 = wbpr is not None and wbpr.get("date1904", "0") in {"1", "true"}
        calc = wb.find(f"{{{S}}}calcPr")
        styles, formats, styles_xml = read_styles(archive)
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            with xml_stream(archive, "xl/sharedStrings.xml") as handle:
                for _, element in ET.iterparse(handle, events=("end",)):
                    if local_name(element.tag) == "si":
                        text = "".join(node.text or "" for node in element.iter(f"{{{S}}}t"))
                        raw.add("shared-string", index=len(strings), text=text, sourceXML=ET.tostring(element, encoding="unicode"))
                        strings.append(text)
                        element.clear()
        raw.add("workbook", properties=core_properties(archive), date1904=date1904,
                calculationProperties=dict(calc.attrib) if calc is not None else {},
                definedNames=[{**n.attrib, "value": n.text} for n in wb.findall(f"{{{S}}}definedNames/{{{S}}}definedName")],
                relationships=book_rels, sourceXML=ET.tostring(wb, encoding="unicode"))
        raw.add("styles", cellStyles=styles, numberFormats={str(k): v for k, v in formats.items()}, sourceXML=styles_xml)
        special = sorted(name for name in archive.namelist() if any(term in name for term in ("/media/", "/embeddings/", "/charts/", "vbaProject")) and not name.endswith("/"))
        raw.add("uninterpreted-parts", parts=special, reason="Preserved in immutable original; not OCRed, calculated or executed")
        coverage["uninterpretedParts"] = len(special)
        for sheet_index, sheet in enumerate(wb.findall(f"{{{S}}}sheets/{{{S}}}sheet"), 1):
            name = sheet.get("name", "")
            relation = book_rels.get(sheet.get(f"{{{R}}}id"), {})
            part = relation.get("part")
            if not part:
                raise ValueError("Worksheet has no internal package relationship")
            meta, anchors = sheet_metadata(archive, part)
            raw.add("sheet", sheet=name, index=sheet_index, part=part, state=sheet.get("state", "visible"), **meta)
            for table in meta["tables"]:
                raw.add("table", sheet=name, **table)
            dimensions = range_bounds(meta["dimension"]) if meta["dimension"] else (1, 1, 1, 1)
            is_dense = name.casefold() == "draws" and dimensions[3] >= 5000
            dense_start = None
            dense_blocks = {}
            rows = {}
            sheet_coverage = {"name": name, "dimension": meta["dimension"], "state": sheet.get("state", "visible"), "cellCount": 0,
                              "nonemptyCellCount": 0, "formulaCount": 0, "missingFormulaCaches": 0,
                              "absentFormulaCaches": 0, "emptyFormulaCaches": 0, "unresolvedSharedFormulas": 0,
                              "rowCount": 0, "errorCellCount": 0, "indexedCellCount": 0, "sampledCellCount": 0,
                              "hiddenRows": 0, "hiddenColumns": sum(int(c.get("max", 0)) - int(c.get("min", 0)) + 1 for c in meta["columns"] if c.get("hidden") in {"1", "true"}),
                              "tableRegions": [{"name": t.get("displayName", t.get("name")), "range": t.get("ref"), "headerRowCount": int(t.get("headerRowCount", "1")), "kind": "source-table"} for t in meta["tables"]]}
            first_cell_line, last_cell_line = None, None
            observed_min_col, observed_min_row, observed_max_col, observed_max_row = 16385, 1048577, 0, 0
            fallback_row = 0
            with xml_stream(archive, part) as handle:
                for _, row_element in ET.iterparse(handle, events=("end",)):
                    if local_name(row_element.tag) != "row":
                        continue
                    fallback_row += 1
                    row_number = int(row_element.get("r", str(fallback_row)))
                    sheet_coverage["rowCount"] += 1
                    sheet_coverage["hiddenRows"] += int(row_element.get("hidden") in {"1", "true"})
                    raw.add("row", sheet=name, row=row_number, attributes=dict(row_element.attrib))
                    row_cells = []
                    for column, element in enumerate(row_element.findall(f"{{{S}}}c"), 1):
                        cell = parse_cell(element, name, row_number, column, strings, styles, formats, anchors, date1904)
                        line = raw.add("cell", **cell)
                        first_cell_line = line if first_cell_line is None else first_cell_line
                        last_cell_line = line
                        row_cells.append(cell)
                        sheet_coverage["cellCount"] += 1
                        sheet_coverage["nonemptyCellCount"] += int(meaningful(cell))
                        sheet_coverage["errorCellCount"] += int(cell["valueType"] == "error")
                        observed_min_col = min(observed_min_col, cell["columnIndex"])
                        observed_min_row = min(observed_min_row, cell["row"])
                        observed_max_col = max(observed_max_col, cell["columnIndex"])
                        observed_max_row = max(observed_max_row, cell["row"])
                        if cell["formula"] is not None:
                            sheet_coverage["formulaCount"] += 1
                            state = cell["cache"]["state"]
                            sheet_coverage["missingFormulaCaches"] += int(state in {"missing", "empty"})
                            sheet_coverage["absentFormulaCaches"] += int(state == "missing")
                            sheet_coverage["emptyFormulaCaches"] += int(state == "empty")
                            sheet_coverage["unresolvedSharedFormulas"] += int(cell["formula"].get("reconstruction", "") in {"unresolved-shared-anchor", "unsupported-structured-or-external-reference"})
                    if is_dense and dense_start is None and row_number >= 19 and len(row_cells) >= 20 and sum(c["valueType"] == "number" and c["formula"] is None for c in row_cells) >= len(row_cells) * 0.9:
                        dense_start = row_number
                    # Narrative and formula rows are NEVER discarded as numeric draws.
                    numeric_body = dense_start is not None and row_number >= dense_start and all(c["valueType"] in {"number", "blank"} and c["formula"] is None for c in row_cells)
                    if numeric_body and row_cells:
                        block_id = (row_number - dense_start) // DRAW_BLOCK_ROWS
                        start = dense_start + block_id * DRAW_BLOCK_ROWS
                        block = dense_blocks.setdefault(block_id, {"start": start, "end": row_number, "rows": {}, "cellCount": 0, "minCol": 16385, "maxCol": 0})
                        block["end"] = row_number
                        block["cellCount"] += len(row_cells)
                        block["minCol"] = min(block["minCol"], min(c["columnIndex"] for c in row_cells))
                        block["maxCol"] = max(block["maxCol"], max(c["columnIndex"] for c in row_cells))
                        # Retain a rolling last row plus the first and midpoint.
                        prior_last = block.get("lastRow")
                        fixed = {start, start + DRAW_BLOCK_ROWS // 2}
                        if prior_last is not None and prior_last not in fixed:
                            block["rows"].pop(prior_last, None)
                        block["rows"][row_number] = row_cells
                        block["lastRow"] = row_number
                    else:
                        rows[row_number] = row_cells
                        sheet_coverage["indexedCellCount"] += len(row_cells)
                    row_element.clear()
            if observed_max_col:
                sheet_coverage["observedDimension"] = f"{col_letters(observed_min_col)}{observed_min_row}:{col_letters(observed_max_col)}{observed_max_row}"
            sheet_coverage["rawRecords"] = {"file": document["rawFile"], "firstCellLine": first_cell_line, "lastCellLine": last_cell_line, "cellCount": sheet_coverage["cellCount"], "lineNumbersAreOneBased": True}
            critical = CRITICAL.get(document["slug"], {}).get(name, [])
            for requested, context_ref in critical:
                sheet_coverage["tableRegions"].append({"range": requested, "contextRange": context_ref, "kind": "critical-locator"})
            if dense_blocks:
                sheet_coverage["indexCoverage"] = "complete-nonnumeric-and-header-records; sampled-dense-numeric-body"
                sheet_coverage["sampledCellCount"] = sum(len(cells) for b in dense_blocks.values() for cells in b["rows"].values())
                sheet_coverage["denseCellCount"] = sum(b["cellCount"] for b in dense_blocks.values())
                sheet_coverage["tableRegions"].extend({"range": f"{col_letters(b['minCol'])}{b['start']}:{col_letters(b['maxCol'])}{b['end']}", "kind": "dense-simulation-block", "indexCoverage": "sample-only", "rawCoverage": "complete", "cellCount": b["cellCount"]} for b in dense_blocks.values())
            else:
                sheet_coverage["indexCoverage"] = "complete"
            index_sheet(chunks, name, rows, meta, critical, list(dense_blocks.values()))
            # Notes/comments are source evidence; never execute them as instructions.
            for rel in meta["relationships"].values():
                if rel.get("Type", "").endswith("/comments") and rel.get("part"):
                    comments = xml_part(archive, rel["part"])
                    authors = [a.text or "" for a in comments.findall(f"{{{S}}}authors/{{{S}}}author")]
                    for i, comment in enumerate(comments.findall(f"{{{S}}}commentList/{{{S}}}comment")):
                        text = "".join(t.text or "" for t in comment.iter(f"{{{S}}}t"))
                        raw.add("cell-comment", sheet=name, cell=comment.get("ref"), text=text, authors=authors, attributes=dict(comment.attrib))
                        chunks.add("sheet-rows", {"sheet": name, "range": comment.get("ref"), "part": f"comment-{i + 1}"}, f"{name} • cell comment", text, metadata={"sourceRole": "comment"})
            if name == "Master Task List":
                ids = [cell["value"] for r, cells in rows.items() if r > 4 for cell in cells if cell["columnIndex"] == 1 and meaningful(cell)]
                coverage["tasks"] = {"sheet": name, "count": len(ids), "sourceRows": "5:" + str(observed_max_row), "idColumn": "A"}
            coverage["sheets"].append(sheet_coverage)
            for key in ("cellCount", "formulaCount", "missingFormulaCaches"):
                coverage[key] += sheet_coverage[key]
        coverage["gates"] = {"count": sum(bool(re.match(r"^G[1-6](?:\s|$)", s["name"])) for s in coverage["sheets"])}
        if any(s.get("denseCellCount") for s in coverage["sheets"]):
            limitations.append("Dense Draws numeric simulation blocks are deterministically sampled only in the search index. Every explicit cell is preserved in the protected raw JSONL; samples are not distribution statistics.")
        if coverage["missingFormulaCaches"]:
            limitations.append("Some formula results are absent or empty in the source package. These are explicitly missing, not zero; formulas and literal task/date inputs are retained without recalculation.")
        if any(s["unresolvedSharedFormulas"] for s in coverage["sheets"]):
            limitations.append("Some shared formulas could not be safely translated. Their source and shared anchor remain available in raw records.")
    return coverage, limitations, "partial" if coverage["missingFormulaCaches"] or coverage["uninterpretedParts"] else "ready"


def pdf_layout_rows(words):
    """Geometric alternative to text-strategy table grids splitting words.

    Each word remains byte-for-byte the extracted Unicode text, with its bbox.
    Cell grouping uses visible horizontal gaps, not guessed numeric labels.
    The source PDF, unsorted page text, word list and both table strategies remain
    available, so no grid is claimed to be an authoritative rendered layout.
    """
    bands = []
    for word in sorted(words, key=lambda w: ((w[1] + w[3]) / 2, w[0])):
        center = (word[1] + word[3]) / 2
        found = next((b for b in reversed(bands[-3:]) if abs(b["center"] - center) <= 2.5), None)
        if found is None:
            found = {"center": center, "words": []}
            bands.append(found)
        found["words"].append(word)
    rows = []
    for row_no, band in enumerate(bands, 1):
        words_here = sorted(band["words"], key=lambda w: w[0])
        cells, current = [], []
        for word in words_here:
            if current and word[0] - current[-1][2] > 12:
                cells.append(current)
                current = []
            current.append(word)
        if current:
            cells.append(current)
        cell_records = [{"text": " ".join(w[4] for w in group), "bbox": [min(w[0] for w in group), min(w[1] for w in group), max(w[2] for w in group), max(w[3] for w in group)]} for group in cells]
        rows.append({"row": row_no, "cells": cell_records, "text": " | ".join(c["text"] for c in cell_records)})
    return rows


def extract_pdf(path, document, raw, chunks):
    import pymupdf as fitz
    coverage = {"pages": 0, "slides": 0, "notes": 0, "sheets": [], "characters": 0, "images": 0, "emptyTextPages": [], "tableRegions": [], "tableExtractionFailures": 0}
    limitations = ["No image/OCR extraction was performed; images and vector artwork remain in the original PDF.", "PDF table grids and geometric cell grouping are extraction candidates, not recalculated values. Page text, words and bounding boxes are preserved for verification."]
    with fitz.open(path) as pdf:
        if pdf.needs_pass:
            raise ValueError("Password-protected PDF is unsupported")
        raw.add("pdf-metadata", properties=pdf.metadata, pageCount=len(pdf))
        for page_number, page in enumerate(pdf, 1):
            text = page.get_text("text", sort=False)
            sorted_text = page.get_text("text", sort=True)
            words = page.get_text("words", sort=False)
            blocks = page.get_text("blocks", sort=False)
            layout_rows = pdf_layout_rows(words)
            image_count = len(page.get_images(full=True))
            raw.add("pdf-page", page=page_number, text=text, sortedText=sorted_text, words=words, blocks=blocks,
                    width=page.rect.width, height=page.rect.height, rotation=page.rotation, images=image_count)
            raw.add("pdf-layout", page=page_number, rows=layout_rows, method="word-baseline-gap-clustering", tolerance=2.5)
            coverage["pages"] += 1
            coverage["characters"] += len(text)
            coverage["images"] += image_count
            if not text.strip():
                coverage["emptyTextPages"].append(page_number)
            chunks.add("pdf-page", {"page": page_number}, f"Page {page_number}", text,
                       metadata={"textOrder": "source", "rawSelector": {"file": document["rawFile"], "page": page_number, "recordType": "pdf-page", "serverSideOnly": True}})
            for start in range(0, len(layout_rows), 10):
                group = layout_rows[start:start + 10]
                headers = layout_rows[:2] + layout_rows[max(0, start - 3):start]
                chunks.add("pdf-section", {"page": page_number, "part": f"layout-rows-{start + 1}-{start + len(group)}"},
                           f"Page {page_number} • source layout rows {start + 1}–{start + len(group)}",
                           "Source layout (cell separators are geometric; source words unchanged):\n" + "\n".join(r["text"] for r in headers + group),
                           group, {"headers": headers, "geometricCells": True, "rawSelector": {"file": document["rawFile"], "recordType": "pdf-layout", "page": page_number, "serverSideOnly": True}})
            for strategy in ("lines", "text"):
                try:
                    tables = page.find_tables(strategy=strategy).tables
                    for table_number, table in enumerate(tables, 1):
                        values = table.extract()
                        region_id = f"{strategy}-{table_number}"
                        header = {"names": table.header.names, "external": table.header.external, "bbox": list(table.header.bbox)}
                        raw.add("pdf-table", page=page_number, table=region_id, strategy=strategy,
                                bbox=list(table.bbox), cells=table.cells, rows=values, header=header)
                        coverage["tableRegions"].append({"page": page_number, "range": region_id, "rowCount": len(values), "columnCount": table.col_count, "strategy": strategy})
                        for start in range(0, len(values), 10):
                            selected = values[start:start + 10]
                            records = [{"row": start + i + 1, "cells": row} for i, row in enumerate(selected)]
                            table_text = "\n".join(" | ".join("[empty]" if cell is None else cell for cell in row) for row in values[:2] + selected)
                            chunks.add("table-region", {"page": page_number, "range": region_id, "part": f"rows-{start + 1}-{start + len(selected)}"},
                                       f"Page {page_number} • {region_id} table rows", table_text, records,
                                       {"headers": header, "bbox": list(table.bbox), "extractionStrategy": strategy, "verbatimExtractedCells": True})
                except Exception as exc:
                    raw.add("extraction-warning", page=page_number, operation=f"find_tables:{strategy}", errorClass=type(exc).__name__)
                    coverage["tableExtractionFailures"] += 1
    if coverage["emptyTextPages"]:
        limitations.append("Some PDF pages have no extractable text; no OCR was attempted.")
    if coverage["tableExtractionFailures"]:
        limitations.append("A table-extraction strategy failed on at least one page; complete page text/words and independent geometric layout extraction are still preserved.")
    return coverage, limitations, "partial" if coverage["emptyTextPages"] or coverage["tableExtractionFailures"] else "ready"


def presentation_records(root):
    paragraphs = []
    for i, paragraph in enumerate(root.iter(f"{{{A}}}p"), 1):
        paragraphs.append({"paragraph": i, "text": paragraph_text(paragraph), "sourceXML": ET.tostring(paragraph, encoding="unicode")})
    tables = []
    for table_number, table in enumerate(root.iter(f"{{{A}}}tbl"), 1):
        rows = []
        for row in table.findall(f"{{{A}}}tr"):
            cells = []
            for cell in row.findall(f"{{{A}}}tc"):
                cells.append({"text": "\n".join(paragraph_text(p) for p in cell.iter(f"{{{A}}}p")), "attributes": dict(cell.attrib)})
            rows.append(cells)
        tables.append({"table": table_number, "rows": rows})
    shapes = [{"id": node.get("id"), "name": node.get("name"), "description": node.get("descr"), "title": node.get("title")} for node in root.iter(f"{{{P}}}cNvPr")]
    return paragraphs, tables, shapes


def extract_pptx(path, document, raw, chunks):
    coverage = {"pages": 0, "slides": 0, "notes": 0, "sheets": [], "hiddenSlides": 0, "orphanSlides": 0, "orphanNotes": 0, "textParagraphs": 0, "tables": 0, "mediaParts": 0}
    limitations = ["No OCR or interpretation of pictures, chart graphics, embedded OLE/media or animations was performed. All original parts remain in the immutable presentation."]
    with zipfile.ZipFile(path) as archive:
        check_zip(archive)
        root = xml_part(archive, "ppt/presentation.xml")
        rels = relationships(archive, "ppt/presentation.xml")
        ordered = []
        for slide in root.findall(f"{{{P}}}sldIdLst/{{{P}}}sldId"):
            target = rels.get(slide.get(f"{{{R}}}id"), {}).get("part")
            if not target:
                raise ValueError("Presentation slide relationship is missing")
            ordered.append((target, False))
        all_slides = sorted(n for n in archive.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n))
        ordered.extend((n, True) for n in all_slides if n not in {s[0] for s in ordered})
        all_notes = sorted(n for n in archive.namelist() if re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", n))
        note_slide_map = {}
        special = sorted(n for n in archive.namelist() if any(term in n for term in ("/media/", "/embeddings/", "/charts/")) and not n.endswith("/"))
        coverage["mediaParts"] = sum("/media/" in n for n in special)
        raw.add("presentation", properties=core_properties(archive), relationships=rels, sourceXML=ET.tostring(root, encoding="unicode"), noteParts=all_notes)
        raw.add("uninterpreted-parts", parts=special, reason="Preserved in original; no OCR or execution")
        for number, (part, orphan) in enumerate(ordered, 1):
            slide = xml_part(archive, part)
            paragraphs, tables, shapes = presentation_records(slide)
            slide_rels = relationships(archive, part)
            for rel in slide_rels.values():
                if rel.get("Type", "").endswith("/notesSlide") and rel.get("part"):
                    note_slide_map[rel["part"]] = number
            hidden = slide.get("show", "1") in {"0", "false"}
            raw.add("slide", slide=number, part=part, hidden=hidden, orphan=orphan, paragraphs=paragraphs, tables=tables, shapes=shapes, relationships=slide_rels, sourceXML=ET.tostring(slide, encoding="unicode"))
            text = "\n".join(p["text"] for p in paragraphs)
            chunks.add("slide", {"slide": number, "part": part}, f"Slide {number}", text,
                       [{"paragraph": p["paragraph"], "text": p["text"]} for p in paragraphs],
                       {"hidden": hidden, "orphan": orphan, "tableCount": len(tables), "sourceRole": "slide", "rawSelector": {"file": document["rawFile"], "recordType": "slide", "slide": number, "serverSideOnly": True}})
            for table in tables:
                values = table["rows"]
                for start in range(0, len(values), 8):
                    selected = values[start:start + 8]
                    table_text = "\n".join(" | ".join(cell["text"] for cell in row) for row in values[:1] + selected)
                    chunks.add("table-region", {"slide": number, "range": f"table-{table['table']}", "part": f"rows-{start + 1}-{start + len(selected)}"},
                               f"Slide {number} • source table {table['table']}", table_text,
                               [{"row": start + i + 1, "cells": row} for i, row in enumerate(selected)],
                               {"headers": [[cell["text"][:800] for cell in row[:24]] for row in values[:1]], "rawSelector": {"file": document["rawFile"], "recordType": "slide", "slide": number, "table": table["table"], "serverSideOnly": True}})
            coverage["slides"] += 1
            coverage["hiddenSlides"] += int(hidden)
            coverage["orphanSlides"] += int(orphan)
            coverage["textParagraphs"] += len(paragraphs)
            coverage["tables"] += len(tables)
        for part in all_notes:
            root = xml_part(archive, part)
            paragraphs, tables, shapes = presentation_records(root)
            number = note_slide_map.get(part)
            raw.add("notes", slide=number, part=part, paragraphs=paragraphs, tables=tables, shapes=shapes, sourceXML=ET.tostring(root, encoding="unicode"))
            location = {"part": part}
            if number is not None:
                location["slide"] = number
            chunks.add("notes", location, f"Notes • slide {number}" if number else "Unassociated source note part",
                       "\n".join(p["text"] for p in paragraphs),
                       [{"paragraph": p["paragraph"], "text": p["text"]} for p in paragraphs],
                       {"sourceRole": "speaker-notes", "orphan": number is None})
            coverage["notes"] += 1
            coverage["orphanNotes"] += int(number is None)
        if not all_notes:
            limitations.append("The source presentation contains zero notes-slide parts; no speaker notes were invented.")
    return coverage, limitations, "partial" if coverage["mediaParts"] else "ready"


def safe_summary(index, input_count, duplicates, ignored):
    result = {"schemaVersion": SCHEMA_VERSION, "extractorVersion": EXTRACTOR_VERSION, "generatedAt": index["generatedAt"],
              "documentCount": len(index["documents"]), "chunkCount": len(index["chunks"]),
              "inputDocumentFiles": input_count, "duplicateFilesCollapsed": duplicates, "unsupportedFilesIgnored": ignored,
              "indexBytes": len((canonical(index) + "\n").encode()), "documents": []}
    for doc in index["documents"]:
        cov = doc["coverage"]
        item = {"id": doc["id"], "slug": doc["slug"], "kind": doc["kind"], "status": doc["status"],
                "pages": cov.get("pages", 0), "slides": cov.get("slides", 0), "notes": cov.get("notes", 0),
                "cellCount": cov.get("cellCount", 0), "formulaCount": cov.get("formulaCount", 0),
                "missingFormulaCaches": cov.get("missingFormulaCaches", 0), "rawRecords": doc["rawRecords"],
                "chunks": sum(c["documentId"] == doc["id"] for c in index["chunks"]),
                "originalFile": doc["originalFile"], "rawFile": doc["rawFile"], "limitations": doc["limitations"],
                "sheetCount": len(cov.get("sheets", [])), "tasks": cov.get("tasks", {}).get("count", 0), "gates": cov.get("gates", {}).get("count", 0),
                "sheets": []}
        for sheet in cov.get("sheets", []):
            keys = ("name", "dimension", "observedDimension", "cellCount", "nonemptyCellCount", "formulaCount", "missingFormulaCaches", "absentFormulaCaches", "emptyFormulaCaches", "unresolvedSharedFormulas", "rowCount", "indexedCellCount", "sampledCellCount", "denseCellCount", "indexCoverage")
            item["sheets"].append({key: sheet[key] for key in keys if key in sheet})
        result["documents"].append(item)
    return result


def ingest(input_dir, output_dir, manifest_path=None, summary_path=None):
    input_dir = no_symlinks(input_dir)
    if not input_dir.is_dir():
        raise ValueError("Input directory does not exist")
    output_dir = protected_root(output_dir, input_dir)
    manifest, aliases = read_manifest(manifest_path)
    sources, ignored = [], 0
    for path in sorted(input_dir.rglob("*"), key=lambda p: str(p.relative_to(input_dir)).casefold()):
        if path.is_symlink():
            raise ValueError("Symbolic-link input entries are prohibited")
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".pdf", ".xlsx", ".pptx"}:
            ignored += 1
            continue
        sources.append(path)
    if not sources:
        raise ValueError("No supported documents were found")
    unique = {}
    for source in sources:
        digest = sha_file(source)
        identity = detect_document(source, digest, manifest, aliases)
        slug, title = identity
        if digest in unique:
            if unique[digest]["slug"] != slug:
                raise ValueError("One source hash has conflicting manifest identities")
            unique[digest]["references"].append(str(source.relative_to(input_dir)))
        else:
            unique[digest] = {"path": source, "slug": slug, "title": title, "references": [str(source.relative_to(input_dir))]}
    index = {"schemaVersion": SCHEMA_VERSION, "extractorVersion": EXTRACTOR_VERSION,
             "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
             "security": {"classification": "protected-source-corpus", "clientSafe": False, "sourceInstructionsAreData": True,
                          "distribution": "Never serve this directory publicly or send raw originals/corpus to a model. Server-side retrieval must select bounded evidence only."},
             "documents": [], "chunks": []}
    for digest, entry in sorted(unique.items(), key=lambda item: (item[1]["slug"], item[0])):
        source, slug = entry["path"], entry["slug"]
        kind = source.suffix.lower().lstrip(".")  # validated against allowed_kinds(slug) in detect_document
        original_file = f"originals/{digest}.{kind}"
        raw_file = f"raw/{digest}.records.jsonl.gz"
        immutable_original(source, output_dir / original_file, digest)
        document = {"id": digest, "slug": slug, "title": entry["title"], "kind": kind, "sha256": digest,
                    "originalFile": original_file, "rawFile": raw_file, "sourceReferences": sorted(entry["references"]), "bytes": (output_dir / original_file).stat().st_size}
        chunks = Chunks(document)
        with atomic_binary(output_dir / raw_file) as handle:
            with gzip.GzipFile(filename="", fileobj=handle, mode="wb", mtime=0, compresslevel=6) as compressed:
                raw = RawWriter(compressed, digest)
                raw.add("source", schemaVersion=SCHEMA_VERSION, extractorVersion=EXTRACTOR_VERSION, sha256=digest, kind=kind, slug=slug, originalFile=original_file, trust="untrusted-source-data")
                extract = {"pdf": extract_pdf, "xlsx": extract_xlsx, "pptx": extract_pptx}[kind]
                # Libraries occasionally print layout tips. Do not leak source
                # content or parser diagnostics into the CLI's coverage-only log.
                with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                    coverage, limitations, status = extract(output_dir / original_file, document, raw, chunks)
                alternate = ALTERNATE_KIND_LIMITATION.get((slug, kind))
                if alternate:
                    limitations = [*limitations, alternate]
                document.update(coverage=coverage, limitations=limitations, status=status)
                document["rawRecords"] = {"total": raw.line, "byType": dict(sorted(raw.counts.items()))}
        document["rawBytes"] = (output_dir / raw_file).stat().st_size
        document["rawSha256"] = sha_file(output_dir / raw_file)
        index["documents"].append(document)
        index["chunks"].extend(chunks.items)
    write_json(output_dir / "index.json", index)
    summary = safe_summary(index, len(sources), len(sources) - len(unique), ignored)
    if summary_path:
        write_json(summary_path, summary)
    return summary


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input-dir", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--manifest", type=Path, help="Optional protected filename/title aliases and source SHA256 assertions")
    parser.add_argument("--summary-file", type=Path, help="Optional mode-0600 coverage-only JSON summary")
    args = parser.parse_args(argv)
    previous_umask = os.umask(0o077)
    try:
        summary = ingest(args.input_dir, args.output_dir, args.manifest, args.summary_file)
        # Counts only: source labels, cell contents and document text are not logged.
        print(canonical({key: summary[key] for key in ("schemaVersion", "documentCount", "chunkCount", "inputDocumentFiles", "duplicateFilesCollapsed", "unsupportedFilesIgnored", "indexBytes")}))
        return 0
    except Exception as exc:
        # Avoid printing untrusted parser exceptions that might embed source data.
        print(f"Protected ingestion failed ({type(exc).__name__}); no new index is guaranteed. Check input/manifest and protected-directory permissions.", file=sys.stderr)
        return 1
    finally:
        os.umask(previous_umask)


if __name__ == "__main__":
    raise SystemExit(main())
