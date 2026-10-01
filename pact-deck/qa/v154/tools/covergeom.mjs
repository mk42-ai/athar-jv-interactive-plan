import { launch, newDeckPage, gotoSlide } from './lib.mjs';
const base = process.argv[2]; const out = [];
const b = await launch();
try {
  for (const vp of ['1440x900', '1728x871', '1280x720', '1920x1080']) for (const lang of ['en', 'ar']) for (const n of [1, 39]) {
    const { ctx, page } = await newDeckPage(b, { lang, viewport: vp });
    await gotoSlide(page, base, lang, n, { reload: true }); await page.waitForTimeout(900);
    const g = await page.evaluate((n) => {
      const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
      const sec = document.getElementById(n === 1 ? 's-cover' : 's-closing'); const q = (s) => sec && sec.querySelector(s);
      const vis = (e) => { if (!e) return false; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
      const strip = q('.athar-partner-strip'), intro = q('.nar-intro'), copy = q('.cover-copy') || q('.closing-copy') || q('.s-body');
      const pm = [...(sec ? sec.querySelectorAll('.pmark') : [])].map((p) => ({ cls: String(p.className).replace(/pmark--img|pmark /g, '').trim().slice(0, 50), vis: vis(p), r: R(p) }));
      const ov = (a, b) => a && b && !(a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]);
      const ar = q('.nar-intro-ar'); const en = q('.nar-intro-en');
      const stage = document.querySelector('.stage'); const sr = R(stage); const secR = R(sec);
      const clip = (e) => e ? { sh: e.scrollHeight, ch: e.clientHeight, ovf: getComputedStyle(e).overflowY } : null;
      // nearest clipping ancestor of the intro
      let anc = intro, clipAnc = null; while (anc && anc !== document.body) { const cs = getComputedStyle(anc); if (/hidden|clip|auto|scroll/.test(cs.overflowY) && anc.scrollHeight > anc.clientHeight + 2) { clipAnc = { cls: String(anc.className).slice(0, 60), sh: anc.scrollHeight, ch: anc.clientHeight, ovf: cs.overflowY }; break; } anc = anc.parentElement; }
      return { strip: R(strip), stripCls: strip && String(strip.className).slice(0, 80), atharBox: R(q('.aps-athar-box img')), marks: R(q('.aps-marks')), intro: R(intro), introClip: clip(intro), clipAncestor: clipAnc,
        introOverStrip: ov(R(intro), R(strip)), copy: R(copy), ar: R(ar), en: R(en), stage: sr, sec: secR, pmarks: pm, vw: innerWidth };
    }, n);
    out.push({ vp, lang, n, ...g }); await ctx.close();
  }
} finally { await b.close(); }
console.log(JSON.stringify(out, null, 0));
