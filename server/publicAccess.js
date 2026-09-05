// Public access model — no reviewer code, no login, no session cookie.
//
// The former reviewer gate (passphrase + signed HttpOnly session, later a bearer fallback for embedded
// frames) has been removed: the presentation AND the document-connected AI are open to anyone who has
// the deployment URL. What remains here is deliberately NOT authentication:
//   • an anonymous per-client principal used only to keep a conversation and its private source
//     projections attached to the browser that created them (the client sends a random id in
//     X-Athar-Client; without it the client IP + user agent is used);
//   • a per-IP rate key for the evidence-route throttles;
//   • the same-origin CSRF check for mutating routes;
//   • short-lived signed capabilities so the On Demand speech service can fetch ONLY the audio it was
//     just given (never a browser session).
// The On Demand API key stays server-side (see server/env.js); nothing here ever reaches the client.
import crypto from 'node:crypto';

const CLIENT_ID = /^[A-Za-z0-9_-]{8,64}$/;
const MEDIA_TTL_MS = 120_000;

export function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || req.ip || 'unknown';
}

export function createPublicAccess({ signingKey = crypto.randomBytes(32).toString('hex'), clock = Date.now } = {}) {
  const sign = (value) => crypto.createHmac('sha256', signingKey).update(value).digest('base64url');
  const equal = (a, b) => {
    const x = crypto.createHash('sha256').update(String(a)).digest();
    const y = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(x, y);
  };
  const hash = (value) => crypto.createHash('sha256').update(value).digest('base64url').slice(0, 32);

  /** Anonymous conversation principal + throttle key. Never an identity claim. */
  function read(req) {
    const header = String(req.headers['x-athar-client'] || '').trim();
    const ip = clientIp(req);
    const principal = CLIENT_ID.test(header) ? `client:${header}` : `ip:${hash(`${ip}\0${req.headers['user-agent'] || ''}`)}`;
    return { principal, rateKey: `ip:${hash(ip)}`, anonymous: true };
  }
  function attach(req, res, next) {
    req.reviewer = read(req);
    res.setHeader('Cache-Control', 'no-store');
    next();
  }
  /** Mutating routes must come from this origin (CSRF); unchanged from the gated design. */
  function sameOrigin(req, res, next) {
    const origin = req.headers.origin;
    const site = String(req.headers['sec-fetch-site'] || '').toLowerCase();
    let valid = false;
    try {
      if (origin) { const url = new URL(origin); valid = ['http:', 'https:'].includes(url.protocol) && url.host === req.headers.host; }
    } catch {}
    if (!valid || site === 'cross-site') return res.status(403).json({ code: 'origin_forbidden', message: 'A same-origin request is required.' });
    return next();
  }
  /** 120-second capability that lets the speech service fetch exactly one uploaded media item. */
  function mediaCapability(id) {
    const expires = String(clock() + MEDIA_TTL_MS);
    return { expires, cap: sign(`media\0${id}\0${expires}`) };
  }
  function validMediaCapability(id, expires, cap) {
    if (!id || !expires || !cap || !/^\d+$/.test(String(expires)) || Number(expires) <= clock()) return false;
    return equal(cap, sign(`media\0${id}\0${expires}`));
  }
  return { mode: 'public', read, attach, sameOrigin, mediaCapability, validMediaCapability };
}
