// Anonymous document workspace protections — no login, access code, cookie or gate.
import crypto from 'node:crypto';
const salt = crypto.randomBytes(32);
export function requestIdentity(req) {
  // Do not trust client-supplied forwarding headers. Conservative behind a proxy.
  return crypto.createHmac('sha256', salt).update(String(req.socket?.remoteAddress || 'unknown') + '\0' + String(req.headers['user-agent'] || '').slice(0, 500)).digest('hex');
}
export function sameOrigin(req, res, next) {
  let valid = false;
  try { const origin = new URL(req.headers.origin); valid = ['http:', 'https:'].includes(origin.protocol) && origin.host === req.headers.host; } catch {}
  if (!valid || req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ code: 'origin_forbidden', message: 'A same-origin request is required.' });
  next();
}
export function anonymousRequest(req, res, next) {
  req.clientKey = requestIdentity(req);
  res.setHeader('Cache-Control', 'no-store');
  next();
}
export function requestProtections({ limit = 1200, interval = 60_000, clock = Date.now } = {}) {
  const windows = new Map();
  return (req, res, next) => {
    const now = clock();
    for (const [key, value] of windows) if (value.until <= now) windows.delete(key);
    const key = req.socket?.remoteAddress || 'unknown';
    const value = windows.get(key) || { until: now + interval, count: 0 };
    if (++value.count > limit || windows.size > 5000) return res.status(429).set('Retry-After', '60').json({ code: 'rate_limited', message: 'Too many requests. Please wait before retrying.' });
    windows.set(key, value); next();
  };
}
