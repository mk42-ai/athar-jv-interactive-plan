import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import { createPublicAccess } from '../server/publicAccess.js';
import { createEvidenceRoutes } from '../server/evidenceRoutes.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

// Public workspace: no reviewer code, no login, no session cookie. These tests pin what replaced the gate —
// open evidence routes, an anonymous per-client conversation principal, same-origin CSRF on mutations,
// per-IP throttling and single-use media capabilities. Synthetic fixtures only.
async function fixture({ provider } = {}) {
  let now = Date.now();
  const access = createPublicAccess({ signingKey: 'unit-test-signing-value-not-a-real-secret-123456789', clock: () => now });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'athar-public-test-'));
  const bytes = Buffer.from('Synthetic source; test only.');
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  await fs.writeFile(path.join(dir, 'test.pdf'), bytes);
  await fs.writeFile(path.join(dir, 'index.json'), JSON.stringify({ schemaVersion: 'athar-corpus/v1', extractorVersion: 'test', generatedAt: new Date().toISOString(),
    documents: [{ id: sha, sha256: sha, slug: 'financial-summary', kind: 'pdf', title: 'Synthetic test source', originalFile: 'test.pdf', status: 'ready', coverage: { pages: 1 }, limitations: [] }],
    chunks: [{ id: 'src-synthetic', documentId: sha, documentSlug: 'financial-summary', kind: 'pdf-page', label: 'Synthetic source p.1', location: { page: 1 }, text: 'Example programme budget is USD 12 million. Approval remains To be agreed.' }] }));
  const app = express();
  const service = createEvidenceRoutes({ access, corpusDir: dir, provider: provider || { isConfigured: () => false }, clock: () => now });
  app.use('/api', service.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (p, { body, origin = base, client, method = body === undefined ? 'GET' : 'POST', headers = {} } = {}) => fetch(base + p, {
    method, headers: { ...(origin ? { Origin: origin } : {}), ...(client ? { 'X-Athar-Client': client } : {}), 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { request, access, sha, dir, base, tick: (ms) => { now += ms; }, close: async () => { server.closeAllConnections(); await new Promise(r => server.close(r)); await fs.rm(dir, { recursive: true, force: true }); } };
}

test('documents, citations and originals are readable with no sign-in of any kind', async () => {
  const f = await fixture(); try {
    const docs = await f.request('/api/documents'); assert.equal(docs.status, 200);
    assert.match(docs.headers.get('cache-control'), /no-store/);
    const listed = (await docs.json()).documents; assert.ok(listed.some((d) => d.id === f.sha));
    assert.equal(listed.length, 3, 'registry lists exactly the three expected documents (indexed or missing)');
    assert.deepEqual(listed.map((d) => d.slug), ['financial-summary', 'financial-model', 'implementation-plan']);
    const cite = await f.request('/api/citations/src-synthetic'); assert.equal(cite.status, 200);
    const c = await cite.json(); assert.equal(c.location.page, 1); assert.equal(c.originalUrl, `/api/sources/${f.sha}`);
    const source = await f.request(c.originalUrl); assert.equal(source.status, 200);
    assert.equal(crypto.createHash('sha256').update(Buffer.from(await source.arrayBuffer())).digest('hex'), f.sha);
    // The old gate endpoints are gone.
    assert.equal((await f.request('/api/access')).status, 404);
  } finally { await f.close(); }
});

test('mutations still require a same-origin request (CSRF), and no cookie or token is ever issued', async () => {
  const f = await fixture(); try {
    for (const origin of ['https://untrusted.invalid', null]) assert.equal((await f.request('/api/chat/session', { origin, body: {} })).status, 403);
    const ok = await f.request('/api/chat/session', { body: { externalUserId: 'public' } });
    assert.equal(ok.status, 200); assert.equal(ok.headers.get('set-cookie'), null);
    const text = await ok.text(); assert.ok(!/token|passphrase|apikey/i.test(text));
  } finally { await f.close(); }
});

test('conversations stay attached to the anonymous client that created them', async () => {
  const f = await fixture({ provider: { isConfigured: () => true, createChatSession: async () => ({ id: 'synthetic-upstream' }), submitQuerySync: async () => ({ answer: '{"selections":[],"calculations":[],"missing":["Not established: nothing"],"unsupported":true,"conflicts":[]}' }) } }); try {
    const created = await (await f.request('/api/chat/session', { client: 'browser-aaaaaaaa', body: {} })).json();
    const other = await f.request('/api/chat/query', { client: 'browser-bbbbbbbb', body: { sessionId: created.sessionId, mode: 'sync', query: 'budget?' } });
    assert.equal(other.status, 404, 'another client cannot use this conversation id');
    const own = await f.request('/api/chat/query', { client: 'browser-aaaaaaaa', body: { sessionId: created.sessionId, mode: 'sync', query: 'budget?' } });
    assert.ok([200, 422, 502].includes(own.status), `owner reaches the pipeline (status ${own.status})`);
    // Without the header the principal falls back to client IP + user agent, so a plain browser still works.
    const plain = await (await f.request('/api/chat/session', { body: {} })).json();
    assert.ok(plain.sessionId);
  } finally { await f.close(); }
});

test('missing AI provider yields an explicit blocked state, not a canned answer', async () => {
  const f = await fixture(); try {
    const s = await (await f.request('/api/chat/session', { body: {} })).json();
    const r = await f.request('/api/chat/query', { body: { sessionId: s.sessionId, mode: 'sync', query: 'What is the budget?' } });
    assert.equal(r.status, 503); assert.ok(!(await r.text()).includes('USD 12'));
  } finally { await f.close(); }
});

test('per-IP throttle protects the evidence routes', async () => {
  const f = await fixture(); try {
    let limited = false;
    for (let i = 0; i < 30; i++) { const r = await f.request('/api/chat/session', { body: {} }); if (r.status === 429) { limited = true; break; } }
    assert.ok(limited, 'rate limit engages within 30 requests in one minute');
  } finally { await f.close(); }
});

test('tampered original is not returned under a valid source ID', async () => {
  const f = await fixture(); try {
    await fs.writeFile(path.join(f.dir, 'test.pdf'), Buffer.from('tampered bytes'));
    assert.equal((await f.request(`/api/sources/${f.sha}`)).status, 503);
  } finally { await f.close(); }
});

test('media capabilities are scoped, expire, and never grant anything else', async () => {
  const f = await fixture(); try {
    const cap = f.access.mediaCapability('media-1');
    assert.equal(f.access.validMediaCapability('media-1', cap.expires, cap.cap), true);
    assert.equal(f.access.validMediaCapability('media-2', cap.expires, cap.cap), false);
    assert.equal(f.access.validMediaCapability('media-1', cap.expires, 'forged'), false);
    f.tick(130_000);
    assert.equal(f.access.validMediaCapability('media-1', cap.expires, cap.cap), false);
    const principal = f.access.read({ headers: { 'x-athar-client': 'browser-aaaaaaaa', 'user-agent': 'ua' }, socket: { remoteAddress: '127.0.0.1' } });
    assert.equal(principal.principal, 'client:browser-aaaaaaaa'); assert.equal(principal.anonymous, true);
  } finally { await f.close(); }
});

test('responses carry CSP frame-ancestors (default *) and never X-Frame-Options; ATHAR_FRAME_ANCESTORS restricts the embedders', async () => {
  const { createApiApp } = await import('../server/api.js');
  const previous = process.env.ATHAR_FRAME_ANCESTORS;
  for (const [setting, expected] of [[undefined, 'frame-ancestors *'], ["'self' https://embed.example", "frame-ancestors 'self' https://embed.example"]]) {
    if (setting === undefined) delete process.env.ATHAR_FRAME_ANCESTORS; else process.env.ATHAR_FRAME_ANCESTORS = setting;
    const app = createApiApp();
    const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    try {
      const res = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('x-frame-options'), null, 'X-Frame-Options must not be sent');
      assert.equal(res.headers.get('content-security-policy'), expected);
      const body = await res.json(); assert.equal(body.access, 'public'); assert.equal(body.presentationMode, 'public');
      assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/api/access`)).status, 404, 'gate endpoint removed');
    } finally { server.closeAllConnections(); await new Promise(r => server.close(r)); }
  }
  if (previous === undefined) delete process.env.ATHAR_FRAME_ANCESTORS; else process.env.ATHAR_FRAME_ANCESTORS = previous;
});
