// v1.4.7 image-render verification — 39 slides × en/ar against QC_BASE (local or live). Fresh headless Chromium (playwright-core +
// system Chromium), cache disabled. Per combination: active-slide + chrome <img> decode state (complete/naturalWidth/no fallback),
// <picture> sources, <video poster>, CSS background-image URLs, bounds vs stage/viewport (RTL aware), text-overlap on slides 21 + 30,
// axe-core image rules, console/page errors, failed/aborted/4xx requests, 1920×1080 screenshot. Then every unique asset URL is fetched
// out-of-band (GET, no cache) for status / content-type / bytes / sha256. Output: QC_OUT/{results.json,images.json,http.json,screenshots/}.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import { launch, gotoSlide, slideUrl, utc, writeJson, BASE, OUT, TOTAL } from './h.mjs';
const AXE_SRC = fs.readFileSync('/tmp/qcenv/node_modules/axe-core/axe.min.js', 'utf8');
const LABEL = process.env.QC_LABEL || 'local';
const LOCALES = (process.env.QC_LOCALES || 'en,ar').split(',');
const ONLY = process.env.QC_ONLY ? new Set(process.env.QC_ONLY.split(',').map(Number)) : null;
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', ico: ['image/x-icon', 'image/vnd.microsoft.icon'], gif: 'image/gif', avif: 'image/avif', mp4: 'video/mp4', webm: 'video/webm', vtt: 'text/vtt', woff2: 'font/woff2', woff: 'font/woff', json: 'application/json', webmanifest: ['application/manifest+json', 'application/json'] };
fs.mkdirSync(OUT, { recursive: true });
const results = []; const imageRows = []; const netAll = [];
const started = utc();
const { ctx, page } = await launch({ viewport: { width: 1920, height: 1080 } });
let consoleErrs = [], pageErrs = [], failedReqs = [], badResponses = [], responses = [];
page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 300)); });
page.on('pageerror', e => pageErrs.push(String(e && e.message || e).slice(0, 300)));
page.on('requestfailed', r => failedReqs.push({ url: r.url(), err: (r.failure() || {}).errorText, type: r.resourceType() }));
page.on('response', r => { const st = r.status(); const u = r.url(); responses.push({ url: u, status: st, type: r.request().resourceType() }); if (st >= 400) badResponses.push({ url: u, status: st, type: r.request().resourceType() }); });
const ok200 = new Set([200, 204, 206, 304]);
const TRANSIENT_RE = /ERR_HTTP2_PROTOCOL_ERROR|ERR_SPDY_PROTOCOL_ERROR|ERR_FAILED|ERR_CONNECTION_RESET|ERR_CONNECTION_CLOSED|ERR_NETWORK_CHANGED|ERR_TIMED_OUT|ERR_QUIC_PROTOCOL_ERROR/;
// A combination whose ONLY failures are transport-level (a request that died in flight on the network layer, logged by the browser as
// "Failed to load resource: net::ERR_*") with ZERO image defects is reloaded once; the transient event is recorded in summary.transientTransportRetries.
function isTransientOnly(row) { const f = new Set(row.failedChecks); if (!f.size) return false; for (const k of f) if (k !== "consoleClean" && k !== "networkClean" && k !== "noFallbackTriggered") return false; if (row.imgFail.length || row.boundsFail.length || row.stretchFail.length || row.badResponses.length) return false; if (!row.failedRequests.length || !row.failedRequests.every(r => TRANSIENT_RE.test(r.err || ""))) return false; if (!row.consoleErrs.every(c => /Failed to load resource/.test(c))) return false; if ((row.fallbackImgs || []).some(fb => !row.failedRequests.some(r => r.url === fb.orig))) return false; return true; }
const transient = [];
async function runCombo(n, lang) {
  consoleErrs = []; pageErrs = []; failedReqs = []; badResponses = []; responses = [];
  const t0 = utc();
  await gotoSlide(page, n, lang, 900);
  // deep links into the virtual slides (#/27/new-N) are resolved by the runtime host after the modules load — on a slow network that can
  // take longer than the fixed settle, so wait (≤ 10 s) until the footer counter names the requested slide, and record how long it took
  const tEnter = Date.now();
  await page.waitForFunction((n) => { const c = document.querySelector('.pagefooter .counter, .counter'); const t = ((c && c.textContent) || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)); return new RegExp('(^|\\D)' + n + '(\\D|$)').test(t) && /39/.test(t); }, n, { timeout: 10000 }).catch(() => {});
  const enterWaitMs = Date.now() - tEnter;
  // DOM quiescence: the product tour (slide 35) and other lazy modules mount their screens asynchronously — wait until the <img> count of
  // the shown slide has been stable for 800 ms (≤ 8 s) so a slow network cannot hide an image from the sample
  await page.evaluate(async () => { const t0 = Date.now(); let last = -1, stableSince = Date.now(); while (Date.now() - t0 < 8000) { const c = document.images.length; if (c !== last) { last = c; stableSince = Date.now(); } else if (Date.now() - stableSince > 800) break; await new Promise(r => setTimeout(r, 100)); } });
  // let lazy images inside the now-active slide load
  await page.waitForTimeout(400);
  const data = await page.evaluate(async ({ n, lang }) => {
    const out = { n, lang, dir: document.documentElement.dir, htmlLang: document.documentElement.lang, hash: location.hash };
    const sec = n === 39 ? document.getElementById("s-closing") : (n >= 28 ? document.querySelector(`section.slide.it-slide[data-n="${n}"]`) : document.querySelector(`section.slide[data-n="${String(n).padStart(2, "0")}"]:not(.it-slide)`)); /* real slides carry zero-padded data-n 01..27, the closing slide keeps data-n 28 but is presented as slide 39 of 39; virtual slides 28..38 are .it-slide with plain data-n */
    out.sectionFound = !!sec; if (!sec) return out;
    out.sectionActive = sec.classList.contains('is-active') && sec.getAttribute('aria-hidden') !== 'true';
    const stage = document.querySelector('main.stage') || sec; const S = stage.getBoundingClientRect();
    out.stage = [S.left, S.top, S.width, S.height];
    const footer = document.querySelector('footer.pagefooter'); const F = footer ? footer.getBoundingClientRect() : null; out.footer = F && [F.left, F.top, F.width, F.height];
    out.counter = (document.querySelector('.pagefooter .counter, .pagefooter [data-testid="counter"], .counter') || {}).textContent || '';
    out.footerVersion = footer ? /v1\.\d+\.\d+/.exec(footer.textContent || '')?.[0] : null;
    const vis = e => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; let p = e.parentElement; while (p) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden') return false; p = p.parentElement; } return true; };
    const chromeRoots = [document.querySelector('header.topbar, header.bar, .topbar, header'), footer, document.querySelector('nav.rail, .rail, aside')].filter(Boolean);
    const scopeOf = el => sec.contains(el) ? 'slide' : 'chrome';
    const imgs = [...sec.querySelectorAll('img')]; for (const r of chromeRoots) for (const i of r.querySelectorAll('img')) if (!imgs.includes(i) && !sec.contains(i)) imgs.push(i);
    // force-decode anything not yet complete (lazy images in hidden tab panels) so we test "can it render", then re-read
    await Promise.all(imgs.filter(i => !i.complete || i.naturalWidth === 0).map(async i => { try { i.loading = 'eager'; await Promise.race([i.decode(), new Promise(r => setTimeout(r, 4000))]); } catch (e) {} }));
    const inb = (r, tol = 1) => r.left >= S.left - tol && r.top >= S.top - tol && r.right <= S.right + tol && r.bottom <= S.bottom + tol;
    // visible (clipped) rect: intersect with every ancestor that clips (overflow hidden/clip/auto/scroll) — a deliberately cropped image
    // (e.g. the cover lock-up whose transparent padding is cut by its overflow:hidden box) is judged by what can actually paint
    const clipRect = (el) => { let r = el.getBoundingClientRect(); let L = r.left, T = r.top, R = r.right, B = r.bottom; let p = el.parentElement; while (p && p !== document.body) { const c = getComputedStyle(p); if (/(hidden|clip|auto|scroll)/.test(c.overflow + c.overflowX + c.overflowY)) { const q = p.getBoundingClientRect(); L = Math.max(L, q.left); T = Math.max(T, q.top); R = Math.min(R, q.right); B = Math.min(B, q.bottom); } p = p.parentElement; } return { left: L, top: T, right: R, bottom: B, width: Math.max(0, R - L), height: Math.max(0, B - T) }; };
    const inv = (r, tol = 1) => r.left >= -tol && r.top >= -tol && r.right <= innerWidth + tol && r.bottom <= innerHeight + tol;
    out.images = imgs.map(i => { const r = clipRect(i); const pic = i.parentElement && i.parentElement.tagName === 'PICTURE' ? i.parentElement : null; const v = vis(i);
      const sel = (i.id ? '#' + i.id : i.tagName.toLowerCase() + (i.className ? '.' + String(i.className).trim().split(/\s+/).slice(0, 2).join('.') : '')) + (i.closest('[data-testid]') ? ' <' + i.closest('[data-testid]').getAttribute('data-testid') + '>' : '') + (i.closest('figure[data-img]') ? ' [data-img=' + i.closest('figure[data-img]').getAttribute('data-img') + ']' : '');
      return { scope: scopeOf(i), selector: sel, src: i.getAttribute('src') || '', currentSrc: i.currentSrc || '', srcset: i.getAttribute('srcset') || '', sources: pic ? [...pic.querySelectorAll('source')].map(s => s.getAttribute('srcset')) : [], complete: i.complete, naturalWidth: i.naturalWidth, naturalHeight: i.naturalHeight, widthAttr: i.getAttribute('width'), heightAttr: i.getAttribute('height'), alt: i.getAttribute('alt'), ariaHidden: !!i.closest('[aria-hidden="true"]'), loading: i.getAttribute('loading'), decoding: i.getAttribute('decoding'), fallback: i.getAttribute('data-img-fallback'), visible: v, rect: [r.left, r.top, r.width, r.height], box: (b => [b.left, b.top, b.width, b.height])(i.getBoundingClientRect()), objectFit: getComputedStyle(i).objectFit, stretched: (function () { const b = i.getBoundingClientRect(); const of = getComputedStyle(i).objectFit; if (!v || b.width < 8 || b.height < 8 || !i.naturalWidth || !i.naturalHeight) return false; if (of && of !== 'fill') return false; const ra = b.width / b.height, rn = i.naturalWidth / i.naturalHeight; return Math.abs(ra - rn) / rn > 0.03; })(), inStage: !v || (r.width === 0 && r.height === 0) || !sec.contains(i) ? true : inb(r), inViewport: !v || (r.width === 0 && r.height === 0) ? true : inv(r) }; });
    // <picture>/<svg> boxes and inline svg <image>/<use>
    const boxes = [...sec.querySelectorAll('picture, svg')].filter(vis).map(e => { const r = clipRect(e); return { tag: e.tagName.toLowerCase(), rect: [r.left, r.top, r.width, r.height], inStage: (r.width === 0 && r.height === 0) || inb(r) }; });
    out.boxesOut = boxes.filter(b => !b.inStage);
    out.svgHrefs = [...sec.querySelectorAll('svg image, svg use')].map(e => e.getAttribute('href') || e.getAttribute('xlink:href')).filter(h => h && !h.startsWith('#'));
    out.videos = [...sec.querySelectorAll('video')].map(v => ({ poster: v.getAttribute('poster'), posterFallback: v.getAttribute('data-img-fallback'), src: v.currentSrc, sources: [...v.querySelectorAll('source')].map(s => s.src) }));
    // CSS background images on the active slide + chrome (computed)
    const bgs = new Set(); const els = [sec, ...sec.querySelectorAll('*'), ...chromeRoots.flatMap(r => [r, ...r.querySelectorAll('*')])];
    for (const e of els) { const b = getComputedStyle(e).backgroundImage; if (b && b !== 'none') { let m; const re = /url\((['"]?)([^'")]+)\1\)/g; while ((m = re.exec(b))) if (!/^data:/.test(m[2])) bgs.add(m[2]); } }
    out.bgUrls = [...bgs];
    out.bgFallbacks = [...document.querySelectorAll('[data-bg-fallback]')].length;
    // overflow beyond the stage: any visible element of the slide whose box exits the stage by > 1px
    const overflow = []; for (const e of sec.querySelectorAll('*')) { if (!vis(e)) continue; const r = clipRect(e); if (r.width === 0 || r.height === 0) continue; if (r.bottom > S.bottom + 1 || r.top < S.top - 1 || r.left < S.left - 1 || r.right > S.right + 1) overflow.push({ el: e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).trim().split(/\s+/).slice(0, 2).join('.') : ''), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] }); }
    out.overflow = overflow.slice(0, 20); out.overflowCount = overflow.length;
    // text-overlap detector (slides 21 + 30): visible text-bearing leaf blocks, pairwise intersection of boxes that are not nested
    if (n === 21 || n === 30) {
      const blocks = [...sec.querySelectorAll('h1,h2,h3,h4,p,li,span,figcaption,small,a,button,td,th,dt,dd,label,em,strong')].filter(e => vis(e) && [...e.childNodes].some(c => c.nodeType === 3 && c.textContent.trim().length > 1)).map(e => ({ e, r: e.getBoundingClientRect(), t: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) })).filter(b => b.r.width > 2 && b.r.height > 2);
      const ov = [];
      for (let a = 0; a < blocks.length; a++) for (let b = a + 1; b < blocks.length; b++) { const A = blocks[a], B = blocks[b]; if (A.e.contains(B.e) || B.e.contains(A.e)) continue; const ix = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left), iy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top); if (ix > 2 && iy > 2) ov.push({ a: A.t, b: B.t, ix: Math.round(ix), iy: Math.round(iy) }); }
      out.textOverlaps = ov.slice(0, 30); out.textOverlapCount = ov.length;
      // named pairs
      if (n === 30) { const grid = sec.querySelector('.it-cards'), band = sec.querySelector('.it-agreement'), news = sec.querySelector('.it-newsstrip'), fn = sec.querySelector('.it-footnotes'); const R = e => e && e.getBoundingClientRect(); const g = R(grid), b = R(band), nw = R(news), f = R(fn);
        const cardRects = [...sec.querySelectorAll('.it-card')].map(e => e.getBoundingClientRect()); const inter30 = (a, c) => a && c && Math.min(a.right, c.right) - Math.max(a.left, c.left) > 1 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 1;
        const bulletRects = [...sec.querySelectorAll('.it-card li')].map(e => e.getBoundingClientRect()); const fnRect = R(fn); const newsRect = R(news);
        out.slide30 = { cardCount: cardRects.length, bandOverlapsCards: cardRects.filter(c => inter30(b, c)).length, bandOverlapsBullets: bulletRects.filter(c => inter30(b, c)).length, footnotesOverlapCards: cardRects.filter(c => inter30(fnRect, c)).length, footnotesOverlapNews: !!inter30(fnRect, newsRect), bandText: band && band.textContent.trim().slice(0, 80), cardsBottom: g && g.bottom, bandTop: b && b.top, newsBottom: nw && nw.bottom, footnotesTop: f && f.top, footnotesBottom: f && f.bottom, stageBottom: S.bottom, footerTop: F && F.top, cardsVsBand: !!(g && b && g.bottom <= b.top + 0.5), newsVsFootnotes: !!(nw && f && nw.bottom <= f.top + 0.5), footnotesInsideStage: !!(f && f.bottom <= S.bottom + 0.5), footnotesAboveFooter: !!(f && F && f.bottom <= F.top + 0.5) };
        const leb = sec.querySelector('[data-testid="it-card-lebanon"]'); out.lebanon = leb && { tag: leb.tagName, href: leb.getAttribute('href'), target: leb.getAttribute('target'), rel: leb.getAttribute('rel'), focusable: leb.tabIndex >= 0, caption: (leb.querySelector('.it-card-photo-cap') || {}).textContent || '', note: (leb.querySelector('.it-card-note') || {}).textContent || '', img: (i => i && { currentSrc: i.currentSrc, w: i.naturalWidth, h: i.naturalHeight, alt: i.alt })(leb.querySelector('.it-card-photo img')) };
        if (leb) { leb.focus(); const cs = getComputedStyle(leb); out.lebanon.focusRing = { outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor, boxShadow: cs.boxShadow, activeIsCard: document.activeElement === leb }; leb.blur(); } }
      if (n === 21) { const wall = sec.querySelector('.wall'); const strip = sec.querySelector('.aps-strip, .partner-strip, [data-testid="partner-strip"]'); const logos = [...sec.querySelectorAll('.wall img, .aps-strip img')].map(i => i.getBoundingClientRect()); const R = e => e && e.getBoundingClientRect(); const w = R(wall), s = R(strip);
        const foot = sec.querySelector('p.muted.small, .s-body > p.small, .s-body > p.muted'); const fr = R(foot);
        const stripEls = [...sec.querySelectorAll('.athar-partner-strip, .aps-strip, [data-testid="partner-strip"]')]; const stripVis = stripEls.filter(vis).map(e => R(e));
        const lockup = [...sec.querySelectorAll('img')].filter(vis).map(i => ({ src: (i.currentSrc || '').replace(location.origin, ''), r: i.getBoundingClientRect() })).filter(x => /athar-logo|lockup|athar-mark/i.test(x.src));
        const inter = (a, b) => a && b && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
        const footerStrip = document.querySelector('footer.pagefooter .aps-footer'); const fsr = R(footerStrip);
        out.slide21 = { wallBottom: w && w.bottom, stripRect: s && [s.left, s.top, s.width, s.height], footerTop: F && F.top, stageBottom: S.bottom, logosBelowFooterTop: logos.filter(r => F && r.bottom > F.top + 0.5).length, logosOutsideStage: logos.filter(r => r.bottom > S.bottom + 0.5 || r.right > S.right + 0.5 || r.left < S.left - 0.5).length, logoCount: logos.length, wallAboveFooter: !!(w && F && w.bottom <= F.top + 0.5),
          sectionClasses: sec.className, footnoteText: foot && foot.textContent.trim().slice(0, 90), footnoteRect: fr && [fr.left, fr.top, fr.width, fr.height], footnoteOverlapsWall: !!(fr && w && inter(fr, w)), footnoteOverlapsAnyLogo: logos.filter(r => inter(fr, r)).length, footnoteBelowFooterTop: !!(fr && F && fr.bottom > F.top + 0.5),
          inSlidePartnerStripVisible: stripVis.length, inSlidePartnerStripRects: stripVis.map(r => [r.left, r.top, r.width, r.height]), lockupImgs: lockup.map(x => ({ src: x.src, rect: [x.r.left, x.r.top, x.r.width, x.r.height] })), lockupOverlapsFooterStrip: lockup.filter(x => inter(x.r, fsr)).length, lockupOverlapsFootnote: lockup.filter(x => inter(x.r, fr)).length, footerPartnerStripRect: fsr && [fsr.left, fsr.top, fsr.width, fsr.height], anySlideElementOverlapsFooterStrip: [...sec.querySelectorAll('img, p, h2, h3, li')].filter(vis).filter(e => inter(e.getBoundingClientRect(), fsr)).length }; }
    }
    out.guard = window.AtharImgGuard ? { version: window.AtharImgGuard.version, failed: window.AtharImgGuard.failed, warnings: window.AtharImgGuard.warnings } : null;
    out.fallbackImgs = [...document.querySelectorAll('img[data-img-fallback], video[data-img-fallback]')].map(e => ({ tag: e.tagName, orig: e.getAttribute('data-img-original') || e.getAttribute('data-poster-original'), inActive: sec.contains(e) }));
    return out;
  }, { n, lang });
  // axe-core image rules on the active slide + chrome
  let axe = null;
  try {
    await page.addScriptTag({ content: AXE_SRC });
    axe = await page.evaluate(async (n) => { const sel = n === 39 ? '#s-closing' : (n >= 28 ? `section.slide.it-slide[data-n="${n}"]` : `section.slide[data-n="${String(n).padStart(2, '0')}"]:not(.it-slide)`); const r = await window.axe.run({ include: [[sel], ['footer.pagefooter'], ['header']] }, { runOnly: { type: 'rule', values: ['image-alt', 'role-img-alt', 'svg-img-alt', 'image-redundant-alt'] }, resultTypes: ['violations', 'incomplete', 'passes'] }); return { violations: r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(x => x.target.join(' ')).slice(0, 10) })), incomplete: r.incomplete.map(v => ({ id: v.id, nodes: v.nodes.length })), passes: r.passes.map(p => ({ id: p.id, nodes: p.nodes.length })) }; }, n);
  } catch (e) { axe = { error: String(e).slice(0, 200) }; }
  // screenshot
  const shotDir = path.join(OUT, 'screenshots', lang); fs.mkdirSync(shotDir, { recursive: true });
  const shot = path.join(shotDir, `slide-${String(n).padStart(2, '0')}.png`);
  await page.screenshot({ path: shot, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  await page.waitForTimeout(150);
  const netFailed = failedReqs.filter(f => !/net::ERR_ABORTED/.test(f.err || '') || !/media|video|xhr|fetch/.test(f.type));
  const abortedMedia = failedReqs.filter(f => /net::ERR_ABORTED/.test(f.err || '') && /media|video/.test(f.type));
  const bad = badResponses.filter(b => new URL(b.url).origin === new URL(BASE).origin);
  netAll.push(...responses.map(r => ({ n, lang, ...r })));
  const imgFail = (data.images || []).filter(i => !(i.complete && i.naturalWidth > 0 && i.naturalHeight > 0) || i.fallback);
  const attrFail = (data.images || []).filter(i => i.alt === null || !i.widthAttr || !i.heightAttr);
  const boundsFail = (data.images || []).filter(i => i.visible && (!i.inStage || !i.inViewport));
  const stretchFail = (data.images || []).filter(i => i.stretched);
  const rtlOk = lang === 'ar' ? (data.dir === 'rtl' && data.htmlLang === 'ar') : (data.dir === 'ltr' && data.htmlLang === 'en');
  const counterOk = new RegExp(`(^|\\D)${n}(\\D|$)`).test((data.counter || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))) && /39/.test((data.counter || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const axeViol = axe && axe.violations ? axe.violations.length : (axe && axe.error ? -1 : 0);
  const overlapFail = (n === 30 && data.slide30 && !(data.slide30.cardsVsBand && data.slide30.newsVsFootnotes && data.slide30.footnotesInsideStage && data.slide30.footnotesAboveFooter && data.slide30.bandOverlapsCards === 0 && data.slide30.bandOverlapsBullets === 0 && data.slide30.footnotesOverlapCards === 0 && !data.slide30.footnotesOverlapNews)) || (n === 21 && data.slide21 && !(data.slide21.logosBelowFooterTop === 0 && data.slide21.logosOutsideStage === 0 && data.slide21.wallAboveFooter && !data.slide21.footnoteOverlapsWall && data.slide21.footnoteOverlapsAnyLogo === 0 && !data.slide21.footnoteBelowFooterTop && data.slide21.lockupOverlapsFooterStrip === 0 && data.slide21.lockupOverlapsFootnote === 0 && data.slide21.anySlideElementOverlapsFooterStrip === 0)) || ((n === 21 || n === 30) && (data.textOverlapCount || 0) > 0);
  const lebFail = n === 30 && !(data.lebanon && data.lebanon.tag === 'A' && data.lebanon.href === 'https://www.thenationalnews.com/news/mena/2026/09/25/uae-and-lebanon-launch-ai-training-initiative/' && data.lebanon.target === '_blank' && /noopener/.test(data.lebanon.rel || '') && /noreferrer/.test(data.lebanon.rel || '') && data.lebanon.focusable && data.lebanon.img && data.lebanon.img.w > 0 && data.lebanon.caption.length > 20 && data.lebanon.note.length > 20 && data.lebanon.focusRing && data.lebanon.focusRing.activeIsCard && data.lebanon.focusRing.outlineStyle !== 'none');
  const checks = { sectionActive: !!data.sectionActive, rtl: rtlOk, counter: counterOk, footerVersion: data.footerVersion === 'v1.4.7', imagesDecoded: imgFail.length === 0, imageAttrs: attrFail.length === 0, imageBounds: boundsFail.length === 0, notStretched: stretchFail.length === 0, boxesInStage: (data.boxesOut || []).length === 0, noOverflow: (data.overflowCount || 0) === 0, noFallbackTriggered: (data.fallbackImgs || []).length === 0 && (!data.guard || data.guard.failed.length === 0), noBgFallback: (data.bgFallbacks || 0) === 0, consoleClean: consoleErrs.length === 0, pageErrorsClean: pageErrs.length === 0, networkClean: netFailed.length === 0 && bad.length === 0, axeClean: axeViol === 0, overlapClean: !overlapFail, lebanonCard: !lebFail };
  const failed = Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k);
  const row = { label: LABEL, n, lang, url: slideUrl(n, lang), checked_at_utc: t0, enterWaitMs, hash: data.hash, pass: failed.length === 0, failedChecks: failed, checks, imageCount: (data.images || []).length, imgFail: imgFail.map(i => ({ selector: i.selector, src: i.currentSrc || i.src, complete: i.complete, nw: i.naturalWidth, fallback: i.fallback })), attrFail: attrFail.map(i => ({ selector: i.selector, src: i.currentSrc || i.src, alt: i.alt, w: i.widthAttr, h: i.heightAttr })), boundsFail: boundsFail.map(i => ({ selector: i.selector, src: i.currentSrc, rect: i.rect })), stretchFail: stretchFail.map(i => ({ selector: i.selector, src: i.currentSrc, box: i.box, natural: [i.naturalWidth, i.naturalHeight], objectFit: i.objectFit })), boxesOut: data.boxesOut, overflow: data.overflow, textOverlaps: data.textOverlaps, slide30: data.slide30, slide21: data.slide21, lebanon: data.lebanon, bgUrls: data.bgUrls, videos: data.videos, svgHrefs: data.svgHrefs, consoleErrs, pageErrs, failedRequests: netFailed, abortedMedia: abortedMedia.length, badResponses: bad, axe, guard: data.guard, fallbackImgs: data.fallbackImgs, screenshot: path.relative(OUT, shot), counter: data.counter, dir: data.dir };
  return { row, data, t0, axeViol, failed };
}
for (let n = 1; n <= TOTAL; n++) for (const lang of LOCALES) {
  if (ONLY && !ONLY.has(n)) continue;
  let out = await runCombo(n, lang);
  if (isTransientOnly(out.row)) { transient.push({ n, lang, attempt: 1, at: out.t0, failedRequests: out.row.failedRequests, consoleErrs: out.row.consoleErrs, fallbackImgs: out.row.fallbackImgs }); process.stdout.write(`${LABEL} ${String(n).padStart(2, "0")}-${lang} transient transport error (${out.row.failedRequests.map(r => r.err + " " + r.url.split("/").pop()).join("; ")}) -> reloading once\n`); out = await runCombo(n, lang); out.row.retriedAfterTransient = true; }
  const { row, data, t0, axeViol, failed } = out;
  results.push(row);
  for (const i of (data.images || [])) imageRows.push({ label: LABEL, slide: n, locale: lang, scope: i.scope, selector: i.selector, src: i.src, currentSrc: i.currentSrc, sources: i.sources, complete: i.complete, naturalW: i.naturalWidth, naturalH: i.naturalHeight, widthAttr: i.widthAttr, heightAttr: i.heightAttr, alt: i.alt, ariaHidden: i.ariaHidden, loading: i.loading, decoding: i.decoding, fallback: i.fallback, visible: i.visible, rect: i.rect.map(x => Math.round(x)), box: i.box.map(x => Math.round(x)), objectFit: i.objectFit, stretched: i.stretched, inStage: i.inStage, inViewport: i.inViewport, axeViolations: axeViol, checked_at_utc: t0, pass: i.complete && i.naturalWidth > 0 && i.naturalHeight > 0 && !i.fallback && i.alt !== null && !!i.widthAttr && !!i.heightAttr && (!i.visible || (i.inStage && i.inViewport)) });
  for (const v of (data.videos || [])) if (v.poster) imageRows.push({ label: LABEL, slide: n, locale: lang, scope: 'slide', selector: 'video[poster]', src: v.poster, currentSrc: new URL(v.poster, BASE).href, kind: 'video-poster', fallback: v.posterFallback, checked_at_utc: t0, pass: !v.posterFallback });
  for (const b of (data.bgUrls || [])) imageRows.push({ label: LABEL, slide: n, locale: lang, scope: 'slide/chrome', selector: 'css background-image', src: b, currentSrc: new URL(b, BASE).href, kind: 'css-bg', checked_at_utc: t0, pass: true });
  process.stdout.write(`${LABEL} ${String(n).padStart(2, '0')}-${lang} ${row.pass ? 'PASS' : 'FAIL ' + failed.join(',')} imgs=${row.imageCount}\n`);
}
await ctx.close();
// ---- out-of-band HTTP checks for every unique asset URL seen (img currentSrc + sources + posters + bg + svg hrefs) ----
const urls = new Set();
for (const r of imageRows) { if (r.currentSrc) urls.add(r.currentSrc); for (const s of (r.sources || [])) if (s) urls.add(new URL(s.split(/\s+/)[0], BASE).href); }
for (const r of results) for (const h of (r.svgHrefs || [])) urls.add(new URL(h, BASE).href);
function fetchBuf(u) { return new Promise((resolve) => { const mod = u.startsWith('https') ? https : http; const req = mod.get(u, { headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'athar-verify147' } }, res => { const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) })); }); req.on('error', e => resolve({ status: 0, error: String(e), headers: {}, body: Buffer.alloc(0) })); req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0, error: 'timeout', headers: {}, body: Buffer.alloc(0) }); }); }); }
const httpRows = {};
for (const u of urls) {
  const r = await fetchBuf(u); const ext = (new URL(u).pathname.split('.').pop() || '').toLowerCase(); const ct = String(r.headers['content-type'] || '').split(';')[0].trim(); const want = MIME[ext]; const ctOk = want ? (Array.isArray(want) ? want.includes(ct) : ct === want) : true;
  httpRows[u] = { url: u, path: new URL(u).pathname, status: r.status, content_type: ct, content_type_ok: ctOk, bytes: r.body.length, sha256: r.body.length ? crypto.createHash('sha256').update(r.body).digest('hex') : '', accept_ranges: r.headers['accept-ranges'] || '', cache_control: r.headers['cache-control'] || '', ok: r.status === 200 && ctOk && r.body.length > 0, error: r.error || '' };
}
// Range probe on one mp4 + one image (serve.mjs / live Range handling)
async function rangeProbe(u) { return new Promise(resolve => { const mod = u.startsWith('https') ? https : http; const req = mod.get(u, { headers: { Range: 'bytes=0-1023' } }, res => { let len = 0; res.on('data', c => len += c.length); res.on('end', () => resolve({ url: u, status: res.statusCode, content_range: res.headers['content-range'] || '', bytes: len, content_type: res.headers['content-type'] || '' })); }); req.on('error', e => resolve({ url: u, status: 0, error: String(e) })); }); }
const rangeProbes = [];
for (const u of [`${BASE}/assets/tour/video/athar-os-launch-30s.mp4`, `${BASE}/assets/img/lebanon-one-million-ai-experts-20260925.jpg`, `${BASE}/assets/img/fallback-athar.svg`]) rangeProbes.push(await rangeProbe(u));
const summary = { label: LABEL, base: BASE, started_utc: started, finished_utc: utc(), combos: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, failedList: results.filter(r => !r.pass).map(r => `${r.n}-${r.lang}: ${r.failedChecks.join(',')}`), imageRows: imageRows.length, imgRowsFailed: imageRows.filter(r => !r.pass).length, uniqueAssetUrls: urls.size, httpFailed: Object.values(httpRows).filter(h => !h.ok).map(h => `${h.path} ${h.status} ${h.content_type}`), consoleErrorsTotal: results.reduce((a, r) => a + r.consoleErrs.length, 0), pageErrorsTotal: results.reduce((a, r) => a + r.pageErrs.length, 0), failedRequestsTotal: results.reduce((a, r) => a + r.failedRequests.length, 0), badResponsesTotal: results.reduce((a, r) => a + r.badResponses.length, 0), abortedMediaTotal: results.reduce((a, r) => a + r.abortedMedia, 0), axeViolationsTotal: results.reduce((a, r) => a + (r.axe && r.axe.violations ? r.axe.violations.length : 0), 0), fallbackTriggeredTotal: results.reduce((a, r) => a + (r.fallbackImgs || []).length, 0), transientTransportRetries: transient, rangeProbes };
writeJson(path.join(OUT, 'results.json'), results); writeJson(path.join(OUT, 'images.json'), imageRows); writeJson(path.join(OUT, 'http.json'), httpRows); writeJson(path.join(OUT, 'network.json'), netAll); writeJson(path.join(OUT, 'summary.json'), summary);
console.log(JSON.stringify(summary, null, 1));
process.exit(summary.failed === 0 && summary.httpFailed.length === 0 ? 0 : 2);
