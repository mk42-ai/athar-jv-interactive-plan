// All output quotations are recovered from original source bytes, never model layout.
import { normalizeEvidenceText } from './retrieval.js';

/** Original UTF-16 offsets plus one-based source line coordinates. CRLF stays intact. */
export function sourceLines(text) {
  const lines = [];
  let offset = 0;
  for (const raw of text.split('\n')) {
    const body = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    lines.push({ number: lines.length + 1, text: body, start: offset, end: offset + body.length });
    offset += raw.length + 1;
  }
  return lines;
}

// Map normalized code points back to the *original* offsets. Never apply an offset
// from a flattened string to a multiline string (that silently lost source words).
export function exactSourceSpan(source, quote) {
  if (typeof source !== 'string' || typeof quote !== 'string') return null;
  const target = normalizeEvidenceText(quote);
  if (!target) return null;
  const direct = source.indexOf(quote);
  if (direct >= 0) return { start: direct, end: direct + quote.length, quote: source.slice(direct, direct + quote.length) };
  let normalized = '', starts = [], ends = [];
  const segments = new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(source);
  for (const segment of segments) {
    const value = segment.segment.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    for (const char of value) {
      if (/\s/u.test(char)) {
        if (!normalized) continue;
        if (normalized.endsWith(' ')) { ends[ends.length - 1] = segment.index + segment.segment.length; continue; }
        normalized += ' '; starts.push(segment.index); ends.push(segment.index + segment.segment.length);
      } else {
        normalized += char;
        for (let i = 0; i < char.length; i++) { starts.push(segment.index); ends.push(segment.index + segment.segment.length); }
      }
    }
  }
  const at = normalized.indexOf(target);
  if (at < 0) return null;
  const start = starts[at], end = ends[at + target.length - 1];
  const original = source.slice(start, end);
  return normalizeEvidenceText(original) === target ? { start, end, quote: original } : null;
}

/** Compatibility recovery: ordered complete source lines may expand, never splice. */
export function resolveSourceQuote(reference, retrieved) {
  if (!reference || typeof reference.id !== 'string' || typeof reference.quote !== 'string') return reference;
  const source = (retrieved?.modelChunks || retrieved?.chunks || retrieved)?.find?.(chunk => chunk.id === reference.id)?.text;
  if (typeof source !== 'string') return reference; // the grounding validator rejects unavailable IDs
  const exact = exactSourceSpan(source, reference.quote);
  if (exact) return { ...reference, quote: exact.quote };
  const fragments = reference.quote.split(/\r?\n/).map(normalizeEvidenceText).filter(Boolean);
  if (fragments.length < 2 || fragments.length > 100) return reference;
  const lines = sourceLines(source);
  const candidates = [];
  for (let begin = 0; begin < lines.length; begin++) {
    if (normalizeEvidenceText(lines[begin].text) !== fragments[0]) continue;
    let next = begin + 1, end = begin, okay = true;
    for (const fragment of fragments.slice(1)) {
      while (next < lines.length && normalizeEvidenceText(lines[next].text) !== fragment) next++;
      if (next === lines.length) { okay = false; break; }
      end = next++;
    }
    if (!okay) continue;
    const selected = source.slice(lines[begin].start, lines[end].end);
    if (selected.length <= 6000) candidates.push(selected);
  }
  // An ambiguous recovery is not proof, even if one candidate happens to be shorter.
  const distinct = [...new Set(candidates)];
  return distinct.length === 1 ? { ...reference, quote: distinct[0] } : reference;
}
