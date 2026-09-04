// Serves the exact 2-slide deck PDF at /deck/<name>.pdf.
//
// When the binary exists in public/deck/ this middleware steps aside (next()) and the file is served
// exactly as before by Vite / express.static — byte-identical behaviour. When the binary is ABSENT —
// e.g. a redeploy built from a code snapshot that only carries text files — it decodes
// data/deck-pdf.base64.json (the same bytes, checksum-verified on load) so the PDF.js viewer keeps
// working. No client change: the viewer still requests /deck/<name>.pdf.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EMBEDDED_PATH = path.resolve(ROOT, 'data/deck-pdf.base64.json');

let cached = null; // { name, buf, bytes, sha256 }

export function loadEmbeddedDeck() {
  if (cached) return cached;
  const meta = JSON.parse(fs.readFileSync(EMBEDDED_PATH, 'utf8'));
  const buf = Buffer.from(meta.base64, 'base64');
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  if (meta.sha256 && sha256 !== meta.sha256) {
    throw new Error(`embedded deck PDF checksum mismatch (${sha256} != ${meta.sha256})`);
  }
  cached = { name: String(meta.name), buf, bytes: buf.length, sha256 };
  return cached;
}

// `staticDir` is the directory the static layer in front of this middleware serves from:
// 'public' under the Vite dev server, 'dist' (the build output, which vite build copies public/ into)
// under server/index.js. The middleware only steps in when that directory lacks the binary.
export function deckPdfMiddleware({ staticDir = 'public' } = {}) {
  return function deckPdf(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const pathname = String(req.url || '').split('?')[0];
    if (!pathname.startsWith('/deck/') || !pathname.endsWith('.pdf')) return next();
    let name;
    try {
      name = decodeURIComponent(pathname.slice('/deck/'.length));
    } catch {
      return next();
    }
    if (!name || name.includes('/') || name.includes('..')) return next();
    if (fs.existsSync(path.join(ROOT, staticDir, 'deck', name))) return next(); // binary present → default static serving
    let deck;
    try {
      deck = loadEmbeddedDeck();
    } catch (e) {
      console.error('[deck] embedded PDF unavailable:', e.message);
      return next();
    }
    if (deck.name !== name) return next();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(deck.bytes));
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('ETag', `"${deck.sha256.slice(0, 32)}"`);
    res.setHeader('X-Deck-Source', 'embedded-base64');
    if (req.method === 'HEAD') return res.end();
    return res.end(deck.buf);
  };
}
