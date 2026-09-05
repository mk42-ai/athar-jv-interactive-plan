#!/usr/bin/env python3
"""Explicit offline PPTX -> protected PDF preparation; no server-side auto conversion.
Usage: python3 scripts/prepare_source_views.py --corpus /protected/athar-corpus
Does not alter originals/index, export text, use a provider, or publish files.
Requires installed LibreOffice and PyMuPDF. Run inside a network-disabled worker
for OS-enforced isolation; --headless and macro settings are not a security sandbox.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile
from datetime import datetime, timezone

SCHEMA = 'athar-source-preview/v1'

def digest(p):
    h = hashlib.sha256()
    with p.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def protected(root, relative, prefix):
    if not isinstance(relative, str) or any(c in relative for c in ['\\', ':', '\0']):
        raise ValueError('Unsafe private path')
    parts = relative.split('/')
    if not parts or parts[0] != prefix or any(p in ('', '.', '..', 'public') for p in parts):
        raise ValueError('Unsafe private path')
    target = root
    for part in parts:
        target = target / part
        if target.is_symlink():
            raise ValueError('Symlink private path')
    if not target.resolve().is_relative_to(root):
        raise ValueError('Unsafe private path')
    return target

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--corpus', required=True)
    args = parser.parse_args()
    os.umask(0o077)
    supplied = Path(args.corpus)
    if supplied.is_symlink():
        raise ValueError('Symlink corpus')
    root = supplied.resolve(strict=True)
    if 'public' in root.parts:
        raise ValueError('Public corpus forbidden')
    # Dependencies are checked before touching any preview output.
    import fitz
    executable = shutil.which('libreoffice') or shutil.which('soffice')
    if not executable:
        raise RuntimeError('LibreOffice is required')
    index_file = root / 'index.json'
    if index_file.is_symlink():
        raise ValueError('Symlink index')
    index = json.loads(index_file.read_text())
    views = root / 'views'
    if views.is_symlink():
        raise ValueError('Symlink views directory')
    views.mkdir(mode=0o700, exist_ok=True)
    converted = reused = 0
    for doc in index['documents']:
        if doc['kind'] != 'pptx':
            continue
        sha = doc['sha256']
        if len(sha) != 64 or any(c not in '0123456789abcdef' for c in sha) or doc['id'] != sha:
            raise ValueError('Invalid document hash')
        original = protected(root, doc['originalFile'], 'originals')
        if original.suffix.lower() != '.pptx' or digest(original) != sha:
            raise ValueError('Original integrity mismatch')
        # Refuse macros and external relationships instead of activating external
        # content. Export uses an isolated profile with highest macro security.
        import xml.etree.ElementTree as ET
        with zipfile.ZipFile(original) as archive:
            names = archive.namelist()
            if any('vbaproject' in n.lower() for n in names):
                raise ValueError('Macro-bearing presentation forbidden')
            for name in names:
                if name.endswith('.rels'):
                    if any(r.attrib.get('TargetMode') == 'External' for r in ET.fromstring(archive.read(name))):
                        raise ValueError('External presentation relationships forbidden; use isolated manual conversion')
        pdf = protected(root, f'views/{sha}.pdf', 'views')
        metadata_file = protected(root, f'views/{sha}.json', 'views')
        expected_pages = doc['coverage']['slides']
        if pdf.exists() and metadata_file.exists():
            meta = json.loads(metadata_file.read_text())
            if (meta.get('schemaVersion') == SCHEMA and meta.get('documentId') == sha
                    and meta.get('originalSha256') == sha and meta.get('format') == 'pdf'
                    and meta.get('renderer') == 'libreoffice' and meta.get('pageCount') == expected_pages
                    and meta.get('previewSha256') == digest(pdf)):
                with fitz.open(pdf) as loaded:
                    if loaded.page_count == expected_pages:
                        reused += 1
                        continue
        with tempfile.TemporaryDirectory(prefix='.source-view-', dir=views) as working:
            work = Path(working)
            staged = work / f'{sha}.pptx'
            shutil.copyfile(original, staged)
            if digest(staged) != sha:
                raise ValueError('Original changed while staging')
            profile = work / 'profile'
            (profile / 'user').mkdir(parents=True)
            (profile / 'user/registrymodifications.xcu').write_text('''<?xml version="1.0" encoding="UTF-8"?>
<oor:items xmlns:oor="http://openoffice.org/2001/registry">
<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item>
<item oor:path="/org.openoffice.Office.Common/Save/Document"><prop oor:name="UpdateLinks" oor:op="fuse"><value>0</value></prop></item>
</oor:items>''')
            options = 'pdf:impress_pdf_Export:{"ExportNotesPages":{"type":"boolean","value":"false"},"ExportHiddenSlides":{"type":"boolean","value":"true"}}'
            done = subprocess.run([executable, f'-env:UserInstallation={profile.as_uri()}', '--headless', '--nologo',
                                   '--nodefault', '--norestore', '--convert-to', options, '--outdir', str(work), str(staged)],
                                  stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180, check=False)
            produced = work / f'{sha}.pdf'
            if done.returncode or not produced.exists():
                raise RuntimeError('Private LibreOffice conversion failed')
            if digest(original) != sha:
                raise ValueError('Original changed during conversion')
            with fitz.open(produced) as loaded:
                if loaded.page_count != expected_pages:
                    raise ValueError('Preview page count differs from source slide count')
                dimensions = [{'width': p.rect.width, 'height': p.rect.height} for p in loaded]
            meta = {'schemaVersion': SCHEMA, 'documentId': sha, 'originalSha256': sha,
                    'previewSha256': digest(produced), 'format': 'pdf', 'renderer': 'libreoffice',
                    'pageCount': expected_pages, 'pages': dimensions,
                    'createdAt': datetime.now(timezone.utc).isoformat()}
            staged_meta = work / 'metadata.json'
            staged_meta.write_text(json.dumps(meta, sort_keys=True) + '\n')
            os.chmod(produced, 0o600)
            os.chmod(staged_meta, 0o600)
            # Publish PDF first, metadata last: concurrent readers fail closed
            # on any hash mismatch rather than accepting an unrelated old preview.
            os.replace(produced, pdf)
            os.replace(staged_meta, metadata_file)
            converted += 1
    print(json.dumps({'converted': converted, 'verifiedExisting': reused, 'protected': True}))

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # No document text, private paths, conversion stdout or provider data in logs.
        print(json.dumps({'ok': False, 'errorType': type(error).__name__, 'message': 'Private preview preparation failed; verify dependencies, integrity and offline conversion restrictions.'}))
        raise SystemExit(1)
