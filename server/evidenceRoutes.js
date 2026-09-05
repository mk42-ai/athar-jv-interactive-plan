// Confidential evidence routes. Originals/index never enter Vite's root or a response without review access.
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadCorpusIndex, retrieveEvidence } from './retrieval.js';
import { buildEvidencePrompt, validateEvidenceAnswer, prepareModelSelection } from './evidenceAnswer.js';
import { createSourceView } from './sourceView.js';
import { evidenceCoverageGaps } from './evidenceCoverage.js';
import { createChatSession, submitQuerySync, isConfigured } from './ondemand.js';

const TTL = 6 * 3600_000;
const fail = (code, message, status = 400) => Object.assign(new Error(message), { code, status });
const safeError = (res, error) => res.status([400, 401, 403, 404, 409, 422, 429, 503].includes(error.status) ? error.status : 502).json({
  code: error.code || 'provider_unavailable',
  message: error.status === 422 ? 'The provider response could not be grounded in the retrieved evidence. Please retry or narrow the question.' :
    error.status === 503 ? 'The protected evidence or AI service is not ready. Please retry.' :
      error.status === 404 ? 'Source or conversation not found.' :
        error.status === 409 ? 'A response is already being prepared for this conversation.' :
          error.status === 429 ? 'Too many requests. Please wait before retrying.' :
            error.status === 400 ? error.message : 'The AI service could not complete this request. No substitute answer was generated.',
});

export function createEvidenceRoutes({ access, corpusDir = process.env.ATHAR_CORPUS_DIR,
  provider = { createChatSession, submitQuerySync, isConfigured }, clock = Date.now } = {}) {
  const router = express.Router();
  const conversations = new Map();
  const usage = new Map();
  const index = (force = false) => loadCorpusIndex({ corpusDir, force });
  const views = createSourceView({ corpusDir, loadIndex: index });
  function owned(req, id) {
    const value = conversations.get(id);
    if (!value || value.principal !== req.reviewer.principal || value.expiresAt <= clock()) throw fail('conversation_not_found', 'Source or conversation not found.', 404);
    return value;
  }
  const sweep = () => {
    for (const [key, v] of conversations) if (v.expiresAt <= clock()) conversations.delete(key);
    for (const [key, v] of usage) if (v.until <= clock()) usage.delete(key);
  };
  function rate(req) {
    sweep();
    const entry = usage.get(req.reviewer.principal) || { count: 0, until: clock() + 60000 };
    if (++entry.count > 20 || conversations.size > 2000) throw fail('rate_limited', 'Too many requests.', 429);
    usage.set(req.reviewer.principal, entry);
  }
  router.use(['/documents', '/citations', '/sources', '/chat'], access.requireAccess);
  router.use(['/documents', '/chat'], (req, res, next) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? next() : access.sameOrigin(req, res, next));
  router.get('/documents', async (req, res) => {
    try {
      const data = await index();
      res.json({ schemaVersion: data.schemaVersion, indexedAt: data.generatedAt, documents: data.documents.map(({ id, slug, title, kind, status, coverage, limitations }) => ({ id, slug, title, kind, status, coverage, limitations })) });
    } catch (error) { safeError(res, error); }
  });
  router.post('/documents/retry', async (req, res) => {
    try {
      rate(req);
      const data = await index(true);
      res.json({ indexedAt: data.generatedAt, documents: data.documents.map(({ id, slug, title, kind, status, coverage, limitations }) => ({ id, slug, title, kind, status, coverage, limitations })) });
    } catch (error) { safeError(res, error); }
  });
  router.get('/citations/:id', async (req, res) => {
    try {
      const data = await index();
      const source = data.recordsById.get(req.params.id);
      if (!source) throw fail('source_not_found', '', 404);
      const doc = data.documentsById.get(source.documentId);
      res.json({ id: source.id, documentId: doc.id, title: doc.title, location: source.location, label: source.label,
        excerpt: source.text, records: source.records || [], metadata: source.metadata || {},
        originalUrl: `/api/sources/${encodeURIComponent(doc.id)}`, sourceViewUrl: `/api/citations/${encodeURIComponent(source.id)}/view`, limitations: doc.limitations });
    } catch (error) { safeError(res, error); }
  });
  router.get('/citations/:id/view', async (req, res) => {
    try { res.json(await views.location(req.params.id, views.parseQuery(req.query))); }
    catch (error) { safeError(res, error); }
  });
  router.get('/sources/:id/preview', async (req, res) => {
    try { const result = await views.preview(req.params.id); res.set(result.headers).end(result.body); }
    catch (error) { safeError(res, error); }
  });
  router.get('/sources/:id', async (req, res) => {
    try {
      const data = await index();
      const doc = data.documentsById.get(req.params.id);
      if (!doc) throw fail('source_not_found', '', 404);
      const root = await fs.realpath(corpusDir);
      const file = await fs.realpath(path.resolve(root, doc.originalFile));
      if (!file.startsWith(root + path.sep)) throw fail('source_not_found', '', 404);
      const bytes = await fs.readFile(file);
      if (crypto.createHash('sha256').update(bytes).digest('hex') !== doc.sha256) throw fail('source_integrity_failed', '', 503);
      const types = { pdf: 'application/pdf', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
      res.setHeader('Content-Type', types[doc.kind] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.slug}.${doc.kind}"`);
      res.setHeader('Content-Length', bytes.length);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.end(bytes);
    } catch (error) { safeError(res, error); }
  });
  router.post('/chat/session', express.json({ limit: '2kb' }), (req, res) => {
    try {
      rate(req);
      const id = crypto.randomUUID();
      conversations.set(id, { id, principal: req.reviewer.principal, expiresAt: clock() + TTL, history: [], busy: false, upstream: null });
      res.json({ sessionId: id, createdAt: new Date(clock()).toISOString() });
    } catch (error) { safeError(res, error); }
  });
  async function answerQuestion(req, { sessionId, query, documentId = 'all', slide = null }, signal) {
    rate(req);
    const conversation = owned(req, sessionId);
    if (conversation.busy) throw fail('conversation_busy', '', 409);
    if (typeof query !== 'string' || !query.trim() || query.length > 4000) throw fail('invalid_question', 'Ask a question of up to 4,000 characters.');
    if (!provider.isConfigured()) throw fail('provider_unavailable', '', 503);
    conversation.busy = true;
    try {
      const corpus = await index();
      const retrieved = retrieveEvidence(corpus, { question: query, documentId, slide, history: conversation.history });
      const prompt = buildEvidencePrompt({ question: query, retrieved, documentId, history: conversation.history });
      // A fresh upstream session per answer prevents provider-side memory leaking facts across document filters.
      // Locally retained previous USER questions only resolve follow-up wording; prior answers are never evidence.
      const upstream = await provider.createChatSession(`athar-review-${crypto.randomUUID()}`, []);
      if (!upstream?.id) throw fail('provider_unavailable', '', 502);
      let verified;
      let lastValidation;
      for (let attempt = 0; attempt < 2; attempt++) {
        if (signal?.aborted) throw fail('cancelled', '', 400);
        const repair = attempt ? `\nThe previous response failed validation (${lastValidation?.code || 'unsupported_fact'}): ${lastValidation?.message || 'Invalid structured evidence'}. Select only PROVIDED selectionCatalog IDs, with no line numbers; do not retype quotations. Include all requested subjects and required qualifications. A different source label is not missing information: keep the exact selected source label and leave missing empty if the quantity is present. Missing entries may name an unknown topic, but may NOT add a factual correction, label, value or assertion. If a calculation cannot be supported, omit it and state only the missing topic. Return only the documented JSON object.` : '';
        const data = await provider.submitQuerySync(upstream.id, 'Answer the question contained in EVIDENCE_DATA_JSON. Return only the required grounded JSON object.', { fulfillmentPrompt: prompt + repair, temperature: 0, signal });
        try {
          const structured = prepareModelSelection(data?.answer, retrieved);
          const checked = validateEvidenceAnswer(structured, { retrieved, question: query });
          const gaps = evidenceCoverageGaps(query, retrieved, checked);
          if (gaps.length) throw fail('incomplete_evidence', `Missing requested evidence: ${gaps.join('; ')}. Select additional supplied passages rather than substituting a general comment.`, 422);
          verified = checked; break;
        } catch (error) { if (error instanceof SyntaxError) lastValidation = fail('unsupported_fact', 'Provider did not return the required JSON.', 422); else if (error.status === 422) lastValidation = error; else throw error; }
      }
      if (!verified) throw lastValidation || fail('provider_unavailable', '', 502);
      conversation.history.push({ role: 'user', content: query, documentId, slide });
      conversation.history = conversation.history.slice(-12);
      return { answer: verified.answer, citations: verified.citations, grounding: { ...verified.grounding,
        retrievedIds: retrieved.chunks.map((chunk) => chunk.id), indexVersion: corpus.extractorVersion },
        // Exact quotes/operands are returned only to this authenticated review session, never logged.
        evidence: { facts: verified.facts, calculations: verified.calculations, conflicts: verified.conflicts, missing: verified.missing },
        messageId: crypto.randomUUID(), status: 'done' };
    } finally { conversation.busy = false; }
  }
  router.post('/chat/query', express.json({ limit: '12kb' }), async (req, res) => {
    const controller = new AbortController();
    res.on('close', () => { if (!res.writableEnded) controller.abort(); });
    try {
      const started = clock();
      const result = await answerQuestion(req, req.body || {}, controller.signal);
      if (controller.signal.aborted) return;
      if (req.body.mode === 'sync') return res.json(result);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('X-Accel-Buffering', 'no');
      // Never stream unvalidated factual tokens. This is a validated final-answer SSE event.
      res.write(`data: ${JSON.stringify({ type: 'done', ...result })}\n\n`);
      res.end(`data: ${JSON.stringify({ type: 'metrics', metrics: { fulfillmentTimeSec: Number(((clock() - started) / 1000).toFixed(2)) } })}\n\n`);
    } catch (error) { if (!controller.signal.aborted) safeError(res, error); }
  });
  return { router, owned, answerQuestion };
}
