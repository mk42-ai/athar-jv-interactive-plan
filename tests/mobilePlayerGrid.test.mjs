import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Guard the exact CSS regression found in real 390px Chromium: a long spanning
// caption forced the Transcript's max-content track to expand the page to 1752px.
// This static check is not browser proof; the live control run verifies geometry.
test('mobile narration grids use a shrinkable flexible track, including narrow phones', () => {
  const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  const phone = css.slice(css.indexOf('@media (max-width: 640px)'));
  const narrow = css.slice(css.lastIndexOf('@media (max-width: 340px)'));
  assert.match(phone, /grid-template-columns:\s*auto minmax\(0, 1fr\) 44px 44px/);
  assert.match(narrow, /grid-template-columns:\s*auto minmax\(0, 1fr\) 44px/);
  assert.doesNotMatch(phone, /grid-template-columns:[^;}]*minmax\(max-content/);
  assert.match(css, /\.guide-section\s*\{[^}]*min-width:\s*0/);
});
