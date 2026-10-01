import { launch, newDeckPage, gotoSlide } from './lib.mjs';
const base = process.argv[2]; const res = [];
const b = await launch();
try { for (const vp of ['1440x900', '1728x871', '1280x720', '390x844']) for (const lang of ['en', 'ar']) { const { ctx, page } = await newDeckPage(b, { lang, viewport: vp });
  await gotoSlide(page, base, lang, 38, { reload: true }); await page.waitForTimeout(900);
  const g38 = await page.evaluate(() => { const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
    const bn = document.querySelector('[data-testid="nation-banner"]'), cta = document.querySelector('[data-testid="join-pact-cta"]'), im = bn && bn.querySelector('img'), cap = bn && bn.querySelector('figcaption');
    const fs = [...document.querySelectorAll('#s-aos-nations figure')].map(f => ({ cap: (f.querySelector('figcaption') || {}).textContent, r: R(f) }));
    return { banner: R(bn), img: R(im), imgSrc: im && (im.currentSrc || im.src).split('/').slice(-2).join('/'), nat: im && [im.naturalWidth, im.naturalHeight], cap: cap && cap.textContent, capR: R(cap), cta: R(cta), figs: fs }; });
  await gotoSlide(page, base, lang, 29, {}); await page.waitForTimeout(800);
  const g29 = await page.evaluate(() => { const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
    const heroes = [...document.querySelectorAll('#s-it-tiers .it-product')].map(f => { const i = f.querySelector('img'); return { fig: R(f), img: R(i), src: i && (i.currentSrc || i.src).split('/').pop(), nat: i && [i.naturalWidth, i.naturalHeight], cap: (f.querySelector('figcaption') || {}).textContent }; });
    const own = document.querySelector('[data-testid="ownership-banner"]'), oi = own && own.querySelector('img'), oc = own && own.querySelector('figcaption');
    const sl = document.querySelector('#s-it-tiers'); const over = sl ? [...sl.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); const s = sl.getBoundingClientRect(); return r.width > 0 && (r.bottom > s.bottom + 1 || r.right > s.right + 1); }).length : -1;
    return { heroes, own: R(own), ownImg: R(oi), ownSrc: oi && (oi.currentSrc || oi.src).split('/').pop(), ownCap: oc && oc.textContent, ownCapR: R(oc), outside: over }; });
  res.push({ vp, lang, g38, g29 }); await ctx.close(); } } finally { await b.close(); }
console.log(JSON.stringify(res));
