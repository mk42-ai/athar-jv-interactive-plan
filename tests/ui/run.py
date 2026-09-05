#!/usr/bin/env python3
"""Portable, stdlib-only UI contract runner; no browser or remote API imports.

Use the documented ui-validator CLI only. Raw validator output is read in memory
and is never persisted: its eval targets, console output, URLs and page title can
contain sensitive data. Exit 0=pass, 1=assertion failure, 2=could not run.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
from urllib.parse import urlsplit

HERE = Path(__file__).resolve().parent
DEFAULT_VIEWPORTS = ('1440x900', '390x844', '834x1112', '1275x451')
CASES = ('reader', 'context', 'citations', 'source-errors', 'source-loading', 'context-missing', 'auth-denied', 'audio-error', 'fetch-error')


def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def viewport(value):
    if not re.fullmatch(r'[1-9]\d{1,4}x[1-9]\d{1,4}', value):
        raise argparse.ArgumentTypeError('viewport must be WIDTHxHEIGHT in CSS pixels')
    return value


def safe_url(value):
    u = urlsplit(value)
    if u.scheme not in ('http', 'https') or not u.hostname or u.username or u.password or u.query or u.fragment:
        raise argparse.ArgumentTypeError('use an http(s) URL without credentials, query strings or fragments')
    local = u.hostname in ('127.0.0.1', 'localhost', '::1')
    preview = u.scheme == 'https' and u.hostname.startswith('sb-') and u.hostname.endswith('.vercel.run')
    if not (local or preview):
        raise argparse.ArgumentTypeError('ui-validator supports localhost or an ephemeral sb-*.vercel.run preview only')
    if u.path not in ('', '/'):
        raise argparse.ArgumentTypeError('use the app origin, not an API path or a signed source URL')
    return value.rstrip('/')


def sha(value):
    if not re.fullmatch(r'[0-9a-fA-F]{7,64}', value):
        raise argparse.ArgumentTypeError('build SHA must be 7–64 hexadecimal characters')
    return value.lower()


def merge(base, overlay):
    result = dict(base)
    for key, value in overlay.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = merge(result[key], value)
        else:
            result[key] = value
    return result


def resolve_validator(explicit=None):
    if explicit:
        candidates = [Path(explicit)]
    else:
        candidates = [p / '.goose/skills/ui-validator/scripts/ui_validate.py'
                      for p in dict.fromkeys([Path.cwd(), *Path.cwd().parents, HERE, *HERE.parents])]
        candidates.append(Path('/home/appuser/.agents/skills/ui-validator/scripts/ui_validate.py'))
    for path in candidates:
        if path.is_file():
            return path.resolve()
    raise ValueError('ui-validator unavailable; load the ui-validator skill or use --validator PATH')


def parse_transport(report, max_chunks, chunk_size):
    chunks = []
    complete = False
    for assertion in report.get('assertions', []):
        target = assertion.get('target', '')
        if not target.startswith('window.__atharTransport('):
            continue
        try:
            value = json.loads(assertion['detail'])
            if isinstance(value, str):
                value = json.loads(value)
            if complete:
                continue
            chunks.append(value['chunk'])
            complete = not value['more']
        except (KeyError, TypeError, ValueError):
            raise ValueError('evidence transport missing or truncated') from None
    if not complete or len(chunks) > max_chunks or sum(map(len, chunks)) > max_chunks * chunk_size:
        raise ValueError('evidence transport incomplete or over configured capacity')
    return json.loads(base64.b64decode(''.join(chunks), validate=True))


def contract_failures(data, mode):
    contract = json.loads((HERE / 'assertions-contract.json').read_text())
    indexed = {}
    for check in data.get('checks', []):
        indexed.setdefault(check['id'], []).append(check)
    expected = []
    if mode != 'extended':
        expected += contract['perInteraction' if mode == 'stage' else 'perFullSequence']
        stages = contract['stages'] if mode == 'stage' else ['natural-completion']
        expected += [f'{stage}:{suffix}' for stage in stages for suffix in contract['perStage']]
    else:
        ext = json.loads((HERE / 'extended-contract.json').read_text())
        if data.get('case') not in ext:
            return ['unknown-extended-case']
        expected = ext[data['case']] + ['exact-requested-viewport']
    failed = [key for key in expected if len(indexed.get(key, [])) != 1 or not indexed[key][0]['ok']]
    failed += [c['id'] for c in data.get('checks', []) if not c['ok']]
    if not data.get('checks') or not data.get('endUTC'):
        failed.append('harness-completed')
    return sorted(set(failed))


def sanitize(value, secrets=()):
    """Second-line defense; harness evidence itself must remain content-free."""
    if isinstance(value, dict):
        return {k: sanitize(v, secrets) for k, v in value.items()
                if k.lower() not in {'cookie', 'set-cookie', 'authorization', 'passphrase',
                                     'token', 'sessionid', 'externaluserid', 'answer', 'query',
                                     'excerpt', 'raw', 'stack', 'title'}}
    if isinstance(value, list):
        return [sanitize(v, secrets) for v in value]
    if isinstance(value, str):
        for secret in secrets:
            if secret:
                value = value.replace(secret, '[redacted]')
        value = re.sub(r'https?://[^\s<>"\']+', '[url omitted]', value)
        value = re.sub(r'(/[^\s?]+)\?[^\s]+', r'\1?[query omitted]', value)
    return value


def classify_console(errors, proxy_summary):
    """Only observed negative fixture HTTP failures may be expected.

    Match browser resource errors, not JS exceptions. A finite count of mocked
    failing requests prevents arbitrary 401/503s becoming a blanket allowlist.
    No raw message is ever written into the result.
    """
    budgets = {401: 0, 503: 0}
    for request in (proxy_summary or {}).get('requests', []):
        if request['kind'] in ('protected-denied', 'original-denied'):
            budgets[401] += 1
        elif request['kind'] in ('query', 'citation', 'documents'):
            if request.get('state') == 'denied':
                budgets[401] += 1
            elif request.get('state') == 'error':
                budgets[503] += 1
    expected = unexpected = 0
    for error in errors:
        text = json.dumps(error) if not isinstance(error, str) else error
        status = re.search(r'(?:status(?: of)?|HTTP)\s*[:=]?\s*(401|503)\b', text, re.I)
        resource = re.search(r'Failed to load resource|server responded with a status', text, re.I)
        code = int(status.group(1)) if status else None
        if resource and code and budgets[code] > 0:
            budgets[code] -= 1
            expected += 1
        else:
            unexpected += 1
    return {'expectedMockHttpErrorCount': expected, 'unexpectedConsoleErrorCount': unexpected}


def png_dimensions(path):
    with Path(path).open('rb') as stream:
        head = stream.read(24)
    if len(head) < 24 or head[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('invalid screenshot PNG')
    return dict(zip(('width', 'height'), struct.unpack('>II', head[16:24])))


def build_command(args, config, mode, case, size, target, validator, label):
    width, height = map(int, size.split('x'))
    run_config = {**config, 'mode': mode, 'case': case, 'stage': args.stage,
                  'buildSha': args.build_sha, 'viewport': {'width': width, 'height': height}}
    source = HERE / ('extended.js' if mode == 'extended' else 'harness.js')
    script = source.read_text().replace('__RUN_CONFIG__', json.dumps(run_config, separators=(',', ':')))
    # Short awaited polls avoid the validator transport's per-eval time budget.
    polls = args.polls if args.polls is not None else (18500 if mode == 'sequence' else 1200)
    timeout = args.timeout or (2100 if mode == 'sequence' else 300)
    cmd = [sys.executable, str(validator), '--url', target, '--label', label,
           '--viewport', size, '--viewport-only', '--wait-selector', config['selectors']['root'],
           '--wait-ms', str(args.wait_ms), '--timeout', str(timeout), '--eval', script]
    if mode == 'extended':
        cmd += ['--allow-console-errors']
    cmd += ['--eval', '__atharPoll()'] * polls
    cmd += ['--eval', '!!window.__atharEvidenceB64', '--eval', 'window.__atharEvidence.ok === true',
            '--eval', f'window.__atharEvidenceB64.length <= {args.max_chunks * args.chunk_size}']
    for i in range(args.max_chunks):
        cmd += ['--eval', f'window.__atharTransport({i},{args.chunk_size})']
    return cmd, timeout, source


def execute(args, config, validator, mode, case, size):
    from proxy import test_origin
    from contextlib import nullcontext
    proof = Path.cwd() / '.ui-proof'
    proof.mkdir(mode=0o700, exist_ok=True)
    label = f'{args.stage}-' + ('playback' if mode == 'sequence' else mode)
    if case:
        label += '-' + case
    name = f'{label}-{size}'
    report_path = proof / f'{name}.json'
    if (report_path.exists() or (proof / f'{name}.png').exists()) and not args.overwrite:
        raise ValueError('selected report already exists; choose another cwd/stage or explicitly --overwrite')
    started = utc()
    secret = os.environ.get('ATHAR_REVIEW_PASSPHRASE', '') if args.auth == 'env' else ''
    if args.auth == 'env' and not secret:
        raise ValueError('--auth env requires ATHAR_REVIEW_PASSPHRASE in the environment')
    if mode == 'extended' and args.auth != 'none':
        raise ValueError('extended is isolated/mock only; do not mix it with real authorization')
    broker = test_origin(args.url, config, case=case, passphrase=secret) if mode == 'extended' or secret else nullcontext((args.url, None))
    with broker as (target, proxy):
        cmd, timeout, source = build_command(args, config, mode, case, size, target, validator, label)
        env = dict(os.environ)
        env.pop('ATHAR_REVIEW_PASSPHRASE', None)
        env['CHROMIUM_BIN'] = str(HERE / 'chromium-test')
        result = subprocess.run(cmd, cwd=Path.cwd(), env=env, capture_output=True,
                                text=True, timeout=timeout + 60)
        raw = {}
        try:
            raw = json.loads(result.stdout)
            data = parse_transport(raw, args.max_chunks, args.chunk_size)
            failed = contract_failures(data, mode)
        except (ValueError, KeyError, TypeError):
            if not isinstance(raw, dict):
                raw = {}
            data = {'checks': [], 'ok': False}
            failed = ['evidence-extraction-failed']
        width, height = map(int, size.split('x'))
        screenshots = []
        for path in raw.get('screenshots', []):
            item = Path(path).resolve()
            if item.parent != proof.resolve():
                failed.append('screenshot-outside-default-proof-directory')
                continue
            try:
                dimensions = png_dimensions(item)
                screenshots.append({'path': str(item), **dimensions})
                if dimensions != {'width': width, 'height': height}:
                    failed.append('screenshot-exact-requested-viewport')
            except (ValueError, OSError):
                failed.append('screenshot-unreadable')
        if not screenshots:
            failed.append('screenshot-required')
        proxy_summary = proxy.summary() if proxy else None
        observed_errors = raw.get('consoleErrors', [])
        expected_narration = []
        if case in ('audio-error', 'fetch-error') and data.get('checks'):
            # One deliberately injected playback/network failure is expected. Never suppress
            # unrelated errors or count this negative fixture as a clean normal session.
            expected_narration = [e for e in observed_errors if '[guide-audio] narration failed' in str(e)][:1]
        console = classify_console([e for e in observed_errors if e not in expected_narration], proxy_summary if case else None)
        console['expectedInjectedNarrationErrorCount'] = len(expected_narration)
        if console['unexpectedConsoleErrorCount']:
            failed.append('unexpected-console-error')
        # No raw report, eval target, page title, console/error detail or request URL survives.
        data['runner'] = {
            'startedUTC': started, 'finishedUTC': utc(), 'buildSha': args.build_sha,
            'buildShaVerification': 'caller-supplied; not independently queried',
            'stage': args.stage, 'mode': mode, 'case': case, 'requestedViewport': size,
            'harnessSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'configSha256': hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest(),
            'validatorExitCode': result.returncode, 'validatorOk': raw.get('ok') is True,
            'httpStatus': raw.get('httpStatus'), 'screenshots': screenshots,
            'consoleErrorCount': len(raw.get('consoleErrors', [])),
            'pageErrorCount': len(raw.get('pageErrors', [])),
            'failedRequestCount': len(raw.get('failedRequests', [])),
            'validatorFailedAssertionCount': sum(not a.get('ok', False) for a in raw.get('assertions', [])),
            'authMode': 'in-memory-cookie-broker' if secret else ('synthetic-mock' if case else 'anonymous'),
            'proxySummary': proxy_summary, 'consoleClassification': console,
            'rawOutputPersisted': False,
        }
        if result.returncode or raw.get('ok') is not True:
            failed.append('validator-failed')
        data['ok'] = not failed
        data['failedCheckIds'] = sorted(set(failed))
        report_path.write_text(json.dumps(sanitize(data, (secret,)), indent=2) + '\n')
        summary = {'finishedUTC': utc(), 'report': str(report_path), 'ok': data['ok'],
                   'mode': mode, 'case': case, 'viewport': size, 'failedCheckIds': data['failedCheckIds'],
                   'screenshots': screenshots, 'checkCount': len(data.get('checks', []))}
        print(json.dumps(summary), flush=True)
        return 0 if data['ok'] else (2 if result.returncode == 2 else 1)


def parser():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--url', required=True, type=safe_url)
    p.add_argument('--stage', choices=('before', 'after'), required=True)
    p.add_argument('--mode', choices=('stage', 'sequence', 'extended'), default='stage')
    p.add_argument('--viewport', action='append', type=viewport, help='repeat; defaults to all four baseline sizes')
    p.add_argument('--case', choices=CASES, action='append', help='extended only; defaults to every isolated case')
    p.add_argument('--build-sha', type=sha, help='optional caller-supplied build revision, never queried with git')
    p.add_argument('--config', type=Path, help='JSON overrides for selectors/API paths/thresholds; never credentials')
    p.add_argument('--validator', help='installed ui_validate.py path; implementation is not inspected')
    p.add_argument('--auth', choices=('none', 'env'), default='none', help='env: in-memory cookie broker; no secret in JS/CLI')
    p.add_argument('--wait-ms', type=int, default=650)
    p.add_argument('--timeout', type=int, help='validator timeout seconds (300 or 2100 by default)')
    p.add_argument('--polls', type=int, help='100ms bounded async polls; default 1200 or 18500 for sequence')
    p.add_argument('--max-chunks', type=int, default=2200)
    p.add_argument('--chunk-size', type=int, default=112, help='small enough for truncated --eval result fields')
    p.add_argument('--overwrite', action='store_true', help='explicitly replace only this selected run, never glob/delete proofs')
    p.add_argument('--dry-run', action='store_true', help='validate configuration, emit a safe plan; no browser/network/files')
    return p


def main(argv=None):
    os.umask(0o077)
    p = parser()
    args = p.parse_args(argv)
    if args.case and args.mode != 'extended':
        p.error('--case applies only to --mode extended')
    if args.auth == 'env' and args.mode == 'extended':
        p.error('extended cases are mock-only; use --auth none')
    if any(v is not None and v <= 0 for v in (args.timeout, args.polls, args.max_chunks, args.chunk_size)) or args.wait_ms < 0:
        p.error('timeouts/polls/chunk limits must be positive and wait-ms nonnegative')
    if args.chunk_size > 160:
        p.error('chunk-size >160 is unsafe for validator detail truncation')
    try:
        config = json.loads((HERE / 'config.json').read_text())
        if args.config:
            overlay = json.loads(args.config.read_text())
            serialized = json.dumps({k:v for k,v in overlay.items() if k != 'selectors'})
            if re.search(r'passphrase|authorization|set-cookie|sessionid|signedurl', serialized, re.I):
                raise ValueError('config must contain only selector/contract settings, never credentials')
            config = merge(config, overlay)
        env_secret = os.environ.get('ATHAR_REVIEW_PASSPHRASE', '')
        if env_secret and env_secret in json.dumps(config):
            raise ValueError('credential must not appear in configuration')
        validator = resolve_validator(args.validator)
        sizes = args.viewport or DEFAULT_VIEWPORTS
        cases = (args.case or CASES) if args.mode == 'extended' else (None,)
        if args.dry_run:
            print(json.dumps({'dryRun': True, 'stage': args.stage, 'mode': args.mode,
                              'viewports': sizes, 'cases': cases, 'buildSha': args.build_sha,
                              'outputDirectory': str(Path.cwd() / '.ui-proof'),
                              'auth': args.auth, 'validator': str(validator), 'utc': utc()}))
            return 0
        status = 0
        for case in cases:
            for size in sizes:
                status = max(status, execute(args, config, validator, args.mode, case, size))
        return status
    except subprocess.TimeoutExpired:
        print(json.dumps({'ok': False, 'error': 'validator-process-timeout', 'utc': utc()}))
    except (OSError, ValueError, KeyError) as error:
        # Exception bodies can contain protected URLs or HTTP response payloads.
        print(json.dumps({'ok': False, 'error': type(error).__name__,
                          'detail': 'Runner unavailable or invalid input; check paths/config/auth and output collisions.', 'utc': utc()}))
    return 2


if __name__ == '__main__':
    raise SystemExit(main())
