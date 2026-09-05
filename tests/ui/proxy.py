"""Loopback-only test fixture origin / optional read-only authentication broker.

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
from urllib.parse import urlsplit
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


@contextmanager
def test_origin(upstream, config, case=None, passphrase=''):
    """Credentials stay in Python memory; browser never receives a cookie/secret."""
    jar = CookieJar()
    opener = build_opener(NoRedirect(), HTTPCookieProcessor(jar))
    state = FixtureState(config, case)
    if passphrase:
        request = Request(upstream + config['api']['access'],
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

        do_GET = do_HEAD = do_POST = do_PUT = do_DELETE = dispatch

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
