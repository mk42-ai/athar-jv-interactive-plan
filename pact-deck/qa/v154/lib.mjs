// Athar deck v1.5.4 — Guide QA harness (Playwright + system Chromium). Shared by repro.mjs, dom-text.mjs and guide-sync.spec.mjs.
// Every page gets an init script that logs: ISO timestamp, visible slide (index, section id, data-slide-id), the audible <audio>
// (src → clip id, currentTime), the CC caption text and the Guide state, on every media / navigation / input event plus a 100 ms
// change-only sampler. Browsers are always closed in finally{}; callers run this file's consumers under a process-group wall-clock cap.
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DIST = path.resolve(HERE, '../../dist');
export const TOTAL = Number(process.env.DECK_TOTAL || 39);
export const CHROMIUM = process.env.CHROMIUM_BIN || '/usr/bin/chromium';
export const hashFor = (n) => (n <= 27 ? '#/' + n : n <= 38 ? '#/27/new-' + (n - 27) : n === 39 ? '#/28' : n <= 45 ? '#/28/exec-' + (n - 39) : '#/29/brand-' + (n - 45)); /* v1.7.1: 46–48 → #/28/brand-k; v1.7.3 (audit A-16): the public alias #/29/brand-k is what the address bar shows (canonical #/28/brand-k still accepted) */
const clipMap = JSON.parse(fs.readFileSync(path.join(DIST, 'narration/clip-map.json'), 'utf8'));
export const FILE2CLIP = Object.fromEntries(clipMap.clips.map((c) => [c.file.split('/').pop(), c.clipId]));
// v1.5.4 per-slide clips (if present) are added so the logger can name them
try { const sn = JSON.parse(fs.readFileSync(path.join(DIST, 'narration/slide-narration.json'), 'utf8')); for (const s of sn.slides) if (s.file) FILE2CLIP[s.file.split('/').pop()] = s.clipId; } catch (e) {}
export const iso = () => new Date().toISOString();

export function instrument(file2clip, rate) {
  return `(() => {
  const CLIPS = ${JSON.stringify(file2clip)}; const RATE = ${Number(rate) || 1};
  const ev = window.__qaEvents = []; const t0 = performance.now(); const media = new Set(); window.__qaMedia = media;
  const iso = () => new Date().toISOString();
  // blob: URLs (v1.5.4 fetches clips through AbortController) are mapped back to the fetched file at the network layer, so the
  // audible clip is identified independently of anything the player claims about itself
  const blobSrc = new WeakMap(); const objUrl = {}; window.__qaObjUrl = objUrl;
  const _fetch = window.fetch; window.fetch = function (input) { const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    return _fetch.apply(this, arguments).then((r) => { try { const _b = r.blob.bind(r); r.blob = () => _b().then((b) => { blobSrc.set(b, url); return b; }); } catch (e) {} return r; }); };
  const _cou = URL.createObjectURL; URL.createObjectURL = function (o) { const u = _cou.call(URL, o); try { const s = blobSrc.get(o); if (s) objUrl[u] = s; } catch (e) {} return u; };
  const base = (u) => { u = String(u || ''); if (u.startsWith('blob:') && objUrl[u]) u = objUrl[u]; return u.split('/').pop().split('?')[0].split('#')[0]; };
  function visible() {
    const virt = !!(document.body && document.body.classList.contains('it-virtual'));
    const s = virt ? document.querySelector('#root section.it-slide.is-active') : document.querySelector('#root section.slide.is-active:not(.it-slide)');
    let n = 0; try { n = window.AtharImpactTiers ? window.AtharImpactTiers.current() : 0; } catch (e) {}
    if (!n && s) { n = parseInt(s.getAttribute('data-n'), 10) || 0; if (n === 28) n = 39; }
    return { n: n, id: s ? s.id : null, slideId: s ? s.getAttribute('data-slide-id') : null };
  }
  function audible() {
    let best = null; media.forEach((m) => { if (m.tagName === 'VIDEO') return; if (!m.paused && !m.ended && (m.currentSrc || m.src)) best = m; });
    if (!best) return null; const f = base(best.currentSrc || best.src);
    return { src: f, clip: CLIPS[f] || (f.indexOf('intro') >= 0 ? 'INTRO' : f), t: Math.round(best.currentTime * 100) / 100, muted: best.muted };
  }
  function cc() { const c = document.querySelector('[data-testid="nar-caption"]'); return c ? (c.textContent || '').trim() : null; }
  function guide() { const r = document.getElementById('athar-narration'); if (!r) return null; const st = r.querySelector('[data-testid="nar-status"]');
    return { state: r.getAttribute('data-state') || r.getAttribute('data-audio') || null, clip: r.getAttribute('data-clip') || null, slideId: r.getAttribute('data-slide-id') || null, gen: r.getAttribute('data-gen') || null, status: st ? (st.textContent || '').trim() : null }; }
  function log(type, extra) { try { ev.push(Object.assign({ t: iso(), ms: Math.round(performance.now() - t0), type: type, vis: visible(), audio: audible(), cc: cc(), guide: guide(), hash: location.hash }, extra || {})); } catch (e) {} }
  window.__qaLog = log; window.__qaVisible = visible; window.__qaAudible = audible;
  const P = HTMLMediaElement.prototype;
  const watch = (m) => { if (media.has(m)) return; media.add(m); if (m.tagName === 'VIDEO') return;
    ['playing', 'pause', 'ended', 'emptied', 'abort', 'error', 'seeked', 'loadstart', 'canplay'].forEach((e) => m.addEventListener(e, () => log('media:' + e, { el: base(m.currentSrc || m.src), ct: Math.round(m.currentTime * 100) / 100 }))); };
  const _play = P.play; P.play = function () { watch(this); const v = this.tagName === 'VIDEO'; const src = base(this.currentSrc || this.src);
    if (!v && RATE !== 1) { try { this.defaultPlaybackRate = RATE; this.playbackRate = RATE; } catch (e) {} }
    let pr; try { pr = _play.apply(this, arguments); } catch (e) { if (!v) log('play()', { el: src, result: 'throw:' + e.name }); throw e; }
    if (!v) { log('play()', { el: src, ct: Math.round(this.currentTime * 100) / 100 }); if (pr && pr.then) pr.then(() => log('play():resolved', { el: src }), (e) => log('play():rejected', { el: src, err: e && e.name })); }
    return pr; };
  const _pause = P.pause; P.pause = function () { watch(this); return _pause.apply(this, arguments); };
  const _load = P.load; P.load = function () { watch(this); return _load.apply(this, arguments); };
  const d = Object.getOwnPropertyDescriptor(P, 'src'); Object.defineProperty(P, 'src', { get() { return d.get.call(this); }, set(v) { watch(this); d.set.call(this, v); }, configurable: true });
  window.addEventListener('hashchange', () => log('hashchange'), true);
  window.addEventListener('keydown', (e) => log('key', { key: e.key }), true);
  document.addEventListener('click', (e) => { const t = e.target && e.target.closest ? e.target.closest('[data-testid],button,a') : null; log('click', { target: t ? (t.getAttribute('data-testid') || (t.textContent || '').trim().slice(0, 40)) : null }); }, true);
  let last = ''; setInterval(() => { const v = visible(), a = audible(), c = cc(), g = guide(); const k = [v.n, v.id, a && a.clip, c, g && g.state].join('|'); if (k !== last) { last = k; log('sample'); } }, 100);
})();`;
}

export async function launch(extraArgs = []) {
  // default Chromium autoplay policy is stated explicitly so the "first load, no gesture" scenario is deterministic
  return chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=document-user-activation-required', ...extraArgs] });
}
export async function newPage(browser, { viewport = { width: 1728, height: 872 }, mobile = false, rate = 1, storage = null, lang = 'en', intro = false, colorScheme = 'light' } = {}) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1, locale: 'en-US', colorScheme });
  await ctx.addInitScript(instrument(FILE2CLIP, rate));
  await ctx.addInitScript(({ storage, lang, intro }) => { try { if (!intro) sessionStorage.setItem('athar-intro-v1.4.2', 'done'); } catch (e) {} try { localStorage.setItem('athar-pact-lang', lang); if (storage) for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v); } catch (e) {} }, { storage, lang, intro });
  const page = await ctx.newPage();
  page.__console = []; page.on('console', (m) => { if (m.type() === 'error') page.__console.push({ t: iso(), text: m.text().slice(0, 300) }); });
  page.on('pageerror', (e) => page.__console.push({ t: iso(), text: 'pageerror: ' + String(e).slice(0, 300) }));
  return { ctx, page };
}
export const visible = (page) => page.evaluate(() => window.__qaVisible());
export const audible = (page) => page.evaluate(() => window.__qaAudible());
export const events = (page) => page.evaluate(() => window.__qaEvents.slice());
export const mark = (page, type, extra) => page.evaluate(([t, x]) => window.__qaLog(t, x), [type, extra || {}]);
export async function waitVisible(page, n, timeout = 6000) {
  const t = Date.now(); while (Date.now() - t < timeout) { const v = await visible(page); if (v.n === n) return v; await page.waitForTimeout(50); } return visible(page);
}
export async function boot(page, base, n = 1) {
  await page.goto(base + '/' + hashFor(n), { waitUntil: 'load' });
  await page.waitForSelector('#root section.slide', { state: 'attached', timeout: 20000 });
  await page.waitForSelector('#athar-narration', { state: 'attached', timeout: 20000 });
  await waitVisible(page, n, 15000); await page.waitForTimeout(600);
}
export async function gotoHash(page, n) { await page.evaluate((h) => { location.hash = h; }, hashFor(n)); }
export async function startGuide(page) { await page.click('[data-testid="guide-toggle"]'); }
export async function setAuto(page, on) {
  const cur = await page.getAttribute('[data-testid="nar-autoplay"]', 'aria-pressed');
  if ((cur === 'true') !== on) await page.click('[data-testid="nar-autoplay"]');
}
export async function overviewJump(page, n) {
  await page.keyboard.press('Escape'); await page.waitForSelector('.overview button.ov-card', { timeout: 5000 });
  await page.waitForFunction((n) => [...document.querySelectorAll('.overview button.ov-card')].some((x) => (x.querySelector('.ov-n') || {}).textContent === String(n)), n, { timeout: 5000 });
  await page.evaluate((n) => { const b = [...document.querySelectorAll('.overview button.ov-card')].find((x) => (x.querySelector('.ov-n') || {}).textContent === String(n)); if (b) b.click(); else throw new Error('no tile ' + n); }, n);
}
export function writeJSON(p, o) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 1)); }

// v1.7.0 — cold-start warm-up. Before a suite's first page is opened, every asset the executive cards need is requested once over the
// network (Node fetch, no browser): build-info, the generated films bundle, index.html, each film's poster / 1080p / 720p (first 2 MiB,
// Range) / EN + AR captions, and the George guide clip of every Section 09 slide. The first request to a freshly provisioned sandbox
// (or a freshly started serve.mjs) paid the cold path inside a test's wait budget and made the guide-pause assertion of qa/v161 time
// out once (v1.6.4 close-out); the warm-up moves that cost in front of the first test. It never throws — failures are RECORDED
// ({ url, status, ms, bytes, error }) so a suite can decide; the budget (default 90 s) bounds the whole pass.
export async function warmUp(base, { films = null, narration = null, budgetMs = 90000, rangeBytes = 2 * 1024 * 1024 } = {}) {
  const t0 = Date.now(); const rows = []; const urls = [];
  const F = films || JSON.parse(fs.readFileSync(path.join(DIST, '../features/exec-films/films.json'), 'utf8'));
  const N = narration || JSON.parse(fs.readFileSync(path.join(DIST, 'narration/slide-narration.json'), 'utf8'));
  for (const p of ['/build-info.json', '/js/exec-films.js', '/index.html', '/narration/slide-narration.json']) urls.push([p, null]);
  for (const f of Object.values(F.films)) {
    for (const k of ['poster', 'posterWebp']) if (f[k]) urls.push([F.distBase + f[k], null]);
    for (const k of ['mp4', 'mp4Mobile']) if (f[k]) urls.push([F.distBase + f[k], `bytes=0-${rangeBytes - 1}`]);
    for (const lg of ['en', 'ar']) if (f.captions && typeof f.captions[lg] === 'string') urls.push([F.distBase + f.captions[lg], null]);
  }
  for (const s of N.slides || []) if (s.file && /^s-exec-/.test(s.slideId || '')) urls.push([s.file, null]);
  const seen = new Set();
  for (const [p, range] of urls) {
    if (seen.has(p)) continue; seen.add(p);
    if (Date.now() - t0 > budgetMs) { rows.push({ url: p, status: 0, ms: 0, bytes: 0, error: 'budget exhausted' }); continue; }
    const t = Date.now(); const ac = new AbortController(); const timer = setTimeout(() => ac.abort(), Math.max(1000, budgetMs - (Date.now() - t0)));
    try {
      const r = await fetch(base + p + (p.endsWith('.json') || p.endsWith('.js') || p.endsWith('.html') ? `?warm=${t}` : ''), { signal: ac.signal, headers: Object.assign({ 'Cache-Control': 'no-cache', 'User-Agent': 'athar-qa-warmup/1.7.0' }, range ? { Range: range } : {}) });
      const buf = new Uint8Array(await r.arrayBuffer());
      rows.push({ url: p, status: r.status, ms: Date.now() - t, bytes: buf.length, cacheControl: r.headers.get('cache-control'), range: range || null });
    } catch (e) { rows.push({ url: p, status: -1, ms: Date.now() - t, bytes: 0, error: String(e && e.message || e), range: range || null }); }
    finally { clearTimeout(timer); }
  }
  return { base, startedAt: new Date(t0).toISOString(), totalMs: Date.now() - t0, requests: rows.length, ok: rows.filter((r) => r.status === 200 || r.status === 206).length, rows };
}
