/* DOM probe / text snapshot: node probe.mjs --base URL --out file.json [--langs en,ar] [--slides 1-39] [--viewport 1440x900] [--scheme light|dark] [--shots dir] [--tabs38] */
import fs from 'node:fs';
import { launch, newDeckPage, gotoSlide, ts, sleep } from './lib.mjs';
const A = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true'] : []).filter(Boolean));
const base = A.base, out = A.out, langs = (A.langs || 'en,ar').split(','), vp = A.viewport || '1440x900', scheme = A.scheme || 'light';
const [s0, s1] = (A.slides || '1-39').split('-').map(Number); const slides = []; for (let i = s0; i <= (s1 || s0); i++) slides.push(i);
const extract = () => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const itAct = document.querySelector('section.slide.it-slide.is-active'); let cur = 0; try { cur = window.AtharImpactTiers && window.AtharImpactTiers.current && window.AtharImpactTiers.current(); } catch (e) {} const act = (cur && itAct) ? itAct : (document.querySelector('#root section.slide.is-active:not(.it-slide)') || itAct);
  const stage = document.querySelector('.stage') || document.body;
  const sr = stage.getBoundingClientRect();
  const vis = (el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const imgs = act ? [...act.querySelectorAll('img')].map((i) => ({ src: (i.currentSrc || i.src || '').replace(location.origin, ''), attrSrc: i.getAttribute('src'), alt: i.getAttribute('alt'), nw: i.naturalWidth, nh: i.naturalHeight, complete: i.complete, visible: vis(i), fallback: i.getAttribute('data-img-fallback') === '1', r: (() => { const r = i.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })() })) : [];
  /* clipped text: elements whose own text overflows a clipping box, or that leave the stage */
  const clipped = [];
  if (act) for (const el of act.querySelectorAll('*')) {
    if (!vis(el)) continue; const own = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()); if (!own) continue;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const ofl = (cs.overflow + cs.overflowX + cs.overflowY);
    if (/hidden|clip/.test(ofl) && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) && cs.textOverflow !== 'ellipsis' && !/-webkit-box/.test(cs.display)) clipped.push({ why: 'overflow', tag: el.tagName, cls: el.className && String(el.className).slice(0, 80), text: norm(el.textContent).slice(0, 80), sh: el.scrollHeight, ch: el.clientHeight, sw: el.scrollWidth, cw: el.clientWidth });
    if (r.right > sr.right + 2 || r.left < sr.left - 2 || r.top < sr.top - 2) clipped.push({ why: 'outside-stage', tag: el.tagName, cls: el.className && String(el.className).slice(0, 80), text: norm(el.textContent).slice(0, 80), r: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], stage: [Math.round(sr.left), Math.round(sr.top), Math.round(sr.right), Math.round(sr.bottom)] });
  }
  const footer = document.querySelector('footer.pagefooter');
  const od = [...document.querySelectorAll('img[src*="ondemand"]')].map((i) => ({ src: i.getAttribute('src'), visible: vis(i), inActive: !!(act && act.contains(i)), parent: i.parentElement && String(i.parentElement.className).slice(0, 60), r: (() => { const r = i.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })() }));
  return { id: act && act.id, cls: act && String(act.className).slice(0, 120), lang: document.documentElement.lang, dir: document.documentElement.dir,
    text: act ? norm(act.innerText) : '', textContent: act ? norm(act.textContent) : '', footer: footer ? norm(footer.innerText) : '',
    version: (document.querySelector('[data-testid="deck-version"]') || {}).textContent || null, imgs, clipped: clipped.slice(0, 40), ondemand: od,
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, docW: document.documentElement.scrollWidth, vw: window.innerWidth };
};
const browser = await launch();
const res = { generated: ts(), base, viewport: vp, scheme, views: [] };
try {
  for (const lang of langs) {
    const { ctx, page } = await newDeckPage(browser, { lang, viewport: vp, colorScheme: scheme });
    let first = true;
    for (const n of slides) {
      const got = await gotoSlide(page, base, lang, n, { reload: first }); first = false;
      const d = await page.evaluate(extract); d.n = n; d.got = got;
      if (A.shots) { fs.mkdirSync(A.shots, { recursive: true }); await page.screenshot({ path: `${A.shots}/${lang}-s${String(n).padStart(2, '0')}-${vp}.png` }); }
      if (A.tabs38 && n === 38) {
        d.tabs = [];
        for (const k of ['lb', 'in', 'ke']) { const b = await page.$(`[data-country="${k}"]`); if (!b) continue; await b.click(); await sleep(450); const t = await page.evaluate(extract); d.tabs.push({ k, text: t.text, imgs: t.imgs }); if (A.shots) await page.screenshot({ path: `${A.shots}/${lang}-s38-${k}-${vp}.png` }); }
        const b = await page.$('[data-country="lb"]'); if (b) { await b.click(); await sleep(300); }
      }
      d.errors = page.__errors.splice(0);
      res.views.push(d);
      process.stdout.write(`${lang} ${n}${got === n ? '' : ' (got ' + got + ')'} imgs=${d.imgs.length} clipped=${d.clipped.length}\n`);
    }
    await ctx.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log('wrote', out, res.views.length, 'views');
