// Review-only access for confidential evidence. Never use an AI-provider key as a password.
// Credentials live in the host secret store, not in source, query strings, or the browser bundle.
import crypto from 'node:crypto';
import express from 'express';

const COOKIE = 'athar_review';
const SESSION_MS = 6 * 60 * 60 * 1000;
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();
const equal = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

// Cookie SameSite policy. The workspace is opened inside embedded preview panels (cross-origin iframes),
// where a `SameSite=Strict` session cookie is never sent — sign-in appears to "not stick". `None` (the
// default) keeps the reviewer session working in iframes AND top-level tabs; browsers require `Secure`
// with it, so `None` is only emitted on HTTPS (or `X-Forwarded-Proto: https`), and a plain-HTTP dev host
// falls back to `Lax`. Operators can pin `Lax`/`Strict` via ATHAR_COOKIE_SAMESITE. CSRF protection does not
// rely on SameSite: every mutating route also enforces the same-origin Origin/Sec-Fetch-Site check below.
export function cookieSameSite(secure, preference = process.env.ATHAR_COOKIE_SAMESITE) {
  const wanted = /^(none|lax|strict)$/i.test(String(preference || '')) ? preference.toLowerCase() : 'none';
  const mode = wanted === 'none' && !secure ? 'lax' : wanted;
  return { mode: mode === 'none' ? 'None' : mode === 'lax' ? 'Lax' : 'Strict', attributes: `SameSite=${mode === 'none' ? 'None' : mode === 'lax' ? 'Lax' : 'Strict'}${secure ? '; Secure' : ''}` };
}
export const requestIsSecure = (req) => Boolean(req.secure) || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';

export function createAccessControl({ passphrase = process.env.ATHAR_REVIEW_PASSPHRASE,
  signingKey = process.env.ATHAR_SESSION_SECRET, clock = Date.now } = {}) {
  const sessions = new Map();
  const attempts = new Map();
  const configured = Boolean(passphrase && signingKey && signingKey.length >= 32);
  const sign = (v) => crypto.createHmac('sha256', signingKey || 'disabled').update(v).digest('base64url');
  const sweep = () => {
    const now = clock();
    for (const [id, session] of sessions) if (session.expiresAt <= now) sessions.delete(id);
    for (const [ip, attempt] of attempts) if (attempt.until <= now) attempts.delete(ip);
  };
  function read(req) {
    if (!configured) return null;
    const token = String(req.headers.cookie || '').split(';').map((p) => p.trim()).find((p) => p.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    if (!token || token.length > 256) return null;
    const [id, signature, extra] = token.split('.');
    if (extra || !id || !signature || !equal(signature, sign(id))) return null;
    const session = sessions.get(id);
    if (!session || session.expiresAt <= clock()) { sessions.delete(id); return null; }
    return session;
  }
  function requireAccess(req, res, next) {
    const session = read(req);
    if (!session) return res.status(configured ? 401 : 503).json({ code: configured ? 'access_required' : 'access_not_configured', message: configured ? 'Reviewer access is required.' : 'Reviewer access has not been provisioned on this server.' });
    req.reviewer = session;
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Cookie');
    return next();
  }
  function sameOrigin(req, res, next) {
    const origin = req.headers.origin;
    const site = req.headers['sec-fetch-site'];
    let valid = false;
    try {
      // Do not trust a client-supplied X-Forwarded-Host for the CSRF boundary.
      valid = Boolean(origin && new URL(origin).host === req.headers.host && ['http:', 'https:'].includes(new URL(origin).protocol));
    } catch {}
    if (!valid || site === 'cross-site') return res.status(403).json({ code: 'origin_forbidden', message: 'A same-origin request is required.' });
    return next();
  }
  const router = express.Router();
  router.use((req, res, next) => { res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Vary', 'Cookie'); next(); });
  router.get('/', (req, res) => res.json({ authenticated: Boolean(read(req)), configured }));
  router.post('/', sameOrigin, express.json({ limit: '2kb' }), (req, res) => {
    sweep();
    if (!configured) return res.status(503).json({ code: 'access_not_configured', message: 'Ask the workspace owner to provision reviewer access.' });
    // Socket IP is conservative behind a shared proxy; it cannot be bypassed by spoofing X-Forwarded-For.
    const ip = req.socket.remoteAddress || 'unknown';
    const attempt = attempts.get(ip) || { count: 0, until: clock() + 15 * 60 * 1000 };
    if (attempt.count >= 8 || sessions.size > 5000) return res.status(429).json({ code: 'rate_limited', message: 'Too many attempts. Try again later.' });
    const supplied = typeof req.body?.passphrase === 'string' ? req.body.passphrase : '';
    if (!equal(supplied, passphrase)) {
      attempt.count += 1; attempts.set(ip, attempt);
      return res.status(401).json({ code: 'access_denied', message: 'The reviewer access code was not accepted.' });
    }
    attempts.delete(ip);
    const old = read(req); if (old) sessions.delete(old.id);
    const id = crypto.randomBytes(32).toString('base64url');
    const session = { id, principal: crypto.randomUUID(), createdAt: clock(), expiresAt: clock() + SESSION_MS };
    sessions.set(id, session);
    const secure = requestIsSecure(req);
    const sameSite = cookieSameSite(secure);
    res.setHeader('Set-Cookie', `${COOKIE}=${id}.${sign(id)}; HttpOnly; ${sameSite.attributes}; Path=/; Max-Age=${SESSION_MS / 1000}`);
    return res.json({ authenticated: true, expiresAt: new Date(session.expiresAt).toISOString(), cookieSameSite: sameSite.mode });
  });
  router.delete('/', sameOrigin, (req, res) => {
    const current = read(req); if (current) sessions.delete(current.id);
    res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; ${cookieSameSite(requestIsSecure(req)).attributes}; Path=/; Max-Age=0`);
    return res.json({ authenticated: false });
  });
  // A short-lived, scoped capability permits the AI service to fetch only its uploaded audio.
  // It is not a login credential and never grants document/chat access.
  const mediaCapability = (id, expiresAt = clock() + 120000) => ({ expires: expiresAt, cap: sign(`media:${id}:${expiresAt}`) });
  const validMediaCapability = (id, expires, cap) => {
    const t = Number(expires);
    return configured && Number.isSafeInteger(t) && t > clock() && t <= clock() + 120000 && typeof cap === 'string' && equal(cap, sign(`media:${id}:${t}`));
  };
  return { router, requireAccess, sameOrigin, read, configured, mediaCapability, validMediaCapability };
}
