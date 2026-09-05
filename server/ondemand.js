// Server-side On Demand client. Endpoints/shapes follow the live public API docs
// (Chat API, Services API, Agents Flow Builder) verified on 2026-09-03.
// The apikey is read from the environment ONLY — never sent to the browser.

import { onDemandKey, onDemandKeySource } from './env.js';

const API = process.env.ON_DEMAND_API_HOST || 'https://api.on-demand.io';
const SERVICES = `${API}/services/v1/public/service`;
const AUTOMATION = `${API}/automation/api`;

export const CONFIG = {
  endpointId: process.env.OD_ENDPOINT_ID || 'predefined-openai-gpt4o',
  avmWorkflowId: process.env.AVM_WORKFLOW_ID || '6a97acf9b44c27163d2b211c', // "Sovereign Q&A Voice Assistant - Opus 5 (API-triggered)"
  ttsVoice: process.env.OD_TTS_VOICE || 'nova',
  ttsModel: process.env.OD_TTS_MODEL || 'tts-1',
  // Guide Mode narrator — natural, soft-spoken American female. gpt-4o-mini-tts honours delivery
  // instructions (tone/pace); tts-1-hd + nova is the automatic fallback if that model is rejected.
  guideVoice: process.env.OD_GUIDE_VOICE || 'nova',
  guideModel: process.env.OD_GUIDE_MODEL || 'gpt-4o-mini-tts',
  guideFallbackModel: process.env.OD_GUIDE_FALLBACK_MODEL || 'tts-1-hd',
  guideSpeed: Number(process.env.OD_GUIDE_SPEED || 0.92),
  guideInstructions:
    process.env.OD_GUIDE_INSTRUCTIONS ||
    'Soft-spoken, warm and calm American female presenter guiding an executive through a slide deck. Unhurried, human pace with gentle intonation; natural short pauses at commas and slightly longer pauses at full stops; emphasise numbers and dates clearly. Never robotic or salesy.',
};

export function isConfigured() {
  return Boolean(onDemandKey()); // ON_DEMAND_API_KEY or ONDEMAND_API_KEY, from process.env / .env / env.local
}

function headers(extra = {}) {
  const key = onDemandKey();
  if (!key) {
    const err = new Error('Server is missing ON_DEMAND_API_KEY (or ONDEMAND_API_KEY)');
    err.status = 503;
    err.code = 'not_configured';
    throw err;
  }
  return { apikey: key, 'Content-Type': 'application/json', ...extra };
}

async function asJson(res, what) {
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(body?.message || body?.errorCode || `${what} failed (${res.status})`);
    err.status = res.status;
    err.upstream = body;
    throw err;
  }
  return body;
}

// ---- Runtime key probe (health) ------------------------------------------
// Confirms the server-side ON_DEMAND_API_KEY is loaded AND accepted by the platform by creating a
// throw-away chat session (cheapest authenticated call). Never returns the key itself.
let lastProbe = null;
export async function probeOnDemand({ force = false } = {}) {
  const checkedAt = new Date().toISOString();
  if (!isConfigured()) return { ok: false, keyInstalled: false, keyLoaded: false, sessionCreated: false, checkedAt, error: 'ON_DEMAND_API_KEY / ONDEMAND_API_KEY not set' };
  if (!force && lastProbe && Date.now() - lastProbe.t < 5 * 60_000) return { ...lastProbe.result, cached: true };
  const t0 = Date.now();
  let result;
  try {
    // 1) authenticated write: create a throw-away chat session (201) …
    const createRes = await fetch(`${API}/chat/v1/sessions`, { method: 'POST', headers: headers(), body: JSON.stringify({ externalUserId: `athar-health-probe-${Date.now()}`, pluginIds: [] }) });
    const createStatus = createRes.status;
    const created = await asJson(createRes, 'probe.createChatSession');
    const sessionId = created?.data?.id;
    // 2) … then an authenticated read of the same session (200) so both verbs are proven.
    const getRes = await fetch(`${API}/chat/v1/sessions/${encodeURIComponent(sessionId)}`, { headers: headers() });
    const getStatus = getRes.status;
    await asJson(getRes, 'probe.getChatSession');
    result = { ok: true, keyInstalled: true, keyLoaded: true, keySource: onDemandKeySource(), sessionCreated: true, sessionId, httpStatus: { createSession: createStatus, getSession: getStatus }, latencyMs: Date.now() - t0, checkedAt, endpointId: CONFIG.endpointId };
  } catch (e) {
    result = { ok: false, keyInstalled: true, keyLoaded: true, keySource: onDemandKeySource(), sessionCreated: false, httpStatus: e.status || null, latencyMs: Date.now() - t0, checkedAt, error: e.message };
  }
  lastProbe = { t: Date.now(), result };
  return result;
}

// ---- Chat API -------------------------------------------------------------
export async function createChatSession(externalUserId, pluginIds = []) {
  const res = await fetch(`${API}/chat/v1/sessions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ externalUserId, pluginIds }),
  });
  const body = await asJson(res, 'createChatSession'); // 200/201 → { message, data: { id, ... } }
  return body.data;
}

export async function submitQuerySync(sessionId, query, { fulfillmentPrompt, temperature = 0.2, signal } = {}) {
  const timeout = AbortSignal.timeout(90000);
  const res = await fetch(`${API}/chat/v1/sessions/${encodeURIComponent(sessionId)}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      query,
      endpointId: CONFIG.endpointId,
      responseMode: 'sync',
      fulfillmentOnly: true,
      modelConfigs: { fulfillmentPrompt, temperature },
    }),
    signal: signal && AbortSignal.any ? AbortSignal.any([signal, timeout]) : timeout,
  });
  const body = await asJson(res, 'submitQuery');
  return body.data; // { sessionId, messageId, answer, status }
}

// Streams the answer. Verified event shape:
//   event:message / data:{"eventType":"fulfillment","answer":"<delta>","status":"processing",...}
//   ... data:{"eventType":"statusLog","currentStatusLog":{"statusType":"fulfillment_completed","answer":"<full>"}}
//   ... data:{"eventType":"metricsLog",...}  then  data:[DONE]
export async function* submitQueryStream(sessionId, query, { fulfillmentPrompt, temperature = 0.2, signal } = {}) {
  const res = await fetch(`${API}/chat/v1/sessions/${encodeURIComponent(sessionId)}/query`, {
    method: 'POST',
    headers: headers({ Accept: 'text/event-stream' }),
    body: JSON.stringify({
      query,
      endpointId: CONFIG.endpointId,
      responseMode: 'stream',
      modelConfigs: { fulfillmentPrompt, temperature },
    }),
    signal,
  });
  if (!res.ok) await asJson(res, 'submitQuery(stream)');
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let full = '';
  let messageId = null;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of frame.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          if (payload === '[DONE]') {
            yield { type: 'done', answer: full, messageId };
            return;
          }
          let ev;
          try {
            ev = JSON.parse(payload);
          } catch {
            continue;
          }
          messageId = ev.messageId || messageId;
          if (ev.eventType === 'fulfillment' && typeof ev.answer === 'string') {
            full += ev.answer;
            yield { type: 'delta', text: ev.answer };
          } else if (ev.eventType === 'statusLog') {
            const log = ev.currentStatusLog || {};
            if (log.statusType === 'fulfillment_completed' && typeof log.answer === 'string' && log.answer.length >= full.length) {
              full = log.answer;
            }
            yield { type: 'status', status: log.statusType, message: log.statusMessage };
          } else if (ev.eventType === 'metricsLog') {
            yield { type: 'metrics', metrics: ev.publicMetrics };
          }
        }
      }
    }
    yield { type: 'done', answer: full, messageId };
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
}

// ---- Services API ---------------------------------------------------------
export async function speechToText(audioUrl) {
  const res = await fetch(`${SERVICES}/execute/speech_to_text`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ audioUrl }),
  });
  const body = await asJson(res, 'speech_to_text');
  return body.data?.text ?? '';
}

export async function textToSpeech(input, { voice = CONFIG.ttsVoice, model = CONFIG.ttsModel, speed, instructions } = {}) {
  const payload = { model, input, voice };
  if (speed && speed !== 1) payload.speed = speed;
  if (instructions && /^gpt-4o/.test(model)) payload.instructions = instructions;
  const res = await fetch(`${SERVICES}/execute/text_to_speech`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const body = await asJson(res, 'text_to_speech');
  return body.data?.audioUrl; // remote (Azure/Cloudinary) URL of an mp3
}

// ---- Agents Flow Builder (Advanced Voice Mode workflow) --------------------
// Public webhook execute route — verified to forward the payload into the graph
// (the trigger node's output becomes the payload JSON). Returns { executionID }.
export async function executeAvmWorkflow(payload, workflowId = CONFIG.avmWorkflowId) {
  const res = await fetch(`${API}/automation/public/v1/webhook/workflow/${encodeURIComponent(workflowId)}/execute`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ payload }),
  });
  const body = await asJson(res, 'executeWorkflow');
  return body.executionID || body.data?.executionID || body.executionId || null;
}

export async function getExecution(executionId) {
  const res = await fetch(`${AUTOMATION}/execution/${encodeURIComponent(executionId)}`, { headers: headers() });
  const body = await asJson(res, 'getExecution');
  return body.data ?? body;
}

export async function getExecutionLogs(executionId) {
  const res = await fetch(`${AUTOMATION}/execution/${encodeURIComponent(executionId)}/logs`, { headers: headers() });
  const body = await asJson(res, 'getExecutionLogs');
  return body.data ?? [];
}

export async function getExecutionTranscript(executionId) {
  const res = await fetch(`${AUTOMATION}/execution/${encodeURIComponent(executionId)}/transcript`, { headers: headers() });
  const body = await asJson(res, 'getExecutionTranscript');
  return body.data ?? null;
}

export async function getWorkflow(workflowId = CONFIG.avmWorkflowId) {
  const res = await fetch(`${AUTOMATION}/workflow/${encodeURIComponent(workflowId)}`, { headers: headers() });
  const body = await asJson(res, 'getWorkflow');
  return body.data ?? body;
}

export async function activateWorkflow(workflowId = CONFIG.avmWorkflowId) {
  const res = await fetch(`${AUTOMATION}/workflow/${encodeURIComponent(workflowId)}/activate`, { method: 'POST', headers: headers() });
  return asJson(res, 'activateWorkflow');
}
