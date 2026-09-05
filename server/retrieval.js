import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

/** No provider calls, routes, public assets, or original documents are accessed here. */
export class RetrievalError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'RetrievalError';
    this.code = code;
    this.status = this.statusCode = status;
  }
}

const KINDS = new Set(['pdf', 'pptx', 'xlsx', 'docx']);
const SLUGS = new Set(['financial-summary', 'executive-presentation', 'financial-model', 'implementation-plan']);
const STOP = new Set('a an the and or of to in on at for from with is are was were be been it its this that these those what which who how do does did can could would should please tell me about compare comparison versus vs across both between'.split(' '));
// Search-only equivalents. Never equate debt/equity, currencies, scenarios, or capital types.
const SYNONYMS = [
  ['geography', 'geographic', 'geographical', 'region', 'regions', 'country', 'countries', 'location', 'locations'],
  ['funding', 'financing'], ['assumption', 'assumptions'], ['output', 'outputs'],
  ['risk', 'risks'], ['control', 'controls'], ['timeline', 'milestone', 'milestones', 'gates'],
  ['agreement', 'agree', 'agreed', 'decisions', 'decision', 'approval', 'pending'],
  ['depend', 'depends', 'dependent', 'dependencies', 'prerequisite', 'requires'],
  ['revenue', 'revenues'], ['cost', 'costs'], ['expense', 'expenses'],
];
const compiledIndexes = new WeakMap();
const validatedIndexes = new WeakSet();
const diskCache = new Map();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export function normalizeEvidenceText(value) {
  return String(value ?? '').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ').trim();
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freeze(item);
    Object.freeze(value);
  }
  return value;
}

/** Object.freeze(new Map()) is mutable. This facade deliberately exposes no mutators. */
export function immutableRecordsMap(entries) {
  const map = new Map(entries);
  const view = {
    get: key => map.get(key), has: key => map.has(key),
    keys: () => map.keys(), values: () => map.values(), entries: () => map.entries(),
    forEach: callback => map.forEach((value, key) => callback(value, key, view)),
    [Symbol.iterator]: () => map[Symbol.iterator](),
  };
  Object.defineProperty(view, 'size', { enumerable: true, get: () => map.size });
  return Object.freeze(view);
}

function invalid(message) { throw new RetrievalError('invalid_corpus', message, 503); }
function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function requiredString(value, name, max = 1000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) invalid(`Invalid ${name}.`);
}
function validCell(value) {
  const match = /^\$?([A-Z]{1,3})\$?([1-9]\d{0,6})$/.exec(value);
  if (!match) return null;
  const column = [...match[1]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
  const row = Number(match[2]);
  return column <= 16384 && row <= 1048576 ? { column, row } : null;
}

export function validateSourceLocation(kind, location) {
  if (!plain(location) || Object.keys(location).some(key => !['page', 'slide', 'sheet', 'range', 'part'].includes(key))) invalid('Invalid source locator.');
  for (const key of ['page', 'slide']) {
    if (location[key] != null && (!Number.isSafeInteger(location[key]) || location[key] < 1)) invalid(`Invalid ${key} locator.`);
  }
  if (kind === 'pdf' && !Number.isSafeInteger(location.page)) invalid('PDF source requires a page.');
  if (kind === 'pptx' && !Number.isSafeInteger(location.slide)) invalid('PPTX source requires a slide.');
  if (kind !== 'pdf' && location.page != null) invalid('Page locator is only valid for PDF.');
  if (kind !== 'pptx' && location.slide != null) invalid('Slide locator is only valid for PPTX.');
  if (kind === 'xlsx') {
    requiredString(location.sheet, 'sheet locator', 31);
    if (/[\[\]:*?\\/]/.test(location.sheet)) invalid('Invalid sheet locator.');
    requiredString(location.range, 'range locator', 40);
    const cells = location.range.split(':');
    if (cells.length > 2) invalid('Invalid cell range.');
    const first = validCell(cells[0]);
    const last = validCell(cells.at(-1));
    if (!first || !last || first.column > last.column || first.row > last.row) invalid('Invalid cell range.');
  } else if (location.sheet != null || (location.range != null && !(kind === 'pdf' && /^(?:lines|text)-[1-9]\d*$/.test(location.range)))) invalid('Workbook locator on a non-workbook source.');
  if (kind === 'docx') requiredString(location.part, 'DOCX part locator', 500);
  if (location.part != null) requiredString(location.part, 'part locator', 500);
  return location;
}

/** Validate and privately clone JSON; mutating the caller's original index cannot change evidence. */
export function validateCorpusIndex(input) {
  let data;
  try { data = JSON.parse(JSON.stringify(input)); } catch { invalid('Corpus must be JSON data.'); }
  if (!plain(data) || data.schemaVersion !== 'athar-corpus/v1' || !Array.isArray(data.documents) || !Array.isArray(data.chunks)) invalid('Unsupported corpus schema.');
  requiredString(data.extractorVersion, 'extractor version', 200);
  requiredString(data.generatedAt, 'generation time', 100);
  if (!Number.isFinite(Date.parse(data.generatedAt))) invalid('Invalid corpus generation time.');
  const docs = new Map();
  const slugs = new Set();
  for (const doc of data.documents) {
    if (!plain(doc)) invalid('Invalid document.');
    requiredString(doc.id, 'document ID', 128);
    if (!/^[a-f0-9]{64}$/i.test(doc.id) || doc.id !== doc.sha256) invalid('Document ID must equal its SHA-256.');
    if (docs.has(doc.id) || slugs.has(doc.slug)) invalid('Duplicate document ID or slug.');
    if (!SLUGS.has(doc.slug) || !KINDS.has(doc.kind)) invalid('Invalid document slug or kind.');
    requiredString(doc.title, 'document title', 1000);
    requiredString(doc.status, 'document status', 200);
    if (!Object.hasOwn(doc, 'coverage') || !Array.isArray(doc.limitations)) invalid('Document coverage and limitations are required.');
    requiredString(doc.originalFile, 'private original filename', 2000);
    if (path.isAbsolute(doc.originalFile) || doc.originalFile.includes('\\') || /[\x00-\x1F]/.test(doc.originalFile)
        || doc.originalFile.split('/').some(part => part === '..' || part === 'public') || /^[a-z]+:/i.test(doc.originalFile)) invalid('Original filename must be a private relative path.');
    docs.set(doc.id, doc); slugs.add(doc.slug);
  }
  const ids = new Set();
  for (const chunk of data.chunks) {
    if (!plain(chunk) || typeof chunk.id !== 'string' || !/^src-[A-Za-z0-9_-]+$/.test(chunk.id)) invalid('Invalid source ID.');
    if (ids.has(chunk.id)) invalid('Duplicate source ID.');
    ids.add(chunk.id);
    const doc = docs.get(chunk.documentId);
    if (!doc || chunk.documentSlug !== doc.slug) invalid('Source has an invalid document link.');
    // The extractor distinguishes passages/table regions from their container format.
    // Preserve that subtype, while locator validation/ranking use the document format.
    const subtypes = { pdf: ['pdf-page', 'pdf-section', 'table-region'], pptx: ['slide', 'notes', 'table-region'], xlsx: ['sheet-rows', 'table-region'], docx: ['paragraph', 'table-region'] };
    if (chunk.kind !== doc.kind && !subtypes[doc.kind]?.includes(chunk.kind)) invalid('Source has an invalid extraction kind.');
    if (chunk.kind !== doc.kind) { chunk.extractionKind = chunk.kind; chunk.kind = doc.kind; }
    requiredString(chunk.label, 'source label', 2000);
    requiredString(chunk.text, 'source text', 20_000_000);
    validateSourceLocation(chunk.kind, chunk.location);
    if (chunk.records != null && !Array.isArray(chunk.records)) invalid('Source records must be an array.');
    if (chunk.metadata != null && !plain(chunk.metadata)) invalid('Source metadata must be an object.');
  }
  freeze(data);
  const validated = Object.freeze({
    ...data,
    documentsById: immutableRecordsMap(data.documents.map(doc => [doc.id, doc])),
    recordsById: immutableRecordsMap(data.chunks.map(chunk => [chunk.id, chunk])),
  });
  validatedIndexes.add(validated);
  return validated;
}

function signature(info) { return `${info.mtimeMs}:${info.ctimeMs}:${info.size}:${info.ino}`; }

/** One parse per stable file version; concurrent requests share reloads. Bad updates fail closed. */
export async function loadCorpusIndex({ corpusDir = process.env.ATHAR_CORPUS_DIR, force = false } = {}) {
  if (!corpusDir) throw new RetrievalError('corpus_unavailable', 'Private corpus directory is not configured.', 503);
  const directory = path.resolve(corpusDir);
  if (directory.split(path.sep).includes('public')) throw new RetrievalError('corpus_unavailable', 'Corpus must not be read from public assets.', 503);
  const filename = path.join(directory, 'index.json');
  let entry = diskCache.get(filename);
  if (!entry) { entry = {}; diskCache.set(filename, entry); }
  if (entry.pending) return entry.pending;
  entry.pending = (async () => {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const before = await stat(filename);
        const version = signature(before);
        if (!force && entry.index && entry.version === version) return entry.index;
        const raw = await readFile(filename, 'utf8');
        const after = await stat(filename);
        if (version !== signature(after)) throw new Error('Corpus changed during read.');
        const index = validateCorpusIndex(JSON.parse(raw));
        entry.index = index; entry.version = version;
        return index;
      } catch (error) {
        lastError = error;
        if (attempt < 2) await delay(25 * (attempt + 1));
      }
    }
    if (lastError instanceof RetrievalError) throw lastError;
    throw new RetrievalError('corpus_unavailable', 'Private evidence index is unavailable or incomplete.', 503);
  })();
  try { return await entry.pending; } finally { entry.pending = null; }
}

export function clearCorpusCache() { diskCache.clear(); }

function tokens(text) {
  return (normalizeEvidenceText(text).toLowerCase().match(/[\p{L}\p{N}]+(?:[.'-][\p{L}\p{N}]+)*/gu) || [])
    .filter(token => !STOP.has(token));
}

/** Only the last user question may be carried forward, never an assistant answer or another scope. */
export function buildRetrievalQuery({ question, history = [], documentId = 'all', slide = null } = {}) {
  if (typeof question !== 'string' || !question.trim() || question.length > 8000) throw new RetrievalError('invalid_question', 'Question must contain 1–8000 characters.');
  if (!Array.isArray(history)) throw new RetrievalError('invalid_history', 'History must be an array.');
  const current = question.trim();
  const lastUser = [...history].reverse().find(item => item && (item.role === 'user' || (typeof item.question === 'string' && !item.role)));
  const previous = lastUser?.content ?? lastUser?.question;
  const followup = /^(?:and\b|also\b|what about\b|how about\b|why\b|what (?:is|was|are) (?:it|that|those|the difference)\b|can you (?:explain|expand|clarify)\b)/i.test(current)
    || /\b(?:those|that figure|that amount|this number|same scenario|the former|the latter|it compare)\b/i.test(current)
    || current.split(/\s+/).length <= 5;
  const contextualQuestion = followup && lastUser?.documentId === documentId && (lastUser?.slide ?? null) === slide && typeof previous === 'string' && previous.trim() !== current
    ? previous.trim().slice(0, 2000) : null;
  return Object.freeze({ question: current, contextualQuestion, query: contextualQuestion ? `${current}\n${contextualQuestion}` : current });
}

function compile(index) {
  if (compiledIndexes.has(index)) return compiledIndexes.get(index);
  const frequency = new Map();
  const items = index.chunks.map(chunk => {
    const doc = index.documentsById.get(chunk.documentId);
    const all = tokens(`${chunk.text}\n${chunk.label}\n${chunk.label}\n${chunk.label}\n${chunk.location.sheet || ''}\n${doc.title}`);
    const tf = new Map();
    for (const term of all) tf.set(term, (tf.get(term) || 0) + 1);
    for (const term of tf.keys()) frequency.set(term, (frequency.get(term) || 0) + 1);
    return { chunk, tf, length: all.length, normalized: normalizeEvidenceText(chunk.text).toLowerCase(), label: normalizeEvidenceText(`${chunk.label} ${chunk.location.sheet || ''}`).toLowerCase() };
  });
  const result = { items, frequency, average: items.reduce((sum, item) => sum + item.length, 0) / (items.length || 1) || 1 };
  compiledIndexes.set(index, result);
  return result;
}

function queryTerms(query) {
  const weights = new Map(tokens(query).map(token => [token, 1]));
  for (const group of SYNONYMS) if (group.some(term => weights.get(term) === 1)) {
    for (const term of group) if (!weights.has(term)) weights.set(term, 0.35);
  }
  return weights;
}

function excerpt(text, terms, budget) {
  if (text.length <= budget) return text;
  const lower = text.toLowerCase();
  const positions = [...terms].filter(([, weight]) => weight === 1).map(([term]) => lower.indexOf(term)).filter(n => n >= 0);
  let start = positions.length ? Math.max(0, Math.min(...positions) - Math.floor(budget * 0.2)) : 0;
  if (start + budget > text.length) start = Math.max(0, text.length - budget);
  return text.slice(start, start + budget);
}

function limit(value, fallback, maximum) {
  if (value == null) return fallback;
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw new RetrievalError('invalid_limit', 'Invalid evidence budget.');
  return value;
}

/** Synchronous deterministic retrieval over an already validated or in-memory JSON index. */
export function retrieveEvidence(input, { question, documentId = 'all', slide = null, history = [], maxChunks = 12, maxChars = 45000, maxChunkChars = 12000 } = {}) {
  const index = validatedIndexes.has(input) ? input : validateCorpusIndex(input);
  if (typeof documentId !== 'string' || (documentId !== 'all' && !index.documentsById.has(documentId))) throw new RetrievalError('unknown_document', 'Unknown document filter.');
  const selectedDoc = index.documentsById.get(documentId);
  // A named page within a selected PDF is a strict evidence scope, not just a search hint.
  // Without this, a correct value quoted from p.1 can still violate a user's p.2-only request.
  const context = buildRetrievalQuery({ question, documentId, history, slide });
  const scopeQuestion = context.contextualQuestion ? `${context.question} ${context.contextualQuestion}` : context.question;
  const pageMatch = selectedDoc?.kind === 'pdf' && /\b(?:page|p\.)\s*([1-9]\d*)\b/i.exec(scopeQuestion);
  const pageFilter = pageMatch ? Number(pageMatch[1]) : null;
  const slideMatch = selectedDoc?.kind === 'pptx' && /\bslide\s+([1-9]\d*)\b/i.exec(context.question);
  if (slideMatch && slide != null && slide !== Number(slideMatch[1])) throw new RetrievalError('invalid_slide', 'The question and selected slide have different scopes.');
  if (slideMatch) slide = Number(slideMatch[1]);
  if (slide != null && (!Number.isSafeInteger(slide) || slide < 1 || !selectedDoc || selectedDoc.kind !== 'pptx')) throw new RetrievalError('invalid_slide', 'A slide filter requires a selected PPTX document and a positive slide number.');
  maxChunks = limit(maxChunks, 12, 12); maxChars = limit(maxChars, 45000, 45000); maxChunkChars = limit(maxChunkChars, 12000, 45000);
  const terms = queryTerms(context.query);
  const search = compile(index);
  const directTerms = [...terms].filter(([, weight]) => weight === 1).map(([term]) => term);
  const phrase = directTerms.join(' ');
  const comparative = /\b(compare|comparison|versus|vs|across|difference|differences|contrast|reconcile|both)\b/i.test(context.query);
  const financialGeography = /\b(funding|financing|capital|geograph\w*|countr\w*|regions?|markets?|base case|expansion|uae)\b/i.test(context.query);
  const genericOverview = /^(?:summari[sz]e|explain|give(?: me)? (?:an? )?overview of)\s+(?:this|the selected|selected|all|the)\s+(?:source|document|presentation|slide)s?\b/i.test(context.question);
  const requestedCells = [...context.query.matchAll(/(?<![\w$])\$?([A-Z]{1,3})\$?([1-9]\d{0,6})(?!\w)/g)].map(match => `${match[1]}${match[2]}`).filter(cell => validCell(cell) && (!/^[YW]\d+$/.test(cell) || /\b(?:cells?|ranges?)\b/i.test(context.query)));
  const requestedSheets = [...new Set(index.chunks.filter(chunk => !selectedDoc || chunk.documentId === selectedDoc.id).map(chunk => chunk.location.sheet).filter(Boolean))]
    .filter(sheet => new RegExp(`(?:^|[^\\p{L}\\p{N}])${sheet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^\\p{L}\\p{N}])`, 'iu').test(context.query));
  const ranked = [];
  for (const item of search.items) {
    const { chunk } = item;
    if (documentId !== 'all' && chunk.documentId !== documentId) continue;
    if (slide != null && chunk.location.slide !== slide) continue;
    if (pageFilter != null && chunk.location.page !== pageFilter) continue;
    // A request for an exact workbook cell cannot be answered from a PDF/PPTX
    // that merely mentions similar figures. Preserve the selected document boundary.
    if (selectedDoc && selectedDoc.kind !== 'xlsx' && /\b(?:cell|saved.*value|financial.model|worksheet|spreadsheet)\b/i.test(context.question)
        && requestedCells.some(cell => /[A-Z]{1,3}\d+/.test(cell) && !/^[YWMG]\d+$/.test(cell))) continue;
    const requestedSheet = requestedSheets.includes(chunk.location.sheet);
    const sheetOnlyScope = selectedDoc?.kind === 'xlsx' && requestedSheets.length && /\b(?:only|exclusively|just)\b/i.test(context.question);
    if (sheetOnlyScope && !requestedSheet) continue;
    const requestedCell = chunk.records?.some(record => requestedCells.includes(String(record.cell || '').replace(/\$/g, '')) && (!record.sheet || record.sheet === chunk.location.sheet));
    if (selectedDoc?.kind === 'xlsx' && requestedCells.length && (!requestedCell || (requestedSheets.length && !requestedSheet))) continue;
    let score = 0;
    for (const [term, weight] of terms) {
      const tf = item.tf.get(term) || 0;
      if (!tf) continue;
      const df = search.frequency.get(term) || 0;
      const idf = Math.log(1 + (search.items.length - df + 0.5) / (df + 0.5));
      score += weight * idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * item.length / search.average));
    }
    if (!score && genericOverview) score = 1 / (1 + Math.max(0, Number(chunk.location.page || chunk.location.slide || /\d+/.exec(chunk.location.range || '')?.[0] || 1) - 1));
    if (!score && !requestedCell && !(requestedSheet && requestedCells.length)) continue;
    if (directTerms.length > 1 && phrase && item.normalized.includes(phrase)) score += 2.5;
    for (let i = 0; i + 1 < directTerms.length; i++) {
      const pair = `${directTerms[i]} ${directTerms[i + 1]}`;
      if (item.normalized.includes(pair)) score += 0.45;
      if (item.label.includes(pair)) score += 0.7;
    }
    if (chunk.kind === 'xlsx' && /\b(control|controls|outputs?|risks?|assumptions?)\b/i.test(item.label)) score *= 1.45;
    // Honor explicit source locators: rare cell addresses should not lose to repeated
    // generic header terms in another sheet. Only real indexed cell records can earn this boost.
    if (requestedSheet) score += 5;
    if (/\b(how many|total|totals|count)\b/i.test(context.query) && requestedSheet && chunk.text.length < 1500 && /\b(?:\d+|six)\s+(?:tasks?|gates?|activities)\b/i.test(chunk.text)) score += 22;
    if (requestedCell) score += requestedSheet ? 24 : 8;
    if (chunk.kind === 'pdf' && chunk.extractionKind === 'pdf-page') score *= 1.35;
    // Decision/approval questions need the labelled unresolved cells, not only their comments.
    // The boost is evidence-driven: it applies to actual source text, not hard-coded answers.
    if (/\b(mou|agreement|agree|agreed|decisions?|capital|signed|committed|solvency)\b/i.test(context.query) && /to be agreed/i.test(chunk.text)) {
      if (chunk.records?.some((record) => typeof record.value === 'string' && /^to be agreed$/i.test(record.value))) score += 12;
      if (String(chunk.location.part || '').startsWith('comment')) score *= 0.6;
    }
    if (chunk.kind === 'xlsx' && /\bdraws?\b/i.test(item.label) && !/\bdraws?\b/i.test(context.query)) {
      const words = tokens(chunk.text);
      const numericRatio = words.filter(word => /^[-+]?\d/.test(word)).length / (words.length || 1);
      if (numericRatio > 0.4 || chunk.metadata?.rawBatch === true) score *= 0.5;
    }
    if (financialGeography && chunk.kind === 'pdf') {
      score *= 1.25;
      // Rank actual comparative source text; no scenario figures or source answers are encoded.
      if (comparative && /base case/i.test(chunk.text) && /expansion/i.test(chunk.text)) score += 5;
    }
    ranked.push({ chunk, score });
  }
  ranked.sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id, 'en'));
  // All-document comparisons reserve a relevant hit from each document before filling the budget.
  const ordered = [];
  if (documentId === 'all') {
    const seenDocs = new Set();
    for (const item of ranked) if (!seenDocs.has(item.chunk.documentId)) { ordered.push(item); seenDocs.add(item.chunk.documentId); }
  }
  if (documentId === 'all' && financialGeography) {
    const pdf = ranked.find(item => item.chunk.kind === 'pdf');
    if (pdf) {
      const previousPosition = ordered.indexOf(pdf);
      if (previousPosition >= 0) ordered.splice(previousPosition, 1);
      ordered.unshift(pdf);
    }
  }
  for (const item of ranked) if (!ordered.includes(item)) ordered.push(item);
  const chunks = [];
  const modelChunks = [];
  const scores = {};
  let charCount = 0;
  for (const item of ordered) {
    if (chunks.length === maxChunks || charCount >= maxChars) break;
    const available = Math.min(maxChunkChars, maxChars - charCount);
    if (available < 100 && chunks.length) break;
    const text = excerpt(item.chunk.text, terms, available);
    chunks.push(item.chunk);
    modelChunks.push(freeze({ id: item.chunk.id, documentId: item.chunk.documentId, documentSlug: item.chunk.documentSlug, kind: item.chunk.kind, label: item.chunk.label, location: item.chunk.location, text, excerpted: text !== item.chunk.text }));
    charCount += text.length;
    scores[item.chunk.id] = Number(item.score.toFixed(10));
  }
  return Object.freeze({
    ...context, documentId, slide, page: pageFilter, chunks: Object.freeze(chunks), modelChunks: Object.freeze(modelChunks),
    recordsById: immutableRecordsMap(chunks.map(chunk => [chunk.id, chunk])),
    documents: Object.freeze(index.documents.filter(doc => documentId === 'all' || doc.id === documentId)),
    charCount, scores: freeze(scores), totalMatches: ranked.length,
    fullOriginal: Object.freeze({ retrievedCharacters: chunks.reduce((sum, chunk) => sum + chunk.text.length, 0), projectedCharacters: charCount, records: chunks.reduce((sum, chunk) => sum + (chunk.records?.length || 0), 0), originalsTruncated: false }),
    limits: Object.freeze({ maxChunks, maxChars, maxChunkChars }),
  });
}

/** Create once at startup. In-memory tests are synchronous via retrieveEvidence; disk use reloads safely. */
export function createRetriever({ index, corpusDir = process.env.ATHAR_CORPUS_DIR, ...defaults } = {}) {
  const prepared = index ? validateCorpusIndex(index) : null;
  return Object.freeze({
    getIndex: async () => prepared || loadCorpusIndex({ corpusDir }),
    retrieve: async options => retrieveEvidence(prepared || await loadCorpusIndex({ corpusDir }), { ...defaults, ...options }),
  });
}
