// v1.2.1 (+ v1.4.4 Permissions-Policy; v1.4.5 gif/avif MIME, 404s logged; v1.4.6 video playback: GET + HEAD, single-range HTTP Range
// requests → 206 with Accept-Ranges / Content-Range / Content-Length (suffix and open-ended ranges, 416 on unsatisfiable ranges),
// explicit video/mp4 · video/webm · image MIME, media never compressed (this server applies no Content-Encoding at all — bytes are
// streamed verbatim so byte ranges stay valid), Cache-Control per class (v1.6.3: no-store for every non-content-addressed file — html/json/js/css/vtt; immutable for content-hashed files), Permissions-Policy autoplay=(self), fullscreen=(self);
// v1.4.7: image MIME table completed (svg → image/svg+xml, ico → image/x-icon, gif, avif, webp, jpg/jpeg, png), nosniff on every
// response incl. 404/405, Referrer-Policy, X-Frame-Options) — dependency-free static server for dist/ (SPA fallback for extension-less paths).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.env.PORT || 3000);
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.mp4':'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg','.webm':'video/webm','.vtt':'text/vtt; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.txt':'text/plain; charset=utf-8','.pdf':'application/pdf','.csv':'text/csv; charset=utf-8','.gif':'image/gif','.avif':'image/avif','.map':'application/json; charset=utf-8'};
const MEDIA = /\.(mp4|webm)$/i;
const PERMISSIONS = 'autoplay=(self), fullscreen=(self)';
const BASE_H = {'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': PERMISSIONS}; // v1.5.1: X-Frame-Options removed so the deck embeds cross-origin (no CSP frame-ancestors either)
function cacheControl(f) {
  // v1.6.3: anything that is NOT content-addressed is never cached (no-store) — html, json (build-info, locales, narration), js, css, vtt, webmanifest, txt —
  // so a re-provisioned deployment is visible on the very next request and no browser can keep an older bundle (the stale 'v1.5.x' card seen on 4 Oct);
  // content-addressed files (Vite's /assets/index-<hash>.*, and <name>.<sha256[0:10]>.<ext> media) are immutable; images, fonts and un-hashed media keep a day with stale-while-revalidate.
  if (/\/assets\/index-[A-Za-z0-9_-]+\.(js|css)$/.test(f)) return 'public, max-age=31536000, immutable';
  if (/\.[0-9a-f]{10}\.(mp4|webm|jpe?g|webp|png|svg|vtt|woff2)$/i.test(f)) return 'public, max-age=31536000, immutable'; // v1.6.2: content-hashed media (films, posters, captions); v1.7.1: + section-10 brand images and self-hosted fonts
  if (/\.(html|json|m?js|css|vtt|webmanifest|txt|csv|md|xml)$/i.test(f)) return 'no-store';
  if (MEDIA.test(f) || /\.(woff2?|png|jpe?g|webp|svg|ico|gif|avif|mp3|m4a|wav)$/i.test(f)) return 'public, max-age=86400, stale-while-revalidate=604800';
  return 'no-store';
}
http.createServer((req, res) => {
  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') { res.writeHead(405, {...BASE_H, 'Allow': 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8'}); return res.end('405 Method Not Allowed'); }
  let p; try { p = decodeURIComponent((req.url || '/').split('?')[0]); } catch (e) { res.writeHead(400, {...BASE_H, 'Content-Type': 'text/plain; charset=utf-8'}); return res.end('400 Bad Request'); }
  if (p.indexOf('\0') !== -1) { res.writeHead(400, {...BASE_H, 'Content-Type': 'text/plain; charset=utf-8'}); return res.end('400 Bad Request'); }
  if (p === '/favicon.ico') p = '/brand/favicon.ico'; // v1.5.1: root favicon alias
  let f = path.normalize(path.join(root, p));
  if (f !== root && !f.startsWith(root + path.sep)) { res.writeHead(403, {...BASE_H, 'Content-Type': 'text/plain; charset=utf-8'}); return res.end('403 Forbidden'); }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    if (path.extname(p)) { console.warn('404', p); res.writeHead(404, {...BASE_H, 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control': 'no-store'}); return res.end('404 Not Found'); }
    f = path.join(root, 'index.html');
  }
  const st = fs.statSync(f); const type = MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';
  const h = {...BASE_H, 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': cacheControl(f), 'Last-Modified': st.mtime.toUTCString()};
  if (MEDIA.test(f)) h['Vary'] = 'Range';
  const r = req.headers.range;
  if (r) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(r).trim());
    let s, e;
    if (!m || (m[1] === '' && m[2] === '')) { res.writeHead(416, {...h, 'Content-Range': `bytes */${st.size}`}); return res.end(); }
    if (m[1] === '') { const n = Math.min(+m[2], st.size); s = st.size - n; e = st.size - 1; }
    else { s = +m[1]; e = m[2] === '' ? st.size - 1 : Math.min(+m[2], st.size - 1); }
    if (s >= st.size || s > e) { res.writeHead(416, {...h, 'Content-Range': `bytes */${st.size}`}); return res.end(); }
    res.writeHead(206, {...h, 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Content-Length': e - s + 1});
    if (method === 'HEAD') return res.end();
    return fs.createReadStream(f, {start: s, end: e}).pipe(res);
  }
  res.writeHead(200, {...h, 'Content-Length': st.size});
  if (method === 'HEAD') return res.end();
  fs.createReadStream(f).pipe(res);
}).listen(port, '0.0.0.0', () => console.log('serving', root, 'on', port));
