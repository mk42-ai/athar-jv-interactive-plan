// Browser-side helpers. Everything goes through the same-origin /api proxy —
// the On Demand apikey never leaves the server.

async function readJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

// Anonymous conversation affinity — NOT a credential. The reviewer-code gate has been removed; the server keeps a
// conversation and its private source projections attached to the browser that created them via this random id
// (falls back to the client IP + user agent when the header is absent). Nothing secret is stored client-side.
const CLIENT_KEY = 'athar_client_id';
function clientId() {
  try {
    const store = window.localStorage;
    let id = store.getItem(CLIENT_KEY);
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id || '')) { id = (crypto.randomUUID ? crypto.randomUUID() : `c${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, ''); store.setItem(CLIENT_KEY, id); }
    return id;
  } catch { return null; }
}
export function apiHeaders(extra = {}) {
  const id = clientId();
  return { ...(id ? { 'X-Athar-Client': id } : {}), ...extra };
}
/** fetch() for this origin's API: same-origin credentials plus the anonymous client id. */
export function apiFetch(url, options = {}) {
  return fetch(url, { credentials: 'same-origin', ...options, headers: apiHeaders(options.headers || {}) });
}

export async function getHealth() {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error(`health ${res.status}`);
  return res.json();
}

export async function createSession(externalUserId) {
  const res = await apiFetch('/api/chat/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ externalUserId }),
  });
  const body = await readJson(res);
  if (!res.ok) throw Object.assign(new Error(body.message || `Could not create chat session (${res.status})`), { code: body.code, status: res.status });
  return body; // { sessionId, externalUserId }
}

// Parses a text/event-stream response body and invokes onEvent for each JSON `data:` frame.
export async function readSSE(res, onEvent, signal) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const onAbort = () => reader.cancel().catch(() => {});
  signal?.addEventListener('abort', onAbort, { once: true });
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
          try {
            onEvent(JSON.parse(payload));
          } catch {
            /* ignore malformed frame */
          }
        }
      }
    }
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

async function ensureStream(res) {
  if (!res.ok || !res.headers.get('content-type')?.includes('text/event-stream')) {
    const body = await readJson(res);
    throw Object.assign(new Error(body.message || `Request failed (${res.status})`), { code: body.code, status: res.status });
  }
  return res;
}

export async function streamChat({ sessionId, query, voice = false, documentId = 'all', slide = null, signal, onEvent }) {
  const res = await apiFetch('/api/chat/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ sessionId, query, voice, documentId, slide, mode: 'stream' }),
    signal,
  });
  await ensureStream(res);
  await readSSE(res, onEvent, signal);
}

export async function voiceTurn({ sessionId, externalUserId, blob, signal, onEvent }) {
  const qs = new URLSearchParams({ sessionId, externalUserId: externalUserId || 'athar-web-voice' });
  const res = await apiFetch(`/api/voice/turn?${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'audio/wav', Accept: 'text/event-stream' },
    body: blob,
    signal,
  });
  await ensureStream(res);
  await readSSE(res, onEvent, signal);
}

export async function voiceTextTurn({ sessionId, externalUserId, text, signal, onEvent }) {
  const res = await apiFetch('/api/voice/text-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ sessionId, externalUserId, text }),
    signal,
  });
  await ensureStream(res);
  await readSSE(res, onEvent, signal);
}

export async function getExecution(id) {
  const res = await apiFetch(`/api/voice/execution/${encodeURIComponent(id)}?logs=1`);
  return readJson(res);
}

// Protected-JSON helper (no authentication involved — the routes are public; errors carry the server code/status).
async function privateJson(url, options = {}) {
  const res = await apiFetch(url, { cache: 'no-store', ...options });
  const body = await readJson(res);
  if (!res.ok) throw Object.assign(new Error(body.message || 'Request failed.'), { code: body.code, status: res.status });
  return body;
}
export const getDocuments = () => privateJson('/api/documents');
export const retryDocuments = () => privateJson('/api/documents/retry', { method: 'POST' });
export const getCitation = (id) => privateJson(`/api/citations/${encodeURIComponent(id)}`);

export const getSourceLocation = (id, options = {}) => {
  const params = new URLSearchParams(Object.entries(options).filter(([,v]) => v !== undefined && v !== null && v !== ''));
  return privateJson(`/api/citations/${encodeURIComponent(id)}/view${params.size ? `?${params}` : ''}`);
};
