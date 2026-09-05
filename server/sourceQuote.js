// Recover a model's selected source lines as ONE actual contiguous source passage.
// Models sometimes repeat a table heading then select a later row. We do not trust
// that stitched quotation: expand to the original enclosing span, including ALL
// intervening rows/qualifiers. Altered values, reordering, ambiguous matches fail closed.
import { normalizeEvidenceText } from './retrieval.js';

export function resolveSourceQuote(reference, retrieved) {
  if (!reference || typeof reference.id !== 'string' || typeof reference.quote !== 'string') return reference;
  const view = retrieved.modelChunks?.find((chunk) => chunk.id === reference.id);
  if (!view) return reference; // validator produces the safe error
  const source = view.text;
  const quote = reference.quote;
  if (normalizeEvidenceText(source).includes(normalizeEvidenceText(quote))) return reference;
  const fragments = quote.split(/\r?\n/).map(normalizeEvidenceText).filter(Boolean);
  if (fragments.length < 2 || fragments.length > 100) return reference;
  const lines = [];
  let offset = 0;
  for (const text of source.split('\n')) {
    lines.push({ text: normalizeEvidenceText(text), start: offset, end: offset + text.length });
    offset += text.length + 1;
  }
  const candidates = [];
  for (let begin = 0; begin < lines.length; begin++) {
    if (lines[begin].text !== fragments[0]) continue;
    let next = begin + 1, end = begin, okay = true;
    for (const fragment of fragments.slice(1)) {
      while (next < lines.length && lines[next].text !== fragment) next++;
      if (next === lines.length) { okay = false; break; }
      end = next++;
    }
    if (!okay) continue;
    const selected = source.slice(lines[begin].start, lines[end].end);
    if (selected.length <= 6000) candidates.push(selected);
  }
  candidates.sort((a, b) => a.length - b.length);
  if (!candidates.length || (candidates[1]?.length === candidates[0].length && candidates[0] !== candidates[1])) return reference;
  return { id: reference.id, quote: candidates[0] };
}
