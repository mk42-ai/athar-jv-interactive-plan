// Normalised visible text of every slide (EN + AR) — the copy-diff baseline. Usage: node dom-text.mjs <baseUrl> <out.json>
import { launch, newPage, boot, gotoHash, waitVisible, writeJSON, TOTAL, iso } from './lib.mjs';
const [base, out] = process.argv.slice(2);
const browser = await launch();
const res = { base, started: iso(), slides: {} };
try {
  for (const lang of ['en', 'ar']) {
    const { ctx, page } = await newPage(browser, { lang });
    await boot(page, base, 1);
    res.slides[lang] = [];
    for (let n = 1; n <= TOTAL; n++) {
      await gotoHash(page, n); const v = await waitVisible(page, n, 8000); await page.waitForTimeout(350);
      const row = await page.evaluate(() => {
        const virt = document.body.classList.contains('it-virtual');
        const s = virt ? document.querySelector('#root section.it-slide.is-active') : document.querySelector('#root section.slide.is-active:not(.it-slide)');
        const norm = (t) => String(t || '').replace(/\s+/g, ' ').trim();
        return { id: s ? s.id : null, slideId: s ? s.getAttribute('data-slide-id') : null, dir: document.documentElement.dir, text: s ? norm(s.innerText) : '' };
      });
      res.slides[lang].push({ n, visible: v.n, ...row });
    }
    await ctx.close();
  }
} finally { await browser.close(); }
res.finished = iso(); writeJSON(out, res);
console.log('dom-text', out, Object.fromEntries(Object.entries(res.slides).map(([k, v]) => [k, v.filter((r) => r.visible === r.n).length + '/' + v.length + ' ok'])));
