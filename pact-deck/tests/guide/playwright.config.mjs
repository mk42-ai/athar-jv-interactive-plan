// Athar deck v1.5.4 — Guide sync suite (Playwright Test). Run: npx playwright test -c tests/guide/playwright.config.mjs
// Uses the system Chromium; serves dist/ with the repo's own static server.
import { defineConfig } from '@playwright/test';
const PORT = Number(process.env.GUIDE_PORT || 4180);
export default defineConfig({
  testDir: '.', testMatch: /.*\.spec\.mjs/, timeout: 240_000, expect: { timeout: 6_000 }, workers: 1, retries: 0,
  reporter: [['list'], ['json', { outputFile: process.env.GUIDE_JSON || '../../qa/guide-sync-results.json' }]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, viewport: { width: 1440, height: 900 }, trace: 'off', screenshot: 'off',
    launchOptions: { executablePath: process.env.CHROMIUM_BIN || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=user-gesture-required', `--athar-qa-marker=${process.env.ATHAR_QA_MARKER || 'guide-suite'}`] } },
  webServer: { command: `node serve.mjs ${process.env.GUIDE_DIST || 'dist'}`, cwd: process.env.GUIDE_SERVE_CWD || '../..', env: { PORT: String(PORT) }, url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: false, timeout: 30_000 },
});
