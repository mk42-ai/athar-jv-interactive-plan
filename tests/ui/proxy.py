"""Loopback-only test fixture origin / optional real-API authentication broker.

No cookies, credentials, bodies, arbitrary URLs or request headers are logged.
A fresh server per case prevents fixture leakage between cases. Production
server enforcement and model grounding MUST be tested separately.
"""
from __future__ import annotations

from contextlib import contextmanager
from http.cookiejar import CookieJar
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import re
import threading
from urllib.error import HTTPError
from urllib.parse import urlsplit, unquote, urljoin
from urllib.request import HTTPCookieProcessor, HTTPRedirectHandler, Request, build_opener

PREFIX = '/__athar_ui__'
FIXTURE_A = 'ui-fixture-a'
FIXTURE_B = 'ui-fixture-b'
FIXTURE_PENDING = 'ui-fixture-pending'
MOCK_TEXT = 'MOCK UI fixture response. Synthetic presentation test only; not grounded evidence.'


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class FixtureState:
    def __init__(self, config, case):
        self.config, self.case = config, case
        self.controls = {
            'citation': 'ready', 'query': 'ready',
            'documents': 'error' if case == 'source-errors' else ('loading' if case == 'source-loading' else 'ready'),
        }
        self.requests = []
        self.auth_flags = None

    def summary(self):
        return {
            'classification': 'synthetic-fixtures-not-server-or-grounding-proof' if self.case else 'live-read-only-cookie-broker',
            'case': self.case, 'requests': list(self.requests), 'authFlags': self.auth_flags,
            'hmr': 'test-origin replaces development hot-reload client with inert module; app code/assets forwarded unchanged',
        }

    def control(self, body):
        allowed = {
            'citation': {'ready', 'error', 'denied', 'external', 'javascript', 'data'},
            'query': {'ready', 'error', 'denied', 'empty'},
            'documents': {'ready', 'error', 'loading', 'empty'},
        }
        if any(key not in allowed or value not in allowed[key] for key, value in body.items()):
            return False
        self.controls.update(body)
        return True

    def documents(self):
        return [
            {'id': FIXTURE_A, 'slug': 'executive-presentation', 'title': 'MOCK presentation fixture A',
             'status': 'ready', 'type': 'pdf', 'pageCount': 3},
            {'id': FIXTURE_B, 'slug': 'ui-fixture-b', 'title': 'MOCK document fixture B',
             'status': 'ready', 'type': 'pdf', 'pageCount': 2},
            {'id': FIXTURE_PENDING, 'slug': 'ui-fixture-pending', 'title': 'MOCK pending source',
             'status': 'processing', 'type': 'pdf', 'pageCount': 1},
        ]

    def response(self, method, path, payload):
        """Return status, content type, bytes, or None for non-API asset forwarding."""
        api = self.config['api']
        body = lambda value: json.dumps(value).encode()
        json_response = lambda status, value: (status, 'application/json', body(value))
        deny = lambda: json_response(401, {'code': 'unauthorized', 'message': 'MOCK review access required'})
        if path == PREFIX + '/probe':
            return json_response(200, self.summary())
        if path == PREFIX + '/control' and method == 'POST':
            return json_response(200 if self.control(payload) else 400, {'mock': True})
        if path == api['access']:
            self.requests.append({'kind': 'access', 'method': method})
            if method != 'GET':
                return deny()  # No real or fixture passphrase is ever accepted.
            return json_response(200, {'authenticated': self.case != 'auth-denied', 'configured': True})
        if path == api['health']:
            return json_response(200, self.config['mock']['health'])
        if not path.startswith('/api/'):
            return None
        if self.case == 'auth-denied':
            self.requests.append({'kind': 'protected-denied', 'method': method})
            return deny()
        if path in (api['documents'], api['retryDocuments']):
            self.requests.append({'kind': 'documents', 'method': method, 'state': self.controls['documents']})
            if self.controls['documents'] == 'error':
                return json_response(503, {'message': 'MOCK source loading failure'})
            documents = [] if self.controls['documents'] == 'empty' else self.documents()
            if self.case == 'context-missing':
                documents = [d for d in documents if d['id'] != FIXTURE_A]
            if self.controls['documents'] == 'loading':
                documents = [{**d, 'status': 'processing'} for d in documents]
            return json_response(200, {'documents': documents, 'mock': True})
        if path == api['session']:
            self.requests.append({'kind': 'session', 'method': method})
            return json_response(200, {'sessionId': 'mock-ui-session', 'externalUserId': 'mock-ui-user'})
        if path == api['query']:
            selected = payload.get(self.config['mock']['documentField'])
            slide = payload.get(self.config['mock']['slideField'])
            self.requests.append({
                'kind': 'query', 'method': method,
                'documentId': selected if selected in (FIXTURE_A, FIXTURE_B, FIXTURE_PENDING, 'all') else 'unknown-or-missing',
                'slide': slide if isinstance(slide, int) and not isinstance(slide, bool) else None,
                'queryNonempty': bool(payload.get('query')), 'state': self.controls['query'],
            })
            if self.controls['query'] == 'denied':
                return deny()
            if self.controls['query'] == 'error':
                return json_response(503, {'message': 'MOCK chat transport failure'})
            citation = {'id': 'ui-citation-a', 'documentId': FIXTURE_A,
                        'label': 'MOCK fixture citation', 'location': {'page': 1}}
            answer = '' if self.controls['query'] == 'empty' else MOCK_TEXT
            frames = [{'type': 'delta', 'text': answer},
                      {'type': 'done', 'answer': answer, 'messageId': 'mock-ui-message',
                       'citations': [citation] if answer else [],
                       'grounding': {'status': 'mock', 'mock': True}}]
            return 200, 'text/event-stream', ''.join('data: ' + json.dumps(e) + '\n\n' for e in frames).encode()
        if re.match(api['citationPattern'], path):
            self.requests.append({'kind': 'citation', 'method': method, 'state': self.controls['citation']})
            scenario = self.controls['citation']
            if scenario == 'denied':
                return deny()
            if scenario == 'error':
                return json_response(503, {'message': 'MOCK citation unavailable'})
            original = {
                'ready': self.config['mock']['citationOriginal'],
                'external': 'https://example.invalid/mock-source',
                'javascript': 'javascript:void(0)',
                'data': 'data:text/plain,MOCK',
            }[scenario]
            return json_response(200, {'id': 'ui-citation-a', 'documentId': FIXTURE_A,
                                      'location': {'page': 1}, 'excerpt': 'MOCK excerpt; synthetic test, not source evidence.',
                                      'originalUrl': original, 'mock': True})
        if re.match(api['originalPattern'], path):
            self.requests.append({'kind': 'original-denied', 'method': method})
            # No real corpus or pseudo-PDF is served. Tests inspect link policy, not content.
            return deny()
        self.requests.append({'kind': 'unrecognized-api-denied', 'method': method})
        return json_response(501, {'message': 'MOCK route not configured; adjust tests/ui/config.json'})


# Vite HMR is not an application feature under test. Avoid false websocket
# connection errors on a temporary fixture origin without another browser stack.
HMR_STUB = b'''export function createHotContext(){return {data:{},accept(){},acceptExports(){},dispose(){},prune(){},invalidate(){},on(){},off(){},send(){}}}
export function updateStyle(id,css){let e=document.querySelector('style[data-ui-hmr="'+CSS.escape(id)+'"]');if(!e){e=document.createElement('style');e.dataset.uiHmr=id;document.head.append(e)}e.textContent=css}
export function removeStyle(id){document.querySelector('style[data-ui-hmr="'+CSS.escape(id)+'"]')?.remove()}
export function injectQuery(url){return url}
'''


# Authorized mode has its own fixed route/body policy. Config overrides never widen it.
ID = re.compile(r'[A-Za-z0-9_-]{1,160}\Z')
REAL_POST = {'/api/chat/session', '/api/chat/query', '/api/documents/retry'}
REAL_GET = {'/', '/favicon.ico', '/favicon.svg', '/@vite/client',
            '/api/access', '/api/health', '/api/documents', '/api/guide/config', '/api/presentation'}
REAL_DYNAMIC = re.compile(r'/api/(?:citations|sources)/[A-Za-z0-9_-]{1,160}\Z')
PUBLIC_ASSETS = ('/assets/', '/deck/', '/guide-audio/', '/fonts/')


def real_origin(value):
    u = urlsplit(value)
    local = u.hostname in ('127.0.0.1', 'localhost', '::1')
    preview = u.scheme == 'https' and bool(re.fullmatch(r'sb-[a-zA-Z0-9-]+\.vercel\.run', u.hostname or ''))
    if (u.scheme not in ('http', 'https') or not (local or preview) or u.username
            or u.password or u.query or u.fragment or u.path not in ('', '/')):
        raise ValueError('authorized broker requires a loopback or sandbox app origin')
    return value.rstrip('/')


def real_path(target):
    # Reject alternate encodings instead of normalizing a route into the allowlist.
    u = urlsplit(target)
    cache_bust = u.path == '/guide-audio/manifest.json' and bool(re.fullmatch(r't=[0-9]{10,16}', u.query))
    if (not target.startswith('/') or target.startswith('//') or u.scheme or u.netloc
            or (u.query and not cache_bust) or u.fragment or unquote(target) != target or '\\' in target
            or any(part in ('.', '..') for part in target.split('/'))
            or any(ord(c) < 33 or ord(c) > 126 for c in target)):
        return None
    return u.path


def real_body(path, raw):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('duplicate field')
            result[key] = value
        return result
    try:
        body = json.loads(raw or b'{}', object_pairs_hook=unique,
                          parse_constant=lambda _: (_ for _ in ()).throw(ValueError()))
        if not isinstance(body, dict):
            return None
        if path == '/api/documents/retry':
            return body if not body else None
        if path == '/api/chat/session':
            return body if set(body) <= {'externalUserId'} and ('externalUserId' not in body or
                isinstance(body['externalUserId'], str) and ID.fullmatch(body['externalUserId'])) else None
        if path != '/api/chat/query' or not set(body) <= {'sessionId', 'query', 'documentId', 'slide', 'voice', 'externalUserId', 'mode'}:
            return None
        if not all(isinstance(body.get(k), str) and ID.fullmatch(body[k]) for k in ('sessionId', 'documentId')):
            return None
        if not isinstance(body.get('query'), str) or not body['query'].strip() or len(body['query']) > 4000:
            return None
        if body.get('slide') is not None and (type(body['slide']) is not int or not 1 <= body['slide'] <= 10000):
            return None
        if 'voice' in body and body['voice'] is not False:
            return None
        if 'externalUserId' in body and not (isinstance(body['externalUserId'], str) and ID.fullmatch(body['externalUserId'])):
            return None
        if 'mode' in body and body['mode'] not in ('sync', 'stream'):
            return None
        return body
    except (ValueError, TypeError, UnicodeError):
        return None


class RealState:
    """Only IDs, counts, booleans and HTTP metadata survive response inspection."""
    def __init__(self, upstream):
        self.upstream = upstream
        self.requests, self.sources = [], []
        self.auth_flags = None
        self.lock = threading.RLock()

    def summary(self):
        with self.lock:
            return {'classification': 'live-authorized-real-api-not-mock',
                    'authMode': 'in-memory-real-api-broker', 'authFlags': self.auth_flags,
                    'browserOrigin': 'loopback broker; NOT the deployed browser origin',
                    'assets': 'upstream bytes unchanged; no HMR stub or script injection',
                    'requestCount': len(self.requests), 'requests': [dict(r) for r in self.requests],
                    'sources': [dict(s) for s in self.sources]}

    def begin(self, method, path, payload):
        kinds = {'/api/chat/query': 'query', '/api/chat/session': 'session',
                 '/api/documents': 'documents', '/api/documents/retry': 'documents', '/api/access': 'access'}
        kind = kinds.get(path, 'citation' if path.startswith('/api/citations/') else 'source' if path.startswith('/api/sources/') else 'asset')
        item = {'method': method, 'path': path, 'kind': kind, 'status': None, 'complete': False}
        if method == 'POST' and kind == 'query':
            known = {d['id'] for d in self.sources} | {'all'}
            item.update(documentId=payload['documentId'] if payload['documentId'] in known else 'unknown',
                        slide=payload.get('slide'), queryNonempty=bool(payload.get('query')))
        with self.lock:
            self.requests.append(item)
        return item

    def observe(self, item, raw, content_type):
        """Inspect a bounded copy, never change bytes sent to the browser."""
        safe_id = lambda v: isinstance(v, str) and bool(ID.fullmatch(v))
        try:
            if 'event-stream' in content_type:
                frames = [json.loads(line[5:].strip()) for line in raw.decode().splitlines()
                          if line.startswith('data:') and line[5:].strip() != '[DONE]']
                item['errorFrameCount'] = sum(f.get('type') == 'error' for f in frames)
                done = [f for f in frames if f.get('type') == 'done']
                item['doneFrameCount'] = len(done)
                data = done[-1] if done else {}
            else:
                data = json.loads(raw)
            if not isinstance(data, dict):
                return
            with self.lock:
                if item['kind'] == 'documents' and isinstance(data.get('documents'), list):
                    allowed_slugs = {'executive-presentation', 'financial-summary', 'financial-model', 'implementation-plan'}
                    sources = []
                    for d in data['documents']:
                        if not isinstance(d, dict) or not safe_id(d.get('id')) or d.get('slug') not in allowed_slugs:
                            continue
                        status = d.get('status')
                        if isinstance(status, dict):
                            status = status.get('state', status.get('status'))
                        sources.append({'id': d['id'], 'slug': d['slug'],
                                        'kind': d.get('kind') if d.get('kind') in ('pdf', 'pptx', 'xlsx') else 'unknown',
                                        'ready': status == 'ready'})
                    self.sources = sources
                    item['documentCount'] = len(data['documents'])
                elif item['kind'] == 'query':
                    citations = data.get('citations', [])
                    valid = []
                    for c in citations if isinstance(citations, list) else []:
                        if isinstance(c, dict) and safe_id(c.get('id')) and safe_id(c.get('documentId')):
                            expected = '/api/citations/' + c['id']
                            valid.append({'id': c['id'], 'documentId': c['documentId'],
                                          'urlMatchesId': c.get('url') == expected})
                    ground = data.get('grounding') or {}
                    item.update(answerNonempty=isinstance(data.get('answer'), str) and bool(data['answer'].strip()),
                                citationCount=len(citations) if isinstance(citations, list) else 0, citations=valid,
                                retrievedIds=[v for v in ground.get('retrievedIds', []) if safe_id(v)][:100],
                                groundingValidated=ground.get('validated') is True)
                elif item['kind'] == 'citation':
                    original = data.get('originalUrl', '')
                    url = urlsplit(urljoin(self.upstream + '/', original)) if isinstance(original, str) else urlsplit('')
                    base = urlsplit(self.upstream)
                    same = (url.scheme, url.netloc) == (base.scheme, base.netloc) and not url.username and not url.password and not url.query and not url.fragment
                    source_path = bool(re.fullmatch(r'/api/sources/[A-Za-z0-9_-]{1,160}', url.path))
                    item.update(citationId=data.get('id') if safe_id(data.get('id')) else None,
                                documentId=data.get('documentId') if safe_id(data.get('documentId')) else None,
                                excerptNonempty=isinstance(data.get('excerpt'), str) and bool(data['excerpt'].strip()),
                                originalSameOriginApi=bool(same and source_path),
                                originalPath=url.path if same and source_path else None)
        except (ValueError, TypeError, AttributeError, UnicodeError):
            item['metadataInvalid'] = True


@contextmanager
def test_origin(upstream, config, case=None, passphrase='', authorized=False):
    """Credentials stay in Python memory; browser never receives a cookie/secret."""
    if authorized:
        upstream = real_origin(upstream)
        if case or not passphrase:
            raise ValueError('authorized mode requires real env authorization and no mock case')
    jar = CookieJar()
    opener = build_opener(NoRedirect(), HTTPCookieProcessor(jar))
    state = RealState(upstream) if authorized else FixtureState(config, case)
    if passphrase:
        request = Request(upstream + ('/api/access' if authorized else config['api']['access']),
                          data=json.dumps({'passphrase': passphrase}).encode(),
                          headers={'Content-Type': 'application/json', 'Origin': upstream}, method='POST')
        try:
            with opener.open(request, timeout=20) as response:
                payload = json.load(response)
            cookies = list(jar)
            http_only = bool(cookies) and all(c.has_nonstandard_attr('HttpOnly') or c.has_nonstandard_attr('httponly') for c in cookies)
            if payload.get('authenticated') is not True or not http_only:
                raise ValueError('authentication broker rejected access contract')
            state.auth_flags = {'authenticated': True, 'enabled': payload.get('enabled'),
                                'httpOnly': True, 'browserCookieExposed': False}
        except Exception:
            jar.clear()
            raise ValueError('authentication unavailable; credential and response omitted') from None
        finally:
            passphrase = ''
            request = None
    lock = threading.Lock()

    def real_dispatch(handler):
        expected_host = f'127.0.0.1:{handler.server.server_port}'
        expected_origin = f'http://{expected_host}'
        def deny(status):
            handler.close_connection = True  # Do not parse unread/rejected bodies as a second request.
            return handler.respond(status, 'application/json', b'{"error":"authorized-broker-policy"}')
        if (handler.headers.get_all('Host') != [expected_host]
                or handler.headers.get('Sec-Fetch-Site') not in (None, 'same-origin', 'none')
                or handler.headers.get_all('Origin', []) not in ([], [expected_origin])):
            return deny(403)
        path = real_path(handler.path)
        if path is None:
            return deny(400)
        method = handler.command
        if method not in ('GET', 'HEAD', 'POST'):
            return deny(405)
        if handler.headers.get('Transfer-Encoding') or len(handler.headers.get_all('Content-Length', [])) > 1:
            return deny(400)
        length_value = handler.headers.get('Content-Length', '0')
        if not re.fullmatch(r'[0-9]{1,6}', length_value):
            return deny(400)
        length = int(length_value)
        if length > 12288:
            return deny(413)
        if method != 'POST' and length:
            return deny(400)
        raw, payload = None, {}
        if method == 'POST':
            if path not in REAL_POST or handler.headers.get_all('Origin') != [expected_origin]:
                return deny(403)
            if (length and handler.headers.get('Content-Type', '').split(';')[0].strip().lower() != 'application/json'):
                return deny(415)
            handler.connection.settimeout(5)
            raw = handler.rfile.read(length) if length else b''
            if len(raw) != length:
                return deny(400)
            payload = real_body(path, raw)
            if payload is None:
                return deny(400)
        elif path == PREFIX + '/probe':
            return handler.respond(200, 'application/json', json.dumps(state.summary()).encode())
        elif not (path in REAL_GET or REAL_DYNAMIC.fullmatch(path) or path.startswith(PUBLIC_ASSETS)
                  or re.fullmatch(r'/api/guide-audio/[A-Za-z0-9_.-]+\.(?:mp3|json)', path)):
            return deny(403)
        headers = {'Accept-Encoding': 'identity'}
        for name in ('Range', 'Accept', 'If-Range'):
            if handler.headers.get(name):
                headers[name] = handler.headers[name]
        if method == 'POST':
            headers.update({'Origin': upstream, 'Content-Type': 'application/json'})
        # No browser-supplied cookies, auth, forwarding headers, host or arbitrary URL.
        req = Request(upstream + handler.path, headers=headers, data=raw, method=method)
        item = state.begin(method, path, payload)
        try:
            try:
                response = opener.open(req, timeout=105 if path == '/api/chat/query' else 30)
            except HTTPError as error:
                response = error
            with response:
                item['status'] = response.status
                if 300 <= response.status < 400:
                    item['redirectDenied'] = True
                    return deny(502)
                handler.send_response(response.status)
                blocked = {'set-cookie', 'set-cookie2', 'authorization', 'proxy-authorization',
                           'www-authenticate', 'proxy-authenticate', 'connection', 'keep-alive',
                           'transfer-encoding', 'te', 'trailer', 'upgrade', 'server', 'date'}
                blocked.update(n.strip().lower() for n in response.headers.get('Connection', '').split(','))
                for key, value in response.headers.items():
                    if key.lower() not in blocked:
                        handler.send_header(key, value)
                handler.send_header('Connection', 'close')
                handler.close_connection = True
                handler.end_headers()
                copied = bytearray()
                inspect = method != 'HEAD' and item['kind'] in ('documents', 'query', 'citation')
                count, too_large = 0, False
                while method != 'HEAD':
                    chunk = response.read1(65536)
                    if not chunk:
                        break
                    count += len(chunk)
                    if inspect and not too_large:
                        if len(copied) + len(chunk) <= 2 * 1024 * 1024:
                            copied.extend(chunk)
                        else:
                            too_large = True
                            copied.clear()
                    handler.wfile.write(chunk)
                    handler.wfile.flush()
                if inspect and not too_large:
                    state.observe(item, copied, response.headers.get('Content-Type', ''))
                item.update(byteCount=count, complete=True, metadataOverLimit=too_large)
        except Exception:
            # Never emit/log exception details or turn a truncated stream into success.
            item['transportFailed'] = True
            handler.close_connection = True
            if item['status'] is None:
                item['status'] = 502
                return deny(502)

    class Handler(BaseHTTPRequestHandler):
        protocol_version = 'HTTP/1.1'

        def log_message(self, *_):
            pass

        def log_error(self, *_):
            pass

        def respond(self, status, content_type, data, extra=()):
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            for key, value in extra:
                self.send_header(key, value)
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(data)

        def dispatch(self):
            if authorized:
                return real_dispatch(self)
            expected_host = f'127.0.0.1:{self.server.server_port}'
            origin = self.headers.get('Origin')
            if self.headers.get('Host') != expected_host or self.headers.get('Sec-Fetch-Site') == 'cross-site' or (origin and origin != f'http://{expected_host}'):
                return self.respond(403, 'application/json', b'{"error":"test-origin-only"}')
            path = urlsplit(self.path).path
            if not self.path.startswith('/') or self.path.startswith('//') or '..' in path.split('/'):
                return self.respond(400, 'application/json', b'{}')
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length > 1024 * 1024:
                    return self.respond(413, 'application/json', b'{}')
                raw = self.rfile.read(length) if length else b''
                payload = json.loads(raw) if raw else {}
                if not isinstance(payload, dict):
                    payload = {}
            except (ValueError, TypeError):
                payload = {}
            if path == '/@vite/client':
                return self.respond(200, 'application/javascript', HMR_STUB)
            if case:
                with lock:
                    fixture = state.response(self.command, path, payload)
                if fixture is not None:
                    return self.respond(*fixture)
            if path.startswith(PREFIX):
                return self.respond(404, 'application/json', b'{}')
            if self.command not in ('GET', 'HEAD'):
                return self.respond(403, 'application/json', b'{"error":"read-only-test-broker"}')
            headers = {'Accept-Encoding': 'identity'}
            if self.headers.get('Range'):
                headers['Range'] = self.headers['Range']
            req = Request(upstream + self.path, headers=headers, method=self.command)
            try:
                response = opener.open(req, timeout=30)
            except HTTPError as error:
                response = error
            except Exception:
                return self.respond(502, 'application/json', b'{"error":"upstream-unavailable"}')
            with response:
                # No redirect, Set-Cookie, auth header, absolute URL or upstream body logging.
                if 300 <= response.status < 400:
                    return self.respond(502, 'application/json', b'{"error":"redirect-not-permitted"}')
                data = response.read()
                extra = [(key, response.headers[key]) for key in ('Content-Range', 'Accept-Ranges') if key in response.headers]
                return self.respond(response.status, response.headers.get('Content-Type', 'application/octet-stream'), data, extra)

        do_GET = do_HEAD = do_POST = do_PUT = do_DELETE = do_PATCH = do_OPTIONS = dispatch

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    server.daemon_threads = True
    server.handle_error = lambda *_: None
    thread = threading.Thread(target=server.serve_forever, name='athar-ui-test-origin', daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{server.server_port}', state
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)
        jar.clear()
        state.requests.clear()
