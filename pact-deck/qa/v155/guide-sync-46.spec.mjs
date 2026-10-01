// Athar deck v1.5.5 — per-slide Guide sync test for ALL 46 slides (Playwright Test, system Chromium).
// Closes the previously unconfirmed mismatch: for EVERY slide the narrated slide id (the player's data-slide-id AND, where a clip
// exists, the slide id of the clip that is actually audible — identified at the network layer from the fetched MP3) must equal the
// visible slide's data-slide-id. Slides 41 and 44 have no clip (TTS HTTP 429): there the player must target the visible slide,
// stay silent (state ended · reason no-clip) and caption the slide. Also: the impact-story film on slide 44 pauses the guide and the
// guide resumes after it; AUTO leaves a clip-less slide after 9 s.
// Usage: GUIDE_BASE=http://127.0.0.1:4405 DECK_TOTAL=46 npx playwright test -c qa/v155/playwright.config.mjs
import { test, expect } from '../../node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { instrument, FILE2CLIP, hashFor, DIST } from '../v154/lib.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const BASE = process.env.GUIDE_BASE || 'http://127.0.0.1:4405';
const TABLE = JSON.parse(fs.readFileSync(path.join(DIST, 'narration/slide-narration.json'), 'utf8'));
const TOTAL = TABLE.slides.length;
const BY_N = Object.fromEntries(TABLE.slides.map((s) => [s.n, s]));
const CLIP2SLIDE = Object.fromEntries(TABLE.slides.filter((s) => s.clipId).map((s) => [s.clipId, s.slideId]));
const RESULTS = path.join(HERE, 'results'); fs.mkdirSync(RESULTS, { recursive: true });

async function setup(page, { lang = 'en', prefs = null } = {}) {
  await page.addInitScript(instrument(FILE2CLIP, 1));
  await page.addInitScript(({ lang, prefs }) => { try { sessionStorage.setItem('athar-intro-v1.4.2', 'done'); localStorage.setItem('athar-pact-lang', lang); if (prefs) localStorage.setItem('athar-guide-prefs-v3', prefs); } catch (e) {} }, { lang, prefs });
  page.__errors = []; page.on('pageerror', (e) => page.__errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') page.__errors.push(m.text()); });
}
async function open(page, n) {
  await page.goto(BASE + '/' + hashFor(n), { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.AtharGuide && !!document.querySelector('#athar-narration'), null, { timeout: 20000 });
  await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 15000 });
}
const snap = (page) => page.evaluate(() => { const v = window.__qaVisible(), a = window.__qaAudible(), r = document.getElementById('athar-narration'), cc = document.querySelector('[data-testid="nar-caption"]');
  return { vis: v, audible: a, state: r.getAttribute('data-state'), reason: r.getAttribute('data-reason'), guideSlide: r.getAttribute('data-slide-id'), cc: cc ? (cc.textContent || '').trim() : '', t: new Date().toISOString() }; });
const audibleSlide = (s) => (s.audible ? CLIP2SLIDE[s.audible.clip] || ('?' + s.audible.clip) : null);
const ccOk = (s) => { const e = TABLE.slides.find((x) => x.slideId === s.vis.slideId); return !!e && e.cues.some((q) => q.text.trim() === s.cc); };
/** wait until the narrated slide == the visible slide (audible clip for clip slides; silent no-clip target otherwise) */
async function narratedEqualsVisible(page, n, timeout = 6000) {
  const t0 = Date.now(); let s; const hasClip = !!BY_N[n].file;
  while (Date.now() - t0 < timeout) {
    s = await snap(page);
    if (s.vis.slideId && s.guideSlide === s.vis.slideId) {
      if (hasClip && s.audible && audibleSlide(s) === s.vis.slideId) return { ...s, ms: Date.now() - t0, ok: true };
      if (!hasClip && !s.audible && s.state === 'ended' && s.reason === 'no-clip') return { ...s, ms: Date.now() - t0, ok: true };
    }
    await page.waitForTimeout(60);
  }
  return { ...s, ms: Date.now() - t0, ok: false };
}
async function startGuide(page, mobile) { if (mobile) await page.tap('[data-testid="guide-toggle"]'); else await page.click('[data-testid="guide-toggle"]'); }
async function setAuto(page, on) { const cur = await page.getAttribute('[data-testid="nar-autoplay"]', 'aria-pressed'); if ((cur === 'true') !== on) await page.click('[data-testid="nar-autoplay"]'); }
const row = (n, s, how) => ({ n, how, visibleSlideId: s.vis.slideId, narratedSlideId: s.guideSlide, expectedClip: BY_N[n].clipId, audibleClip: s.audible && s.audible.clip, audibleSlideId: audibleSlide(s), state: s.state, reason: s.reason, ccMatches: ccOk(s), syncMs: s.ms, t: s.t, pass: !!(s.ok && ccOk(s)) });
const write = (name, rows) => fs.writeFileSync(path.join(RESULTS, name + '.json'), JSON.stringify({ base: BASE, total: TOTAL, written: new Date().toISOString(), rows }, null, 1));

test.describe(`guide narration ⇔ visible slide — all ${TOTAL} slides`, () => {
  test(`arrow keys 1 → ${TOTAL}: narrated slide id == visible slide id on every slide`, async ({ page }, info) => {
    test.setTimeout(300000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 1); await setAuto(page, false); await startGuide(page, mobile);
    const rows = [];
    for (let n = 1; n <= TOTAL; n++) {
      if (n > 1) await page.keyboard.press('ArrowRight');
      await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 8000 });
      const s = await narratedEqualsVisible(page, n); const r = row(n, s, 'arrow'); rows.push(r);
      await test.step(`slide ${n} ${s.vis.slideId}: narrated ${r.narratedSlideId} · audible ${r.audibleClip || '—'} (${r.syncMs} ms)`, async () => {
        expect.soft(r.narratedSlideId, `slide ${n} narrated id`).toBe(s.vis.slideId);
        if (BY_N[n].file) { expect.soft(r.audibleSlideId, `slide ${n} audible clip`).toBe(s.vis.slideId); expect.soft(r.audibleClip).toBe(BY_N[n].clipId); }
        else { expect.soft(r.audibleClip, `slide ${n} must be silent (no clip)`).toBeFalsy(); expect.soft(r.reason).toBe('no-clip'); }
        expect.soft(r.ccMatches, 'CC = a sentence of the visible slide').toBe(true);
      });
      await page.waitForTimeout(200);
    }
    write('arrows46-' + info.project.name, rows);
    expect(rows.filter((r) => !r.pass).map((r) => r.n)).toEqual([]);
    expect(page.__errors).toEqual([]);
  });

  test(`deep links for all ${TOTAL} slides (#/N · #/27/new-k · #/28 · #/28/exec-k)`, async ({ page }, info) => {
    test.setTimeout(300000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 1); await setAuto(page, false); await startGuide(page, mobile);
    const rows = []; const order = Array.from({ length: TOTAL }, (_, i) => i + 1).sort((a, b) => ((a * 7919) % TOTAL) - ((b * 7919) % TOTAL));
    for (const n of order) {
      await page.evaluate((h) => { location.hash = h; }, hashFor(n));
      await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 9000 });
      const s = await narratedEqualsVisible(page, n); const r = row(n, s, 'deeplink ' + hashFor(n)); rows.push(r);
      expect.soft(r.narratedSlideId, 'deep link ' + hashFor(n)).toBe(s.vis.slideId);
    }
    write('deeplinks46-' + info.project.name, rows);
    expect(rows.filter((r) => !r.pass).map((r) => r.n)).toEqual([]);
    expect(page.__errors).toEqual([]);
  });

  test('impact-story film (slide 44) pauses the guide while it plays and the guide resumes after it', async ({ page }, info) => {
    test.setTimeout(120000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 43); await setAuto(page, true); await startGuide(page, mobile);
    let s = await narratedEqualsVisible(page, 43); expect(s.ok).toBe(true);
    await page.keyboard.press('ArrowRight'); await page.waitForFunction(() => window.__qaVisible().n === 44, null, { timeout: 8000 });
    s = await narratedEqualsVisible(page, 44); expect(s.ok, 'slide 44 targeted, silent').toBe(true);
    const film = await page.evaluate(() => { const v = document.querySelector('#s-exec-khalid video[data-narration-pause]'); return v ? { poster: v.poster.split('/').pop(), tracks: [...v.querySelectorAll('track')].map((t) => t.srclang + ':' + t.getAttribute('src').split('/').pop()), in: v.dataset.in, out: v.dataset.out, src: v.querySelector('source').getAttribute('src').split('/').pop() } : null; });
    expect(film).not.toBeNull(); expect(film.tracks).toEqual(['en:athar-origins-of-impact-ep01.en.vtt', 'ar:athar-origins-of-impact-ep01.ar.vtt']);
    // play the film close to its out-point (39.4 s) so the test does not wait 40 s
    await page.evaluate(async () => { const v = document.querySelector('#s-exec-khalid video'); await new Promise((r) => { if (v.readyState >= 1) r(); else v.addEventListener('loadedmetadata', r, { once: true }); }); v.currentTime = 36.0; await v.play(); });
    await page.waitForFunction(() => document.getElementById('athar-narration').getAttribute('data-reason') === 'video', null, { timeout: 6000 });
    const during = await snap(page); const filmPlaying = await page.evaluate(() => { const v = document.querySelector('#s-exec-khalid video'); return !v.paused && v.currentTime > 36; });
    expect(during.state, 'guide paused while the film plays').toBe('paused'); expect(during.audible, 'no narration audible during the film').toBeNull(); expect(filmPlaying).toBe(true);
    // the film stops at its out-point → the guide resumes: AUTO moves to slide 45 and its clip becomes audible
    await page.waitForFunction(() => window.__qaVisible().n === 45, null, { timeout: 15000 });
    const after = await narratedEqualsVisible(page, 45); const filmState = await page.evaluate(() => { const v = document.querySelector('#s-exec-khalid video'); return { paused: v.paused, t: Math.round(v.currentTime * 10) / 10 }; });
    write('film-' + info.project.name, [{ during: { state: during.state, reason: during.reason, audible: during.audible }, film, filmState, after: row(45, after, 'after film') }]);
    expect(after.ok, 'guide resumed on slide 45 after the film').toBe(true); expect(filmState.paused).toBe(true); expect(filmState.t).toBeGreaterThanOrEqual(39.3);
    expect(page.__errors).toEqual([]);
  });

  test('AUTO leaves a clip-less slide (41) after its caption dwell and narrates slide 42', async ({ page }, info) => {
    test.setTimeout(90000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 41); await setAuto(page, true); await startGuide(page, mobile);
    const s41 = await narratedEqualsVisible(page, 41); expect(s41.ok).toBe(true);
    await page.waitForFunction(() => window.__qaVisible().n === 42, null, { timeout: 15000 });
    const s42 = await narratedEqualsVisible(page, 42); write('noclip-auto-' + info.project.name, [row(41, s41, 'no-clip'), row(42, s42, 'auto')]);
    expect(s42.ok).toBe(true); expect(page.__errors).toEqual([]);
  });
});
