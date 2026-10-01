// v1.5.5 QA screenshot matrix — Playwright + system Chromium: slides × {1440×900, 1280×720, 1728×871} × {EN, AR} × {light, dark}.
// Dark = prefers-color-scheme: dark emulation (the deck itself ships no dark theme — the shots prove nothing breaks under it).
// Usage: node matrix-shots.mjs <baseUrl> <label> <outDir> <slide,slide,...>
import fs from 'node:fs'; import path from 'node:path';
import { launch, newPage, boot, gotoHash, waitVisible, hashFor, iso } from '../v154/lib.mjs';
const [base, label, outDir, slidesArg] = process.argv.slice(2);
const slides = slidesArg.split(',').map(Number); fs.mkdirSync(outDir, { recursive: true });
const VPS = [[1440, 900], [1280, 720], [1728, 871]]; const rows = [];
const browser = await launch();
try {
  for (const lang of ['en', 'ar']) for (const scheme of ['light', 'dark']) for (const [w, h] of VPS) {
    const { ctx, page } = await newPage(browser, { viewport: { width: w, height: h }, lang, colorScheme: scheme });
    try {
      await boot(page, base, slides[0]);
      for (const n of slides) {
        await gotoHash(page, n); const v = await waitVisible(page, n, 9000); await page.waitForTimeout(900);
        const name = `${label}-s${String(n).padStart(2, '0')}-${lang}-${scheme}-${w}x${h}.png`;
        await page.screenshot({ path: path.join(outDir, name), timeout: 20000 });
        const info = await page.evaluate(() => ({ dir: document.documentElement.dir, lang: document.documentElement.lang, scheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', hOverflow: document.documentElement.scrollWidth > innerWidth + 1, broken: [...document.images].filter((i) => i.offsetParent && i.complete && i.naturalWidth === 0).map((i) => i.src.split('/').pop()), letterDir: (() => { const l = document.querySelector('#root section.ex-slide.is-active .ex-letter'); return l ? getComputedStyle(l).direction + '/' + l.getAttribute('lang') : null; })(), arTrack: (() => { const v = document.querySelector('#root section.ex-slide.is-active video'); if (!v) return null; return [...v.textTracks].map((t) => t.language + ':' + t.mode).join(','); })() }));
        rows.push({ t: iso(), name, n, visible: v.n, slideId: v.slideId || v.id, lang, scheme, viewport: `${w}x${h}`, ...info, console: page.__console.length });
        console.log(name, 'visible', v.n, info.dir, info.scheme, 'overflow', info.hOverflow, 'broken', info.broken.length);
      }
    } finally { await ctx.close(); }
  }
} finally { await browser.close(); }
fs.writeFileSync(path.join(outDir, `${label}-matrix.json`), JSON.stringify({ base, label, rows }, null, 1));
