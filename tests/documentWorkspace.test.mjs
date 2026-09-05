import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { validateCorpusIndex, retrieveEvidence } from '../server/retrieval.js';

// Desired document-only contract, NOT a gate bypass. All original bytes, records
// and provider replies are synthetic, test-only fixtures. No real corpus/keys,
// live provider, browser or deployment. Local HTTP uses node:http; fetch is blocked.
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const savedFetch = globalThis.fetch, savedExistsSync = fsSync.existsSync;
let outboundAttempts = 0;
globalThis.fetch = async () => { outboundAttempts++; throw new Error('Live fetch forbidden in document-workspace tests'); };
// Simulate absent optional env files in this process only; never move/edit secrets.
fsSync.existsSync = filename => /(?:^|[\\/])(?:\.env|env\.local)$/.test(String(filename)) ? false : savedExistsSync(filename);
const envNames = ['ATHAR_CORPUS_DIR', 'ATHAR_CONFIG_FILE', 'ATHAR_REVIEW_PASSPHRASE', 'ATHAR_SESSION_SECRET',
  'ATHAR_PRIVATE_PRESENTATION', 'ATHAR_COOKIE_SAMESITE', 'ON_DEMAND_API_KEY', 'ONDEMAND_API_KEY'];
const previousEnv = new Map(envNames.map(name => [name, process.env[name]]));
for (const name of envNames) delete process.env[name];
process.env.ATHAR_CORPUS_DIR = path.join(os.tmpdir(), 'unused-document-corpus-' + randomUUID());
process.env.ATHAR_CONFIG_FILE = path.join(process.env.ATHAR_CORPUS_DIR, '.env');
after(() => {
  globalThis.fetch = savedFetch; fsSync.existsSync = savedExistsSync;
  for (const [name, value] of previousEnv) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  assert.equal(outboundAttempts, 0, 'Injected provider must prevent every external fetch');
});

function fakeProvider({ configured = true, answer } = {}) {
  const calls = { sessions: [], queries: [] };
  return { calls, provider: {
    isConfigured: () => configured,
    createChatSession: async (...args) => { const id = 'test-upstream-' + (calls.sessions.length + 1); calls.sessions.push({ id, args }); return { id }; },
    submitQuerySync: async (id, query, options) => {
      const marker = '\nEVIDENCE_DATA_JSON:\n', start = options.fulfillmentPrompt.indexOf(marker);
      assert.ok(start >= 0, 'Real evidence prompt must reach the injected provider');
      // A validation repair follows the original JSON on a separate line.
      const data = JSON.parse(options.fulfillmentPrompt.slice(start + marker.length).split('\n')[0]);
      calls.queries.push({ id, query, data, options });
      if (answer) return answer(data, calls.queries.length);
      return { answer: JSON.stringify({ selections: data.selectionCatalog.map(p => ({ id: p.id })),
        calculations: [], conflicts: [], missing: [], unsupported: data.selectionCatalog.length === 0 }) };
    },
  } };
}
function cell(address, value, extra = {}) {
  const [, column, row] = /^([A-Z]+)(\d+)$/.exec(address);
  return { recordType: 'cell', sheet: 'Data', cell: address, row: Number(row),
    columnIndex: [...column].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0),
    value, rawValue: value == null ? null : String(value), displayValue: null,
    valueType: typeof value === 'number' ? 'number' : 'string', formula: null,
    cache: { state: 'not-applicable', lexeme: null }, numberFormat: { code: 'General', id: 0 }, ...extra };
}
async function corpusFixture(t, { versions = false } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'document-workspace-synthetic-'));
  t.after(() => fs.rm(root, { force: true, recursive: true }));
  for (const dir of ['originals', 'raw', 'views']) await fs.mkdir(path.join(root, dir));
  const specs = [
    { slug: 'financial-summary', kind: 'pdf', text: 'Cobalt inspection status is pending independent source review.' },
    { slug: 'executive-presentation', kind: 'pptx', text: 'Cobalt inspection status remains under source review.' },
    { slug: 'financial-model', kind: 'xlsx', text: 'Cobalt source ledger\nData!B2: 12.5\nSaved source quantity, not a computed answer.' },
    { slug: 'implementation-plan', kind: 'xlsx', text: 'Cobalt inspection status awaits the signed source checklist.' },
  ];
  if (versions) specs.push({ slug: 'financial-summary-abcdef1234', kind: 'pdf', text: 'Cobalt alternate version retains the violet end sentinel.' },
    { slug: 'implementation-plan-abcdef1234', kind: 'xlsx', text: 'Cobalt supplemental source retains the amber end sentinel.' });
  const documents = [], chunks = [], originals = new Map();
  for (const [i, spec] of specs.entries()) {
    const original = Buffer.from(spec.kind === 'pdf' ? '%PDF-1.7\nSynthetic source ' + i + '\n%%EOF' : 'SYNTHETIC original ' + spec.kind + ' ' + i);
    const id = digest(original), doc = { id, sha256: id, slug: spec.slug,
      title: spec.kind === 'pdf' ? 'Synthetic brief.pdf' : 'Synthetic ' + spec.kind + ' source',
      originalName: spec.kind === 'pdf' ? 'Synthetic brief.pdf' : 'Synthetic source.' + spec.kind,
      kind: spec.kind, status: 'extracted', limitations: [], originalFile: 'originals/' + id + '.' + spec.kind,
      rawFile: 'raw/' + id + '.records.jsonl.gz', coverage: spec.kind === 'pdf' ? { pages: 2 } : spec.kind === 'pptx' ? { slides: 1, notes: 1 }
        : spec.kind === 'xlsx' ? { cellCount: 5, formulaCount: 2, sheets: [{ name: 'Data', dimension: 'A1:D90', observedDimension: 'A1:D90', cellCount: 5 }] }
          : { paragraphs: 1, tables: 0 } };
    const records = spec.kind === 'xlsx' ? [cell('A1', 'Cobalt source ledger'), cell('B2', 12.5),
      cell('C2', null, { formula: { text: 'B2*2' }, cache: { state: 'absent', lexeme: null }, valueType: 'missing-formula-cache' }),
      cell('B3', 0, { formula: { text: 'B2-B2' }, cache: { state: 'present', lexeme: '0' } }),
      cell('D90', 'Tail sentinel retained in complete raw records.')]
      : spec.kind === 'pdf' ? [{ recordType: 'pdf-page', page: 1, width: 612, height: 792, rotation: 0, text: spec.text },
        { recordType: 'pdf-page', page: 2, width: 612, height: 792, rotation: 0, text: 'Synthetic last page.' }]
        : [{ recordType: spec.kind === 'docx' ? 'docx-paragraph' : 'pptx-paragraph', paragraph: 1,
          part: spec.kind === 'docx' ? 'word/document.xml#p1' : 'ppt/slides/slide1.xml', text: spec.text }];
    const raw = gzipSync([{ recordType: 'source', documentId: id, sha256: id }, ...records.map(r => ({ documentId: id, ...r }))].map(JSON.stringify).join('\n') + '\n');
    doc.rawSha256 = digest(raw);
    const chunk = { id: 'src-workspace-' + i, documentId: id, documentSlug: spec.slug, kind: spec.kind,
      label: doc.title + ' original location', text: spec.text,
      location: spec.kind === 'pdf' ? { page: 1 } : spec.kind === 'pptx' ? { slide: 1 }
        : spec.kind === 'xlsx' ? { sheet: 'Data', range: 'A1:D90' } : { part: 'word/document.xml#p1' },
      records: spec.kind === 'xlsx' ? records.slice(0, 4) : records, metadata: {} };
    await fs.writeFile(path.join(root, doc.originalFile), original); await fs.writeFile(path.join(root, doc.rawFile), raw);
    if (spec.kind === 'pptx') {
      const preview = Buffer.from('%PDF-1.7\nSynthetic PowerPoint derivative\n%%EOF');
      await fs.writeFile(path.join(root, 'views', id + '.pdf'), preview);
      await fs.writeFile(path.join(root, 'views', id + '.json'), JSON.stringify({ schemaVersion: 'athar-source-preview/v1',
        documentId: id, originalSha256: id, previewSha256: digest(preview), format: 'pdf', renderer: 'libreoffice', pageCount: 1 }));
    }
    documents.push(doc); chunks.push(chunk); originals.set(id, original);
  }
  const input = { schemaVersion: 'athar-corpus/v1', extractorVersion: 'synthetic-document-workspace/1', generatedAt: '2026-09-05T00:00:00Z', documents, chunks };
  await fs.writeFile(path.join(root, 'index.json'), JSON.stringify(input));
  return { root, input, documents, chunks, originals };
}
async function start(t, fake = fakeProvider(), options = {}) {
  const fixture = await corpusFixture(t, options), { createApiApp } = await import('../server/api.js');
  const app = createApiApp({ corpusDir: fixture.root, provider: fake.provider });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  function request(route, { method = 'GET', body, headers = {}, client = 'alpha' } = {}) {
    const defaults = { 'User-Agent': 'document-workspace-' + client + '/1', Connection: 'close' };
    if (!['GET', 'HEAD'].includes(method)) Object.assign(defaults, { Origin: origin, 'Sec-Fetch-Site': 'same-origin' });
    const encoded = body === undefined ? undefined : JSON.stringify(body);
    if (encoded !== undefined) Object.assign(defaults, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(encoded) });
    Object.assign(defaults, headers);
    for (const key of Object.keys(defaults)) if (defaults[key] == null) delete defaults[key];
    return new Promise((resolve, reject) => {
      const req = http.request(origin + route, { method, headers: defaults, agent: false }, res => {
        const buffers = [];
        res.on('data', chunk => buffers.push(chunk)); res.on('error', reject);
        res.on('end', () => { const bytes = Buffer.concat(buffers), text = bytes.toString('utf8'); let json = null;
          if (String(res.headers['content-type']).includes('application/json')) { try { json = JSON.parse(text); } catch {} }
          resolve({ status: res.statusCode, headers: res.headers, bytes, text, json }); });
      });
      req.on('error', reject); req.setTimeout(4000, () => req.destroy(new Error('Synthetic HTTP request timed out'))); req.end(encoded);
    });
  }
  return { ...fixture, ...fake, request, origin };
}
function ok(response, status = 200) { assert.equal(response.status, status, response.json?.code || 'Unexpected HTTP status'); return response; }
function noCookie(response) { assert.equal(response.headers['set-cookie'], undefined, 'Workspace must not issue a login cookie'); }
async function session(f, options = {}) {
  const response = ok(await f.request('/api/chat/session', { method: 'POST', body: {}, ...options })); noCookie(response);
  assert.equal(typeof response.json.sessionId, 'string'); assert.ok(response.json.sessionId.length >= 24); return response.json.sessionId;
}
const question = 'What is the cobalt inspection status in this document?';
const queryBody = (f, id, extra = {}) => ({ sessionId: id, query: question, documentId: f.documents[0].id, mode: 'sync', ...extra });


// Validate the test harness itself before blaming integration failures on app code.
test('synthetic fixture and injected provider self-check against preserved grounding pipeline', async t => {
  const f = await corpusFixture(t), index = validateCorpusIndex(f.input), fake = fakeProvider();
  const { buildEvidencePrompt, prepareModelSelection, validateEvidenceAnswer } = await import('../server/evidenceAnswer.js');
  const { createSourceView } = await import('../server/sourceView.js');
  for (const position of [0, 3]) {
    const documentId = f.documents[position].id;
    const retrieved = retrieveEvidence(index, { question, documentId });
    const fulfillmentPrompt = buildEvidencePrompt({ question, retrieved, documentId });
    const upstream = await fake.provider.createChatSession('synthetic-fixture-self-check', []);
    const data = await fake.provider.submitQuerySync(upstream.id, 'test only', { fulfillmentPrompt });
    const result = validateEvidenceAnswer(prepareModelSelection(data.answer, retrieved), { retrieved, question });
    assert.ok(result.answer.includes(f.chunks[position].text));
    assert.ok(result.citations.every(c => c.documentId === documentId));
  }
  const views = createSourceView({ corpusDir: f.root, loadIndex: async () => index });
  const tail = await views.location(f.chunks[2].id, { sheet: 'Data', range: 'D90' });
  assert.equal(tail.rows[0].cells[0].value, 'Tail sentinel retained in complete raw records.');
});

// Deliberately red against the former access-gated app; not skips or xfail.
test('missing optional .env and gate variables do not prevent startup or anonymous library access', async t => {
  const f = await start(t), health = ok(await f.request('/api/health')); noCookie(health);
  assert.equal(health.json.configured, true, 'Health must use injected provider, not a real key');
  assert.equal(health.json.reviewAccessConfigured, undefined); assert.equal(health.json.narration, undefined);
  const response = ok(await f.request('/api/documents')); noCookie(response);
  assert.deepEqual(response.json.documents.map(d => d.id).sort(), f.documents.map(d => d.id).sort());
  assert.doesNotMatch(response.text, /originalFile|rawFile|rawSha256|athar_review|passphrase|sessionSecret/i);
  assert.ok(!response.text.includes(f.root)); assert.equal(f.calls.sessions.length, 0);
});

test('access, presentation, guide/audio and voice APIs are REMOVED, not authorized or bypassed', async t => {
  const f = await start(t), routes = ['/api/access', '/api/presentation', '/api/guide', '/api/guide/steps', '/api/guide/audio',
    '/api/guide-audio/manifest', '/api/guide-audio/synthetic.mp3', '/api/voice', '/api/voice/turn', '/api/voice/text-turn',
    '/api/voice/tts', '/api/voice/audio/synthetic.mp3', '/api/voice/execution/synthetic'];
  for (const route of routes) for (const method of ['GET', 'POST', 'DELETE']) {
    const response = await f.request(route, { method, body: method === 'POST' ? {} : undefined });
    assert.equal(response.status, 404, method + ' ' + route + ' must be an absent route'); noCookie(response);
  }
  assert.equal(f.calls.sessions.length, 0); assert.equal(f.calls.queries.length, 0);
});

test('every listed original is anonymously downloadable with exact hash and correct format', async t => {
  const f = await start(t), types = { pdf: 'application/pdf', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  for (const doc of f.documents) {
    const response = ok(await f.request('/api/sources/' + doc.id)); noCookie(response);
    assert.equal(digest(response.bytes), doc.id); assert.deepEqual(response.bytes, f.originals.get(doc.id));
    assert.equal(response.headers['content-type'].split(';')[0], types[doc.kind]);
    assert.match(response.headers['content-disposition'], /attachment/); assert.equal(response.headers['x-content-type-options'], 'nosniff');
  }
});

test('citations and PDF/PowerPoint previews retain exact source identity', async t => {
  const f = await start(t);
  for (const chunk of f.chunks) {
    const response = ok(await f.request('/api/citations/' + chunk.id)); noCookie(response);
    assert.equal(response.json.documentId, chunk.documentId); assert.equal(response.json.excerpt, chunk.text);
    assert.equal(response.json.originalUrl, '/api/sources/' + chunk.documentId);
  }
  for (const doc of f.documents.filter(d => ['pdf', 'pptx'].includes(d.kind))) {
    const response = ok(await f.request('/api/sources/' + doc.id + '/preview')); noCookie(response);
    assert.match(response.headers['content-type'], /application\/pdf/); assert.equal(response.headers['x-source-sha256'], doc.id);
    assert.equal(response.bytes.subarray(0, 5).toString(), '%PDF-');
  }
});

test('workbook embeds full raw tail locations and distinguishes missing caches from zero', async t => {
  const f = await start(t), route = '/api/citations/' + f.chunks[2].id + '/view';
  const tail = ok(await f.request(route + '?sheet=Data&range=D90'));
  assert.equal(tail.json.rows[0].cells[0].value, 'Tail sentinel retained in complete raw records.');
  const response = ok(await f.request(route + '?sheet=Data&range=B2:C3')), cells = response.json.rows.flatMap(r => r.cells);
  assert.equal(cells.find(c => c.address === 'C2').value, null); assert.equal(cells.find(c => c.address === 'C2').cache.state, 'absent');
  assert.equal(cells.find(c => c.address === 'B3').value, 0); assert.ok(response.json.cellCount <= 200);
  for (const suffix of ['?range=A1:XFD1048576', '?page=1e2', '?sheet[]=Data', '?unknown=true']) ok(await f.request(route + suffix), 400);
});

test('second workbook opens independently with its own hash and complete sheet navigation', async t => {
  const f = await start(t), chunk = f.chunks[3], response = ok(await f.request('/api/citations/' + chunk.id + '/view'));
  assert.equal(response.json.kind, 'xlsx'); assert.equal(response.json.originalSha256, chunk.documentId);
  assert.equal(response.json.availableLocations.sheets[0].name, 'Data');
});

test('hash-distinct versions of selected document families remain separately retrievable', async t => {
  const f = await corpusFixture(t, { versions: true }), index = validateCorpusIndex(f.input);
  assert.equal(index.documents.length, 6); assert.equal(index.documents.filter(d => d.originalName === 'Synthetic brief.pdf').length, 2);
  for (const doc of f.documents) {
    const result = retrieveEvidence(index, { documentId: doc.id, question: 'Cobalt source inspection status sentinel' });
    assert.ok(result.chunks.length > 0, doc.slug + ' must be retrievable'); assert.ok(result.chunks.every(c => c.documentId === doc.id));
    assert.equal(result.chunks[0].text, f.chunks.find(c => c.documentId === doc.id).text);
  }
});

test('public library retains all hash versions rather than four canonical sources', async t => {
  const f = await start(t, fakeProvider(), { versions: true }), response = ok(await f.request('/api/documents'));
  assert.deepEqual(response.json.documents.map(d => d.id).sort(), f.documents.map(d => d.id).sort());
});

test('real chat pipeline calls injected provider, validates selections and isolates source scopes', async t => {
  const f = await start(t), id = await session(f); assert.equal(f.calls.sessions.length, 0);
  for (const position of [0, 3]) {
    const doc = f.documents[position], response = ok(await f.request('/api/chat/query', { method: 'POST', body: queryBody(f, id, { documentId: doc.id }) }));
    noCookie(response); assert.equal(response.json.status, 'done'); assert.ok(response.json.answer.includes(f.chunks[position].text));
    assert.ok(response.json.citations.length > 0); assert.ok(response.json.citations.every(c => c.documentId === doc.id));
    const payload = JSON.stringify(f.calls.queries.at(-1).data);
    for (const other of f.documents.filter(d => d.id !== doc.id)) assert.ok(!payload.includes(other.id), 'Evidence must not cross current source scope');
  }
  assert.equal(f.calls.sessions.length, 2); assert.equal(f.calls.queries.length, 2);
  assert.notEqual(f.calls.queries[0].id, f.calls.queries[1].id); assert.equal(f.calls.queries[1].data.previousUserQuestion, null);
});

test('provider unavailable never disables documents or emits a substitute answer', async t => {
  const f = await start(t, fakeProvider({ configured: false })), id = await session(f);
  const response = ok(await f.request('/api/chat/query', { method: 'POST', body: queryBody(f, id) }), 503);
  assert.equal(response.json.answer, undefined); assert.equal(f.calls.sessions.length, 0);
  ok(await f.request('/api/documents')); ok(await f.request('/api/sources/' + f.documents[0].id));
});

test('unvalidated model output is rejected after bounded repair, without canned success', async t => {
  const f = await start(t, fakeProvider({ answer: () => ({ answer: 'Invented test-only response that is not evidence JSON.' }) })), id = await session(f);
  const response = ok(await f.request('/api/chat/query', { method: 'POST', body: queryBody(f, id) }), 422);
  assert.equal(response.json.answer, undefined); assert.ok(!response.text.includes('Invented test-only')); assert.equal(f.calls.queries.length, 2);
});

test('same-origin checks remain without login, including spoofed forwarded headers', async t => {
  const f = await start(t);
  for (const route of ['/api/chat/session', '/api/chat/query', '/api/documents/retry']) {
    for (const headers of [{ Origin: null }, { Origin: 'null' }, { Origin: 'not a URL' },
      { Origin: 'https://untrusted.example', 'X-Forwarded-Host': 'untrusted.example' }, { Origin: f.origin, 'Sec-Fetch-Site': 'cross-site' }]) {
      const response = ok(await f.request(route, { method: 'POST', body: {}, headers }), 403); assert.equal(response.json.code, 'origin_forbidden'); noCookie(response);
    }
  }
  assert.equal(f.calls.sessions.length, 0); assert.equal(f.calls.queries.length, 0);
});

test('rate limit cannot be reset with cookies, external user IDs or spoofed X-Forwarded-For', async t => {
  const f = await start(t); let accepted = 0, limited = false;
  for (let i = 0; i < 25; i++) {
    const response = await f.request('/api/chat/session', { method: 'POST', body: { externalUserId: 'arbitrary-' + i },
      headers: { Cookie: 'athar_review=not-a-credential-' + i, 'X-Forwarded-For': '198.51.100.' + (i + 1) } }); noCookie(response);
    if (response.status === 429) { assert.equal(response.json.code, 'rate_limited'); limited = true; break; }
    ok(response); accepted++;
  }
  assert.ok(accepted > 0); assert.ok(limited, 'Existing 20/minute abuse boundary must remain'); assert.ok(accepted <= 20);
});

test('anonymous ownership ignores login cookies and client supplied externalUserId', async t => {
  const f = await start(t), id = await session(f, { client: 'alpha' });
  ok(await f.request('/api/chat/query', { method: 'POST', client: 'alpha', headers: { Cookie: 'athar_review=irrelevant' }, body: queryBody(f, id) }));
  const previousCalls = f.calls.queries.length;
  const other = ok(await f.request('/api/chat/query', { method: 'POST', client: 'beta', body: queryBody(f, id, { externalUserId: 'alpha', principal: 'alpha' }) }), 404);
  assert.equal(other.json.code, 'conversation_not_found'); assert.equal(f.calls.queries.length, previousCalls);
  ok(await f.request('/api/chat/query', { method: 'POST', body: queryBody(f, randomUUID()) }), 404);
});

test('only one in-flight request per anonymous conversation is permitted', { timeout: 8000 }, async t => {
  let release, entered; const wait = new Promise(resolve => { release = resolve; }), arrival = new Promise(resolve => { entered = resolve; });
  const fake = fakeProvider({ answer: async (data, count) => {
    if (count === 1) { entered(); await wait; }
    return { answer: JSON.stringify({ selections: data.selectionCatalog.map(p => ({ id: p.id })), calculations: [], conflicts: [], missing: [], unsupported: false }) };
  } });
  const f = await start(t, fake), id = await session(f), first = f.request('/api/chat/query', { method: 'POST', body: queryBody(f, id) }); let timer;
  try {
    await Promise.race([arrival, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Injected provider never reached')), 2500); })]);
    const response = ok(await f.request('/api/chat/query', { method: 'POST', body: queryBody(f, id) }), 409);
    assert.equal(response.json.code, 'conversation_busy'); assert.equal(f.calls.queries.length, 1);
  } finally { clearTimeout(timer); release(); await first; }
  ok(await first); ok(await f.request('/api/chat/query', { method: 'POST', body: queryBody(f, id) }));
});

test('SSE exposes only validated completion, never speculative model tokens', async t => {
  const f = await start(t), id = await session(f), response = ok(await f.request('/api/chat/query', { method: 'POST', body: queryBody(f, id, { mode: 'stream' }) }));
  assert.match(response.headers['content-type'], /text\/event-stream/);
  const events = response.text.split('\n').filter(line => line.startsWith('data:')).map(line => JSON.parse(line.slice(5).trim()));
  assert.deepEqual(events.map(event => event.type), ['done', 'metrics']); assert.ok(events[0].answer.includes(f.chunks[0].text)); assert.ok(events[0].citations.length > 0);
});

test('question validation and source integrity failures remain fail-closed', async t => {
  const f = await start(t), id = await session(f);
  for (const query of ['', '   ', 123, 'x'.repeat(4001)]) ok(await f.request('/api/chat/query', { method: 'POST', body: queryBody(f, id, { query }) }), 400);
  assert.equal(f.calls.queries.length, 0); ok(await f.request('/api/sources/' + '0'.repeat(64)), 404);
  const doc = f.documents[0], original = path.join(f.root, doc.originalFile); ok(await f.request('/api/sources/' + doc.id));
  await fs.writeFile(original, Buffer.from('Changed synthetic source bytes'));
  const response = ok(await f.request('/api/sources/' + doc.id), 503);
  assert.equal(response.json.code, 'source_integrity_failed'); assert.ok(!response.text.includes(original)); assert.ok(!response.text.includes('Changed synthetic source'));
});

test('createEvidenceRoutes remains independently constructible using corpusDir/provider only', async t => {
  const fixture = await corpusFixture(t), fake = fakeProvider(), { createEvidenceRoutes } = await import('../server/evidenceRoutes.js');
  const service = createEvidenceRoutes({ corpusDir: fixture.root, provider: fake.provider });
  assert.equal(typeof service.router, 'function'); assert.equal(typeof service.answerQuestion, 'function');
});
