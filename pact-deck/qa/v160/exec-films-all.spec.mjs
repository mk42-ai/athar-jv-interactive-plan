// Athar deck v1.6.0 — the three executive films (Khalid retained · Fahad Al Ameri + Ary Ferreira da Cunha added) through the shared ExecFilmPlayer, Kayaan's ready slot untouched.
// Desktop 1440×900 + phone 390×844, EN + AR. Asserts, per shipped film: player present with the films.json poster, 1080p/720p variant by viewport, EN + AR <track>
// (default = deck language), duration label, no autoplay (5 s idle), press Play → playing with native controls and no overlay, guide paused·video → resumes when the
// film is paused and after it ends; Kayaan = "Film coming soon / قريباً" slot, no <video>; version 1.6.0 on the footer badge, html[data-deck-version], build-info.json
// and window.AtharExecTeam; 0 px horizontal overflow, CLS, RTL mirroring; HTTP 200 + sha256 match for every 1080p / 720p / poster / VTT asset and all narration clips.
// Usage: GUIDE_BASE=http://127.0.0.1:4160 SHOT_PREFIX=after SHOTS_DIR=/path npx playwright test -c qa/v160/playwright.config.mjs
import { test, expect } from '../../node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { instrument, FILE2CLIP, hashFor, DIST } from '../v154/lib.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const BASE = process.env.GUIDE_BASE || 'http://127.0.0.1:4160';
const PREFIX = process.env.SHOT_PREFIX || 'after';
const SHOTS = process.env.SHOTS_DIR || path.join(HERE, 'screenshots');
const RESULTS = path.join(HERE, 'results'); fs.mkdirSync(RESULTS, { recursive: true }); fs.mkdirSync(SHOTS, { recursive: true });
const PKG = JSON.parse(fs.readFileSync(path.join(HERE, '../../package.json'), 'utf8'));
const FILMS = JSON.parse(fs.readFileSync(path.join(HERE, '../../features/exec-films/films.json'), 'utf8')); const F = (rel) => FILMS.distBase + rel;
const CARDS = [['al-ameri', 2, 41], ['ferreira-da-cunha', 3, 42], ['khalid', 4, 43], ['unwalla', 5, 44]];
const SHIPPED = CARDS.filter(([id]) => FILMS.films[id].status === 'shipped'); const SLOTS = CARDS.filter(([id]) => FILMS.films[id].status !== 'shipped');
const write = (name, rows) => fs.writeFileSync(path.join(RESULTS, name + '.json'), JSON.stringify({ base: BASE, version: PKG.version, written: new Date().toISOString(), rows }, null, 1));
const vp = (info) => (info.project.name === 'phone' ? '390x844' : '1440x900');
const shot = (page, info, name) => page.screenshot({ path: path.join(SHOTS, `${PREFIX}-${name}-${vp(info)}.png`), fullPage: false });
async function setup(page, { lang = 'en' } = {}) {
  await page.addInitScript(instrument(FILE2CLIP, 1));
  await page.addInitScript(({ lang }) => { try { sessionStorage.setItem('athar-intro-v1.4.2', 'done'); localStorage.setItem('athar-pact-lang', lang); } catch (e) {} window.__cls = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {} }, { lang });
  page.__errors = []; page.on('pageerror', (e) => page.__errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') page.__errors.push(m.text()); });
}
async function open(page, n, lang) { await page.goto(BASE + '/' + (lang ? '?lang=' + lang : '') + hashFor(n), { waitUntil: 'load' }); await page.waitForFunction(() => !!window.AtharGuide && !!document.querySelector('#athar-narration'), null, { timeout: 20000 }); await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 15000 }); }
const guide = (page) => page.evaluate(() => { const r = document.getElementById('athar-narration'); return { state: r.getAttribute('data-state'), reason: r.getAttribute('data-reason') }; });
const waitState = (page, src, ms = 10000) => page.waitForFunction((src) => { const r = document.getElementById('athar-narration'); const s = { state: r.getAttribute('data-state'), reason: r.getAttribute('data-reason') }; return new Function('s', 'return ' + src)(s); }, src, { timeout: ms });

test.describe(`v${PKG.version} — three executive films + Kayaan slot`, () => {
  test('version everywhere the deck surfaces it (footer badge, html data-deck-version, build-info, modules)', async ({ page }) => {
    await setup(page); await open(page, 43);
    const v = await page.evaluate(() => ({ badge: (document.querySelector('[data-testid="deck-version"]') || {}).textContent, html: document.documentElement.getAttribute('data-deck-version'), exec: window.AtharExecTeam.version, player: window.AtharExecFilmPlayer.version, guide: window.AtharGuide.version, intro: window.AtharIntro.VERSION, films: window.AtharExecFilms.version }));
    const info = await (await page.request.get(BASE + '/build-info.json')).json();
    write('version-' + test.info().project.name, [{ ...v, buildInfo: info.version, features: info.features }]);
    const V = PKG.version; /* v1.6.1: data-driven */ expect(v.badge).toBe('v' + V); expect(v.html).toBe(V); expect(v.exec).toBe('v' + V); expect(v.player).toBe('v' + V); expect(v.guide).toBe('v' + V); expect(v.intro).toBe('v' + V); expect(v.films).toBe(V); expect(info.version).toBe(V); expect(info.features.version).toBe(V);
    expect(info.films.filter((f) => f.status === 'shipped').map((f) => f.id).sort()).toEqual(SHIPPED.map(([id]) => id).sort()); expect(info.films.filter((f) => f.status === 'coming-soon').map((f) => f.id)).toEqual(SLOTS.map(([id]) => id)); expect(page.__errors).toEqual([]);
  });

  for (const [who, k, n] of SHIPPED) test(`${who} (slide ${n}): poster → press-to-play → native controls → guide pauses → resumes on pause and after the end`, async ({ page }, info) => {
    test.setTimeout(240000); const mobile = info.project.name === 'phone'; const f = FILMS.films[who]; const sel = `#s-exec-${who} video[data-narration-pause]`;
    await setup(page); await open(page, n); if (mobile) await page.tap('[data-testid="guide-toggle"]'); else await page.click('[data-testid="guide-toggle"]'); await waitState(page, "s.state === 'playing' || s.state === 'loading' || s.state === 'ended'", 15000);
    const meta = await page.evaluate((sel) => { const v = document.querySelector(sel), fig = v.closest('.efp'), b = fig.querySelector('.efp-play'); return { state: fig.getAttribute('data-state'), poster: v.poster.split('/').pop(), posterTime: v.dataset.posterTime, variant: v.getAttribute('data-efp-variant'), src: v.querySelector('source').getAttribute('src'), tracks: [...v.querySelectorAll('track')].map((t) => t.kind + ':' + t.srclang + (t.default ? ':default' : '')), autoplay: v.hasAttribute('autoplay'), muted: v.muted, controls: v.controls, paused: v.paused, ct: v.currentTime, dur: fig.querySelector('.efp-dur').textContent, title: fig.querySelector('.efp-title').textContent, play: !b.hidden && getComputedStyle(b).display !== 'none', ratio: fig.querySelector('.efp-stage').getBoundingClientRect().width / fig.querySelector('.efp-stage').getBoundingClientRect().height }; }, sel);
    expect(meta.state).toBe('idle'); expect(meta.poster).toBe(f.poster.split('/').pop()); expect(meta.posterTime).toBe(String(f.posterTimeSec)); expect(meta.variant).toBe(mobile ? '720p' : '1080p'); expect(meta.src).toBe(F(mobile ? f.mp4Mobile : f.mp4));
    expect(meta.tracks).toEqual(['subtitles:en:default', 'subtitles:ar']); expect(meta.autoplay).toBe(false); expect(meta.muted).toBe(false); expect(meta.controls).toBe(false); expect(meta.dur).toBe(f.durationLabel); expect(meta.title).toBe(f.title.en); expect(meta.play).toBe(true); expect(Math.abs(meta.ratio - 16 / 9)).toBeLessThan(0.02);
    await page.waitForTimeout(5000); const idle = await page.evaluate((sel) => { const v = document.querySelector(sel); return { paused: v.paused, ct: v.currentTime }; }, sel); expect(idle.paused).toBe(true); expect(idle.ct).toBe(0);
    if (mobile) await page.tap(`#s-exec-${who} .efp-play`); else await page.click(`#s-exec-${who} .efp-play`);
    await page.waitForFunction((sel) => { const v = document.querySelector(sel); return !v.paused && v.currentTime > 0.6; }, sel, { timeout: 15000 }); await waitState(page, "s.state === 'paused' && s.reason === 'video'", 8000); await page.waitForTimeout(500);
    const playing = await page.evaluate((sel) => { const v = document.querySelector(sel), fig = v.closest('.efp'); return { state: fig.getAttribute('data-state'), paused: v.paused, ct: v.currentTime, controls: v.controls && v.hasAttribute('controls'), overlayHidden: getComputedStyle(fig.querySelector('.efp-play')).display === 'none', overlays: [...fig.querySelector('.efp-stage').children].filter((e) => e !== v && getComputedStyle(e).display !== 'none' && getComputedStyle(e).opacity !== '0').length, showing: [...v.textTracks].filter((t) => t.mode === 'showing').map((t) => t.language) }; }, sel);
    await shot(page, info, `card-${who}-playing-en`); const gPlay = await guide(page);
    expect(playing.state).toBe('playing'); expect(playing.controls).toBe(true); expect(playing.overlayHidden).toBe(true); expect(playing.overlays).toBe(0); expect(playing.showing).toEqual(['en']); expect(gPlay).toEqual({ state: 'paused', reason: 'video' });
    await page.evaluate((sel) => document.querySelector(sel).pause(), sel); await waitState(page, "s.state === 'playing' || s.state === 'loading'", 10000); const gPause = await guide(page);
    await page.evaluate(async (sel) => { const v = document.querySelector(sel); v.currentTime = Math.max(0, v.duration - 3); await v.play(); }, sel); await waitState(page, "s.state === 'paused' && s.reason === 'video'", 8000);
    await page.waitForFunction((sel) => { const v = document.querySelector(sel); return v.paused && (v.ended || v.closest('.efp').getAttribute('data-state') === 'ended'); }, sel, { timeout: 20000 }); await waitState(page, "s.state === 'playing' || s.state === 'loading' || s.state === 'ended'", 12000); const gEnd = await guide(page);
    write(`film-${who}-` + info.project.name, [{ meta, idle, playing, guide: { onPlay: gPlay, onPause: gPause, atEnd: gEnd }, errors: page.__errors.slice() }]);
    expect(['playing', 'loading']).toContain(gPause.state); expect(gEnd.reason === 'video').toBe(false); expect(page.__errors).toEqual([]);
  });

  test('all four cards in EN + AR: players on the three film cards, Kayaan slot untouched, 0 px horizontal overflow, CLS, RTL mirroring (+ screenshots)', async ({ page }, info) => {
    test.setTimeout(300000); const mobile = info.project.name === 'phone'; const rows = [];
    for (const lang of ['en', 'ar']) for (const [who, k, n] of CARDS) {
      const ctx = await page.context().browser().newContext({ viewport: page.viewportSize(), isMobile: mobile, hasTouch: mobile }); const p2 = await ctx.newPage(); await setup(p2, { lang });
      await p2.goto(BASE + '/?lang=' + lang + '#/28/exec-' + k, { waitUntil: 'load' }); await p2.waitForSelector('#s-exec-' + who + '.is-active', { timeout: 20000 }); await p2.evaluate(() => { window.__cls = 0; }); await p2.waitForTimeout(2500);
      const r = await p2.evaluate(({ who, lang }) => { const sec = document.getElementById('s-exec-' + who), letter = sec.querySelector('.ex-letter'), fig = sec.querySelector('.efp'), slot = sec.querySelector('.efp-slot'), v = sec.querySelector('video'), de = document.scrollingElement, card = sec.querySelector('.ex-card');
        const bb = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; }; const st = fig && fig.querySelector('.efp-stage');
        return { lang, who, dir: document.documentElement.dir, cls: window.__cls, docOverflowX: de.scrollWidth - de.clientWidth, secOverflowX: sec.scrollWidth - sec.clientWidth, video: v ? { paused: v.paused, autoplay: v.hasAttribute('autoplay'), poster: v.poster.split('/').pop(), defaultTrack: ([...v.querySelectorAll('track')].find((t) => t.default) || {}).srclang } : null, figDir: fig && fig.getAttribute('dir'), ratio: st ? st.getBoundingClientRect().width / st.getBoundingClientRect().height : null, slot: slot ? { state: slot.getAttribute('data-state'), text: slot.textContent.trim(), visible: slot.getBoundingClientRect().width > 0 } : null, letter: bb(letter), media: bb(fig || slot), card: bb(card), title: fig && fig.querySelector('.efp-title').textContent }; }, { who, lang });
      await shot(p2, info, `card-${who}-${lang}`); rows.push(r); write('cards-' + info.project.name, rows);
      expect(r.dir).toBe(lang === 'ar' ? 'rtl' : 'ltr'); expect(r.docOverflowX).toBeLessThanOrEqual(1); expect(r.secOverflowX).toBeLessThanOrEqual(1); expect(r.cls).toBeLessThan(0.02);
      if (FILMS.films[who].status === 'shipped') { expect(r.video).not.toBeNull(); expect(r.video.autoplay).toBe(false); expect(r.video.paused).toBe(true); expect(r.video.poster).toBe(FILMS.films[who].poster.split('/').pop()); expect(r.video.defaultTrack).toBe(lang); expect(r.figDir).toBe(lang === 'ar' ? 'rtl' : 'ltr'); expect(Math.abs(r.ratio - 16 / 9)).toBeLessThan(0.02); expect(r.title).toBe(FILMS.films[who].title[lang]); expect(r.slot).toBeNull();
        if (!mobile) { if (lang === 'ar') expect(r.media.x + r.media.w).toBeLessThanOrEqual(r.letter.x + 2); else expect(r.media.x).toBeGreaterThanOrEqual(r.letter.x + r.letter.w - 2); if (r.card) expect(r.card.y, 'the profile card sits under the film in the side column').toBeGreaterThanOrEqual(r.media.y + r.media.h - 2); } else expect(r.media.y).toBeGreaterThan(r.letter.y + r.letter.h - 5); }
      else { expect(r.video).toBeNull(); expect(r.slot).not.toBeNull(); expect(r.slot.state).toBe('coming-soon'); expect(r.slot.visible).toBe(true); expect(r.slot.text).toContain(lang === 'ar' ? 'الفيلم قريباً' : 'Film coming soon'); }
      expect(p2.__errors).toEqual([]); await ctx.close();
    }
  });

  test('HTTP 200 + sha256 for every film variant, poster and VTT, all narration clips 200; legacy paths 404', async ({ page }) => {
    test.setTimeout(240000); const rows = [];
    const clips = fs.readFileSync(path.join(DIST, '../SHA256SUMS.txt'), 'utf8').split('\n').filter((l) => /\.mp3$/.test(l)).map((l) => l.split('  ./dist')[1]);
    for (const u of clips) { const r = await page.request.get(BASE + u); rows.push({ url: u, status: r.status() }); expect(r.status(), u).toBe(200); }
    for (const [id] of SHIPPED) { const f = FILMS.films[id]; for (const [u, want, type] of [[F(f.mp4), f.mp4Sha256, /video\/mp4/], [F(f.mp4Mobile), f.mp4MobileSha256, /video\/mp4/], [F(f.poster), f.posterSha256, /image\/jpeg/], [F(f.captions.en), f.captionsSha256.en, /text\/vtt/], [F(f.captions.ar), f.captionsSha256.ar, /text\/vtt/]]) { const r = await page.request.get(BASE + u); const body = await r.body(); const sha = crypto.createHash('sha256').update(body).digest('hex'); rows.push({ url: u, status: r.status(), bytes: body.length, sha256: sha, match: sha === want }); expect(r.status(), u).toBe(200); expect(r.headers()['content-type'], u).toMatch(type); expect(sha, u).toBe(want); }
      for (const u of [F(f.captions.en), F(f.captions.ar)]) expect((await (await page.request.get(BASE + u)).text()).startsWith('WEBVTT')).toBe(true); expect((await page.request.get(BASE + F(f.mp4), { headers: { Range: 'bytes=0-1023' } })).status()).toBe(206); }
    for (const u of ['/js/exec-film.js', '/assets/exec/video/athar-origins-of-impact-ep01-muhammed-khalid-1080p.mp4']) expect((await page.request.get(BASE + u)).status(), u).toBe(404);
    write('http-' + test.info().project.name, rows); expect(clips.length).toBeGreaterThanOrEqual(54);
  });

  test('deep links 32, 38, 39–44 resolve (EN + AR) and every slide loads with 0 console / page errors', async ({ page }) => {
    test.setTimeout(300000); await setup(page); await open(page, 1); const rows = [];
    for (const lang of ['en', 'ar']) { if (lang === 'ar') { await page.click('[data-testid="lang-toggle"]'); await page.waitForFunction(() => document.documentElement.dir === 'rtl', null, { timeout: 8000 }); }
      for (let n = 1; n <= 44; n++) { await page.evaluate((h) => { location.hash = h; }, hashFor(n)); await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 9000 }); rows.push({ lang, n, errors: page.__errors.length }); } }
    for (const lang of ['en', 'ar']) for (const n of [32, 38, 39, 40, 41, 42, 43, 44]) { const ctx = await page.context().browser().newContext({ viewport: page.viewportSize() }); const p2 = await ctx.newPage(); await setup(p2, { lang }); await p2.goto(BASE + '/?lang=' + lang + hashFor(n), { waitUntil: 'load' }); await p2.waitForFunction(() => !!window.AtharGuide, null, { timeout: 20000 }); await p2.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 15000 }); rows.push({ lang, n, cold: true, ok: true, errors: p2.__errors.length }); expect(p2.__errors).toEqual([]); await ctx.close(); }
    write('slides-deeplinks-' + test.info().project.name, rows); expect(page.__errors).toEqual([]);
  });
});
