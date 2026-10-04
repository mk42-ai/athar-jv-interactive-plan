#!/usr/bin/env node
/* v1.4.7 build: (1) version gate — every runtime module and index.html must carry v1.4.7; (2) hard asset gate — every image/video/font
   referenced by dist/ must exist locally and be non-empty (delegated to scripts/check-assets.mjs, also run as prebuild/postbuild);
   (3) regenerate SHA256SUMS.txt over dist/ (sorted, sha256sum -c compatible). Exits non-zero on any failure — FAIL LOUD. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { spawnSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..'); const DIST = path.join(ROOT, 'dist');
const fail = (m) => { console.error('BUILD FAIL: ' + m); process.exit(1); };
const V = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const need = { 'dist/index.html': [`data-deck-version="${V}"`], 'dist/js/impact-tiers.js': [`var VERSION = 'v${V}'`], 'dist/js/athar-os.js': [`var VERSION = 'v${V}'`], 'dist/js/img-guard.js': [`version: 'v${V}'`], 'dist/js/video-player.js': [`var VERSION = 'v${V}'`], 'dist/js/exec-team.js': [`var VERSION = 'v${V}'`], 'dist/js/narration.js': [`var VERSION = 'v${V}'`], 'dist/js/exec-film-player.js': [`var VERSION = 'v${V}'`], 'dist/js/intro-gate.js': [`var VERSION = 'v${V}'`], 'dist/js/brand-section.js': [`var VERSION = 'v${V}'`], 'dist/assets/brand-section.css': [`v${V}`], 'dist/locales/impact-tiers.en.json': [`"version": "${V}"`], 'dist/locales/impact-tiers.ar.json': [`"version": "${V}"`] };
for (const [f, lits] of Object.entries(need)) { const p = path.join(ROOT, f); if (!fs.existsSync(p)) fail('missing ' + f); const s = fs.readFileSync(p, 'utf8'); for (const l of lits) if (!s.includes(l)) fail(`${f} does not carry ${l}`); }
/* v1.5.9 feature flag (pact-deck/features.json → execFilms, replaces v1.5.7's originsFilm): sync dist/ to the flag BEFORE the gates run — idempotent, so a committed dist/
   and a fresh Vercel build agree. The source of truth is features/exec-films/films.json (one entry per Section 09 card; status 'shipped' | 'coming-soon').
   ON  → dist/js/exec-films.js is GENERATED from films.json (window.AtharExecFilms, absolute dist paths), every shipped film's assets/<person>/ folder is copied to
         dist/assets/exec/films/<person>/, and <script src="/js/exec-films.js"> is injected before exec-team.js in dist/index.html (the shared player module
         dist/js/exec-film-player.js is a permanent runtime module and ships either way — it also renders the "Film coming soon" ready slots).
   OFF → the generated file, the film folders and the tag are removed from dist/ and the gate below proves no film string is served. */
const FEAT = JSON.parse(fs.readFileSync(path.join(ROOT, 'features.json'), 'utf8'));
if (typeof FEAT.execFilms !== 'boolean') fail('features.json: execFilms must be true or false');
const FILMS_SRC = path.join(ROOT, 'features/exec-films'), FILMS_JS = path.join(DIST, 'js/exec-films.js'), FILMS_DIST = path.join(DIST, 'assets/exec/films'), FILMS_TAG = `<script src="/js/exec-films.js?v=${V}" data-v159="exec-films"></script>`; /* v1.6.3: version query on the tag (see stampAssetVersions) */
const FILMS = JSON.parse(fs.readFileSync(path.join(FILMS_SRC, 'films.json'), 'utf8'));
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
/* v1.6.3: every non-content-addressed script/stylesheet reference in index.html carries ?v=<version> (re-stamped on each build, idempotent), so a browser that cached
   an older /js/*.js or /assets/*.css under an earlier max-age policy misses that cache the moment the (no-store) index.html of the new build is loaded. Vite's /assets/index-<hash>.* are already content-addressed and untouched. */
const stampAssetVersions = (html) => html.replace(/((?:src|href)=")(\/(?:js|assets)\/[^"?#]+\.(?:js|css))(?:\?v=[^"#]*)?(")/g, (m, a, p, b) => /^\/assets\/index-[A-Za-z0-9_-]+\.(?:js|css)$/.test(p) ? m : `${a}${p}?v=${V}${b}`);
indexHtml = stampAssetVersions(indexHtml);
const filmMust = [];
if (FEAT.execFilms) {
  const out = { version: FILMS.version, generated: 'scripts/v1.4.7/build.mjs from features/exec-films/films.json', films: {} };
  for (const [id, f] of Object.entries(FILMS.films)) {
    if (f.status !== 'shipped') { out.films[id] = { status: f.status || 'coming-soon', person: f.person || null }; continue; }
    const dir = path.join(FILMS_SRC, 'assets', id); if (!fs.existsSync(dir)) fail(`films.json: ${id} is 'shipped' but features/exec-films/assets/${id}/ is missing`);
    const abs = (rel) => rel ? FILMS.distBase + rel : null;
    for (const [k, want] of [['mp4', f.mp4Sha256], ['mp4Mobile', f.mp4MobileSha256], ['poster', f.posterSha256], ['posterWebp', null]]) {
      if (!f[k]) { if (k === 'mp4' || k === 'poster') fail(`films.json: ${id} has no ${k}`); continue; }
      const src = path.join(FILMS_SRC, 'assets', f[k]); if (!fs.existsSync(src) || !fs.statSync(src).size) fail(`films.json: ${id}.${k} → ${f[k]} missing or empty`);
      if (want && sha(src) !== want) fail(`films.json: ${id}.${k} sha256 mismatch (${f[k]})`);
    }
    for (const lg of ['en', 'ar']) { const rel = f.captions && f.captions[lg]; if (!rel) fail(`films.json: ${id} has no ${lg} captions`); const src = path.join(FILMS_SRC, 'assets', rel); if (!fs.existsSync(src) || !/^WEBVTT/.test(fs.readFileSync(src, 'utf8'))) fail(`films.json: ${id} ${lg} captions missing or not WebVTT (${rel})`); if (f.captionsSha256 && f.captionsSha256[lg] && sha(src) !== f.captionsSha256[lg]) fail(`films.json: ${id} ${lg} captions sha256 mismatch`); }
    fs.mkdirSync(path.join(FILMS_DIST, id), { recursive: true });
    for (const name of fs.readdirSync(dir)) { fs.copyFileSync(path.join(dir, name), path.join(FILMS_DIST, id, name)); filmMust.push('dist/assets/exec/films/' + id + '/' + name); }
    out.films[id] = { status: 'shipped', person: f.person, title: f.title, aria: f.aria || null, bodyExtra: f.bodyExtra || null, mp4: abs(f.mp4), mp4Mobile: abs(f.mp4Mobile), poster: abs(f.poster), posterWebp: abs(f.posterWebp), posterTimeSec: f.posterTimeSec,
      vttEn: abs(f.captions.en), vttAr: abs(f.captions.ar), durationSec: f.durationSec, durationLabel: f.durationLabel, inPt: f.inPt || 0, outPt: f.outPt || f.durationSec, w: f.w, h: f.h, sha256: f.mp4Sha256, note: f.cardNote || null /* v1.6.2: per-film caption note (EN/AR) */ };
  }
  fs.writeFileSync(FILMS_JS, `/* Athar deck v${V} — GENERATED by scripts/v1.4.7/build.mjs from pact-deck/features/exec-films/films.json. Do not edit: edit films.json and rebuild.\n   window.AtharExecFilms → read by dist/js/exec-team.js; a 'shipped' entry renders the shared player (dist/js/exec-film-player.js), anything else the ready slot. */\nwindow.AtharExecFilms = ${JSON.stringify(out, null, 1)};\n`);
  filmMust.push('dist/js/exec-films.js');
  indexHtml = indexHtml.replace(/<script src="\/js\/exec-films\.js(?:\?v=[^"]*)?" data-v159="exec-films"><\/script>/g, FILMS_TAG);
  if (!indexHtml.includes(FILMS_TAG)) { const m = /<script[^>]*src="\/js\/exec-team\.js(?:\?v=[^"]*)?"[^>]*><\/script>/.exec(indexHtml); if (!m) fail('index.html: exec-team.js script tag not found'); indexHtml = indexHtml.replace(m[0], FILMS_TAG + m[0]); }
} else {
  fs.rmSync(FILMS_JS, { force: true }); fs.rmSync(FILMS_DIST, { recursive: true, force: true });
  indexHtml = indexHtml.replace(/<script src="\/js\/exec-films\.js(?:\?v=[^"]*)?" data-v159="exec-films"><\/script>/g, '');
}
for (const legacy of ['dist/js/exec-film.js', 'dist/assets/exec/video']) fs.rmSync(path.join(ROOT, legacy), { recursive: true, force: true }); /* v1.5.7 layout — never served alongside v1.5.9 */
fs.writeFileSync(path.join(DIST, 'index.html'), indexHtml);
/* v1.7.1: Section 10 Branding (slides 46–48) — features/brand → dist/assets/brand/**, dist/js/brand-data.js, dist/assets/brand-fonts.css */
const { syncBrand } = await import('../v1.7.1/brand-sync.mjs');
const BRAND = syncBrand({ ROOT, DIST, V, fail });
const must = ['dist/assets/img/fallback-athar.svg', 'dist/js/img-guard.js', 'dist/assets/img/lebanon-one-million-ai-experts-20260925.jpg', 'dist/assets/img/lebanon-one-million-ai-experts-20260925.webp', 'dist/assets/tour/video/athar-os-launch-30s.mp4', 'dist/assets/tour/video/athar-os-launch-30s-poster.jpg', 'dist/assets/intro/v1.4.2/intro.mp4', 'dist/assets/plates/plate5-banner.webp', 'dist/assets/impact/v133/t1-licences.webp', 'dist/assets/impact/v133/t2-ai-pc-composited.webp', 'dist/assets/impact/v133/t3-data-centre-composited.webp', /* v1.5.5 */ 'dist/assets/plates/plate5-concept-v157-1x.webp', 'dist/assets/plates/plate5-concept-v157-2x.webp', 'dist/assets/plates/plate5-concept-v157-1x.jpg', 'dist/assets/plates/plate5-concept-v157-2x.jpg', 'dist/partners/review/mastercard-foundation__full-colour.png', 'dist/js/exec-team.js', 'dist/assets/exec-team.css', 'dist/assets/exec/athar-logo-master-1200.png', 'dist/audio/guide/slides/NAR-s40-s-exec-intro.mp3', 'dist/audio/guide/slides/NAR-s43-s-exec-khalid.mp3', 'dist/audio/guide/slides/NAR-s44-s-exec-unwalla.mp3', 'dist/assets/exec/letter-texture-ksV8ASq6b2.webp', 'dist/audio/guide/slides/NAR-s42-s-exec-al-ameri.mp3', /* v1.5.8 */ 'dist/audio/guide/slides/NAR-s45-s-exec-ferreira-da-cunha.mp3', 'dist/assets/plates/plate5-lebanon-v158-1x.webp', 'dist/assets/plates/plate5-lebanon-v158-2x.webp', 'dist/assets/plates/plate5-lebanon-v158-1x.jpg', 'dist/assets/plates/plate5-lebanon-v158-2x.jpg', /* v1.6.1 */ 'dist/assets/plates/plate5-india-v161-1x.webp', 'dist/assets/plates/plate5-india-v161-2x.webp', 'dist/assets/plates/plate5-india-v161-1x.jpg', 'dist/assets/plates/plate5-india-v161-2x.jpg', 'dist/assets/plates/plate5-kenya-v161-1x.webp', 'dist/assets/plates/plate5-kenya-v161-2x.webp', 'dist/assets/plates/plate5-kenya-v161-1x.jpg', 'dist/assets/plates/plate5-kenya-v161-2x.jpg'];
must.push('dist/js/exec-film-player.js', 'dist/assets/exec-film-player.css', ...filmMust);
must.push('dist/js/brand-section.js', 'dist/assets/brand-section.css', ...BRAND.must); /* v1.7.1 */
for (const f of must) { const p = path.join(ROOT, f); if (!fs.existsSync(p) || fs.statSync(p).size === 0) fail('required asset missing or empty: ' + f); }
/* v1.5.7 gate (kept): with execFilms OFF no served text file may carry the film's names, paths or captions */
if (!FEAT.execFilms) {
  const bad = /origins[- ]of[- ]impact|\bep01\b|Episode 01|أصول الأثر|الحلقة 01/i, hits = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const q = path.join(d, e.name); if (e.isDirectory()) walk(q); else if (/\.(html|js|css|json|vtt|txt|csv|md|svg|webmanifest)$/i.test(e.name) && bad.test(fs.readFileSync(q, 'utf8'))) hits.push(path.relative(ROOT, q)); } })(DIST);
  if (hits.length) fail('execFilms is off but film strings are still served in: ' + hits.join(', '));
}
const gate = spawnSync(process.execPath, [path.join(ROOT, 'scripts/check-assets.mjs'), '--dist', DIST, '--quiet'], { stdio: 'inherit' });
if (gate.status !== 0) fail('check-assets gate failed (exit ' + gate.status + ')');
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (!(d === DIST && e.name === 'build-info.json')) files.push(p); } })(DIST); /* v1.5.9: build-info.json is generated per build (git-ignored) — SHA256SUMS covers the committed dist/ */
files.sort(); const lines = files.map(f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') + '  ./' + path.relative(ROOT, f).split(path.sep).join('/'));
fs.writeFileSync(path.join(ROOT, 'SHA256SUMS.txt'), lines.join('\n') + '\n');
const shipped = Object.entries(FILMS.films).filter(([, f]) => f.status === 'shipped').map(([id]) => id), slots = Object.entries(FILMS.films).filter(([, f]) => f.status !== 'shipped').map(([id]) => id);
console.log(`build v${V}: brand section — ${BRAND.assets} hashed assets (${BRAND.sets} gallery sets), ${BRAND.faces} font faces, manifest ${BRAND.counts.rows} rows; features ${JSON.stringify({ execFilms: FEAT.execFilms })} (films shipped: ${shipped.join(', ') || 'none'}; ready slots: ${slots.join(', ') || 'none'}), versions OK, ${must.length} required assets present, check-assets gate PASS, SHA256SUMS.txt regenerated over dist/ (${files.length} files)`);
