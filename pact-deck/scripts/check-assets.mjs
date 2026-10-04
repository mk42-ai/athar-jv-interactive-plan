#!/usr/bin/env node
/* Athar deck — v1.4.7 image/asset gate. Parses dist/ HTML, CSS, JS, JSON (locales, manifests, credits), SVG and the web manifest,
   resolves every image/video/font reference against dist/, and exits 1 on: MISSING, ZERO-BYTE, CASE-MISMATCH, URL-ENCODING-MISMATCH,
   EXTERNAL-HOTLINK (any http(s):// image/video), and static <img> in HTML lacking width/height/alt. Dynamic prefixes ('/assets/x/' + name)
   are reported as DYNAMIC-PREFIX and then RESOLVED through the module manifests (TIER_IMG dir/file|base+ext, NEWS mark:, api MARKS file:,
   icon-pack words, real-screens SCREENS × light/dark × en/ar × @1x/@2x, stills + -960.webp thumbs, athar-os STILL_MAP, BASE + 'literal')
   as dynamic-* refs that fail the gate when the composed file is absent (this is the class of hole that let map-uae-arcs.jpg through in v1.4.6). Usage: node scripts/check-assets.mjs [--dist dist] [--json out.json] [--csv out.csv] [--quiet] */
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i === -1 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const DIST = path.resolve(String(opt('--dist', 'dist')));
const QUIET = !!opt('--quiet', false), JSON_OUT = opt('--json', null), CSV_OUT = opt('--csv', null);
const IMG_EXT = /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i, MEDIA_EXT = /\.(png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|vtt|woff2?|json|webmanifest)$/i;
const refs = []; const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name === '_unreferenced') continue; walk(p); } else files.push(p); } })(DIST);
const rel = p => path.relative(DIST, p).split(path.sep).join('/');
const lower = new Map(); for (const f of files) lower.set(rel(f).toLowerCase(), rel(f));
function add(src, line, kind, raw, ctx) { refs.push({ ref_source_file: rel(src), line, kind, raw_reference: raw, ctx: (ctx || '').slice(0, 120) }); }
function lineOf(text, idx) { let n = 1; for (let i = 0; i < idx && i < text.length; i++) if (text.charCodeAt(i) === 10) n++; return n; }
const RE_URL = /url\(\s*(['"]?)([^'")\s]+)\1\s*\)/g;
for (const f of files) {
  const r = rel(f); const ext = path.extname(f).toLowerCase(); if (!['.html', '.css', '.js', '.mjs', '.json', '.webmanifest', '.svg', '.vtt'].includes(ext)) continue;
  let text; try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
  let m;
  if (ext === '.html' || ext === '.svg') {
    const RE_TAG = /<(img|source|video|link|meta|image|use|track)\b([^>]*)>/gi;
    while ((m = RE_TAG.exec(text))) {
      const tag = m[1].toLowerCase(), attrs = m[2], at = (n) => { const mm = new RegExp('(?:^|\\s)' + n + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(attrs); return mm ? (mm[2] ?? mm[3] ?? mm[4]) : null; };
      const ln = lineOf(text, m.index);
      if (tag === 'img') { const s = at('src'); if (s) add(f, ln, 'img-src', s, m[0]); const ss = at('srcset'); if (ss) ss.split(',').forEach(c => { const u = c.trim().split(/\s+/)[0]; if (u) add(f, ln, 'img-srcset', u, m[0]); });
        if (ext === '.html') { const alt = at('alt'); const role = (at('role') || '').toLowerCase(); const ah = (at('aria-hidden') || '').toLowerCase(); if (alt === null) add(f, ln, 'MISSING-ALT', s || '', m[0]); else if (alt === '' && role !== 'presentation' && ah !== 'true') add(f, ln, 'EMPTY-ALT-NOT-DECORATIVE', s || '', m[0]); if (!at('width') || !at('height')) add(f, ln, 'MISSING-DIMENSIONS', s || '', m[0]); } }
      else if (tag === 'source') { const ss = at('srcset'); if (ss) ss.split(',').forEach(c => { const u = c.trim().split(/\s+/)[0]; if (u) add(f, ln, 'source-srcset', u, m[0]); }); const s = at('src'); if (s) add(f, ln, 'source-src', s, m[0]); }
      else if (tag === 'video') { const p = at('poster'); if (p) add(f, ln, 'video-poster', p, m[0]); const s = at('src'); if (s) add(f, ln, 'video-src', s, m[0]); }
      else if (tag === 'track') { const s = at('src'); if (s) add(f, ln, 'track-src', s, m[0]); }
      else if (tag === 'link') { const relv = (at('rel') || '').toLowerCase(); const h = at('href'); if (h && /(icon|apple-touch-icon|manifest|preload|stylesheet)/.test(relv)) add(f, ln, 'link-' + (relv.split(/\s+/)[0] || 'href'), h, m[0]); }
      else if (tag === 'meta') { const prop = (at('property') || at('name') || '').toLowerCase(); const c = at('content'); if (c && /^(og:image|og:image:url|og:image:secure_url|twitter:image|msapplication-tileimage)$/.test(prop)) add(f, ln, 'meta-image', c, m[0]); }
      else if (tag === 'image' || tag === 'use') { const h = at('href') || at('xlink:href'); if (h && !h.startsWith('#')) add(f, ln, 'svg-' + tag, h, m[0]); }
    }
    const RE_STYLE = /style\s*=\s*"([^"]*)"/gi; while ((m = RE_STYLE.exec(text))) { let mm; RE_URL.lastIndex = 0; while ((mm = RE_URL.exec(m[1]))) add(f, lineOf(text, m.index), 'inline-style-url', mm[2], m[0]); }
    const RE_STYLEBLK = /<style[^>]*>([\s\S]*?)<\/style>/gi; while ((m = RE_STYLEBLK.exec(text))) { let mm; const re2 = new RegExp(RE_URL.source, 'g'); while ((mm = re2.exec(m[1]))) add(f, lineOf(text, m.index + mm.index), 'style-block-url', mm[2], mm[0]); }
  }
  if (ext === '.css') { const re2 = new RegExp(RE_URL.source, 'g'); while ((m = re2.exec(text))) add(f, lineOf(text, m.index), 'css-url', m[2], m[0]); }
  if (ext === '.js' || ext === '.mjs' || ext === '.html') {
    const body = ext === '.html' ? (text.match(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi) || []).join('\n') : text;
    const RE_STR = /(['"`])((?:\/|\.\.?\/)[^'"`\s<>]+?)\1/g;
    while ((m = RE_STR.exec(body))) { const s = m[2]; if (MEDIA_EXT.test(s.split('?')[0].split('#')[0])) add(f, ext === '.html' ? 0 : lineOf(text, m.index), 'js-string', s, m[0]); else if (/^\/(assets|brand|partners|video|fonts|locales|captions)\/[^'"]*\/$/.test(s)) add(f, ext === '.html' ? 0 : lineOf(text, m.index), 'DYNAMIC-PREFIX', s, m[0]); }
    const RE_HTTP = /(['"`])(https?:\/\/[^'"`\s<>]+\.(?:png|jpe?g|webp|avif|gif|svg|ico|mp4|webm))\1/gi; while ((m = RE_HTTP.exec(body))) add(f, ext === '.html' ? 0 : lineOf(text, m.index), 'js-string-external', m[2], m[0]);
  }
  if (ext === '.json' || ext === '.webmanifest') {
    const RE_JSTR = /"((?:\/|\.\.?\/)[^"\s]+?)"/g; while ((m = RE_JSTR.exec(text))) { const s = m[1]; if (MEDIA_EXT.test(s.split('?')[0])) add(f, lineOf(text, m.index), 'json-string', s, m[0]); }
    const RE_HTTPJ = /"(https?:\/\/[^"\s]+\.(?:png|jpe?g|webp|avif|gif|svg|ico|mp4|webm))"/gi; while ((m = RE_HTTPJ.exec(text))) add(f, lineOf(text, m.index), 'json-string-external', m[1], m[0]);
  }
}
const known = new Set(files.map(rel));
// ---------- dynamic pass: compose the runtime-built image paths from the module manifests ----------
function addDyn(src, kind, composed, ctx) { refs.push({ ref_source_file: rel(src), line: 0, kind, raw_reference: composed, ctx: (ctx || '').slice(0, 120), dynamic: true }); }
for (const f of files) {
  const r = rel(f); if (!/\.(js|mjs)$/.test(r)) continue; const text = fs.readFileSync(f, 'utf8'); let m;
  // (a) TIER_IMG-style manifests: {"dir": "x", "file": "y.png"} and {"dir": "x", "base": "y", "ext": "png"} → /assets/<dir>/…
  const RE_DF = /\{\s*"dir"\s*:\s*"([^"]+)"\s*,\s*"file"\s*:\s*"([^"]+)"/g; while ((m = RE_DF.exec(text))) addDyn(f, 'dynamic-manifest-file', `/assets/${m[1]}/${m[2]}`, m[0]);
  const RE_DB = /\{\s*"dir"\s*:\s*"([^"]+)"\s*,\s*"base"\s*:\s*"([^"]+)"\s*,\s*"ext"\s*:\s*"([^"]+)"/g; while ((m = RE_DB.exec(text))) { addDyn(f, 'dynamic-manifest-base', `/assets/${m[1]}/${m[2]}.${m[3]}`, m[0]); addDyn(f, 'dynamic-manifest-webp', `/assets/${m[1]}/${m[2]}.webp`, m[0]); }
  // (b) news publisher / partner marks: mark: 'x.png' → /assets/news/marks/x.png
  if (text.includes("'/assets/news/marks/' + ")) { const RE_MK = /\bmark:\s*'([^']+\.(?:png|jpe?g|webp|svg))'/g; while ((m = RE_MK.exec(text))) addDyn(f, 'dynamic-news-mark', `/assets/news/marks/${m[1]}`, m[0]); }
  // (c) API marks: MARKS = {"key": {"file": "api-x.png"…}} with '/assets/api/' + mk.file
  if (text.includes("'/assets/api/' + ")) { const RE_AF = /"file"\s*:\s*"(api-[^"]+)"/g; while ((m = RE_AF.exec(text))) addDyn(f, 'dynamic-api-mark', `/assets/api/${m[1]}`, m[0]); }
  // (d) icon-pack words: icon: 'community' with '/brand/icons/pack/' + …icon → /brand/icons/pack/<word>.png
  if (text.includes("'/brand/icons/pack/' + ")) { const RE_IC = /\bicon:\s*'([a-z][a-z0-9-]*)'/g; while ((m = RE_IC.exec(text))) addDyn(f, 'dynamic-icon-pack', `/brand/icons/pack/${m[1]}.png`, m[0]); }
  // (e) real-screens: SCREENS keys × light/dark × en/ar × @1x/@2x under BASE + 'screens/'
  if (text.includes("'screens/' + key + '-' + theme + '-' + lang")) { const blk = /var SCREENS = \{([\s\S]*?)\n\s*\};/.exec(text); if (blk) { const keys = [...blk[1].matchAll(/^\s*'([a-z0-9-]+)'\s*:/gm)].map(x => x[1]); for (const k of keys) for (const th of ['light', 'dark']) for (const lg of ['en', 'ar']) for (const d of ['1x', '2x']) addDyn(f, 'dynamic-tour-screen', `/assets/tour/screens/${k}-${th}-${lg}@${d}.png`, `SCREENS.${k}`); } }
  // (f) stills: every 'kf-NNNN.png' / 'pNN.png' / 'poster.png' literal used with BASE + 'stills/' → the PNG and its -960.webp thumb
  if (text.includes("'stills/' + ")) { const RE_ST = /'((?:kf-\d{4}|p\d{2}|poster)\.png)'/g; const seen = new Set(); while ((m = RE_ST.exec(text))) { if (seen.has(m[1])) continue; seen.add(m[1]); addDyn(f, 'dynamic-tour-still', `/assets/tour/stills/${m[1]}`, m[0]); addDyn(f, 'dynamic-tour-still-webp', `/assets/tour/stills/${m[1].replace(/\.png$/, '')}-960.webp`, m[0]); } }
  // (g) athar-os STILL_MAP values → stills rendered through the real-screens still() helper
  const sm = /var STILL_MAP = \{([^}]*)\}/.exec(text); if (sm) { const RE_SV = /'([^']+\.png)'/g; while ((m = RE_SV.exec(sm[1]))) { addDyn(f, 'dynamic-still-map', `/assets/tour/stills/${m[1]}`, m[0]); addDyn(f, 'dynamic-still-map-webp', `/assets/tour/stills/${m[1].replace(/\.png$/, '')}-960.webp`, m[0]); } }
  // (i) Vite bundle video templates: `/video/${t}.mp4|webm|-poster.png` with t ∈ the 'V<n>-<slug>' ids declared in the same bundle
  if (/\/video\/\$\{t\}/.test(text)) { const ids = new Set([...text.matchAll(/["'`](V\d-[a-z][a-z0-9-]*)["'`]/g)].map(x => x[1])); for (const id of ids) for (const suf of ['.mp4', '.webm', '-poster.png']) addDyn(f, 'dynamic-video-template', `/video/${id}${suf}`, '`/video/${t}' + suf + '`'); }
  // (h) BASE + 'literal' where BASE is a declared root-relative prefix (intro-gate, real-screens video/poster, …)
  const bm = /var BASE = '(\/[^']*\/)'/.exec(text); if (bm) { const RE_BL = /BASE \+ '([^']+\.(?:png|jpe?g|webp|svg|mp4|webm|vtt|ico))'/g; while ((m = RE_BL.exec(text))) addDyn(f, 'dynamic-base-literal', bm[1] + m[1], m[0]); }
}

const PROVENANCE = /(^|\/)(credits|manifest|provenance|download-manifest|tour-assets|video-manifest)\.json$/;
for (const r of refs) {
  const raw = r.raw_reference;
  if (PROVENANCE.test(r.ref_source_file) && /^(https?:)?\/\//i.test(raw)) { r.status = 'PROVENANCE-EXTERNAL-INFO'; continue; }
  if (PROVENANCE.test(r.ref_source_file) && /^\/tmp\//.test(raw)) { r.status = 'PROVENANCE-BUILD-PATH-INFO'; continue; }
  if (/\$\{/.test(raw)) { r.status = 'DYNAMIC-TEMPLATE'; continue; }
  if (['MISSING-ALT', 'EMPTY-ALT-NOT-DECORATIVE', 'MISSING-DIMENSIONS', 'DYNAMIC-PREFIX'].includes(r.kind)) { r.status = r.kind; continue; }
  if (/^data:/i.test(raw)) { r.status = 'DATA-URI'; continue; }
  if (/^(https?:)?\/\//i.test(raw)) { r.status = IMG_EXT.test(raw.split('?')[0]) || /\.(mp4|webm)$/i.test(raw.split('?')[0]) ? 'EXTERNAL-HOTLINK' : 'EXTERNAL-OTHER'; continue; }
  if (/^(mailto:|tel:|javascript:|#)/i.test(raw)) { r.status = 'SKIP'; continue; }
  let clean = raw.split('?')[0].split('#')[0]; let target;
  if (clean.startsWith('/')) target = clean.slice(1); else target = path.posix.normalize(path.posix.join(path.posix.dirname(r.ref_source_file), clean));
  let dec = target; try { dec = decodeURIComponent(target); } catch {}
  const cand = [dec, target];
  let found = cand.find(c => known.has(c));
  if (found) { const sz = fs.statSync(path.join(DIST, found)).size; r.resolved_path = found; r.bytes = sz; r.status = sz === 0 ? 'ZERO-BYTE' : (r.dynamic ? 'DYNAMIC-OK' : 'OK'); if (found !== dec && found === target && dec !== target) r.status = r.status === 'OK' ? 'URL-ENCODING-MISMATCH' : r.status; continue; }
  const lc = lower.get(dec.toLowerCase()); if (lc) { r.resolved_path = lc; r.status = 'CASE-MISMATCH'; continue; }
  r.status = r.dynamic ? 'DYNAMIC-MISSING' : 'MISSING';
}
// unreferenced media in dist (informational)
const referenced = new Set(refs.filter(r => r.resolved_path).map(r => r.resolved_path));
const prefixes = refs.filter(r => r.kind === 'DYNAMIC-PREFIX').map(r => r.raw_reference.slice(1));
const unreferenced = files.map(rel).filter(p => MEDIA_EXT.test(p) && !/\.(json|webmanifest|vtt)$/.test(p) && !referenced.has(p) && !prefixes.some(pf => p.startsWith(pf)));
const counts = {}; for (const r of refs) counts[r.status] = (counts[r.status] || 0) + 1;
const bad = ['MISSING', 'DYNAMIC-MISSING', 'ZERO-BYTE', 'CASE-MISMATCH', 'URL-ENCODING-MISMATCH', 'EXTERNAL-HOTLINK', 'MISSING-ALT', 'EMPTY-ALT-NOT-DECORATIVE', 'MISSING-DIMENSIONS'];
const failures = refs.filter(r => bad.includes(r.status));
if (!QUIET) {
  for (const st of Object.keys(counts).sort()) { if (st === 'OK' || st === 'DYNAMIC-OK') continue; console.log(`\n== ${st} (${counts[st]}) ==`); for (const r of refs.filter(x => x.status === st).slice(0, 400)) console.log(`  ${r.ref_source_file}:${r.line}  [${r.kind}]  ${r.raw_reference.length > 96 ? r.raw_reference.slice(0, 96) + '…(' + r.raw_reference.length + ' chars)' : r.raw_reference}${r.resolved_path && r.resolved_path !== r.raw_reference.replace(/^\//, '') ? '  -> ' + r.resolved_path : ''}`); }
  if (unreferenced.length) { console.log(`\n== UNREFERENCED media files in dist (${unreferenced.length}, informational) ==`); unreferenced.forEach(u => console.log('  ' + u)); }
}
const totals = `check-assets: refs=${refs.length} ok=${counts.OK || 0} dynamic-ok=${counts['DYNAMIC-OK'] || 0} missing=${(counts.MISSING || 0) + (counts['DYNAMIC-MISSING'] || 0)} zero=${counts['ZERO-BYTE'] || 0} case=${counts['CASE-MISMATCH'] || 0} enc=${counts['URL-ENCODING-MISMATCH'] || 0} external=${counts['EXTERNAL-HOTLINK'] || 0} alt=${(counts['MISSING-ALT'] || 0) + (counts['EMPTY-ALT-NOT-DECORATIVE'] || 0)} dims=${counts['MISSING-DIMENSIONS'] || 0} dynamic-prefix=${counts['DYNAMIC-PREFIX'] || 0} unreferenced=${unreferenced.length} -> ${failures.length ? 'FAIL' : 'PASS'}`;
if (QUIET && failures.length) for (const r of failures) console.log(`  FAIL ${r.status}  ${r.ref_source_file}:${r.line}  [${r.kind}]  ${r.raw_reference.slice(0, 120)}`);
console.log(totals);
if (JSON_OUT) fs.writeFileSync(String(JSON_OUT), JSON.stringify({ generated_utc: new Date().toISOString(), dist: DIST, totals, counts, refs, unreferenced }, null, 1));
if (CSV_OUT) fs.writeFileSync(String(CSV_OUT), 'ref_source_file,line,kind,raw_reference,resolved_path,status,bytes\n' + refs.map(r => [r.ref_source_file, r.line, r.kind, r.raw_reference, r.resolved_path || '', r.status, r.bytes ?? ''].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n') + '\n');
process.exit(failures.length ? 1 : 0);
