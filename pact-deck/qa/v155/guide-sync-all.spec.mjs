// Athar deck v1.5.5 — per-slide Guide sync test for ALL deck slides (43 = 39 + section 09; v1.5.7: 44 → 43 after the removal of the former Letter 1) (Playwright Test, system Chromium).
// Closes the previously unconfirmed mismatch: for EVERY slide the narrated slide id (the player's data-slide-id AND, where a clip
// exists, the slide id of the clip that is actually audible — identified at the network layer from the fetched MP3) must equal the
// visible slide's data-slide-id. Slides 41 and 44 have no clip (TTS HTTP 429): there the player must target the visible slide,
// stay silent (state ended · reason no-clip) and caption the slide. Also: the impact-story film on slide 44 pauses the guide and the
// guide resumes after it; AUTO leaves a clip-less slide after 9 s.
// Usage: GUIDE_BASE=http://127.0.0.1:4405 DECK_TOTAL=43 npx playwright test -c qa/v155/playwright.config.mjs
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
const FEATURES = JSON.parse(fs.readFileSync(path.join(HERE, '../../features.json'), 'utf8')); const FILM_ON = !!FEATURES.originsFilm; // v1.5.7: the CEO film is an optional feature, off in the shipped build
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

  test('impact-story film (slide 42, only when features.json originsFilm=true) pauses the guide while it plays and the guide resumes after it', async ({ page }, info) => {
    test.skip(!FILM_ON, 'originsFilm feature is off (pact-deck/features.json) — no film is shipped'); test.setTimeout(150000); const mobile = info.project.name === 'phone';
    await setup(page); await open(page, 41); await setAuto(page, true); await startGuide(page, mobile);
    let s = await narratedEqualsVisible(page, 41); expect(s.ok).toBe(true);
    await page.keyboard.press('ArrowRight'); await page.waitForFunction(() => window.__qaVisible().n === 42, null, { timeout: 8000 });
    s = await narratedEqualsVisible(page, 42); expect(s.ok, 'slide 42 lead-in clip audible').toBe(true);
    const film = await page.evaluate(() => { const v = document.querySelector('#s-exec-khalid video[data-narration-pause]'); return v ? { poster: v.poster.split('/').pop(), posterTime: v.dataset.posterTime, tracks: [...v.querySelectorAll('track')].map((t) => t.srclang + ':' + t.getAttribute('src').split('/').pop()), in: v.dataset.in, out: v.dataset.out, src: v.querySelector('source').getAttribute('src').split('/').pop() } : null; });
    expect(film).not.toBeNull(); expect(film.poster).toBe('athar-origins-of-impact-ep01-poster-15s5.jpg'); expect(film.tracks).toEqual(['en:athar-origins-of-impact-ep01.en.vtt', 'ar:athar-origins-of-impact-ep01.ar.vtt']);
    await page.evaluate(async () => { const v = document.querySelector('#s-exec-khalid video'); await new Promise((r) => { if (v.readyState >= 1) r(); else v.addEventListener('loadedmetadata', r, { once: true }); }); v.currentTime = 34.0; await v.play(); });
    await page.waitForFunction(() => document.getElementById('athar-narration').getAttribute('data-reason') === 'video', null, { timeout: 6000 });
    const during = await snap(page); const filmPlaying = await page.evaluate(() => { const v = document.querySelector('#s-exec-khalid video'); return !v.paused && v.currentTime > 34; });
    expect(during.state, 'guide paused while the film plays').toBe('paused'); expect(during.audible, 'no narration audible during the film').toBeNull(); expect(filmPlaying).toBe(true);
    // the film stops at its out-point (37.3 s — v1.5.6: the 1080p master trimmed before the closing end card; was 39.4 s) → the guide resumes the slide-42 clip
    await page.waitForFunction(() => { const v = document.querySelector('#s-exec-khalid video'); return v.paused && v.currentTime >= 37.2; }, null, { timeout: 15000 });
    const after = await narratedEqualsVisible(page, 42, 8000);
    const resumed = after.ok || (await page.evaluate(() => window.__qaVisible().n)) === 43;
    write('film-' + info.project.name, [{ during: { state: during.state, reason: during.reason, audible: during.audible }, film, after: row(42, after, 'after film') }]);
    expect(resumed, 'guide resumed after the film').toBe(true);
    expect(page.__errors).toEqual([]);
  });

  test('hidden card (Lorenzo) is not rendered, not counted and not narrated', async ({ page }) => {
    test.setTimeout(60000);
    await setup(page); await open(page, 43);
    const r = await page.evaluate(() => ({ ids: [...document.querySelectorAll('#root section.ex-slide')].map((x) => x.id), count: window.AtharExecTeam.count, total: window.AtharExecTeam.total,
      counter: (document.querySelector('footer.pagefooter .counter') || {}).textContent, text: document.body.innerText }));
    const hiddenInTable = TABLE.slides.filter((x) => /lorenzo/.test(x.slideId)).length;
    write('hidden-cards', [{ ...r, text: undefined, hiddenInTable, mentionsHidden: /Lorenzo|لورينزو/.test(r.text) }]);
    expect(r.ids).toEqual(['s-exec-intro', 's-exec-al-ameri', 's-exec-khalid', 's-exec-unwalla']);
    expect(r.count).toBe(4); expect(r.total).toBe(43); expect(TOTAL).toBe(43); expect(hiddenInTable).toBe(0);
    expect(/Lorenzo|لورينزو/.test(r.text)).toBe(false);
    expect(r.counter).toContain('43');
  });

  // v1.5.6 (updated for v1.5.7) — name labels without honorific, completed Fahad / Kayaan cards (EN + AR)
  test('v1.5.6: name labels carry no honorific, bodies keep it; Fahad and Kayaan cards are complete in EN and AR', async ({ page }, info) => {
    test.setTimeout(90000);
    await setup(page); await open(page, 43);
    const r = await page.evaluate(async () => {
      const sec = (id) => document.getElementById(id);
      const txt = (sel) => [...document.querySelectorAll(sel)].map((e) => e.textContent.trim());
      const facts = (id, lg) => [...sec(id).querySelectorAll('.ex-card-col--' + lg + ' .ex-fact')].map((f) => f.textContent.trim());
      const body = (id, lg) => [...sec(id).querySelectorAll('.ex-col--' + lg + ' .ex-p')].map((p) => p.textContent).join(' ');
      return { names: txt('#root section.ex-slide .ex-name'), index: txt('#root section.ex-slide .ex-index-name'),
        fahadEn: body('s-exec-al-ameri', 'en'), fahadAr: body('s-exec-al-ameri', 'ar'), fahadFactsEn: facts('s-exec-al-ameri', 'en'), fahadFactsAr: facts('s-exec-al-ameri', 'ar'),
        kayaanEn: body('s-exec-unwalla', 'en'), kayaanAr: body('s-exec-unwalla', 'ar'), kayaanFactsEn: facts('s-exec-unwalla', 'en'), kayaanFactsAr: facts('s-exec-unwalla', 'ar') };
    });
    const HON = /H\.E\.|سعادة|معالي/;
    write('v156-cards-' + info.project.name, [{ ...r, kayaanEn: undefined, kayaanAr: undefined, fahadEn: undefined, fahadAr: undefined }]);
    expect(r.names).toHaveLength(6); expect(r.names.filter((n) => HON.test(n))).toEqual([]);
    expect(r.index).toHaveLength(6); expect(r.index.filter((n) => HON.test(n))).toEqual([]);
    expect(r.fahadEn).toContain('H.E. Fahad'); expect(r.fahadAr).toContain('سعادة');
    expect(r.fahadFactsEn).toHaveLength(3); expect(r.fahadFactsAr).toHaveLength(3);
    for (const k of ['University of Pennsylvania', 'CFA', 'Zoud', 'Abu Dhabi Executive Council 2011–14']) expect(r.fahadFactsEn.join(' | ')).toContain(k);
    for (const k of ['جامعة بنسلفانيا', 'زود', 'المجلس التنفيذي لإمارة أبوظبي']) expect(r.fahadFactsAr.join(' | ')).toContain(k);
    expect(r.fahadEn).toContain('Erth Zayed Fund'); expect(r.fahadAr).toContain('صندوق إرث زايد');
    expect(r.kayaanFactsEn).toHaveLength(7); expect(r.kayaanFactsAr).toHaveLength(7);
    for (const k of ['Warwick', 'Bombay', 'BPP', 'Gujarati', 'Hindi', 'ProtectedBy.AI', 'SRA no. 430771', 'Defense']) expect(r.kayaanFactsEn.join(' | ')).toContain(k);
    for (const k of ['وارويك', 'الغوجاراتية', 'ProtectedBy.AI', '430771']) expect(r.kayaanFactsAr.join(' | ')).toContain(k);
    expect(r.kayaanFactsEn.find((f) => /^Admission/.test(f))).not.toMatch(/\b(2007|2010)\b/); // the admission year is disputed (2007 vs 15 Jun 2010) — shown without a year
    expect(r.kayaanEn).toContain('Corporate Partner at Norton Rose Fulbright'); expect(r.kayaanEn).toContain('DWF'); expect(r.kayaanAr).toContain('Norton Rose Fulbright');
  });

  // v1.5.7 — ONE regression test for the three intentional changes: (1) slide 38 shows ONE full concept image under a PRODUCT CONCEPT tab (no film-still claim),
  // (2) Section 09 no longer contains the former Letter 1 (43 slides, renumbered, clip + transcript gone), (3) the CEO letter has no film and the guide plays straight through it.
  test('v1.5.7: product concept image on slide 38 (EN + AR), Section 09 without the former Letter 1 (43 slides), CEO letter without the film — guide plays straight through', async ({ page }, info) => {
    test.setTimeout(150000); const mobile = info.project.name === 'phone';
    await setup(page);
    const go = async (lg, n) => { await page.goto(BASE + '/?lang=' + lg + hashFor(n), { waitUntil: 'load' }); await page.waitForFunction(() => !!window.AtharGuide && !!document.querySelector('#athar-narration'), null, { timeout: 20000 });
      await page.waitForFunction((n) => window.__qaVisible().n === n, n, { timeout: 15000 }); };
    // (1) slide 38 — the concept image, tab and caption, EN + AR
    const S38 = { en: { tab: 'PRODUCT CONCEPT', cap: 'CONCEPT RENDER' }, ar: { tab: 'مفهوم المنتج', cap: 'تصوّر مفاهيمي' } }; const seen38 = {};
    for (const lg of ['en', 'ar']) {
      await go(lg, 38); await page.waitForFunction(() => { const i = document.querySelector('#s-aos-nations .aos-nation-concept img'); return !!i && i.complete && i.naturalWidth > 0; }, null, { timeout: 15000 });
      const r = await page.evaluate(() => { const sec = document.getElementById('s-aos-nations'), c = sec.querySelector('.aos-nation-concept'), i = c.querySelector('img'), b = i.getBoundingClientRect();
        return { tab: c.querySelector('.aos-concept-tab').textContent.trim(), cap: c.querySelector('figcaption').textContent.trim(), alt: i.alt, nat: [i.naturalWidth, i.naturalHeight], shown: [Math.round(b.width), Math.round(b.height)], cur: (i.currentSrc || '').split('/').pop(),
          imgs: sec.querySelectorAll('.aos-nation-side img').length, stills: sec.querySelectorAll('.rs-still').length, text: sec.textContent }; });
      seen38[lg] = { ...r, text: undefined };
      expect(r.tab).toBe(S38[lg].tab); expect(r.cap).toBe(S38[lg].cap); expect(r.imgs).toBe(1); expect(r.stills).toBe(0);
      expect(/film still|16\.7|لقطة من فيلم/i.test(r.text), 'no "film still at 16.7 s" claim').toBe(false);
      expect(Math.abs(r.nat[0] / r.nat[1] - 1.6)).toBeLessThan(0.01); expect(Math.abs(r.shown[0] / r.shown[1] - 1.6), 'shown whole at 16:10 (no strip crop)').toBeLessThan(0.03);
      expect(r.cur).toMatch(/plate5-concept-v157-[12]x\.(webp|jpg)$/);
      if (lg === 'en') expect(r.alt).toMatch(/^AI-generated concept render/); else expect(r.alt).toContain('مولَّد بالذكاء الاصطناعي');
    }
    // (2) Section 09 — no former Letter 1, 43 slides, renumbered deep links, clip + transcript gone
    await go('en', 43);
    const r2 = await page.evaluate(() => ({ ids: [...document.querySelectorAll('#root section.ex-slide')].map((x) => x.id), count: window.AtharExecTeam.count, total: window.AtharExecTeam.total, counter: (document.querySelector('footer.pagefooter .counter') || {}).textContent,
      gone: !/Zeyoudi|الزيودي|ثاني بن أحمد/.test([...document.querySelectorAll('#root section.ex-slide')].map((x) => x.textContent).join(' ')), // Section 09 only — Dr Thani is still named on other slides (news captions), which this release deliberately leaves untouched
       index: [...document.querySelectorAll('.ex-index-name')].length }));
    expect(r2.ids).toEqual(['s-exec-intro', 's-exec-al-ameri', 's-exec-khalid', 's-exec-unwalla']); expect(r2.count).toBe(4); expect(r2.total).toBe(43); expect(TABLE.slides.length).toBe(43); expect(r2.counter).toContain('43'); expect(r2.gone).toBe(true); expect(r2.index).toBe(6);
    expect(TABLE.slides.some((x) => /zeyoudi/i.test(x.slideId + (x.file || '') + x.text))).toBe(false);
    expect((await page.request.get(BASE + '/audio/guide/slides/NAR-s41-s-exec-al-zeyoudi.mp3')).status()).toBe(404);
    expect([TABLE.slides.find((x) => x.slideId === 's-exec-al-ameri').n, TABLE.slides.find((x) => x.slideId === 's-exec-khalid').n, TABLE.slides.find((x) => x.slideId === 's-exec-unwalla').n]).toEqual([41, 42, 43]);
    // (3) CEO letter (slide 42) — no film anywhere in the served files, copy re-flowed, narration trimmed, guide plays straight through to slide 43
    await go('en', 42);
    const r3 = await page.evaluate(() => { const sec = document.getElementById('s-exec-khalid'); return { videos: sec.querySelectorAll('video').length, pause: document.querySelectorAll('[data-narration-pause]').length, html: document.documentElement.innerHTML,
      roundel: sec.querySelectorAll('.ex-roundel').length, letterW: Math.round(sec.querySelector('.ex-letter').getBoundingClientRect().width), bodyW: Math.round(sec.querySelector('.s-body').getBoundingClientRect().width) }; });
    const ceo = TABLE.slides.find((x) => x.slideId === 's-exec-khalid');
    if (FILM_ON) { expect(r3.videos, 'features.json originsFilm=true: the film is shipped (this regression test then only checks it is present)').toBe(1); }
    else {
    expect(r3.videos).toBe(0); expect(r3.pause).toBe(0); expect(/origins[- ]of[- ]impact|\bep01\b|Episode 01|أصول الأثر|impact story/i.test(r3.html)).toBe(false); expect(r3.roundel).toBe(1);
    if (!mobile) expect(r3.letterW, 'letter re-flowed to the full slide width (no empty film column)').toBeGreaterThan(r3.bodyW * 0.75);
    for (const f of ['/js/exec-film.js', '/assets/exec/video/athar-origins-of-impact-ep01.en.vtt', '/assets/exec/video/athar-origins-of-impact-ep01-muhammed-khalid-1080p.mp4']) expect((await page.request.get(BASE + f)).status(), f).toBe(404);
    expect(ceo.text).not.toMatch(/press play|impact story/i); expect(ceo.durationSec).toBeLessThan(18.5); expect(ceo.cues).toHaveLength(3);
    await setAuto(page, true); await startGuide(page, mobile);
    const g = await narratedEqualsVisible(page, 42); expect(g.ok, 'CEO clip audible on slide 42').toBe(true); expect(g.reason).not.toBe('video');
    await page.waitForFunction(() => window.__qaVisible().n === 43, null, { timeout: 45000 });
    const g2 = await narratedEqualsVisible(page, 43); expect(g2.ok, 'guide advanced to slide 43 and narrates it').toBe(true);
    }
    write('v157-regression-' + info.project.name, [{ slide38: seen38, section09: r2, ceo: { videos: r3.videos, roundel: r3.roundel, letterW: r3.letterW, bodyW: r3.bodyW, clipDurationSec: ceo.durationSec } }]);
    expect(page.__errors).toEqual([]);
  });
});
