import { launch, newDeckPage, gotoSlide } from './lib.mjs';
const base = process.argv[2]; const out = [];
const b = await launch();
try { for (const vp of ['1728x871', '1440x900', '1280x720', '390x844']) for (const lang of ['en', 'ar']) { const { ctx, page } = await newDeckPage(b, { lang, viewport: vp }); await gotoSlide(page, base, lang, 30, { reload: true }); await page.waitForTimeout(900);
  out.push({ vp, lang, cards: await page.evaluate(() => [...document.querySelectorAll('.news-card')].map(c => { const r = c.getBoundingClientRect(); const R = (e) => { const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; };
    const mk = c.querySelector('.it-news-mark'), mi = mk && mk.querySelector('img'), mw = mk && mk.querySelector('.it-news-markword');
    const chips = [...c.querySelectorAll('.it-tag,.it-tierchip')].map(t => ({ t: t.textContent, r: R(t), clipped: (() => { const q = t.getBoundingClientRect(); return q.right > r.right + 0.5 || q.left < r.left - 0.5 || q.bottom > r.bottom + 0.5; })(), sw: t.scrollWidth, cw: t.clientWidth }));
    return { id: c.getAttribute('data-news-id'), card: R(c), mark: mk && R(mk), markImg: mi && { src: mi.getAttribute('src').split('/').pop(), nat: [mi.naturalWidth, mi.naturalHeight], r: R(mi), fit: getComputedStyle(mi).objectFit }, markword: mw && mw.textContent, chips, ovX: c.scrollWidth > c.clientWidth + 1 }; })) }); await ctx.close(); } } finally { await b.close(); }
console.log(JSON.stringify(out));
