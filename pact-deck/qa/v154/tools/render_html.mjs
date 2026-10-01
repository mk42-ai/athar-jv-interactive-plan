import { launch } from './lib.mjs';
const jobs = JSON.parse(process.argv[2]);
const b = await launch(['--allow-file-access-from-files']);
try { for (const [html, png, w, h] of jobs) { const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); await p.goto('file://' + html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250); await p.screenshot({ path: png }); await p.close(); console.log('rendered', png); } }
finally { await b.close(); }
