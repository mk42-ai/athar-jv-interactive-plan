#!/usr/bin/env python3
"""Provision the four review documents for the document-connected AI, then run the offline ingestion.

    python3 scripts/provision_sources.py --input-dir /protected/originals --output-dir /protected/athar-corpus
    npm run provision   (same, reading the two directories from ATHAR_SOURCE_INPUT_DIR / ATHAR_CORPUS_DIR)

For every expected document (see server/documentRegistry.js) the script:
  1. keeps an original that is already present beneath --input-dir (never re-downloads or overwrites);
  2. otherwise downloads it from the signed URL configured in the host environment / git-ignored .env
     (ATHAR_SOURCE_URL_<SLUG>), verifying the HTTPS scheme, the content type and the file signature;
  3. writes a manifest that pins each file to its document slug so ingestion never has to guess;
  4. runs scripts/ingest_documents.py, which builds the protected corpus (index.json, originals/, raw/).
Documents that are neither present nor configured are reported as MISSING — the API then lists them
with status "missing" so the reviewer sees the gap explicitly instead of a silently smaller corpus.

Signed URLs are time-limited credentials: they are read from the environment only, never printed,
never written into the repository, the manifest or the corpus.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
EXPECTED = [
    {"slug": "executive-presentation", "env": "ATHAR_SOURCE_URL_EXECUTIVE_PRESENTATION", "kinds": ["pptx", "pdf"],
     "title": "Athar JV — Executive Summary deck", "match": re.compile(r"executive[-_ ]summary.*(deck|slide)|slide[-_ ]deck", re.I)},
    {"slug": "financial-summary", "env": "ATHAR_SOURCE_URL_FINANCIAL_SUMMARY", "kinds": ["pdf"],
     "title": "Athar JV — Financial Model Executive Summary", "match": re.compile(r"financial[-_ ]model[-_ ]executive[-_ ]summary", re.I)},
    {"slug": "financial-model", "env": "ATHAR_SOURCE_URL_FINANCIAL_MODEL", "kinds": ["xlsx"],
     "title": "Athar JV — Financial Model v13", "match": re.compile(r"financial[-_ ]model(?!.*summary).*v?13|v13.*financial", re.I)},
    {"slug": "implementation-plan", "env": "ATHAR_SOURCE_URL_IMPLEMENTATION_PLAN", "kinds": ["xlsx"],
     "title": "ODA × AIREV Athar — 6-Month Implementation Plan", "match": re.compile(r"implementation[-_ ]plan", re.I)},
]
COMPANIONS = [{"slug": "implementation-plan-pdf", "env": "ATHAR_SOURCE_URL_IMPLEMENTATION_PLAN_PDF", "kinds": ["pdf"], "title": "Implementation plan — PDF export (reference copy, not ingested)"}]
SIGNATURES = {"pdf": b"%PDF-", "xlsx": b"PK\x03\x04", "pptx": b"PK\x03\x04"}
CONTENT_TYPES = {"pdf": ("application/pdf", "application/octet-stream"), "xlsx": ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"),
                 "pptx": ("application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/octet-stream")}


def load_dotenv():
    """process.env first, then <root>/.env — same precedence as server/env.js; nothing is overwritten."""
    for name in (os.environ.get("ATHAR_CONFIG_FILE"), ROOT / ".env"):
        if not name:
            continue
        path = Path(name)
        if not path.is_file():
            continue
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            match = re.match(r"^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$", line)
            if not match:
                continue
            key, value = match.group(1), match.group(2).strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            if key not in os.environ and value:
                os.environ[key] = value


def existing_original(input_dir: Path, entry: dict) -> Path | None:
    for path in sorted(input_dir.rglob("*")):
        if path.is_file() and not path.is_symlink() and path.suffix.lower().lstrip(".") in entry["kinds"] and entry["match"].search(path.name):
            return path
    return None


def download(url: str, kinds: list[str], target_dir: Path, label: str) -> Path:
    parts = urlsplit(url)
    if parts.scheme != "https" or not parts.netloc:
        raise ValueError(f"{label}: only https URLs are accepted")
    name = Path(unquote(parts.path.split("/")[-1] or "download")).name
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in kinds:
        raise ValueError(f"{label}: URL file extension .{ext or '?'} is not one of {kinds}")
    safe = re.sub(r"[^A-Za-z0-9._ ()-]+", "_", name)[:150]
    request = urllib.request.Request(url, headers={"User-Agent": "athar-provision/1.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        ctype = (response.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        if ctype and ctype not in CONTENT_TYPES[ext]:
            raise ValueError(f"{label}: unexpected content type {ctype}")
        data = response.read(200 * 1024 * 1024 + 1)
    if len(data) > 200 * 1024 * 1024:
        raise ValueError(f"{label}: file exceeds 200 MB")
    if not data.startswith(SIGNATURES[ext]):
        raise ValueError(f"{label}: downloaded bytes are not a {ext.upper()} file")
    target = target_dir / safe
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(data)
    return target


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input-dir", type=Path, default=Path(os.environ.get("ATHAR_SOURCE_INPUT_DIR", "")) or None, help="protected directory holding the originals (created, mode 0700)")
    parser.add_argument("--output-dir", type=Path, default=Path(os.environ.get("ATHAR_CORPUS_DIR", "")) or None, help="protected corpus directory (ATHAR_CORPUS_DIR)")
    parser.add_argument("--skip-download", action="store_true", help="only use originals already present; never fetch")
    parser.add_argument("--skip-ingest", action="store_true", help="download/verify only; do not run ingestion")
    args = parser.parse_args(argv)
    load_dotenv()
    if not args.input_dir or not args.output_dir:
        print("Set --input-dir/--output-dir (or ATHAR_SOURCE_INPUT_DIR / ATHAR_CORPUS_DIR).", file=sys.stderr)
        return 2
    input_dir, output_dir = args.input_dir.resolve(), args.output_dir.resolve()
    for directory in (input_dir, output_dir):
        if directory == ROOT or str(directory).startswith(str(ROOT) + os.sep):
            print(f"Refusing a protected directory inside the repository: {directory}", file=sys.stderr)
            return 2
    os.umask(0o077)
    input_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    manifest = {"documents": []}
    report = []
    for entry in EXPECTED + COMPANIONS:
        companion = entry["slug"].endswith("-pdf")
        present = None if companion else existing_original(input_dir, entry)
        url = os.environ.get(entry["env"])
        status, path = "missing", None
        if present:
            status, path = "present", present
        elif url and not args.skip_download:
            try:
                if companion:
                    companion_dir = input_dir.parent / "reference"
                    companion_dir.mkdir(exist_ok=True, mode=0o700)
                    path = download(url, entry["kinds"], companion_dir, entry["slug"])
                else:
                    path = download(url, entry["kinds"], input_dir, entry["slug"])
                status = "downloaded"
            except Exception as exc:  # noqa: BLE001 — report and continue; never print the URL
                status = f"download-failed ({type(exc).__name__}: {str(exc)[:120]})"
        elif url:
            status = "configured-not-fetched"
        if path and not companion:
            manifest["documents"].append({"file": path.name, "slug": entry["slug"], "title": entry["title"]})
        report.append({"slug": entry["slug"], "status": status, "file": path.name if path else None, "urlConfigured": bool(url)})
    manifest_path = input_dir.parent / "provision-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    os.chmod(manifest_path, 0o600)
    print(json.dumps({"inputDir": str(input_dir), "documents": report}, indent=1))
    missing = [r["slug"] for r in report if r["status"] == "missing" and not r["slug"].endswith("-pdf")]
    if missing:
        print(f"MISSING originals (reported as status 'missing' by /api/documents): {', '.join(missing)}", file=sys.stderr)
    if args.skip_ingest:
        return 0
    if not manifest["documents"]:
        print("No originals to ingest.", file=sys.stderr)
        return 1
    cmd = [sys.executable, str(ROOT / "scripts" / "ingest_documents.py"), "--input-dir", str(input_dir), "--output-dir", str(output_dir), "--manifest", str(manifest_path)]
    return subprocess.call(cmd)


if __name__ == "__main__":
    raise SystemExit(main())
