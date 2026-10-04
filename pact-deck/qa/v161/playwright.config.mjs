// Playwright Test config for the v1.6.1 suite — system Chromium, default autoplay policy stated explicitly.
import { defineConfig } from '../../node_modules/@playwright/test/index.mjs';
const launchOptions = { executablePath: process.env.CHROMIUM_BIN || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=document-user-activation-required'] };
export default defineConfig({
  testDir: '.', testMatch: /v161\.spec\.mjs$/, fullyParallel: true, workers: Number(process.env.PW_WORKERS || 2), retries: 0, timeout: 300000,
  reporter: [['list'], ['json', { outputFile: 'results/playwright-report.json' }]],
  use: { launchOptions, trace: 'retain-on-failure', screenshot: 'only-on-failure', actionTimeout: 15000, ignoreHTTPSErrors: true },
  outputDir: 'results/test-output',
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } }
  ]
});
