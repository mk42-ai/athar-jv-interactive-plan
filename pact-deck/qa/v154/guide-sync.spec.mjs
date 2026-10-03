// Athar deck v1.5.4 — Guide narration sync test (Playwright Test, system Chromium).
// Core assertion everywhere: the AUDIBLE clip (identified at the network layer: <audio> blob URL → fetched MP3 → clip id →
// slide id from slide-narration.json) equals the VISIBLE slide's data-slide-id. Runs for 39 slides (arrow keys + deep links),
// rapid bursts (≥5 key presses < 300 ms) and random jumps, Esc-overview jumps, AUTO on / off, slide-38 tabs, first-load
// autoplay blocking, play() NotAllowedError, slow-network staleness and the language switch — on desktop 1728×872 and phone 390×844.
// Usage: GUIDE_BASE=http://127.0.0.1:4302 npx playwright test -c qa/v154/playwright.config.mjs
import { test, expect } from '../../node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { instrument, FILE2CLIP, hashFor, DIST, HERE } from './lib.mjs';

const BASE = process.env.GUIDE_BASE || 'http://127.0.0.1:4302';
const TABLE = JSON.parse(fs.readFileSync(path.join(DIST, 'narration/slide-narration.json'), 'utf8'));
const BY_N = Object.fromEntries(TABLE.slides.map((s) => [s.n, s]));
const CLIP2SLIDE = Object.fromEntries(TABLE.slides.map((s) => [s.clipId, s.slideId]));
const RESULTS = path.join(HERE, 'results'); fs.mkdirSync(RESULTS, { recursive: true });
const PREFS_ON = JSON.stringify({ on: true, auto: true, captions: true });

async function setup(page, { prefsOn = false, rate = 1, lang = 'en', initExtra = null } = {}) {
  await page.addInitScript(instrument(FILE2CLIP, rate));
  await page.addInitScript(({ prefsOn, lang, PREFS_ON }) => { try { sessionStorage.setItem('athar-intro-v1.4.2', 'done'); localStorage.setItem('athar-pact-lang', lang); if (prefsOn) localStorage.setItem('athar-guide-prefs-v3', PREFS_ON); } catch (e) {} }, { prefsOn, lang, PREFS_ON });
  if (initExtra) await page.addInitScript(initExtra);
  page.__errors = []; page.on('pageerror', (e) => page.__errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') page.__errors.push(m.text()); });
}
async function open(page, n) {
  await page.goto(BASE + '/' + hashFor(n), { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.AtharGuide && !!document.querySelector('#athar-narration'), null, { timeout: 20000 });
  await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 15000 });
}
const snap = (page) => page.evaluate(() => { const v = window.__qaVisible(), a = window.__qaAudible(), g = window.AtharGuide; return { vis: v, audible: a, state: g.state, gen: g.gen, guideSlide: g.slideId, cc: (document.querySelector('[data-testid="nar-caption"]') || {}).textContent || '', t: new Date().toISOString() }; });
const audibleSlide = (s) => (s.audible ? CLIP2SLIDE[s.audible.clip] || ('?' + s.audible.clip) : null);
/** wait until audible == visible (or timeout) and return the snapshot + time to sync */
async function synced(page, timeout = 4000) {
  const t0 = Date.now(); let s;
  while (Date.now() - t0 < timeout) { s = await snap(page); if (s.audible && s.vis.slideId && audibleSlide(s) === s.vis.slideId) return { ...s, ms: Date.now() - t0, ok: true }; await page.waitForTimeout(60); }
  return { ...s, ms: Date.now() - t0, ok: false };
}
function ccOk(s) { const e = TABLE.slides.find((x) => x.slideId === s.vis.slideId); return !!e && e.cues.some((q) => q.text.trim() === s.cc.trim()); }
async function startGuide(page, mobile) { if (mobile) await page.tap('[data-testid="guide-toggle"]'); else await page.click('[data-testid="guide-toggle"]'); }
async function setAuto(page, on) { const cur = await page.getAttribute('[data-testid="nar-autoplay"]', 'aria-pressed'); if ((cur === 'true') !== on) await page.click('[data-testid="nar-autoplay"]'); }
function writeRows(name, rows) { fs.writeFileSync(path.join(RESULTS, name + '.json'), JSON.stringify({ base: BASE, written: new Date().toISOString(), rows }, null, 1)); }

test.describe('guide narration ⇔ visible slide', () => {
  test('all 39 slides — arrow keys, audible clip id == visible slide id, CC follows', async ({ page }, info) => {
    test.setTimeout(240000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 1); await setAuto(page, false); await startGuide(page, mobile);
    const rows = [];
    for (let n = 1; n <= 39; n++) {
      if (n > 1) await page.keyboard.press('ArrowRight');
      await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 8000 });
      const s = await synced(page);
      const row = { n, slideId: s.vis.slideId, expectedClip: BY_N[n].clipId, audibleClip: s.audible && s.audible.clip, audibleSlideId: audibleSlide(s), syncMs: s.ms, ccMatchesSlide: ccOk(s), state: s.state, t: s.t, pass: s.ok && ccOk(s) && s.audible.clip === BY_N[n].clipId };
      rows.push(row);
      await test.step(`slide ${n} ${s.vis.slideId}: audible ${row.audibleClip} (${row.syncMs} ms)`, async () => {
        expect.soft(row.audibleSlideId, `slide ${n}`).toBe(s.vis.slideId); expect.soft(row.audibleClip).toBe(BY_N[n].clipId); expect.soft(row.ccMatchesSlide, 'CC = a sentence of the visible slide').toBe(true);
      });
      await page.waitForTimeout(250);
    }
    writeRows('arrows-' + info.project.name, rows);
    expect(rows.filter((r) => !r.pass).map((r) => r.n)).toEqual([]);
    expect(page.__errors).toEqual([]);
  });

  test('all 39 slides — hash deep links (#/N and #/27/new-k)', async ({ page }, info) => {
    test.setTimeout(240000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 1); await setAuto(page, false); await startGuide(page, mobile);
    const rows = []; const order = Array.from({ length: 39 }, (_, i) => i + 1).sort((a, b) => ((a * 7919) % 39) - ((b * 7919) % 39));
    for (const n of order) {
      await page.evaluate((h) => { location.hash = h; }, hashFor(n));
      await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 8000 });
      const s = await synced(page); rows.push({ n, hash: hashFor(n), slideId: s.vis.slideId, audibleClip: s.audible && s.audible.clip, syncMs: s.ms, pass: s.ok && s.audible.clip === BY_N[n].clipId, t: s.t });
      expect.soft(audibleSlide(s), 'deep link ' + hashFor(n)).toBe(s.vis.slideId);
    }
    writeRows('deeplinks-' + info.project.name, rows);
    expect(rows.filter((r) => !r.pass).map((r) => r.n)).toEqual([]);
  });

  test('rapid bursts (≥5 keys < 300 ms) and random jumps never let an intermediate slide speak', async ({ page }, info) => {
    test.setTimeout(180000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 2); await setAuto(page, false); await startGuide(page, mobile); expect((await synced(page)).ok).toBe(true);
    const rows = [];
    for (const [from, key, presses] of [[2, 'ArrowRight', 6], [8, 'ArrowRight', 5], [15, 'ArrowLeft', 5], [10, 'ArrowRight', 6]]) {
      // precondition of the scenario: the presses must land in the page inside 300 ms; on a loaded runner the burst is re-issued
      // (max 3 attempts) — the player assertions below apply to EVERY attempt, so a retry can never hide a player defect
      let attempt = 0, row = null;
      while (attempt < 3) {
        attempt++;
        if ((await snap(page)).vis.n !== from) { await page.evaluate((h) => { location.hash = h; }, hashFor(from)); await page.waitForFunction((n) => window.__qaVisible().n === n, from); expect((await synced(page)).ok).toBe(true); }
        const evStart = await page.evaluate(() => window.__qaEvents.length);
        await Promise.all(Array.from({ length: presses }, () => page.keyboard.press(key)));   // queued back-to-back: no test-side round trip between presses
        const keys = await page.evaluate((k) => window.__qaEvents.slice(k).filter((e) => e.type === 'key').map((e) => e.ms), evStart);
        const burstMs = keys.length ? keys[keys.length - 1] - keys[0] : -1; const target = from + (key === 'ArrowRight' ? presses : -presses);
        await page.waitForFunction((n) => window.__qaVisible().n === n, target, { timeout: 8000 });
        const s = await synced(page);
        const played = await page.evaluate((k) => window.__qaEvents.slice(k).filter((e) => e.type === 'media:playing').map((e) => e.el), evStart);
        const stray = played.map((f) => FILE2CLIP[f] || f).filter((c) => c !== BY_N[target].clipId);
        expect.soft(stray, 'no intermediate clip may start during a burst').toEqual([]); expect.soft(audibleSlide(s)).toBe(s.vis.slideId);
        row = { burst: `${from} ${key}×${presses}`, attempt, keyEventsInPage: keys.length, burstMs, target, audibleClip: s.audible && s.audible.clip, strayClipsStarted: stray, syncMs: s.ms, pass: s.ok && keys.length === presses && burstMs < 300 && stray.length === 0 };
        if (burstMs < 300) break;
      }
      rows.push(row); expect.soft(row.burstMs, 'burst of ' + presses + ' key presses inside 300 ms (after ' + row.attempt + ' attempt(s))').toBeLessThan(300);
    }
    const evStart = await page.evaluate(() => window.__qaEvents.length);
    // random jumps scheduled inside the page (exact 50–120 ms gaps, no protocol overhead between them)
    await page.evaluate((plan) => new Promise((done) => { let t = 0; plan.forEach(([h, gap]) => { setTimeout(() => { location.hash = h; }, t); t += gap; }); setTimeout(done, t + 20); }),
      [[13, 90], [30, 60], [21, 120], [39, 70], [5, 50], [36, 110], [17, 0]].map(([n, g]) => [hashFor(n), g]));
    await page.waitForFunction(() => window.__qaVisible().n === 17, null, { timeout: 8000 }); const s = await synced(page);
    const stray = (await page.evaluate((k) => window.__qaEvents.slice(k).filter((e) => e.type === 'media:playing').map((e) => e.el), evStart)).map((f) => FILE2CLIP[f] || f).filter((c) => c !== BY_N[17].clipId);
    const samples = await page.evaluate(() => window.__qaEvents.filter((e) => e.type === 'sample' && e.audio).map((e) => ({ t: e.t, vis: e.vis.slideId, clip: e.audio.clip })));
    const desync = samples.filter((x) => CLIP2SLIDE[x.clip] !== x.vis);
    rows.push({ burst: 'random hash jumps 13→30→21→39→5→36→17 (50–120 ms, in-page)', target: 17, audibleClip: s.audible && s.audible.clip, strayClipsStarted: stray, syncMs: s.ms, samplesChecked: samples.length, desyncedSamples: desync, pass: s.ok && stray.length === 0 && desync.length === 0 });
    expect(desync, 'audible clip == visible slide in every 100 ms sample of the whole test').toEqual([]);
    writeRows('rapid-' + info.project.name, rows);
    expect(stray).toEqual([]); expect(rows.filter((r) => !r.pass)).toEqual([]);
  });

  test('Esc overview jumps (real + virtual slides)', async ({ page }, info) => {
    test.setTimeout(120000);
    await setup(page); await open(page, 3); await setAuto(page, false); await startGuide(page, info.project.name === 'phone');
    const rows = [];
    for (const n of [21, 36, 12, 30, 38, 39, 1, 28]) {
      await page.keyboard.press('Escape'); await page.waitForSelector('.overview button.ov-card');
      await page.waitForFunction((n) => [...document.querySelectorAll('.overview button.ov-card')].some((x) => parseInt((x.querySelector('.ov-n') || {}).textContent, 10) === n), n);
      await page.evaluate((n) => [...document.querySelectorAll('.overview button.ov-card')].find((x) => parseInt((x.querySelector('.ov-n') || {}).textContent, 10) === n).click(), n);
      await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 8000 }); const s = await synced(page);
      rows.push({ tile: n, slideId: s.vis.slideId, audibleClip: s.audible && s.audible.clip, syncMs: s.ms, pass: s.ok }); expect.soft(audibleSlide(s)).toBe(s.vis.slideId);
    }
    writeRows('overview-' + info.project.name, rows); expect(rows.filter((r) => !r.pass)).toEqual([]);
  });

  test('AUTO on: advances only after the clip ended, every hop stays in sync', async ({ page }, info) => {
    test.setTimeout(150000); const mobile = info.project.name === 'phone';
    await setup(page, { rate: 6 }); await open(page, 26); await setAuto(page, true); await startGuide(page, mobile);
    await page.waitForFunction(() => window.__qaVisible().n >= 33, null, { timeout: 90000 });
    const ev = await page.evaluate(() => window.__qaEvents.slice());
    const hops = []; let lastEnded = null;
    for (const e of ev) {
      if (e.type === 'media:ended') lastEnded = e;
      if (e.type === 'hashchange' && e.vis && lastEnded) { hops.push({ at: e.t, toHash: e.hash, previousClipEndedAt: lastEnded.t, endedClip: FILE2CLIP[lastEnded.el] || lastEnded.el, endedOnSlide: lastEnded.vis.slideId }); lastEnded = null; }
      else if (e.type === 'hashchange') hops.push({ at: e.t, toHash: e.hash, previousClipEndedAt: null });
    }
    const samples = ev.filter((e) => e.type === 'sample' && e.audio).map((e) => ({ t: e.t, vis: e.vis.slideId, clip: e.audio.clip, ok: CLIP2SLIDE[e.audio.clip] === e.vis.slideId }));
    writeRows('auto-on-' + info.project.name, { hops, mismatchedSamples: samples.filter((x) => !x.ok), samples: samples.length });
    expect(hops.length).toBeGreaterThanOrEqual(6);
    expect(hops.filter((h) => !h.previousClipEndedAt), 'every AUTO hop must follow an ended event').toEqual([]);
    expect(hops.filter((h) => CLIP2SLIDE[h.endedClip] !== h.endedOnSlide), 'the clip that ended belonged to the slide on screen').toEqual([]);
    expect(samples.filter((x) => !x.ok), 'audible clip == visible slide in every sample').toEqual([]);
  });

  test('AUTO off: clip ends, slide stays, state ended', async ({ page }, info) => {
    test.setTimeout(90000); const mobile = info.project.name === 'phone';
    await setup(page, { rate: 6 }); await open(page, 27); await setAuto(page, false); await startGuide(page, mobile);
    await page.waitForFunction(() => window.AtharGuide.state === 'ended', null, { timeout: 30000 }); await page.waitForTimeout(2500);
    const s = await snap(page); writeRows('auto-off-' + info.project.name, [{ slide: s.vis.n, state: s.state }]);
    expect(s.vis.n).toBe(27); expect(s.state).toBe('ended'); expect(s.audible).toBeNull();
  });

  test('slide 38 tabs: seek inside the slide-38 clip, CC = country sentence, no desync', async ({ page }, info) => {
    test.setTimeout(120000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 38); await setAuto(page, false); await startGuide(page, mobile); expect((await synced(page)).ok).toBe(true);
    const e38 = BY_N[38]; const cue = (a) => e38.cues.find((q) => q.anchor === a); const rows = [];
    for (const [c, a] of [['in', 's38-c3'], ['ke', 's38-c4'], ['lb', 's38-c2'], ['in', 's38-c3'], ['ke', 's38-c4']]) {
      const sel = `#s-aos-nations .aos-country[data-country="${c}"]`; if (mobile) await page.tap(sel); else await page.click(sel);
      await page.waitForTimeout(450); const s = await snap(page); const q = cue(a);
      const row = { tab: c, cc: s.cc.slice(0, 60), audibleClip: s.audible && s.audible.clip, audioT: s.audible && s.audible.t, cueStart: q.start, cueEnd: q.end, tabSelected: await page.getAttribute(sel, 'aria-selected'), pass: audibleSlide(s) === 's-aos-nations' && s.cc.trim() === q.text.trim() && s.audible.t >= q.start - 0.1 && s.audible.t <= q.end + 0.6 };
      rows.push(row); expect.soft(audibleSlide(s)).toBe('s-aos-nations'); expect.soft(s.cc.trim()).toBe(q.text.trim());
    }
    await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => window.__qaVisible().n === 39); const s = await synced(page); rows.push({ after: 'ArrowRight → 39', audibleClip: s.audible && s.audible.clip, pass: s.ok });
    writeRows('tabs38-' + info.project.name, rows); expect(rows.filter((r) => !r.pass)).toEqual([]);
  });

  test('first load with a persisted "guide on": no autoplay, visible accessible tap-to-play, tap plays the visible slide', async ({ page }, info) => {
    test.setTimeout(60000); const mobile = info.project.name === 'phone';
    await setup(page, { prefsOn: true }); await open(page, 5); await page.waitForTimeout(2500);
    const s0 = await snap(page); const tap = page.locator('[data-testid="guide-tap-to-play"]');
    await expect(tap).toBeVisible(); const name = await tap.getAttribute('aria-label');
    expect(s0.state).toBe('blocked'); expect(s0.audible).toBeNull(); expect(name).toMatch(/blocked|tap/i);
    const playCalls = await page.evaluate(() => window.__qaEvents.filter((e) => e.type === 'play()').length);
    if (mobile) await tap.tap(); else await tap.click(); const s1 = await synced(page);
    writeRows('first-load-' + info.project.name, [{ before: { state: s0.state, audible: s0.audible, playCallsBeforeGesture: playCalls, tapLabel: name }, after: { state: s1.state, audibleClip: s1.audible && s1.audible.clip, slideId: s1.vis.slideId } }]);
    expect(playCalls).toBe(0); expect(s1.ok).toBe(true); expect(s1.audible.clip).toBe(BY_N[5].clipId);
  });

  test('play() rejected with NotAllowedError → blocked state with tap-to-play, recovery plays the visible slide', async ({ page }, info) => {
    test.setTimeout(60000); const mobile = info.project.name === 'phone';
    await setup(page, { initExtra: () => { const P = HTMLMediaElement.prototype, orig = P.play; let n = 0; P.play = function () { if (this.tagName === 'AUDIO' && this.getAttribute('data-guide') === 'athar' && n++ === 0) return Promise.reject(new DOMException('blocked by policy (test)', 'NotAllowedError')); return orig.apply(this, arguments); }; } });
    await open(page, 9); await startGuide(page, mobile); await page.waitForTimeout(800);
    const s0 = await snap(page); await expect(page.locator('[data-testid="guide-tap-to-play"]')).toBeVisible();
    expect(s0.state).toBe('blocked'); expect(await page.getAttribute('#athar-narration', 'data-reason')).toBe('autoplay');
    if (mobile) await page.tap('[data-testid="guide-tap-to-play"]'); else await page.click('[data-testid="guide-tap-to-play"]'); const s1 = await synced(page);
    writeRows('notallowed-' + info.project.name, [{ blocked: s0.state, recovered: s1.state, audibleClip: s1.audible && s1.audible.clip }]);
    expect(s1.ok).toBe(true); expect(s1.audible.clip).toBe(BY_N[9].clipId);
  });

  test('slow clip + navigation: the stale clip never plays (generation token + AbortController)', async ({ page }, info) => {
    test.setTimeout(60000); const mobile = info.project.name === 'phone';
    await setup(page); await page.route('**/audio/guide/slides/NAR-s06-*', async (r) => { await new Promise((res) => setTimeout(res, 1500)); try { await r.continue(); } catch (e) {} });
    await open(page, 5); await setAuto(page, false); await startGuide(page, mobile); expect((await synced(page)).ok).toBe(true);
    const k = await page.evaluate(() => window.__qaEvents.length);
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400); await page.keyboard.press('ArrowRight');   // 6 is still loading when we leave it
    await page.waitForFunction(() => window.__qaVisible().n === 7); const s = await synced(page); await page.waitForTimeout(2500);
    const after = await page.evaluate((k) => window.__qaEvents.slice(k).filter((e) => e.type === 'media:playing' || e.type === 'play()').map((e) => ({ type: e.type, el: e.el, vis: e.vis.slideId })), k);
    const stray = after.filter((e) => (FILE2CLIP[e.el] || e.el) === BY_N[6].clipId);
    const s2 = await snap(page); writeRows('stale-' + info.project.name, [{ events: after, stray, final: s2.audible && s2.audible.clip }]);
    expect(stray).toEqual([]); expect(s.ok).toBe(true); expect(s2.audible && s2.audible.clip).toBe(BY_N[7].clipId);
  });

  test('paused guide: navigation keeps it paused, CC follows, resume narrates the slide on screen', async ({ page }, info) => {
    test.setTimeout(60000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 13); await setAuto(page, false); await startGuide(page, mobile); expect((await synced(page)).ok).toBe(true);
    await page.keyboard.press('n'); await page.waitForTimeout(300); expect(await page.evaluate(() => window.AtharGuide.state)).toBe('paused');
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(900); const s = await snap(page);
    expect(s.state).toBe('paused'); expect(s.audible).toBeNull(); expect(ccOk(s)).toBe(true); expect(s.vis.n).toBe(14);
    await page.keyboard.press('n'); const s2 = await synced(page); expect(s2.ok).toBe(true); expect(s2.audible.clip).toBe(BY_N[14].clipId);
    expect(s2.audible.t).toBeLessThan(2.5);
  });

  test('language switch mid-narration does not restart or desync the clip', async ({ page }, info) => {
    test.setTimeout(60000);
    await setup(page); await open(page, 21); await setAuto(page, false); await startGuide(page, info.project.name === 'phone'); const s0 = await synced(page); expect(s0.ok).toBe(true);
    await page.waitForTimeout(1200); const g0 = await page.evaluate(() => window.AtharGuide.gen); const t0 = (await snap(page)).audible.t;
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /العربية/.test(x.textContent || '')); if (b) b.click(); });
    await page.waitForFunction(() => document.documentElement.lang === 'ar', null, { timeout: 8000 }); await page.waitForTimeout(1200);
    const s1 = await snap(page); const g1 = await page.evaluate(() => window.AtharGuide.gen);
    expect(s1.vis.slideId).toBe('s-actors-wall'); expect(audibleSlide(s1)).toBe('s-actors-wall'); expect(g1).toBe(g0); expect(s1.audible.t).toBeGreaterThan(t0);
  });
});
