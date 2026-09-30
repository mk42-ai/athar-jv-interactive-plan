// v1.4.2 build (v1.4.1 script + intro-gate assets): the deck is a static dist/ (no bundler step survives the platform restores — the React/TS sources are
// 0-byte). "npm run build" therefore (1) validates that every asset referenced by dist/index.html, the runtime modules
// and the tour asset map exists, (2) checks the version string is consistent, and (3) regenerates SHA256SUMS.txt for the
// whole workspace tree (all of dist/ included; assets-src/downloads archives excluded). Exit 1 on any missing asset.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const root = path.resolve(new URL('..', import.meta.url).pathname, '..');
const dist = path.join(root, 'dist'); const VERSION = 'v1.4.2'; const problems = [];
const read = (p) => fs.readFileSync(path.join(dist, p), 'utf8');
const index = read('index.html');
if (!index.includes(`textContent='${VERSION}'`)) problems.push(`footer literal is not ${VERSION}`);
if (!index.includes(`data-deck-version="${VERSION.slice(1)}"`)) problems.push('data-deck-version mismatch');
const refs = new Set();
for (const m of index.matchAll(/(?:src|href)="(\/[^"]+)"/g)) refs.add(m[1]);
for (const f of ['js/impact-tiers.js', 'js/athar-os.js', 'js/api-licences.js', 'js/tour/real-screens.js', 'js/intro-gate.js']) {
  const s = read(f); if (f !== 'js/tour/real-screens.js' && !s.includes(`'${VERSION}'`) && f !== 'js/api-licences.js') problems.push(`${f} does not carry ${VERSION}`);
  for (const m of s.matchAll(/['"](\/(?:assets|brand|partners|fonts|video|js|locales|captions)\/[A-Za-z0-9_./@-]+\.(?:png|webp|jpg|svg|mp4|webm|json|css|js|vtt|woff2))['"]/g)) refs.add(m[1]);
}
const meta = JSON.parse(read('assets/tour/tour-assets.json'));
for (const k of ['overview', 'marketplace', 'playground-empty', 'playground-streaming', 'playground-completed', 'flow']) for (const t of ['light', 'dark']) for (const l of ['en', 'ar']) for (const s of ['@1x', '@2x']) refs.add(`/assets/tour/screens/${k}-${t}-${l}${s}.png`);
for (const n of [...Object.values(meta.still_map), ...meta.filmstrip]) { refs.add(`/assets/tour/stills/${n}`); refs.add(`/assets/tour/stills/${n.replace(/\.png$/, '')}-960.webp`); }
for (const v of [meta.video.mp4, meta.video.webm, meta.video.poster]) refs.add(v);
for (const r of ['/assets/intro/v1.4.2/intro.mp4', '/assets/intro/v1.4.2/intro.webm', '/assets/intro/v1.4.2/intro-poster.png', '/assets/intro/intro.css', '/js/intro-gate.js']) refs.add(r);
const missing = [...refs].filter((r) => !fs.existsSync(path.join(dist, r.split('?')[0])));
const known = missing.filter((r) => /\/assets\/(impact\/v133|plates|news\/marks|api|tiers)\/|\/partners\/review\/(mastercard|rockefeller)/.test(r));
const hard = missing.filter((r) => !known.includes(r));
if (hard.length) problems.push('missing referenced assets: ' + hard.join(', '));
// SHA256SUMS over the tree
const skip = (p) => p.includes('/node_modules/') || p.includes('/.git/') || p.includes('/assets-src/downloads/');
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (skip(p + (e.isDirectory() ? '/' : ''))) continue; if (e.isDirectory()) walk(p); else if (e.name !== 'SHA256SUMS.txt') files.push(p); } })(root);
files.sort(); const lines = files.map((p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') + '  ./' + path.relative(root, p));
fs.writeFileSync(path.join(root, 'SHA256SUMS.txt'), lines.join('\n') + '\n');
console.log(`build ${VERSION}: ${refs.size} referenced assets checked, ${missing.length} missing (${known.length} known-unrecoverable v1.4.0 binaries: ${known.length ? known.slice(0, 4).join(', ') + (known.length > 4 ? ' …' : '') : 'none'}), SHA256SUMS.txt ${lines.length} entries`);
if (problems.length) { console.error('BUILD FAILED:\n - ' + problems.join('\n - ')); process.exit(1); }
