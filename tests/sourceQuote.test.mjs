import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSourceQuote } from '../server/sourceQuote.js';
import { validateEvidenceAnswer } from '../server/evidenceAnswer.js';

const chunk = { id: 'src-span', documentId: 'synthetic', kind: 'pdf', label: 'Synthetic p1', location: { page: 1 },
  text: 'FUNDING\nMonthly peak\nUSD 10M\nSolvency\nUSD 20M\nAgreement\nTo be agreed' };
const retrieved = { documentId: 'all', chunks: [chunk], modelChunks: [chunk] };
test('heading plus a later row expands to actual contiguous span, never splices source facts', () => {
  const r = resolveSourceQuote({ id: chunk.id, quote: 'FUNDING\nSolvency\nUSD 20M' }, retrieved);
  assert.equal(r.quote, 'FUNDING\nMonthly peak\nUSD 10M\nSolvency\nUSD 20M');
  const result = validateEvidenceAnswer({ facts: [{ text: r.quote, evidence: [r] }], unsupported: false }, { retrieved });
  assert.equal(result.facts[0].extractive, true);
});
test('changed numbers cannot be repaired into a citation; validation still rejects', () => {
  const r = resolveSourceQuote({ id: chunk.id, quote: 'Solvency\nUSD 200M' }, retrieved);
  assert.throws(() => validateEvidenceAnswer({ facts: [{ text: r.quote, evidence: [r] }], unsupported: false }, { retrieved }), /not present/);
});
test('wrong identity, reordered lines, and fabricated conclusion remain invalid', () => {
  for (const reference of [{ id: 'src-made-up', quote: chunk.text }, { id: chunk.id, quote: 'USD 20M\nFUNDING' }, { id: chunk.id, quote: 'Agreement\nApproved' }]) {
    const r=resolveSourceQuote(reference,retrieved);
    assert.throws(() => validateEvidenceAnswer({facts:[{text:r.quote,evidence:[r]}],unsupported:false},{retrieved}));
  }
});
