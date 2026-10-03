// v1.5.5 DOM snapshot for the text/figure diff: per slide (EN + AR) the normalised visible text, every figure (numeric token), every
// image (src + alt + natural size + broken flag) and the footer counter. Usage: DECK_TOTAL=<n> node qa/v155/dom-snap.mjs <baseUrl> <out.json>
import fs from 'node:fs';
import { launch, newPage, boot, gotoHash, waitVisible, TOTAL, iso } from '../v154/lib.mjs';
const [base, out] = process.argv.slice(2);
const res = { base, total: TOTAL, started: iso(), slides: {} };
const browser = await launch();
try {
  for (const lang of ['en', 'ar']) {
    const { ctx, page } = await newPage(browser, { lang, viewport: { width: 1440, height: 900 } });
    try {
      await boot(page, base, 1); res.slides[lang] = [];
      for (let n = 1; n <= TOTAL; n++) {
        await gotoHash(page, n); const v = await waitVisible(page, n, 9000); await page.waitForTimeout(500);
        const snap = await page.evaluate(() => {
          const virt = document.body.classList.contains('it-virtual');
          const sec = virt ? document.querySelector('#root section.it-slide.is-active') : document.querySelector('#root section.slide.is-active:not(.it-slide)');
          if (!sec) return null;
          const text = (sec.innerText || '').replace(/\s+/g, ' ').trim();
          const figures = (text.match(/[$€£]?\d[\d,.]*\s?(%|k|m|bn|million|billion|years?|s)?/gi) || []).map((x) => x.trim());
          const imgs = [...sec.querySelectorAll('img')].map((i) => ({ src: (i.currentSrc || i.src || '').replace(location.origin, '').split('?')[0], alt: i.alt || '', w: i.naturalWidth, h: i.naturalHeight, broken: i.complete && i.naturalWidth === 0 }));
          const videos = [...sec.querySelectorAll('video')].map((x) => ({ src: (x.querySelector('source') || x).getAttribute('src'), poster: x.getAttribute('poster'), tracks: [...x.querySelectorAll('track')].map((t) => t.srclang) }));
          return { id: sec.id, text, figures, imgs, videos, counter: (document.querySelector('footer.pagefooter .counter') || {}).textContent || '', dir: document.documentElement.dir, lang: document.documentElement.lang };
        });
        res.slides[lang].push({ n, visible: v.n, ...(snap || { id: null, text: '', figures: [], imgs: [], videos: [] }) });
      }
    } finally { await ctx.close(); }
  }
} finally { await browser.close(); }
res.finished = iso(); fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log('wrote', out, 'slides', TOTAL);
