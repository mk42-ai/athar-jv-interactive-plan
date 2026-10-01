import { launch, newDeckPage, gotoSlide } from './lib.mjs';
const base = process.argv[2]; const out = [];
const b = await launch();
try { for (const vp of ['1440x900', '1728x871', '390x844']) for (const lang of ['en', 'ar']) { const { ctx, page } = await newDeckPage(b, { lang, viewport: vp });
  const r = { vp, lang };
  await gotoSlide(page, base, lang, 1, { reload: true }); await page.waitForTimeout(1200);
  r.s1 = await page.evaluate(() => ({ ondemandInCover: document.querySelectorAll('#s-cover img[src*="ondemand"]').length, ondemandInClosing: document.querySelectorAll('#s-closing img[src*="ondemand"]').length, ondemandAnyVisible: [...document.querySelectorAll('img[src*="ondemand"]')].filter(i => i.getBoundingClientRect().width > 0 && i.closest('section.slide.is-active')).length,
    introOverStrip: (() => { const a = document.querySelector('#s-cover .nar-intro'), s = document.querySelector('#s-cover .athar-partner-strip'); if (!a || !s) return null; const x = a.getBoundingClientRect(), y = s.getBoundingClientRect(); if (getComputedStyle(s).display === 'none') return false; return !(x.bottom <= y.top || y.bottom <= x.top || x.right <= y.left || y.right <= x.left); })() }));
  await gotoSlide(page, base, lang, 29, {}); await page.waitForTimeout(900);
  r.s29 = await page.evaluate(() => { const imgs = [...document.querySelectorAll('#s-it-tiers img')].filter(i => /v154/.test(i.currentSrc || i.src)); return { n: imgs.length, ok: imgs.every(i => i.complete && i.naturalWidth > 0 && i.getAttribute('data-img-fallback') !== '1'), srcs: imgs.map(i => (i.currentSrc || i.src).split('/').pop()), caps: [...document.querySelectorAll('#s-it-tiers figcaption')].map(f => f.textContent), official: /Official brand imagery|صورة رسمية من هوية أثر/.test(document.querySelector('#s-it-tiers').innerText) }; });
  await gotoSlide(page, base, lang, 30, {}); await page.waitForTimeout(900);
  r.s30 = await page.evaluate(() => { const cards = [...document.querySelectorAll('.news-card')]; const pib = document.querySelector('[data-news-id="in-pib"] .it-news-mark img');
    const clipped = cards.flatMap(c => { const cr = c.getBoundingClientRect(); return [...c.querySelectorAll('.it-tag,.it-tierchip')].filter(t => { const q = t.getBoundingClientRect(); return q.width > 0 && (q.right > cr.right + .5 || q.left < cr.left - .5 || q.bottom > cr.bottom + .5 || t.scrollWidth > t.clientWidth + 1); }).map(t => c.getAttribute('data-news-id') + ':' + t.textContent); });
    return { cards: cards.length, pib: pib && { src: pib.getAttribute('src'), nw: pib.naturalWidth, alt: pib.alt }, textMarks: document.querySelectorAll('.it-news-markword').length, marksLoaded: cards.every(c => { const i = c.querySelector('.it-news-mark img'); return i && i.complete && i.naturalWidth > 0; }), clipped }; });
  await gotoSlide(page, base, lang, 38, {}); await page.waitForTimeout(900);
  r.s38 = await page.evaluate(() => { const bn = document.querySelector('[data-testid="nation-banner"]'); const i = bn.querySelector('img'); const cta = document.querySelector('[data-testid="join-pact-cta"]').getBoundingClientRect(); const br = bn.getBoundingClientRect();
    return { src: (i.currentSrc || i.src).split('/').slice(-2).join('/'), nw: i.naturalWidth, cap: bn.querySelector('figcaption').textContent, film: [...document.querySelectorAll('#s-aos-nations figcaption')].map(f => f.textContent).filter(t => /film|الفيلم/.test(t)), gap: Math.round(cta.top - br.bottom) }; });
  r.errors = page.__errors.slice(0, 5); out.push(r); await ctx.close(); } } finally { await b.close(); }
console.log(JSON.stringify(out, null, 1));
