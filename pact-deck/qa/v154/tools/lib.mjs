import { chromium } from '/tmp/terminal-work/work/6692b763e851d28a036ab30e/6abc5d318c19ce74d2a7dbc8/athar-jv-interactive-plan/pact-deck/node_modules/@playwright/test/index.mjs';
export const MARKER = process.env.ATHAR_QA_MARKER || 'adhoc';
export async function launch(extra = []) {
  return chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required', `--athar-qa-marker=${MARKER}`, ...extra] });
}
export function route(n) { if (n <= 27) return '#/' + String(n).padStart(2, '0'); if (n === 39) return '#/28'; return '#/27/new-' + (n - 27); }
export const ts = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/* in-page: current slide number exactly as narration.js computes it */
export const curNFn = () => { try { if (window.AtharImpactTiers && typeof window.AtharImpactTiers.current === 'function') { const c = window.AtharImpactTiers.current(); if (c) return c; } } catch (e) {} const a = document.querySelector('#root section.slide.is-active:not(.it-slide)'); const n = a ? parseInt(a.getAttribute('data-n'), 10) : 0; return n === 28 ? 39 : (n || 0); };
export async function newDeckPage(browser, { lang = 'en', viewport = '1440x900', colorScheme = 'light', skipIntro = true, init = '' } = {}) {
  const [w, h] = viewport.split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme, locale: lang === 'ar' ? 'ar' : 'en-GB' });
  if (skipIntro) await ctx.addInitScript(() => { try { sessionStorage.setItem('athar-intro-v1.4.2', 'done'); } catch (e) {} });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  page.__errors = []; page.on('pageerror', (e) => page.__errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') page.__errors.push('console: ' + m.text()); });
  return { ctx, page };
}
export async function gotoSlide(page, base, lang, n, { reload = false } = {}) {
  const url = `${base}/?lang=${lang}${route(n)}`;
  if (reload || !page.url().startsWith(base)) { await page.goto(url, { waitUntil: 'load' }); }
  else { await page.evaluate((h) => { location.hash = h; }, route(n)); }
  const t0 = Date.now();
  while (Date.now() - t0 < 8000) { const c = await page.evaluate(curNFn).catch(() => 0); if (c === n) break; await sleep(100); }
  await sleep(450);
  return page.evaluate(curNFn);
}
