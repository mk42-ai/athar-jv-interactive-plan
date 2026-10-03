#!/usr/bin/env node
/* Athar deck — Guide narration QA harness (v1.5.4).
   Drives the built deck in headless Chromium (Playwright) through the intro and all 39 slides and checks, at every slide
   change, that the clip/cue the Guide is narrating is the one mapped to the slide on screen (NAR-xx per slide), that the
   <audio> element is playing within 1 s of the change (after the autoplay unlock), that caption/transcript highlight match
   the on-screen slide, and that AUTO advances only after the clip for the visible slide has ended.
   Usage: node qa/guide-qa.mjs --label before|after [--base http://127.0.0.1:4173] [--fast 4] [--only 1,2,3] [--shots DIR]
   Every check is appended with an ISO-8601 UTC timestamp to qa/guide-qa-log.md (--log to override). */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true'] : []).filter(Boolean));
const BASE = args.base || 'http://127.0.0.1:4173';
const LABEL = args.label || 'run';
const FAST = Number(args.fast || 0) || 0;
const ONLY = args.only ? args.only.split(',').map(Number) : null;
const LOG = args.log || 'qa/guide-qa-log.md';
const SHOTS = args.shots || null;
const HEADFUL_ARGS = ['--no-sandbox'];
const ts = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- expected mapping (slide -> clip / sentences) read from the built deck ---------- */
const manifest = JSON.parse(fs.readFileSync('dist/narration/narration-manifest.json', 'utf8'));
const cuesDoc = JSON.parse(fs.readFileSync('dist/narration/cues.json', 'utf8'));
const byN = {}; for (const s of manifest.segments) byN[s.n] = s;
const clips = {}; for (const c of cuesDoc.clips) clips[c.clipId] = c;
const expectedClip = (n) => (byN[n] && byN[n].clipId) || null;
function covers(clipId, cueI, n) { const c = clips[clipId]; if (!c) return false; const q = c.cues.find((x) => x.i === cueI); if (!q || n < q.slide) return false; for (const x of c.cues) if (x.i > q.i && x.slide > q.slide) return n < x.slide; return true; }
function firstCueFor(clipId, n) { const c = clips[clipId]; if (!c) return null; let first = null, cover = null; for (const q of c.cues) { if (q.slide === n && !first) first = q; if (q.slide <= n) cover = q; } return first || cover || c.cues[0]; }

/* ---------- log ---------- */
const rows = []; const defects = [];
let scenario = '';
function check(step, ok, detail, repro) {
  const r = { t: ts(), scenario, step, ok: !!ok, detail: String(detail || '') };
  rows.push(r); console.log(`${r.t} ${ok ? 'PASS' : 'FAIL'} [${scenario}] ${step} — ${r.detail}`);
  if (!ok) defects.push({ ...r, repro: repro || '' });
  return !!ok;
}

/* ---------- browser instrumentation (media log + optional fast playback) ---------- */
const initScript = `(() => {
  window.__mediaLog = []; window.__audioEls = []; window.__fastRate = ${FAST || 0};
  const push = (o) => { window.__mediaLog.push(Object.assign({ t: Math.round(performance.now()) }, o)); if (window.__mediaLog.length > 2000) window.__mediaLog.shift(); };
  const hook = (a) => { if (a.__hooked) return a; a.__hooked = true; window.__audioEls.push(a);
    ['playing','pause','ended','error','loadedmetadata','seeked','waiting','stalled','emptied'].forEach((ev) => a.addEventListener(ev, () => push({ ev, src: (a.currentSrc || a.src || '').split('/').pop(), ct: Math.round(a.currentTime * 100) / 100, err: a.error ? a.error.code : 0 })));
    if (window.__fastRate) { const f = () => { try { a.defaultPlaybackRate = window.__fastRate; a.playbackRate = window.__fastRate; } catch (e) {} }; a.addEventListener('loadedmetadata', f); a.addEventListener('play', f); f(); }
    return a; };
  const OrigAudio = window.Audio; const A = function (src) { return hook(src === undefined ? new OrigAudio() : new OrigAudio(src)); }; A.prototype = OrigAudio.prototype; window.Audio = A;
  const ce = document.createElement.bind(document); document.createElement = function (tag, o) { const el = ce(tag, o); if (String(tag).toLowerCase() === 'audio') hook(el); return el; };
  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { hook(this); const src = (this.currentSrc || this.src || '').split('/').pop(); push({ ev: 'play()', src });
    const p = origPlay.apply(this, arguments); if (p && p.then) p.then(() => push({ ev: 'play-ok', src }), (e) => push({ ev: 'play-rejected', src, name: e && e.name })); return p; };
})();`;

const stateFn = () => {
  const vn = () => { try { if (window.AtharImpactTiers && window.AtharImpactTiers.current) { const c = window.AtharImpactTiers.current(); if (c) return c; } } catch (e) {} const a = document.querySelector('#root section.slide.is-active:not(.it-slide)'); const k = a ? parseInt(a.getAttribute('data-n'), 10) : 0; return k === 28 ? 39 : k; };
  const bar = document.querySelector('#athar-narration'); const N = window.AtharNarration; let q = null; try { q = N && N.activeCue && N.activeCue(); } catch (e) {}
  const cap = document.querySelector('[data-testid=nar-caption]'); const act = bar && bar.querySelector('.gbar-sent.is-active'); const tx = bar && bar.querySelector('.gbar-text--en');
  const els = window.__audioEls || []; const a = (N && N.audioElement) ? N.audioElement() : (els.find((x) => (x.currentSrc || x.src) && !x.paused) || els.filter((x) => x.currentSrc || x.src).slice(-1)[0] || null);
  const gs = window.__guideState || null;
  return { n: vn(), clip: bar ? bar.getAttribute('data-clip') : null, seg: bar ? bar.getAttribute('data-segment') : null, narrating: bar ? bar.getAttribute('data-narrating') : null, hold: bar ? bar.getAttribute('data-hold') : null, blocked: bar ? bar.getAttribute('data-blocked') : null, status: bar ? bar.getAttribute('data-status') : null,
    cueI: q ? q.i : null, cueSlide: q ? q.slide : null, cueText: q ? q.text : null, caption: cap ? cap.textContent : null, txActive: act ? act.textContent.trim() : null, txSlide: act ? act.getAttribute('data-slide') : null, txLen: tx ? tx.textContent.length : 0, title: bar ? (bar.querySelector('.gbar-title') || {}).textContent : null,
    audioSrc: a ? (a.currentSrc || a.src || '').split('/').pop() : null, paused: a ? a.paused : null, ended: a ? a.ended : null, ct: a ? Math.round(a.currentTime * 100) / 100 : null, rate: a ? a.playbackRate : null, intro: !!document.querySelector('.intro-gate'), hash: location.hash, lang: document.documentElement.lang, dir: document.documentElement.dir, gs, mediaN: (window.__mediaLog || []).length };
};
const state = (page) => page.evaluate(stateFn);
const mediaLog = (page, from = 0) => page.evaluate((f) => (window.__mediaLog || []).slice(f), from);
async function waitFor(page, pred, timeout = 1500, every = 60) { const t0 = Date.now(); let s; while (Date.now() - t0 < timeout) { s = await state(page); if (pred(s)) return { ok: true, s, ms: Date.now() - t0 }; await sleep(every); } return { ok: false, s, ms: Date.now() - t0 }; }
const clipFile = (clipId) => clips[clipId] ? clips[clipId].file.split('/').pop() : null;

/* the per-slide-change assertion block */
async function assertSlide(page, step, expectN, opts = {}) {
  const t0 = Date.now(); const from = (await state(page)).mediaN;
  const w = await waitFor(page, (s) => s.n === expectN && s.clip === expectedClip(expectN), 1500);
  const s = w.s; const ec = expectedClip(expectN);
  check(step + ' · slide on screen', s.n === expectN, `visible slide ${s.n} (expected ${expectN}) hash=${s.hash}`, opts.repro);
  check(step + ' · clip == slide mapping', s.clip === ec, `bar clip ${s.clip} vs expected ${ec} for slide ${expectN} (${w.ms} ms)`, opts.repro);
  if (opts.expectPlaying) {
    const p = await waitFor(page, (x) => x.paused === false && x.audioSrc === clipFile(ec), Math.max(0, 1000 - (Date.now() - t0)) + 50);
    const log = await mediaLog(page, from); const playing = log.filter((e) => e.ev === 'playing' && e.src === clipFile(ec)); const rej = log.filter((e) => e.ev === 'play-rejected');
    check(step + ' · audio playing ≤1 s', p.ok && !rej.length, `paused=${p.s.paused} src=${p.s.audioSrc} ct=${p.s.ct} playingEvents=${playing.length} rejected=${rej.map((r) => r.name).join(',') || 'none'} (${Date.now() - t0} ms)`, opts.repro);
    const q = await waitFor(page, (x) => x.cueI != null && covers(ec, x.cueI, expectN), 1200);
    check(step + ' · active cue narrates visible slide', q.ok, `cue #${q.s.cueI} (slide ${q.s.cueSlide}) vs visible ${expectN}; audio ${q.s.ct}s; expected first cue #${(firstCueFor(ec, expectN) || {}).i}`, opts.repro);
    if (p.ok) { await sleep(120); const c1 = (await state(page)).ct; await sleep(350); const c2 = (await state(page)).ct; check(step + ' · audio progressing', c2 > c1, `currentTime ${c1} → ${c2}`, opts.repro); }
    const s2 = await state(page);
    check(step + ' · CC caption == active cue text', !s2.caption || (s2.cueText && s2.caption.trim() === s2.cueText.trim()), `caption="${(s2.caption || '').slice(0, 50)}" cue="${(s2.cueText || '').slice(0, 50)}"`, opts.repro);
    const hlSlide = (clips[ec].cues.find((x) => x.i === s2.cueI) || {}).slide;
    check(step + ' · transcript highlight == on-screen slide', s2.txSlide != null && Number(s2.txSlide) === hlSlide && covers(ec, s2.cueI, expectN), `highlighted sentence slide=${s2.txSlide} cue=#${s2.cueI} (slide ${hlSlide}) visible=${expectN} transcript chars=${s2.txLen}`, opts.repro);
  }
  return s;
}

async function openDeck(ctx, url, { skipIntro = true } = {}) {
  const page = await ctx.newPage(); page.on('pageerror', (e) => check('page error', false, String(e).slice(0, 160)));
  await page.goto(url, { waitUntil: 'load' }); await page.waitForSelector('#root section.slide.is-active, .intro-gate', { state: 'attached', timeout: 15000 }); await sleep(600);
  if (skipIntro && await page.$('.intro-gate')) { await page.keyboard.press('Escape'); await page.waitForSelector('.intro-gate', { state: 'detached', timeout: 5000 }).catch(() => {}); await sleep(400); }
  await page.waitForSelector('#athar-narration', { state: 'attached', timeout: 10000 }); await sleep(300);
  return page;
}
async function startGuide(page) { await page.click('[data-testid=guide-toggle]'); }
async function shot(page, name) { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png') }).catch(() => {}); }

/* ---------- scenarios ---------- */
const S = {};
S[1] = async (ctx) => { scenario = 'S1 AUTO end-to-end'; const page = await openDeck(ctx, BASE + '/#/1');
  const s0 = await state(page); check('intro skipped, slide 1, guide idle', s0.n === 1 && !s0.intro && s0.narrating === 'false', `n=${s0.n} intro=${s0.intro} narrating=${s0.narrating}`);
  await startGuide(page); await assertSlide(page, 'start guide on slide 1', 1, { expectPlaying: true, repro: 'load /#/1, Esc the intro, click Guide' });
  await shot(page, 's1-start');
  let last = 1, lastClip = expectedClip(1), t0 = Date.now(), changes = 0, badOrder = 0, order = [];
  const budget = FAST ? 170000 : 420000;
  while (Date.now() - t0 < budget) {
    const s = await state(page);
    if (s.n !== last) {
      changes++; const log = await mediaLog(page, 0); const ec = expectedClip(s.n);
      if (ec !== lastClip) { /* a section hand-over must follow the previous clip's ended */ const endedPrev = log.filter((e) => e.ev === 'ended' && e.src === clipFile(lastClip)).length > 0; if (!endedPrev) badOrder++; order.push(`${last}→${s.n} ${lastClip}→${ec} endedBefore=${endedPrev}`); }
      await assertSlide(page, `AUTO advanced ${last}→${s.n}`, s.n, { expectPlaying: s.n < 39 || !(await state(page)).ended, repro: 'AUTO on, let the narration run' });
      last = s.n; lastClip = ec;
    }
    if (s.n === 39 && s.ended) break;
    await sleep(120);
  }
  const sEnd = await state(page);
  check('reached slide 39 and the last clip ended', sEnd.n === 39 && sEnd.ended === true, `n=${sEnd.n} ended=${sEnd.ended} changes=${changes} in ${Math.round((Date.now() - t0) / 1000)} s (playbackRate ${FAST || 1}×)`);
  check('every section hand-over waited for the clip to end', badOrder === 0, order.join('; '));
  await shot(page, 's1-end'); await page.close(); };

S[2] = async (ctx) => { scenario = 'S2 keyboard mid-play + rapid skip'; const page = await openDeck(ctx, BASE + '/#/1'); await startGuide(page); await assertSlide(page, 'guide on slide 1', 1, { expectPlaying: true });
  await page.keyboard.press('ArrowRight'); await assertSlide(page, 'ArrowRight 1→2 (new clip)', 2, { expectPlaying: true, repro: 'narrating on slide 1, press ArrowRight' });
  await page.keyboard.press('ArrowRight'); await assertSlide(page, 'ArrowRight 2→3 (same clip, other sentence)', 3, { expectPlaying: true, repro: 'press ArrowRight again' });
  for (let i = 0; i < 5; i++) { await page.keyboard.press('ArrowRight'); await sleep(60); }
  await assertSlide(page, 'rapid ArrowRight ×5 → 8', 8, { expectPlaying: true, repro: 'press ArrowRight 5× within 300 ms' });
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await assertSlide(page, 'ArrowLeft ×2 → 6', 6, { expectPlaying: true, repro: 'press ArrowLeft twice' });
  for (let i = 0; i < 7; i++) { await page.keyboard.press('ArrowRight'); await sleep(40); }
  await assertSlide(page, 'rapid ArrowRight ×7 across sections → 13', 13, { expectPlaying: true, repro: 'from slide 6 press ArrowRight 7× fast (crosses into section 03)' });
  await page.keyboard.press('End'); await assertSlide(page, 'End → 39', 39, { expectPlaying: true, repro: 'press End' });
  await page.keyboard.press('Home'); await assertSlide(page, 'Home → 1', 1, { expectPlaying: true, repro: 'press Home' });
  for (let i = 0; i < 27; i++) { await page.keyboard.press('ArrowRight'); await sleep(35); }
  await assertSlide(page, 'rapid ArrowRight ×27 → 28 (virtual slides)', 28, { expectPlaying: true, repro: 'from slide 1 press ArrowRight 27× fast' });
  for (let i = 0; i < 10; i++) { await page.keyboard.press('ArrowRight'); await sleep(35); }
  await assertSlide(page, 'rapid ArrowRight ×10 → 38', 38, { expectPlaying: true, repro: 'press ArrowRight 10× fast through the virtual slides' });
  await shot(page, 's2-slide38'); await page.close(); };

S[3] = async (ctx) => { scenario = 'S3 N shortcut'; const page = await openDeck(ctx, BASE + '/#/5'); await page.keyboard.press('n'); await assertSlide(page, 'N starts narration on slide 5', 5, { expectPlaying: true, repro: 'load /#/5, press N' });
  const sb = await state(page); await page.keyboard.press('n'); const w = await waitFor(page, (s) => s.paused === true && s.narrating === 'false', 1200); check('N pauses narration', w.ok, `paused=${w.s.paused} narrating=${w.s.narrating} (was on slide ${sb.n})`, 'press N while narrating');
  const nowN = w.s.n;
  await page.keyboard.press('ArrowRight'); await sleep(500); const s1 = await state(page); const en = Math.min(39, nowN + 1); check('paused + ArrowRight: caption/transcript follow the slide without audio', s1.n === en && s1.clip === expectedClip(en) && s1.paused === true && (s1.txSlide != null ? covers(expectedClip(en), s1.cueI, en) : false), `n=${s1.n} (expected ${en}) clip=${s1.clip} paused=${s1.paused} cue=#${s1.cueI} (slide ${s1.cueSlide}) highlight slide=${s1.txSlide}`, 'press N (pause), then ArrowRight: the transcript highlight/CC must move to the new slide while paused');
  await page.keyboard.press('n'); await assertSlide(page, 'N resumes at the sentence of the slide on screen (' + en + ')', en, { expectPlaying: true, repro: 'press N again' });
  await page.close(); };

S[4] = async (ctx) => { scenario = 'S4 Esc overview + deep links + ?intro=1'; const page = await openDeck(ctx, BASE + '/#/2'); await startGuide(page); await assertSlide(page, 'guide on slide 2', 2, { expectPlaying: true });
  await page.keyboard.press('Escape'); const ov = await page.waitForSelector('.overview, [data-testid=overview]', { timeout: 3000 }).catch(() => null); check('Esc opens the overview', !!ov, ov ? 'overview dialog visible' : 'no .overview after Escape', 'press Escape');
  if (ov) { const tiles = await page.$$('.overview-grid button'); check('overview grid has tiles', tiles.length >= 28, `${tiles.length} tiles`); if (tiles[6]) { await tiles[6].click(); await assertSlide(page, 'overview tile → slide 7', 7, { expectPlaying: true, repro: 'Esc, click the 7th overview tile' }); } }
  await page.evaluate(() => { location.hash = '#/20'; }); await assertSlide(page, 'in-page hash #/20', 20, { expectPlaying: true, repro: 'set location.hash = "#/20" while narrating' });
  await page.evaluate(() => { location.hash = '#/27/new-4'; }); await assertSlide(page, 'in-page hash #/27/new-4 → 31', 31, { expectPlaying: true, repro: 'set location.hash = "#/27/new-4"' });
  await page.evaluate(() => { location.hash = '#slide-07'; }); await sleep(700); const sa = await state(page); check('#slide-07 alias deep link → slide 7', sa.n === 7 && sa.clip === expectedClip(7), `n=${sa.n} clip=${sa.clip} hash=${sa.hash}`, 'set location.hash = "#slide-07"');
  await page.goto(BASE + '/#/25', { waitUntil: 'load' }); await page.waitForSelector('#athar-narration', { state: 'attached' }); await sleep(500); const sr = await state(page); check('full reload on #/25 bypasses the intro and maps clip', sr.n === 25 && !sr.intro && sr.clip === expectedClip(25), `n=${sr.n} intro=${sr.intro} clip=${sr.clip}`, 'reload the page on #/25');
  await page.goto(BASE + '/?intro=1#/3', { waitUntil: 'load' }); await sleep(900); const si = await state(page); check('?intro=1 forces the intro film', si.intro === true, `intro=${si.intro}`, 'open /?intro=1#/3');
  const ml = await mediaLog(page, 0); const guidePlayed = ml.filter((e) => e.ev === 'play()' && /guide-/.test(e.src)).length; check('no guide narration plays during the intro film', guidePlayed === 0, `guide play() calls during intro: ${guidePlayed}`, 'open /?intro=1 and wait 1 s');
  await page.keyboard.press('Escape'); await page.waitForSelector('.intro-gate', { state: 'detached', timeout: 5000 }).catch(() => {}); await sleep(500); const sj = await state(page); check('after the intro the deck is on slide 1 with NAR-00 mapped', sj.n === 1 && sj.clip === 'NAR-00', `n=${sj.n} clip=${sj.clip}`, 'Esc the forced intro');
  await page.close(); };

S[5] = async (ctx) => { scenario = 'S5 slide-38 country tabs'; const page = await openDeck(ctx, BASE + '/#/27/new-11'); await startGuide(page); await assertSlide(page, 'guide on slide 38', 38, { expectPlaying: true });
  const anchorOf = { lb: 's38-c2', in: 's38-c3', ke: 's38-c4' }; const tabCue = {}; Object.keys(anchorOf).forEach((k) => { tabCue[k] = (clips['NAR-08'].cues.find((x) => x.anchor === anchorOf[k]) || {}).i; });
  for (const k of ['in', 'ke', 'lb']) { await page.click('#s-aos-nations .aos-country[data-country=' + k + ']'); const w = await waitFor(page, (s) => s.cueI === tabCue[k] && s.n === 38, 1500); const on = await page.$eval('#s-aos-nations .aos-country[data-country=' + k + ']', (b) => b.getAttribute('aria-selected')); check(`tab ${k} → narration seeks to its sentence (cue #${tabCue[k]})`, w.ok && on === 'true', `cue=#${w.s.cueI} audio=${w.s.ct}s tab aria-selected=${on} paused=${w.s.paused}`, `on slide 38 while narrating, click the ${k.toUpperCase()} tab`); await sleep(300); }
  await shot(page, 's5-tabs'); await page.close(); };

S[6] = async (ctx) => { scenario = 'S6 Replay intro and return'; const page = await openDeck(ctx, BASE + '/#/4'); await startGuide(page); await assertSlide(page, 'guide on slide 4', 4, { expectPlaying: true });
  const before = await state(page); const from = before.mediaN; await page.click('footer.pagefooter .intro-replay'); const g = await page.waitForSelector('.intro-gate', { timeout: 4000 }).catch(() => null); check('Replay intro opens the intro film', !!g, g ? 'intro-gate shown' : 'no intro-gate', 'click Replay intro in the footer');
  await sleep(1200); const log = await mediaLog(page, from); const s1 = await state(page); const guidePlaying = s1.audioSrc && /guide-|intro-narration/.test(s1.audioSrc) && s1.paused === false;
  check('guide/narration is silent while the intro film plays', !guidePlaying && !log.some((e) => e.ev === 'play()' && /intro-narration|guide-/.test(e.src)), `audio=${s1.audioSrc} paused=${s1.paused} play() calls=${log.filter((e) => e.ev === 'play()').map((e) => e.src).join(',')}`, 'click Replay intro while narrating');
  await page.keyboard.press('Escape'); await page.waitForSelector('.intro-gate', { state: 'detached', timeout: 5000 }).catch(() => {}); await sleep(400);
  await assertSlide(page, 'after the replayed intro the guide narrates the slide it returned to (' + before.n + ')', before.n, { expectPlaying: true, repro: 'Replay intro → Esc (the deck returns to the slide it was on)' });
  await page.close(); };

S[7] = async (ctx) => { scenario = 'S7 tab hidden/visible + audio-focus loss'; const page = await openDeck(ctx, BASE + '/#/13'); await startGuide(page); await assertSlide(page, 'guide on slide 13', 13, { expectPlaying: true });
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await sleep(400);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await assertSlide(page, 'visible again after 2 hidden slide changes → narrates slide 15', 15, { expectPlaying: true, repro: 'hide the tab (visibilitychange), press ArrowRight ×2, show the tab' });
  /* audio-focus loss: the OS/another app pauses the element without the user pressing pause */
  await page.evaluate(() => { (window.__audioEls || []).forEach((a) => { if (!a.paused) a.pause(); }); });
  await sleep(300); const sp = await state(page); check('external pause recorded', sp.paused === true, `paused=${sp.paused}`);
  await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); });
  const w = await waitFor(page, (s) => s.paused === false, 1500); check('narration resumes after focus regain (audio-focus loss)', w.ok, `paused=${w.s.paused} after ${w.ms} ms`, 'pause the <audio> element externally, then dispatch focus/visibilitychange');
  await page.close(); };

S[8] = async (browser) => { scenario = 'S8 phone 390×844'; const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await ctx.addInitScript(initScript);
  const page = await openDeck(ctx, BASE + '/#/2'); await startGuide(page); await assertSlide(page, 'phone: guide on slide 2', 2, { expectPlaying: true });
  const nx = await page.$('[data-testid=nar-next]'); const box = nx ? await nx.boundingBox() : null; check('phone: bar next button visible and ≥44 px', !!box && box.width >= 44 && box.height >= 44, box ? `${Math.round(box.width)}×${Math.round(box.height)}` : 'missing');
  await page.click('[data-testid=nar-next]'); await assertSlide(page, 'phone: bar next → 3', 3, { expectPlaying: true, repro: 'phone viewport, tap the bar next button' });
  await page.click('[data-testid=nar-next]'); await assertSlide(page, 'phone: bar next → 4 (new clip)', 4, { expectPlaying: true });
  await page.click('[data-testid=nar-prev]'); await assertSlide(page, 'phone: bar prev → 3', 3, { expectPlaying: true });
  const ov = await page.evaluate(() => { const r = document.querySelector('#athar-narration').getBoundingClientRect(); return { right: Math.round(r.right), w: innerWidth, sw: document.documentElement.scrollWidth }; }); check('phone: bar fits the viewport (no horizontal overflow)', ov.right <= ov.w && ov.sw <= ov.w, JSON.stringify(ov));
  await shot(page, 's8-phone'); await page.close(); await ctx.close(); };

S[9] = async (ctx) => { scenario = 'S9 Arabic / RTL'; const page = await openDeck(ctx, BASE + '/#/2'); await page.click('[data-testid=lang-toggle]'); await sleep(700); const sl = await state(page); check('lang toggle → ar/rtl', sl.lang === 'ar' && sl.dir === 'rtl', `lang=${sl.lang} dir=${sl.dir}`);
  await startGuide(page); await assertSlide(page, 'RTL: guide on slide 2', 2, { expectPlaying: true, repro: 'switch to Arabic, click the Guide button' });
  await page.keyboard.press('ArrowLeft'); await assertSlide(page, 'RTL: ArrowLeft = next → 3', 3, { expectPlaying: true, repro: 'in Arabic press ArrowLeft' });
  for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowLeft'); await sleep(50); } await assertSlide(page, 'RTL: rapid ArrowLeft ×4 → 7', 7, { expectPlaying: true });
  await page.keyboard.press('ArrowRight'); await assertSlide(page, 'RTL: ArrowRight = previous → 6', 6, { expectPlaying: true });
  const t = await page.$eval('#athar-narration', (b) => ({ dir: b.dir, title: (b.querySelector('.gbar-title') || {}).textContent, live: !!b.querySelector('[aria-live]') })); check('RTL: bar is dir=rtl and shows the Arabic status text', t.dir === 'rtl' && /الشريحة|يروي|السرد/.test(t.title || ''), JSON.stringify(t));
  await shot(page, 's9-rtl'); await page.close(); };

S[10] = async (browser) => { scenario = 'S10 autoplay policy / persisted narration-on'; const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); await ctx.addInitScript(initScript);
  await ctx.addInitScript(() => { try { localStorage.setItem('athar-narration-prefs-v2', JSON.stringify({ autoplay: true, captions: true, transcript: false, muted: false, volume: 0.9, on: true })); localStorage.setItem('athar-narration-prefs-v3', JSON.stringify({ autoplay: true, captions: true, transcript: false, muted: false, volume: 0.9, on: true })); } catch (e) {} });
  const page = await openDeck(ctx, BASE + '/#/5', { skipIntro: false }); await sleep(1500); const s0 = await state(page); const ml = await mediaLog(page, 0);
  const rejected = ml.filter((e) => e.ev === 'play-rejected'); const blockedUi = s0.blocked === 'true' || /tap|start|blocked|اضغط/i.test(s0.title || '');
  check('reload with narration-on persisted: no audio before a gesture (autoplay policy respected)', s0.paused !== false, `paused=${s0.paused} play-rejected=${rejected.map((r) => r.name).join(',') || 'none'}`, 'persist narration-on, reload /#/5 without touching the page');
  check('blocked state is surfaced in the Guide bar ("tap to start")', blockedUi, `data-blocked=${s0.blocked} title="${(s0.title || '').slice(0, 80)}"`, 'persist narration-on, reload /#/5, look at the Guide bar before any click');
  await page.mouse.click(700, 300); await assertSlide(page, 'first click unlocks and narration starts on the visible slide (5)', 5, { expectPlaying: true, repro: 'click anywhere on the slide after the blocked state' });
  await page.close(); await ctx.close(); };

/* ---------- run ---------- */
const started = ts();
const browser = await chromium.launch({ args: HEADFUL_ARGS });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); await ctx.addInitScript(initScript);
const wall = setTimeout(() => { console.error('wall-clock cap hit'); process.exit(3); }, 15 * 60 * 1000);
try {
  for (const k of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) { if (ONLY && !ONLY.includes(k)) continue; try { if (k === 8 || k === 10) await S[k](browser); else await S[k](ctx); } catch (e) { check('scenario crashed', false, String(e).split('\n')[0].slice(0, 200)); } }
} finally { clearTimeout(wall); await browser.close().catch(() => {}); }
const finished = ts(); const pass = rows.filter((r) => r.ok).length, fail = rows.length - pass;
const md = [];
md.push(`\n## Run \`${LABEL}\` — ${started} → ${finished}`, '', `Base URL ${BASE} · Chromium (Playwright) · playbackRate ${FAST || 1}× for the AUTO end-to-end scenario · checks: **${pass} pass / ${fail} fail** of ${rows.length}`, '', '| UTC | scenario | check | result | detail |', '|---|---|---|---|---|');
for (const r of rows) md.push(`| ${r.t} | ${r.scenario} | ${r.step} | ${r.ok ? 'PASS' : '**FAIL**'} | ${r.detail.replace(/\|/g, '\\|').slice(0, 220)} |`);
if (defects.length) { md.push('', `### Mismatches recorded in run \`${LABEL}\` (${defects.length})`, ''); defects.forEach((d, i) => md.push(`${i + 1}. **${d.scenario} — ${d.step}** (${d.t})  \n   repro: ${d.repro || 'see scenario'}  \n   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  \n   actual: ${d.detail.slice(0, 300)}`)); }
fs.mkdirSync(path.dirname(LOG), { recursive: true });
if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, `# Guide narration QA log — Athar Open Agentic Pact deck\n\nScripted checks (Playwright + headless Chromium) across the intro and all 39 slides. Every slide change asserts: clip/cue == slide per the NAR-xx map; <audio> playing within 1 s after the unlock gesture; CC caption + transcript highlight match the slide on screen; AUTO advances only after the clip for the visible slide ended.\n`);
fs.appendFileSync(LOG, md.join('\n') + '\n');
fs.writeFileSync(LOG.replace(/\.md$/, `-${LABEL}.json`), JSON.stringify({ label: LABEL, started, finished, pass, fail, rows, defects }, null, 1));
console.log(`\n${LABEL}: ${pass} pass / ${fail} fail → ${LOG}`);
process.exit(fail ? 1 : 0);
