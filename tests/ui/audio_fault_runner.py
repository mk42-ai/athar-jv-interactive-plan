#!/usr/bin/env python3
"""Authorized negative audio tests through the documented ui-validator CLI.
No provider requests, secret arguments, raw console text or private answers retained.
"""
import argparse
import json
import os
from pathlib import Path
import sys
import run

HERE = Path(__file__).resolve().parent
EXPECTED = ('exact-viewport', 'failure-shown-not-silenced', 'failed-audio-does-not-advance',
            'retry-native-audio-clock-advances', 'no-web-speech-substitution',
            'retry-verified-original-source', 'proof-clean-session')

def command(args, config, mode, case, size, target, validator, label):
    w, h = map(int, size.split('x'))
    source = HERE / 'audio_faults.js'
    text = source.read_text().replace('__RUN_CONFIG__', json.dumps({'fault': args.fault, 'viewport': {'width': w, 'height': h}}))
    cmd = [sys.executable, str(validator), '--url', target, '--label', label, '--viewport', size,
           '--viewport-only', '--wait-selector', '[data-testid="pdf-canvas"][data-page]',
           '--wait-ms', '700', '--timeout', '120', '--allow-console-errors', '--eval', text]
    cmd += ['--eval', '__atharPoll()'] * 400
    cmd += ['--eval', '!!window.__atharEvidenceB64', '--eval', 'window.__atharEvidence.ok===true']
    for i in range(200): cmd += ['--eval', f'window.__atharTransport({i},112)']
    return cmd, 120, source

def failures(data, mode):
    got = {c.get('id'): c for c in data.get('checks', [])}
    return [name for name in EXPECTED if not got.get(name, {}).get('ok')]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True, type=run.safe_url)
    parser.add_argument('--fault', required=True, choices=['autoplay', 'network'])
    parser.add_argument('--viewport', default='390x844', type=run.viewport)
    parser.add_argument('--validator')
    parser.add_argument('--build-sha', type=run.sha)
    a = parser.parse_args()
    # Shared wrapper keeps credentials in the Python broker, never JS or CLI values.
    args = run.parser().parse_args(['--url', a.url, '--stage', 'after', '--mode', 'authorized', '--auth', 'env'])
    args.fault = a.fault; args.build_sha = a.build_sha
    args.stage = f'after-audio-{a.fault}-{run.utc().replace(":", "").replace(".", "-")}'
    args.max_chunks = 200; args.chunk_size = 112
    original = run.classify_console
    def expected_console(errors, summary):
        # Exactly one intentionally injected guide failure is expected; unrelated errors fail.
        allowed = [e for e in errors if '[guide-audio] narration failed' in str(e)][:1]
        result = original([e for e in errors if e not in allowed], summary)
        result['expectedInjectedGuideFailureCount'] = len(allowed)
        return result
    run.build_command = command; run.contract_failures = failures; run.classify_console = expected_console
    return run.execute(args, json.loads((HERE/'config.json').read_text()), run.resolve_validator(a.validator), 'authorized', None, a.viewport)

if __name__ == '__main__':
    try: sys.exit(main())
    except Exception:
        print(json.dumps({'status':'blocked','reason':'audio fault runner unavailable; check authentication, browser or app without logging secrets'}))
        sys.exit(2)
