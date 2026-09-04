// Express app that fronts the On Demand APIs for the browser client.
// Mounted inside the Vite dev server (vite.config.js) and by server/index.js.
// All On Demand calls happen here, server-side, with the apikey from process.env.
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ELEVEN, RANKED_VOICES, clipKey, elevenStatus, elevenTts, isElevenConfigured } from './elevenlabs.js';
import {
  CONFIG,
  isConfigured,
  createChatSession,
  submitQuerySync,
  submitQueryStream,
  speechToText,
  textToSpeech,
  executeAvmWorkflow,
  getExecution,
  getExecutionLogs,
  getExecutionTranscript,
} from './ondemand.js';
import { buildFulfillmentPrompt, loadPlan } from './grounding.js';

// ---- tiny in-memory media store (uploaded user audio + proxied TTS clips) ----
const MEDIA_TTL_MS = 20 * 60 * 1000;
const media = new Map(); // id -> { buf, type, ts }
function putMedia(buf, type, ext) {
  const id = `${crypto.randomUUID()}.${ext}`;
  media.set(id, { buf, type, ts: Date.now() });
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
  return {
    type: 'error',
    stage,
    code: e.code || (e.status === 503 ? 'not_configured' : 'upstream_error'),
    status: e.status || 500,
    message: e.message || 'Unexpected error',
  };
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
  const base = publicBase(req);
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
      send({ type: 'avm-error', message: e.message, status: e.status || 500 });
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
        const id = putMedia(buf, 'audio/mpeg', 'mp3');
        send({ type: 'audio', index: idx, url: `/api/voice/audio/${id}`, text, bytes: buf.length, ms: Date.now() - t0 });
      } catch (e) {
        send({ type: 'tts-error', index: idx, text, message: e.message });
      }
    });
    return ttsChain;
  };

  send({ type: 'stage', stage: 'thinking', ms: Date.now() - t0 });
  const fulfillmentPrompt = buildFulfillmentPrompt({ voice: true });
  let messageId = null;
  try {
    for await (const ev of submitQueryStream(sessionId, question, { fulfillmentPrompt, signal })) {
      if (ev.type === 'delta') {
        full += ev.text;
        pending += ev.text;
        send({ type: 'delta', text: ev.text });
        const { sentences, rest } = takeSentences(pending);
        pending = rest;
        for (const s of sentences) speak(s);
      } else if (ev.type === 'done') {
        messageId = ev.messageId;
        if (ev.answer && ev.answer.length > full.length) {
          // upstream sent a fuller final answer than the deltas we saw
          const extra = ev.answer.slice(full.length);
          full = ev.answer;
          pending += extra;
          send({ type: 'delta', text: extra });
        }
      }
    }
  } catch (e) {
    if (!full) {
      send(errPayload(e, 'chat'));
      await avmPromise.catch(() => {});
      return { ok: false };
    }
    send({ type: 'warning', stage: 'chat', message: e.message });
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
  const app = express();
  app.disable('x-powered-by');

  const api = express.Router();

  // Cache policy for narration assets: the manifest must never be cached (it names the current clips);
  // clip files are content-hashed, so they can be cached forever — a regenerated clip gets a new name.
  app.use('/guide-audio', (req, res, next) => {
    if (/manifest\.json$/.test(req.path)) res.setHeader('Cache-Control', 'no-store, must-revalidate');
    else if (/\.mp3$/.test(req.path)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    next();
  });


  api.get('/health', (req, res) => {
    const plan = loadPlan();
    res.json({
      ok: true,
      configured: isConfigured(),
      endpointId: CONFIG.endpointId,
      avmWorkflowId: CONFIG.avmWorkflowId,
      ttsVoice: CONFIG.ttsVoice,
      publicBase: publicBase(req),
      plan: { months: plan.months.length, activities: plan.activities.length, source: plan.meta.source_file },
      time: new Date().toISOString(),
    });
  });

  // ---- Chat ----------------------------------------------------------------
  api.post('/chat/session', express.json(), async (req, res) => {
    try {
      const externalUserId = String(req.body?.externalUserId || `athar-web-${crypto.randomUUID()}`).slice(0, 120);
      const data = await createChatSession(externalUserId, []);
      res.json({ sessionId: data.id, externalUserId: data.externalUserId, createdAt: data.createdAt });
    } catch (e) {
      res.status(e.status || 500).json(errPayload(e, 'session'));
    }
  });

  api.post('/chat/query', express.json({ limit: '64kb' }), async (req, res) => {
    const { sessionId, query, mode = 'stream', voice = false } = req.body || {};
    if (!sessionId || !query || typeof query !== 'string') {
      return res.status(400).json({ type: 'error', code: 'bad_request', message: 'sessionId and query are required' });
    }
    const fulfillmentPrompt = buildFulfillmentPrompt({ voice: Boolean(voice) });
    if (mode === 'sync') {
      try {
        const data = await submitQuerySync(sessionId, query.slice(0, 4000), { fulfillmentPrompt });
        return res.json({ answer: data.answer, messageId: data.messageId, status: data.status });
      } catch (e) {
        return res.status(e.status || 500).json(errPayload(e, 'chat'));
      }
    }
    const { send, end } = sse(res);
    const ac = new AbortController();
    res.on('close', () => { if (!res.writableEnded) ac.abort(); });
    try {
      for await (const ev of submitQueryStream(sessionId, query.slice(0, 4000), { fulfillmentPrompt, signal: ac.signal })) {
        send(ev);
      }
    } catch (e) {
      send(errPayload(e, 'chat'));
    } finally {
      end();
    }
  });

  // ---- Voice -----------------------------------------------------------------
  // Serves uploaded user audio (fetched by On Demand's speech_to_text) and
  // proxied TTS clips (same-origin so the browser can visualise playback).
  api.get('/voice/audio/:id', (req, res) => {
    const item = media.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
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
        const id = putMedia(buf, ctype, ext);
        const audioUrl = `${publicBase(req)}/api/voice/audio/${id}`;
        send({ type: 'stage', stage: 'transcribing', bytes: buf.length, audioUrl, ms: Date.now() - t0 });
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
        await runVoiceTurn({ req, send, question: text, sessionId, externalUserId, signal: ac.signal, meta: { input: 'audio', audioUrl } });
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
      const id = putMedia(buf, 'audio/mpeg', 'mp3');
      res.json({ url: `/api/voice/audio/${id}`, bytes: buf.length });
    } catch (e) {
      res.status(e.status || 500).json(errPayload(e, 'tts'));
    }
  });

  // ---- Guide Mode narration -------------------------------------------------------------
  // Provider order: ElevenLabs (ELEVENLABS_API_KEY, server-side only) → On Demand Services API
  // (ON_DEMAND_API_KEY, fallback). Clips pre-baked into public/guide-audio/ (see
  // scripts/prebake-guide-audio.mjs) are served first: zero quota use, identical voice for every
  // visitor, works anonymously. Every request logs provider/model/voice/source on the server.
  const guideClips = new Map(); // clip key -> { id, meta }
  let prebaked; // manifest.json -> { clips: { key: { file, provider, model, voice, ... } } }
  function loadPrebaked() {
    if (prebaked !== undefined) return prebaked;
    prebaked = null;
    for (const dir of ['public', 'dist']) {
      try {
        const p = path.join(process.cwd(), dir, 'guide-audio', 'manifest.json');
        if (fs.existsSync(p)) {
          prebaked = JSON.parse(fs.readFileSync(p, 'utf8'));
          break;
        }
      } catch (e) {
        console.warn('[guide-tts] could not read prebaked manifest:', e.message);
      }
    }
    return prebaked;
  }
  const guideProvider = () => (isElevenConfigured() ? 'elevenlabs' : isConfigured() ? 'ondemand' : null);
  const elevenLabel = (model = ELEVEN.model) => `ElevenLabs · ${ELEVEN.voiceName} · ${model}`;
  const ondemandLabel = () => `On Demand voice · ${CONFIG.guideVoice[0].toUpperCase()}${CONFIG.guideVoice.slice(1)}`;
  let quotaCache = { t: 0, v: null };

  api.get('/guide/voice', async (req, res) => {
    const manifest = loadPrebaked();
    let quota = null;
    if (isElevenConfigured()) {
      if (Date.now() - quotaCache.t > 60_000) {
        try {
          quotaCache = { t: Date.now(), v: await elevenStatus() };
        } catch (e) {
          quotaCache = { t: Date.now(), v: { error: e.message } };
        }
      }
      quota = quotaCache.v;
    }
    res.json({
      provider: guideProvider(),
      configured: Boolean(guideProvider()),
      voice: isElevenConfigured() ? ELEVEN.voiceName : CONFIG.guideVoice,
      voiceId: isElevenConfigured() ? ELEVEN.voiceId : undefined,
      model: isElevenConfigured() ? ELEVEN.model : CONFIG.guideModel,
      fallbackModel: isElevenConfigured() ? ELEVEN.fallbackModel : CONFIG.guideFallbackModel,
      settings: isElevenConfigured() ? ELEVEN.settings : { speed: CONFIG.guideSpeed, instructions: CONFIG.guideInstructions },
      label: isElevenConfigured() ? elevenLabel() : ondemandLabel(),
      prebakedClips: manifest ? Object.keys(manifest.clips || {}).length : 0,
      prebakedFor: manifest ? { version: manifest.version, provider: manifest.provider, model: manifest.model, voice: manifest.voice, voiceId: manifest.voiceId, settings: manifest.settings, generatedAt: manifest.generatedAt } : null,
      playback: manifest && Object.keys(manifest.clips || {}).length ? 'prebaked-verified-clips (key-independent)' : guideProvider() ? `live:${guideProvider()}` : 'none',
      fallback: isElevenConfigured() ? { provider: isConfigured() ? 'ondemand' : null, voice: CONFIG.guideVoice, model: CONFIG.guideModel } : null,
      shortlist: RANKED_VOICES.map((v) => ({ name: v.name, usable: !v.library, reason: v.library ? 'library voice — HTTP 402 paid_plan_required on this plan' : 'premade — usable' })),
      quota,
    });
  });

  api.post('/guide/tts', express.json({ limit: '32kb' }), async (req, res) => {
    const t0 = Date.now();
    try {
      const text = String(req.body?.text || '').trim().slice(0, 1500);
      const id = String(req.body?.id || '').slice(0, 64);
      if (!text) return res.status(400).json({ error: 'text is required' });

      const done = (payload) => {
        console.log(`[guide-tts] ${new Date().toISOString()} moment=${id || '-'} provider=${payload.provider} model=${payload.model} voice=${payload.voice} source=${payload.source} file=${payload.file || '-'} chars=${text.length} ms=${Date.now() - t0}`);
        res.json(payload);
      };

      // 0) Pre-baked, integrity-hashed ElevenLabs clip — served FIRST and INDEPENDENTLY of any API key,
      //    so a restart without ELEVENLABS_API_KEY can never silently switch the voice.
      const manifest = loadPrebaked();
      const textSha = crypto.createHash('sha256').update(text).digest('hex');
      const pre = manifest?.clips?.[id] || Object.values(manifest?.clips || {}).find((c) => c.textSha256 === textSha);
      if (pre && (!pre.textSha256 || pre.textSha256 === textSha)) {
        return done({ url: `/guide-audio/${pre.file}`, file: pre.file, sha256: pre.sha256, provider: manifest.provider || 'elevenlabs', model: pre.model || manifest.model, voice: pre.voice || manifest.voice, voiceId: pre.voiceId || manifest.voiceId, label: `ElevenLabs · ${pre.voice || manifest.voice} · ${pre.model || manifest.model}`, source: 'prebaked', settings: pre.settings || manifest.settings });
      }

      const provider = guideProvider();
      if (!provider) return res.status(503).json({ error: 'not_configured', message: 'No pre-baked clip for this moment and no TTS key configured on the server' });

      // 1) ElevenLabs live — memory cache → primary model → fallback model
      if (provider === 'elevenlabs') {
        const key = clipKey(crypto, text);
        const cached = guideClips.get(key);
        if (cached && media.has(cached.id)) return done({ ...cached.meta, url: `/api/voice/audio/${cached.id}`, source: 'cache' });
        let buf = null;
        let model = ELEVEN.model;
        let lastErr = null;
        for (const m of [ELEVEN.model, ELEVEN.fallbackModel]) {
          try {
            buf = await elevenTts(text, { model: m });
            model = m;
            break;
          } catch (e) {
            lastErr = e;
            console.warn(`[guide-tts] elevenlabs ${m} failed: ${e.message}`);
            if (['quota_exceeded', 'paid_plan_required', 'invalid_api_key', 'unauthorized'].includes(e.code) || e.status === 401) break; // no point retrying another model
          }
        }
        if (buf) {
          const id2 = putMedia(buf, 'audio/mpeg', 'mp3');
          media.get(id2).ts = Date.now() + 6 * 3600 * 1000;
          const meta = { provider: 'elevenlabs', model, voice: ELEVEN.voiceName, voiceId: ELEVEN.voiceId, label: elevenLabel(model), settings: ELEVEN.settings, sha256: crypto.createHash('sha256').update(buf).digest('hex'), file: id2 };
          guideClips.set(key, { id: id2, meta });
          return done({ ...meta, url: `/api/voice/audio/${id2}`, source: 'live' });
        }
        if (!isConfigured()) throw lastErr || new Error('elevenlabs failed');
        console.warn(`[guide-tts] ElevenLabs hard-failed (${lastErr?.message}) — falling back to On Demand (${CONFIG.guideVoice})`);
      }

      // 2) On Demand Services API (fallback, or primary when no ElevenLabs key is set)
      const odKey = crypto.createHash('sha1').update(`ondemand|${CONFIG.guideModel}|${CONFIG.guideVoice}|${CONFIG.guideSpeed}|${CONFIG.guideInstructions}|${text}`).digest('hex');
      const odCached = guideClips.get(odKey);
      if (odCached && media.has(odCached.id)) return done({ ...odCached.meta, url: `/api/voice/audio/${odCached.id}`, source: 'cache' });
      const opts = { voice: CONFIG.guideVoice, speed: CONFIG.guideSpeed, instructions: CONFIG.guideInstructions };
      let remote;
      let model = CONFIG.guideModel;
      try {
        remote = await textToSpeech(text, { ...opts, model });
      } catch (e) {
        console.warn(`[guide-tts] ${model} failed (${e.message}) — falling back to ${CONFIG.guideFallbackModel}`);
        model = CONFIG.guideFallbackModel;
        remote = await textToSpeech(text, { ...opts, model });
      }
      if (!remote) throw Object.assign(new Error('text_to_speech returned no audioUrl'), { status: 502 });
      const r = await fetch(remote, { signal: withTimeout(30000) });
      if (!r.ok) throw Object.assign(new Error(`audio fetch ${r.status}`), { status: 502 });
      const buf = Buffer.from(await r.arrayBuffer());
      const odId = putMedia(buf, 'audio/mpeg', 'mp3');
      media.get(odId).ts = Date.now() + 6 * 3600 * 1000;
      const meta = { provider: 'ondemand', model, voice: CONFIG.guideVoice, label: ondemandLabel(), settings: { speed: CONFIG.guideSpeed }, file: odId };
      guideClips.set(odKey, { id: odId, meta });
      return done({ ...meta, url: `/api/voice/audio/${odId}`, source: 'live' });
    } catch (e) {
      console.error(`[guide-tts] error: ${e.message}`);
      res.status(e.status || 500).json(errPayload(e, 'guide-tts'));
    }
  });

  api.post('/voice/stt', express.json({ limit: '8kb' }), async (req, res) => {
    try {
      const audioUrl = String(req.body?.audioUrl || '');
      if (!/^https?:\/\//.test(audioUrl)) return res.status(400).json({ error: 'audioUrl is required' });
      res.json({ text: await speechToText(audioUrl) });
    } catch (e) {
      res.status(e.status || 500).json(errPayload(e, 'stt'));
    }
  });

  api.post('/voice/avm', express.json({ limit: '32kb' }), async (req, res) => {
    try {
      const payload = req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : {};
      const executionId = await executeAvmWorkflow({ source: 'athar-jv-web-avm', ts: new Date().toISOString(), ...payload });
      res.json({ executionId, workflowId: CONFIG.avmWorkflowId });
    } catch (e) {
      res.status(e.status || 500).json(errPayload(e, 'avm'));
    }
  });

  api.get('/voice/execution/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const [execution, logs, transcript] = await Promise.all([
        getExecution(id),
        req.query.logs === '1' ? getExecutionLogs(id).catch(() => []) : Promise.resolve(undefined),
        req.query.transcript === '1' ? getExecutionTranscript(id).catch(() => null) : Promise.resolve(undefined),
      ]);
      res.json({ execution, logs, transcript });
    } catch (e) {
      res.status(e.status || 500).json(errPayload(e, 'execution'));
    }
  });

  app.use('/api', api);
  app.use('/api', (req, res) => res.status(404).json({ error: `No route ${req.method} /api${req.path}` }));
  return app;
}
