#!/usr/bin/env node
/* Athar deck v1.5.2 — headless QA gate (playwright-core + system Chromium).
   Renders all 39 slides × {1920×1080, 1280×720} × {en, ar} = 156 views and checks, per view:
   text overflow/clipping (scrollWidth/Height > clientWidth/Height on clipped text nodes, and visible elements whose box exits
   the slide), blank-region ratio (largest blank block of the content area on a 16×9 grid), broken images (naturalWidth 0 /
   fallback / failed or ≥400 requests), console errors + page errors, footer + AIREV logo + version badge presence,
   and narration mapping completeness (every slideId has a manifest or script segment).
   usage: node qa/qa-gate.mjs <baseUrl> <outDir> [--shots] [--label after]   (needs NODE_PATH to a node_modules with playwright-core + sharp) */
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import fs from 'node:fs'; import path from 'node:path';
const args = process.argv.slice(2); const BASE = args[0]; const OUT = args[1] || 'qa/out'; const SHOTS = args.includes('--shots'); const LABEL = (args.indexOf('--label') > -1 ? args[args.indexOf('--label') + 1] : 'after');
fs.mkdirSync(OUT, { recursive: true }); if (SHOTS) fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
const routes = []; for (let i = 1; i <= 27; i++) routes.push({ n: i, hash: `#/${i}` }); for (let i = 1; i <= 11; i++) routes.push({ n: 27 + i, hash: `#/27/new-${i}` }); routes.push({ n: 39, hash: '#/28' });
const VIEWPORTS = [{ w: 1920, h: 1080 }, { w: 1280, h: 720 }]; const LANGS = ['en', 'ar'];
const started = new Date().toISOString(); const t0 = Date.now();
const report = { version: 'v1.5.2', label: LABEL, base: BASE, started_utc: started, viewports: VIEWPORTS, langs: LANGS, views: [], summary: {} };
let narration = { ok: false, missing: [], total: 0 };
try { const man = JSON.parse(fs.readFileSync(new URL('../dist/narration/narration-manifest.json', import.meta.url), 'utf8')); const scr = JSON.parse(fs.readFileSync(new URL('../dist/narration/narration-script.json', import.meta.url), 'utf8')); const have = new Set([...man.segments, ...scr].map(s => s.slideId)); const ids = JSON.parse(fs.readFileSync(new URL('./slides.json', import.meta.url), 'utf8')); narration.total = ids.length; narration.missing = ids.filter(s => !have.has(s.slideId)).map(s => s.slideId); narration.ok = narration.missing.length === 0 && have.has('intro'); narration.segments = man.segments.length; narration.with_audio = man.segments.filter(s => s.audio).length; } catch (e) { narration.error = String(e).slice(0, 200); }
report.narration = narration;
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required'] });
try {
  for (const vp of VIEWPORTS) for (const lang of LANGS) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, locale: lang === 'ar' ? 'ar-AE' : 'en-GB' });
    const page = await ctx.newPage();
    const consoleErr = [], pageErr = [], failedReq = [], badResp = [];
    page.on('console', m => { if (m.type() === 'error') consoleErr.push(m.text().slice(0, 200)); });
    page.on('pageerror', e => pageErr.push(String(e).slice(0, 200)));
    page.on('requestfailed', r => { const u = r.url(); if (/^data:|^blob:/.test(u)) return; failedReq.push(u.slice(0, 200) + ' ' + (r.failure()?.errorText || '')); });
    page.on('response', r => { if (r.status() >= 400) badResp.push(r.status() + ' ' + r.url().slice(0, 200)); });
    await page.goto(`${BASE}/?lang=${lang}&intro=1&qa=${Date.now()}`, { waitUntil: 'load', timeout: 60000 }); /* distinct query -> the next goto is a full reload with the skip flag set */
    await page.evaluate(() => { try { sessionStorage.setItem('athar-intro-v1.4.2', 'done'); localStorage.setItem('athar-narration-prefs-v1', JSON.stringify({ autoplay: false, muted: true, captions: true, volume: 0.9 })); } catch (e) {} });
    await page.goto(`${BASE}/?lang=${lang}#/1`, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(1500);
    const gateState = await page.evaluate(() => ({ introVisible: !!(document.querySelector('.intro-gate') && document.querySelector('.intro-gate').offsetParent !== null), rootHidden: document.getElementById('root') ? document.getElementById('root').getAttribute('aria-hidden') === 'true' : null }));
    if (gateState.introVisible || gateState.rootHidden) { report.views.push({ viewport: `${vp.w}x${vp.h}`, lang, slide: 0, verdict: 'FAIL', defects: ['intro-gate-still-active'], gateState }); }
    for (const r of routes) {
      const c0 = consoleErr.length, p0 = pageErr.length, f0 = failedReq.length, b0 = badResp.length;
      await page.evaluate(h => { location.hash = h; }, r.hash); await page.waitForTimeout(600);
      for (let i = 0; i < 12; i++) { const pend = await page.evaluate(() => Array.from(document.images).filter(im => im.offsetParent !== null && getComputedStyle(im).visibility !== 'hidden' && !im.complete).length); if (!pend) break; await page.waitForTimeout(350); }
      await page.waitForTimeout(150);
      const res = await page.evaluate(({ n }) => {
        const vw = innerWidth, vh = innerHeight;
        const vis = el => { const b = el.getBoundingClientRect(); if (!(b.width > 0 && b.height > 0 && b.bottom > 0 && b.right > 0 && b.top < vh && b.left < vw)) return false; let a = el; while (a && a !== document.body) { const s = getComputedStyle(a); if (s.opacity === '0' || s.visibility === 'hidden' || s.display === 'none' || a.getAttribute('aria-hidden') === 'true') return false; a = a.parentElement; } return true; };
        const active = document.querySelector('section.it-slide.is-active') || document.querySelector('#root section.slide.is-active:not(.it-slide)');
        const out = { n, slideId: active ? active.id : null, title: active ? ((active.querySelector('h1,h2') || {}).textContent || '').trim().slice(0, 100) : '' };
        if (!active) { out.error = 'no active slide'; return out; }
        const ab = active.getBoundingClientRect(); out.slideBox = { x: Math.round(ab.left), y: Math.round(ab.top), w: Math.round(ab.width), h: Math.round(ab.height) };
        const footer = document.querySelector('footer.pagefooter'); const fb = footer ? footer.getBoundingClientRect() : null;
        out.contentBox = { x: Math.max(0, Math.round(ab.left)), y: Math.max(0, Math.round(ab.top)), w: Math.round(Math.min(ab.right, vw) - Math.max(0, ab.left)), h: Math.round((fb ? Math.min(ab.bottom, fb.top) : Math.min(ab.bottom, vh)) - Math.max(0, ab.top)) };
        // text overflow / clipping
        const els = Array.from(active.querySelectorAll('*')).filter(el => vis(el) && !['SCRIPT', 'STYLE', 'SVG', 'PATH', 'VIDEO', 'SOURCE', 'PICTURE'].includes(el.tagName));
        const overflow = [], exits = [];
        const srOnly = el => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return /visually-hidden|sr-only/.test(String(el.className)) || (b.width <= 1 && b.height <= 1) || cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)'; };
        const visibleRect = el => { /* rect clipped by overflow-hidden ancestors (intentional crops are not defects) */
          let b = el.getBoundingClientRect(); let r = { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; let a = el.parentElement;
          while (a && a !== document.body) { const s = getComputedStyle(a); if (/hidden|clip|auto|scroll/.test(s.overflow + s.overflowX + s.overflowY)) { const pb = a.getBoundingClientRect(); r = { left: Math.max(r.left, pb.left), top: Math.max(r.top, pb.top), right: Math.min(r.right, pb.right), bottom: Math.min(r.bottom, pb.bottom) }; } a = a.parentElement; }
          return r;
        };
        for (const el of els) {
          if (srOnly(el)) continue;
          const cs = getComputedStyle(el); const hasText = Array.from(el.childNodes).some(nn => nn.nodeType === 3 && nn.textContent.trim().length > 0);
          const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
          if (hasText && !clamp && cs.overflow !== 'visible' && cs.overflowX !== 'visible') { if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) overflow.push({ tag: el.tagName, cls: String(el.className).slice(0, 50), text: el.textContent.trim().slice(0, 50), sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight }); }
          if (hasText || el.tagName === 'IMG') { const b = visibleRect(el); if (b.right - b.left <= 0 || b.bottom - b.top <= 0) continue; if (b.left < ab.left - 1 || b.right > ab.right + 1 || b.top < ab.top - 1 || b.bottom > ab.bottom + 1) { if (cs.position !== 'fixed') exits.push({ tag: el.tagName, cls: String(el.className).slice(0, 50), text: (el.textContent || el.alt || '').trim().slice(0, 40), box: [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] }); } }
        }
        out.overflow = overflow.slice(0, 12); out.exits = exits.slice(0, 12);
        // images
        const imgs = Array.from(active.querySelectorAll('img')).filter(vis); out.imgs = imgs.length; out.brokenImgs = imgs.filter(im => !(im.complete && im.naturalWidth > 0) || im.getAttribute('data-img-fallback') === '1').map(im => (im.currentSrc || im.src).split('/').pop()).slice(0, 10);
        // footer + AIREV + version
        const f = footer; const ft = f ? f.innerText.replace(/\s+/g, ' ') : ''; const airev = f ? f.querySelector('.v152-cobrand img.v152-airev') : null;
        out.footer = { present: !!f && vis(f), version_ok: /v1\.5\.2/.test(ft), airev_ok: !!(airev && airev.complete && airev.naturalWidth > 0 && vis(airev)), text: ft.slice(0, 120) };
        out.dir = document.documentElement.dir; out.player = !!document.querySelector('#athar-narration'); out.playerSegment = (document.querySelector('#athar-narration') || {}).getAttribute ? document.querySelector('#athar-narration').getAttribute('data-segment') : null;
        return out;
      }, { n: r.n });
      // blank-region analysis on the content area
      const shot = await page.screenshot({ type: 'png' });
      let blank = null;
      try {
        const cb = res.contentBox; if (cb && cb.w > 50 && cb.h > 50) {
          const { data, info } = await sharp(shot).extract({ left: cb.x, top: cb.y, width: cb.w, height: cb.h }).raw().toBuffer({ resolveWithObject: true });
          const cols = 16, rows = 9, cw = Math.floor(info.width / cols), chh = Math.floor(info.height / rows); const grid = [];
          for (let gy = 0; gy < rows; gy++) { const row = []; for (let gx = 0; gx < cols; gx++) { let same = 0, tot = 0; const x0 = gx * cw, y0 = gy * chh; const base = [data[((y0) * info.width + x0) * info.channels], data[((y0) * info.width + x0) * info.channels + 1], data[((y0) * info.width + x0) * info.channels + 2]]; for (let y = y0; y < y0 + chh; y += 2) for (let x = x0; x < x0 + cw; x += 2) { const i = (y * info.width + x) * info.channels; const d = Math.abs(data[i] - base[0]) + Math.abs(data[i + 1] - base[1]) + Math.abs(data[i + 2] - base[2]); tot++; if (d <= 18) same++; } row.push(same / tot >= 0.985 ? 1 : 0); } grid.push(row); }
          // largest rectangle of blank cells
          let best = 0; const H = new Array(cols).fill(0);
          for (let gy = 0; gy < rows; gy++) { for (let gx = 0; gx < cols; gx++) H[gx] = grid[gy][gx] ? H[gx] + 1 : 0; for (let gx = 0; gx < cols; gx++) { let mn = H[gx]; if (!mn) continue; for (let k = gx; k < cols && H[k]; k++) { mn = Math.min(mn, H[k]); best = Math.max(best, mn * (k - gx + 1)); } } }
          const blankCells = grid.flat().reduce((a, b) => a + b, 0);
          blank = { largest_block_ratio: +(best / (cols * rows)).toFixed(3), blank_cell_ratio: +(blankCells / (cols * rows)).toFixed(3) };
        }
      } catch (e) { blank = { error: String(e).slice(0, 120) }; }
      const cE = consoleErr.slice(c0), pE = pageErr.slice(p0), fR = failedReq.slice(f0), bR = badResp.slice(b0);
      const defects = [];
      if (res.error) defects.push('no-active-slide'); if ((res.overflow || []).length) defects.push('text-overflow:' + res.overflow.length); if ((res.exits || []).length) defects.push('box-exits-slide:' + res.exits.length);
      if (blank && blank.largest_block_ratio > 0.35) defects.push('blank-block:' + blank.largest_block_ratio); if ((res.brokenImgs || []).length) defects.push('broken-img:' + res.brokenImgs.length);
      if (cE.length) defects.push('console-error:' + cE.length); if (pE.length) defects.push('page-error:' + pE.length); if (fR.length) defects.push('request-failed:' + fR.length); if (bR.length) defects.push('http>=400:' + bR.length);
      if (!res.footer || !res.footer.present) defects.push('footer-missing'); else { if (!res.footer.version_ok) defects.push('version-badge'); if (!res.footer.airev_ok) defects.push('airev-logo'); }
      if (!narration.ok) defects.push('narration-mapping'); if ((lang === 'ar') !== (res.dir === 'rtl')) defects.push('dir');
      const view = { viewport: `${vp.w}x${vp.h}`, lang, slide: r.n, route: r.hash, slideId: res.slideId, title: res.title, verdict: defects.length ? 'FAIL' : 'PASS', defects, overflow: res.overflow, exits: res.exits, blank, imgs: res.imgs, brokenImgs: res.brokenImgs, console_errors: cE, page_errors: pE, failed_requests: fR, http_ge400: bR, footer: res.footer, dir: res.dir, player: res.player, playerSegment: res.playerSegment, ts: new Date().toISOString() };
      if (SHOTS) { const name = `${LABEL}-${lang}-${vp.w}x${vp.h}-${String(r.n).padStart(2, '0')}.jpg`; fs.writeFileSync(path.join(OUT, 'shots', name), await sharp(shot).jpeg({ quality: 74 }).toBuffer()); view.screenshot = 'shots/' + name; }
      report.views.push(view);
    }
    await ctx.close();
  }
} finally { await browser.close(); }
const S = report.summary; S.total = report.views.length; S.pass = report.views.filter(v => v.verdict === 'PASS').length; S.fail = S.total - S.pass;
S.by_defect = {}; report.views.forEach(v => v.defects.forEach(d => { const k = d.split(':')[0]; S.by_defect[k] = (S.by_defect[k] || 0) + 1; }));
S.ended_utc = new Date().toISOString(); S.seconds = Math.round((Date.now() - t0) / 1000); S.narration = narration;
fs.writeFileSync(path.join(OUT, 'qa-report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(S));
