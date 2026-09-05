#!/usr/bin/env python3
"""Synthetic offline tests; no private source excerpts or real documents in Git.
Run: PYTHONDONTWRITEBYTECODE=1 python3 tests/completeCorpusIngest.test.py
Optionally set TMPDIR to an authorized private output directory.
"""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import sqlite3
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]

def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value

complete = module("complete_corpus", ROOT / "scripts/build_complete_corpus.py")
fixtures = module("base_fixtures", ROOT / "tests/ingestion.test.py")
ing = complete.ing


class CompleteCorpusTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="complete-corpus-test-")
        self.root = Path(self.tmp.name)
        self.inputs = self.root / "inputs"
        self.inputs.mkdir()
        self.out = self.root / "protected"

    def tearDown(self):
        self.tmp.cleanup()

    def workbook(self, rows, name="sample.xlsx", sheet_name="Draws", dimension="A1:AZ6001"):
        path = self.inputs / name
        fixtures.workbook(path, [(sheet_name, fixtures.sheet(rows, dimension))])
        return path

    def build(self, files=None, output=None):
        files = files or [{"file": p.name, "slug": "financial-model", "sha256": ing.sha_file(p)} for p in sorted(self.inputs.glob("*.xlsx"))]
        manifest = self.root / "manifest.json"
        manifest.write_text(json.dumps({"files": files, "inputCount": len(files)}))
        report = complete.build(self.inputs, output or self.out, manifest, skip_ocr=True)
        return report, sqlite3.connect((output or self.out) / "corpus.sqlite")

    def test_complete_dense_body_and_tail_are_searchable_not_sampled(self):
        rows = [(2, fixtures.inline("B2", "Synthetic dense source"))]
        rows += [(r, "".join(fixtures.num(f"{ing.col_letters(c)}{r}", str(r * 1000 + c)) for c in range(2, 26))) for r in range(19, 1519)]
        path = self.workbook(rows)
        before = path.read_bytes()
        report, db = self.build()
        try:
            count = db.execute("SELECT count(*) FROM cells WHERE sheet='Draws' AND row BETWEEN 19 AND 1518 AND col BETWEEN 2 AND 25").fetchone()[0]
            self.assertEqual(count, 1500 * 24)
            self.assertEqual(report["counts"]["nonemptyCellsIndexed"], 36001)
            found = db.execute("SELECT c.json FROM chunks_fts JOIN chunks c ON c.rowid=chunks_fts.rowid WHERE chunks_fts MATCH ? AND c.layer='complete'", ('"750013"',)).fetchall()
            self.assertTrue(found)
            self.assertTrue(any("M750=750013" in json.loads(row[0])["text"] for row in found))
            expected = {f"{ing.col_letters(c)}{r}" for r in range(19, 1519) for c in range(2, 26)} | {"B2"}
            actual = set()
            for raw, in db.execute("SELECT json FROM chunks WHERE layer='complete' AND kind='cell-range'"):
                chunk = json.loads(raw)
                actual.update(chunk["metadata"]["cellAddresses"])
                self.assertLessEqual(len(chunk["text"]), complete.MAX_TEXT)
                self.assertLessEqual(len(chunk["metadata"]["cellAddresses"]), complete.MAX_CELLS)
                self.assertFalse(chunk["metadata"]["sampled"])
            self.assertEqual(actual, expected)
            legacy = json.loads((self.out / "index.json").read_text())
            self.assertEqual(legacy["schemaVersion"], "athar-corpus/v1")
            self.assertIn("sampled-dense", legacy["documents"][0]["coverage"]["sheets"][0]["indexCoverage"])
            self.assertEqual(path.read_bytes(), before)
            self.assertEqual(report["ocr"]["status"], "skipped-by-request")
        finally:
            db.close()

    def test_missing_empty_and_zero_formula_caches_remain_distinct(self):
        self.workbook([(1, fixtures.formula("A1", "SUM(B2:B9)") + fixtures.formula("B1", "AVERAGE(B2:B9)", empty=True)
                       + fixtures.formula("C1", "SUM(0,0)", cached="0") + '<c r="D1" s="2"/>')], dimension="A1:D1")
        report, db = self.build()
        try:
            cells = {address: json.loads(raw) for address, raw in db.execute("SELECT address,json FROM cells")}
            for address, state in (("A1", "missing"), ("B1", "empty")):
                self.assertEqual(cells[address]["cache"]["state"], state)
                self.assertIsNone(cells[address]["value"])
                self.assertIsNone(cells[address]["cache"]["lexeme"])
                self.assertEqual(cells[address]["valueType"], "missing-formula-cache")
            self.assertEqual(cells["C1"]["cache"], {"state": "present", "lexeme": "0"})
            self.assertEqual(cells["C1"]["value"], 0)
            self.assertEqual(cells["D1"]["valueType"], "blank")
            self.assertEqual(cells["D1"]["styleId"], 2)
            self.assertEqual(report["counts"]["cells"], 4)
            self.assertEqual(report["counts"]["nonemptyCellsIndexed"], 3)
            text = "\n".join(row[0] for row in db.execute("SELECT text FROM chunks WHERE layer='complete'"))
            self.assertIn("missing formula cache; NOT zero", text)
            self.assertIn("empty formula cache; NOT zero", text)
            self.assertIn("C1 formula.text: SUM(0,0)", text)
            self.assertIn("C1 cache.state: present; cache.lexeme: 0", text)
            self.assertEqual(report["counts"]["formulaCaches"], {"missing": 1, "empty": 1, "present": 1})
        finally:
            db.close()

    def test_long_cell_is_losslessly_continued_and_ids_deterministic(self):
        value = "longword " * 4000 + "UniqueEndSentinel"
        path = self.workbook([(1, fixtures.inline("A1", value))], dimension="A1")
        report, db = self.build()
        with db:
            chunks = [json.loads(row[0]) for row in db.execute("SELECT json FROM chunks WHERE layer='complete' AND kind='cell-range'")]
            chunks.sort(key=lambda c: c["metadata"]["continuation"]["textOffset"])
            self.assertEqual("".join(c["text"] for c in chunks), "A1=" + value)
            ids = sorted(row[0] for row in db.execute("SELECT id FROM chunks"))
            self.assertTrue(db.execute("SELECT count(*) FROM chunks_fts WHERE chunks_fts MATCH 'UniqueEndSentinel'").fetchone()[0])
        db.close()
        second = self.root / "second"
        result = complete.build(self.inputs, second, self.root / "manifest.json", reuse_corpus=self.out, skip_ocr=True)
        other = sqlite3.connect(second / "corpus.sqlite")
        try:
            self.assertEqual(ids, sorted(row[0] for row in other.execute("SELECT id FROM chunks")))
        finally:
            other.close()
        self.assertTrue(result["reusedBaseExtraction"])
        self.assertEqual(ing.sha_file(path), report["documents"][0]["documentId"])

    def test_exact_hash_aliases_preserved_but_different_versions_never_merge(self):
        a = self.workbook([(1, fixtures.num("A1", "5"))], name="a.xlsx", dimension="A1")
        b = self.inputs / "copy.xlsx"
        shutil.copyfile(a, b)
        c = self.workbook([(1, fixtures.num("A1", "6"))], name="revision.xlsx", dimension="A1")
        files = [{"filename": p.name, "sha256": ing.sha_file(p), "slug": "financial-model", "aliases": ["logical-model"], "version": "v1" if p != c else "v2", "signedUrl": "https://invalid.example/private?credential=nevercopy"} for p in (a, b, c)]
        report, db = self.build(files)
        try:
            self.assertEqual(report["counts"]["documents"], 2)
            self.assertEqual(report["inputFiles"], 3)
            self.assertEqual(report["duplicatesCollapsed"], 1)
            docs = [json.loads(row[0]) for row in db.execute("SELECT json FROM documents")]
            self.assertEqual(len({d["versionId"] for d in docs}), 2)
            self.assertEqual({v for d in docs for v in d["manifestVersions"]}, {"v1", "v2"})
            original = next(d for d in docs if d["id"] == ing.sha_file(a))
            self.assertEqual(original["sourceReferences"], ["a.xlsx", "copy.xlsx"])
            self.assertIn("logical-model", original["aliases"])
            self.assertNotIn("signedUrl", (self.out / "index.json").read_text())
            self.assertNotIn("nevercopy", (self.out / "input-manifest.normalized.json").read_text())
        finally:
            db.close()

    def test_manifest_mismatch_fails_before_any_document_derivative(self):
        self.workbook([(1, fixtures.num("A1", "2"))], dimension="A1")
        with self.assertRaisesRegex(ValueError, "SHA256 mismatch"):
            self.build([{"filename": "sample.xlsx", "slug": "financial-model", "sha256": "0" * 64}])
        self.assertFalse((self.out / "corpus.sqlite").exists())
        self.assertFalse((self.out / "index.json").exists())

    def test_pdf_presentation_pages_and_notes_full_records_are_available(self):
        pdf, pptx = self.inputs / "sample.pdf", self.inputs / "sample.pptx"
        fixtures.make_pdf(pdf)
        fixtures.presentation(pptx, notes=True)
        files = [{"file": pdf.name, "slug": "financial-summary"}, {"file": pptx.name, "slug": "executive-presentation"}]
        report, db = self.build(files)
        try:
            self.assertEqual(report["counts"]["pages"], 2)
            self.assertEqual(report["counts"]["slides"], 2)
            self.assertEqual(report["counts"]["notes"], 1)
            self.assertEqual(db.execute("SELECT count(*) FROM records WHERE record_type='pdf-page'").fetchone()[0], 2)
            self.assertEqual(db.execute("SELECT count(*) FROM records WHERE record_type='slide'").fetchone()[0], 2)
            self.assertEqual(db.execute("SELECT count(*) FROM chunks WHERE layer='complete' AND kind='notes'").fetchone()[0], 1)
            self.assertEqual(db.execute("PRAGMA quick_check").fetchone()[0], "ok")
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
