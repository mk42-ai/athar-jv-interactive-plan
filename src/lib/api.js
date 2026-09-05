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

// Embedded fallback: when the workspace runs inside a cross-site iframe and the browser blocks third-party
// cookies, the reviewer session is carried as `Authorization: Bearer` from the iframe's own session storage
// (partitioned per embedding site, cleared when the frame's session ends). Top-level tabs keep the HttpOnly cookie.
const TOKEN_KEY = 'athar_review_token';
const storage = () => { try { return window.sessionStorage; } catch { return null; } };
let sessionToken = storage()?.getItem(TOKEN_KEY) || null;
export const isEmbedded = () => { try { return window.top !== window.self; } catch { return true; } };
export const authHeaders = () => (sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {});
function setSessionToken(token) {
  sessionToken = token || null;
  const store = storage();
  if (!store) return;
  if (token) store.setItem(TOKEN_KEY, token); else store.removeItem(TOKEN_KEY);
}
/** fetch() with the same-origin cookie AND, when present, the embedded-session bearer header. */
export function authorizedFetch(url, options = {}) {
  const headers = { ...authHeaders(), ...(options.headers || {}) };
  return fetch(url, { credentials: 'same-origin', ...options, headers });
}

export async function getHealth() {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error(`health ${res.status}`);
  return res.json();
}

export async function createSession(externalUserId) {
  const res = await authorizedFetch('/api/chat/session', {
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
  const res = await authorizedFetch('/api/chat/query', {
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
  const res = await authorizedFetch(`/api/voice/turn?${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'audio/wav', Accept: 'text/event-stream' },
    body: blob,
    signal,
  });
  await ensureStream(res);
  await readSSE(res, onEvent, signal);
}

export async function voiceTextTurn({ sessionId, externalUserId, text, signal, onEvent }) {
  const res = await authorizedFetch('/api/voice/text-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ sessionId, externalUserId, text }),
    signal,
  });
  await ensureStream(res);
  await readSSE(res, onEvent, signal);
}

export async function getExecution(id) {
  const res = await authorizedFetch(`/api/voice/execution/${encodeURIComponent(id)}?logs=1`);
  return readJson(res);
}

// Review access is an HttpOnly same-origin session (plus the embedded bearer fallback above); the API key
// and the review code are never saved to web storage.
async function privateJson(url, options = {}) {
  const res = await authorizedFetch(url, { cache: 'no-store', ...options });
  const body = await readJson(res);
  if (!res.ok) {
    if (res.status === 401 && sessionToken) setSessionToken(null); // stale embedded token: fall back to the gate
    throw Object.assign(new Error(body.message || 'Protected request failed.'), { code: body.code, status: res.status });
  }
  return body;
}
export const getAccess = () => privateJson('/api/access');
export async function unlockAccess(passphrase) {
  const embedded = isEmbedded();
  const result = await privateJson('/api/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passphrase, embedded }) });
  if (result?.authenticated && result.token) {
    // Prefer the HttpOnly cookie; keep the bearer token only when the browser did not persist the cookie.
    const cookieWorks = await fetch('/api/access', { credentials: 'same-origin', cache: 'no-store' }).then((r) => r.json()).then((a) => a?.authenticated === true).catch(() => false);
    setSessionToken(cookieWorks ? null : result.token);
    return { ...result, token: undefined, sessionTransport: cookieWorks ? 'cookie' : 'bearer' };
  }
  return result;
}
export async function lockAccess() {
  try { return await privateJson('/api/access', { method: 'DELETE' }); }
  finally { setSessionToken(null); }
}
export const getDocuments = () => privateJson('/api/documents');
export const retryDocuments = () => privateJson('/api/documents/retry', { method: 'POST' });
export const getCitation = (id) => privateJson(`/api/citations/${encodeURIComponent(id)}`);

export const getSourceLocation = (id, options = {}) => {
  const params = new URLSearchParams(Object.entries(options).filter(([,v]) => v !== undefined && v !== null && v !== ''));
  return privateJson(`/api/citations/${encodeURIComponent(id)}/view${params.size ? `?${params}` : ''}`);
};
