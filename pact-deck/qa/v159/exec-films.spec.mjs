// Athar deck v1.5.9 — executive films + press-to-play intro: headless-browser checks (Playwright Test, system Chromium), desktop 1728×872 + phone 390×844, EN + AR.
// Covers: 0 console / page errors on every slide in EN and AR · EN→AR RTL toggle · deep links 32, 38, 39–44 · intro press-to-play (no autoplay after
// 5 s idle, Play → playing, sign + overlay gone) and the guide pausing on `play` / resuming on `pause` and `ended` around the intro film · the CEO card
// player (poster, duration, EN/AR tracks, no autoplay after 5 s, press play → playing with the overlay removed and native controls, guide pause/resume,
// out-point) · the three "Film coming soon / قريباً" ready slots (Fahad, Ary, Kayaan) · layout (no overflow, fixed 16:9 box, CLS ≈ 0, RTL mirroring) ·
// HTTP 200 for every narration clip and every film / poster / VTT asset (+ legacy v1.5.7 paths 404). Writes JSON evidence to results/ and PNGs to SHOTS_DIR.
// Usage: GUIDE_BASE=http://127.0.0.1:4159 SHOT_PREFIX=after SHOTS_DIR=/path npx playwright test -c qa/v159/playwright.config.mjs
import { test, expect } from '../../node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { instrument, FILE2CLIP, hashFor, DIST } from '../v154/lib.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const BASE = process.env.GUIDE_BASE || 'http://127.0.0.1:4159';
const PREFIX = process.env.SHOT_PREFIX || 'after';
const SHOTS = process.env.SHOTS_DIR || path.join(HERE, 'screenshots');
const RESULTS = path.join(HERE, 'results'); fs.mkdirSync(RESULTS, { recursive: true }); fs.mkdirSync(SHOTS, { recursive: true });
const TABLE = JSON.parse(fs.readFileSync(path.join(DIST, 'narration/slide-narration.json'), 'utf8')); const TOTAL = TABLE.slides.length;
const FILMS = JSON.parse(fs.readFileSync(path.join(HERE, '../../features/exec-films/films.json'), 'utf8'));
const K = FILMS.films.khalid; const F = (rel) => FILMS.distBase + rel;
const CARDS = [['al-ameri', 2, 41], ['ferreira-da-cunha', 3, 42], ['khalid', 4, 43], ['unwalla', 5, 44]];
const write = (name, rows) => fs.writeFileSync(path.join(RESULTS, name + '.json'), JSON.stringify({ base: BASE, written: new Date().toISOString(), rows }, null, 1));
const vp = (info) => (info.project.name === 'phone' ? '390x844' : '1728x872');
const shot = (page, info, name) => page.screenshot({ path: path.join(SHOTS, `${PREFIX}-${name}-${vp(info)}.png`), fullPage: false });

async function setup(page, { lang = 'en', intro = false } = {}) {
  await page.addInitScript(instrument(FILE2CLIP, 1));
  await page.addInitScript(({ lang, intro }) => { try { if (!intro) sessionStorage.setItem('athar-intro-v1.4.2', 'done'); localStorage.setItem('athar-pact-lang', lang); } catch (e) {}
    /* CLS: every layout shift without recent input, from navigation start */ window.__cls = 0; window.__clsEntries = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__clsEntries.push({ t: Math.round(e.startTime), v: e.value }); } }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {} }, { lang, intro });
  page.__errors = []; page.on('pageerror', (e) => page.__errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') page.__errors.push(m.text()); });
}
async function open(page, n, lang) { await page.goto(BASE + '/' + (lang ? '?lang=' + lang : '') + hashFor(n), { waitUntil: 'load' }); await page.waitForFunction(() => !!window.AtharGuide && !!document.querySelector('#athar-narration'), null, { timeout: 20000 }); await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 15000 }); }
const guide = (page) => page.evaluate(() => { const r = document.getElementById('athar-narration'); return { state: r.getAttribute('data-state'), reason: r.getAttribute('data-reason'), slide: r.getAttribute('data-slide-id') }; });
async function startGuide(page, mobile) { if (mobile) await page.tap('[data-testid="guide-toggle"]'); else await page.click('[data-testid="guide-toggle"]'); await page.waitForFunction(() => ['playing', 'loading'].includes(document.getElementById('athar-narration').getAttribute('data-state')), null, { timeout: 10000 }); }
const waitState = (page, pred, ms = 8000) => page.waitForFunction((src) => { const r = document.getElementById('athar-narration'); const s = { state: r.getAttribute('data-state'), reason: r.getAttribute('data-reason') }; return new Function('s', 'return ' + src)(s); }, pred, { timeout: ms });

test.describe('v1.5.9 — executive films + press-to-play intro', () => {
  test('0 console errors and 0 page errors on load of every slide — EN then AR', async ({ page }) => {
    test.setTimeout(240000); await setup(page); await open(page, 1); const rows = [];
    for (const lang of ['en', 'ar']) {
      if (lang === 'ar') { await page.click('[data-testid="lang-toggle"]'); await page.waitForFunction(() => document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl', null, { timeout: 8000 }); }
      for (let n = 1; n <= TOTAL; n++) { await page.evaluate((h) => { location.hash = h; }, hashFor(n)); await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 9000 }); await page.waitForTimeout(80); rows.push({ lang, n, id: (await page.evaluate(() => window.__qaVisible().slideId)), errors: page.__errors.length }); }
    }
    write('errors-all-slides-' + test.info().project.name, rows); expect(rows).toHaveLength(2 * TOTAL); expect(page.__errors).toEqual([]);
  });

  test('deep links 32, 38, 39–44 (cold loads, EN + AR) land on the right slide', async ({ page }) => {
    test.setTimeout(180000); const rows = [];
    for (const lang of ['en', 'ar']) for (const n of [32, 38, 39, 40, 41, 42, 43, 44]) {
      const ctx = await page.context().browser().newContext({ viewport: page.viewportSize(), isMobile: test.info().project.name === 'phone', hasTouch: test.info().project.name === 'phone' }); const p2 = await ctx.newPage(); await setup(p2, { lang });
      await p2.goto(BASE + '/?lang=' + lang + hashFor(n), { waitUntil: 'load' }); await p2.waitForFunction(() => !!window.AtharGuide, null, { timeout: 20000 });
      await p2.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 15000 }); const v = await p2.evaluate(() => Object.assign(window.__qaVisible(), { lang: document.documentElement.lang, dir: document.documentElement.dir, hash: location.hash }));
      rows.push({ lang, n, ...v, errors: p2.__errors.slice() }); expect(v.n).toBe(n); expect(v.dir).toBe(lang === 'ar' ? 'rtl' : 'ltr'); expect(p2.__errors).toEqual([]); await ctx.close();
    }
    write('deeplinks-' + test.info().project.name, rows);
  });

  test('intro: press-to-play — animated sign + EN/AR label, no autoplay after 5 s idle, Play → playing with the sign gone, click pauses, Esc skips', async ({ page }, info) => {
    test.setTimeout(120000); const rows = [];
    for (const lang of ['en', 'ar']) {
      const ctx = await page.context().browser().newContext({ viewport: page.viewportSize(), isMobile: info.project.name === 'phone', hasTouch: info.project.name === 'phone' }); const p2 = await ctx.newPage(); await setup(p2, { lang, intro: true });
      await p2.goto(BASE + '/?intro=1&lang=' + lang, { waitUntil: 'load' }); await p2.waitForSelector('.intro-gate [data-testid="intro-sign"]', { timeout: 15000 });
      const before = await p2.evaluate(() => { const v = document.querySelector('.intro-video'), s = document.querySelector('.intro-sign'), l = document.querySelector('.intro-label'), b = document.querySelector('.intro-play'); return { autoplayAttr: v.hasAttribute('autoplay'), autoplayProp: v.autoplay, muted: v.muted, mutedAttr: v.hasAttribute('muted'), paused: v.paused, ct: v.currentTime, narrationPause: v.getAttribute('data-narration-pause'), sign: !!s && getComputedStyle(s).opacity === '1', signMotion: s.getAttribute('data-motion'), anim: getComputedStyle(s.querySelector('.intro-sign-img')).animationName, label: l && l.textContent, labelVisible: !!l && l.getBoundingClientRect().width > 0, play: !!b && !b.hidden && b.getBoundingClientRect().width > 0, playText: b && b.textContent, lang: document.documentElement.lang, dir: document.documentElement.dir }; });
      await shot(p2, info, 'intro-' + lang);
      await p2.waitForTimeout(5000); const idle = await p2.evaluate(() => { const v = document.querySelector('.intro-video'); return { paused: v.paused, ct: v.currentTime }; });
      expect(before.autoplayAttr, 'no autoplay attribute').toBe(false); expect(before.autoplayProp).toBe(false); expect(before.mutedAttr, 'no muted auto-start').toBe(false); expect(before.muted).toBe(false);
      expect(idle.paused, 'still paused 5 s after open').toBe(true); expect(idle.ct, 'currentTime 0 after 5 s idle').toBe(0);
      expect(before.sign).toBe(true); expect(before.anim).toBe('intro-sign-float'); expect(before.labelVisible).toBe(true); expect(before.label).toContain(lang === 'ar' ? 'فيلم المقدمة — أثر' : 'Intro film — Athar'); expect(before.label).toContain('1:00'); expect(before.play).toBe(true); expect(before.playText).toBe(lang === 'ar' ? 'تشغيل المقدمة' : 'Play intro'); expect(before.narrationPause).toBe('true'); expect(before.dir).toBe(lang === 'ar' ? 'rtl' : 'ltr');
      if (info.project.name === 'phone') await p2.tap('[data-testid="intro-play"]'); else await p2.click('[data-testid="intro-play"]');
      await p2.waitForFunction(() => { const v = document.querySelector('.intro-video'); return !v.paused && v.currentTime > 0.4; }, null, { timeout: 15000 }); await p2.waitForTimeout(700);
      const playing = await p2.evaluate(() => { const v = document.querySelector('.intro-video'), s = document.querySelector('.intro-sign'), b = document.querySelector('.intro-play'), g = document.querySelector('.intro-gate'); return { paused: v.paused, ct: v.currentTime, muted: v.muted, cls: g.className, signOpacity: getComputedStyle(s).opacity, playHidden: b.hidden || getComputedStyle(b).display === 'none', overlays: [...g.querySelectorAll(':scope > *')].filter((e) => e !== v && e.tagName !== 'P' && getComputedStyle(e).opacity !== '0' && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0).map((e) => e.className) }; });
      await shot(p2, info, 'intro-playing-' + lang);
      expect(playing.paused).toBe(false); expect(playing.ct).toBeGreaterThan(0.4); expect(playing.muted, 'plays with sound').toBe(false); expect(playing.cls).toContain('is-playing'); expect(playing.signOpacity).toBe('0'); expect(playing.playHidden).toBe(true);
      expect(playing.overlays.filter((c) => /intro-sign|intro-play/.test(c)), 'no sign / play overlay left on the film').toEqual([]);
      await p2.evaluate(() => document.querySelector('.intro-video').click()); await p2.waitForFunction(() => document.querySelector('.intro-video').paused && !document.querySelector('.intro-play').hidden, null, { timeout: 8000 });
      const pausedState = await p2.evaluate(() => ({ paused: document.querySelector('.intro-video').paused, playText: document.querySelector('.intro-play').textContent }));
      await p2.keyboard.press('Escape'); await p2.waitForFunction(() => !document.querySelector('.intro-gate'), null, { timeout: 8000 });
      rows.push({ lang, before, idle, playing, pausedState, errors: p2.__errors.slice() }); expect(p2.__errors).toEqual([]); await ctx.close();
    }
    write('intro-' + info.project.name, rows);
  });

  test('guide pauses on the intro film\'s play and resumes on pause / skip (Replay intro while the guide is narrating)', async ({ page }, info) => {
    test.setTimeout(120000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 5); await startGuide(page, mobile); await waitState(page, "s.state === 'playing'", 15000);
    await page.click('[data-testid="intro-replay"]'); await page.waitForSelector('.intro-gate [data-testid="intro-play"]', { timeout: 10000 }); await page.waitForTimeout(600);
    const onOpen = await guide(page); expect(onOpen.state, 'opening the press-to-play intro does not pause the guide by itself').toBe('playing');
    if (mobile) await page.tap('[data-testid="intro-play"]'); else await page.click('[data-testid="intro-play"]');
    await waitState(page, "s.state === 'paused' && s.reason === 'video'", 10000); const onPlay = await guide(page);
    await page.evaluate(() => document.querySelector('.intro-video').click()); await waitState(page, "s.state === 'playing' || s.state === 'loading'", 10000); const onPause = await guide(page);
    if (mobile) await page.tap('[data-testid="intro-play"]'); else await page.click('[data-testid="intro-play"]'); await waitState(page, "s.state === 'paused' && s.reason === 'video'", 10000);
    await page.click('[data-testid="intro-skip"]'); await page.waitForFunction(() => !document.querySelector('.intro-gate'), null, { timeout: 8000 }); await waitState(page, "s.state === 'playing' || s.state === 'loading'", 10000); const onSkip = await guide(page);
    write('intro-guide-' + info.project.name, [{ onOpen, onPlay, onPause, onSkip, errors: page.__errors.slice() }]); expect(page.__errors).toEqual([]);
  });

  test('CEO card player (slide 43): poster + Play + duration + EN/AR tracks, no autoplay after 5 s, press play → playing with the overlay removed, guide pause / resume on pause and at the out-point', async ({ page }, info) => {
    test.setTimeout(180000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 43); await startGuide(page, mobile); await waitState(page, "s.state === 'playing' || s.state === 'loading'", 15000);
    const sel = '#s-exec-khalid video[data-narration-pause]';
    const meta = await page.evaluate((sel) => { const v = document.querySelector(sel), fig = v.closest('.efp'), b = fig.querySelector('.efp-play'); return { state: fig.getAttribute('data-state'), poster: v.poster.split('/').pop(), posterTime: v.dataset.posterTime, variant: v.getAttribute('data-efp-variant'), src: v.querySelector('source').getAttribute('src'), tracks: [...v.querySelectorAll('track')].map((t) => t.kind + ':' + t.srclang + ':' + t.getAttribute('src').split('/').pop() + (t.default ? ':default' : '')), autoplay: v.hasAttribute('autoplay'), muted: v.muted, controls: v.controls, paused: v.paused, ct: v.currentTime, out: v.dataset.out, dur: fig.querySelector('.efp-dur').textContent, title: fig.querySelector('.efp-title').textContent, play: !b.hidden && getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().width > 0, playLabel: b.getAttribute('aria-label'), ratio: (fig.querySelector('.efp-stage').getBoundingClientRect().width / fig.querySelector('.efp-stage').getBoundingClientRect().height), dir: fig.getAttribute('dir'), lang: fig.getAttribute('lang') }; }, sel);
    expect(meta.state).toBe('idle'); expect(meta.poster).toBe(K.poster.split('/').pop()); expect(meta.posterTime).toBe(String(K.posterTimeSec)); expect(meta.variant).toBe(mobile ? '720p' : '1080p'); expect(meta.src).toBe(F(mobile ? K.mp4Mobile : K.mp4));
    expect(meta.tracks).toEqual(['subtitles:en:' + K.captions.en.split('/').pop() + ':default', 'subtitles:ar:' + K.captions.ar.split('/').pop()]); expect(meta.autoplay).toBe(false); expect(meta.muted).toBe(false); expect(meta.controls, 'no native controls on the poster — one clean Play').toBe(false);
    expect(meta.dur).toBe(K.durationLabel); expect(meta.title).toBe(K.title.en); expect(meta.play).toBe(true); expect(Math.abs(meta.ratio - 16 / 9)).toBeLessThan(0.02); expect(meta.dir).toBe('ltr');
    await page.waitForTimeout(5000); const idle = await page.evaluate((sel) => { const v = document.querySelector(sel); return { paused: v.paused, ct: v.currentTime }; }, sel); expect(idle.paused, 'no autoplay — still paused after 5 s').toBe(true); expect(idle.ct).toBe(0);
    const g0 = await guide(page); expect(['playing', 'loading', 'ended']).toContain(g0.state);
    if (mobile) await page.tap('#s-exec-khalid .efp-play'); else await page.click('#s-exec-khalid .efp-play');
    await page.waitForFunction((sel) => { const v = document.querySelector(sel); return !v.paused && v.currentTime > 0.6; }, sel, { timeout: 15000 }); await waitState(page, "s.state === 'paused' && s.reason === 'video'", 8000); await page.waitForTimeout(600);
    const playing = await page.evaluate((sel) => { const v = document.querySelector(sel), fig = v.closest('.efp'), b = fig.querySelector('.efp-play'); const overlays = [...fig.querySelector('.efp-stage').children].filter((e) => e !== v && getComputedStyle(e).display !== 'none' && getComputedStyle(e).opacity !== '0').map((e) => e.className); return { state: fig.getAttribute('data-state'), paused: v.paused, ct: v.currentTime, controls: v.controls && v.hasAttribute('controls'), playHidden: getComputedStyle(b).display === 'none', overlays, muted: v.muted, showing: [...v.textTracks].filter((t) => t.mode === 'showing').map((t) => t.language) }; }, sel);
    await shot(page, info, 'card-khalid-playing-en'); const gPlay = await guide(page);
    expect(playing.state).toBe('playing'); expect(playing.paused).toBe(false); expect(playing.ct).toBeGreaterThan(0.6); expect(playing.controls, 'native controls once playing').toBe(true); expect(playing.playHidden, 'custom Play overlay removed').toBe(true); expect(playing.overlays, 'nothing on top of the <video>').toEqual([]); expect(playing.muted).toBe(false); expect(playing.showing).toEqual(['en']);
    expect(gPlay.state).toBe('paused'); expect(gPlay.reason).toBe('video');
    await page.evaluate((sel) => document.querySelector(sel).pause(), sel); await waitState(page, "s.state === 'playing' || s.state === 'loading'", 10000); const gPause = await guide(page);
    const pausedUi = await page.evaluate((sel) => { const v = document.querySelector(sel), fig = v.closest('.efp'); return { state: fig.getAttribute('data-state'), playVisible: getComputedStyle(fig.querySelector('.efp-play')).display !== 'none' }; }, sel); expect(pausedUi.state).toBe('paused'); expect(pausedUi.playVisible).toBe(true);
    await page.evaluate(async (sel) => { const v = document.querySelector(sel); v.currentTime = 35.0; await v.play(); }, sel); await waitState(page, "s.state === 'paused' && s.reason === 'video'", 8000);
    await page.waitForFunction((sel) => { const v = document.querySelector(sel); return v.paused && v.currentTime >= 37.2; }, sel, { timeout: 20000 }); await waitState(page, "s.state === 'playing' || s.state === 'loading' || s.state === 'ended'", 12000); const gEnd = await guide(page);
    const endUi = await page.evaluate((sel) => { const v = document.querySelector(sel), fig = v.closest('.efp'); return { state: fig.getAttribute('data-state'), endedAtOut: v.getAttribute('data-ended-at-out'), replay: fig.querySelector('.efp-play').textContent }; }, sel);
    write('khalid-player-' + info.project.name, [{ meta, idle, playing, guide: { start: g0, onPlay: gPlay, onPause: gPause, atEnd: gEnd }, pausedUi, endUi, errors: page.__errors.slice() }]);
    expect(endUi.state, 'film ended (at its out-point or its natural end)').toBe('ended'); expect(['playing', 'loading', 'ended']).toContain(gEnd.state); expect(gEnd.reason === 'video').toBe(false); expect(page.__errors).toEqual([]);
  });

  test('cards EN + AR: player on the CEO card, ready slots on Fahad / Ary / Kayaan, no overflow, 16:9 box, CLS ≈ 0, RTL mirroring', async ({ page }, info) => {
    test.setTimeout(240000); const mobile = info.project.name === 'phone'; const rows = [];
    for (const lang of ['en', 'ar']) for (const [who, k, n] of CARDS) {
      const ctx = await page.context().browser().newContext({ viewport: page.viewportSize(), isMobile: mobile, hasTouch: mobile }); const p2 = await ctx.newPage(); await setup(p2, { lang });
      await p2.goto(BASE + '/?lang=' + lang + '#/28/exec-' + k, { waitUntil: 'load' }); await p2.waitForSelector('#s-exec-' + who + '.is-active', { timeout: 20000 }); await p2.evaluate(() => { window.__cls = 0; window.__clsEntries = []; }); /* CLS of the rendered card from the moment it is active (the SPA boot itself is out of scope) */ await p2.waitForTimeout(2500);
      const r = await p2.evaluate(({ who, lang }) => { const sec = document.getElementById('s-exec-' + who), body = sec.querySelector('.s-body'), letter = sec.querySelector('.ex-letter'), card = sec.querySelector('.ex-card'), fig = sec.querySelector('.efp'), slot = sec.querySelector('.efp-slot'), v = sec.querySelector('video'), de = document.scrollingElement;
        const bb = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
        const stage = fig && fig.querySelector('.efp-stage'); const sb = stage && stage.getBoundingClientRect();
        return { lang, who, dir: document.documentElement.dir, hash: location.hash, cls: window.__cls, clsEntries: window.__clsEntries.slice(0, 8), docOverflowX: de.scrollWidth - de.clientWidth, secOverflowX: sec.scrollWidth - sec.clientWidth, bodyScroll: body.scrollHeight - body.clientHeight, bodyOverflowY: getComputedStyle(body).overflowY,
          video: v ? { paused: v.paused, ct: v.currentTime, autoplay: v.hasAttribute('autoplay'), poster: v.poster.split('/').pop(), defaultTrack: ([...v.querySelectorAll('track')].find((t) => t.default) || {}).srclang } : null, figDir: fig && fig.getAttribute('dir'), ratio: sb ? sb.width / sb.height : null, stage: bb(stage), stageInViewport: sb ? sb.left >= -1 && sb.right <= window.innerWidth + 1 : null,
          slot: slot ? { state: slot.getAttribute('data-state'), text: slot.textContent.trim(), dir: slot.getAttribute('dir'), visible: slot.getBoundingClientRect().width > 0 && getComputedStyle(slot).display !== 'none' } : null, letter: bb(letter), card: bb(card), media: bb(fig || slot), roundel: bb(sec.querySelector('.ex-roundel')) }; }, { who, lang });
      await shot(p2, info, `card-${who}-${lang}`); rows.push(r); write('cards-layout-' + info.project.name, rows);
      expect(r.dir).toBe(lang === 'ar' ? 'rtl' : 'ltr'); expect(r.docOverflowX, 'no horizontal page overflow').toBeLessThanOrEqual(1); expect(r.secOverflowX, 'no horizontal slide overflow').toBeLessThanOrEqual(1); expect(r.cls, 'cumulative layout shift').toBeLessThan(0.02);
      if (who === 'khalid') { expect(r.video).not.toBeNull(); expect(r.video.autoplay).toBe(false); expect(r.video.paused).toBe(true); expect(r.video.defaultTrack).toBe(lang); expect(r.figDir).toBe(lang === 'ar' ? 'rtl' : 'ltr'); expect(Math.abs(r.ratio - 16 / 9)).toBeLessThan(0.02); expect(r.stageInViewport).toBe(true); expect(r.slot).toBeNull();
        if (!mobile) { if (lang === 'ar') expect(r.media.x, 'RTL: the player sits on the inline-start (left) side of the letter').toBeLessThan(r.letter.x); else expect(r.media.x, 'LTR: the player sits to the right of the letter').toBeGreaterThan(r.letter.x + r.letter.w - 5); } else expect(r.media.y, 'phone: the player stacks under the letter').toBeGreaterThan(r.letter.y + r.letter.h - 5); }
      else { expect(r.video, 'no <video> on a card without a verified film').toBeNull(); expect(r.slot).not.toBeNull(); expect(r.slot.state).toBe('coming-soon'); expect(r.slot.visible).toBe(true); expect(r.slot.text).toContain(lang === 'ar' ? 'الفيلم قريباً' : 'Film coming soon'); expect(r.slot.dir).toBe(lang === 'ar' ? 'rtl' : 'ltr');
        if (!mobile) { expect(Math.abs(r.media.y - r.roundel.y), 'desktop: the slot sits beside the roundel on the card').toBeLessThan(r.roundel.h); if (lang === 'ar') expect(r.media.x + r.media.w).toBeLessThanOrEqual(r.roundel.x + 2); else expect(r.media.x).toBeGreaterThanOrEqual(r.roundel.x + r.roundel.w - 2); } else expect(r.media.y, 'phone: the slot stacks under the roundel').toBeGreaterThan(r.roundel.y + r.roundel.h - 2); }
      expect(p2.__errors).toEqual([]); await ctx.close();
    }
    write('cards-layout-' + info.project.name, rows);
  });

  test('EN → AR toggle on the CEO card: RTL mirror, AR default captions, player re-rendered paused', async ({ page }, info) => {
    test.setTimeout(90000); await setup(page); await open(page, 43); const before = await page.evaluate(() => ({ dir: document.documentElement.dir, fig: document.querySelector('#s-exec-khalid .efp').getAttribute('dir'), title: document.querySelector('#s-exec-khalid .efp-title').textContent }));
    await page.click('[data-testid="lang-toggle"]'); await page.waitForFunction(() => document.documentElement.lang === 'ar' && document.querySelector('#s-exec-khalid .efp[dir="rtl"]'), null, { timeout: 10000 }); await page.waitForTimeout(500);
    const after = await page.evaluate(() => { const fig = document.querySelector('#s-exec-khalid .efp'), v = fig.querySelector('video'); return { dir: document.documentElement.dir, fig: fig.getAttribute('dir'), lang: fig.getAttribute('lang'), title: fig.querySelector('.efp-title').textContent, defaultTrack: ([...v.querySelectorAll('track')].find((t) => t.default) || {}).srclang, paused: v.paused, autoplay: v.hasAttribute('autoplay'), play: fig.querySelector('.efp-play').textContent, cc: fig.querySelector('.efp-cc').textContent }; });
    write('rtl-toggle-' + info.project.name, [{ before, after, errors: page.__errors.slice() }]);
    expect(before.dir).toBe('ltr'); expect(before.fig).toBe('ltr'); expect(before.title).toBe(K.title.en); expect(after.dir).toBe('rtl'); expect(after.fig).toBe('rtl'); expect(after.lang).toBe('ar'); expect(after.title).toBe(K.title.ar); expect(after.defaultTrack).toBe('ar'); expect(after.paused).toBe(true); expect(after.autoplay).toBe(false); expect(after.play).toContain('تشغيل الفيلم'); expect(page.__errors).toEqual([]);
  });

  test('HTTP 200 for every narration clip and every film / poster / caption asset; legacy v1.5.7 film paths 404; served film bytes match films.json sha256', async ({ page }) => {
    test.setTimeout(240000); const rows = [];
    const clips = fs.readFileSync(path.join(DIST, '../SHA256SUMS.txt'), 'utf8').split('\n').filter((l) => /\.mp3$/.test(l)).map((l) => l.split('  ./dist')[1]); /* every narration clip served: 44 per-slide + 10 section clips (+ welcome) */ const assets = [F(K.mp4), F(K.mp4Mobile), F(K.poster), F(K.posterWebp), F(K.captions.en), F(K.captions.ar), '/js/exec-films.js', '/js/exec-film-player.js', '/assets/exec-film-player.css', '/build-info.json'];
    for (const u of clips) { const r = await page.request.get(BASE + u); rows.push({ url: u, status: r.status(), type: r.headers()['content-type'] }); expect(r.status(), u).toBe(200); expect(r.headers()['content-type'], u).toMatch(/audio\/mpeg/); }
    for (const u of assets) { const r = await page.request.get(BASE + u); const body = await r.body(); rows.push({ url: u, status: r.status(), type: r.headers()['content-type'], bytes: body.length, sha256: crypto.createHash('sha256').update(body).digest('hex') }); expect(r.status(), u).toBe(200); expect(body.length, u).toBeGreaterThan(100); }
    const by = Object.fromEntries(rows.map((r) => [r.url, r])); expect(by[F(K.mp4)].sha256).toBe(K.mp4Sha256); expect(by[F(K.mp4Mobile)].sha256).toBe(K.mp4MobileSha256); expect(by[F(K.poster)].sha256).toBe(K.posterSha256); expect(by[F(K.captions.en)].sha256).toBe(K.captionsSha256.en); expect(by[F(K.captions.ar)].sha256).toBe(K.captionsSha256.ar);
    expect(by[F(K.mp4)].type).toMatch(/video\/mp4/); expect(by[F(K.captions.en)].type).toMatch(/text\/vtt/); for (const u of [F(K.captions.en), F(K.captions.ar)]) expect((await (await page.request.get(BASE + u)).text()).startsWith('WEBVTT')).toBe(true);
    const range = await page.request.get(BASE + F(K.mp4), { headers: { Range: 'bytes=0-1023' } }); expect(range.status(), 'Range requests (seeking) supported').toBe(206);
    for (const u of ['/js/exec-film.js', '/assets/exec/video/athar-origins-of-impact-ep01-muhammed-khalid-1080p.mp4', '/assets/exec/video/athar-origins-of-impact-ep01.en.vtt']) { const r = await page.request.get(BASE + u); rows.push({ url: u, status: r.status() }); expect(r.status(), u).toBe(404); }
    const info = await (await page.request.get(BASE + '/build-info.json')).json(); expect(info.version).toBe('1.5.9'); expect(info.features.execFilms).toBe(true); expect(info.films.find((f) => f.id === 'khalid').sha256).toBe(K.mp4Sha256); expect(info.films.filter((f) => f.status === 'coming-soon').map((f) => f.id)).toEqual(['al-ameri', 'ferreira-da-cunha', 'unwalla']);
    write('http-' + test.info().project.name, rows); expect(clips.length).toBeGreaterThanOrEqual(54);
  });
});
