// Browser-side helpers. Everything goes through the same-origin /api proxy —
// the On Demand apikey never leaves the server. No cookie, token, access code or client id is sent:
// a conversation is identified by the random session id the server minted for it.

async function readJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function apiError(res, body, fallback) {
  return Object.assign(new Error(body?.message || fallback), { code: body?.code, status: res.status });
}

export async function getHealth() {
  const res = await fetch('/api/health', { cache: 'no-store' });
  if (!res.ok) throw new Error(`health ${res.status}`);
  return res.json();
}

/** Starts a conversation: { sessionId, createdAt }. */
export async function createSession(externalUserId) {
  const res = await fetch('/api/chat/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ externalUserId }),
  });
  const body = await readJson(res);
  if (!res.ok) throw apiError(res, body, `Could not start a conversation (${res.status}).`);
  return body;
}

/** One grounded answer: { answer, citations[], grounding, messageId }. Plain JSON — no streaming, so the
 *  reply survives proxies and iframes that buffer or drop server-sent events. */
export async function askQuestion({ sessionId, query, signal }) {
  const res = await fetch('/api/chat/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, query, mode: 'sync' }),
    signal,
  });
  const body = await readJson(res);
  if (!res.ok) throw apiError(res, body, `The request failed (${res.status}).`);
  return body;
}
