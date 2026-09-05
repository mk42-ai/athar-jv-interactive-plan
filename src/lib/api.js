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

export async function getHealth() {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error(`health ${res.status}`);
  return res.json();
}

export async function createSession(externalUserId) {
  const res = await fetch('/api/chat/session', {
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
  const res = await fetch('/api/chat/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ sessionId, query, voice, documentId, slide, mode: 'stream' }),
    signal,
  });
  await ensureStream(res);
  await readSSE(res, onEvent, signal);
}

async function sourceJson(url, options = {}) {
  const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options });
  const body = await readJson(res);
  if (!res.ok) throw Object.assign(new Error(body.message || 'Document request failed.'), { code: body.code, status: res.status });
  return body;
}
export const getDocuments = () => sourceJson('/api/documents');
export const retryDocuments = () => sourceJson('/api/documents/retry', { method: 'POST' });
export const getCitation = (id) => sourceJson(`/api/citations/${encodeURIComponent(id)}`);

export const getSourceLocation = (id, options = {}) => {
  const params = new URLSearchParams(Object.entries(options).filter(([,v]) => v !== undefined && v !== null && v !== ''));
  return sourceJson(`/api/citations/${encodeURIComponent(id)}/view${params.size ? `?${params}` : ''}`);
};
