/* SA10: before/after screenshots of every touched slide (1, 29, 30, 38 + its 3 tabs, 39) × EN/AR × 1440×900 + 1728×871 */
import fs from 'node:fs';
import { launch, newDeckPage, gotoSlide } from './lib.mjs';
const [base, label, outDir] = process.argv.slice(2); fs.mkdirSync(outDir, { recursive: true });
const b = await launch(); let n = 0;
try { for (const vp of ['1440x900', '1728x871']) for (const lang of ['en', 'ar']) { const { ctx, page } = await newDeckPage(b, { lang, viewport: vp }); let first = true;
  for (const s of [1, 29, 30, 38, 39]) { await gotoSlide(page, base, lang, s, { reload: first }); first = false; await page.waitForTimeout(s === 1 ? 1500 : 900);
    await page.screenshot({ path: `${outDir}/${label}-s${String(s).padStart(2, '0')}-${lang}-${vp}.png` }); n++;
    if (s === 38) for (const k of ['in', 'ke']) { const bt = await page.$(`[data-country="${k}"]`); if (bt) { await bt.click(); await page.waitForTimeout(500); await page.screenshot({ path: `${outDir}/${label}-s38-${k}-${lang}-${vp}.png` }); n++; } }
  } await ctx.close(); } } finally { await b.close(); }
console.log(label, 'screenshots', n);
