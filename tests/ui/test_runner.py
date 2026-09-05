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


if __name__ == '__main__':
    unittest.main()
