// Shared fresh-state headless Chromium harness (playwright-core + system Chromium, new user-data-dir, cache disabled)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
export const BASE = process.env.QC_BASE || 'http://127.0.0.1:4177';
export const OUT = process.env.QC_OUT || '/tmp/verify147';
export const TOTAL = 39;
export const utc = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
export function slideHash(n) { if (n <= 27) return `#/${String(n).padStart(2, '0')}`; if (n <= 38) return `#/27/new-${n - 27}`; return `#/28`; }
export function slideUrl(n, lang, base) { return `${base || BASE}/?lang=${lang}${slideHash(n)}`; }
export async function launch(opts = {}) {
  const userDataDir = fs.mkdtempSync('/tmp/qc-udd-');
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    executablePath: '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--force-device-scale-factor=1', '--hide-scrollbars'],
    viewport: opts.viewport || { width: 1920, height: 1080 }, deviceScaleFactor: 1, isMobile: !!opts.isMobile, hasTouch: !!opts.isMobile,
    locale: opts.locale || 'en-US', ignoreHTTPSErrors: true, serviceWorkers: 'block', reducedMotion: opts.reducedMotion || 'no-preference',
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  return { ctx, page, cdp, userDataDir };
}
export async function skipIntro(page) {
  try {
    const open = async () => page.evaluate(() => !!(window.AtharIntro && window.AtharIntro.isOpen && window.AtharIntro.isOpen()) || document.documentElement.classList.contains('intro-open') || !!document.querySelector('[role="dialog"][aria-modal="true"] video'));
    if (!(await open())) return false;
    const btn = page.locator('button.intro-skip, button:has-text("Skip intro"), button:has-text("تخطي المقدمة")').first();
    if (await btn.count()) { await btn.click({ timeout: 2000 }).catch(() => {}); }
    for (let i = 0; i < 20 && (await open()); i++) { await page.waitForTimeout(150); if (i === 8) await page.evaluate(() => { try { window.AtharIntro && window.AtharIntro.skip && window.AtharIntro.skip(); } catch (e) {} }); }
    await page.waitForTimeout(300); return !(await open());
  } catch (e) { return false; }
}
export async function gotoSlide(page, n, lang, settle = 700, base) {
  await page.goto(slideUrl(n, lang, base), { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(settle);
  if (n === 1) await skipIntro(page);
  await page.waitForFunction(() => document.fonts ? document.fonts.status === 'loaded' : true, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(200);
}
export function writeJson(p, obj) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(obj, null, 1)); }
