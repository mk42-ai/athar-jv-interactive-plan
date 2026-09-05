/** Exact-cell recovery over the protected source-view service. No disk writes, providers,
 * public assets, formula evaluation, new source IDs, or physical-index mutations.
 * Call once with a fresh retrieval and the same index used by sourceViews. Returned
 * rawCellEvidence snapshots are request/session evidence, NOT new indexed originals.
 */
import { createHash } from 'node:crypto';
import { immutableRecordsMap, RetrievalError } from './retrieval.js';

const MAX_TARGETS = 8;
const HASH = /^[a-f0-9]{64}$/;
const clone = value => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
const digest = value => createHash('sha256').update(stable(value)).digest('hex');
const escapeRE = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function point(value) {
  const match = typeof value === 'string' && /^\$?([A-Z]{1,3})\$?([1-9]\d{0,6})$/i.exec(value);
  if (!match) return null;
  const column = [...match[1].toUpperCase()].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
  const row = Number(match[2]);
  return column <= 16384 && row <= 1048576 ? { column, row, address: `${match[1].toUpperCase()}${row}` } : null;
}
function rectangle(value) {
  const parts = typeof value === 'string' ? value.split(':') : [];
  if (!parts.length || parts.length > 2) return null;
  const first = point(parts[0]), last = point(parts.at(-1));
  if (!first || !last || first.column > last.column || first.row > last.row) return null;
  return { first, last, area: (last.row - first.row + 1) * (last.column - first.column + 1) };
}
const contains = (range, p) => range && p.row >= range.first.row && p.row <= range.last.row && p.column >= range.first.column && p.column <= range.last.column;
const sameRange = (a, b) => {
  const x = rectangle(a), y = rectangle(b);
  return !!x && !!y && x.first.address === y.first.address && x.last.address === y.last.address;
};
function mismatch() { throw new RetrievalError('raw_cell_evidence_mismatch', 'Protected exact-cell evidence does not match its indexed source.', 503); }

/** Resolve adjacent sheet/address pairs only, never a sheet/cell cross product or
 * a naked A1 token. Worksheet spelling passed to the service is always canonical.
 */
function targetsFor(question, chunks) {
  const names = [...new Set(chunks.map(chunk => chunk.location?.sheet).filter(name => typeof name === 'string'))];
  const found = [];
  for (const sheet of names) {
    // Excel doubles an apostrophe within quoted sheet names. Natural "Draws G20"
    // and "Draws cell G20" are also explicit, unlike an unqualified G20 mention.
    const namesRE = `'${escapeRE(sheet.replace(/'/g, "''"))}'|"${escapeRE(sheet)}"|${escapeRE(sheet)}`;
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_\\]\\[.!])(?:${namesRE})(?:\\s*!\\s*|\\s+(?:cell\\s+)?)(\\$?[A-Z]{1,3}\\$?[1-9]\\d{0,6})(?![\\p{L}\\p{N}_$])`, 'giu');
    for (const match of question.matchAll(pattern)) {
      const end = match.index + match[0].length;
      if (/^\s*:/.test(question.slice(end))) continue; // not a rectangular-range request
      const p = point(match[2]);
      if (p) found.push({ sheet, range: p.address, point: p, start: match.index + match[1].length, end });
    }
  }
  found.sort((a, b) => a.start - b.start || b.end - a.end || a.sheet.localeCompare(b.sheet, 'en'));
  const unique = new Map();
  let previousEnd = -1;
  for (const target of found) {
    if (target.start < previousEnd) continue; // a longer known sheet wins over its suffix
    previousEnd = target.end;
    const key = `${target.sheet}\0${target.range}`;
    if (!unique.has(key)) unique.set(key, target);
  }
  if (unique.size > MAX_TARGETS) throw new RetrievalError('too_many_exact_cells', `Request at most ${MAX_TARGETS} explicitly qualified cells.`);
  return [...unique.values()];
}
function hasCell(chunks, documentId, target) {
  return chunks.some(chunk => chunk.documentId === documentId && chunk.location?.sheet === target.sheet
    && (chunk.records || []).some(record => (record.sheet ?? chunk.location.sheet) === target.sheet
      && point(record.cell ?? record.address)?.address === target.range));
}
function recordText(sheet, record) {
  // JSON quoting keeps strings, numeric zero, null, raw lexemes, formula objects,
  // and absent/empty cache states distinct. These are projections, not XLSX text.
  const fields = ['value', 'rawValue', 'formula', 'cache', 'displayValue', 'numberFormat', 'valueType', 'availability'];
  return `${sheet}!${record.cell}: ${fields.filter(key => Object.hasOwn(record, key)).map(key => `${key}=${JSON.stringify(record[key])}`).join('; ')}`;
}

/** Returns the original result by identity when no augmentation is needed/possible.
 * Otherwise preserves retrieveEvidence's result shape and adds rawCellEvidence[].
 * Each snapshot has original id/baseId + declared location, exactLocation,
 * sourceViewUrl (with sheet/range), sourceView, records, rawSha256 and projection hash.
 * Consumers MUST retain projection provenance and authorize snapshots per session;
 * the unchanged /api/citations/:id endpoint alone still describes the indexed text.
 * Integrity/source-view errors propagate, never silently fall back to stale evidence.
 */
export async function augmentExactCellEvidence(index, retrieved, {
  question = retrieved?.question, documentId = retrieved?.documentId, sourceViews,
} = {}) {
  if (typeof question !== 'string' || !question.trim() || !documentId || documentId === 'all') return retrieved;
  if (question.length > 8000) throw new RetrievalError('invalid_question', 'Question must contain 1–8000 characters.');
  if (retrieved?.documentId !== documentId || !Array.isArray(retrieved?.chunks)) mismatch();
  const doc = index.documents?.find(item => item.id === documentId);
  if (doc?.kind !== 'xlsx') return retrieved;
  const originals = (index.chunks || []).filter(chunk => chunk.documentId === doc.id && chunk.location?.sheet && rectangle(chunk.location.range));
  const targets = targetsFor(question, originals).filter(target => !hasCell(retrieved.chunks, doc.id, target));
  if (!targets.length) return retrieved;
  const additions = [];
  for (const target of targets) {
    const parents = originals.filter(chunk => chunk.location.sheet === target.sheet && contains(rectangle(chunk.location.range), target.point));
    parents.sort((a, b) => rectangle(a.location.range).area - rectangle(b.location.range).area || a.id.localeCompare(b.id, 'en'));
    const parent = parents[0];
    if (!parent) continue;
    if (!sourceViews || typeof sourceViews.location !== 'function') throw new RetrievalError('source_view_unavailable', 'Protected source-view service is required for exact-cell evidence.', 503);
    if (!HASH.test(doc.sha256 || '') || doc.id !== doc.sha256 || !HASH.test(doc.rawSha256 || '')) mismatch();
    const exactLocation = { sheet: target.sheet, range: target.range };
    const view = await sourceViews.location(parent.id, exactLocation);
    if (view?.schemaVersion !== 'athar-source-view/v1' || view.kind !== 'xlsx' || view.renderer !== 'workbook'
        || view.documentId !== doc.id || view.citationId !== parent.id || view.originalSha256 !== doc.sha256
        || view.location?.sheet !== target.sheet || view.location.range !== target.range
        || view.citationLocation?.sheet !== parent.location.sheet || !sameRange(view.citationLocation.range, parent.location.range)
        || view.extractorVersion !== index.extractorVersion || view.indexedAt !== index.generatedAt
        || (view.rawSha256 != null && view.rawSha256 !== doc.rawSha256) || !Array.isArray(view.rows)) mismatch();
    const cells = view.rows.flatMap(row => Array.isArray(row.cells) ? row.cells : (mismatch(), []));
    if (cells.length > 1 || cells.some(cell => cell.sheet !== target.sheet || point(cell.address)?.address !== target.range
      || cell.row !== target.point.row || cell.columnIndex !== target.point.column)) mismatch();
    if (!cells.length) continue; // an unrecorded cell is not a zero, blank, or fabricated record
    const records = cells.map(cell => ({ ...clone(cell), cell: cell.address }));
    const provenance = { schemaVersion: 'athar-raw-cell-evidence/v1', baseId: parent.id,
      documentId: doc.id, originalSha256: doc.sha256, rawSha256: doc.rawSha256, exactLocation, records };
    additions.push(freeze({ ...provenance, id: parent.id, originalDocumentId: doc.id,
      evidenceOrigin: 'raw-record-projection', location: clone(parent.location),
      rawProjectionHash: digest(provenance), text: records.map(record => recordText(target.sheet, record)).join('\n'),
      sourceViewUrl: `/api/citations/${encodeURIComponent(parent.id)}/view?${new URLSearchParams(exactLocation)}`,
      sourceView: clone(view) }));
  }
  if (!additions.length) return retrieved;

  const grouped = new Map();
  for (const addition of additions) {
    if (!grouped.has(addition.id)) grouped.set(addition.id, []);
    grouped.get(addition.id).push(addition);
  }
  const projected = [...grouped].map(([id, snapshots]) => {
    const parent = originals.find(chunk => chunk.id === id);
    const previous = retrieved.chunks.find(chunk => chunk.id === id) || parent;
    const projectionText = `RAW RECORD PROJECTION (not indexed text; recorded values/caches only; formulas are not evaluated)\n${snapshots.map(item => item.text).join('\n')}`;
    const rawProjectionHash = snapshots.length === 1 ? snapshots[0].rawProjectionHash : digest(snapshots.map(item => item.rawProjectionHash));
    const chunk = freeze({ ...clone(previous), kind: 'xlsx',
      ...(parent.kind !== 'xlsx' ? { extractionKind: parent.extractionKind || parent.kind } : {}),
      evidenceOrigin: 'raw-record-projection', text: `${previous.text}\n\n${projectionText}`,
      records: [...clone(previous.records || []), ...snapshots.flatMap(item => item.records)],
      metadata: { ...clone(previous.metadata || {}), evidenceOrigin: 'raw-record-projection',
        originalDocumentId: doc.id, parentId: parent.id, originalSha256: doc.sha256, rawSha256: doc.rawSha256,
        rawEvidenceLocation: snapshots[0].exactLocation, rawEvidenceLocations: snapshots.map(item => item.exactLocation),
        rawProjectionHash, sourceViewUrl: snapshots[0].sourceViewUrl } });
    return { chunk, text: projectionText, projected: true };
  });
  const views = new Map((retrieved.modelChunks || retrieved.chunks).map(chunk => [chunk.id, chunk]));
  const candidates = [...projected, ...retrieved.chunks.filter(chunk => !grouped.has(chunk.id)).map(chunk => ({ chunk, text: views.get(chunk.id)?.text ?? chunk.text }))];
  const limits = retrieved.limits || { maxChunks: 12, maxChars: 45000, maxChunkChars: 12000 };
  const chunks = [], modelChunks = [], scores = {};
  let charCount = 0;
  for (const candidate of candidates) {
    if (chunks.length >= limits.maxChunks || charCount >= limits.maxChars) break;
    const available = Math.min(limits.maxChunkChars, limits.maxChars - charCount);
    // Never cut a raw record/formula in half to fit a model budget.
    if (candidate.projected && candidate.text.length > available) continue;
    const text = candidate.text.slice(0, available), chunk = candidate.chunk;
    if (!text) continue;
    chunks.push(chunk);
    modelChunks.push(freeze({ id: chunk.id, documentId: chunk.documentId, documentSlug: chunk.documentSlug,
      kind: chunk.kind, label: chunk.label, location: clone(chunk.location), text, excerpted: text !== chunk.text,
      ...(candidate.projected ? { evidenceOrigin: 'raw-record-projection', metadata: chunk.metadata } : {}) }));
    charCount += text.length; scores[chunk.id] = retrieved.scores?.[chunk.id] ?? 0;
  }
  const included = new Set(chunks.filter(chunk => chunk.evidenceOrigin === 'raw-record-projection').map(chunk => chunk.id));
  const accepted = additions.filter(item => included.has(item.id));
  if (!accepted.length) return retrieved;
  const oldSnapshots = (retrieved.rawCellEvidence || []).filter(item => chunks.some(chunk => chunk.id === item.id));
  return Object.freeze({ ...retrieved, chunks: Object.freeze(chunks), modelChunks: Object.freeze(modelChunks),
    recordsById: immutableRecordsMap(chunks.map(chunk => [chunk.id, chunk])), scores: freeze(scores), charCount,
    totalMatches: retrieved.totalMatches + accepted.filter((item, i) => accepted.findIndex(other => other.id === item.id) === i && !retrieved.chunks.some(chunk => chunk.id === item.id)).length,
    fullOriginal: freeze({ ...retrieved.fullOriginal,
      retrievedCharacters: chunks.reduce((sum, chunk) => sum + chunk.text.length, 0), projectedCharacters: charCount,
      records: chunks.reduce((sum, chunk) => sum + (chunk.records?.length || 0), 0),
      rawProjectionCharacters: accepted.reduce((sum, item) => sum + item.text.length, 0),
      containsRawRecordProjections: true }),
    rawCellEvidence: Object.freeze([...oldSnapshots, ...accepted]) });
}
