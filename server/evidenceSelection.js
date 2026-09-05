// Pure, request-local passage catalog. No corpus contents, endpoint calls, or answers are cached.
import { createHash } from 'node:crypto';
import { normalizeEvidenceText, validateSourceLocation } from './retrieval.js';
import { sourceLines, resolveSourceQuote } from './sourceQuote.js';

const invalid = (message, code = 'unsupported_citation') => { throw Object.assign(new Error(message), { name: 'EvidenceValidationError', code, status: 422, statusCode: 422 }); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const stop = new Set('a an the and or of to in on at for from with is are was were what which how do does it this that those these compare'.split(' '));
const words = text => [...new Set((normalizeEvidenceText(text).toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(word => !stop.has(word)))];
const heading = text => {
  const s = text.trim();
  return s.length > 1 && s.length <= 160 && !/[.!?;]$/.test(s) &&
    (/^(?:sheet:|context|source records)/i.test(s) || /^[^a-z]*[A-Z][^a-z]*$/.test(s) && /[A-Z]{3}/.test(s) || /\b(?:base case|expansion upside|scenario|milestones|decision gates)\s*$/i.test(s));
};
const tableLine = text => /[|\t]|^\s*(?:\$?[A-Z]{1,3}\$?[1-9]\d*\s*[:=]|[-+(]?\d|Y\s*\d+\s*$|(?:AED|USD|EUR|GBP)\b)/.test(text);
const caveat = text => /\b(?:subject to|pending|to be agreed|only|exclud\w*|not |indicative|provisional|conditional|approval|unresolved)\b/i.test(text);

function candidates(view, record) {
  const text = view.text, offset = record.text.indexOf(text), lines = sourceLines(text), found = new Map();
  const add = (start, end, contextRequired = false) => {
    while (start < end && /\s/.test(text[start])) start++;
    while (end > start && /\s/.test(text[end - 1])) end--;
    if (end - start < 6 || end - start > 6000) return;
    const part = text.slice(start, end);
    const key = `${start}:${end}`;
    const originalStart = offset + start, originalEnd = offset + end;
    found.set(key, { id: `psg-${createHash('sha256').update(`${record.id}\0${originalStart}\0${originalEnd}`).digest('hex').slice(0, 24)}`,
      sourceId: record.id, documentId: record.documentId, kind: record.kind, label: record.label, location: { ...record.location },
      text: part, sourceStart: originalStart, sourceEnd: originalEnd,
      sourceStartLine: record.text.slice(0, originalStart).split('\n').length,
      lineCount: sourceLines(part).length, contextRequired, lines: sourceLines(part).map(line => ({ number: line.number, text: line.text })) });
  };
  // Small coherent excerpts remain intact; long paragraphs and pages get actual passages.
  if (text.length <= 1000 || (lines.length > 3 && text.length <= 4000 && ['pdf', 'pptx', 'xlsx'].includes(record.kind))) add(0, text.length, lines.some(line => tableLine(line.text) || heading(line.text)));
  let section = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.text.trim()) { section = i + 1; continue; }
    if (heading(line.text)) {
      // Extractor section markers are not new worksheet/scenario scope. Preserve earlier labels.
      if (!(record.kind === 'xlsx' && /^(?:context|source records)/i.test(line.text.trim()))) section = i;
      continue;
    }
    const isTable = tableLine(line.text) || tableLine(lines[i + 1]?.text || '');
    if (isTable) {
      // Keep the scenario/header/units contiguous with a table row. Never synthesize a header.
      let end = i;
      while (end + 1 < lines.length && lines[end + 1].text.trim() && !heading(lines[end + 1].text)
        && lines[end + 1].end - lines[section]?.start <= 2800) end++;
      let start = section;
      if (!lines[start] || line.end - lines[start].start > 2800) start = i;
      add(lines[start].start, lines[end].end, true);
      // A later unresolved row must retain its earlier labeled worksheet context when bounded.
      if (record.kind === 'xlsx' && caveat(line.text) && line.end - lines[section].start <= 6000) add(lines[section].start, line.end, true);
      continue;
    }
    const segments = [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(line.text)];
    if (segments.length > 1 || line.text.length > 600) {
      for (let s = 0; s < segments.length; s++) {
        let start = line.start + segments[s].index;
        let end = start + segments[s].segment.length;
        // A neighboring qualification travels with the claim rather than being silently dropped.
        if (s + 1 < segments.length && caveat(segments[s + 1].segment) && segments[s + 1].segment.length < 600) end += segments[s + 1].segment.length;
        if (section < i && heading(lines[section]?.text || '') && start - lines[section].start < 350) start = lines[section].start;
        add(start, end, start < line.start);
      }
    } else {
      let start = i, end = i;
      if (section < i && heading(lines[section]?.text || '') && line.end - lines[section].start < 1400) start = section;
      while (end + 1 < lines.length && lines[end + 1].text.trim() && !heading(lines[end + 1].text)
          && (caveat(lines[end + 1].text) || !/[.!?]$/.test(lines[end].text.trim()))
          && lines[end + 1].end - lines[start].start < 1600) end++;
      add(lines[start].start, lines[end].end, start !== i || caveat(lines[end].text));
    }
  }
  return [...found.values()];
}

/** The exact same deterministic catalog is used at prompt time and pointer-validation time. */
export function buildEvidenceCatalog(retrieved) {
  const chunks = Array.isArray(retrieved) ? retrieved : retrieved?.chunks;
  const views = retrieved?.modelChunks || chunks;
  if (!Array.isArray(chunks) || chunks.length > 12 || !Array.isArray(views)) invalid('A bounded retrieved evidence set is required.');
  const records = new Map();
  for (const record of chunks) {
    if (!object(record) || !/^src-[A-Za-z0-9_-]+$/.test(record.id || '') || records.has(record.id) || typeof record.text !== 'string') invalid('Invalid retrieved source identity.');
    if (retrieved.documentId && retrieved.documentId !== 'all' && record.documentId !== retrieved.documentId) invalid('Evidence crosses the selected document boundary.');
    try { validateSourceLocation(record.kind, record.location); } catch { invalid('Invalid source locator.'); }
    if (retrieved.slide != null && (record.kind !== 'pptx' || record.location.slide !== retrieved.slide)) invalid('Evidence crosses the selected slide boundary.');
    if (retrieved.page != null && (record.kind !== 'pdf' || record.location.page !== retrieved.page)) invalid('Evidence crosses the selected page boundary.');
    records.set(record.id, record);
  }
  const query = retrieved?.query || retrieved?.question || '';
  const terms = words(query);
  if (/\b(?:agreements?|decisions?|agree|agreed|approval)\b/i.test(query)) terms.push('agreed', 'approval', 'pending', 'capital');
  if (/\b(?:milestones?|depend\w*)\b/i.test(query)) terms.push('milestone', 'gate', 'dependency', 'requires');
  let seen = new Set(), all = [];
  for (const view of views) {
    const record = records.get(view?.id);
    if (!record || seen.has(view.id) || typeof view.text !== 'string' || !record.text.includes(view.text)) invalid('Model evidence must be an exact source excerpt.');
    seen.add(view.id);
    all.push(...candidates(view, record).map(passage => {
      const tokens = new Set(words(passage.text));
      const match = terms.reduce((sum, term) => sum + (tokens.has(term) ? 1 : 0), 0);
      const unresolved = /\b(?:agreements?|decisions?|agreed|capital)\b/i.test(query) && /to be agreed/i.test(passage.text);
      return { passage, score: match / Math.pow(1 + passage.text.length / 900, 0.35) + (unresolved ? 4 : 0) };
    }));
  }
  all.sort((a, b) => b.score - a.score || a.passage.sourceId.localeCompare(b.passage.sourceId) || a.passage.sourceStart - b.passage.sourceStart);
  const ordered = [], docs = new Set(), sources = new Set();
  for (const item of all) if (!docs.has(item.passage.documentId)) { ordered.push(item); docs.add(item.passage.documentId); sources.add(item.passage.sourceId); }
  // Preserve at least one candidate from every retrieved record before redundant
  // passages from long tables consume the catalog. A short total/header is real evidence too.
  for (const item of all) if (!sources.has(item.passage.sourceId)) { ordered.push(item); sources.add(item.passage.sourceId); }
  for (const item of all) if (!ordered.includes(item)) ordered.push(item);
  const selected = []; let chars = 0;
  for (const { passage } of ordered) {
    if (selected.length >= 36) break;
    if (chars + passage.text.length > 30000) continue;
    // Redundant inner spans of the same self-contained table add no evidence coverage.
    if (selected.some(other => other.sourceId === passage.sourceId && other.sourceStart <= passage.sourceStart && other.sourceEnd >= passage.sourceEnd)) continue;
    selected.push(Object.freeze(passage)); chars += passage.text.length;
  }
  return Object.freeze(selected);
}

function parse(raw) {
  if (typeof raw === 'string') {
    if (raw.length > 200000) invalid('Answer exceeds the validation budget.', 'unsupported_fact');
    try { raw = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); }
    catch { invalid('Answer must be structured JSON.', 'unsupported_fact'); }
  }
  if (!object(raw)) invalid('Answer must be a JSON object.', 'unsupported_fact');
  return raw;
}

/** Convert model-selected pointers to the existing validator schema, without trusting wording.
 * Selection line numbers are one-based, local to the catalog passage. IDs are not source IDs.
 * Context-bearing passages are indivisible: line narrowing never drops a qualifier/header.
 * Legacy facts still work; this helper uses only their checked source quotations, not prose.
 */
export function prepareModelSelection(input, retrieved) {
  const raw = parse(input), catalog = new Map(buildEvidenceCatalog(retrieved).map(passage => [passage.id, passage]));
  const pointer = selection => {
    if (typeof selection === 'string') selection = { id: selection };
    if (!object(selection) || typeof selection.id !== 'string') invalid('Invalid passage selection.');
    const passage = catalog.get(selection.id);
    if (!passage) invalid('Selected passage ID was not provided in this request.');
    // Whole-passage selection is the preferred robust contract. Explicit line narrowing remains
    // validated for compatibility; omitted lines do not make the model count/retype source rows.
    const startLine = selection.startLine ?? 1, endLine = selection.endLine ?? passage.lineCount;
    if (!Number.isSafeInteger(startLine) || !Number.isSafeInteger(endLine)
      || startLine < 1 || endLine < startLine || endLine > passage.lineCount) invalid('Selected passage ID or line range was not provided in this request.');
    const lines = sourceLines(passage.text);
    const start = passage.contextRequired ? 0 : lines[startLine - 1].start;
    const end = passage.contextRequired ? passage.text.length : lines[endLine - 1].end;
    return { id: passage.sourceId, quote: passage.text.slice(start, end) };
  };
  for (const name of ['facts', 'calculations', 'conflicts', 'missing']) {
    if (raw[name] != null && (!Array.isArray(raw[name]) || raw[name].length > (name === 'calculations' ? 12 : 30))) invalid(`Invalid ${name} array.`, 'unsupported_fact');
  }
  const result = { ...raw };
  if (raw.selections != null) {
    if (!Array.isArray(raw.selections) || raw.selections.length > 30 || (Array.isArray(raw.facts) && raw.facts.length)) invalid('Use selections or legacy facts, not both.', 'unsupported_fact');
    const seen = new Set();
    result.facts = raw.selections.flatMap(selection => {
      const reference = pointer(selection), key = `${reference.id}\0${reference.quote}`;
      if (seen.has(key)) return []; seen.add(key);
      return [{ text: reference.quote, evidence: [reference] }];
    });
  } else if (Array.isArray(raw.facts)) {
    result.facts = raw.facts.flatMap(fact => {
      if (!object(fact) || !Array.isArray(fact.evidence) || !fact.evidence.length) invalid('Every fact requires source evidence.');
      return fact.evidence.map(reference => {
        const resolved = resolveSourceQuote(reference, retrieved);
        return { text: resolved?.quote, evidence: [resolved] };
      });
    });
  }
  if (Array.isArray(raw.calculations)) result.calculations = raw.calculations.map(calculation => ({ ...calculation,
    operands: Array.isArray(calculation?.operands) ? calculation.operands.map(operand => {
      if (!object(operand)) invalid('Invalid calculation operand.', 'unsupported_fact');
      const selected = operand.selection ? pointer(operand.selection) : resolveSourceQuote({ id: operand.sourceId, quote: operand.quote }, retrieved);
      if (operand.selection && operand.sourceId != null && operand.sourceId !== selected.id) invalid('Calculation changes the selected source identity.');
      return { value: operand.value, unit: operand.unit, sourceId: selected?.id, quote: selected?.quote };
    }) : calculation?.operands }));
  if (Array.isArray(raw.conflicts)) result.conflicts = raw.conflicts.map(conflict => {
    if (!object(conflict)) invalid('Invalid conflict.', 'unsupported_fact');
    return { ...conflict, evidence: Array.isArray(conflict.selections) ? conflict.selections.map(pointer) : conflict.evidence?.map(reference => resolveSourceQuote(reference, retrieved)) };
  });
  delete result.selections;
  return result;
}
