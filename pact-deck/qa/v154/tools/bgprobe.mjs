/* SA8: CSS background-image + <video poster> + <source srcset> inventory per slide (EN), complementing dom-before.json <img> data */
import fs from 'node:fs';
import { launch, newDeckPage, gotoSlide } from './lib.mjs';
const base = process.argv[2], out = process.argv[3];
const b = await launch(); const res = [];
try {
  const { ctx, page } = await newDeckPage(b, { lang: 'en' }); let first = true;
  for (let n = 1; n <= 39; n++) {
    await gotoSlide(page, base, 'en', n, { reload: first }); first = false;
    const d = await page.evaluate(() => {
      const itAct = document.querySelector('section.slide.it-slide.is-active'); let cur = 0; try { cur = window.AtharImpactTiers && window.AtharImpactTiers.current && window.AtharImpactTiers.current(); } catch (e) {} const act = (cur && itAct) ? itAct : (document.querySelector('#root section.slide.is-active:not(.it-slide)') || itAct); if (!act) return null; const set = new Set(); const items = [];
      for (const el of [act, ...act.querySelectorAll('*')]) { const bg = getComputedStyle(el).backgroundImage; if (bg && bg !== 'none') { for (const m of bg.matchAll(/url\("?([^")]+)"?\)/g)) { const u = m[1].replace(location.origin, ''); if (!set.has(u)) { set.add(u); const r = el.getBoundingClientRect(); items.push({ kind: 'css-bg', src: u, w: Math.round(r.width), h: Math.round(r.height), cls: String(el.className).slice(0, 60) }); } } } }
      for (const v of act.querySelectorAll('video')) items.push({ kind: 'video', src: (v.currentSrc || '').replace(location.origin, ''), poster: (v.getAttribute('poster') || '') });
      for (const s of act.querySelectorAll('picture source')) items.push({ kind: 'source', src: s.getAttribute('srcset') });
      return { id: act.id, items };
    });
    res.push({ n, ...d });
  }
  await ctx.close();
} finally { await b.close(); }
fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log('bg inventory', res.length);
