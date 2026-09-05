import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import { createAccessControl } from '../server/access.js';
import { createEvidenceRoutes } from '../server/evidenceRoutes.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

// Synthetic test credentials only. No real credential or confidential source material.
const testPassphrase = 'synthetic-review-code-for-local-tests';
async function fixture({ configured = true, provider } = {}) {
  let now = Date.now();
  const access = createAccessControl({ passphrase: configured ? testPassphrase : null,
    signingKey: configured ? 'unit-test-signing-value-not-a-real-secret-123456789' : null, clock: () => now });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'athar-security-test-'));
  const bytes = Buffer.from('Synthetic source; test only.');
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  await fs.writeFile(path.join(dir, 'test.pdf'), bytes);
  await fs.writeFile(path.join(dir, 'index.json'), JSON.stringify({ schemaVersion: 'athar-corpus/v1', extractorVersion: 'test', generatedAt: new Date().toISOString(),
    documents: [{ id: sha, sha256: sha, slug: 'financial-summary', kind: 'pdf', title: 'Synthetic test source', originalFile: 'test.pdf', status: 'ready', coverage: { pages: 1 }, limitations: [] }],
    chunks: [{ id: 'src-synthetic', documentId: sha, documentSlug: 'financial-summary', kind: 'pdf-page', label: 'Synthetic source p.1', location: { page: 1 }, text: 'Example programme budget is USD 12 million. Approval remains To be agreed.' }] }));
  const app = express();
  const service = createEvidenceRoutes({ access, corpusDir: dir, provider: provider || { isConfigured: () => false }, clock: () => now });
  app.use('/api/access', access.router); app.use('/api', service.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (p, { cookie, body, origin = base, method = body === undefined ? 'GET' : 'POST', ...rest } = {}) => fetch(base + p, {
    method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}), 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), ...rest,
  });
  const unlock = async () => { const r = await request('/api/access', { body: { passphrase: testPassphrase } }); assert.equal(r.status, 200); return r.headers.get('set-cookie').split(';')[0]; };
  return { request, unlock, access, sha, dir, expire: () => { now += 7 * 3600_000; }, close: async () => { server.closeAllConnections(); await new Promise(r => server.close(r)); await fs.rm(dir, { recursive: true, force: true }); } };
}

test('anonymous chat, document, citation, original, and retry routes fail closed', async () => {
  const f = await fixture(); try {
    for (const [p, body] of [['/api/documents'], ['/api/citations/src-synthetic'], [`/api/sources/${f.sha}`], ['/api/documents/retry', {}], ['/api/chat/session', {}], ['/api/chat/query', { query: 'test' }]]) {
      const r = await f.request(p, { body }); assert.equal(r.status, 401, p);
      const s = await r.text(); assert.ok(!s.includes('USD 12')); assert.ok(!s.includes(f.sha));
    }
  } finally { await f.close(); }
});
test('configured access uses HttpOnly SameSite, returns no credential, and gates authenticated original bytes', async () => {
  const f = await fixture(); try {
    const r = await f.request('/api/access', { body: { passphrase: testPassphrase } });
    assert.match(r.headers.get('set-cookie'), /HttpOnly/); assert.match(r.headers.get('set-cookie'), /SameSite=Strict/);
    const cookie = r.headers.get('set-cookie').split(';')[0]; assert.ok(!(await r.text()).includes(testPassphrase));
    const docs = await f.request('/api/documents', { cookie }); assert.equal(docs.status, 200); assert.match(docs.headers.get('cache-control'), /no-store/);
    const cite = await f.request('/api/citations/src-synthetic', { cookie }); assert.equal(cite.status, 200);
    const c = await cite.json(); assert.equal(c.location.page, 1); assert.equal(c.originalUrl, `/api/sources/${f.sha}`);
    const source = await f.request(c.originalUrl, { cookie }); assert.equal(source.status, 200);
    assert.equal(crypto.createHash('sha256').update(Buffer.from(await source.arrayBuffer())).digest('hex'), f.sha);
  } finally { await f.close(); }
});
test('wrong/missing origin, forged cookie and missing access config are rejected', async () => {
  const f = await fixture(); try {
    for (const origin of ['https://untrusted.invalid', null]) assert.equal((await f.request('/api/access', { origin, body: { passphrase: testPassphrase } })).status, 403);
    const cookie = await f.unlock(); const bad = cookie.slice(0, -1) + (cookie.endsWith('a') ? 'b' : 'a');
    assert.equal((await f.request('/api/documents', { cookie: bad })).status, 401);
    assert.equal((await f.request('/api/chat/session', { cookie, origin: 'https://untrusted.invalid', body: {} })).status, 403);
  } finally { await f.close(); }
  const disabled = await fixture({ configured: false }); try { assert.equal((await disabled.request('/api/chat/session', { body: {} })).status, 503); } finally { await disabled.close(); }
});
test('session expires and logout revokes authorization', async () => {
  const f = await fixture(); try {
    const cookie = await f.unlock(); assert.equal((await f.request('/api/access', { cookie, method: 'DELETE' })).status, 200);
    assert.equal((await f.request('/api/documents', { cookie })).status, 401);
    const cookie2 = await f.unlock(); f.expire(); assert.equal((await f.request('/api/documents', { cookie: cookie2 })).status, 401);
  } finally { await f.close(); }
});
test('conversation ownership checked before provider use', async () => {
  let calls = 0;
  const f = await fixture({ provider: { isConfigured: () => true, createChatSession: () => { calls++; throw new Error('must not call'); } } }); try {
    const a = await f.unlock(); const b = await f.unlock();
    const session = await (await f.request('/api/chat/session', { cookie: a, body: {} })).json();
    const r = await f.request('/api/chat/query', { cookie: b, body: { sessionId: session.sessionId, query: 'test', mode: 'sync' } });
    assert.equal(r.status, 404); assert.equal(calls, 0);
    assert.equal((await f.request('/api/citations/src-invented', { cookie: b })).status, 404);
    assert.equal((await f.request('/api/sources/unknown', { cookie: b })).status, 404);
  } finally { await f.close(); }
});
test('missing AI provider yields explicit blocked state, not canned answer', async () => {
  const f = await fixture(); try {
    const cookie = await f.unlock(); const session = await (await f.request('/api/chat/session', { cookie, body: {} })).json();
    const r = await f.request('/api/chat/query', { cookie, body: { sessionId: session.sessionId, query: 'What is the budget?', mode: 'sync' } });
    assert.equal(r.status, 503); assert.equal((await r.json()).answer, undefined);
  } finally { await f.close(); }
});
test('bounded invalid provider response gets at most one repair, never unvalidated deltas', async () => {
  let calls = 0;
  const f = await fixture({ provider: { isConfigured: () => true, createChatSession: async () => ({ id: 'synthetic-upstream' }), submitQuerySync: async () => { calls++; return { answer: 'made-up answer with no source' }; } } }); try {
    const cookie = await f.unlock(); const session = await (await f.request('/api/chat/session', { cookie, body: {} })).json();
    const r = await f.request('/api/chat/query', { cookie, body: { sessionId: session.sessionId, query: 'budget', mode: 'stream' } });
    assert.equal(r.status, 422); assert.equal(calls, 2); assert.ok(!r.headers.get('content-type').includes('text/event-stream'));
    assert.ok(!(await r.text()).includes('made-up answer'));
  } finally { await f.close(); }
});
test('tampered original is not returned under a valid source ID', async () => {
  const f = await fixture(); try {
    const cookie = await f.unlock(); await fs.writeFile(path.join(f.dir, 'test.pdf'), 'different');
    assert.equal((await f.request(`/api/sources/${f.sha}`, { cookie })).status, 503);
  } finally { await f.close(); }
});
test('audio capabilities are scoped and expire; never authenticate the reviewer', async () => {
  const f = await fixture(); try {
    const c = f.access.mediaCapability('clip-a'); assert.ok(f.access.validMediaCapability('clip-a', c.expires, c.cap));
    assert.ok(!f.access.validMediaCapability('clip-b', c.expires, c.cap)); f.expire(); assert.ok(!f.access.validMediaCapability('clip-a', c.expires, c.cap));
  } finally { await f.close(); }
});
