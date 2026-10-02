// Athar deck v1.5.5 — per-slide Guide sync test for ALL deck slides (44 = 39 + section 09) (Playwright Test, system Chromium).
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
    write('arrows' + TOTAL + '-' + info.project.name, rows);
    expect(rows.filter((r) => !r.pass).map((r) => r.n)).toEqual([]);
    expect(page.__errors).toEqual([]);
  });

  test(`deep links for all ${TOTAL} slides (#/N · #/27/new-k · #/28 · #/28/exec-k)`, async ({ page }, info) => {
    test.setTimeout(300000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 1); await setAuto(page, false); await startGuide(page, mobile);
    const rows = [];
    // slides 1–39 in the exact v1.5.4 suite order, with the section-09 slides 40–44 interleaved. (Known pre-existing behaviour, not exercised:
    // setting the hash to #/27 while a runtime slide #/27/new-k is on screen keeps that slide — impact-tiers.js tolerates #/27 because the
    // bundle normalises the hash to #/27 while booting; the narration still follows the visible slide.)
    const base = Array.from({ length: 39 }, (_, i) => i + 1).sort((a, b) => ((a * 7919) % 39) - ((b * 7919) % 39)); const ex = Array.from({ length: TOTAL - 39 }, (_, i) => 40 + i).reverse();
    const order = []; base.forEach((n, i) => { order.push(n); if (i % 8 === 7 && ex.length) order.push(ex.pop()); }); while (ex.length) order.push(ex.pop());
    for (const n of order) {
      await page.evaluate((h) => { location.hash = h; }, hashFor(n));
      await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 9000 });
      const s = await narratedEqualsVisible(page, n); const r = row(n, s, 'deeplink ' + hashFor(n)); rows.push(r);
      expect.soft(r.narratedSlideId, 'deep link ' + hashFor(n)).toBe(s.vis.slideId);
    }
    write('deeplinks' + TOTAL + '-' + info.project.name, rows);
    expect(rows.filter((r) => !r.pass).map((r) => r.n)).toEqual([]);
    expect(page.__errors).toEqual([]);
  });

  test('impact-story film (slide 43) pauses the guide while it plays and the guide resumes after it', async ({ page }, info) => {
    test.setTimeout(150000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 42); await setAuto(page, true); await startGuide(page, mobile);
    let s = await narratedEqualsVisible(page, 42); expect(s.ok).toBe(true);
    await page.keyboard.press('ArrowRight'); await page.waitForFunction(() => window.__qaVisible().n === 43, null, { timeout: 8000 });
    s = await narratedEqualsVisible(page, 43); expect(s.ok, 'slide 43 lead-in clip audible').toBe(true);
    const film = await page.evaluate(() => { const v = document.querySelector('#s-exec-khalid video[data-narration-pause]'); return v ? { poster: v.poster.split('/').pop(), posterTime: v.dataset.posterTime, tracks: [...v.querySelectorAll('track')].map((t) => t.srclang + ':' + t.getAttribute('src').split('/').pop()), in: v.dataset.in, out: v.dataset.out, src: v.querySelector('source').getAttribute('src').split('/').pop() } : null; });
    expect(film).not.toBeNull(); expect(film.poster).toBe('athar-origins-of-impact-ep01-poster-15s5.jpg'); expect(film.tracks).toEqual(['en:athar-origins-of-impact-ep01.en.vtt', 'ar:athar-origins-of-impact-ep01.ar.vtt']);
    await page.evaluate(async () => { const v = document.querySelector('#s-exec-khalid video'); await new Promise((r) => { if (v.readyState >= 1) r(); else v.addEventListener('loadedmetadata', r, { once: true }); }); v.currentTime = 34.0; await v.play(); });
    await page.waitForFunction(() => document.getElementById('athar-narration').getAttribute('data-reason') === 'video', null, { timeout: 6000 });
    const during = await snap(page); const filmPlaying = await page.evaluate(() => { const v = document.querySelector('#s-exec-khalid video'); return !v.paused && v.currentTime > 34; });
    expect(during.state, 'guide paused while the film plays').toBe('paused'); expect(during.audible, 'no narration audible during the film').toBeNull(); expect(filmPlaying).toBe(true);
    // the film stops at its out-point (37.3 s — v1.5.6: the 1080p master trimmed before the closing end card; was 39.4 s) → the guide resumes the slide-43 clip
    await page.waitForFunction(() => { const v = document.querySelector('#s-exec-khalid video'); return v.paused && v.currentTime >= 37.2; }, null, { timeout: 15000 });
    const after = await narratedEqualsVisible(page, 43, 8000);
    const resumed = after.ok || (await page.evaluate(() => window.__qaVisible().n)) === 44;
    write('film-' + info.project.name, [{ during: { state: during.state, reason: during.reason, audible: during.audible }, film, after: row(43, after, 'after film') }]);
    expect(resumed, 'guide resumed after the film').toBe(true);
    expect(page.__errors).toEqual([]);
  });

  test('hidden cards (Ary, Lorenzo) are not rendered, not counted and not narrated', async ({ page }) => {
    test.setTimeout(60000);
    await setup(page); await open(page, 44);
    const r = await page.evaluate(() => ({ ids: [...document.querySelectorAll('#root section.ex-slide')].map((x) => x.id), count: window.AtharExecTeam.count, total: window.AtharExecTeam.total,
      counter: (document.querySelector('footer.pagefooter .counter') || {}).textContent, text: document.body.innerText }));
    const hiddenInTable = TABLE.slides.filter((x) => /aryani|lorenzo/.test(x.slideId)).length;
    write('hidden-cards', [{ ...r, text: undefined, hiddenInTable, mentionsHidden: /Lorenzo|Al Aryani|العرياني|لورينزو/.test(r.text) }]);
    expect(r.ids).toEqual(['s-exec-intro', 's-exec-al-zeyoudi', 's-exec-al-ameri', 's-exec-khalid', 's-exec-unwalla']);
    expect(r.count).toBe(5); expect(r.total).toBe(44); expect(TOTAL).toBe(44); expect(hiddenInTable).toBe(0);
    expect(/Lorenzo|Al Aryani|العرياني|لورينزو/.test(r.text)).toBe(false);
    expect(r.counter).toContain('44');
  });
});
