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
// open evidence routes, conversations identified by their random id only (no client/IP/Origin binding — those
// produced 404/403 "zero output" inside iframes and behind proxies), a per-IP throttle, single-use media
// capabilities, and the non-empty grounded answer contract. Synthetic fixtures only; no live model calls.
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

test('chat works without an Origin header or client id, and no cookie or token is ever issued', async () => {
  const f = await fixture(); try {
    // No cookie exists, so there is no CSRF surface: a missing or foreign Origin must not block the chat (proxies and
    // embedded frames rewrite or drop it — that was one of the "no answer" paths).
    for (const origin of ['https://untrusted.invalid', null]) assert.equal((await f.request('/api/chat/session', { origin, body: {} })).status, 200);
    const ok = await f.request('/api/chat/session', { body: { externalUserId: 'public' } });
    assert.equal(ok.status, 200); assert.equal(ok.headers.get('set-cookie'), null);
    const text = await ok.text(); assert.ok(!/token|passphrase|apikey/i.test(text));
    assert.match(JSON.parse(text).sessionId, /^[0-9a-f-]{36}$/);
  } finally { await f.close(); }
});

const plainProvider = (answer = 'The programme budget is **USD 12 million**; approval remains To be agreed. Sources: [1]') => ({
  isConfigured: () => true, createChatSession: async () => ({ id: 'synthetic-upstream' }), submitQuerySync: async () => ({ answer }),
});

test('a conversation is identified by its id only: any client, any origin, and an unknown id starts fresh instead of 404', async () => {
  const f = await fixture({ provider: plainProvider() }); try {
    const created = await (await f.request('/api/chat/session', { client: 'browser-aaaaaaaa', body: {} })).json();
    const other = await f.request('/api/chat/query', { client: 'browser-bbbbbbbb', origin: null, body: { sessionId: created.sessionId, mode: 'sync', query: 'budget?' } });
    assert.equal(other.status, 200, 'the same conversation id keeps working when the client id / origin changes');
    const unknown = await f.request('/api/chat/query', { body: { sessionId: crypto.randomUUID(), mode: 'sync', query: 'budget?' } });
    assert.equal(unknown.status, 200, 'an unknown (e.g. pre-restart) id is accepted as a new conversation');
    assert.equal((await f.request('/api/chat/query', { body: { sessionId: 'not a session id!', mode: 'sync', query: 'budget?' } })).status, 400);
  } finally { await f.close(); }
});

test('every answer is a non-empty grounded reply: model text, empty model reply, upstream failure and missing corpus', async () => {
  const f = await fixture({ provider: plainProvider() }); try {
    const s = await (await f.request('/api/chat/session', { body: {} })).json();
    const ok = await (await f.request('/api/chat/query', { body: { sessionId: s.sessionId, mode: 'sync', query: 'What is the budget?' } })).json();
    assert.equal(ok.status, 'done'); assert.match(ok.answer, /USD 12 million/); assert.doesNotMatch(ok.answer, /Sources:/, 'the Sources line becomes structured citations');
    assert.equal(ok.grounding.status, 'grounded'); assert.equal(ok.citations.length, 1); assert.equal(ok.citations[0].id, 'src-synthetic');
    assert.match(ok.citations[0].label, /Page 1/);
    // Streaming clients receive the same result as a single done frame.
    const stream = await f.request('/api/chat/query', { body: { sessionId: s.sessionId, mode: 'stream', query: 'And the approval?' } });
    assert.match(stream.headers.get('content-type'), /text\/event-stream/);
    const frames = (await stream.text()).split('\n\n').filter(Boolean).map((line) => JSON.parse(line.replace(/^data: /, '')));
    assert.equal(frames[0].type, 'done'); assert.match(frames[0].answer, /USD 12 million/);
  } finally { await f.close(); }
  // Empty upstream reply → one retry, then a deterministic digest of the retrieved passages (never blank).
  let calls = 0;
  const empty = await fixture({ provider: { ...plainProvider(), submitQuerySync: async () => { calls++; return { answer: '' }; } } }); try {
    const s = await (await empty.request('/api/chat/session', { body: {} })).json();
    const r = await empty.request('/api/chat/query', { body: { sessionId: s.sessionId, mode: 'sync', query: 'What is the budget?' } });
    assert.equal(r.status, 200); const body = await r.json();
    assert.equal(calls, 2); assert.equal(body.grounding.status, 'degraded'); assert.equal(body.grounding.reason, 'empty_upstream_answer');
    assert.ok(body.answer.length > 40); assert.match(body.answer, /USD 12 million/, 'the digest carries the retrieved evidence text');
  } finally { await empty.close(); }
  // Upstream failure (e.g. HTTP 500 from the AI service) → degraded digest, still HTTP 200 and non-empty.
  const failing = await fixture({ provider: { ...plainProvider(), submitQuerySync: async () => { throw Object.assign(new Error('upstream 500'), { status: 500 }); } } }); try {
    const s = await (await failing.request('/api/chat/session', { body: {} })).json();
    const r = await failing.request('/api/chat/query', { body: { sessionId: s.sessionId, mode: 'sync', query: 'What is the budget?' } });
    assert.equal(r.status, 200); const body = await r.json();
    assert.equal(body.grounding.status, 'degraded'); assert.equal(body.grounding.reason, 'upstream_500'); assert.match(body.answer, /USD 12 million/);
  } finally { await failing.close(); }
  // Missing corpus → an explicit, non-empty explanation (status "unavailable"), not a 503 blank.
  const noCorpus = await fixture({ provider: plainProvider() }); try {
    await fs.rm(path.join(noCorpus.dir, 'index.json'));
    const s = await (await noCorpus.request('/api/chat/session', { body: {} })).json();
    const r = await noCorpus.request('/api/chat/query', { body: { sessionId: s.sessionId, mode: 'sync', query: 'What is the budget?' } });
    assert.equal(r.status, 200); const body = await r.json();
    assert.equal(body.grounding.status, 'unavailable'); assert.match(body.answer, /not provisioned/);
  } finally { await noCorpus.close(); }
});

test('missing AI provider yields an explicit 503 with a human-readable message, not a canned answer', async () => {
  const f = await fixture(); try {
    const s = await (await f.request('/api/chat/session', { body: {} })).json();
    const r = await f.request('/api/chat/query', { body: { sessionId: s.sessionId, mode: 'sync', query: 'What is the budget?' } });
    assert.equal(r.status, 503); const text = await r.text(); assert.ok(!text.includes('USD 12')); assert.match(text, /ON_DEMAND_API_KEY/);
  } finally { await f.close(); }
});

test('per-IP throttle protects the evidence routes (40 requests per minute)', async () => {
  const f = await fixture(); try {
    let limited = null;
    for (let i = 1; i <= 60; i++) { const r = await f.request('/api/chat/session', { body: {} }); if (r.status === 429) { limited = i; break; } }
    assert.equal(limited, 41, 'the 41st request within a minute is throttled');
    f.tick(61_000);
    assert.equal((await f.request('/api/chat/session', { body: {} })).status, 200, 'the window resets after a minute');
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
