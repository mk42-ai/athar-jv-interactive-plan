import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Static guards for the presentation-shell overhaul. These are source contracts, not browser
// proof: the deployed acceptance run measures the real geometry (player below the slide, the
// companion resizing the stage, the mobile tab switch) in Chromium.
const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const css = read('src/styles.css');
const app = read('src/App.jsx');
const chat = read('src/components/chat/ChatWidget.jsx');
const guide = read('src/components/deck/GuideMode.jsx');
const viewer = read('src/components/deck/PdfViewer.jsx');
const spatial = css.slice(css.indexOf('SPATIAL SYSTEM — depth'));

test('(B) the spacing scale is an 8px base with 4px sub-steps', () => {
  const root = css.slice(css.indexOf(':root'), css.indexOf('* { box-sizing'));
  for (const [token, value] of [['--space-half', '4px'], ['--space-1', '8px'], ['--space-1-5', '12px'],
    ['--space-2', '16px'], ['--space-3', '24px'], ['--space-4', '32px'], ['--space-6', '48px'], ['--space-8', '64px']]) {
    assert.match(root, new RegExp(`${token}:\\s*${value};`), `${token} must be ${value}`);
  }
});

test('(B) motion tokens stay inside the restrained 150-250ms band', () => {
  const root = css.slice(css.indexOf(':root'), css.indexOf('* { box-sizing'));
  assert.match(root, /--dur-1:\s*150ms;/);
  assert.match(root, /--dur-2:\s*200ms;/);
  assert.match(root, /--dur-3:\s*250ms;/);
  // Nothing in the new layer may hand-roll a duration outside that band.
  const declared = [...spatial.matchAll(/(?:transition|animation)[^;{}]*?(\d+(?:\.\d+)?)(ms|s)\b/g)]
    .map((m) => (m[2] === 's' ? Number(m[1]) * 1000 : Number(m[1])));
  for (const value of declared) assert.ok(value >= 150 && value <= 250, `unexpected ${value}ms duration in the spatial layer`);
});

test('(B) frosted surfaces carry a high-contrast hairline, and depth uses the elevation scale', () => {
  assert.match(spatial, /backdrop-filter:\s*var\(--glass-blur\)/);
  assert.match(spatial, /border-bottom:\s*var\(--hair-1\) solid var\(--glass-border\)/);
  assert.match(spatial, /border-top:\s*var\(--hair-1\) solid var\(--glass-border\)/);
  assert.match(css, /--hair-1:\s*1px;/);
  assert.match(css, /--glass-border:\s*rgba\(23, 24, 26, 0\.16\)/); // 1px edge, not a neumorphic double shadow
  for (const token of ['--elev-1', '--elev-2', '--elev-3', '--elev-4']) assert.ok(css.includes(`${token}:`), `${token} missing`);
});

test('(B) slide parallax re-fires per page and is disabled under prefers-reduced-motion', () => {
  assert.match(viewer, /parallax-\$\{page % 2 \? 'a' : 'b'\}/);
  assert.match(spatial, /@keyframes slide-parallax-a/);
  assert.match(spatial, /@keyframes slide-parallax-b/);
  const reduced = spatial.slice(spatial.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /parallax-a[\s\S]*animation:\s*none\s*!important/);
});

test('(A) the player is an in-flow row with a section label, transcript drawer and info menu', () => {
  assert.match(guide, /data-testid="guide-section-label"/);
  assert.match(guide, /data-testid="guide-expand"/);      // transcript drawer toggle
  assert.match(guide, /data-testid="guide-caption-full"/); // the drawer itself
  assert.match(guide, /data-testid="guide-info"/);         // small 'i' menu
  assert.match(guide, /id="guide-information"/);
  // Narration provenance (voice / model / clip source) lives ONLY inside the info menu.
  const info = guide.slice(guide.indexOf('id="guide-information"'), guide.indexOf('guide-keyboard-note'));
  assert.match(info, /Voice source/);
  assert.match(info, /guide-source/);
  assert.match(spatial, /\.pdfv \.guide-dock \{ position: relative; inset: auto; \}/);
});

test('(C) the AI panel resizes the stage and remembers whether it was open', () => {
  assert.match(css, /\.presentation-workspace\.has-companion \{ grid-template-columns: minmax\(0, 1fr\) var\(--companion-width/);
  assert.match(app, /const PANEL_KEY = 'athar\.ai-panel\.v1'/);
  assert.match(app, /readPanelPreference\(\)/);
  assert.match(app, /writePanelPreference\(widget, lastWidgetRef\.current\)/);
  assert.match(app, /data-testid="ai-panel-toggle"/);
  assert.match(app, /data-testid=\{`mobile-tab-\$\{view\.id\}`\}/);   // Presentation / Ask AI bottom tabs
  assert.match(app, /\{ id: 'presentation', label: 'Presentation' \}, \{ id: 'ask', label: 'Ask AI' \}/);
  // UI preference only — no credential or business payload may be persisted client-side.
  assert.doesNotMatch(app, /localStorage[^\n]*(passphrase|session|token|apikey)/i);
});

test('(D) stated, derived, conflicting and missing evidence are visually distinct', () => {
  assert.match(chat, /data-testid="evidence-stated"/);
  assert.match(chat, /data-testid="evidence-derived"/);
  assert.match(chat, /data-testid="evidence-conflicts"/);
  assert.match(chat, /data-testid="evidence-missing"/);
  assert.match(chat, /Stated in source/);
  assert.match(chat, /Derived calculation/);
  assert.match(chat, /Conflicting values/);
  assert.match(chat, /Not in the sources/);
  assert.match(chat, /data-testid="evidence-open-source"/);
  assert.match(chat, /evidence: ev\.evidence \|\| null/); // the validated structure reaches the view
  for (const cls of ['evidence-item.stated', 'evidence-item.derived', 'evidence-item.conflict', 'evidence-item.missing']) {
    assert.ok(spatial.includes(`.${cls} `), `${cls} needs its own styling`);
  }
});

test('(D) the scope selector and the three seeded starter questions are present', () => {
  assert.match(chat, /This document/);
  assert.match(chat, /All documents/);
  assert.match(chat, /'Compare the UAE base case with international expansion\.'/);
  assert.match(chat, /'What capital decisions still need agreement\?'/);
  assert.match(chat, /'Which implementation milestones depend on those decisions\?'/);
});

test('(E) no provider credential is hard-coded in committed source', () => {
  for (const file of ['src/App.jsx', 'src/lib/api.js', 'server/ondemand.js', 'server/api.js', 'vite.config.js']) {
    const source = read(file);
    assert.doesNotMatch(source, /apikey\s*[:=]\s*['"][A-Za-z0-9]{16,}/i, `${file} must read the key from the environment`);
    assert.doesNotMatch(source, /VITE_[A-Z_]*(KEY|SECRET|TOKEN)/, `${file} must never expose a secret to the browser`);
  }
  assert.match(read('server/ondemand.js'), /apikey: key/);              // header from env only
  assert.match(read('.env.example'), /^ON_DEMAND_API_KEY=.+$/m);        // documented placeholder
});
