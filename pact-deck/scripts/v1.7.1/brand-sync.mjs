/* Athar deck v1.7.1 / v1.7.2 — build step for Section 10 "Brand" (slides 46 Foundations · 47 Typography · 48 Product & asset gallery). Called by scripts/v1.4.7/build.mjs.
   v1.7.2: gallery image SETS (1x/2x WebP + JPEG fallback [+ 2x PNG]) grouped by setId; the colour system is assembled from brand-tokens.json by NAME
   (v1.0 token list + moodboard accents) so no HEX is typed in any runtime file; the EN/AR primary faces (IBM Plex Sans / Sans Arabic Medium) get the
   fallback stacks as CSS custom properties in dist/assets/brand-fonts.css.
   Source of truth: pact-deck/features/brand/{brand.json, brand-tokens.json, assets.json, brand-asset-manifest.csv, assets/**}.
   • every file listed in assets.json is sha256-verified and copied to dist/assets/brand/<group>/<name>.<sha10>.<ext> (content-hashed → immutable)
   • dist/js/brand-data.js is GENERATED (window.AtharBrandData): palette + light/dark tokens straight from brand-tokens.json (no HEX is typed in any
     runtime file), the asset map, the measured logo geometry, the typography spec, the logo rules, the asset-pack counts computed from the
     supplied manifest CSV, the pending-items list and the narration clip ids
   • dist/assets/brand-fonts.css is GENERATED (@font-face for the self-hosted OFL faces, font-display: swap)
   Idempotent: a committed dist/ and a fresh Vercel build produce the same bytes. The guidelines PDF/DOCX are never read or copied here. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
export function syncBrand({ ROOT, DIST, V, fail }) {
  const SRC = path.join(ROOT, 'features/brand'), OUT = path.join(DIST, 'assets/brand');
  const rd = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
  const brand = rd('brand.json'), tokens = rd('brand-tokens.json'), assets = rd('assets.json');
  for (const [n, o] of [['brand.json', brand], ['brand-tokens.json', tokens], ['assets.json', assets]]) if (o.version !== V) fail(`features/brand/${n} carries version ${o.version}, package.json says ${V}`);
  const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  if (!/^#[0-9A-F]{6}$/.test(tokens.palette[0].hex) || tokens.palette.length !== 5) fail('brand-tokens.json: palette must hold the five sampled colours');
  /* ---- assets: verify + copy (fresh) ---- */
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const must = [], byId = {};
  for (const it of assets.items) {
    const src = path.join(SRC, 'assets', it.file); if (!fs.existsSync(src) || !fs.statSync(src).size) fail(`brand assets.json: ${it.file} missing or empty`);
    if (sha(src) !== it.sha256) fail(`brand assets.json: sha256 mismatch for ${it.file}`);
    if (!new RegExp('\\.' + it.sha256.slice(0, 10) + '\\.[a-z0-9]+$').test(it.file)) fail(`brand assets.json: ${it.file} is not content-hashed with its own sha256`);
    const dst = path.join(OUT, it.file); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); must.push('dist/assets/brand/' + it.file);
    byId[it.id] = { src: assets.distBase + it.file, w: it.w || null, h: it.h || null, bytes: it.bytes, sha256: it.sha256, label: it.label || null, variant: it.variant || null, kind: it.kind || it.group, caption: it.caption || null, source: it.source || null, page: it.page || null, family: it.family || null, weight: it.weight || null, style: it.style || null, setId: it.setId || null, role: it.role || null, logoComposite: it.logoComposite ? { method: it.logoComposite.method, zones: it.logoComposite.zones || null, placements: it.logoComposite.placements.length, placed: it.logoComposite.placements.map((q) => ({ x: q.x, y: q.y, w: q.w, h: q.h, variant: q.variant })) } : null };
  }
  /* v1.7.2: gallery sets — one entry per setId with the 1x / 2x WebP, the JPEG fallback and (wireframes) the 2x PNG */
  const sets = {};
  for (const it of assets.items) { if (!it.setId) continue; const g = sets[it.setId] || (sets[it.setId] = { setId: it.setId, label: it.label || null, kind: it.kind || null, caption: it.caption || null, source: it.source || null, page: it.page || null, logoComposite: byId[it.id].logoComposite, files: {} }); g.files[it.role] = { src: assets.distBase + it.file, w: it.w, h: it.h, bytes: it.bytes, sha256: it.sha256 }; }
  for (const [k, g] of Object.entries(sets)) for (const r of ['webp1x', 'webp2x', 'jpg']) if (!g.files[r]) fail(`brand assets.json: set ${k} lacks its ${r} file`);
  for (const lic of fs.readdirSync(path.join(SRC, 'assets/fonts')).filter((f) => /^OFL-.*\.txt$/.test(f))) { fs.copyFileSync(path.join(SRC, 'assets/fonts', lic), path.join(OUT, 'fonts', lic)); must.push('dist/assets/brand/fonts/' + lic); }
  /* ---- supplied manifest CSV → counts (computed at build time, never typed) ---- */
  const csv = fs.readFileSync(path.join(SRC, 'brand-asset-manifest.csv'), 'utf8').replace(/^\uFEFF/, '');
  const rows = []; { const lines = csv.split(/\r?\n/).filter(Boolean); const head = parse(lines[0]); for (const l of lines.slice(1)) { const c = parse(l); if (c.length === head.length) rows.push(Object.fromEntries(head.map((h, i) => [h, c[i]]))); } }
  function parse(line) { const out = []; let cur = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; }
  const count = (k) => { const m = {}; for (const r of rows) m[r[k] || '—'] = (m[r[k] || '—'] || 0) + 1; return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([key, n]) => ({ key, n })); };
  const manifestCounts = { rows: rows.length, entities: new Set(rows.map((r) => r.entity)).size, byFileType: count('file_type'), byAvailability: count('availability_status'), captureDate: (rows[0] && rows[0].utc_capture_timestamp || '').slice(0, 10), sha256: sha(path.join(SRC, 'brand-asset-manifest.csv')) };
  /* ---- colour system (v1.0 token names → HEX looked up by NAME in brand-tokens.json; moodboard accents from the palette) ---- */
  const byName = (arr, name) => { const hit = arr.find((t) => t.name === name); if (!hit) fail(`brand-tokens.json has no entry named '${name}'`); return hit; };
  const colourSystem = { note: brand.colourSystem.note, toneLines: brand.colourSystem.toneLines,
    tokens: brand.colourSystem.tokens.map((t) => { const tok = byName(tokens.superseded, t.token); const mb = t.moodboard ? byName(tokens.palette, t.moodboard) : null; return { ...t, hex: tok.hex, moodboardHex: mb ? mb.hex : null, moodboardShare: mb ? mb.sharePct : null }; }),
    accents: brand.colourSystem.accents.map((a) => { const p = byName(tokens.palette, a.name); return { ...a, hex: p.hex, sharePct: p.sharePct }; }) };
  /* ---- fonts css ---- */
  const faces = brand.fonts.faces.map((f) => { const a = byId[f.id]; if (!a) fail(`brand.json fonts: ${f.id} is not in assets.json`); return { ...f, src: a.src, bytes: a.bytes, sha256: a.sha256 }; });
  const prim = brand.fonts.primary || null;
  const css = `/* Athar deck v${V} — GENERATED by scripts/v1.7.1/brand-sync.mjs from features/brand (SIL OFL 1.1, self-hosted subsets; guidelines 4.5: woff2, font-display: swap). Do not edit. */\n` +
    faces.map((f) => `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(${f.src}) format("woff2")}`).join('\n') + '\n' +
    (prim ? `:root{--brand-font-en:${prim.en.stack};--brand-font-ar:${prim.ar.stack}}\n` : '');
  fs.writeFileSync(path.join(DIST, 'assets/brand-fonts.css'), css); must.push('dist/assets/brand-fonts.css');
  /* ---- data module ---- */
  const data = { version: V, generated: 'scripts/v1.7.1/brand-sync.mjs from pact-deck/features/brand', section: brand.section, guidelines: { document: brand.guidelines.document, classification: brand.guidelines.classification, pagesUsed: brand.guidelines.pagesUsed, pdfSha256: brand.guidelines.pdf.sha256 },
    tokens: { source: tokens.source, palette: tokens.palette, proportionOfUse: tokens.proportionOfUse, superseded: tokens.superseded, light: tokens.light, dark: tokens.dark, derived: tokens.derived, tokensFile: tokens.tokensFile },
    assets: byId, sets, colourSystem, personas: brand.personas || null, logoGeometry: assets.logoGeometry, fonts: { source: brand.fonts.source, faces, primary: prim, alreadyInDeck: brand.fonts.alreadyInDeck, fallbackNote: brand.fonts.fallbackNote }, typography: brand.typography, logo: brand.logo, pack: { name: brand.pack.name, storage: brand.pack.storage, logoFilesInPack: brand.pack.logoFilesInPack, suppliedTokenFile: brand.pack.suppliedTokenFile, suppliedManifest: brand.pack.suppliedManifest, pending: brand.pack.pending, manifestCounts }, narration: brand.narration };
  fs.writeFileSync(path.join(DIST, 'js/brand-data.js'), `/* Athar deck v${V} — GENERATED by scripts/v1.7.1/brand-sync.mjs from pact-deck/features/brand/{brand.json,brand-tokens.json,assets.json,brand-asset-manifest.csv}. Do not edit: edit the feature files and rebuild.\n   window.AtharBrandData — Section 10 "Brand" (slides 46–48): palette + tokens extracted from the guidelines, the reconciled colour system (v1.0 token names → HEX by name), content-hashed asset map + gallery sets, measured logo geometry, typography spec, logo rules, personas, supplied-manifest counts, pending items. */\nwindow.AtharBrandData = ${JSON.stringify(data)};\n`);
  must.push('dist/js/brand-data.js');
  return { must, counts: manifestCounts, assets: assets.items.length, sets: Object.keys(sets).length, faces: faces.length };
}
