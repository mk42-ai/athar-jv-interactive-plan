#!/usr/bin/env python3
"""Deployed private-asset QA; stdlib only. Main/operator runs after deployment.
Read the EXISTING review code from ATHAR_REVIEW_PASSPHRASE; never generate/store it.
--corpus is the freshly ingested private directory; --presentation is its private
presentation counterpart. --output must be a NEW file outside the repo/stores.
Default: no model/voice calls. --allow-raw-question explicitly permits ONE app
question (the server may internally repair its model response), with no retries.
Audio checks prove authenticated asset downloads/integrity, NOT audible playback.
No source JSON, URLs, IDs, excerpts, hashes, cookies or exceptions enter reports.
"""
import argparse
import datetime as dt
import base64
import gzip
import hashlib
import http.cookiejar
import http.cookies
import json
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.parse as U
import urllib.request as H

REPO = Path(__file__).resolve().parents[1]
TIMEOUT, MAX_BYTES = 25, 128 * 1024 * 1024
sha = lambda b: hashlib.sha256(b).hexdigest()
canonical = lambda v: sha(json.dumps(v, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode())
quote = lambda v: U.quote(str(v), safe='')
no_store = lambda r: 'no-store' in r[1].get('Cache-Control', '').lower()


def private_file(root, relative):
    p = (root / relative).resolve()
    if not p.is_relative_to(root) or not p.is_file():
        raise ValueError('private_input')
    return p


def read_json(root, name):
    return json.loads(private_file(root, name).read_bytes())


def file_sha(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def output_path(value, roots):
    p = Path(value).absolute()
    if p.is_symlink() or p.exists() or any(p.resolve().is_relative_to(r.resolve()) for r in roots):
        raise ValueError('private_output_required')
    if not p.parent.is_dir():
        raise ValueError('output_parent_required')
    return p


class NoRedirect(H.HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


class Client:
    def __init__(self, url):
        p = U.urlsplit(url)
        if p.scheme not in ('http', 'https') or not p.hostname or p.username or p.password or p.query or p.fragment or p.path not in ('', '/'):
            raise ValueError('origin_required')
        if p.scheme == 'http' and p.hostname not in ('localhost', '127.0.0.1', '::1'):
            raise ValueError('https_required')
        self.origin = f'{p.scheme}://{p.netloc}'
        self.jar = http.cookiejar.CookieJar()
        self.open = H.build_opener(H.ProxyHandler({}), NoRedirect(), H.HTTPCookieProcessor(self.jar)).open

    def request(self, path, method='GET', body=None, origin='same'):
        p = U.urlsplit(path)
        if not path.startswith('/') or path.startswith('//') or p.scheme or p.netloc or p.fragment or '\\' in path or any(ord(c) < 32 for c in path):
            raise ValueError('unsafe_target')
        if set(U.parse_qs(p.query, keep_blank_values=True)) - {'page', 'slide', 'sheet', 'range'}:
            raise ValueError('signed_or_unknown_query')
        headers = {'Accept': '*/*', 'Accept-Encoding': 'identity'}
        if method != 'GET' and origin is not None:
            headers['Origin'] = self.origin if origin == 'same' else origin
        if body is not None:
            headers['Content-Type'] = 'application/json'
        req = H.Request(self.origin + path, data=None if body is None else json.dumps(body).encode(), headers=headers, method=method)
        deadline = time.monotonic() + TIMEOUT
        try:
            response = self.open(req, timeout=TIMEOUT)
        except urllib.error.HTTPError as error:
            response = error  # Capture status/body, never follow or log Location/error text.
        with response:
            parts, size = [], 0
            while True:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise TimeoutError()
                sock = getattr(getattr(response.fp, 'raw', None), '_sock', None)
                if sock:
                    sock.settimeout(remaining)
                part = response.read1(65536)
                if not part:
                    break
                size += len(part)
                if size > MAX_BYTES:
                    raise ValueError('response_limit')
                parts.append(part)
            return response.code, response.headers, b''.join(parts)


class Audit:
    def __init__(self):
        self.checks = []

    def record(self, name, kind, good, status=None, ms=0, method=None, **bits):
        self.checks.append(dict(completedAt=dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z'), name=name, pathClass=kind, result='blocked' if good is None else 'pass' if good else 'fail',
                                status=status, ms=round(ms, 2), method=method, **{k: bool(v) for k, v in bits.items()}))

    def check(self, name, kind, client, path, status=200, verify=lambda r: {}, method='GET', body=None, origin='same'):
        t = time.monotonic()
        try:
            r = client.request(path, method, body, origin)
        except Exception:
            self.record(name, kind, None, ms=(time.monotonic()-t)*1000, method=method)
            return None
        try:
            bits = verify(r)
            good = r[0] in (status if isinstance(status, tuple) else (status,)) and all(bits.values())
        except Exception:
            bits, good = {}, False
        self.record(name, kind, good, r[0], (time.monotonic()-t)*1000, method, **bits)
        return r if good else None

    def report(self):
        return dict(schema='athar-security-smoke/v1', classification='authenticated-download-not-playback',
                    timeoutSeconds=TIMEOUT, retries=0, counts={k: sum(c['result'] == k for c in self.checks) for k in ('pass', 'fail', 'blocked')}, checks=self.checks)


def cookie_ok(r, secure):
    cookies = http.cookies.SimpleCookie()
    cookies.load(r[1].get('Set-Cookie', ''))
    c = cookies.get('athar_review')
    return bool(c and c.value and c['httponly'] and c['samesite'].lower() == 'strict' and c['path'] == '/' and (c['secure'] or not secure))


def strings(value):
    if isinstance(value, str) and len(value.strip()) >= 18:
        yield value.strip()[:96].casefold()
    elif isinstance(value, dict):
        for v in value.values():
            yield from strings(v)
    elif isinstance(value, list):
        for v in value:
            yield from strings(v)


def clean_denial(r, markers):
    text = r[2].decode('utf-8', 'replace')
    clean = not any(m in text.casefold() for m in markers) and not r[2].startswith((b'%PDF-', b'PK\x03\x04', b'ID3'))
    if r[0] == 200:
        return {'noBusinessPayload': clean and 'Private review' in text and 'type="password"' in text}
    payload = json.loads(r[2])
    return {'noBusinessPayload': clean and isinstance(payload, dict) and bool(payload) and set(payload) <= {'code', 'error', 'message'}}


def cell_matches(r, original, doc):
    data = json.loads(r[2]); cells = [c for row in data.get('rows', []) for c in row['cells']]
    fields = ('value', 'rawValue', 'displayValue', 'formula', 'cache', 'numberFormat', 'valueType')
    return {'targetLocationExact': data.get('location') == {'sheet': 'Draws', 'range': 'G20'},
            'sourceChecksumMatch': data.get('originalSha256') == doc['sha256'], 'noStore': no_store(r),
            'originalCellExact': len(cells) == 1 and cells[0].get('address') == 'G20' and cells[0].get('sheet') == 'Draws' and all(cells[0].get(k) == original.get(k) for k in fields)}


def deployed(args, audit):
    corpus, pres = Path(args.corpus).resolve(), Path(args.presentation).resolve()
    if any(p.is_relative_to(REPO) for p in (corpus, pres)):
        raise ValueError('private_store_required')
    index = read_json(corpus, 'index.json'); docs, chunks = index['documents'], index['chunks']
    plan = read_json(pres, 'data/athar-jv-month-timeline.json'); guide = read_json(pres, 'guide-script.json')
    deck = read_json(pres, 'data/deck-pdf.base64.json'); config = read_json(pres, 'presentation-config.json')
    embedded = read_json(pres, 'data/guide-audio.base64.json') if (pres/'data/guide-audio.base64.json').exists() else {}
    manifest = read_json(pres, 'public/guide-audio/manifest.json') if (pres/'public/guide-audio/manifest.json').exists() else embedded['manifest']
    clips = list(manifest['clips'].values()); citations = [next(c for c in chunks if c['documentId'] == d['id'] and c.get('text')) for d in docs]
    audit.record('private-input-counts', 'local-private-input', len(docs) == 4 and len(clips) == 21 and len({c['file'] for c in clips}) == 21)
    markers = set(strings([plan, guide, config, [c['text'] for c in chunks], [d['title'] for d in docs]]))
    deny = lambda r: clean_denial(r, markers)
    anon, a, b = (Client(args.url) for _ in range(3))
    dp = '/deck/' + quote(deck['name']); cp = '/api/citations/' + quote(citations[0]['id']); sp = '/api/sources/' + quote(docs[0]['id'])
    for name, path, method, body in [('shell', '/', 'GET', None), ('presentation', '/api/presentation', 'GET', None), ('manifest', '/guide-audio/manifest.json', 'GET', None), ('audio', '/guide-audio/'+quote(clips[0]['file']), 'GET', None), ('deck', dp, 'GET', None), ('documents', '/api/documents', 'GET', None), ('session', '/api/chat/session', 'POST', {}), ('query', '/api/chat/query', 'POST', {'sessionId': 'smoke-absent', 'query': ''}), ('citation', cp, 'GET', None), ('view', cp+'/view', 'GET', None), ('preview', sp+'/preview', 'GET', None), ('original', sp, 'GET', None)]:
        audit.check('anonymous-'+name, name, anon, path, (200, 401, 403) if name == 'shell' else (401, 403), deny, method, body)
    for i, path in enumerate(('/.env', '/.env.local', '/.git/config', '/raw/index.json', '/server/index.js', '/src/App.jsx', '/data/athar-jv-month-timeline.json', '/corpus/index.json', '/originals/source.pdf', '/scripts/ingest_documents.py', '/tests/security_smoke.py', '/protected/index.json')):
        audit.check(f'private-path-{i+1:02d}', 'private-path-probe', anon, path, 404, deny)
    for label, origin in [('missing', None), ('malformed', 'null'), ('foreign', 'https://outside.invalid')]:
        audit.check('login-origin-'+label, 'access', anon, '/api/access', 403, deny, 'POST', {'passphrase': ''}, origin)
    audit.check('invalid-code-once', 'access', anon, '/api/access', 401, deny, 'POST', {'passphrase': ''})
    code = os.environ.get('ATHAR_REVIEW_PASSPHRASE')
    if not code:
        audit.record('authorized-checks-require-existing-code', 'access', None); return
    for label, client in [('A', a), ('B', b)]:
        if not audit.check('authenticate-'+label, 'access', client, '/api/access', verify=lambda r: {'authenticated': json.loads(r[2]).get('authenticated') is True, 'cookieValid': cookie_ok(r, client.origin.startswith('https:')), 'noStore': no_store(r)}, method='POST', body={'passphrase': code}):
            audit.record('authorized-checks-dependent-on-login', 'access', None); return
    expected = dict(plan=plan, guideScript=guide, suggestedQuestions=config['suggestedQuestions'], deck=dict(filename=deck['name'], sha256=deck['sha256'], bytes=deck['bytes'], pages=deck['pages'], title=config['deck']['title'], pageTitles=config['deck']['pages']))
    audit.check('presentation-full-json', 'presentation', a, '/api/presentation', verify=lambda r: {'fullJsonExact': json.loads(r[2]) == expected, 'planHashMatch': canonical(json.loads(r[2]).get('plan')) == canonical(plan), 'guideHashMatch': canonical(json.loads(r[2]).get('guideScript')) == canonical(guide), 'noStore': no_store(r)})
    audit.check('manifest-full-json', 'manifest', a, '/guide-audio/manifest.json', verify=lambda r: {'fullJsonExact': json.loads(r[2]) == manifest, 'noStore': no_store(r)})
    for i, clip in enumerate(clips):
        rel = 'public/guide-audio/' + clip['file']; local = private_file(pres, rel).read_bytes() if (pres/rel).exists() else base64.b64decode(embedded['files'][clip['file']]['base64'], validate=True)
        audit.check(f'audio-download-{i+1:02d}', 'audio-download', a, '/guide-audio/'+quote(clip['file']), verify=lambda r: {'sourceChecksumMatch': sha(r[2]) == sha(local) == clip['sha256'], 'etagHashMatch': r[1].get('ETag') == '"'+clip['sha256']+'"', 'mime': r[1].get_content_type() == 'audio/mpeg', 'audioHeader': r[2].startswith(b'ID3') or (len(r[2]) > 1 and r[2][0] == 255 and r[2][1] & 224 == 224), 'noStore': no_store(r), 'nosniff': r[1].get('X-Content-Type-Options') == 'nosniff'})
    rel = 'public/deck/'+deck['name']; local = private_file(pres, rel).read_bytes() if (pres/rel).exists() else base64.b64decode(deck['base64'], validate=True)
    audit.check('deck-download', 'deck-download', a, dp, verify=lambda r: {'sourceChecksumMatch': sha(r[2]) == sha(local) == deck['sha256'], 'pdf': r[2].startswith(b'%PDF-') and r[1].get_content_type() == 'application/pdf', 'noStore': no_store(r)})
    for i, (doc, citation) in enumerate(zip(docs, citations)):
        original_hash = file_sha(private_file(corpus, doc['originalFile'])); source = '/api/sources/'+quote(doc['id']); citation_path = '/api/citations/'+quote(citation['id'])
        audit.check(f'original-{i+1}', 'original-download', a, source, verify=lambda r: {'sourceChecksumMatch': sha(r[2]) == original_hash == doc['sha256'], 'noStore': no_store(r)})
        audit.check(f'citation-{i+1}', 'citation', a, citation_path, verify=lambda r: {'indexExact': all(json.loads(r[2]).get(k) == citation[v] for k, v in [('id', 'id'), ('documentId', 'documentId'), ('location', 'location'), ('excerpt', 'text')]), 'noStore': no_store(r)})
        audit.check(f'view-{i+1}', 'source-view', a, citation_path+'/view', verify=lambda r: {'identityExact': json.loads(r[2]).get('citationId') == citation['id'] and json.loads(r[2]).get('documentId') == doc['id'], 'sourceChecksumMatch': json.loads(r[2]).get('originalSha256') == original_hash, 'noStore': no_store(r)})
        if doc['kind'] == 'pdf':
            audit.check('pdf-preview', 'source-preview', a, source+'/preview', verify=lambda r: {'sourceChecksumMatch': sha(r[2]) == original_hash == r[1].get('X-Source-SHA256'), 'mime': r[1].get_content_type() == 'application/pdf', 'noStore': no_store(r)})
    for name, path, method in [('document-index', '/api/documents', 'GET'), ('same-origin-index-retry', '/api/documents/retry', 'POST')]:
        audit.check(name, 'documents', a, path, verify=lambda r: {'documentIdsExact': {d['id'] for d in json.loads(r[2])['documents']} == {d['id'] for d in docs}, 'noStore': no_store(r)}, method=method)
    session = audit.check('owner-A-create-conversation', 'chat-session', a, '/api/chat/session', verify=lambda r: {'sessionCreated': bool(json.loads(r[2]).get('sessionId')), 'noStore': no_store(r)}, method='POST', body={})
    sid = json.loads(session[2])['sessionId'] if session else None
    if sid:
        audit.check('owner-B-cannot-query-A-before-AI', 'chat-query-owner-boundary', b, '/api/chat/query', 404, deny, 'POST', {'sessionId': sid, 'query': '', 'mode': 'sync'})
    else:
        audit.record('owner-isolation-dependency', 'chat-query-owner-boundary', None)
    audit.check('cross-origin-query-denied', 'chat-query-origin-boundary', a, '/api/chat/query', 403, deny, 'POST', {'sessionId': 'smoke-absent', 'query': '', 'mode': 'sync'}, 'https://outside.invalid')
    workbook = next(c for c in chunks if c['location'].get('sheet') == 'Draws'); doc = next(d for d in docs if d['id'] == workbook['documentId'])
    view = '/api/citations/'+quote(workbook['id'])+'/view'
    for label, params in [('unknown-sheet', {'sheet': '__smoke_absent_sheet__'}), ('over-200-cells', {'sheet': 'Draws', 'range': 'A1:A201'}), ('negative-page', {'page': '-1'}), ('bad-range', {'range': 'A0'})]:
        audit.check('view-rejects-'+label, 'invalid-source-location', a, view+'?'+U.urlencode(params), 400, deny)
    raw_file = private_file(corpus, doc['rawFile']); audit.record('raw-source-checksum', 'local-private-input', file_sha(raw_file) == doc['rawSha256'])
    with gzip.open(raw_file, 'rt', encoding='utf-8') as f:
        raw = next(r for line in f if (r := json.loads(line)).get('recordType') == 'cell' and r.get('sheet') == 'Draws' and r.get('cell', r.get('address')) == 'G20')
    audit.check('recovered-query-target-exact-cell', 'source-view-target', a, view+'?'+U.urlencode({'sheet': 'Draws', 'range': 'G20'}), verify=lambda r: cell_matches(r, raw, doc))
    if args.allow_raw_question and sid:
        result = audit.check('opt-in-raw-question-once', 'billable-chat-query', a, '/api/chat/query', verify=lambda r: {'rawAliasReturned': any(str(c.get('id', '')).startswith('src-raw-') for c in json.loads(r[2]).get('citations', []))}, method='POST', body={'sessionId': sid, 'query': 'What is the recorded value in Draws!G20? Cite the exact cell.', 'documentId': doc['id'], 'mode': 'sync'})
        if result:
            alias = next(c['id'] for c in json.loads(result[2])['citations'] if c.get('id', '').startswith('src-raw-')); path = '/api/citations/'+quote(alias)
            audit.check('raw-alias-owner', 'raw-citation', a, path, verify=lambda r: {'aliasExact': json.loads(r[2]).get('id') == alias, 'locationExact': json.loads(r[2]).get('location') == {'sheet': 'Draws', 'range': 'G20'}, 'rawProvenance': json.loads(r[2]).get('metadata', {}).get('rawSha256') == doc['rawSha256'], 'noStore': no_store(r)})
            audit.check('raw-alias-view-exact-cell', 'raw-source-view', a, path+'/view', verify=lambda r: {**cell_matches(r, raw, doc), 'highlightExact': json.loads(r[2]).get('highlights', {}).get('range') == 'G20'})
            for suffix in ('', '/view'):
                audit.check('raw-alias-other-owner'+('-view' if suffix else ''), 'raw-owner-boundary', b, path+suffix, 404, deny)


def self_test():
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    from threading import Thread
    class Fixture(BaseHTTPRequestHandler):
        def log_message(self, *args): pass
        def do_GET(self):
            self.send_response(302 if self.path == '/redirect' else 200)
            self.send_header('Location', '/must-not-follow')
            self.send_header('Set-Cookie', 'athar_review=synthetic-only; HttpOnly; SameSite=Strict; Path=/')
            self.send_header('Content-Type', 'application/json'); self.end_headers()
            self.wfile.write(json.dumps({'cookie': 'athar_review=synthetic-only' in self.headers.get('Cookie', '')}).encode())
    server = ThreadingHTTPServer(('127.0.0.1', 0), Fixture); thread = Thread(target=server.serve_forever, daemon=True); thread.start()
    try:
        c = Client(f'http://127.0.0.1:{server.server_port}'); r = c.request('/cookie')
        assert cookie_ok(r, False) and not cookie_ok(r, True) and json.loads(c.request('/echo')[2])['cookie']
        assert c.request('/redirect')[0] == 302
        for path in ('https://outside.invalid/', '//outside.invalid/', '/api/voice/audio/id?cap=synthetic'):
            try: c.request(path); raise AssertionError()
            except ValueError: pass
        try: output_path(REPO/'should-not-exist.json', [REPO]); raise AssertionError()
        except ValueError: pass
        a = Audit(); a.check('fixture', 'synthetic', c, '/ok', verify=lambda r: {'hashMatch': sha(r[2]) == sha(b'{"cookie": true}')})
        encoded = json.dumps(a.report()); assert a.report()['counts']['pass'] == 1 and 'synthetic-only' not in encoded and '127.0.0.1' not in encoded
        print(json.dumps({'selfTest': 'pass', 'checks': 5, 'realDocumentsRead': False, 'providerCalls': 0})); return 0
    finally:
        server.shutdown(); server.server_close(); thread.join()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for name in ('url', 'corpus', 'presentation', 'output'): p.add_argument('--'+name)
    p.add_argument('--self-test', action='store_true'); p.add_argument('--allow-raw-question', action='store_true', help='Billable: permit one Draws!G20 app question; no retry.')
    args = p.parse_args()
    if args.self_test: return self_test()
    if not all((args.url, args.corpus, args.presentation, args.output)): p.error('--url --corpus --presentation --output are required')
    output = output_path(args.output, [REPO, Path(args.corpus), Path(args.presentation)])
    audit = Audit(); started = time.monotonic()
    try: deployed(args, audit)
    except Exception: audit.record('remaining-checks-blocked', 'private-input-or-runner', None)
    report = audit.report(); report['elapsedMs'] = round((time.monotonic()-started)*1000, 2); report['rawQuestionOptIn'] = args.allow_raw_question
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as f: json.dump(report, f, indent=2); f.write('\n')
    print(json.dumps({'classification': report['classification'], 'counts': report['counts']}))
    return 1 if report['counts']['fail'] or report['counts']['blocked'] else 0


if __name__ == '__main__':
    try: raise SystemExit(main())
    except Exception: print('{"result":"blocked","reason":"runner-input-or-self-test"}'); raise SystemExit(2)
