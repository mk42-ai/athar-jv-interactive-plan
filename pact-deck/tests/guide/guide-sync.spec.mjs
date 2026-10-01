// Guide QA — the narration that plays must always be the clip mapped to the slide that is on screen.
// Expectations are read from dist/narration/narration-manifest.json (never from the page's own state).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const DIST = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../dist');
const manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'narration/narration-manifest.json'), 'utf8'));
const SEG = {}; for (const s of manifest.segments) if (s.n >= 1) SEG[s.n] = s;
const TOTAL = 39;
const route = (n) => (n <= 27 ? '#/' + String(n).padStart(2, '0') : n === 39 ? '#/28' : '#/27/new-' + (n - 27));
const LOG = [];
const log = (o) => { LOG.push({ t: new Date().toISOString(), ...o }); };
test.afterAll(() => { fs.writeFileSync(path.join(DIST, '../qa/guide-sync-checks.json'), JSON.stringify(LOG, null, 1)); });

const INIT = () => {
  try { sessionStorage.setItem('athar-intro-v1.4.2', 'done'); } catch (e) {}
  window.__playing = new Set();
  const track = (a) => { if (a.__t) return; a.__t = 1; a.addEventListener('playing', () => window.__playing.add(a)); ['pause', 'ended', 'emptied', 'abort'].forEach((e) => a.addEventListener(e, () => window.__playing.delete(a))); };
  const op = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { if (this instanceof HTMLAudioElement) track(this); return op.apply(this, arguments); }; // narration audio only — the cover/closing background <video> loops are not narration
};
async function visibleSlide(page) {
  return page.evaluate(() => { try { if (window.AtharImpactTiers && window.AtharImpactTiers.current) { const c = window.AtharImpactTiers.current(); if (c) return c; } } catch (e) {} const a = document.querySelector('#root section.slide.is-active:not(.it-slide)'); const n = a ? parseInt(a.getAttribute('data-n'), 10) : 0; return n === 28 ? 39 : n; });
}
async function waitSlide(page, n) { await expect.poll(() => visibleSlide(page), { timeout: 8000, message: `slide ${n} on screen` }).toBe(n); }
async function guideState(page) {
  return page.evaluate(() => { const g = window.__guideState || {}; const a = window.AtharNarration && window.AtharNarration.audioElement ? window.AtharNarration.audioElement() : null;
    const playing = [...(window.__playing || [])].filter((x) => !x.paused);
    return { slideIndex: g.slideIndex, cueId: g.cueId, on: g.on, blocked: g.blocked, audioClip: a && a.getAttribute('data-clip'), audioSrc: a && (a.currentSrc || a.src || '').split('/').pop(), paused: a ? a.paused : null, t: a ? a.currentTime : null, playingCount: playing.length, playingSrcs: playing.map((x) => (x.currentSrc || x.src || '').split('/').pop()) }; });
}
/** The core assertion: the track that is playing is the one mapped to the slide on screen, and nothing stale plays. */
async function assertTrackMatches(page, n, how, lang) {
  await waitSlide(page, n);
  const seg = SEG[n]; const file = seg.audio.split('/').pop();
  await expect.poll(async () => { const g = await guideState(page); return g.slideIndex === n && g.cueId === seg.clipId && g.audioClip === seg.clipId && g.audioSrc === file && g.paused === false && g.playingCount === 1; },
    { timeout: 6000, message: `slide ${n} (${how}, ${lang}) should play ${seg.clipId} / ${file}` }).toBe(true);
  const t0 = (await guideState(page)).t; await page.waitForTimeout(450); const g = await guideState(page);
  expect(g.t, `audio progressing on slide ${n}`).toBeGreaterThan(t0);
  log({ lang, how, slide: n, expected: seg.clipId, file, got: g.cueId, audio: g.audioSrc, playing: !g.paused, playingCount: g.playingCount, pass: true });
}
async function openDeck(page, lang, n = 1) {
  await page.addInitScript(INIT);
  await page.goto(`/?lang=${lang}${route(n)}`); await waitSlide(page, n);
  await expect(page.locator('[data-testid="guide-toggle"]')).toBeVisible();
}
async function startGuide(page) { await page.locator('[data-testid="guide-toggle"]').click(); }
const nextKey = (lang) => (lang === 'ar' ? 'ArrowLeft' : 'ArrowRight');
const prevKey = (lang) => (lang === 'ar' ? 'ArrowRight' : 'ArrowLeft');

for (const lang of ['en', 'ar']) {
  test.describe(`guide sync · ${lang.toUpperCase()}`, () => {
    test(`arrow keys through all ${TOTAL} slides — playing track == active slide`, async ({ page }) => {
      await openDeck(page, lang, 1); await startGuide(page);
      await assertTrackMatches(page, 1, 'start', lang);
      for (let n = 2; n <= TOTAL; n++) { await page.keyboard.press(nextKey(lang)); await assertTrackMatches(page, n, nextKey(lang), lang); }
      for (const n of [38, 37]) { await page.keyboard.press(prevKey(lang)); await assertTrackMatches(page, n, prevKey(lang), lang); }
    });
    test('Home / End / deep links / #slide-NN alias', async ({ page }) => {
      await openDeck(page, lang, 9); await startGuide(page); await assertTrackMatches(page, 9, 'start', lang);
      await page.keyboard.press('End'); await assertTrackMatches(page, 39, 'End', lang);
      await page.keyboard.press('Home'); await assertTrackMatches(page, 1, 'Home', lang);
      for (const n of [13, 21, 29, 34, 38, 26]) { await page.evaluate((h) => { location.hash = h; }, route(n)); await assertTrackMatches(page, n, 'deep-link ' + route(n), lang); }
      await page.evaluate(() => { location.hash = '#slide-30'; }); await assertTrackMatches(page, 30, 'alias #slide-30', lang);
      await page.evaluate(() => { location.hash = '#slide-7'; }); await assertTrackMatches(page, 7, 'alias #slide-7', lang);
    });
    test('overview (Esc) tile navigation', async ({ page }) => {
      await openDeck(page, lang, 2); await startGuide(page); await assertTrackMatches(page, 2, 'start', lang);
      for (const n of [19, 5]) {
        await page.keyboard.press('Escape');
        const tile = page.locator('[data-testid="overview"] .ov-card').nth(n - 1); // tiles are in slide order, each starts with its 2-digit number
        await expect(tile).toContainText(String(n).padStart(2, '0')); await tile.click();
        await assertTrackMatches(page, n, 'overview tile', lang);
      }
    });
    test('language toggle keeps the slide and its track', async ({ page }) => {
      await openDeck(page, lang, 20); await startGuide(page); await assertTrackMatches(page, 20, 'start', lang);
      await page.locator('.lang-toggle').first().click(); const other = lang === 'en' ? 'ar' : 'en';
      await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(other);
      await assertTrackMatches(page, 20, 'lang-toggle → ' + other, other);
      await page.keyboard.press(nextKey(other)); await assertTrackMatches(page, 21, 'after toggle ' + nextKey(other), other);
      await page.locator('.lang-toggle').first().click(); await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(lang);
      await assertTrackMatches(page, 21, 'lang-toggle back → ' + lang, lang);
    });
    test('rapid navigation is debounced and stale audio is cancelled', async ({ page }) => {
      await openDeck(page, lang, 1); await startGuide(page); await assertTrackMatches(page, 1, 'start', lang);
      for (let i = 0; i < 6; i++) await page.keyboard.press(nextKey(lang), { delay: 15 }); // 1 → 7 across a section boundary
      await assertTrackMatches(page, 7, 'rapid ×6', lang);
      for (let i = 0; i < 9; i++) await page.keyboard.press(nextKey(lang), { delay: 10 }); // 7 → 16 across 02→03
      await assertTrackMatches(page, 16, 'rapid ×9', lang);
      const g = await guideState(page); expect(g.playingCount, 'exactly one playing audio element').toBe(1);
    });
  });
}
test('autoplay policy: persisted guide-on restores blocked, first gesture starts the visible slide', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('athar-narration-prefs-v2', JSON.stringify({ on: true, autoplay: false, captions: true })); } catch (e) {} });
  await page.addInitScript(INIT);
  await page.goto('/?lang=en' + route(5)); await waitSlide(page, 5); await page.waitForTimeout(1200);
  let g = await guideState(page); log({ how: 'no-gesture restore', slide: 5, blocked: g.blocked, paused: g.paused });
  expect(g.paused !== false, 'no audio before a user gesture').toBe(true);
  expect(g.blocked, 'blocked state surfaced (tap to start)').toBe(true);
  await page.mouse.click(700, 420); // first gesture anywhere on the slide
  await assertTrackMatches(page, 5, 'first gesture', 'en');
});
for (const lang of ['en', 'ar']) {
  test(`returning visitor (${lang}): persisted guide-on → clicking Guide starts the visible slide, N pauses and resumes`, async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('athar-narration-prefs-v2', JSON.stringify({ on: true, autoplay: false, captions: true })); } catch (e) {} });
    await page.addInitScript(INIT);
    await page.goto(`/?lang=${lang}${route(13)}`); await waitSlide(page, 13); await page.waitForTimeout(800);
    await page.locator('[data-testid="guide-toggle"]').click(); // v1.5.3 bug: this click switched the guide OFF
    await assertTrackMatches(page, 13, 'Guide click (restored blocked state)', lang);
    await page.keyboard.press('n'); await expect.poll(async () => (await guideState(page)).paused, { message: 'N pauses' }).toBe(true);
    await page.keyboard.press(nextKey(lang)); await waitSlide(page, 14);
    await page.keyboard.press('n'); await assertTrackMatches(page, 14, 'N resumes on the slide on screen', lang);
    await page.keyboard.press('n'); await expect.poll(async () => (await guideState(page)).paused).toBe(true);
    await page.goto(`/?lang=${lang}${route(38)}`); await waitSlide(page, 38); await page.waitForTimeout(600);
    await page.keyboard.press('n'); await assertTrackMatches(page, 38, 'N after reload (restored state)', lang);
  });
}
