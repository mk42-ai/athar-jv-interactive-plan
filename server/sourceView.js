/** Protected source-view service. No routes, conversions, network calls or import-time I/O.
 * Mount BOTH methods behind the same reviewer access boundary as original downloads.
 * Treat returned strings as source data: render text, never HTML. Internal filenames never
 * leave this module. Workbook JSONL is grouped by sheet, then row, by corpus/v1 ingestion.
 */
import fs from 'node:fs/promises';
import { constants, createReadStream } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { loadCorpusIndex } from './retrieval.js';

export const MAX_SOURCE_VIEW_CELLS = 200;
export const SOURCE_PREVIEW_SCHEMA = 'athar-source-preview/v1';
const VIEW_SCHEMA = 'athar-source-view/v1';
const HASH = /^[a-f0-9]{64}$/;
const OPTIONS = ['page', 'slide', 'sheet', 'range'];
const own = (o, k) => Object.hasOwn(o, k);
const plain = o => !!o && typeof o === 'object' && !Array.isArray(o) && [null, Object.prototype].includes(Object.getPrototypeOf(o));
const copy = v => v === undefined ? null : JSON.parse(JSON.stringify(v));

export class SourceViewError extends Error {
  constructor(code, message, status = 400) {
    super(message); this.name = 'SourceViewError'; this.code = code;
    this.status = this.statusCode = status;
  }
}
const bad = message => { throw new SourceViewError('invalid_location', message); };
const unavailable = (code = 'source_integrity_failed') => { throw new SourceViewError(code, 'The protected source view is unavailable.', 503); };
const notFound = () => { throw new SourceViewError('source_not_found', 'Source not found.', 404); };

/** HTTP query adapter: no parseInt truncation, coercion of arrays, exponent notation or unknown keys.
 * location() itself accepts NUMBERS for page/slide. Routes can use service.parseQuery(req.query).
 */
export function parseSourceViewQuery(query = {}) {
  if (!plain(query) || Object.keys(query).some(k => !OPTIONS.includes(k))) bad('Unsupported source-view parameter.');
  const result = {};
  for (const [k, value] of Object.entries(query)) {
    if (typeof value !== 'string') bad(`Invalid ${k}.`);
    if (k === 'page' || k === 'slide') {
      if (!/^[1-9]\d{0,6}$/.test(value)) bad(`Invalid ${k}.`);
      result[k] = Number(value);
    } else result[k] = value;
  }
  return result;
}
function point(address) {
  const match = typeof address === 'string' && /^\$?([A-Z]{1,3})\$?([1-9]\d{0,6})$/.exec(address);
  if (!match) bad('Use an A1 cell address or contiguous A1:B2 range.');
  const column = [...match[1]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
  const row = Number(match[2]);
  if (column > 16384 || row > 1048576) bad('Cell address exceeds worksheet limits.');
  return { column, row, address: `${match[1]}${row}` };
}
function columnName(n) {
  let result = '';
  while (n) { n--; result = String.fromCharCode(65 + n % 26) + result; n = Math.floor(n / 26); }
  return result;
}
function rect(text) {
  if (typeof text !== 'string' || text.length > 40) bad('Invalid worksheet range.');
  const parts = text.split(':');
  if (parts.length > 2) bad('Only one contiguous range is supported.');
  const first = point(parts[0]), last = point(parts.at(-1));
  if (first.column > last.column || first.row > last.row) bad('Range endpoints must be ordered.');
  return { minRow: first.row, maxRow: last.row, minColumn: first.column, maxColumn: last.column,
    range: first.address === last.address ? first.address : `${first.address}:${last.address}`,
    cellCount: (last.row - first.row + 1) * (last.column - first.column + 1) };
}
const contains = (r, p) => p.row >= r.minRow && p.row <= r.maxRow && p.column >= r.minColumn && p.column <= r.maxColumn;
const inside = (a, b) => a.minRow >= b.minRow && a.maxRow <= b.maxRow && a.minColumn >= b.minColumn && a.maxColumn <= b.maxColumn;
const overlaps = (a, b) => a.minRow <= b.maxRow && b.minRow <= a.maxRow && a.minColumn <= b.maxColumn && b.minColumn <= a.maxColumn;
function windowRange(r, budget = 160) {
  if (r.cellCount <= budget) return r;
  const columns = Math.min(r.maxColumn - r.minColumn + 1, 20);
  const lastRow = Math.min(r.maxRow, r.minRow + Math.floor(budget / columns) - 1);
  return rect(`${columnName(r.minColumn)}${r.minRow}:${columnName(r.minColumn + columns - 1)}${lastRow}`);
}
function sheetInfo(doc) {
  if (!Array.isArray(doc.coverage?.sheets)) unavailable('invalid_source_coverage');
  const names = new Set();
  return doc.coverage.sheets.map(sheet => {
    if (typeof sheet.name !== 'string' || !sheet.name || sheet.name.length > 31 || /[\[\]:*?\\/\x00-\x1f]/.test(sheet.name) || names.has(sheet.name)) unavailable('invalid_source_coverage');
    names.add(sheet.name);
    let bounds;
    try {
      bounds = rect(sheet.dimension);
      // XML dimensions can be stale; the observed source cell extent is also real coverage.
      if (sheet.observedDimension) {
        const o = rect(sheet.observedDimension);
        bounds = rect(`${columnName(Math.min(bounds.minColumn, o.minColumn))}${Math.min(bounds.minRow, o.minRow)}:${columnName(Math.max(bounds.maxColumn, o.maxColumn))}${Math.max(bounds.maxRow, o.maxRow)}`);
      }
    } catch { unavailable('invalid_source_coverage'); }
    return { name: sheet.name, dimension: sheet.dimension, observedDimension: sheet.observedDimension || null,
      bounds, rowCount: bounds.maxRow - bounds.minRow + 1, columnCount: bounds.maxColumn - bounds.minColumn + 1,
      state: sheet.state || 'visible', cellCount: sheet.cellCount ?? null };
  });
}
function count(doc, key) {
  const n = doc.coverage?.[key];
  if (!Number.isSafeInteger(n) || n < 1 || n > 10000) unavailable('invalid_source_coverage');
  return n;
}
function pageNumber(value, max, key) {
  if (!Number.isSafeInteger(value) || value < 1 || value > max) bad(`${key} must be an integer from 1 to ${max}.`);
  return value;
}
function getDocument(index, id) {
  if (typeof id !== 'string' || !HASH.test(id)) notFound();
  const doc = index.documents?.find(d => d.id === id);
  if (!doc) notFound();
  if (doc.sha256 !== doc.id || !['pdf', 'pptx', 'xlsx'].includes(doc.kind)) unavailable('invalid_source_document');
  return doc;
}
function getCitation(index, id) {
  if (typeof id !== 'string' || !/^src-[A-Za-z0-9_-]{1,160}$/.test(id)) notFound();
  // A map-only arbitrary ID is not a citation. It must be a real indexed chunk.
  const chunk = index.chunks?.find(c => c.id === id);
  if (!chunk || !plain(chunk.location)) notFound();
  return chunk;
}
function cellRecord(record, sheet, highlight = false) {
  const p = point(record.cell ?? record.address);
  if ((record.sheet != null && record.sheet !== sheet) || (record.row != null && record.row !== p.row)
      || (record.columnIndex != null && record.columnIndex !== p.column)) unavailable('invalid_source_records');
  const formula = copy(record.formula);
  const cache = copy(record.cache) || { state: formula ? 'absent' : 'not-applicable', lexeme: null };
  const missing = !!formula && cache.state !== 'present';
  return { address: p.address, sheet, row: p.row, columnIndex: p.column,
    value: copy(record.value), rawValue: copy(record.rawValue), formula, cache,
    displayValue: copy(record.displayValue), numberFormat: copy(record.numberFormat),
    sourceValueType: record.valueType ?? (missing ? 'missing-formula-cache' : 'unknown'),
    valueType: record.valueType ?? (missing ? 'missing-formula-cache' : 'unknown'),
    availability: missing ? 'missing-formula-cache' : 'recorded',
    displayValueAvailability: record.displayValue == null ? 'not-recorded' : 'recorded',
    highlight, role: typeof record.role === 'string' ? record.role : 'body' };
}
function validBox(box) {
  return Array.isArray(box) && box.length === 4 && box.every(Number.isFinite) && box[2] >= box[0] && box[3] >= box[1];
}
function textRecords(records, highlighted) {
  let budget = 200;
  return (records || []).slice(0, 200).map(record => {
    const out = { highlight: highlighted };
    for (const key of ['paragraph', 'row', 'column', 'text']) if (['string', 'number'].includes(typeof record[key])) out[key] = record[key];
    if (validBox(record.bbox)) out.bbox = [...record.bbox];
    if (Array.isArray(record.cells)) out.cells = record.cells.slice(0, Math.max(0, budget)).map(cell => {
      budget--;
      if (typeof cell === 'string' || cell === null) return { text: cell, highlight: highlighted };
      return { text: typeof cell.text === 'string' ? cell.text : null,
        ...(validBox(cell.bbox) ? { bbox: [...cell.bbox] } : {}), highlight: highlighted };
    });
    return out;
  });
}

export function createSourceView({ corpusDir = process.env.ATHAR_CORPUS_DIR,
  loadIndex = () => loadCorpusIndex({ corpusDir }) } = {}) {
  const verified = new Map();
  const signature = s => [s.dev, s.ino, s.size, s.mtimeNs, s.ctimeNs].join(':');

  async function openProtected(relative, prefix) {
    if (typeof corpusDir !== 'string' || !corpusDir || typeof relative !== 'string' || relative.length > 2000
        || path.isAbsolute(relative) || /[\\\x00-\x1f:]/.test(relative)) unavailable();
    const parts = relative.split('/');
    if (parts[0] !== prefix || parts.some(p => !p || ['.', '..', 'public'].includes(p))) unavailable();
    let handle;
    try {
      if ((await fs.lstat(corpusDir)).isSymbolicLink()) unavailable();
      const root = await fs.realpath(corpusDir);
      if (root.split(path.sep).includes('public')) unavailable();
      let candidate = root;
      for (const component of parts) {
        candidate = path.join(candidate, component);
        if ((await fs.lstat(candidate)).isSymbolicLink()) unavailable();
      }
      if (await fs.realpath(candidate) !== candidate || !candidate.startsWith(root + path.sep)) unavailable();
      handle = await fs.open(candidate, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
      const stat = await handle.stat({ bigint: true });
      const actual = await fs.lstat(candidate, { bigint: true });
      if (!stat.isFile() || stat.ino !== actual.ino || stat.dev !== actual.dev) unavailable();
      return { handle, key: candidate, signature: signature(stat), size: Number(stat.size) };
    } catch (error) {
      await handle?.close().catch(() => {});
      if (error instanceof SourceViewError) throw error;
      unavailable(error.code === 'ENOENT' ? 'source_file_unavailable' : 'source_integrity_failed');
    }
  }
  async function openVerified(relative, prefix, expected) {
    if (!HASH.test(expected || '')) unavailable();
    const file = await openProtected(relative, prefix);
    try {
      const key = `${file.key}:${expected}`;
      // Rehash on every authorized open. Some snapshot filesystems preserve/coarsen
      // inode timestamps even on same-size replacement; metadata alone is not an integrity proof.
      {
        const hash = createHash('sha256');
        for await (const block of createReadStream(null, { fd: file.handle, autoClose: false, start: 0 })) hash.update(block);
        if (hash.digest('hex') !== expected || signature(await file.handle.stat({ bigint: true })) !== file.signature) unavailable();
        if (verified.size >= 32) verified.delete(verified.keys().next().value);
        verified.set(key, file.signature);
      }
      return file;
    } catch (error) { await file.handle.close(); throw error; }
  }
  async function original(doc) {
    const file = await openVerified(doc.originalFile, 'originals', doc.sha256);
    await file.handle.close();
  }
  async function* rawRecords(doc) {
    // Validate the compressed digest without expanding the full workbook. Hash checks are
    // cached only for the same inode/ctime/mtime/size; the decompressor always streams once.
    const file = await openVerified(doc.rawFile, 'raw', doc.rawSha256);
    const input = createReadStream(null, { fd: file.handle, autoClose: false, start: 0 });
    const gunzip = createGunzip();
    input.on('error', error => gunzip.destroy(error));
    input.pipe(gunzip);
    const lines = createInterface({ input: gunzip, crlfDelay: Infinity });
    let sourceSeen = false;
    try {
      for await (const line of lines) {
        if (!line.trim()) continue;
        if (line.length > 16_000_000) unavailable('invalid_source_records');
        let record;
        try { record = JSON.parse(line); } catch { unavailable('invalid_source_records'); }
        if (!plain(record) || record.documentId !== doc.id) unavailable('invalid_source_records');
        if (!sourceSeen) {
          if (record.recordType !== 'source' || record.sha256 !== doc.sha256) unavailable('invalid_source_records');
          sourceSeen = true;
        }
        yield record;
      }
      if (!sourceSeen) unavailable('invalid_source_records');
    } catch (error) {
      if (error instanceof SourceViewError) throw error;
      unavailable('invalid_source_records');
    } finally {
      try { if (signature(await file.handle.stat({ bigint: true })) !== file.signature) unavailable(); }
      finally {
        lines.close(); input.destroy(); gunzip.destroy();
        await file.handle.close();
      }
    }
  }
  async function previewFile(doc) {
    if (doc.kind === 'pdf') return { file: await openVerified(doc.originalFile, 'originals', doc.sha256),
      sha256: doc.sha256, pageCount: count(doc, 'pages'), derivative: false };
    if (doc.kind !== 'pptx') throw new SourceViewError('preview_unsupported', 'Workbooks are viewed as bounded source regions.');
    let metadataFile;
    try {
      metadataFile = await openProtected(`views/${doc.sha256}.json`, 'views');
      if (metadataFile.size > 16384) unavailable('preview_integrity_failed');
      const meta = JSON.parse(await metadataFile.handle.readFile('utf8'));
      if (meta.schemaVersion !== SOURCE_PREVIEW_SCHEMA || meta.documentId !== doc.id || meta.originalSha256 !== doc.sha256
          || meta.format !== 'pdf' || meta.renderer !== 'libreoffice' || !HASH.test(meta.previewSha256 || '')
          || meta.pageCount !== count(doc, 'slides')) unavailable('preview_integrity_failed');
      const file = await openVerified(`views/${doc.sha256}.pdf`, 'views', meta.previewSha256);
      return { file, sha256: meta.previewSha256, pageCount: meta.pageCount, derivative: true };
    } catch (error) {
      unavailable(error.code === 'source_file_unavailable' ? 'preview_not_ready' : 'preview_integrity_failed');
    } finally { await metadataFile?.handle.close(); }
  }
  async function previewState(doc) {
    const url = `/api/sources/${encodeURIComponent(doc.id)}/preview`;
    let result;
    try {
      result = await previewFile(doc);
      return { available: true, url, contentType: 'application/pdf', originalSha256: doc.sha256,
        sha256: result.sha256, version: doc.sha256, pageCount: result.pageCount, derivative: result.derivative };
    } catch (error) {
      if (doc.kind !== 'pptx' || !['preview_not_ready', 'preview_integrity_failed'].includes(error.code)) throw error;
      return { available: false, url: null, code: error.code, originalSha256: doc.sha256, version: doc.sha256 };
    } finally { await result?.file.handle.close(); }
  }
  function contextCells(index, doc, chunk, sheet, region, bounds) {
    const addresses = new Map();
    for (const candidate of index.chunks || []) {
      if (candidate.documentId !== doc.id || candidate.location?.sheet !== sheet) continue;
      let relevant;
      try { relevant = overlaps(rect(candidate.location.range), region); } catch { unavailable('invalid_source_records'); }
      if (!relevant) continue;
      const declared = new Set((candidate.metadata?.headers || []).filter(h => typeof h.cell === 'string').map(h => point(h.cell).address));
      for (const record of candidate.records || []) {
        const p = point(record.cell ?? record.address);
        if (contains(region, p) || !contains(bounds, p)) continue;
        if (['header', 'row-label'].includes(record.role) || declared.has(p.address)) {
          if (!addresses.has(p.address)) addresses.set(p.address, { ...p, role: record.role || 'header' });
        }
      }
    }
    const all = [...addresses.values()].sort((a, b) => a.row - b.row || a.column - b.column);
    const limit = Math.min(40, MAX_SOURCE_VIEW_CELLS - region.cellCount);
    return { wanted: new Map(all.slice(0, limit).map(p => [p.address, p])), omitted: Math.max(0, all.length - limit) };
  }
  async function workbook(index, doc, chunk, options) {
    const sheets = sheetInfo(doc);
    const citedSheet = sheets.find(s => s.name === chunk.location.sheet);
    if (!citedSheet) unavailable('invalid_source_records');
    const cited = rect(chunk.location.range);
    if (!inside(cited, citedSheet.bounds)) unavailable('invalid_source_records');
    const name = own(options, 'sheet') ? options.sheet : citedSheet.name;
    if (typeof name !== 'string') bad('Worksheet names must match the source exactly.');
    const sheet = sheets.find(s => s.name === name);
    if (!sheet) bad('Unknown worksheet; names are case-sensitive.');
    const target = own(options, 'range') ? rect(options.range) : windowRange(name === citedSheet.name ? cited : sheet.bounds);
    if (!inside(target, sheet.bounds)) bad('Range lies outside the recorded worksheet dimensions.');
    if (target.cellCount > MAX_SOURCE_VIEW_CELLS) bad('A source-view response supports at most 200 cells. Request a smaller region.');
    const context = contextCells(index, doc, chunk, name, target, sheet.bounds);
    const endRow = Math.max(target.maxRow, ...[...context.wanted.values()].map(p => p.row));
    const cells = new Map(), headers = new Map();
    let entered = false, previousRow = 0;
    for await (const record of rawRecords(doc)) {
      if (record.sheet != null && record.sheet !== name) { if (entered) break; continue; }
      if (record.sheet !== name || record.recordType !== 'cell') continue;
      entered = true;
      const p = point(record.cell ?? record.address);
      if (p.row < previousRow) unavailable('invalid_source_records');
      previousRow = p.row;
      if (p.row > endRow) break;
      if (contains(target, p)) {
        if (cells.has(p.address)) unavailable('invalid_source_records');
        cells.set(p.address, cellRecord(record, name, name === citedSheet.name && contains(cited, p)));
      } else if (context.wanted.has(p.address)) {
        headers.set(p.address, { ...cellRecord(record, name, false), role: context.wanted.get(p.address).role });
      }
    }
    const rows = [];
    for (const cell of [...cells.values()].sort((a, b) => a.row - b.row || a.columnIndex - b.columnIndex)) {
      if (rows.at(-1)?.row !== cell.row) rows.push({ row: cell.row, cells: [] });
      rows.at(-1).cells.push(cell);
    }
    return { renderer: 'workbook', location: { sheet: name, range: target.range },
      initialLocation: { sheet: citedSheet.name, range: windowRange(cited).range },
      citationLocation: { sheet: citedSheet.name, range: cited.range },
      availableLocations: { sheets, pageCount: 0, slideCount: 0 }, bounds: target,
      rows, headerRecords: [...headers.values()], cellCount: cells.size + headers.size,
      requestedCellCount: target.cellCount, unrecordedCellCount: target.cellCount - cells.size,
      headerRecordsTruncated: context.omitted > 0, omittedHeaderCount: context.omitted,
      windowed: !own(options, 'range') && target.range !== (name === citedSheet.name ? cited.range : sheet.bounds.range),
      highlights: { type: 'range', sheet: citedSheet.name, range: cited.range,
        visible: name === citedSheet.name && overlaps(cited, target) },
      valuePolicy: 'Recorded source values/caches only; formulas are never evaluated. Null displayValue means no recorded display string. Unrecorded cells are not invented.',
      preview: null, previewUrl: null };
  }
  async function paged(doc, chunk, options) {
    const key = doc.kind === 'pdf' ? 'page' : 'slide', plural = `${key}s`, total = count(doc, plural);
    const cited = pageNumber(chunk.location[key], total, key);
    const current = own(options, key) ? pageNumber(options[key], total, key) : cited;
    const visible = current === cited;
    const records = textRecords(chunk.records, visible);
    let pageGeometry = null;
    const boxes = [];
    if (visible) {
      if (validBox(chunk.metadata?.bbox)) boxes.push([...chunk.metadata.bbox]);
      for (const record of records) {
        if (validBox(record.bbox)) boxes.push(record.bbox);
        for (const cell of record.cells || []) if (validBox(cell.bbox)) boxes.push(cell.bbox);
      }
    }
    if (doc.kind === 'pdf' && doc.rawFile) {
      for await (const record of rawRecords(doc)) {
        if (record.page > current) break;
        if (record.page !== current) continue;
        if (record.recordType === 'pdf-page' && Number.isFinite(record.width) && Number.isFinite(record.height)) {
          pageGeometry = { width: record.width, height: record.height, rotation: record.rotation ?? 0,
            coordinateSystem: 'source-pdf-points-top-left' };
        }
        if (visible && record.recordType === 'pdf-table' && record.table === chunk.location.range && validBox(record.bbox)) boxes.push([...record.bbox]);
      }
    }
    const unique = [...new Map(boxes.map(box => [box.join(','), box])).values()];
    const preview = await previewState(doc);
    return { renderer: 'pdf', location: { [key]: current }, initialLocation: { [key]: cited }, citationLocation: { [key]: cited },
      availableLocations: { pageCount: doc.kind === 'pdf' ? total : 0, slideCount: doc.kind === 'pptx' ? total : 0,
        [plural]: Array.from({ length: total }, (_, i) => i + 1), sheets: [] },
      preview, previewUrl: preview.url, previewPage: current, pageGeometry,
      highlights: { type: unique.length ? 'bounding-boxes' : key, [key]: cited, visible, bboxes: unique,
        coordinateSystem: doc.kind === 'pdf' ? 'source-pdf-points-top-left' : null },
      // The citation's recorded text/paragraphs remain separate from the rendered page.
      citationText: typeof chunk.text === 'string' ? chunk.text : '', records,
      headerRecords: textRecords(Array.isArray(chunk.metadata?.headers) ? chunk.metadata.headers : [], false),
      recordsLocation: { [key]: cited }, recordsTruncated: (chunk.records?.length || 0) > 200 };
  }
  async function location(citationId, options = {}) {
    if (!plain(options) || Object.keys(options).some(k => !OPTIONS.includes(k))) bad('Unsupported source-view parameter.');
    const index = await loadIndex(), chunk = getCitation(index, citationId), doc = getDocument(index, chunk.documentId);
    const allowed = doc.kind === 'xlsx' ? ['sheet', 'range'] : [doc.kind === 'pdf' ? 'page' : 'slide'];
    if (Object.keys(options).some(k => !allowed.includes(k))) bad('Location parameter does not apply to this source type.');
    // Validate locator types and bounds before reading source bytes.
    if (doc.kind !== 'xlsx') {
      const key = allowed[0];
      pageNumber(own(options, key) ? options[key] : chunk.location[key], count(doc, `${key}s`), key);
    }
    await original(doc);
    const body = doc.kind === 'xlsx' ? await workbook(index, doc, chunk, options) : await paged(doc, chunk, options);
    return { schemaVersion: VIEW_SCHEMA, citationId: chunk.id, documentId: doc.id, title: doc.title, kind: doc.kind,
      extractionKind: chunk.extractionKind || chunk.kind, originalSha256: doc.sha256, sha256: doc.sha256,
      version: doc.sha256, extractorVersion: index.extractorVersion, indexedAt: index.generatedAt,
      label: chunk.label, limitations: copy(doc.limitations || []), maxCells: MAX_SOURCE_VIEW_CELLS, ...body };
  }
  /** Returns bytes, NOT a filesystem path. res.set(result.headers).end(result.body).
   * Do not JSON-serialize this payload, expose it as a static file, or redirect to a public deck.
   */
  async function preview(documentId) {
    const index = await loadIndex(), doc = getDocument(index, documentId);
    await original(doc);
    const result = await previewFile(doc);
    try {
      if (result.file.size > 128 * 1024 * 1024) unavailable('preview_too_large');
      const body = await result.file.handle.readFile();
      if (body.subarray(0, 5).toString('ascii') !== '%PDF-' || createHash('sha256').update(body).digest('hex') !== result.sha256) unavailable('preview_integrity_failed');
      const contentDisposition = `inline; filename="${doc.id}.pdf"`;
      return { body, contentType: 'application/pdf', contentDisposition, documentId: doc.id,
        originalSha256: doc.sha256, sha256: result.sha256, version: doc.sha256, derivative: result.derivative,
        pageCount: result.pageCount, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': contentDisposition,
          'Content-Length': String(body.length), 'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, no-store', 'Cross-Origin-Resource-Policy': 'same-origin',
          'X-Source-SHA256': doc.sha256 } };
    } finally { await result.file.handle.close(); }
  }
  return { location, preview, parseQuery: parseSourceViewQuery };
}
