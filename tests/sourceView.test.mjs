import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { createSourceView, parseSourceViewQuery, SOURCE_PREVIEW_SCHEMA, SourceViewError } from '../server/sourceView.js';

// Synthetic files only. These tests never load the real corpus, start a provider,
// modify originals, mount routes, or change the live application baseline.
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const pdfBytes = Buffer.from('%PDF-1.7\nsynthetic source bytes, not a rendering fixture\n%%EOF');
const errorCode = (code, status) => error => error instanceof SourceViewError && error.code === code && (!status || error.status === status);
function cell(sheet, address, value, overrides = {}) {
  const [, col, row] = /^([A-Z]+)(\d+)$/.exec(address);
  return { recordType: 'cell', sheet, cell: address, row: Number(row),
    columnIndex: [...col].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0),
    value, rawValue: value == null ? null : String(value), displayValue: typeof value === 'string' ? value : null,
    valueType: typeof value === 'number' ? 'number' : 'string', formula: null,
    cache: { state: 'not-applicable', lexeme: null }, numberFormat: { code: 'General', id: 0 }, ...overrides };
}
async function fixture(t, kind = 'xlsx') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'source-view-synthetic-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const folder of ['originals', 'raw', 'views']) await fs.mkdir(path.join(root, folder));
  const bytes = kind === 'pdf' ? pdfBytes : Buffer.from(`synthetic-${kind}-source`);
  const id = digest(bytes);
  const doc = { id, sha256: id, kind, slug: 'synthetic', title: 'Synthetic source', limitations: [],
    originalFile: `originals/${id}.${kind}`, rawFile: `raw/${id}.records.jsonl.gz`,
    coverage: kind === 'xlsx' ? { sheets: [
      { name: 'Data', dimension: 'A1:D100', observedDimension: 'A1:D100', cellCount: 9 },
      { name: 'Other Sheet', dimension: 'B2:E20', observedDimension: 'B2:E20', cellCount: 2 },
    ] } : { pages: kind === 'pdf' ? 2 : 0, slides: kind === 'pptx' ? 2 : 0 } };
  await fs.writeFile(path.join(root, doc.originalFile), bytes);
  const records = kind === 'xlsx' ? [
    cell('Data', 'A1', 'Recorded label', { role: 'header' }),
    cell('Data', 'B1', 'Recorded units', { role: 'header' }),
    cell('Data', 'A3', 'Revenue', { role: 'row-label' }),
    cell('Data', 'B3', 2),
    cell('Data', 'C3', null, { formula: { text: 'SUM(B3:B4)', type: 'normal' },
      cache: { state: 'absent', lexeme: null }, valueType: 'missing-formula-cache', rawValue: null }),
    cell('Data', 'B4', 0, { formula: { text: 'B3-B3' }, cache: { state: 'present', lexeme: '0' } }),
    cell('Data', 'C4', null, { formula: { text: 'B3+B4' }, cache: { state: 'empty', lexeme: null }, valueType: 'missing-formula-cache' }),
    cell('Data', 'D80', 840), cell('Data', 'D81', 841),
    cell('Other Sheet', 'B2', 'Other recorded header'), cell('Other Sheet', 'E20', 99),
  ] : kind === 'pdf' ? [
    { recordType: 'pdf-page', page: 1, width: 612, height: 792, rotation: 0 },
    { recordType: 'pdf-table', page: 1, table: 'text-1', bbox: [10, 20, 100, 40] },
    { recordType: 'pdf-page', page: 2, width: 612, height: 792, rotation: 0 },
  ] : [];
  const chunk = { id: 'src-synthetic-1', documentId: id, kind: kind === 'xlsx' ? 'sheet-rows' : kind === 'pdf' ? 'pdf-page' : 'slide',
    location: kind === 'xlsx' ? { sheet: 'Data', range: 'B3:C4' } : kind === 'pdf' ? { page: 1 } : { slide: 1 },
    label: 'Synthetic citation', text: 'Recorded synthetic citation text',
    records: kind === 'xlsx' ? records.slice(0, 7) : kind === 'pptx' ? [{ paragraph: 1, text: 'Actual recorded paragraph' }] : [],
    metadata: kind === 'xlsx' ? { headers: [{ cell: 'A1', text: 'A1=Recorded label' }, { cell: 'B1', text: 'B1=Recorded units' }] } : {} };
  const index = { schemaVersion: 'athar-corpus/v1', extractorVersion: 'synthetic/1', generatedAt: '2026-09-05T00:00:00Z',
    documents: [doc], chunks: [chunk], recordsById: new Map([[chunk.id, chunk]]), documentsById: new Map([[id, doc]]) };
  async function writeRaw(nextRecords = records, sourceOverrides = {}, trailing = '') {
    const raw = gzipSync([{ recordType: 'source', documentId: id, sha256: id, ...sourceOverrides },
      ...nextRecords.map(record => ({ documentId: id, ...record }))].map(r => JSON.stringify(r)).join('\n') + '\n' + trailing);
    await fs.writeFile(path.join(root, doc.rawFile), raw); doc.rawSha256 = digest(raw);
  }
  await writeRaw();
  const service = createSourceView({ corpusDir: root, loadIndex: async () => index });
  return { root, doc, chunk, index, records, service, writeRaw };
}
async function writePreview(f, changes = {}, bytes = pdfBytes) {
  await fs.writeFile(path.join(f.root, 'views', `${f.doc.id}.pdf`), bytes);
  const metadata = { schemaVersion: SOURCE_PREVIEW_SCHEMA, documentId: f.doc.id,
    originalSha256: f.doc.sha256, previewSha256: digest(bytes), format: 'pdf', renderer: 'libreoffice', pageCount: 2, ...changes };
  await fs.writeFile(path.join(f.root, 'views', `${f.doc.id}.json`), JSON.stringify(metadata));
}

test('workbook response preserves exact addresses, source types, null displays, formula/cache and distinct real headers', async t => {
  const f = await fixture(t);
  const response = await f.service.location(f.chunk.id);
  assert.deepEqual(response.location, { sheet: 'Data', range: 'B3:C4' });
  assert.deepEqual(response.initialLocation, response.location);
  assert.equal(response.version, f.doc.sha256);
  assert.equal(response.originalSha256, f.doc.id);
  assert.deepEqual(response.rows.map(row => row.row), [3, 4]);
  const cells = response.rows.flatMap(row => row.cells);
  assert.deepEqual(cells.map(c => c.address), ['B3', 'C3', 'B4', 'C4']);
  assert.ok(cells.every(c => c.highlight));
  const absent = cells.find(c => c.address === 'C3');
  assert.equal(absent.value, null); assert.equal(absent.rawValue, null); assert.equal(absent.displayValue, null);
  assert.equal(absent.formula.text, 'SUM(B3:B4)'); assert.equal(absent.cache.state, 'absent');
  assert.equal(absent.sourceValueType, 'missing-formula-cache'); assert.equal(absent.availability, 'missing-formula-cache');
  const empty = cells.find(c => c.address === 'C4');
  assert.equal(empty.cache.state, 'empty'); assert.equal(empty.value, null);
  const zero = cells.find(c => c.address === 'B4');
  assert.equal(zero.value, 0); assert.equal(zero.cache.lexeme, '0'); assert.equal(zero.displayValue, null);
  assert.equal(zero.displayValueAvailability, 'not-recorded');
  assert.deepEqual(response.headerRecords.map(c => c.address), ['A1', 'B1', 'A3']);
  assert.ok(response.headerRecords.every(c => !c.highlight));
  assert.equal(response.cellCount, 7); assert.equal(response.unrecordedCellCount, 0);
  assert.deepEqual(response.availableLocations.sheets.map(s => s.name), ['Data', 'Other Sheet']);
  assert.equal(response.availableLocations.sheets[1].dimension, 'B2:E20');
  const json = JSON.stringify(response);
  assert.ok(!json.includes(f.root)); assert.ok(!json.includes('rawFile')); assert.ok(!json.includes('sourceXML'));
});

test('navigation reads complete gzipped raw cells omitted from retrieval chunks and stops before later records', async t => {
  const f = await fixture(t);
  assert.ok(!f.chunk.records.some(c => c.cell === 'D80'));
  // Invalid trailing record proves this request stops after the requested row;
  // integrity verifies gzip bytes but does not parse/decompress the full workbook.
  await f.writeRaw(f.records, {}, '{deliberately-not-json}\n');
  const view = await f.service.location(f.chunk.id, { range: 'D80' });
  assert.equal(view.rows[0].cells[0].value, 840);
  assert.equal(view.rows[0].cells[0].address, 'D80');
  assert.equal(view.rows[0].cells[0].highlight, false);
  assert.equal(view.highlights.visible, false);
  assert.deepEqual(view.initialLocation, { sheet: 'Data', range: 'B3:C4' });
});

test('sheet navigation is exact, defaults to its own real bounds, and preserves citation target', async t => {
  const f = await fixture(t);
  const view = await f.service.location(f.chunk.id, { sheet: 'Other Sheet', range: 'E20' });
  assert.equal(view.rows[0].cells[0].value, 99);
  assert.equal(view.highlights.visible, false);
  assert.equal(view.citationLocation.sheet, 'Data');
  const start = await f.service.location(f.chunk.id, { sheet: 'Other Sheet' });
  assert.equal(start.location.range, 'B2:E20');
});

test('strict shape, sheet, rectangular bounds, unknown parameters and overflow rejection', async t => {
  const f = await fixture(t);
  const invalid = [null, [], 'A1', { sheet: null }, { sheet: 'data' }, { sheet: '../Data' },
    { page: 1 }, { slide: 1 }, { range: ['B3'] }, { range: 4 }, { range: 'A0' },
    { range: 'XFE1' }, { range: 'A1048577' }, { range: 'B4:A3' }, { range: 'A1,B2' },
    { range: 'Data!B3' }, { range: 'a1' }, { range: ' A1' }, { range: 'A1:B2:C3' },
    { range: 'A101' }, { range: 'E1' }, { range: 'A1:D51' },
    { range: 'A1:XFD1048576' }, { sheet: 'Other Sheet', range: 'A1' }, { filepath: '/etc/passwd' }];
  for (const options of invalid) await assert.rejects(f.service.location(f.chunk.id, options), errorCode('invalid_location', 400));
  const all = await f.service.location(f.chunk.id, { range: 'A1:D50' });
  assert.equal(all.requestedCellCount, 200); assert.ok(all.cellCount <= 200);
  assert.deepEqual((await f.service.location(f.chunk.id, { range: '$B$3:$C$4' })).location, { sheet: 'Data', range: 'B3:C4' });
});

test('oversized citations open a bounded window and retain the full real cited range', async t => {
  const f = await fixture(t); f.chunk.location.range = 'A1:D100';
  const view = await f.service.location(f.chunk.id);
  assert.equal(view.windowed, true);
  assert.equal(view.location.range, 'A1:D40');
  assert.equal(view.citationLocation.range, 'A1:D100');
  assert.equal(view.highlights.range, 'A1:D100');
  assert.ok(view.requestedCellCount <= 200);
});

test('repeated context counts toward the 200-cell response cap; context addresses are not moved into grid', async t => {
  const f = await fixture(t);
  f.doc.coverage.sheets[0].dimension = 'A1:B250';
  f.doc.coverage.sheets[0].observedDimension = 'A1:B250';
  const headers = Array.from({ length: 60 }, (_, i) => cell('Data', `A${i + 1}`, `Header ${i + 1}`, { role: 'header' }));
  const body = Array.from({ length: 195 }, (_, i) => cell('Data', `B${i + 51}`, i));
  f.chunk.location.range = 'B51:B245'; f.chunk.records = [...headers, ...body];
  f.chunk.metadata = {};
  await f.writeRaw([...headers, ...body].sort((a, b) => a.row - b.row || a.columnIndex - b.columnIndex));
  const view = await f.service.location(f.chunk.id, { range: 'B51:B245' });
  assert.equal(view.cellCount, 200); assert.equal(view.headerRecords.length, 5);
  assert.equal(view.headerRecordsTruncated, true); assert.equal(view.omittedHeaderCount, 55);
  assert.ok(view.rows.every(r => r.cells.every(c => c.address.startsWith('B'))));
});

test('unknown IDs and fabricated map-only references fail closed', async t => {
  const f = await fixture(t);
  for (const id of ['src-unknown', '../x', '', null, ['src-synthetic-1'], 'src-<script>'])
    await assert.rejects(f.service.location(id), errorCode('source_not_found', 404));
  f.index.recordsById.set('src-map-only', { ...f.chunk, id: 'src-map-only' });
  await assert.rejects(f.service.location('src-map-only'), errorCode('source_not_found', 404));
  for (const id of ['../x', f.doc.slug, '0'.repeat(64)]) await assert.rejects(f.service.preview(id), errorCode('source_not_found', 404));
});

test('query adapter converts only canonical positive decimal strings', () => {
  assert.deepEqual(parseSourceViewQuery({ page: '2' }), { page: 2 });
  assert.deepEqual(parseSourceViewQuery({ sheet: 'Other Sheet', range: 'B2:C4' }), { sheet: 'Other Sheet', range: 'B2:C4' });
  for (const value of ['0', '-1', '1.2', '1e2', '01', '+1', ' 1', '1 ', '', 'Infinity', ['1'], 1, null, {}])
    assert.throws(() => parseSourceViewQuery({ page: value }), errorCode('invalid_location'));
  for (const value of [null, [], 'x', { path: 'x' }, { range: ['A1'] }]) assert.throws(() => parseSourceViewQuery(value), errorCode('invalid_location'));
});

test('PDF location has real page navigation and inline original bytes, never a public deck URL', async t => {
  const f = await fixture(t, 'pdf');
  const location = await f.service.location(f.chunk.id);
  assert.deepEqual(location.availableLocations.pages, [1, 2]);
  assert.equal(location.highlights.type, 'page'); assert.equal(location.highlights.visible, true);
  assert.deepEqual(location.pageGeometry, { width: 612, height: 792, rotation: 0, coordinateSystem: 'source-pdf-points-top-left' });
  assert.equal(location.previewUrl, `/api/sources/${f.doc.id}/preview`);
  assert.equal(location.preview.derivative, false);
  const other = await f.service.location(f.chunk.id, { page: 2 });
  assert.equal(other.location.page, 2); assert.equal(other.initialLocation.page, 1); assert.equal(other.highlights.visible, false);
  const preview = await f.service.preview(f.doc.id);
  assert.deepEqual(preview.body, pdfBytes);
  assert.equal(preview.contentType, 'application/pdf'); assert.match(preview.contentDisposition, /^inline;/);
  assert.equal(preview.headers['Cache-Control'], 'private, no-store');
  assert.equal(preview.originalSha256, f.doc.id);
  for (const options of [{ page: 0 }, { page: 3 }, { page: 1.1 }, { page: '1' }, { page: NaN }, { page: Infinity }, { page: null }, { page: 9007199254740992 }, { range: 'A1' }])
    await assert.rejects(f.service.location(f.chunk.id, options), errorCode('invalid_location', 400));
});

test('PDF highlights use recorded geometric boxes, with separate recorded text/header records', async t => {
  const f = await fixture(t, 'pdf');
  f.chunk.kind = 'pdf-section';
  f.chunk.records = [{ row: 3, text: 'Recorded row', cells: [{ text: 'Exact source text', bbox: [10, 20, 50, 30] }] }];
  f.chunk.metadata = { headers: [{ row: 1, text: 'Header source text' }] };
  const view = await f.service.location(f.chunk.id);
  assert.equal(view.highlights.type, 'bounding-boxes');
  assert.deepEqual(view.highlights.bboxes, [[10, 20, 50, 30]]);
  assert.equal(view.records[0].highlight, true); assert.equal(view.headerRecords[0].highlight, false);
  f.chunk.records = []; f.chunk.location.range = 'text-1';
  assert.deepEqual((await f.service.location(f.chunk.id)).highlights.bboxes, [[10, 20, 100, 40]]);
});

test('PPTX never assumes a preview exists; matching SHA metadata and derivative digest are required', async t => {
  const f = await fixture(t, 'pptx');
  const absent = await f.service.location(f.chunk.id);
  assert.equal(absent.preview.available, false); assert.equal(absent.preview.code, 'preview_not_ready');
  assert.equal(absent.previewUrl, null); assert.equal(absent.records[0].paragraph, 1);
  assert.deepEqual(absent.availableLocations.slides, [1, 2]);
  await assert.rejects(f.service.preview(f.doc.id), errorCode('preview_not_ready', 503));
  await writePreview(f);
  const view = await f.service.location(f.chunk.id, { slide: 2 });
  assert.equal(view.preview.available, true); assert.equal(view.preview.derivative, true);
  assert.equal(view.previewPage, 2); assert.equal(view.initialLocation.slide, 1); assert.equal(view.records[0].highlight, false);
  assert.deepEqual((await f.service.preview(f.doc.id)).body, pdfBytes);
  for (const options of [{ slide: '2' }, { slide: 3 }, { slide: -1 }, { page: 1 }])
    await assert.rejects(f.service.location(f.chunk.id, options), errorCode('invalid_location'));
});

test('PPTX stale original association, wrong page count, renderer, schema, derivative digest and tampering are rejected', async t => {
  const f = await fixture(t, 'pptx');
  const changes = [{ originalSha256: '0'.repeat(64) }, { documentId: '0'.repeat(64) }, { pageCount: 1 },
    { schemaVersion: 'old' }, { renderer: 'public-deck' }, { format: 'png' }, { previewSha256: '0'.repeat(64) }];
  for (const change of changes) {
    await writePreview(f, change);
    await assert.rejects(f.service.preview(f.doc.id), errorCode('preview_integrity_failed', 503));
    const view = await f.service.location(f.chunk.id);
    assert.equal(view.preview.available, false); assert.equal(view.previewUrl, null);
  }
  await writePreview(f);
  await f.service.preview(f.doc.id);
  await fs.writeFile(path.join(f.root, 'views', `${f.doc.id}.pdf`), '%PDF-1.7\ntampered');
  await assert.rejects(f.service.preview(f.doc.id), errorCode('preview_integrity_failed', 503));
  await writePreview(f, {}, Buffer.from('not a PDF'));
  await assert.rejects(f.service.preview(f.doc.id), errorCode('preview_integrity_failed', 503));
});

test('original and raw traversal, absolute paths, wrong subdirectory and symlinks are rejected', async t => {
  const f = await fixture(t);
  for (const key of ['originalFile', 'rawFile']) {
    const original = f.doc[key];
    for (const unsafe of ['../outside', '/etc/passwd', 'raw/../originals/file', 'raw//file', 'raw/./file',
      'raw\\file', 'raw/file\0', 'https://host/file', 'public/file', key === 'rawFile' ? f.doc.originalFile : f.doc.rawFile]) {
      f.doc[key] = unsafe;
      await assert.rejects(f.service.location(f.chunk.id), errorCode('source_integrity_failed', 503));
    }
    f.doc[key] = original;
    const link = `${key === 'rawFile' ? 'raw' : 'originals'}/link`;
    await fs.symlink(path.join(f.root, original), path.join(f.root, link));
    f.doc[key] = link;
    await assert.rejects(f.service.location(f.chunk.id), errorCode('source_integrity_failed', 503));
    f.doc[key] = original;
  }
  await fs.rename(path.join(f.root, 'raw'), path.join(f.root, 'real-raw'));
  await fs.symlink(path.join(f.root, 'real-raw'), path.join(f.root, 'raw'));
  await assert.rejects(f.service.location(f.chunk.id), errorCode('source_integrity_failed', 503));
});

test('hash cache invalidates on same-length changes and raw digest or source identity mismatch fails closed', async t => {
  const f = await fixture(t);
  await f.service.location(f.chunk.id);
  const originalPath = path.join(f.root, f.doc.originalFile), before = await fs.readFile(originalPath);
  const altered = Buffer.from(before); altered[0] ^= 1;
  await fs.writeFile(originalPath, altered);
  await assert.rejects(f.service.location(f.chunk.id), errorCode('source_integrity_failed', 503));
  await fs.writeFile(originalPath, before);
  const rawPath = path.join(f.root, f.doc.rawFile), raw = await fs.readFile(rawPath);
  await fs.writeFile(rawPath, gzipSync('bad replacement'));
  await assert.rejects(f.service.location(f.chunk.id), errorCode('source_integrity_failed', 503));
  await fs.writeFile(rawPath, raw);
  await f.writeRaw(f.records, { sha256: '0'.repeat(64) });
  await assert.rejects(f.service.location(f.chunk.id), errorCode('invalid_source_records', 503));
});

test('corrupt gzip/JSON, foreign records and inconsistent cell addresses fail closed without leaking paths', async t => {
  const f = await fixture(t);
  const invalid = [Buffer.from('not gzip'), gzipSync('not json\n')];
  for (const bytes of invalid) {
    await fs.writeFile(path.join(f.root, f.doc.rawFile), bytes); f.doc.rawSha256 = digest(bytes);
    await assert.rejects(f.service.location(f.chunk.id), errorCode('invalid_source_records', 503));
  }
  await f.writeRaw([cell('Data', 'B3', 7, { documentId: '0'.repeat(64) })]);
  await assert.rejects(f.service.location(f.chunk.id), errorCode('invalid_source_records', 503));
  await f.writeRaw([cell('Data', 'B3', 7, { row: 4 })]);
  await assert.rejects(f.service.location(f.chunk.id), errorCode('invalid_source_records', 503));
});

test('preview metadata and preview file symlinks are never accepted', async t => {
  const f = await fixture(t, 'pptx');
  await writePreview(f);
  const target = path.join(f.root, 'views', `${f.doc.id}.pdf`);
  await fs.rename(target, `${target}.real`); await fs.symlink(`${target}.real`, target);
  await assert.rejects(f.service.preview(f.doc.id), errorCode('preview_integrity_failed', 503));
  await fs.unlink(target); await fs.rename(`${target}.real`, target);
  const meta = path.join(f.root, 'views', `${f.doc.id}.json`);
  await fs.rename(meta, `${meta}.real`); await fs.symlink(`${meta}.real`, meta);
  await assert.rejects(f.service.preview(f.doc.id), errorCode('preview_integrity_failed', 503));
});
