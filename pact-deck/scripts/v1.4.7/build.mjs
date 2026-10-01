#!/usr/bin/env node
/* v1.4.7 build (required-asset list updated for v1.5.4): (1) version gate — every runtime module and index.html must carry v1.4.7; (2) hard asset gate — every image/video/font
   referenced by dist/ must exist locally and be non-empty (delegated to scripts/check-assets.mjs, also run as prebuild/postbuild);
   (3) regenerate SHA256SUMS.txt over dist/ (sorted, sha256sum -c compatible). Exits non-zero on any failure — FAIL LOUD. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { spawnSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..'); const DIST = path.join(ROOT, 'dist');
const fail = (m) => { console.error('BUILD FAIL: ' + m); process.exit(1); };
const V = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const need = { 'dist/index.html': [`data-deck-version="${V}"`], 'dist/js/impact-tiers.js': [`var VERSION = 'v${V}'`], 'dist/js/athar-os.js': [`var VERSION = 'v${V}'`], 'dist/js/img-guard.js': [`version: 'v${V}'`], 'dist/js/video-player.js': [`var VERSION = 'v${V}'`], 'dist/locales/impact-tiers.en.json': [`"version": "${V}"`], 'dist/locales/impact-tiers.ar.json': [`"version": "${V}"`] };
for (const [f, lits] of Object.entries(need)) { const p = path.join(ROOT, f); if (!fs.existsSync(p)) fail('missing ' + f); const s = fs.readFileSync(p, 'utf8'); for (const l of lits) if (!s.includes(l)) fail(`${f} does not carry ${l}`); }
const must = ['dist/assets/img/fallback-athar.svg', 'dist/js/img-guard.js', 'dist/assets/img/lebanon-one-million-ai-experts-20260925.jpg', 'dist/assets/img/lebanon-one-million-ai-experts-20260925.webp', 'dist/assets/tour/video/athar-os-launch-30s.mp4', 'dist/assets/tour/video/athar-os-launch-30s-poster.jpg', 'dist/assets/intro/v1.4.2/intro.mp4', 'dist/assets/plates/v154/ownership-montage.png', 'dist/assets/plates/v154/ownership-montage.webp', 'dist/assets/plates/v154/ownership-montage.avif', 'dist/assets/impact/v154/t1-lebanon-licences.png', 'dist/assets/impact/v154/t1-lebanon-licences.webp', 'dist/assets/impact/v154/t1-lebanon-licences.avif', 'dist/assets/impact/v154/t2-india-ai-pc.png', 'dist/assets/impact/v154/t2-india-ai-pc.webp', 'dist/assets/impact/v154/t2-india-ai-pc.avif', 'dist/assets/impact/v154/t3-kenya-node.png', 'dist/assets/impact/v154/t3-kenya-node.webp', 'dist/assets/impact/v154/t3-kenya-node.avif', 'dist/assets/news/marks/publisher-pib-official.png', 'dist/assets/release-v154.css']; /* v1.5.4: the served slide-29/30/38 assets */
for (const f of must) { const p = path.join(ROOT, f); if (!fs.existsSync(p) || fs.statSync(p).size === 0) fail('required asset missing or empty: ' + f); }
const gate = spawnSync(process.execPath, [path.join(ROOT, 'scripts/check-assets.mjs'), '--dist', DIST, '--quiet'], { stdio: 'inherit' });
if (gate.status !== 0) fail('check-assets gate failed (exit ' + gate.status + ')');
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else files.push(p); } })(DIST);
files.sort(); const lines = files.map(f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') + '  ./' + path.relative(ROOT, f).split(path.sep).join('/'));
fs.writeFileSync(path.join(ROOT, 'SHA256SUMS.txt'), lines.join('\n') + '\n');
console.log(`build v${V}: versions OK, ${must.length} required assets present, check-assets gate PASS, SHA256SUMS.txt regenerated over dist/ (${files.length} files)`);
