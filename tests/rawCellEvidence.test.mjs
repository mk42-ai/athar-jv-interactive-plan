import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { augmentExactCellEvidence } from '../server/rawCellEvidence.js';
import { createSourceView } from '../server/sourceView.js';
import { retrieveEvidence, validateCorpusIndex } from '../server/retrieval.js';

// Entirely synthetic, including the original bytes and raw JSONL. Never load the
// private production corpus, provider secrets, public assets, or live routes.
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
    : JSON.stringify(value);
function cell(sheet, address, value, overrides = {}) {
  const [, column, row] = /^([A-Z]+)(\d+)$/.exec(address);
  return { recordType: 'cell', sheet, cell: address, row: Number(row),
    columnIndex: [...column].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0),
    value, rawValue: value == null ? null : String(value), displayValue: null,
    formula: null, cache: { state: 'not-applicable', lexeme: null },
    valueType: typeof value === 'number' ? 'number' : 'string',
    numberFormat: { code: 'General', id: 0 }, ...overrides };
}
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'raw-cell-evidence-synthetic-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'originals')); await fs.mkdir(path.join(root, 'raw'));
  const originalBytes = Buffer.from('synthetic XLSX original bytes, never a real financial workbook');
  const id = hash(originalBytes);
  const records = [
    cell('Draws', 'A1', 'Synthetic header', { role: 'header' }),
    cell('Draws', 'G20', 17.25, { rawValue: '17.2500', formula: { text: 'SUM(D20:F20)', type: 'normal' }, cache: { state: 'present', lexeme: '17.2500' } }),
    cell('Draws', 'G21', null, { formula: { text: 'G20*2' }, cache: { state: 'absent', lexeme: null }, valueType: 'missing-formula-cache' }),
    cell('Draws', 'G22', 0, { formula: { text: 'G20-G20' }, cache: { state: 'present', lexeme: '0' } }),
    cell('Draws', 'G23', null, { formula: { text: 'G20' }, cache: { state: 'empty', lexeme: null }, valueType: 'missing-formula-cache' }),
    cell('Other Sheet', 'A1', 'Another synthetic header'), cell('Other Sheet', 'G20', 99),
    cell("Investor's Draws", 'A1', 'A third synthetic header'), cell("Investor's Draws", 'G20', 5),
  ].map(record => ({ documentId: id, ...record }));
  const raw = gzipSync([{ recordType: 'source', documentId: id, sha256: id }, ...records].map(JSON.stringify).join('\n') + '\n');
  const doc = { id, sha256: id, slug: 'financial-model', title: 'Synthetic dense workbook', kind: 'xlsx', status: 'extracted', limitations: [],
    originalFile: `originals/${id}.xlsx`, rawFile: `raw/${id}.records.jsonl.gz`, rawSha256: hash(raw),
    coverage: { sheets: ['Draws', 'Other Sheet', "Investor's Draws"].map(name => ({ name, dimension: 'A1:T100', cellCount: records.filter(r => r.sheet === name).length })) } };
  const input = { schemaVersion: 'athar-corpus/v1', extractorVersion: 'synthetic-test/1', generatedAt: '2026-01-01T00:00:00Z', documents: [doc],
    chunks: doc.coverage.sheets.map((sheet, i) => ({ id: `src-synthetic-dense-${i}`, documentId: id, documentSlug: doc.slug,
      kind: 'sheet-rows', location: { sheet: sheet.name, range: 'A1:T100' }, label: `${sheet.name} synthetic sampled batch`,
      text: `${sheet.name} sampled original A1=Synthetic header`, records: records.filter(r => r.sheet === sheet.name && r.cell === 'A1'), metadata: { rawBatch: true } })) };
  await fs.writeFile(path.join(root, doc.originalFile), originalBytes);
  await fs.writeFile(path.join(root, doc.rawFile), raw);
  await fs.writeFile(path.join(root, 'index.json'), JSON.stringify(input));
  const index = validateCorpusIndex(input);
  const service = createSourceView({ corpusDir: root, loadIndex: async () => index });
  let calls = 0;
  const sourceViews = { location: async (...args) => { calls++; return service.location(...args); } };
  const retrieve = (question = 'What is Draws!G20?', options = {}) => retrieveEvidence(index, { question, documentId: id, ...options });
  return { root, id, doc, input, index, records, raw, originalBytes, service, sourceViews, retrieve, calls: () => calls };
}

function expectedProjectionHash(snapshot) {
  const keys = ['schemaVersion', 'baseId', 'documentId', 'originalSha256', 'rawSha256', 'exactLocation', 'records'];
  return hash(stable(Object.fromEntries(keys.map(key => [key, snapshot[key]]))));
}

test('dense raw cell omitted by sampled retrieval is recovered with original citation identity and verified source hashes', async t => {
  const f = await fixture(t), empty = f.retrieve(), before = JSON.stringify(f.index);
  const indexBytes = await fs.readFile(path.join(f.root, 'index.json'));
  assert.equal(empty.chunks.length, 0);
  assert.ok(!f.index.chunks[0].records.some(record => record.cell === 'G20'));
  const result = await augmentExactCellEvidence(f.index, empty, { sourceViews: f.sourceViews });
  assert.equal(f.calls(), 1); assert.equal(result.chunks.length, 1);
  const projected = result.chunks[0], parent = f.index.chunks[0], snapshot = result.rawCellEvidence[0];
  assert.equal(projected.id, parent.id); assert.equal(projected.documentId, parent.documentId);
  assert.equal(projected.label, parent.label); assert.deepEqual(projected.location, parent.location);
  assert.ok(projected.text.startsWith(parent.text)); assert.equal(projected.evidenceOrigin, 'raw-record-projection');
  assert.ok(projected.text.includes(result.modelChunks[0].text)); assert.equal(result.modelChunks[0].excerpted, true);
  assert.equal(result.recordsById.get(parent.id), projected); assert.equal(result.recordsById.set, undefined);
  const record = projected.records.find(record => record.cell === 'G20');
  const rawRecord = f.records.find(record => record.sheet === 'Draws' && record.cell === 'G20');
  for (const key of ['value', 'rawValue', 'formula', 'cache', 'displayValue', 'numberFormat', 'valueType']) assert.deepEqual(record[key], rawRecord[key]);
  assert.match(snapshot.text, /Draws!G20: value=17\.25/); assert.match(snapshot.text, /rawValue="17\.2500"/);
  assert.match(snapshot.text, /SUM\(D20:F20\)/); assert.match(snapshot.text, /"state":"present"/);
  assert.deepEqual(snapshot.exactLocation, { sheet: 'Draws', range: 'G20' });
  assert.deepEqual(snapshot.location, parent.location); assert.equal(snapshot.baseId, parent.id);
  assert.equal(snapshot.rawSha256, hash(f.raw)); assert.equal(snapshot.originalSha256, hash(f.originalBytes));
  assert.equal(snapshot.rawProjectionHash, expectedProjectionHash(snapshot));
  assert.equal(projected.metadata.rawProjectionHash, snapshot.rawProjectionHash);
  assert.deepEqual(projected.metadata.rawEvidenceLocation, snapshot.exactLocation);
  assert.equal(result.charCount, result.modelChunks.reduce((n, chunk) => n + chunk.text.length, 0));
  assert.equal(result.fullOriginal.containsRawRecordProjections, true);
  assert.throws(() => { snapshot.records[0].value = 0; }, TypeError);
  assert.throws(() => { projected.metadata.rawEvidenceLocation.range = 'A1'; }, TypeError);
  assert.equal(JSON.stringify(f.index), before);
  assert.deepEqual(await fs.readFile(path.join(f.root, 'index.json')), indexBytes);
  assert.deepEqual(await fs.readFile(path.join(f.root, f.doc.originalFile)), f.originalBytes);
  assert.deepEqual(await fs.readFile(path.join(f.root, f.doc.rawFile)), f.raw);
  const url = new URL(snapshot.sourceViewUrl, 'https://synthetic.invalid');
  const replay = await f.service.location(snapshot.id, f.service.parseQuery(Object.fromEntries(url.searchParams)));
  assert.deepEqual(replay.rows, snapshot.sourceView.rows);
  const defaultView = await f.service.location(snapshot.id);
  assert.notEqual(defaultView.location.range, 'G20'); // citation URL MUST carry the exact query
  assert.ok(!defaultView.rows.flatMap(row => row.cells).some(cell => cell.address === 'G20'));
  assert.ok(!JSON.stringify(snapshot).includes(f.root));
});

test('projection is deterministic, idempotent, and does not re-read an already retrieved target', async t => {
  const f = await fixture(t), empty = f.retrieve();
  const a = await augmentExactCellEvidence(f.index, empty, { sourceViews: f.sourceViews });
  const b = await augmentExactCellEvidence(f.index, empty, { sourceViews: f.sourceViews });
  assert.equal(a.rawCellEvidence[0].rawProjectionHash, b.rawCellEvidence[0].rawProjectionHash);
  assert.deepEqual(a.modelChunks, b.modelChunks);
  const calls = f.calls();
  assert.equal(await augmentExactCellEvidence(f.index, a, { sourceViews: f.sourceViews }), a);
  assert.equal(f.calls(), calls);
});

test('explicit natural/Excel sheet-cell forms resolve canonical sheets including spaces and apostrophes', async t => {
  const f = await fixture(t);
  for (const [question, sheet, value] of [
    ['Draws G20', 'Draws', 17.25], ["'Draws G20'", 'Draws', 17.25], ["'Draws'!$G$20", 'Draws', 17.25],
    ['draws cell g20', 'Draws', 17.25], ['"Other Sheet"!G20', 'Other Sheet', 99],
    ["'Investor''s Draws'!G20", "Investor's Draws", 5],
  ]) {
    const result = await augmentExactCellEvidence(f.index, f.retrieve(question), { sourceViews: f.sourceViews });
    assert.equal(result.rawCellEvidence.length, 1, question);
    assert.equal(result.rawCellEvidence[0].exactLocation.sheet, sheet, question);
    assert.equal(result.rawCellEvidence[0].records[0].value, value, question);
  }
});

test('unqualified, unrelated, out-of-bounds, external-workbook and range requests are no-ops with no source I/O', async t => {
  const f = await fixture(t);
  for (const question of ['G20', 'Explain Draws', 'Unknown!G20', 'OverDraws!G20', '[external.xlsx]Draws!G20',
    'Draws!G20:K20', 'Draws!XFE1', 'Draws!G0', 'Draws!G1048577', 'Draws!G101']) {
    const retrieved = f.retrieve(question);
    assert.equal(await augmentExactCellEvidence(f.index, retrieved, { sourceViews: f.sourceViews }), retrieved, question);
  }
  const all = f.retrieve('Draws!G20', { documentId: 'all' });
  assert.equal(await augmentExactCellEvidence(f.index, all, { sourceViews: f.sourceViews }), all);
  assert.equal(f.calls(), 0);
  await assert.rejects(augmentExactCellEvidence(f.index, f.retrieve(), { documentId: 'another-selected-doc', sourceViews: f.sourceViews }), { code: 'raw_cell_evidence_mismatch' });
});

test('known retrieved exact records bypass raw lookup, including normal non-dense fixtures', async t => {
  const f = await fixture(t);
  const input = structuredClone(f.input);
  input.chunks[0].records.push(f.records.find(record => record.sheet === 'Draws' && record.cell === 'G20'));
  const index = validateCorpusIndex(input), retrieved = retrieveEvidence(index, { documentId: f.id, question: 'Draws!G20' });
  assert.equal(retrieved.chunks.length, 1);
  assert.equal(await augmentExactCellEvidence(index, retrieved, { sourceViews: f.sourceViews }), retrieved);
  assert.equal(f.calls(), 0);
});

test('unrecorded cells remain unsupported instead of becoming zero, blank or invented data', async t => {
  const f = await fixture(t), retrieved = f.retrieve('Draws!G24');
  const result = await augmentExactCellEvidence(f.index, retrieved, { sourceViews: f.sourceViews });
  assert.equal(result, retrieved); assert.equal(f.calls(), 1); assert.equal(result.chunks.length, 0);
});

test('formula cache absent, empty, and present numeric zero retain distinct raw semantics without evaluation', async t => {
  const f = await fixture(t);
  const result = await augmentExactCellEvidence(f.index, f.retrieve('Draws!G21, Draws!G22 and Draws!G23'), { sourceViews: f.sourceViews });
  assert.equal(result.chunks.length, 1); assert.equal(result.rawCellEvidence.length, 3);
  const [absent, zero, empty] = result.rawCellEvidence.map(snapshot => snapshot.records[0]);
  assert.equal(absent.value, null); assert.equal(absent.cache.state, 'absent'); assert.equal(absent.formula.text, 'G20*2');
  assert.equal(absent.availability, 'missing-formula-cache');
  assert.equal(zero.value, 0); assert.equal(zero.cache.state, 'present'); assert.equal(zero.cache.lexeme, '0');
  assert.equal(empty.value, null); assert.equal(empty.cache.state, 'empty');
  assert.match(result.modelChunks[0].text, /formulas are not evaluated/);
  assert.match(result.modelChunks[0].text, /value=null/); assert.match(result.modelChunks[0].text, /value=0/);
  assert.deepEqual(result.chunks[0].metadata.rawEvidenceLocations.map(location => location.range), ['G21', 'G22', 'G23']);
});

test('multiple qualified targets stay paired to their worksheets, without a sheet-cell cross product', async t => {
  const f = await fixture(t);
  const result = await augmentExactCellEvidence(f.index, f.retrieve('Draws!G21 and Other Sheet G20'), { sourceViews: f.sourceViews });
  assert.deepEqual(result.rawCellEvidence.map(snapshot => snapshot.exactLocation), [{ sheet: 'Draws', range: 'G21' }, { sheet: 'Other Sheet', range: 'G20' }]);
  assert.deepEqual(result.rawCellEvidence.map(snapshot => snapshot.records[0].value), [null, 99]);
  assert.equal(new Set(result.chunks.map(chunk => chunk.id)).size, 2);
});

test('parent selection uses smallest containing original range and deterministic original-ID tiebreak', async t => {
  const f = await fixture(t), input = structuredClone(f.input);
  input.chunks.push(...['z', 'a'].map(suffix => ({ ...structuredClone(input.chunks[0]), id: `src-narrow-${suffix}`, location: { sheet: 'Draws', range: 'G19:H21' } })));
  const index = validateCorpusIndex(input), service = createSourceView({ corpusDir: f.root, loadIndex: async () => index });
  const retrieved = retrieveEvidence(index, { documentId: f.id, question: 'Draws!G20' });
  const result = await augmentExactCellEvidence(index, retrieved, { sourceViews: service });
  assert.equal(result.chunks[0].id, 'src-narrow-a');
  assert.deepEqual(result.chunks[0].location, { sheet: 'Draws', range: 'G19:H21' });
  assert.ok(index.chunks.some(chunk => chunk.id === result.chunks[0].id));
});

test('budgets never slice raw records or formulas and exact-cell request fanout is bounded', async t => {
  const f = await fixture(t), tiny = f.retrieve('Draws!G20', { maxChunks: 1, maxChunkChars: 100, maxChars: 100 });
  assert.equal(await augmentExactCellEvidence(f.index, tiny, { sourceViews: f.sourceViews }), tiny);
  const bounded = await augmentExactCellEvidence(f.index, f.retrieve('Draws!G20 and Other Sheet G20', { maxChunks: 1 }), { sourceViews: f.sourceViews });
  assert.equal(bounded.chunks.length, 1); assert.equal(bounded.rawCellEvidence.length, 1);
  assert.ok(bounded.charCount <= bounded.limits.maxChars);
  const question = Array.from({ length: 9 }, (_, i) => `Draws!G${20 + i}`).join(' '), calls = f.calls();
  await assert.rejects(augmentExactCellEvidence(f.index, f.retrieve(question), { sourceViews: f.sourceViews }), { code: 'too_many_exact_cells' });
  assert.equal(f.calls(), calls);
});

test('source-view identity, exact location, declared original range and index version mismatches fail closed', async t => {
  const f = await fixture(t);
  for (const change of [
    view => { view.documentId = '0'.repeat(64); }, view => { view.citationId = 'src-forged'; },
    view => { view.location.range = 'G21'; }, view => { view.citationLocation.range = 'A1:B2'; },
    view => { view.indexedAt = '2000-01-01T00:00:00Z'; }, view => { view.rawSha256 = '0'.repeat(64); },
    view => { view.rows[0].cells[0].sheet = 'Other Sheet'; },
  ]) {
    const sourceViews = { location: async (...args) => { const view = await f.service.location(...args); change(view); return view; } };
    await assert.rejects(augmentExactCellEvidence(f.index, f.retrieve(), { sourceViews }), { code: 'raw_cell_evidence_mismatch' });
  }
});

test('changed original bytes or compressed raw JSONL fail SHA-256 validation even after a successful read', async t => {
  for (const artifact of ['originalFile', 'rawFile']) await t.test(artifact, async t => {
    const f = await fixture(t), retrieved = f.retrieve();
    await augmentExactCellEvidence(f.index, retrieved, { sourceViews: f.sourceViews });
    const filename = path.join(f.root, f.doc[artifact]), bytes = await fs.readFile(filename);
    bytes[Math.floor(bytes.length / 2)] ^= 1; await fs.writeFile(filename, bytes);
    await assert.rejects(augmentExactCellEvidence(f.index, retrieved, { sourceViews: f.sourceViews }), { code: 'source_integrity_failed' });
  });
});
