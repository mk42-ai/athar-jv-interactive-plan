// v1.5.5 smoke/QA probe (Playwright + system Chromium): Executive Team navigation 39→46 by keyboard and chevron, deep links, counter,
// overflow/fit, broken images, console errors, slide-32 Mastercard tile, slide-38 montage (no crop, caption, ≥32 px gap to "Join the pact").
// Usage: DECK_TOTAL=46 node qa/v155/smoke.mjs <baseUrl> <out.json> [viewport WxH]
import fs from 'node:fs';
import { launch, newPage, boot, gotoHash, waitVisible, hashFor, iso } from '../v154/lib.mjs';
const [base, out, vpArg] = process.argv.slice(2); const [W, H] = (vpArg || '1440x900').split('x').map(Number);
const res = { base, viewport: `${W}x${H}`, t: iso(), runs: [] };
const probe = () => {
  const sec = document.querySelector('#root section.slide.ex-slide.is-active') || (document.body.classList.contains('it-virtual') ? document.querySelector('#root section.it-slide.is-active') : document.querySelector('#root section.slide.is-active:not(.it-slide)'));
  const body = sec && sec.querySelector(':scope > .s-body');
  const bar = document.getElementById('athar-narration'); const barTop = bar ? bar.getBoundingClientRect().top : innerHeight;
  const foot = document.querySelector('footer.pagefooter'); const footTop = foot ? foot.getBoundingClientRect().top : innerHeight;
  let maxBottom = 0; if (body) body.querySelectorAll('*').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && r.height && getComputedStyle(e).visibility !== 'hidden') maxBottom = Math.max(maxBottom, r.bottom); });
  const imgs = sec ? [...sec.querySelectorAll('img')] : [];
  return { id: sec && sec.id, n: window.AtharImpactTiers ? window.AtharImpactTiers.current() : 0, counter: (document.querySelector('footer.pagefooter .counter') || {}).textContent, hash: location.hash,
    dir: document.documentElement.dir, lang: document.documentElement.lang, letterDir: (sec && sec.querySelector('.ex-letter') || { getAttribute: () => null }).getAttribute('dir'), letterLang: (sec && sec.querySelector('.ex-letter') || { getAttribute: () => null }).getAttribute('lang'),
    contentBottom: Math.round(maxBottom), limit: Math.round(Math.min(barTop, footTop)), overflowPx: Math.max(0, Math.round(maxBottom - Math.min(barTop, footTop))), bodyScroll: body ? body.scrollHeight - body.clientHeight : null,
    hOverflow: document.documentElement.scrollWidth > innerWidth + 1, broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')),
    nextDisabled: !!(document.querySelector('button.arrow.next') || {}).disabled, guideSlide: (document.getElementById('athar-narration') || { getAttribute: () => null }).getAttribute('data-slide-id') };
};
const browser = await launch();
try {
  for (const lang of ['en', 'ar']) {
    const { ctx, page } = await newPage(browser, { viewport: { width: W, height: H }, lang });
    try {
      await boot(page, base, 39); const run = { lang, keys: [], chevrons: [], deep: [], s32: null, s38: null, console: [] };
      run.keys.push(await page.evaluate(probe));
      for (let i = 0; i < 8; i++) { await page.keyboard.press(lang === 'ar' ? 'ArrowLeft' : 'ArrowRight'); await page.waitForTimeout(450); run.keys.push(await page.evaluate(probe)); }
      for (let i = 0; i < 8; i++) { await page.keyboard.press(lang === 'ar' ? 'ArrowRight' : 'ArrowLeft'); await page.waitForTimeout(350); run.keys.push(await page.evaluate(probe)); }
      if (await page.locator('button.arrow.next').isVisible()) { /* chevrons are hidden in the phone layout */
        for (let i = 0; i < 3; i++) { await page.click('button.arrow.next'); await page.waitForTimeout(400); run.chevrons.push(await page.evaluate(probe)); }
        await page.click('button.arrow.prev'); await page.waitForTimeout(400); run.chevrons.push(await page.evaluate(probe));
      }
      for (const n of [40, 43, 44, 41]) { await page.goto(base + '/' + hashFor(n), { waitUntil: 'load' }); await waitVisible(page, n, 15000); await page.waitForTimeout(900); run.deep.push(await page.evaluate(probe)); }
      await gotoHash(page, 32); await waitVisible(page, 32, 9000); await page.waitForTimeout(900);
      run.s32 = await page.evaluate(() => { const t = document.querySelector('[data-actor="mastercard"]'); if (!t) return null; const i = t.querySelector('img'); const sp = t.querySelector('.pmark'); const ir = i && i.getBoundingClientRect(), pr = sp && sp.getBoundingClientRect();
        return { text: t.innerText.replace(/\s+/g, ' ').trim(), img: i && i.getAttribute('src'), natural: i && [i.naturalWidth, i.naturalHeight], rendered: ir && [Math.round(ir.width * 10) / 10, Math.round(ir.height * 10) / 10], frame: pr && [Math.round(pr.width), Math.round(pr.height)],
          clear: ir && pr && { top: Math.round((ir.top - pr.top) * 10) / 10, bottom: Math.round((pr.bottom - ir.bottom) * 10) / 10, left: Math.round((ir.left - pr.left) * 10) / 10, right: Math.round((pr.right - ir.right) * 10) / 10, x: Math.round(ir.height * 0.3047 * 10) / 10 }, pending: /pending verification|بانتظار التحقق/i.test(t.innerText), alt: i && i.alt }; });
      await gotoHash(page, 38); await waitVisible(page, 38, 9000); await page.waitForTimeout(1200);
      run.s38 = await page.evaluate(() => { const f = document.querySelector('#s-aos-nations [data-testid="nation-banner"]'); const cta = document.querySelector('#s-aos-nations [data-testid="join-pact-cta"]'); if (!f) return null; const i = f.querySelector('img'), cap = f.querySelector('figcaption');
        const ir = i.getBoundingClientRect(), fr = f.getBoundingClientRect(), cr = cta.getBoundingClientRect();
        return { src: i.currentSrc.split('/').pop(), natural: [i.naturalWidth, i.naturalHeight], rendered: [Math.round(ir.width), Math.round(ir.height)], renderedRatio: Math.round(ir.width / ir.height * 1000) / 1000, naturalRatio: Math.round(i.naturalWidth / i.naturalHeight * 1000) / 1000, objectFit: getComputedStyle(i).objectFit,
          caption: cap && cap.textContent, figureBottom: Math.round(fr.bottom), ctaTop: Math.round(cr.top), ctaText: cta.textContent.trim(), gapPx: Math.round(cr.top - fr.bottom), horizontalOverlap: !(cr.right < fr.left || cr.left > fr.right) }; });
      run.console = page.__console.slice(0, 10); res.runs.push(run);
    } finally { await ctx.close(); }
  }
} finally { await browser.close(); }
fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log('wrote', out);
