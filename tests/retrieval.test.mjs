import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateCorpusIndex, retrieveEvidence, createRetriever, buildRetrievalQuery, loadCorpusIndex, clearCorpusCache } from '../server/retrieval.js';

const ids = ['a', 'b', 'c', 'd'].map(letter => letter.repeat(64));
function fixture() {
  const documents = ['financial-summary', 'executive-presentation', 'financial-model', 'implementation-plan'].map((slug, i) => ({
    id: ids[i], sha256: ids[i], slug, title: ['Synthetic financial brief', 'Synthetic executive deck', 'Synthetic workbook', 'Synthetic plan'][i],
    kind: ['pdf', 'pptx', 'xlsx', 'docx'][i], originalFile: `input-${i}.${['pdf', 'pptx', 'xlsx', 'docx'][i]}`,
    status: 'extracted', coverage: { extracted: 1 }, limitations: [],
  }));
  const chunk = (id, docIndex, text, location, label, metadata = {}) => ({ id: `src-${id}`, documentId: ids[docIndex], documentSlug: documents[docIndex].slug, kind: documents[docIndex].kind, text, location, label, metadata });
  return { schemaVersion: 'athar-corpus/v1', extractorVersion: 'synthetic-test/1', generatedAt: '2026-01-01T00:00:00Z', documents,
    chunks: [
      chunk('pdf', 0, 'Funding for the fictional North region is stated in the financial brief.', { page: 7 }, 'Synthetic brief — page 7'),
      chunk('slide1', 1, 'Regional funding milestones for the fictional North region.', { slide: 1 }, 'Synthetic deck — slide 1'),
      chunk('slide2', 1, 'The project timeline covers pilot operations.', { slide: 2 }, 'Synthetic deck — slide 2'),
      chunk('control', 2, 'Funding assumptions: Base Case equity is USD 20 million.', { sheet: 'Control', range: 'B2:D5' }, 'Control funding assumptions'),
      chunk('outputs', 2, 'Funding outputs summarize regional project costs.', { sheet: 'Outputs', range: 'A1:C3' }, 'Outputs funding'),
      chunk('draws', 2, `Funding draws: ${'10 20 30 40 50 '.repeat(400)}`, { sheet: 'Draws', range: 'A1:W100' }, 'Draws batch', { rawBatch: true }),
      chunk('plan', 3, 'Funding milestones remain subject to staged review.', { part: 'word/document.xml#paragraph-12' }, 'Synthetic plan — paragraph 12'),
    ] };
}

test('validates document links and exact locators; privately clones immutable records', () => {
  const raw = fixture(); const index = validateCorpusIndex(raw);
  raw.chunks[0].text = 'mutated';
  assert.equal(index.recordsById.get('src-pdf').text.startsWith('Funding'), true);
  assert.deepEqual(index.recordsById.get('src-control').location, { sheet: 'Control', range: 'B2:D5' });
  assert.equal(index.recordsById.set, undefined);
  assert.throws(() => { index.recordsById.get('src-pdf').location.page = 9; }, TypeError);
});

test('invalid corpus rejects duplicate identifiers, invalid links and fabricated locators', () => {
  for (const corrupt of [
    index => index.chunks.push(index.chunks[0]),
    index => { index.chunks[0].documentId = 'not-a-document'; },
    index => { index.chunks[0].documentSlug = 'implementation-plan'; },
    index => { index.chunks[0].location.page = 0; },
    index => { index.chunks[1].location.slide = 1.5; },
    index => { index.chunks[3].location.range = 'A1:XFE2'; },
    index => { index.chunks[3].location.range = 'B2:A1'; },
    index => { index.documents[0].originalFile = 'public/input.pdf'; },
    index => { index.documents[0].originalFile = '../input.pdf'; },
  ]) {
    const raw = fixture(); corrupt(raw);
    assert.throws(() => validateCorpusIndex(raw), error => error.code === 'invalid_corpus');
  }
});

test('retrieval is deterministic and selects only real document IDs', () => {
  const index = fixture();
  const options = { question: 'Funding assumptions', documentId: ids[2] };
  const a = retrieveEvidence(index, options); const b = retrieveEvidence(index, options);
  assert.deepEqual(a.chunks.map(chunk => chunk.id), b.chunks.map(chunk => chunk.id));
  assert.deepEqual(a.scores, b.scores);
  assert.ok(a.chunks.every(chunk => chunk.documentId === ids[2]));
  assert.throws(() => retrieveEvidence(index, { question: 'funding', documentId: 'financial-model' }), error => error.code === 'unknown_document');
  assert.throws(() => retrieveEvidence(index, { question: 'funding', documentId: 'missing' }), error => error.code === 'unknown_document');
});

test('strict slide selection requires a selected PPTX and never returns another slide', () => {
  const index = fixture();
  const found = retrieveEvidence(index, { question: 'project timeline', documentId: ids[1], slide: 2 });
  assert.deepEqual(found.chunks.map(chunk => chunk.id), ['src-slide2']);
  assert.deepEqual(found.chunks[0].location, { slide: 2 });
  assert.throws(() => retrieveEvidence(index, { question: 'funding', documentId: ids[0], slide: 1 }), error => error.code === 'invalid_slide');
  assert.throws(() => retrieveEvidence(index, { question: 'funding', slide: 1 }), error => error.code === 'invalid_slide');
  assert.equal(retrieveEvidence(index, { question: 'funding', documentId: ids[1], slide: 99 }).chunks.length, 0);
});

test('explicit selected-PDF page stays a hard boundary even when another page scores higher', () => {
  const input = fixture();
  input.chunks.push({ ...input.chunks[0], id: 'src-pdf-other-page', location: { page: 2 }, text: 'Funding funding funding regional funding.' });
  const found = retrieveEvidence(input, { question: 'Using only PDF page 7, describe regional funding.', documentId: ids[0] });
  assert.deepEqual(found.chunks.map(chunk => chunk.id), ['src-pdf']);
  assert.equal(retrieveEvidence(input, { question: 'Funding page 99', documentId: ids[0] }).chunks.length, 0);
});

test('followups append last user question only in identical explicit document scope', () => {
  const history = [
    { role: 'user', content: 'North region funding', documentId: ids[0] },
    { role: 'assistant', content: 'OLD FACTS MUST NEVER REENTER' },
  ];
  assert.equal(buildRetrievalQuery({ question: 'And the risks?', history, documentId: ids[0] }).contextualQuestion, 'North region funding');
  assert.equal(buildRetrievalQuery({ question: 'And the risks?', history, documentId: ids[1] }).contextualQuestion, null);
  assert.equal(buildRetrievalQuery({ question: 'What is the independent timeline for pilot operations?', history, documentId: ids[0] }).contextualQuestion, null);
  assert.equal(buildRetrievalQuery({ question: 'And the risks?', history: [{ role: 'user', content: 'unsafe unscoped history' }], documentId: 'all' }).contextualQuestion, null);
  const recentOtherScope = [...history, { role: 'user', content: 'Another scoped question', documentId: ids[1] }];
  assert.equal(buildRetrievalQuery({ question: 'And the risks?', history: recentOtherScope, documentId: ids[0] }).contextualQuestion, null);
});

test('all-document comparison diversifies evidence and retains PDF geographical/funding page', () => {
  const found = retrieveEvidence(fixture(), { question: 'Compare funding across documents', maxChunks: 4 });
  assert.equal(new Set(found.chunks.map(chunk => chunk.documentId)).size, 4);
  assert.equal(found.chunks[0].id, 'src-pdf');
  assert.equal(found.chunks[0].location.page, 7);
});

test('label-rich workbook controls and outputs outrank raw numeric Draws batches', () => {
  const found = retrieveEvidence(fixture(), { question: 'funding', documentId: ids[2] });
  assert.equal(found.chunks.at(-1).id, 'src-draws');
  assert.ok(found.chunks.slice(0, 2).every(chunk => ['src-control', 'src-outputs'].includes(chunk.id)));
});

test('model excerpts are bounded without truncating immutable citation/source records', () => {
  const raw = fixture(); raw.chunks[0].text = 'Regional funding ' + 'A long, synthetic source sentence. '.repeat(5000);
  raw.chunks[0].records = [{ address: 'synthetic-record', value: 123 }];
  const found = retrieveEvidence(raw, { question: 'funding', documentId: ids[0], maxChars: 400, maxChunkChars: 300 });
  assert.ok(found.charCount <= 400);
  assert.equal(found.modelChunks[0].text.length, 300);
  assert.equal(found.modelChunks[0].excerpted, true);
  assert.equal(found.recordsById.get('src-pdf').text.length, raw.chunks[0].text.length);
  assert.deepEqual(found.recordsById.get('src-pdf').records, raw.chunks[0].records);
  assert.ok(found.chunks[0].text.includes(found.modelChunks[0].text));
});

test('no lexical evidence returns an empty set, never fallback facts', () => {
  assert.equal(retrieveEvidence(fixture(), { question: 'quasar photometry', documentId: ids[0] }).chunks.length, 0);
});

test('private disk loader parses once, shares reload, retries partial writes, and fails closed', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'synthetic-evidence-'));
  try {
    const raw = fixture(); const filename = path.join(dir, 'index.json');
    await writeFile(filename, JSON.stringify(raw));
    const first = await loadCorpusIndex({ corpusDir: dir });
    assert.equal(await loadCorpusIndex({ corpusDir: dir }), first);
    const retriever = createRetriever({ corpusDir: dir });
    assert.ok((await retriever.retrieve({ question: 'funding' })).chunks.length);
    raw.chunks[0].text = 'Funding is updated in this synthetic index version.';
    await writeFile(filename, '{partial');
    const reload = loadCorpusIndex({ corpusDir: dir });
    await new Promise(resolve => setTimeout(resolve, 10));
    await writeFile(filename, JSON.stringify(raw));
    const updated = await reload;
    assert.notEqual(updated, first);
    const concurrent = await Promise.all([loadCorpusIndex({ corpusDir: dir }), loadCorpusIndex({ corpusDir: dir })]);
    assert.equal(concurrent[0], concurrent[1]);
    assert.equal(updated.chunks[0].text, raw.chunks[0].text);
    await writeFile(filename, '{bad');
    await assert.rejects(loadCorpusIndex({ corpusDir: dir }), error => error.code === 'corpus_unavailable' && error.status === 503);
    const publicDir = path.join(dir, 'public'); await mkdir(publicDir);
    await assert.rejects(loadCorpusIndex({ corpusDir: publicDir }), error => error.code === 'corpus_unavailable');
  } finally { clearCorpusCache(); await rm(dir, { recursive: true, force: true }); }
});
