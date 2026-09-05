// Non-network regressions for the *actual API* QA client's verifier.
// Never run live QA implicitly from `node --test`; live use is an explicit Python CLI.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('grounding QA verifier fails closed and keeps reports source/secret-free', () => {
  const runner = fileURLToPath(new URL('./grounding_cases.py', import.meta.url));
  const result = spawnSync('python3', ['-B', runner, '--self-test'], {
    // The unit suite must not need or inherit review/provider credentials.
    env: { PATH: process.env.PATH, PYTHONDONTWRITEBYTECODE: '1' },
    encoding: 'utf8', timeout: 20_000, maxBuffer: 64 * 1024,
  });
  assert.equal(result.error, undefined, 'Python grounding verifier self-test could not start');
  assert.equal(result.status, 0, 'Python grounding verifier self-test failed (run --self-test for safe method IDs)');
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.mode, 'synthetic-non-network');
  assert.equal(summary.live_cases_executed, 0);
  assert.ok(summary.tests >= 19);
  assert.equal(summary.passed, summary.tests);
  assert.deepEqual(summary.failed_tests, []);
  assert.equal(result.stderr, '');
});
