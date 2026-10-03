#!/usr/bin/env node
/* v1.5.2 deliverable renders (EN 1920×1080) + targeted fix assertions. usage: node qa/shots.mjs <baseUrl> <outDir> */
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import path from 'node:path';
const [,, BASE, OUT] = process.argv; fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required'] });
const checks = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } }); const page = await ctx.newPage();
  const errs = []; page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 160)); }); page.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0, 160)));
  await page.goto(`${BASE}/?lang=en&intro=1&shots=1`, { waitUntil: 'load' });
  await page.evaluate(() => { try { sessionStorage.setItem('athar-intro-v1.4.2', 'done'); localStorage.setItem('athar-narration-prefs-v1', JSON.stringify({ autoplay: false, muted: true, captions: true, volume: 0.9 })); } catch (e) {} });
  const go = async (hash, wait = 1200) => { await page.goto(`${BASE}/?lang=en${hash}`, { waitUntil: 'load' }); await page.waitForTimeout(wait); for (let i = 0; i < 10; i++) { const pend = await page.evaluate(() => Array.from(document.images).filter(im => im.offsetParent !== null && getComputedStyle(im).visibility !== 'hidden' && !im.complete).length); if (!pend) break; await page.waitForTimeout(300); } };
  const shot = async (name, clip) => { await page.screenshot({ path: path.join(OUT, name), type: 'png', clip }); };
  // slide 13 — plugins hub
  await go('#/13');
  checks.plugins = await page.evaluate(() => {
    const svg = document.querySelector('#s-pillar-plugins .pv-svg'); if (!svg) return { error: 'no svg' };
    const texts = Array.from(svg.querySelectorAll('text')).filter(t => /one shared|plugin standard/.test(t.textContent)); const rect = Array.from(svg.querySelectorAll('rect')).find(r => +r.getAttribute('width') === 176);
    const rb = rect ? { x: +rect.getAttribute('x'), y: +rect.getAttribute('y'), w: +rect.getAttribute('width'), h: +rect.getAttribute('height') } : null;
    const pads = texts.map(t => { const b = t.getBBox(); return { text: t.textContent, left: +(b.x - rb.x).toFixed(1), right: +((rb.x + rb.w) - (b.x + b.width)).toFixed(1), top: +(b.y - rb.y).toFixed(1), bottom: +((rb.y + rb.h) - (b.y + b.height)).toFixed(1) }; });
    const teal = Array.from(svg.querySelectorAll('path[stroke="#0E8A7D"], line[stroke="#0E8A7D"]')).map(p => p.getAttribute('stroke-width'));
    const sb = svg.getBoundingClientRect(); const ab = svg.closest('.pv-aside').getBoundingClientRect(); const sec = document.getElementById('s-pillar-plugins').getBoundingClientRect();
    const sub = document.querySelector('#s-pillar-plugins p.sub'), bul = document.querySelector('#s-pillar-plugins .bullets');
    return { hub: rb, labelPadding: pads, minPad: Math.min.apply(null, pads.flatMap(p => [p.left, p.right, p.top, p.bottom])), tealStrokes: teal.length, tealWidths: Array.from(new Set(teal)), svgInsideSlide: sb.right <= sec.right + 1 && sb.bottom <= sec.bottom + 1 && sb.left >= sec.left - 1, svgBox: [Math.round(sb.width), Math.round(sb.height)], subMaxWidth: sub ? getComputedStyle(sub).maxInlineSize : 'n/a', bulletsMaxWidth: bul ? getComputedStyle(bul).maxInlineSize : 'n/a', subWidth: sub ? Math.round(sub.getBoundingClientRect().width) : null, bulletsWidth: bul ? Math.round(bul.getBoundingClientRect().width) : null };
  });
  await shot('v152-slide13-plugins-hub-en-1920.png');
  // slide 30 — what we deliver
  await go('#/27/new-3');
  checks.slide30 = await page.evaluate(() => {
    const sec = document.querySelector('section.it-slide.is-active'); const cards = Array.from(sec.querySelectorAll('.it-cards > .it-card')).map(c => Math.round(c.getBoundingClientRect().height));
    const img = sec.querySelector('.it-card-photo img'); const ib = img.getBoundingClientRect(); const cs = getComputedStyle(img);
    const grid = sec.querySelector('.it-news-cols'); const cardsN = grid.querySelectorAll('.it-news').length; const gb = grid.getBoundingClientRect(); const rows = new Set(Array.from(grid.querySelectorAll('.it-news')).map(a => Math.round(a.getBoundingClientRect().top))).size; const cols = new Set(Array.from(grid.querySelectorAll('.it-news')).map(a => Math.round(a.getBoundingClientRect().left))).size;
    const body = sec.querySelector('.s-body');
    return { cardHeights: cards, photo: { renderedW: Math.round(ib.width), renderedH: Math.round(ib.height), ratio: +(ib.width / ib.height).toFixed(3), nativeRatio: +(1600 / 1067).toFixed(3), objectFit: cs.objectFit, natural: [img.naturalWidth, img.naturalHeight], caption: (sec.querySelector('.it-card-photo-cap') || {}).textContent }, news: { cards: cardsN, rows, cols, gridOverflow: getComputedStyle(grid).overflowY, scrollable: grid.scrollHeight > grid.clientHeight + 1, ids: Array.from(grid.querySelectorAll('.it-news')).map(a => a.getAttribute('data-news-id')) }, agreementBand: !!sec.querySelector('[data-testid="agreement-band"]'), bodyScroll: body.scrollHeight - body.clientHeight };
  });
  await shot('v152-slide30-what-we-deliver-en-1920.png');
  // slide 38 — nations tabs
  await go('#/27/new-11');
  checks.slide38 = {};
  for (const k of ['lb', 'in', 'ke']) {
    await page.click(`.aos-country[data-country="${k}"]`); await page.waitForTimeout(700);
    checks.slide38[k] = await page.evaluate(() => { const p = document.querySelector('[data-testid="nation-panel"]'); const on = document.querySelector('.aos-mini-ph.is-on .aos-mini-t'); const fig = p.querySelector('figure.rs-still, figure.aos-plate'); const fb = fig ? fig.getBoundingClientRect() : null; const pb = p.getBoundingClientRect(); const bn = p.querySelector('[data-testid="nation-banner"] img'); return { country: p.getAttribute('data-country'), tier: p.getAttribute('data-tier'), title: (p.querySelector('.aos-nation-title') || {}).textContent, amount: (p.querySelector('.aos-amount') || {}).textContent, wdi: Array.from(p.querySelectorAll('.it-wbtag')).map(t => t.textContent), src: (p.querySelector('.aos-wdi-src') || {}).textContent, evidence: Array.from(p.querySelectorAll('.aos-evidence-link')).map(a => a.href), banner: bn ? bn.complete && bn.naturalWidth > 0 : false, activePhase: on ? on.textContent : null, insetWidthPct: fb ? +(fb.width / pb.width * 100).toFixed(1) : null, insetRatio: fb ? +(fb.width / fb.height).toFixed(2) : null, dlItems: p.querySelectorAll('.aos-nation-dl dd').length, cta: !!document.querySelector('[data-testid="join-pact-cta"]') }; });
    await shot(`v152-slide38-nations-${k === 'lb' ? 'lebanon' : k === 'in' ? 'india' : 'kenya'}-en-1920.png`);
  }
  // slide 36 — roadmap tooltip + no filmstrip
  await go('#/27/new-9');
  await page.click('.aos-ms'); await page.waitForTimeout(400);
  checks.slide36 = await page.evaluate(() => { const dl = document.querySelector('.aos-ms-dl'); const pairs = dl ? Array.from(dl.querySelectorAll('dt')).map(dt => dt.textContent + ': ' + dt.nextElementSibling.textContent) : []; return { statusPair: pairs.find(p => /^Status/.test(p)) || null, allPairs: pairs.slice(0, 4), filmstrip: !!document.querySelector('.rs-filmstrip'), labelsClamp: getComputedStyle(document.querySelector('.aos-ms-t')).webkitLineClamp, truncated: Array.from(document.querySelectorAll('.aos-ms-t')).filter(t => t.scrollHeight > t.clientHeight + 1).length }; });
  await shot('v152-slide36-roadmap-en-1920.png');
  // slide 29
  await go('#/27/new-2'); checks.slide29 = await page.evaluate(() => Array.from(document.querySelectorAll('.it-tier')).map(t => ({ h: Math.round(t.getBoundingClientRect().height), justify: getComputedStyle(t).justifyContent })));
  await shot('v152-slide29-three-tiers-en-1920.png');
  // slide 4
  await go('#/4');
  checks.slide4 = await page.evaluate(() => { const s = document.getElementById('s-four-outcomes'); const cards = Array.from(s.querySelectorAll('.cards > .card')).map(c => Math.round(c.getBoundingClientRect().height)); const strip = s.querySelector('.athar-partner-strip'); const marksHidden = strip ? getComputedStyle(strip.querySelector('.aps-marks')).display === 'none' : null; const tier = strip ? strip.querySelector('.v152-tier') : null; const cb = s.querySelector('.cards').getBoundingClientRect(); const sb = s.getBoundingClientRect(); return { cardHeights: cards, evidenceLines: s.querySelectorAll('.v152-evidence').length, duplicateMarksRowHidden: marksHidden, tierRow: !!tier, tierAirevLoaded: tier ? (tier.querySelector('img.v152-airev').naturalWidth > 0) : false, reviewTag: (strip.querySelector('.aps-tag') || {}).textContent, cardsBottomPct: +((cb.bottom - sb.top) / sb.height * 100).toFixed(1) }; });
  await shot('v152-slide04-four-outcomes-en-1920.png');
  // footer close-up + cover parent tier + narration
  await go('#/1');
  checks.cover = await page.evaluate(() => { const c = document.getElementById('s-cover'); const tier = c.querySelector('.v152-tier[data-key="cover"]'); const stage = c.querySelector('.logo-stage'); const tb = tier ? tier.getBoundingClientRect() : null, sb = stage.getBoundingClientRect(); const pm = c.querySelector('.cover-partners .pmark--airev img'); const f = document.querySelector('footer.pagefooter'); const fa = f.querySelector('.v152-cobrand img.v152-airev'); const fo = f.querySelector('.v152-cobrand img.v152-oda'); return { tierAboveLockup: tb ? tb.bottom <= sb.top + 1 : false, tierBox: tb ? [Math.round(tb.left), Math.round(tb.top), Math.round(tb.width), Math.round(tb.height)] : null, stageTop: Math.round(sb.top), partnerRowAirevSrc: pm ? pm.getAttribute('src') : null, footer: { text: f.querySelector('[data-testid="footer-text"]').textContent, airev: fa ? [fa.naturalWidth, Math.round(fa.getBoundingClientRect().height)] : null, oda: fo ? fo.naturalWidth > 0 : false, version: f.querySelector('.deck-version').textContent, counter: f.querySelector('.counter').textContent, reviewTag: !!f.querySelector('.aps-tag') }, listenBtn: !!c.querySelector('.nar-listen'), player: !!document.querySelector('#athar-narration') }; });
  const fb = await page.evaluate(() => { const b = document.querySelector('footer.pagefooter').getBoundingClientRect(); return { x: 0, y: Math.round(b.top) - 2, width: 1920, height: Math.round(b.height) + 2 }; });
  await shot('v152-footer-closeup-en-1920.png', fb);
  await page.evaluate(() => { window.AtharNarration && window.AtharNarration.setCaptions(true); }); await page.click('[data-testid="listen-to-guide"]'); await page.waitForTimeout(900);
  checks.narration = await page.evaluate(() => { const n = window.AtharNarration; const root = document.querySelector('#athar-narration'); const a = document.querySelector('audio'); return { present: !!root, segment: root.getAttribute('data-segment'), status: root.getAttribute('data-status'), drawerOpen: !root.querySelector('.nar-drawer').hidden, transcript: (root.querySelector('.nar-text--en') || {}).textContent.slice(0, 60), segments: n ? n.manifest.segments.length : 0, withAudio: n ? n.manifest.segments.filter(s => s.audio).length : 0, playing: n && n.current() ? true : false, prefsKey: !!localStorage.getItem('athar-narration-prefs-v1'), seekRole: root.querySelector('.nar-seek').getAttribute('role'), buttons: Array.from(root.querySelectorAll('button')).map(b => b.getAttribute('data-testid')) }; });
  await page.keyboard.press('n'); await page.waitForTimeout(300);
  checks.narration.afterNkey_paused = await page.evaluate(() => { const r = document.querySelector('#athar-narration'); return !r.classList.contains('is-playing'); });
  await shot('v152-narration-player-transcript-en-1920.png');
  // slide 17 + closing
  await go('#/17'); checks.slide17 = await page.evaluate(() => ({ byoh: /BYOH — Bring Your Own Hardware/.test(document.body.innerText), byoc: /BYOC — Bring Your Own Cloud/.test(document.body.innerText), license_spelling: (document.body.innerText.match(/\blicense/gi) || []).length }));
  await go('#/28'); checks.closing = await page.evaluate(() => { const c = document.getElementById('s-closing'); const tier = c.querySelector('.v152-tier[data-key="closing"]'); const lk = c.querySelector('.closing-lockup'); const tb = tier.getBoundingClientRect(), lb = lk.getBoundingClientRect(); const img = c.querySelector('.athar-lockup-full').getBoundingClientRect(); const f = document.querySelector('footer.pagefooter').getBoundingClientRect(); return { tierAboveLockup: tb.bottom <= lb.top + 1, lockupAboveFooter: img.bottom <= f.top + 1, imgBottom: Math.round(img.bottom), footerTop: Math.round(f.top) }; });
  await shot('v152-slide39-closing-en-1920.png');
  checks.consoleErrors = errs;
  await ctx.close();
} finally { await browser.close(); }
fs.writeFileSync(path.join(OUT, 'fix-assertions.json'), JSON.stringify(checks, null, 1)); console.log(JSON.stringify(checks, null, 1));
