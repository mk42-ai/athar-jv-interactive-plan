#!/usr/bin/env node
/* v1.4.7 build: (1) version gate — every runtime module and index.html must carry v1.4.7; (2) hard asset gate — every image/video/font
   referenced by dist/ must exist locally and be non-empty (delegated to scripts/check-assets.mjs, also run as prebuild/postbuild);
   (3) regenerate SHA256SUMS.txt over dist/ (sorted, sha256sum -c compatible). Exits non-zero on any failure — FAIL LOUD. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { spawnSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..'); const DIST = path.join(ROOT, 'dist');
const fail = (m) => { console.error('BUILD FAIL: ' + m); process.exit(1); };
const V = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const need = { 'dist/index.html': [`data-deck-version="${V}"`], 'dist/js/impact-tiers.js': [`var VERSION = 'v${V}'`], 'dist/js/athar-os.js': [`var VERSION = 'v${V}'`], 'dist/js/img-guard.js': [`version: 'v${V}'`], 'dist/js/video-player.js': [`var VERSION = 'v${V}'`], 'dist/js/exec-team.js': [`var VERSION = 'v${V}'`], 'dist/js/narration.js': [`var VERSION = 'v${V}'`], 'dist/locales/impact-tiers.en.json': [`"version": "${V}"`], 'dist/locales/impact-tiers.ar.json': [`"version": "${V}"`] };
for (const [f, lits] of Object.entries(need)) { const p = path.join(ROOT, f); if (!fs.existsSync(p)) fail('missing ' + f); const s = fs.readFileSync(p, 'utf8'); for (const l of lits) if (!s.includes(l)) fail(`${f} does not carry ${l}`); }
/* v1.5.7 feature flags (pact-deck/features.json): sync dist/ to the flags BEFORE the gates run — idempotent, so a committed dist/ and a fresh Vercel build agree.
   originsFilm (default false): the Muhammed Khalid impact-story film. ON  → features/origins-film/exec-film.js → dist/js/exec-film.js, its assets/ → dist/assets/exec/video/, and
   <script src="/js/exec-film.js"> injected before exec-team.js in dist/index.html. OFF → those files and the tag are removed from dist/ and the gate below proves no trace is served. */
const FEAT = JSON.parse(fs.readFileSync(path.join(ROOT, 'features.json'), 'utf8'));
if (typeof FEAT.originsFilm !== 'boolean') fail('features.json: originsFilm must be true or false');
const FILM_SRC = path.join(ROOT, 'features/origins-film'), FILM_JS = path.join(DIST, 'js/exec-film.js'), FILM_VIDEO_DIR = path.join(DIST, 'assets/exec/video'), FILM_TAG = '<script src="/js/exec-film.js" data-v157="origins-film"></script>';
const filmAssets = fs.existsSync(path.join(FILM_SRC, 'assets')) ? fs.readdirSync(path.join(FILM_SRC, 'assets')) : [];
let indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (FEAT.originsFilm) {
  if (!fs.existsSync(path.join(FILM_SRC, 'exec-film.js')) || !filmAssets.length) fail('originsFilm is true but features/origins-film/ is missing exec-film.js or assets/');
  fs.copyFileSync(path.join(FILM_SRC, 'exec-film.js'), FILM_JS); fs.mkdirSync(FILM_VIDEO_DIR, { recursive: true });
  for (const f of filmAssets) fs.copyFileSync(path.join(FILM_SRC, 'assets', f), path.join(FILM_VIDEO_DIR, f));
  if (!indexHtml.includes(FILM_TAG)) { const m = /<script[^>]*src="\/js\/exec-team\.js"[^>]*><\/script>/.exec(indexHtml); if (!m) fail('index.html: exec-team.js script tag not found'); indexHtml = indexHtml.replace(m[0], FILM_TAG + m[0]); }
} else {
  fs.rmSync(FILM_JS, { force: true }); for (const f of filmAssets) fs.rmSync(path.join(FILM_VIDEO_DIR, f), { force: true });
  try { fs.rmdirSync(FILM_VIDEO_DIR); } catch (e) { /* not empty / absent */ }
  indexHtml = indexHtml.split(FILM_TAG).join('');
}
fs.writeFileSync(path.join(DIST, 'index.html'), indexHtml);
const filmMust = FEAT.originsFilm ? ['dist/js/exec-film.js', ...filmAssets.map(f => 'dist/assets/exec/video/' + f)] : [];
const must = ['dist/assets/img/fallback-athar.svg', 'dist/js/img-guard.js', 'dist/assets/img/lebanon-one-million-ai-experts-20260925.jpg', 'dist/assets/img/lebanon-one-million-ai-experts-20260925.webp', 'dist/assets/tour/video/athar-os-launch-30s.mp4', 'dist/assets/tour/video/athar-os-launch-30s-poster.jpg', 'dist/assets/intro/v1.4.2/intro.mp4', 'dist/assets/plates/plate5-banner.webp', 'dist/assets/impact/v133/t1-licences.webp', 'dist/assets/impact/v133/t2-ai-pc-composited.webp', 'dist/assets/impact/v133/t3-data-centre-composited.webp', /* v1.5.5 */ 'dist/assets/plates/plate5-concept-v157-1x.webp', 'dist/assets/plates/plate5-concept-v157-2x.webp', 'dist/assets/plates/plate5-concept-v157-1x.jpg', 'dist/assets/plates/plate5-concept-v157-2x.jpg', 'dist/partners/review/mastercard-foundation__full-colour.png', 'dist/js/exec-team.js', 'dist/assets/exec-team.css', 'dist/assets/exec/athar-logo-master-1200.png', 'dist/audio/guide/slides/NAR-s40-s-exec-intro.mp3', 'dist/audio/guide/slides/NAR-s43-s-exec-khalid.mp3', 'dist/audio/guide/slides/NAR-s44-s-exec-unwalla.mp3', 'dist/assets/exec/letter-texture-ksV8ASq6b2.webp', 'dist/audio/guide/slides/NAR-s42-s-exec-al-ameri.mp3'];
must.push(...filmMust);
for (const f of must) { const p = path.join(ROOT, f); if (!fs.existsSync(p) || fs.statSync(p).size === 0) fail('required asset missing or empty: ' + f); }
/* v1.5.7 gate: with originsFilm OFF no served text file may carry the film's names, paths or captions */
if (!FEAT.originsFilm) {
  const bad = /origins[- ]of[- ]impact|\bep01\b|Episode 01|أصول الأثر|الحلقة 01/i, hits = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const q = path.join(d, e.name); if (e.isDirectory()) walk(q); else if (/\.(html|js|css|json|vtt|txt|csv|md|svg|webmanifest)$/i.test(e.name) && bad.test(fs.readFileSync(q, 'utf8'))) hits.push(path.relative(ROOT, q)); } })(DIST);
  if (hits.length) fail('originsFilm is off but film strings are still served in: ' + hits.join(', '));
}
const gate = spawnSync(process.execPath, [path.join(ROOT, 'scripts/check-assets.mjs'), '--dist', DIST, '--quiet'], { stdio: 'inherit' });
if (gate.status !== 0) fail('check-assets gate failed (exit ' + gate.status + ')');
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else files.push(p); } })(DIST);
files.sort(); const lines = files.map(f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') + '  ./' + path.relative(ROOT, f).split(path.sep).join('/'));
fs.writeFileSync(path.join(ROOT, 'SHA256SUMS.txt'), lines.join('\n') + '\n');
console.log(`build v${V}: features ${JSON.stringify(FEAT.originsFilm ? { originsFilm: true } : { originsFilm: false })}, versions OK, ${must.length} required assets present, check-assets gate PASS, SHA256SUMS.txt regenerated over dist/ (${files.length} files)`);
