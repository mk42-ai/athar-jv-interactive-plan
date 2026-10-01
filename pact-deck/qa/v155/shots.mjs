// v1.5.5 named screenshot capture (Playwright + system Chromium): slides × viewports × EN/AR × colour schemes, plus element crops of the
// slide-32 Mastercard tile and the slide-38 strip + "Join the pact" row. Each row also records broken images, overflow and console errors.
// Usage: DECK_TOTAL=<n> node qa/v155/shots.mjs <baseUrl> <label> <outDir> <slides csv> [viewports csv=1728x872,390x844] [schemes csv=light]
import fs from 'node:fs'; import path from 'node:path';
import { launch, newPage, boot, gotoHash, waitVisible, iso } from '../v154/lib.mjs';
const [base, label, outDir, slidesArg, vpArg, schArg] = process.argv.slice(2);
const slides = slidesArg.split(',').map(Number); fs.mkdirSync(outDir, { recursive: true });
const VPS = (vpArg || '1728x872,390x844').split(',').map((s) => s.split('x').map(Number)); const SCHEMES = (schArg || 'light').split(',');
const rows = []; const browser = await launch();
const crop = { 32: '[data-actor="mastercard"]', 38: '#s-aos-nations .aos-nation-side' };
try {
  for (const lang of ['en', 'ar']) for (const scheme of SCHEMES) for (const [w, h] of VPS) {
    const mobile = w < 600; const { ctx, page } = await newPage(browser, { viewport: { width: w, height: h }, mobile, lang, colorScheme: scheme });
    try {
      await boot(page, base, slides[0]);
      for (const n of slides) {
        await gotoHash(page, n); const v = await waitVisible(page, n, 9000); await page.waitForTimeout(900);
        const stem = `${label}-s${String(n).padStart(2, '0')}-${lang}-${scheme}-${w}x${h}`;
        const SHOTS = (process.env.SHOTS || '').split(',').filter(Boolean).map(Number); const doShot = !process.env.NOSHOT && (!SHOTS.length || SHOTS.includes(n));
        if (doShot) await page.screenshot({ path: path.join(outDir, stem + '.png'), timeout: 20000 });
        let cropName = null;
        if (doShot && crop[n]) { const loc = page.locator(crop[n]).first(); if (await loc.count()) { try { await loc.scrollIntoViewIfNeeded({ timeout: 3000 }); cropName = stem.replace(`-s${n}-`, `-s${n}-crop-`) + '.png'; await loc.screenshot({ path: path.join(outDir, cropName), timeout: 15000 }); } catch (e) { cropName = 'ERR ' + String(e).slice(0, 80); } } }
        const info = await page.evaluate(() => {
          const virt = document.body.classList.contains('it-virtual');
          const sec = virt ? document.querySelector('#root section.it-slide.is-active') : document.querySelector('#root section.slide.is-active:not(.it-slide)');
          const body = sec && sec.querySelector(':scope > .s-body');
          const clipped = []; if (sec) sec.querySelectorAll('h1,h2,h3,p,li,figcaption,span,a,button').forEach((e) => { if (!e.offsetParent || !e.textContent.trim()) return; const cs = getComputedStyle(e); if ((cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2) && !/line-clamp/.test(cs.webkitLineClamp || '')) clipped.push((e.className || e.tagName).toString().slice(0, 40)); });
          return { id: sec && sec.id, dir: document.documentElement.dir, hOverflow: document.documentElement.scrollWidth > innerWidth + 1, bodyOverflowY: body ? Math.max(0, body.scrollHeight - body.clientHeight) : null,
            broken: [...document.images].filter((i) => i.offsetParent && i.complete && i.naturalWidth === 0).map((i) => i.src.split('/').pop()), clipped: clipped.slice(0, 6),
            counter: (document.querySelector('footer.pagefooter .counter') || {}).textContent || '', version: (document.querySelector('[data-testid="deck-version"], footer .deck-version') || {}).textContent || '' };
        });
        rows.push({ t: iso(), file: doShot ? stem + '.png' : null, crop: cropName, n, visible: v.n, lang, scheme, viewport: `${w}x${h}`, ...info, console: page.__console.length });
        console.log(stem, 'visible', v.n, info.id, 'hOverflow', info.hOverflow, 'bodyOverflowY', info.bodyOverflowY, 'broken', info.broken.length, 'console', page.__console.length);
      }
    } finally { await ctx.close(); }
  }
} finally { await browser.close(); }
fs.writeFileSync(path.join(outDir, `${label}-shots.json`), JSON.stringify({ base, label, rows }, null, 1));
