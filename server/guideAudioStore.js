// Snapshot-proof serving of the pre-baked Guide Mode narration.
//
// ROOT CAUSE this fixes ("Audio element error (code 4) while playing s1-open-….mp3"): deployments that are
// rebuilt from a code snapshot carry only text files, so public/guide-audio/*.mp3 can be missing while
// manifest.json is present. The dev server then answers /guide-audio/<clip>.mp3 with the SPA's index.html
// (HTTP 200, text/html), the proxy still hands out that URL, and the <audio> element fails with
// MediaError 4 (SRC_NOT_SUPPORTED). Exactly like the deck PDF, the clips are therefore ALSO embedded as
// base64 in data/guide-audio.base64.json (a text file that survives snapshots):
//   • at start-up, any clip missing from public/ (or dist/) is written back from the store (self-heal);
//   • this middleware serves /guide-audio/<clip>.mp3 from the store — with Range support, the right
//     Content-Type and immutable caching — whenever the static file is still absent;
//   • a request for an unknown clip gets a JSON 404, never HTML;
//   • clipStatus(file) lets /api/guide/tts confirm a clip is really servable before returning its URL.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EMBEDDED_PATH = path.resolve(ROOT, 'data/guide-audio.base64.json');

let store = null; // { manifest, files: Map<name, { base64, sha256, bytes }>, decoded: Map<name, Buffer> }

export function loadEmbeddedAudio() {
  if (store) return store;
  if (!fs.existsSync(EMBEDDED_PATH)) {
    store = { manifest: null, files: new Map(), decoded: new Map(), missing: true };
    return store;
  }
  const meta = JSON.parse(fs.readFileSync(EMBEDDED_PATH, 'utf8'));
  const files = new Map(Object.entries(meta.files || {}));
  store = { manifest: meta.manifest || null, files, decoded: new Map(), version: meta.version, generatedAt: meta.generatedAt };
  return store;
}

/** Decode (and checksum-verify) one clip from the embedded store. Returns Buffer or null. */
export function embeddedClip(name) {
  const s = loadEmbeddedAudio();
  if (s.decoded.has(name)) return s.decoded.get(name);
  const f = s.files.get(name);
  if (!f) return null;
  const buf = Buffer.from(f.base64, 'base64');
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  if (f.sha256 && sha256 !== f.sha256) {
    console.error(`[guide-audio] embedded clip ${name} failed its checksum (${sha256.slice(0, 12)} ≠ ${f.sha256.slice(0, 12)})`);
    return null;
  }
  s.decoded.set(name, buf);
  return buf;
}

const safeName = (pathname, prefix = '/guide-audio/') => {
  if (!pathname.startsWith(prefix)) return null;
  let name;
  try {
    name = decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    return null;
  }
  if (!name || name.includes('/') || name.includes('..')) return null;
  return name;
};

/** Where is this clip servable from? { ok, source: 'static'|'embedded'|null, sha256Ok } */
export function clipStatus(file, { staticDir = 'public', expectedSha256 = null } = {}) {
  const p = path.join(ROOT, staticDir, 'guide-audio', file);
  if (fs.existsSync(p)) {
    if (expectedSha256) {
      const sha = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
      if (sha === expectedSha256) return { ok: true, source: 'static', sha256Ok: true };
      // corrupt/stale static copy — prefer the embedded copy if it verifies
      if (embeddedClip(file)) return { ok: true, source: 'embedded', sha256Ok: true, staticCorrupt: true };
      return { ok: false, source: 'static', sha256Ok: false };
    }
    return { ok: true, source: 'static', sha256Ok: null };
  }
  if (embeddedClip(file)) return { ok: true, source: 'embedded', sha256Ok: true };
  return { ok: false, source: null, sha256Ok: null };
}

/** Best-effort self-heal: write missing/corrupt clips (and the manifest) back to <staticDir>/guide-audio. */
export function rehydrateGuideAudio({ staticDir = 'public' } = {}) {
  const s = loadEmbeddedAudio();
  if (s.missing) return { restored: 0, skipped: 0, note: 'no embedded store' };
  const dir = path.join(ROOT, staticDir, 'guide-audio');
  let restored = 0;
  let skipped = 0;
  try {
    fs.mkdirSync(dir, { recursive: true });
    for (const [name, f] of s.files) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) {
        const sha = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
        if (sha === f.sha256) {
          skipped++;
          continue;
        }
      }
      const buf = embeddedClip(name);
      if (buf) {
        fs.writeFileSync(p, buf);
        restored++;
      }
    }
    if (s.manifest && !fs.existsSync(path.join(dir, 'manifest.json'))) {
      fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(s.manifest, null, 1));
      restored++;
    }
  } catch (e) {
    console.warn('[guide-audio] rehydrate failed:', e.message);
  }
  if (restored) console.log(`[guide-audio] restored ${restored} narration file(s) into ${staticDir}/guide-audio from the embedded store (${skipped} already present)`);
  return { restored, skipped };
}

function sendBuffer(req, res, buf, { type, immutable = true, source = 'embedded-base64', etag }) {
  res.setHeader('Content-Type', type);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-store, must-revalidate');
  res.setHeader('X-Guide-Audio', source);
  if (etag) res.setHeader('ETag', `"${etag}"`);
  const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : Math.max(0, buf.length - Number(range[2]));
    let end = range[1] && range[2] ? Math.min(Number(range[2]), buf.length - 1) : buf.length - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= buf.length) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${buf.length}`);
      return res.end();
    }
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${buf.length}`);
    res.setHeader('Content-Length', String(end - start + 1));
    if (req.method === 'HEAD') return res.end();
    return res.end(buf.subarray(start, end + 1));
  }
  res.statusCode = 200;
  res.setHeader('Content-Length', String(buf.length));
  if (req.method === 'HEAD') return res.end();
  res.end(buf);
}

/** Serve one clip/manifest from the embedded store (used by the middleware and by /api/guide-audio/:file). */
export function serveEmbedded(req, res, name) {
  const s = loadEmbeddedAudio();
  if (name === 'manifest.json') {
    if (!s.manifest) return false;
    const body = Buffer.from(JSON.stringify(s.manifest));
    sendBuffer(req, res, body, { type: 'application/json; charset=utf-8', immutable: false, source: 'embedded-base64' });
    return true;
  }
  const buf = embeddedClip(name);
  if (!buf) return false;
  sendBuffer(req, res, buf, { type: 'audio/mpeg', immutable: true, source: 'embedded-base64', etag: s.files.get(name)?.sha256?.slice(0, 32) });
  return true;
}

/**
 * Connect/Express middleware for /guide-audio/*. Steps aside when the static file exists (Vite / express.static
 * serve it byte-identically, with their own Range support); serves from the embedded store when it does not;
 * answers a JSON 404 for unknown clips so the SPA fallback can never return HTML for an audio URL.
 */
export function guideAudioMiddleware({ staticDir = 'public' } = {}) {
  return function guideAudio(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const pathname = String(req.url || '').split('?')[0];
    const name = safeName(pathname);
    if (!name) return next();
    if (name === 'manifest.json') {
      if (fs.existsSync(path.join(ROOT, staticDir, 'guide-audio', name))) {
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
        return next();
      }
      if (serveEmbedded(req, res, name)) return;
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'manifest not found' }));
    }
    if (!name.endsWith('.mp3')) return next();
    if (fs.existsSync(path.join(ROOT, staticDir, 'guide-audio', name))) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Guide-Audio', 'static');
      return next(); // static layer serves the file (audio/mpeg, Range-capable)
    }
    if (serveEmbedded(req, res, name)) return;
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'clip not found', file: name }));
  };
}
