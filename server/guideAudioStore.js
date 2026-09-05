// Compatibility API for private, hash-verified, key-independent narration. No public rehydration.
// Mount only AFTER reviewer authorization, including both /guide-audio and /api/guide-audio aliases.
import crypto from 'node:crypto';
import { getAudioManifest, getAudioClip, getEmbeddedAudioData, isPresentationFilename } from './presentationStore.js';

export function loadEmbeddedAudio() {
  try {
    const manifest = getAudioManifest(), meta = getEmbeddedAudioData();
    const files = new Map(Object.values(manifest.clips).map((clip) => [clip.file, meta?.files?.[clip.file] || { sha256: clip.sha256, bytes: clip.bytes }]));
    return { manifest, files, decoded: new Map(), version: manifest.version, generatedAt: manifest.generatedAt, missing: false };
  } catch { return { manifest: null, files: new Map(), decoded: new Map(), missing: true }; }
}
export function embeddedClip(name) { return getAudioClip(name); }
export function rehydrateGuideAudio() {
  return { restored: 0, skipped: 0, note: 'Private serving only; public rehydration is disabled.' };
}
export function clipStatus(file, { expectedSha256 = null } = {}) {
  try {
    const buf = getAudioClip(file);
    if (!buf) return { ok: false, source: null, sha256Ok: null };
    const digest = crypto.createHash('sha256').update(buf).digest('hex');
    if (expectedSha256 && expectedSha256 !== digest) return { ok: false, source: 'embedded', sha256Ok: false };
    // Keep the legacy source identifier so existing callers choose the protected API alias.
    return { ok: true, source: 'embedded', sha256Ok: true };
  } catch { return { ok: false, source: null, sha256Ok: false }; }
}

export function sendPrivateBuffer(req, res, buf, { type, source, etag }) {
  res.setHeader('Content-Type', type);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');
  res.setHeader('Accept-Ranges', 'bytes');
  if (source) res.setHeader('X-Guide-Audio', source);
  if (etag) res.setHeader('ETag', `"${etag}"`);
  const header = req.headers?.range;
  const range = /^bytes=(\d*)-(\d*)$/.exec(String(header || ''));
  if (header) {
    let start = range?.[1] ? Number(range[1]) : Math.max(0, buf.length - Number(range?.[2]));
    let end = range?.[1] && range?.[2] ? Math.min(Number(range[2]), buf.length - 1) : buf.length - 1;
    if (!range || !(range[1] || range[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= buf.length || (!range[1] && Number(range[2]) <= 0)) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${buf.length}`);
      return res.end();
    }
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${buf.length}`);
    res.setHeader('Content-Length', String(end - start + 1));
    return res.end(req.method === 'HEAD' ? undefined : buf.subarray(start, end + 1));
  }
  res.statusCode = 200;
  res.setHeader('Content-Length', String(buf.length));
  return res.end(req.method === 'HEAD' ? undefined : buf);
}
export function privateAssetError(req, res, status = 404) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');
  return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ code: status === 503 ? 'presentation_unavailable' : 'not_found' }));
}
export function serveEmbedded(req, res, name) {
  if (!isPresentationFilename(name)) return false;
  try {
    if (name === 'manifest.json') {
      sendPrivateBuffer(req, res, Buffer.from(JSON.stringify(getAudioManifest())), { type: 'application/json; charset=utf-8', source: 'private-store' });
      return true;
    }
    const buf = getAudioClip(name);
    if (!buf) return false;
    sendPrivateBuffer(req, res, buf, { type: 'audio/mpeg', source: 'private-store', etag: crypto.createHash('sha256').update(buf).digest('hex') });
    return true;
  } catch { privateAssetError(req, res, 503); return true; }
}
export function guideAudioMiddleware() {
  return (req, res, next) => {
    const pathname = String(req.url || '').split('?')[0];
    if (!pathname.startsWith('/guide-audio/')) return next();
    if (req.method !== 'GET' && req.method !== 'HEAD') return privateAssetError(req, res);
    let name;
    try { name = decodeURIComponent(pathname.slice('/guide-audio/'.length)); }
    catch { return privateAssetError(req, res); }
    if (serveEmbedded(req, res, name)) return;
    return privateAssetError(req, res);
  };
}
