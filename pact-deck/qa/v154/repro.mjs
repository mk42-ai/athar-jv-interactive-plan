// Reproduction harness — runs the same scenarios against any build. Usage: node repro.mjs <baseUrl> <label> [outDir]
// Writes <outDir>/<label>/events.jsonl (every logged event, ISO timestamps), marks.json (state at each checkpoint),
// trace-desktop.zip / trace-phone.zip (Playwright traces) and screenshots/*.png.
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, boot, gotoHash, waitVisible, startGuide, setAuto, overviewJump, visible, audible, events, mark, writeJSON, iso, hashFor, HERE } from './lib.mjs';
const [base, label, outRoot] = process.argv.slice(2);
const OUT = path.resolve(outRoot || HERE, label); fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true });
const ALL = []; const MARKS = []; const CONSOLE = [];
const PREFS_ON = { 'athar-narration-prefs-v2': JSON.stringify({ on: true, autoplay: true, captions: true }), 'athar-guide-prefs-v3': JSON.stringify({ on: true, auto: true, captions: true }) };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function snap(page, name) { try { await page.screenshot({ path: path.join(OUT, 'screenshots', name + '.png'), timeout: 15000 }); } catch (e) { console.log('screenshot failed', name, e.message); } }
async function check(page, scenario, step, expect) {
  const st = await page.evaluate(() => ({ vis: window.__qaVisible(), audio: window.__qaAudible(), cc: (document.querySelector('[data-testid="nar-caption"]') || {}).textContent || '', guide: (() => { const r = document.getElementById('athar-narration'); return r ? { state: r.getAttribute('data-state') || r.getAttribute('data-audio'), clip: r.getAttribute('data-clip'), slideId: r.getAttribute('data-slide-id'), blocked: r.getAttribute('data-blocked') || (r.getAttribute('data-state') === 'blocked' ? 'true' : 'false'), status: ((r.querySelector('[data-testid="nar-status"]') || {}).textContent || '').trim(), tap: !!document.querySelector('[data-testid="guide-tap-to-play"]:not([hidden])') } : null; })() }));
  const row = { t: iso(), scenario, step, expect, ...st }; MARKS.push(row); await mark(page, 'check', { scenario, step, expect });
  console.log(row.t, scenario.padEnd(22), String(step).padEnd(34), 'vis', st.vis.n, st.vis.id, '| audio', st.audio ? st.audio.clip + '@' + st.audio.t : '-', '| state', st.guide && st.guide.state, '| cc', (st.cc || '').slice(0, 50));
  return row;
}
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
async function run(name, opts, fn) {
  if (ONLY.length && !ONLY.some((o) => name.startsWith(o))) return;
  const MK0 = MARKS.length, EV0 = ALL.length, C0 = CONSOLE.length;
  const browser = await launch(); const t0 = iso();
  const { ctx, page } = await newPage(browser, opts);
  try { await ctx.tracing.start({ screenshots: true, snapshots: false, title: label + ' ' + name }); } catch (e) {}
  try { await fn(page, ctx); }
  catch (e) { console.log('SCENARIO ERROR', name, e.message); MARKS.push({ t: iso(), scenario: name, step: 'ERROR', error: e.message }); }
  finally {
    try { const ev = await events(page); ev.forEach((x) => ALL.push({ scenario: name, ...x })); } catch (e) {}
    page.__console.forEach((c) => CONSOLE.push({ scenario: name, ...c }));
    try { await ctx.tracing.stop({ path: path.join(OUT, 'traces', name + '.zip') }); } catch (e) {}
    await browser.close();
    fs.mkdirSync(path.join(OUT, 'parts'), { recursive: true });
    writeJSON(path.join(OUT, 'parts', name + '.json'), { marks: MARKS.slice(MK0), events: ALL.slice(EV0), console: CONSOLE.slice(C0) });
  }
  console.log('—', name, t0, '→', iso());
}
const D = { viewport: { width: 1728, height: 872 } };
const PH = { viewport: { width: 390, height: 844 }, mobile: true };
fs.mkdirSync(path.join(OUT, 'traces'), { recursive: true });

await run('S01-first-load-blocked', { ...D, storage: PREFS_ON }, async (page) => {
  await boot(page, base, 5); await sleep(3000);
  await check(page, 'S01-first-load-blocked', 'no gesture: 3 s after load', 5); await snap(page, 'S01-desktop-first-load-no-gesture');
  await page.mouse.click(600, 300); await sleep(2500);
  await check(page, 'S01-first-load-blocked', 'first click on the slide', 5); await snap(page, 'S01-desktop-after-first-click');
});
await run('S02-arrows-auto-off', D, async (page) => {
  await boot(page, base, 1); await setAuto(page, false); await startGuide(page); await sleep(2000);
  await check(page, 'S02-arrows-auto-off', 'guide started on 1', 1);
  for (let n = 2; n <= 5; n++) { await page.keyboard.press('ArrowRight'); await sleep(1600); await check(page, 'S02-arrows-auto-off', 'ArrowRight → ' + n, n); }
  for (let n = 4; n >= 3; n--) { await page.keyboard.press('ArrowLeft'); await sleep(1600); await check(page, 'S02-arrows-auto-off', 'ArrowLeft → ' + n, n); }
  await snap(page, 'S02-desktop-arrows');
});
await run('S03-rapid-and-random', D, async (page) => {
  await boot(page, base, 2); await setAuto(page, false); await startGuide(page); await sleep(1500);
  await check(page, 'S03-rapid-and-random', 'guide started on 2', 2);
  const t0 = Date.now(); for (let i = 0; i < 6; i++) { await page.keyboard.press('ArrowRight'); } const burst = Date.now() - t0;
  await mark(page, 'rapid-burst', { presses: 6, ms: burst });
  await sleep(3500); await check(page, 'S03-rapid-and-random', '6× ArrowRight in ' + burst + ' ms → 8', 8); await snap(page, 'S03-desktop-after-rapid-6');
  for (const [n, gap] of [[13, 120], [30, 90], [21, 150], [39, 80], [17, 0]]) { await gotoHash(page, n); if (gap) await sleep(gap); }
  await sleep(3500); await check(page, 'S03-rapid-and-random', 'random jumps 13→30→21→39→17', 17); await snap(page, 'S03-desktop-after-random-jumps');
  for (const n of [34, 9, 38, 1, 26]) { await gotoHash(page, n); await sleep(70); }
  await sleep(3500); await check(page, 'S03-rapid-and-random', 'random jumps 34→9→38→1→26', 26);
});
await run('S04-esc-overview', D, async (page) => {
  await boot(page, base, 3); await setAuto(page, false); await startGuide(page); await sleep(1500);
  await check(page, 'S04-esc-overview', 'guide started on 3', 3);
  await overviewJump(page, 21); await sleep(2500); await check(page, 'S04-esc-overview', 'Esc → tile 21', 21);
  await overviewJump(page, 36); await sleep(2500); await check(page, 'S04-esc-overview', 'Esc → tile 36', 36); await snap(page, 'S04-desktop-esc-36');
  await overviewJump(page, 12); await sleep(2500); await check(page, 'S04-esc-overview', 'Esc → tile 12', 12);
});
await run('S05-home-end', D, async (page) => {
  await boot(page, base, 10); await setAuto(page, false); await startGuide(page); await sleep(1500);
  await check(page, 'S05-home-end', 'guide started on 10', 10);
  await page.keyboard.press('End'); await sleep(2500); await check(page, 'S05-home-end', 'End → 39', 39);
  await page.keyboard.press('Home'); await sleep(2500); await check(page, 'S05-home-end', 'Home → 1', 1);
});
await run('S06-deep-links', D, async (page) => {
  await boot(page, base, 23); await setAuto(page, false); await startGuide(page); await sleep(2500);
  await check(page, 'S06-deep-links', 'loaded #/23 + guide', 23);
  await page.evaluate(() => { location.hash = '#/27/new-8'; }); await sleep(2500); await check(page, 'S06-deep-links', 'hash #/27/new-8 → 35', 35);
  await page.evaluate(() => { location.hash = '#slide-07'; }); await sleep(2500); await check(page, 'S06-deep-links', 'hash #slide-07 → 7', 7); await snap(page, 'S06-desktop-deeplink-7');
});
await run('S07-auto-on', { ...D, rate: 4 }, async (page) => {
  await boot(page, base, 26); await setAuto(page, true); await startGuide(page); await sleep(1500);
  await check(page, 'S07-auto-on', 'guide started on 26 (AUTO on, 4×)', 26);
  for (let i = 1; i <= 6; i++) { await sleep(2000); await check(page, 'S07-auto-on', 'AUTO +' + (i * 2) + ' s', null); }
});
await run('S08-auto-off', { ...D, rate: 4 }, async (page) => {
  await boot(page, base, 26); await setAuto(page, false); await startGuide(page); await sleep(1500);
  await check(page, 'S08-auto-off', 'guide started on 26 (AUTO off, 4×)', 26);
  for (let i = 1; i <= 4; i++) { await sleep(2000); await check(page, 'S08-auto-off', 'AUTO off +' + (i * 2) + ' s', 26); }
});
await run('S09-slide38-tabs', D, async (page) => {
  await boot(page, base, 38); await setAuto(page, false); await startGuide(page); await sleep(1500);
  await check(page, 'S09-slide38-tabs', 'guide started on 38', 38);
  const tab = async (c) => page.click('#s-aos-nations .aos-country[data-country="' + c + '"]');
  await tab('in'); await sleep(1200); await check(page, 'S09-slide38-tabs', 'tab India', 38);
  await tab('ke'); await sleep(300); await tab('lb'); await sleep(300); await tab('in'); await sleep(3000);
  await check(page, 'S09-slide38-tabs', 'tabs Kenya→Lebanon→India (300 ms)', 38); await snap(page, 'S09-desktop-slide38-tabs');
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.keyboard.press('ArrowRight'); await sleep(2500); await check(page, 'S09-slide38-tabs', 'blur tab, ArrowRight → 39', 39);
});
await run('S10-sweep-desktop', D, async (page) => {
  await boot(page, base, 1); await setAuto(page, false); await startGuide(page); await sleep(1500);
  for (let n = 1; n <= 39; n++) { if (n > 1) { await page.keyboard.press('ArrowRight'); await sleep(1300); } await check(page, 'S10-sweep-desktop', 'slide ' + n, n); }
});
await run('S11-sweep-phone', PH, async (page) => {
  await boot(page, base, 1); await setAuto(page, false); await page.tap('[data-testid="guide-toggle"]'); await sleep(1500);
  for (let n = 1; n <= 39; n++) { if (n > 1) { await page.keyboard.press('ArrowRight'); await sleep(1100); } await check(page, 'S11-sweep-phone', 'slide ' + n, n); if (n === 13) await snap(page, 'S11-phone-slide13'); }
});
await run('S12-phone-rapid-blocked', { ...PH, storage: PREFS_ON }, async (page) => {
  await boot(page, base, 4); await sleep(2500); await check(page, 'S12-phone-rapid-blocked', 'phone first load, no gesture', 4); await snap(page, 'S12-phone-first-load-no-gesture');
  await page.tap('[data-testid="nar-next"]'); await sleep(2000); await check(page, 'S12-phone-rapid-blocked', 'tap bar next → 5', 5);
  for (let i = 0; i < 6; i++) { await page.tap('[data-testid="nar-next"]'); await sleep(45); }
  await sleep(3500); await check(page, 'S12-phone-rapid-blocked', '6× bar next (≈270 ms) → 11', 11); await snap(page, 'S12-phone-after-rapid');
});
// merge every per-scenario part (so a partial re-run replaces only its own scenarios)
const parts = fs.readdirSync(path.join(OUT, 'parts')).filter((f) => f.endsWith('.json')).sort();
const M = [], E = [], C = [];
for (const f of parts) { const j = JSON.parse(fs.readFileSync(path.join(OUT, 'parts', f), 'utf8')); M.push(...j.marks); E.push(...j.events); C.push(...j.console); }
fs.writeFileSync(path.join(OUT, 'events.jsonl'), E.map((e) => JSON.stringify(e)).join('\n') + '\n');
writeJSON(path.join(OUT, 'marks.json'), { label, base, finished: iso(), scenarios: parts.map((f) => f.replace('.json', '')), marks: M, console: C });
console.log('events', E.length, 'marks', M.length, 'console errors', C.length, '→', OUT);
