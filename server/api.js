// Express app that fronts the On Demand APIs for the browser client.
// Mounted inside the Vite dev server (vite.config.js) and by server/index.js.
// All On Demand calls happen here, server-side, with the apikey from process.env.
import express from 'express';
import crypto from 'node:crypto';
import { getGuideSteps, getPresentationData, getAudioManifest } from './presentationStore.js';
import { createAccessControl } from './access.js';
import { createEvidenceRoutes } from './evidenceRoutes.js';
import {
  CONFIG,
  isConfigured,
  probeOnDemand,
  speechToText,
  textToSpeech,
  executeAvmWorkflow,
  getExecution,
} from './ondemand.js';
import { loadDotEnv, onDemandKey } from './env.js';
import { clipStatus, serveEmbedded, loadEmbeddedAudio } from './guideAudioStore.js';
import { registrySummary } from './documentRegistry.js';
import { presentationAccess, presentationMode } from './privatePresentation.js';
import { loadCorpusIndex } from './retrieval.js';

// ---- tiny in-memory media store (uploaded user audio + proxied TTS clips) ----
const MEDIA_TTL_MS = 20 * 60 * 1000;
const media = new Map(); // id -> { buf, type, ts }
function putMedia(buf, type, ext, owner = null) {
  const id = `${crypto.randomUUID()}.${ext}`;
  media.set(id, { buf, type, ts: Date.now(), owner });
  if (media.size > 400) {
    for (const [k, v] of media) if (Date.now() - v.ts > MEDIA_TTL_MS) media.delete(k);
  }
  return id;
}
setInterval(() => {
  for (const [k, v] of media) if (Date.now() - v.ts > MEDIA_TTL_MS) media.delete(k);
}, 60 * 1000).unref?.();

function publicBase(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  return `${proto}://${host}`;
}

function sse(res) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  const send = (ev) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(ev)}\n\n`);
  };
  const ping = setInterval(() => {
    if (!res.writableEnded) res.write(': ping\n\n');
  }, 10000);
  const end = () => {
    clearInterval(ping);
    if (!res.writableEnded) res.end();
  };
  return { send, end };
}

function errPayload(e, stage) {
  return { type: 'error', stage, code: e.status === 503 ? 'not_configured' : 'service_error',
    status: e.status || 502, message: 'The service could not complete this request. Please retry.' };
}

const withTimeout = (ms) => (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined);

// ---- sentence chunker for progressive TTS -----------------------------------
function takeSentences(pending, { minChars = 40, hardMax = 260 } = {}) {
  const out = [];
  let rest = pending;
  for (;;) {
    const m = /([.!?؟。]+["')\]]?)(\s+|$)/.exec(rest);
    if (m && m.index + m[0].length <= rest.length) {
      const cut = m.index + m[1].length;
      const sentence = rest.slice(0, cut).trim();
      const remainder = rest.slice(cut);
      if (sentence.length >= minChars || remainder.trim().length > 0) {
        if (sentence) out.push(sentence);
        rest = remainder.replace(/^\s+/, '');
        continue;
      }
    }
    if (rest.length > hardMax) {
      const sp = rest.lastIndexOf(' ', hardMax);
      const cut = sp > minChars ? sp : hardMax;
      out.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).replace(/^\s+/, '');
      continue;
    }
    break;
  }
  return { sentences: out.filter(Boolean), rest };
}

// ---- the voice turn pipeline ---------------------------------------------------
// transcript → (AVM workflow execute, in parallel) → grounded Chat API stream →
// sentence-chunked TTS → same-origin audio URLs the browser can visualise.
async function runVoiceTurn({ req, send, question, sessionId, externalUserId, signal, meta = {} }) {
  req.evidenceService.owned(req, sessionId);
  const t0 = Date.now();

  // 1) Register the turn on the Advanced Voice Mode workflow (does not block the answer).
  const avmPromise = (async () => {
    try {
      const executionId = await executeAvmWorkflow({
        question,
        sessionId,
        externalUserId,
        source: 'athar-jv-web-avm',
        mode: 'voice',
        ts: new Date().toISOString(),
        ...meta,
      });
      send({ type: 'avm', executionId, workflowId: CONFIG.avmWorkflowId, ms: Date.now() - t0 });
      if (!executionId) return;
      const deadline = Date.now() + 10000;
      let status = null;
      while (Date.now() < deadline) {
        const ex = await getExecution(executionId);
        status = ex?.status;
        if (status === 'success' || status === 'failed') {
          send({ type: 'avm-status', executionId, status, timeTakenMs: ex.timeTakenInMilliseconds ?? null });
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      send({ type: 'avm-status', executionId, status: status || 'executing', timedOut: true });
    } catch (e) {
      send({ type: 'avm-error', message: 'Voice workflow unavailable.', status: e.status || 500 });
    }
  })();

  // 2) Grounded answer from the Chat API (streamed) + progressive TTS.
  let pending = '';
  let full = '';
  let chunkIndex = 0;
  let ttsChain = Promise.resolve();
  const speak = (text) => {
    const idx = chunkIndex++;
    ttsChain = ttsChain.then(async () => {
      if (signal?.aborted) return;
      try {
        const remote = await textToSpeech(text);
        const r = await fetch(remote, { signal: withTimeout(30000) });
        if (!r.ok) throw new Error(`audio fetch ${r.status}`);
        const buf = Buffer.from(await r.arrayBuffer());
        const id = putMedia(buf, 'audio/mpeg', 'mp3', req.reviewer?.principal);
        send({ type: 'audio', index: idx, url: `/api/voice/audio/${id}`, text, bytes: buf.length, ms: Date.now() - t0 });
      } catch (e) {
        send({ type: 'tts-error', index: idx, message: 'Speech generation unavailable.' });
      }
    });
    return ttsChain;
  };

  send({ type: 'stage', stage: 'thinking', ms: Date.now() - t0 });
  let messageId = null;
  try {
    const result = await req.evidenceService.answerQuestion(req, { sessionId, query: question, documentId: 'all' }, signal);
    messageId = result.messageId;
    // Speak only already-validated source facts; detailed citations remain in the text companion.
    full = result.evidence.facts.slice(0, 4).map((fact) => fact.text).join(' ');
    if (result.evidence.missing.length) full += ' ' + result.evidence.missing.join(' ');
    if (!full.trim()) full = 'The selected evidence does not support an answer to this question.';
    pending = full;
    send({ type: 'delta', text: full });
    const { sentences, rest } = takeSentences(pending);
    pending = rest;
    for (const sentence of sentences) speak(sentence);
  } catch (error) {
    send({ type: 'error', stage: 'chat', code: error.code || 'provider_unavailable', message: 'The evidence-grounded answer could not be prepared. No substitute was generated.' });
    await avmPromise.catch(() => {});
    return { ok: false };
  }
  const tail = pending.trim();
  if (tail) speak(tail);
  if (!full.trim()) {
    send({ type: 'error', stage: 'chat', code: 'empty_answer', message: 'The assistant returned an empty answer. Please try again.' });
  } else {
    send({ type: 'answer', text: full, messageId, ms: Date.now() - t0 });
  }
  await ttsChain;
  send({ type: 'audio-complete', chunks: chunkIndex, ms: Date.now() - t0 });
  await avmPromise.catch(() => {});
  return { ok: true, answer: full };
}

export function createApiApp() {
  // Secrets: process.env first, then the git-ignored .env (server-side only — never bundled for the client).
  loadDotEnv();
  const odKey = onDemandKey();
  console.log(`[services] AI configured: ${Boolean(odKey)}; pre-baked narration is key-independent`);
  const store = loadEmbeddedAudio();
  console.log(`[guide-audio] embedded store: ${store.files.size} clips${store.manifest ? ` (${store.manifest.voice} / ${store.manifest.model}, v${store.manifest.version})` : ''}`);


  const app = express();
  app.disable('x-powered-by');

  const api = express.Router();
  const access = createAccessControl();
  const evidence = createEvidenceRoutes({ access });
  // Frame policy. The review workspace is opened inside embedded preview panels (cross-origin iframes),
  // where the former `X-Frame-Options: SAMEORIGIN` made browsers render "refused to connect". X-Frame-Options
  // has no allow-list form, so the modern CSP `frame-ancestors` directive replaces it: `*` by default
  // (any embedder), or a space-separated allow-list via ATHAR_FRAME_ANCESTORS (e.g. "'self' https://app.example").
  // Clickjacking exposure is bounded because every confidential route still requires the reviewer session.
  const frameAncestors = String(process.env.ATHAR_FRAME_ANCESTORS || '*').trim() || '*';
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', `frame-ancestors ${frameAncestors}`);
    next();
  });
  api.use('/access', access.router);
  // Presentation payloads are not embedded in Git/client bundles; they are served from the private store.
  // Public mode (default) serves them to anyone with the URL; private mode requires the reviewer session.
  api.get('/presentation', presentationAccess(access), (req, res) => {
    try { res.set('Cache-Control', 'private, no-store').json(getPresentationData()); }
    catch { res.status(503).json({ code: 'presentation_unavailable', message: 'The protected presentation is unavailable. Ask the owner to restore the presentation store.' }); }
  });
  api.use(['/guide', '/guide-audio'], presentationAccess(access));
  api.use(evidence.router);
  // Every user-generated voice/chat operation is authorized; the narrated public deck is unchanged.
  api.use('/voice', (req, res, next) => {
    const id = req.path.startsWith('/audio/') ? req.path.slice(7) : null;
    if (req.method === 'GET' && id && access.validMediaCapability(id, req.query.expires, req.query.cap)) return next();
    return access.requireAccess(req, res, next);
  });
  api.use('/voice', (req, res, next) => ['GET', 'HEAD'].includes(req.method) ? next() : access.sameOrigin(req, res, next));
  api.use('/voice', (req, res, next) => { req.evidenceService = evidence; req.reviewAccess = access; next(); });

  api.get('/health', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const body = { ok: true, configured: isConfigured(), build: process.env.ATHAR_BUILD_SHA || 'workspace',
      checkedAt: new Date().toISOString(), reviewAccessConfigured: access.configured, presentationMode: presentationMode(),
      // No key fragments, provider session identifiers, secret paths, or confidential metadata.
      narration: { provider: 'elevenlabs', voice: 'River', playback: 'verified-prebaked' },
      chatApi: { host: 'https://api.on-demand.io', createSession: 'POST /chat/v1/sessions', submitQuery: 'POST /chat/v1/sessions/{sessionId}/query', responseMode: 'sync', endpointId: CONFIG.endpointId, authHeader: 'apikey', docsVerified: '2026-09-05' } };
    // Reviewer-only live probe: proves the server-side key is loaded AND accepted upstream
    // (session create + read). Never returns the key or an upstream session identifier.
    if (req.query.probe === '1' && access.read(req)) {
      const { sessionId, ...probe } = await probeOnDemand({ force: req.query.force === '1' });
      body.keyProbe = probe;
      try { body.documents = registrySummary((await loadCorpusIndex({ corpusDir: process.env.ATHAR_CORPUS_DIR })).documents); }
      catch { body.documents = { ...registrySummary([]), corpus: 'unavailable' }; }
    }
    res.json(body);
  });

  // ---- Voice -----------------------------------------------------------------
  // Serves uploaded user audio (fetched by On Demand's speech_to_text) and
  // proxied TTS clips (same-origin so the browser can visualise playback).
  api.get('/voice/audio/:id', (req, res) => {
    const item = media.get(req.params.id);
    if (!item || (req.reviewer && item.owner && item.owner !== req.reviewer.principal)) return res.status(404).json({ error: 'not found' });
    res.setHeader('Content-Type', item.type);
    res.setHeader('Content-Length', item.buf.length);
    res.setHeader('Cache-Control', 'private, max-age=600');
    res.setHeader('Accept-Ranges', 'bytes');
    res.end(item.buf);
  });

  // Full voice turn from recorded audio (raw body: audio/wav | audio/webm | audio/mp4).
  api.post(
    '/voice/turn',
    express.raw({ type: ['audio/*', 'application/octet-stream'], limit: '30mb' }),
    async (req, res) => {
      const sessionId = String(req.query.sessionId || '');
      const externalUserId = String(req.query.externalUserId || 'athar-web-voice');
      const { send, end } = sse(res);
      const ac = new AbortController();
      res.on('close', () => { if (!res.writableEnded) ac.abort(); });
      const t0 = Date.now();
      try {
        if (!sessionId) throw Object.assign(new Error('sessionId query parameter is required'), { status: 400, code: 'bad_request' });
        const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
        if (buf.length < 800) throw Object.assign(new Error('No audio received — the recording was empty.'), { status: 400, code: 'empty_audio' });
        const ctype = String(req.headers['content-type'] || 'audio/wav').split(';')[0];
        const ext = ctype.includes('wav') ? 'wav' : ctype.includes('mp4') || ctype.includes('m4a') ? 'm4a' : ctype.includes('mpeg') ? 'mp3' : ctype.includes('ogg') ? 'ogg' : 'webm';
        const id = putMedia(buf, ctype, ext, req.reviewer?.principal);
        const capability = access.mediaCapability(id);
        const audioUrl = `${publicBase(req)}/api/voice/audio/${id}?${new URLSearchParams(capability)}`;
        send({ type: 'stage', stage: 'transcribing', bytes: buf.length, ms: Date.now() - t0 });
        let text = '';
        try {
          text = (await speechToText(audioUrl)).trim();
        } catch (e) {
          send(errPayload(e, 'stt'));
          return end();
        }
        send({ type: 'transcript', text, ms: Date.now() - t0 });
        if (!text || text.replace(/[^\p{L}\p{N}]/gu, '').length < 2) {
          send({ type: 'error', stage: 'stt', code: 'empty_transcript', message: "I didn't catch that — please try speaking again." });
          return end();
        }
        await runVoiceTurn({ req, send, question: text, sessionId, externalUserId, signal: ac.signal, meta: { input: 'audio' } });
      } catch (e) {
        send(errPayload(e, 'turn'));
      } finally {
        send({ type: 'done', ms: Date.now() - t0 });
        end();
      }
    }
  );

  // Typed fallback for the voice tab (same pipeline minus speech_to_text).
  api.post('/voice/text-turn', express.json({ limit: '32kb' }), async (req, res) => {
    const { sessionId, text, externalUserId = 'athar-web-voice' } = req.body || {};
    const { send, end } = sse(res);
    const ac = new AbortController();
    res.on('close', () => { if (!res.writableEnded) ac.abort(); });
    const t0 = Date.now();
    try {
      if (!sessionId || !text) throw Object.assign(new Error('sessionId and text are required'), { status: 400, code: 'bad_request' });
      send({ type: 'transcript', text: String(text).slice(0, 2000), ms: 0 });
      await runVoiceTurn({ req, send, question: String(text).slice(0, 2000), sessionId, externalUserId, signal: ac.signal, meta: { input: 'text' } });
    } catch (e) {
      send(errPayload(e, 'turn'));
    } finally {
      send({ type: 'done', ms: Date.now() - t0 });
      end();
    }
  });

  api.post('/voice/tts', express.json({ limit: '32kb' }), async (req, res) => {
    try {
      const text = String(req.body?.text || '').slice(0, 1500);
      if (!text) return res.status(400).json({ error: 'text is required' });
      const remote = await textToSpeech(text, { voice: req.body?.voice });
      const r = await fetch(remote, { signal: withTimeout(30000) });
      const buf = Buffer.from(await r.arrayBuffer());
      const id = putMedia(buf, 'audio/mpeg', 'mp3', req.reviewer?.principal);
      res.json({ url: `/api/voice/audio/${id}`, bytes: buf.length });
    } catch (e) {
      res.status(e.status || 500).json(errPayload(e, 'tts'));
    }
  });

  // Verified prerecorded audio comes only from the protected host store, never public files.
  const loadPrebaked = () => { try { return getAudioManifest(); } catch { return null; } };
  api.get('/guide-audio/:file', (req, res) => {
    const file = String(req.params.file || '');
    if (!file || file.includes('/') || file.includes('..')) return res.status(400).json({ error: 'bad file' });
    if (serveEmbedded(req, res, file)) return;
    res.status(404).json({ error: 'clip not found' });
  });

  api.get('/guide/config', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try { res.json({ moments: getGuideSteps().map(({ id, slide, boxes }) => ({ id, slide, boxes })) }); }
    catch { res.status(503).json({ code: 'presentation_unavailable' }); }
  });

  api.get('/guide/voice', (req, res) => {
    const manifest = loadPrebaked();
    res.json({ provider: manifest?.provider || 'elevenlabs', voice: manifest?.voice || 'River',
      model: manifest?.model, playback: 'verified-prebaked', configured: Boolean(manifest),
      prebakedClips: Object.keys(manifest?.clips || {}).length });
  });

  api.post('/guide/tts', express.json({ limit: '32kb' }), async (req, res) => {
    const t0 = Date.now();
    try {
      const text = String(req.body?.text || '').trim().slice(0, 1500);
      const id = String(req.body?.id || '').slice(0, 64);
      if (!text) return res.status(400).json({ error: 'text is required' });

      const done = (payload) => {
        res.json(payload);
      };

      // 0) Pre-baked, integrity-hashed ElevenLabs clip — served FIRST and INDEPENDENTLY of any API key,
      //    so a restart without ELEVENLABS_API_KEY can never silently switch the voice.
      const manifest = loadPrebaked();
      const textSha = crypto.createHash('sha256').update(text).digest('hex');
      const pre = manifest?.clips?.[id] || Object.values(manifest?.clips || {}).find((c) => c.textSha256 === textSha);
      const status = pre ? clipStatus(pre.file, { expectedSha256: pre.sha256 }) : null;
      if (pre && (!pre.textSha256 || pre.textSha256 === textSha) && status?.ok) {
        return done({ url: `${status.source === 'embedded' ? '/api/guide-audio/' : '/guide-audio/'}${pre.file}`, file: pre.file, sha256: pre.sha256, servedFrom: status.source, provider: manifest.provider || 'elevenlabs', model: pre.model || manifest.model, voice: pre.voice || manifest.voice, voiceId: pre.voiceId || manifest.voiceId, label: `ElevenLabs · ${pre.voice || manifest.voice} · ${pre.model || manifest.model}`, source: 'prebaked', settings: pre.settings || manifest.settings });
      }

      return res.status(503).json({ code: 'verified_clip_unavailable', message: 'A verified narration clip is unavailable. Retry after the source has been restored.' });
    } catch (e) {
      res.status(e.status || 500).json(errPayload(e, 'guide-tts'));
    }
  });

  // Legacy diagnostic endpoints accepted arbitrary upstream identifiers/URLs. They are not used by
  // the turn pipeline; keep them closed rather than expose another reviewer's executions or media.
  api.all(['/voice/stt', '/voice/avm', '/voice/execution/:id'], (req, res) =>
    res.status(403).json({ code: 'diagnostic_disabled', message: 'Diagnostic access is restricted to the server operator.' }));

  app.locals.reviewAccess = access;
  app.use('/api', api);
  app.use('/api', (req, res) => res.status(404).json({ error: `No route ${req.method} /api${req.path}` }));
  return app;
}
