import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPECTED_DOCUMENTS, describeSignedUrl, mergeExpectedDocuments, registrySummary } from '../server/documentRegistry.js';
import { retrieveEvidence, isPagedDeck } from '../server/retrieval.js';
import { citationLabel, describeLocation } from '../server/evidenceAnswer.js';
import { loadDotEnv } from '../server/env.js';

const SHA = (n) => n.toString(16).padStart(64, '0');
const indexedDoc = (slug, kind, n) => ({ id: SHA(n), slug, title: `${slug} title`, kind, status: 'ready', coverage: { pages: 2 }, limitations: [] });
const SIGNED = 'https://airevprod.blob.core.windows.net/container/path/Athar_JV_-_Financial_Model_Executive_Summary_(1)_k69j.pdf?se=2099-09-12T10%3A39%3A48Z&sig=SECRETSIGNATURE%3D&sp=r&sr=b';

test('registry always lists exactly the three expected documents in order; missing ones are explicit and carry no URL', () => {
  loadDotEnv(); // the loader runs once; after this the test controls the variables it asserts on
  const prev = { ...process.env };
  for (const key of Object.keys(process.env)) if (key.startsWith('ATHAR_SOURCE_URL_')) delete process.env[key];
  process.env.ATHAR_SOURCE_URL_FINANCIAL_SUMMARY = SIGNED;
  try {
    assert.deepEqual(EXPECTED_DOCUMENTS.map((d) => d.slug), ['financial-summary', 'financial-model', 'implementation-plan']);
    assert.equal(EXPECTED_DOCUMENTS.some((d) => d.slug === 'executive-presentation'), false, 'the deck is no longer a corpus document');
    const merged = mergeExpectedDocuments([indexedDoc('financial-summary', 'pdf', 2), indexedDoc('implementation-plan', 'xlsx', 4)]);
    assert.deepEqual(merged.map((d) => d.slug), EXPECTED_DOCUMENTS.map((d) => d.slug));
    assert.deepEqual(merged.map((d) => d.status), ['ready', 'missing', 'ready']);
    const missing = merged.find((d) => d.slug === 'financial-model');
    assert.equal(missing.id, 'missing-financial-model');
    assert.equal(missing.coverage, null);
    assert.match(missing.limitations[0], /not provisioned/i);
    assert.match(missing.limitations[1], /ATHAR_SOURCE_URL_FINANCIAL_MODEL/);
    // With all three indexed nothing is missing and nothing is flagged.
    const full = mergeExpectedDocuments([indexedDoc('financial-summary', 'pdf', 2), indexedDoc('financial-model', 'xlsx', 3), indexedDoc('implementation-plan', 'xlsx', 4)]);
    assert.deepEqual(full.map((d) => d.status), ['ready', 'ready', 'ready']);
    assert.equal(full.length, 3);
    const summary = merged.find((d) => d.slug === 'financial-summary');
    assert.equal(summary.id, SHA(2));
    assert.equal(summary.provisioning.signedUrl.configured, true);
    assert.equal(summary.provisioning.signedUrl.expired, false);
    assert.equal(summary.provisioning.signedUrl.fileName, 'Athar_JV_-_Financial_Model_Executive_Summary_(1)_k69j.pdf');
    const serialized = JSON.stringify(merged);
    assert.equal(serialized.includes('SECRETSIGNATURE'), false, 'signed URL signature must never reach the client');
    assert.equal(serialized.includes('sig='), false);
    const health = registrySummary(merged.filter((d) => d.status !== 'missing'));
    assert.deepEqual(health, { expected: 3, indexed: 2, missing: ['financial-model'], signedUrlsConfigured: ['financial-summary'] });
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in prev)) delete process.env[key];
    Object.assign(process.env, prev);
  }
});

test('describeSignedUrl reports metadata only and rejects non-https values', () => {
  assert.deepEqual(describeSignedUrl(''), { configured: false });
  assert.equal(describeSignedUrl('http://example.com/x.pdf').configured, false);
  assert.equal(describeSignedUrl('not a url').configured, false);
  const meta = describeSignedUrl('https://airevprod.blob.core.windows.net/c/f.xlsx?se=2000-01-01T00%3A00%3A00Z&sig=abc');
  assert.equal(meta.expired, true);
  assert.equal(meta.trustedHost, true);
  assert.equal(meta.signed, true);
  assert.equal(Object.values(meta).some((v) => typeof v === 'string' && v.includes('sig=')), false);
});

test('a deck provisioned as its exact PDF keeps slide semantics: slide N filters page N and labels read "Slide N"', () => {
  const deckId = SHA(11), otherId = SHA(12);
  const chunk = (id, documentId, slug, page, text) => ({ id, documentId, documentSlug: slug, kind: 'pdf', subtype: 'pdf-page', location: { page }, label: `Page ${page}`, text, records: [], metadata: {} });
  const index = {
    schemaVersion: 'athar-corpus/v1', extractorVersion: 'test', generatedAt: '2026-09-05T00:00:00Z',
    documents: [
      { id: deckId, sha256: deckId, slug: 'executive-presentation', kind: 'pdf', title: 'Deck', status: 'ready', coverage: { pages: 2 }, limitations: [], originalFile: `originals/${deckId}.pdf` },
      { id: otherId, sha256: otherId, slug: 'financial-summary', kind: 'pdf', title: 'Summary', status: 'ready', coverage: { pages: 1 }, limitations: [], originalFile: `originals/${otherId}.pdf` },
    ],
    chunks: [
      chunk('src-a1', deckId, 'executive-presentation', 1, 'Slide one text: gates and anchors and seats.'),
      chunk('src-a2', deckId, 'executive-presentation', 2, 'Slide two text: roadmap gates and seats and milestones.'),
      chunk('src-b1', otherId, 'financial-summary', 1, 'Summary text: revenue seats and gates.'),
    ],
  };
  const deck = index.documents[0];
  assert.equal(isPagedDeck(deck), true);
  assert.equal(isPagedDeck(index.documents[1]), false);
  const r = retrieveEvidence(index, { question: 'What does this say about gates and seats?', documentId: deckId, slide: 2 });
  assert.equal(r.page, 2);
  assert.equal(r.slide, null);
  assert.deepEqual(r.chunks.map((c) => c.id), ['src-a2']);
  const spoken = retrieveEvidence(index, { question: 'Explain slide 1 and cite the source.', documentId: deckId });
  assert.deepEqual(spoken.chunks.map((c) => c.id), ['src-a1']);
  assert.throws(() => retrieveEvidence(index, { question: 'Explain slide 1', documentId: deckId, slide: 2 }), /different scopes/);
  assert.throws(() => retrieveEvidence(index, { question: 'gates', documentId: otherId, slide: 1 }), /slide filter/);
  assert.equal(describeLocation(index.chunks[1], deck), 'Slide 2');
  assert.equal(describeLocation(index.chunks[2], index.documents[1]), 'Page 1');
  assert.equal(citationLabel(index.chunks[1], deck), 'Executive-summary deck · Slide 2');
  assert.equal(citationLabel({ kind: 'xlsx', documentSlug: 'implementation-plan', location: { sheet: 'Open Items', range: 'D31:G46' } }, null), 'Implementation plan · Open Items!D31:G46');
});
