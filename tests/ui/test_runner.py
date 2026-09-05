"""Offline harness tests. No Chromium, app, credentials or remote API required."""
import argparse
import base64
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import io
import struct
import subprocess
import os
from pathlib import Path
import secrets
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import proxy
import run


def fixture_config():
    return json.loads((run.HERE / 'config.json').read_text())


class RunnerTests(unittest.TestCase):
    def test_url_rejects_secret_bearing_or_unsupported_targets(self):
        for value in ('https://user:secret@example.invalid', 'http://localhost:5173/?token=x',
                      'http://localhost:5173/#secret', 'https://example.invalid',
                      'https://sb-x.vercel.run/api/signed-url'):
            with self.subTest(kind='invalid URL'), self.assertRaises(argparse.ArgumentTypeError):
                run.safe_url(value)
        for value in ('http://localhost:5173', 'http://127.0.0.1:5173', 'https://sb-fixture.vercel.run'):
            self.assertTrue(run.safe_url(value))

    def test_viewport_and_sha_are_bounded(self):
        self.assertEqual(run.viewport('390x844'), '390x844')
        self.assertEqual(run.sha('ABCDEF1'), 'abcdef1')
        for value in ('0x844', '-390x844', '390', '390x1000000'):
            with self.assertRaises(argparse.ArgumentTypeError): run.viewport(value)
        with self.assertRaises(argparse.ArgumentTypeError): run.sha('not-a-build-sha')

    def test_contract_is_exact_completed_baseline_copy(self):
        import hashlib
        digest = hashlib.sha256((run.HERE / 'assertions-contract.json').read_bytes()).hexdigest()
        self.assertEqual(digest, '77b7ca52399937ab2c3db0027d11b4ad62fe9637d0dc234b4cee3d2e4c0fee1b')
        contract = json.loads((run.HERE / 'assertions-contract.json').read_text())
        self.assertEqual(tuple(contract['viewportList']), run.DEFAULT_VIEWPORTS)
        self.assertEqual(len(contract['perStage']), 7)
        self.assertEqual(len(contract['perInteraction']), 16)

    def test_missing_stage_checks_fail_even_if_transport_is_truthy(self):
        data = {'ok': True, 'checks': [{'id':'exact-requested-viewport','ok':True}], 'endUTC':run.utc()}
        failed = run.contract_failures(data, 'stage')
        self.assertIn('playing-collapsed:highlight-registration', failed)
        self.assertIn('guide-started', failed)

    def test_complete_stage_contract_passes_then_duplicate_fails(self):
        contract = json.loads((run.HERE / 'assertions-contract.json').read_text())
        keys = contract['perInteraction'] + [f'{a}:{b}' for a in contract['stages'] for b in contract['perStage']]
        data = {'checks':[{'id':x,'ok':True} for x in keys], 'endUTC':run.utc()}
        self.assertEqual(run.contract_failures(data,'stage'), [])
        data['checks'].append({'id':keys[0],'ok':True})
        self.assertIn(keys[0], run.contract_failures(data,'stage'))

    def test_every_extended_case_has_required_assertions(self):
        contract = json.loads((run.HERE / 'extended-contract.json').read_text())
        self.assertEqual(set(contract), set(run.CASES))
        for case, keys in contract.items():
            self.assertGreaterEqual(len(keys), 3)
            self.assertEqual(len(keys), len(set(keys)))
            data = {'case':case, 'checks':[{'id':key,'ok':True} for key in keys+['exact-requested-viewport']], 'endUTC':run.utc()}
            self.assertEqual(run.contract_failures(data,'extended'), [])

    def test_evidence_transport_and_truncation(self):
        expected={'checks':[{'id':'test','ok':True}],'endUTC':run.utc()}
        text=base64.b64encode(json.dumps(expected).encode()).decode()
        chunks=[text[i:i+30] for i in range(0,len(text),30)]
        assertions=[{'target':f'window.__atharTransport({i},30)',
                     'detail':json.dumps(json.dumps({'chunk':part,'more':i<len(chunks)-1}))}
                    for i,part in enumerate(chunks)]
        self.assertEqual(run.parse_transport({'assertions':assertions}, 100, 30), expected)
        with self.assertRaises(ValueError): run.parse_transport({'assertions':assertions[:-1]}, 100, 30)
        assertions[0]['detail']='truncated'
        with self.assertRaises(ValueError): run.parse_transport({'assertions':assertions},100,30)

    def test_redaction_keeps_metrics_not_secrets_or_urls(self):
        sentinel=secrets.token_urlsafe(32)
        data=run.sanitize({'sessionId':sentinel,'cookie':sentinel,'answer':'not retained',
                           'file':'https://example.invalid/signed?secret='+sentinel,
                           'nested':['value '+sentinel], 'target':{'bounds':{'w':44}}},(sentinel,))
        output=json.dumps(data)
        self.assertFalse(sentinel in output)
        self.assertFalse('https://' in output)
        self.assertNotIn('sessionId',data)
        self.assertNotIn('answer',data)
        self.assertEqual(data['target']['bounds']['w'],44)

    def test_build_command_does_not_copy_environment_secret(self):
        args=run.parser().parse_args(['--url','http://localhost:5173','--stage','after','--mode','stage'])
        sentinel=secrets.token_urlsafe(32)
        with patch.dict(os.environ,{'ATHAR_REVIEW_PASSPHRASE':sentinel}):
            command,timeout,source=run.build_command(args,fixture_config(),'stage',None,'390x844',
                                                   args.url,Path('/fixture/ui_validate.py'),'after-stage')
        self.assertFalse(sentinel in json.dumps(command))
        self.assertNotIn('--out-dir',command)
        self.assertIn('--viewport-only',command)
        self.assertNotIn('__RUN_CONFIG__',command[command.index('--eval')+1])
        self.assertEqual(timeout,300)

    def test_negative_console_allowance_is_bounded_by_mock_requests(self):
        resource = 'Failed to load resource: the server responded with a status of 503 (Unavailable)'
        summary = {'requests':[{'kind':'documents','state':'error'}]}
        self.assertEqual(run.classify_console([resource], summary),
                         {'expectedMockHttpErrorCount':1,'unexpectedConsoleErrorCount':0})
        self.assertEqual(run.classify_console([resource,resource,'TypeError: app failed'], summary),
                         {'expectedMockHttpErrorCount':1,'unexpectedConsoleErrorCount':2})
        self.assertEqual(run.classify_console([resource], None)['unexpectedConsoleErrorCount'],1)

    def test_fake_validator_report_is_sanitized_and_not_browser_proof(self):
        args=run.parser().parse_args(['--url','http://localhost:5173','--stage','after','--mode','stage','--polls','1','--max-chunks','1000'])
        contract=json.loads((run.HERE/'assertions-contract.json').read_text())
        ids=contract['perInteraction']+[f'{a}:{b}' for a in contract['stages'] for b in contract['perStage']]
        evidence={'checks':[{'id':key,'ok':True} for key in ids],'endUTC':run.utc()}
        b64=base64.b64encode(json.dumps(evidence).encode()).decode()
        parts=[b64[i:i+112] for i in range(0,len(b64),112)]
        sentinel=secrets.token_urlsafe(32)
        with tempfile.TemporaryDirectory(prefix='ui-unit-fixture-') as temporary:
            root=Path(temporary);proof=root/'.ui-proof';proof.mkdir()
            image=proof/'fake-validator.png'
            # A PNG header tests only dimension parsing; this is NOT browser proof.
            image.write_bytes(b'\x89PNG\r\n\x1a\n'+b'\0'*8+struct.pack('>II',390,844))
            report={'ok':True,'httpStatus':200,'title':sentinel,'screenshots':[str(image)],
                    'consoleErrors':[],'pageErrors':[],'failedRequests':[],
                    'assertions':[{'ok':True,'target':f'window.__atharTransport({i},112)',
                                   'detail':json.dumps(json.dumps({'chunk':part,'more':i<len(parts)-1}))}
                                  for i,part in enumerate(parts)]+[{'ok':True,'target':sentinel,'detail':sentinel}]}
            result=subprocess.CompletedProcess([],0,json.dumps(report),sentinel)
            stream=io.StringIO()
            with patch('run.Path.cwd',return_value=root), patch('run.subprocess.run',return_value=result) as mocked, patch('sys.stdout',stream), patch.dict(os.environ,{'ATHAR_REVIEW_PASSPHRASE':sentinel}):
                code=run.execute(args,fixture_config(),Path('/fixture/ui_validate.py'),'stage',None,'390x844')
            self.assertEqual(code,0)
            content=(proof/'after-stage-390x844.json').read_text()
            self.assertFalse(sentinel in content+stream.getvalue())
            self.assertNotIn('ATHAR_REVIEW_PASSPHRASE',mocked.call_args.kwargs['env'])
            self.assertFalse(json.loads(content)['runner']['rawOutputPersisted'])
            self.assertEqual(len(list(proof.glob('*.json'))),1)

    def test_mock_filter_records_only_whitelisted_context(self):
        state=proxy.FixtureState(fixture_config(),'context')
        sentinel=secrets.token_urlsafe(32)
        state.response('POST','/api/chat/query',{'documentId':'ui-fixture-b','slide':2,'query':sentinel,'sessionId':sentinel})
        item=state.requests[-1]
        self.assertEqual(item['documentId'],'ui-fixture-b')
        self.assertEqual(item['slide'],2)
        self.assertFalse(sentinel in json.dumps(state.summary()))

    def test_mock_access_and_unknown_routes_fail_closed(self):
        state=proxy.FixtureState(fixture_config(),'auth-denied')
        status,_,body=state.response('GET','/api/access',{})
        self.assertEqual(status,200)
        self.assertEqual(json.loads(body),{'authenticated':False,'configured':True})
        for route in ('/api/citations/ui-citation-a','/api/documents/ui-fixture-a/original','/api/chat/query'):
            self.assertEqual(state.response('GET',route,{})[0],401)
        self.assertEqual(proxy.FixtureState(fixture_config(),'context').response('POST','/api/new-unknown',{})[0],501)

    def test_mock_source_scenarios_and_unsafe_citation_links(self):
        config=fixture_config()
        for case,expected in (('source-errors',503),('source-loading',200),('context-missing',200)):
            state=proxy.FixtureState(config,case)
            status,_,body=state.response('GET','/api/documents',{})
            self.assertEqual(status,expected)
            if case=='source-loading': self.assertTrue(all(d['status']=='processing' for d in json.loads(body)['documents']))
            if case=='context-missing': self.assertFalse(any(d['id']=='ui-fixture-a' for d in json.loads(body)['documents']))
        state=proxy.FixtureState(config,'citations')
        for mode in ('external','javascript','data'):
            self.assertTrue(state.control({'citation':mode}))
            self.assertTrue(json.loads(state.response('GET','/api/citations/ui-citation-a',{})[2])['mock'])
        self.assertFalse(state.control({'arbitrary':'setting'}))

    def test_loopback_mock_server_does_not_contact_upstream(self):
        with proxy.test_origin('http://127.0.0.1:1',fixture_config(),case='auth-denied') as (url,state):
            with urlopen(url+'/api/access') as response:
                self.assertFalse(json.load(response)['authenticated'])
                self.assertIsNone(response.headers.get('Set-Cookie'))
            with self.assertRaises(HTTPError) as error:
                urlopen(Request(url+'/api/access',headers={'Origin':'https://example.invalid'}))
            self.assertEqual(error.exception.code,403)

    def test_cookie_broker_keeps_httponly_cookie_out_of_browser(self):
        sentinel=secrets.token_urlsafe(32)
        auth_seen=[]
        class Upstream(BaseHTTPRequestHandler):
            def log_message(self,*args): pass
            def do_POST(self):
                body=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                auth_seen.append(body.get('passphrase')==sentinel)
                self.send_response(200)
                self.send_header('Set-Cookie','fixture-access='+sentinel+'; HttpOnly; Path=/; SameSite=Strict')
                self.end_headers();self.wfile.write(b'{"authenticated":true,"enabled":true}')
            def do_GET(self):
                authenticated=sentinel in self.headers.get('Cookie','')
                self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers()
                self.wfile.write(json.dumps({'authenticated':authenticated,'enabled':True}).encode())
        server=ThreadingHTTPServer(('127.0.0.1',0),Upstream)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            with proxy.test_origin(f'http://127.0.0.1:{server.server_port}',fixture_config(),passphrase=sentinel) as (url,state):
                with urlopen(url+'/api/access') as response:
                    self.assertTrue(json.load(response)['authenticated'])
                    self.assertIsNone(response.headers.get('Set-Cookie'))
                self.assertTrue(state.auth_flags['httpOnly'])
                self.assertFalse(sentinel in json.dumps(state.summary()))
                with self.assertRaises(HTTPError) as error:
                    urlopen(Request(url+'/api/chat/query',data=b'{}',method='POST'))
                self.assertEqual(error.exception.code,403)
            self.assertTrue(all(auth_seen))
        finally:
            server.shutdown();server.server_close();thread.join(timeout=3)


class AuthorizedTests(unittest.TestCase):
    @contextmanager
    def upstream(self):
        """Private offline fixture only; no real passphrase/model/content involved."""
        secret = secrets.token_urlsafe(32)
        calls = []
        source = {'id': 'doc-financial', 'slug': 'financial-summary', 'kind': 'pdf',
                  'title': secret, 'status': {'state': 'ready'}}
        answer = {'type': 'done', 'answer': secret, 'sessionId': secret,
                  'citations': [{'id': 'cite-one', 'documentId': 'doc-financial',
                                'label': secret, 'url': '/api/citations/cite-one'}],
                  'grounding': {'retrievedIds': ['cite-one'], 'validated': True}}
        stream = ('data: ' + json.dumps(answer) + '\n\n').encode()
        bodies = {'/api/documents': json.dumps({'documents': [source]}).encode(),
                  '/api/citations/cite-one': json.dumps({'id': 'cite-one', 'documentId': 'doc-financial',
                      'excerpt': secret, 'originalUrl': '/api/sources/doc-financial'}).encode(),
                  '/api/chat/query': stream, '/api/chat/session': json.dumps({'sessionId': secret}).encode(),
                  '/api/documents/retry': json.dumps({'documents': [source]}).encode(),
                  '/@vite/client': b'// REAL UPSTREAM MODULE, unchanged', '/assets/app.js': b'// app bytes',
                  '/guide-audio/manifest.json?t=1777777777777': b'{"clips":{}}',
                  '/api/guide-audio/offline.mp3': b'OFFLINE_AUDIO_BYTES',
                  '/api/sources/doc-financial': b'PRIVATE OFFLINE FIXTURE ORIGINAL'}
        class Upstream(BaseHTTPRequestHandler):
            def log_message(self, *_): pass
            def dispatch(self):
                raw = self.rfile.read(int(self.headers.get('Content-Length', 0)))
                calls.append({'path': self.path, 'method': self.command, 'body': raw,
                              'origin': self.headers.get('Origin'), 'cookie': self.headers.get('Cookie')})
                if self.path == '/api/access' and self.command == 'POST':
                    if json.loads(raw).get('passphrase') != secret:
                        self.send_error(401); return
                    self.send_response(200)
                    self.send_header('Set-Cookie', 'review=' + secret + '; HttpOnly; Path=/; SameSite=Strict')
                    self.end_headers(); self.wfile.write(b'{"authenticated":true}'); return
                if self.path == '/assets/redirect.js':
                    self.send_response(302); self.send_header('Location', 'https://example.invalid/' + secret)
                    self.end_headers(); return
                status = 503 if self.path == '/api/citations/unavailable' else 200
                data = bodies.get(self.path, b'{"error":"offline-failure"}')
                self.send_response(status)
                self.send_header('Set-Cookie', 'review=' + secret + '; HttpOnly; Path=/')
                self.send_header('Content-Type', 'text/event-stream' if self.path == '/api/chat/query' else 'application/json')
                self.send_header('Content-Length', str(len(data)))
                self.send_header('X-Fixture-Header', 'unchanged')
                self.end_headers()
                if self.command != 'HEAD': self.wfile.write(data)
            do_GET = do_HEAD = do_POST = dispatch
        server = ThreadingHTTPServer(('127.0.0.1', 0), Upstream)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        origin = f'http://127.0.0.1:{server.server_port}'
        try:
            yield origin, secret, calls, bodies
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=3)

    def test_authorized_requires_auth_and_never_mock_case(self):
        with patch('sys.stderr', io.StringIO()), self.assertRaises(SystemExit):
            run.main(['--url', 'http://localhost:5173', '--stage', 'after', '--mode', 'authorized', '--dry-run'])
        with self.assertRaises(ValueError), proxy.test_origin('http://localhost:1', fixture_config(), authorized=True):
            pass
        with self.assertRaises(ValueError), proxy.test_origin('http://localhost:1', fixture_config(), case='context', passphrase='fixture', authorized=True):
            pass

    def test_authorized_contract_requires_every_check_and_no_duplicates(self):
        data = {'checks': [{'id': k, 'ok': True} for k in run.AUTHORIZED_CHECKS], 'endUTC': run.utc()}
        self.assertEqual(run.contract_failures(data, 'authorized'), [])
        data['checks'].pop()
        self.assertIn('focused-resized-layout', run.contract_failures(data, 'authorized'))
        data['checks'].append(data['checks'][0])
        self.assertIn('exact-requested-viewport', run.contract_failures(data, 'authorized'))

    def test_authorized_cli_uses_normal_validator_and_no_mock_or_secret(self):
        args = run.parser().parse_args(['--url', 'https://sb-fixture.vercel.run', '--stage', 'after', '--mode', 'authorized', '--auth', 'env'])
        secret = secrets.token_urlsafe(32)
        with patch.dict(os.environ, {'ATHAR_REVIEW_PASSPHRASE': secret}):
            cmd, timeout, source = run.build_command(args, fixture_config(), 'authorized', None, '390x844',
                                                    'http://127.0.0.1:1234', Path('/fixture/ui_validate.py'), 'after-authorized')
        self.assertEqual(source.name, 'authorized.js')
        self.assertEqual(timeout, 300)
        self.assertEqual(cmd.count('__atharPoll()'), 2300)
        self.assertNotIn('--allow-console-errors', cmd)
        self.assertNotIn('--out-dir', cmd)
        self.assertNotIn(secret, json.dumps(cmd))
        script = cmd[cmd.index('--eval')+1]
        self.assertNotIn('"mock":', script)
        self.assertNotIn('window.fetch =', script)
        self.assertNotIn('innerHTML', script)
        self.assertIn('100000', script)
        self.assertIn('proof-clean-session', script)
        for key in run.AUTHORIZED_CHECKS: self.assertIn(key, script)

    def test_fixed_origin_paths_and_body_policy(self):
        for origin in ('https://example.invalid', 'https://sb-x.vercel.run@evil.invalid', 'http://localhost/?token=x'):
            with self.assertRaises(ValueError): proxy.real_origin(origin)
        for path in ('//evil.invalid/', 'http://evil.invalid/', '/api/../access', '/api/%63hat/query',
                     '/api/chat/query?target=evil', '/assets/../api/access', '/assets/a\\b', '/api/chat/query#x'):
            self.assertIsNone(proxy.real_path(path))
        self.assertEqual(proxy.real_path('/guide-audio/manifest.json?t=1777777777777'), '/guide-audio/manifest.json')
        self.assertIsNone(proxy.real_path('/guide-audio/manifest.json?t=secret'))
        self.assertIsNone(proxy.real_path('/guide-audio/manifest.json?t=1777777777777&url=evil'))
        good = {'sessionId':'session-one','query':'offline question','documentId':'doc-financial','slide':None,'voice':False,'mode':'stream'}
        self.assertEqual(proxy.real_body('/api/chat/query', json.dumps(good).encode()), good)
        for change in ({'extra': 'bad'}, {'voice': True}, {'slide': True}, {'slide': 0}, {'query': 'x'*4001}, {'documentId': '../x'}, {'mode':'arbitrary'}):
            self.assertIsNone(proxy.real_body('/api/chat/query', json.dumps({**good, **change}).encode()))
        for raw in (b'[]', b'{', b'{"x":1,"x":2}', b'{"query":NaN}'):
            self.assertIsNone(proxy.real_body('/api/chat/query', raw))
        self.assertEqual(proxy.real_body('/api/chat/session', b'{}'), {})
        self.assertEqual(proxy.real_body('/api/documents/retry', b''), {})
        self.assertIsNone(proxy.real_body('/api/documents/retry', b'{"url":"arbitrary"}'))

    def test_real_forwarding_keeps_bytes_status_cookie_private_and_metadata_only(self):
        with self.upstream() as (origin, secret, calls, bodies):
            config = fixture_config(); config['api']['access'] = '/api/should-not-be-used'
            with proxy.test_origin(origin, config, passphrase=secret, authorized=True) as (url, state):
                for path in ('/api/documents', '/@vite/client', '/assets/app.js', '/guide-audio/manifest.json?t=1777777777777', '/api/guide-audio/offline.mp3'):
                    with urlopen(url+path) as response:
                        self.assertEqual(response.read(), bodies[path])
                        self.assertIsNone(response.headers.get('Set-Cookie'))
                        self.assertEqual(response.headers['X-Fixture-Header'], 'unchanged')
                payload = {'sessionId': 'session-one', 'documentId': 'doc-financial', 'query': secret, 'slide': None, 'voice': False, 'mode': 'stream'}
                raw = json.dumps(payload, indent=1).encode()
                with urlopen(Request(url+'/api/chat/query', data=raw, headers={'Origin':url,'Content-Type':'application/json','Cookie':'browser=untrusted'})) as response:
                    self.assertEqual(response.read(), bodies['/api/chat/query'])
                    self.assertIsNone(response.headers.get('Set-Cookie'))
                with urlopen(url+'/api/citations/cite-one') as response: response.read()
                with urlopen(Request(url+'/api/sources/doc-financial', method='HEAD')) as response:
                    self.assertEqual(response.status, 200); self.assertEqual(response.read(), b'')
                with urlopen(url+proxy.PREFIX+'/probe') as response: metadata=json.load(response)
                self.assertNotIn(secret, json.dumps(metadata))
                self.assertNotIn('browser=untrusted', json.dumps(metadata))
                self.assertEqual(metadata['authMode'], 'in-memory-real-api-broker')
                self.assertTrue(metadata['authFlags']['httpOnly'])
                query = next(r for r in metadata['requests'] if r['kind']=='query')
                self.assertTrue(query['answerNonempty']); self.assertEqual(query['citationCount'],1)
                self.assertEqual(query['retrievedIds'], ['cite-one'])
                citation = next(r for r in metadata['requests'] if r['kind']=='citation')
                self.assertTrue(citation['excerptNonempty']); self.assertTrue(citation['originalSameOriginApi'])
                forwarded = next(r for r in calls if r['path']=='/api/chat/query')
                self.assertEqual(forwarded['body'],raw); self.assertEqual(forwarded['origin'],origin)
                self.assertIn(secret,forwarded['cookie']); self.assertNotIn('browser=untrusted',forwarded['cookie'])
                self.assertEqual(calls[0]['path'],'/api/access')

    def test_real_post_routes_exact_origin_and_no_arbitrary_host(self):
        with self.upstream() as (origin, secret, calls, _):
            with proxy.test_origin(origin, fixture_config(), passphrase=secret, authorized=True) as (url, state):
                requests = [Request(url+'/api/chat/session', data=b'{}', headers={'Content-Type':'application/json', **headers})
                            for headers in ({}, {'Origin':'null'}, {'Origin':'https://example.invalid'},
                                            {'Origin':url,'Host':'example.invalid'}, {'Origin':url,'Sec-Fetch-Site':'cross-site'})]
                requests += [Request(url+route, data=b'{}', headers={'Origin':url,'Content-Type':'application/json'})
                             for route in ('/api/access','/api/chat/query/','/api/voice/text','/__athar_ui__/control','/api/documents/retry?x=y')]
                requests += [Request(url+'/api/chat/session', method='DELETE',headers={'Origin':url}),
                             Request(url+'/api/unknown'), Request(url+'/api/chat/session',data=b'{"url":"bad"}',headers={'Origin':url,'Content-Type':'application/json'}),
                             Request(url+'/api/chat/query',data=b'{}',headers={'Origin':url,'Content-Type':'text/plain'})]
                count = len(calls)
                for request in requests:
                    with self.subTest(path='policy-rejected'), self.assertRaises(HTTPError) as raised: urlopen(request)
                    self.assertIn(raised.exception.code, (400,403,405,415))
                self.assertEqual(len(calls),count)
                for path in ('/api/chat/session','/api/documents/retry'):
                    with urlopen(Request(url+path,data=b'{}',headers={'Origin':url,'Content-Type':'application/json'})) as response:
                        self.assertEqual(response.status,200); response.read()
                self.assertEqual(len(calls),count+2)

    def test_response_errors_redirects_and_sse_errors_never_masked(self):
        with self.upstream() as (origin, secret, calls, _):
            with proxy.test_origin(origin, fixture_config(), passphrase=secret, authorized=True) as (url, state):
                for path, code in (('/api/citations/unavailable',503),('/assets/redirect.js',502)):
                    with self.assertRaises(HTTPError) as raised: urlopen(url+path)
                    self.assertEqual(raised.exception.code,code)
                    self.assertNotIn(secret, raised.exception.read().decode())
                self.assertEqual(len(calls),3)
                metadata = state.summary()
                self.assertEqual(metadata['requests'][0]['status'],503)
                self.assertTrue(metadata['requests'][1]['redirectDenied'])
                self.assertNotIn(secret,json.dumps(metadata))
        state = proxy.RealState('http://localhost:1')
        item = state.begin('POST','/api/chat/query',{'documentId':'all','slide':None,'query':'offline'})
        state.observe(item,b'data: {"type":"error","message":"PRIVATE TEST ERROR"}\n\n','text/event-stream')
        self.assertEqual(item['errorFrameCount'],1); self.assertFalse(item['answerNonempty'])
        self.assertNotIn('PRIVATE TEST ERROR', json.dumps(state.summary()))
        self.assertEqual(run.classify_console(['Failed to load resource: server responded with a status of 503'],None)['unexpectedConsoleErrorCount'],1)

    def test_unsafe_source_url_is_never_retained(self):
        for original in ('https://example.invalid/source?token=private', 'javascript:secret', '/api/sources/x?token=secret'):
            state=proxy.RealState('https://sb-fixture.vercel.run'); item=state.begin('GET','/api/citations/cite-one',{})
            state.observe(item,json.dumps({'id':'cite-one','excerpt':'PRIVATE','originalUrl':original}).encode(),'application/json')
            self.assertFalse(item['originalSameOriginApi']); self.assertIsNone(item['originalPath'])
            self.assertNotIn(original,json.dumps(state.summary())); self.assertNotIn('PRIVATE',json.dumps(state.summary()))

    def test_unclean_authorized_screenshot_is_deleted_and_failure_preserved(self):
        args=run.parser().parse_args(['--url','http://localhost:5173','--stage','after','--mode','authorized','--auth','env','--polls','1','--max-chunks','1000','--overwrite'])
        evidence={'checks':[{'id':key,'ok':key != 'proof-clean-session'} for key in run.AUTHORIZED_CHECKS],'endUTC':run.utc()}
        b64=base64.b64encode(json.dumps(evidence).encode()).decode(); parts=[b64[i:i+112] for i in range(0,len(b64),112)]
        @contextmanager
        def broker(*args, **kwargs): yield 'http://127.0.0.1:1234',proxy.RealState('http://localhost:5173')
        with tempfile.TemporaryDirectory(prefix='ui-authorized-unit-') as temp:
            root=Path(temp); proof=root/'.ui-proof';proof.mkdir();image=proof/'after-authorized-390x844.png'
            image.write_bytes(b'PRIVATE OFFLINE SCREENSHOT PLACEHOLDER')
            raw={'ok':False,'httpStatus':200,'screenshots':[str(image)],'consoleErrors':[],'pageErrors':[],
                 'assertions':[{'ok':True,'target':f'window.__atharTransport({i},112)','detail':json.dumps({'chunk':part,'more':i<len(parts)-1})} for i,part in enumerate(parts)]}
            result=subprocess.CompletedProcess([],1,json.dumps(raw),'')
            with patch('proxy.test_origin',broker), patch('run.Path.cwd',return_value=root), patch('run.subprocess.run',return_value=result), patch.dict(os.environ,{'ATHAR_REVIEW_PASSPHRASE':'fixture-only-secret'}), patch('sys.stdout',io.StringIO()):
                code=run.execute(args,fixture_config(),Path('/fixture/ui_validate.py'),'authorized',None,'390x844')
            self.assertEqual(code,1);self.assertFalse(image.exists())
            report=json.loads((proof/'after-authorized-390x844.json').read_text())
            self.assertIn('proof-clean-session',report['failedCheckIds']);self.assertIn('validator-failed',report['failedCheckIds'])
            self.assertEqual(report['runner']['authMode'],'in-memory-real-api-broker')


if __name__ == '__main__':
    unittest.main()
