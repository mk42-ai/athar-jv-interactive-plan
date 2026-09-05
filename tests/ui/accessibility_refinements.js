/**
 * Additive browser assertions for the isolated synthetic UI runner.
 * Import this module after mounting synthetic fixtures; it does not authorize,
 * fetch, send prompts, start narration, resize a browser, or auto-run anything.
 * No source text/credentials are returned. The integrator supplies fixture
 * actions (and runs viewports 320/360/390/768, 1275x451, and 1440x900).
 * KeyboardEvent checks are DOM-event checks, NOT physical-keyboard proof.
 */
const q = (s) => document.querySelector(s);
const box = (e) => e.getBoundingClientRect();
const visible = (e) => !!e && e.isConnected && e.getClientRects().length > 0 && !e.closest('[hidden],[inert]');
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const requireCheck = (id, ok) => { if (!ok) throw new Error(`Accessibility refinement failed: ${id}`); return id; };
const until = async (test) => {
  for (let i = 0; i < 160; i++) { if (test()) return; await new Promise(r => setTimeout(r, 25)); }
  throw new Error('Accessibility fixture did not settle');
};
const escape = (element) => {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
};
const setNativeValue = (element, value) => {
  const prototype = element.tagName === 'SELECT' ? HTMLSelectElement.prototype : element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, String(value));
  element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
};
const source = () => q('[data-testid="source-viewer"]');
const sourceBusy = () => source()?.getAttribute('aria-busy') === 'true';

export function assertTranscriptFits() {
  const button = q('[data-testid="guide-expand"]');
  requireCheck('transcript-visible', visible(button));
  const label = button.querySelector('span'), icon = button.querySelector('svg');
  const b = box(button), l = box(label), i = box(icon);
  requireCheck('transcript-content-sized-not-fixed-44', b.width > 44 && b.height >= 44);
  requireCheck('transcript-label-and-chevron-contained', l.left >= b.left && l.right <= b.right && i.left >= b.left && i.right <= b.right && l.right <= i.left);
  requireCheck('transcript-no-label-clipping', label.scrollWidth <= label.clientWidth + 1 && button.scrollWidth <= button.clientWidth + 1);
  requireCheck('transcript-chevron-not-shrunk', i.width >= 13.5 && getComputedStyle(icon).flexShrink === '0');
  return true;
}

export async function assertInfoEscape() {
  const toggle = q('[data-testid="guide-info"]');
  requireCheck('info-toggle-present', visible(toggle));
  if (toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
  await tick();
  const panel = q('#guide-information');
  requireCheck('info-open-nonmodal', visible(panel) && panel.getAttribute('role') === 'region' && panel.getAttribute('aria-modal') !== 'true');
  toggle.focus();
  const event = escape(toggle);
  await tick();
  requireCheck('info-escape-consumed', event.defaultPrevented);
  requireCheck('info-escape-closes-locally-and-restores-trigger', !visible(panel) && toggle.getAttribute('aria-expanded') === 'false' && document.activeElement === toggle);
  return true;
}

export async function assertNestedCitationEscape() {
  // Fixture must already contain one synthetic citation in an open chat.
  const trigger = q('[data-testid="chat-citation"]');
  const chat = q('[data-testid="chat-widget"]');
  requireCheck('citation-fixture-present', visible(trigger) && visible(chat));
  if (!q('[data-testid="citation-panel"]')) { trigger.focus(); trigger.click(); }
  await until(() => visible(q('[data-testid="citation-panel"]')));
  const panel = q('[data-testid="citation-panel"]');
  panel.focus();
  const event = escape(panel);
  await tick();
  requireCheck('nested-escape-consumed', event.defaultPrevented);
  requireCheck('nested-escape-only-closes-source', !q('[data-testid="citation-panel"]') && visible(chat));
  requireCheck('nested-escape-restores-exact-citation', document.activeElement === trigger);
  return true;
}

export async function assertSourceNavigationFocus({ selector, activate, release, expectedLocation, expectError = false }) {
  // Setup: a resolved source fixture and a held next getSourceLocation response.
  // activate receives the actual focused DOM control. It must use a fixture
  // action; release resolves/rejects the held response. Examples below.
  requireCheck('source-ready-before-navigation', visible(source()) && !sourceBusy());
  const control = q(selector), nav = q('.source-nav');
  requireCheck('native-navigation-control-present', visible(control) && !!nav);
  control.focus();
  const navigation = [...nav.querySelectorAll('button,input,select')];
  const details = q('[data-testid="source-cell-details"]');
  const scroll = q('[data-testid="source-sheet-scroll"]');
  const scrollTop = scroll?.scrollTop;
  await activate(control);
  await until(sourceBusy);
  requireCheck('source-controls-mounted-while-busy', navigation.every(e => e.isConnected));
  requireCheck('source-focus-retained-during-loading', document.activeElement === control && !control.disabled);
  requireCheck('source-action-gated-with-aria-disabled', control.getAttribute('aria-disabled') === 'true');
  if (details) requireCheck('worksheet-inspection-retained-while-busy', details.isConnected);
  if (scroll) requireCheck('worksheet-scroll-retained-while-busy', scroll.isConnected && scroll.scrollTop === scrollTop);
  await release();
  await until(() => !sourceBusy());
  requireCheck('source-controls-not-remounted-after-navigation', q(selector) === control && navigation.every(e => e.isConnected));
  requireCheck('source-focus-retained-after-navigation', document.activeElement === control);
  requireCheck('source-navigation-result', expectError ? !!source().querySelector('[role="alert"]') : source().dataset.location === expectedLocation);
  return true;
}

export async function assertNativeSourceControls() {
  requireCheck('source-native-controls-ready', visible(source()) && !sourceBusy());
  for (const selector of ['[data-testid="source-sheet-select"]', '[data-testid="source-range-input"]', '[data-testid="source-page-select"]']) {
    const element = q(selector);
    if (!element) continue;
    requireCheck('source-selector-is-native', /^(INPUT|SELECT)$/.test(element.tagName));
    element.focus();
    requireCheck('source-native-control-focusable', document.activeElement === element && !element.disabled);
  }
  for (const control of source().querySelectorAll('.source-nav button[aria-disabled="true"]')) {
    const location = source().dataset.location;
    control.focus(); control.click(); await tick();
    requireCheck('bounds-guard-does-not-fetch-or-drop-focus', !sourceBusy() && source().dataset.location === location && document.activeElement === control);
  }
  return true;
}

export async function assertCompanionLayout({ open, resize }) {
  // Run with companion initially closed and deck visible; repeat each viewport.
  const workspace = q('[data-testid="presentation-workspace"]');
  const primary = q('.workspace-primary'), canvas = q('[data-testid="pdf-canvas"]');
  const before = box(canvas), headerHeight = box(q('.deck-head')).height;
  requireCheck('layout-fixture-visible', visible(primary) && before.width > 0);
  await open();
  await until(() => workspace.classList.contains('has-companion'));
  await new Promise(r => setTimeout(r, 500));
  const companion = q('.workspace-companion');
  if (innerWidth === 1275 && innerHeight === 451) {
    requireCheck('short-window-stacked', workspace.dataset.layout === 'stacked');
    requireCheck('short-companion-below-not-overlay', box(companion).top >= box(primary).bottom - 1);
    requireCheck('short-header-does-not-wrap-on-open', Math.abs(box(q('.deck-head')).height - headerHeight) < 2);
    requireCheck('short-slide-not-shrunken-by-companion', box(canvas).width >= before.width - 2);
    requireCheck('short-resizer-controls-reading-height', q('#companion-size')?.getAttribute('aria-label') === 'Companion reading height');
  } else if (innerWidth === 1440 && innerHeight === 900) {
    requireCheck('desktop-companion-real-side-column', workspace.dataset.layout === 'columns' && box(companion).left >= box(primary).right - 1);
    const resizer = q('#companion-size'), oldWidth = box(companion).width, oldPrimary = box(primary).width;
    requireCheck('desktop-width-control-present', resizer?.getAttribute('aria-label') === 'Companion width' && typeof resize === 'function');
    const old = Number(resizer.value), next = old + 20 <= Number(resizer.max) ? old + 20 : old - 20;
    await resize(resizer, next); await new Promise(r => setTimeout(r, 500));
    requireCheck('desktop-slider-actually-resizes-columns', Math.abs(box(companion).width - oldWidth) >= 15 && Math.abs(box(primary).width - oldPrimary) >= 15);
    await resize(resizer, old);
  } else if (innerWidth > 640 && innerWidth <= 1100) {
    requireCheck('narrow-workspace-stacked', workspace.dataset.layout === 'stacked' && box(companion).top >= box(primary).bottom - 1);
  }
  requireCheck('layout-no-document-horizontal-overflow', document.documentElement.scrollWidth <= innerWidth + 1);
  return true;
}

export async function assertPhonePersistentViews() {
  requireCheck('phone-viewport-required', innerWidth <= 640);
  const presentationTab = q('[data-testid="mobile-tab-presentation"]'), askTab = q('[data-testid="mobile-tab-ask"]');
  askTab.click(); await tick();
  const input = q('[data-testid="chat-widget"] textarea');
  requireCheck('phone-synthetic-authenticated-chat-present', visible(input));
  setNativeValue(input, 'Synthetic accessibility draft'); await tick();
  const chat = q('[data-testid="chat-widget"]'), panel = q('[data-testid="citation-panel"]');
  const sourceSelect = q('.source-nav select'), value = sourceSelect?.value;
  presentationTab.click(); await tick();
  const guide = q('[data-testid="guide-bar"]'), canvas = q('[data-testid="pdf-canvas"]');
  requireCheck('phone-presentation-visible', visible(canvas) && !visible(chat));
  assertTranscriptFits();
  await assertInfoEscape();
  askTab.click(); await tick();
  requireCheck('phone-draft-and-chat-stay-mounted', q('[data-testid="chat-widget"]') === chat && q('[data-testid="chat-widget"] textarea') === input && input.value === 'Synthetic accessibility draft');
  requireCheck('phone-guide-and-slide-stay-mounted', guide.isConnected && canvas.isConnected);
  if (panel) requireCheck('phone-citation-stays-mounted', q('[data-testid="citation-panel"]') === panel);
  if (sourceSelect) requireCheck('phone-source-selection-persists', sourceSelect.isConnected && sourceSelect.value === value);
  requireCheck('phone-hidden-presentation-inert', q('#mobile-panel-presentation')?.hasAttribute('inert'));
  requireCheck('phone-no-document-horizontal-overflow', document.documentElement.scrollWidth <= innerWidth + 1);
  return true;
}

export function assertStarterStrings() {
  const expected = [
    'Compare the UAE base case with international expansion.',
    'What capital decisions still need agreement?',
    'Which implementation milestones depend on those decisions?',
  ];
  const chips = [...document.querySelectorAll('.chat-empty .chip')];
  requireCheck('three-exact-starters', chips.length === 3 && chips.every((c, i) => c.textContent === expected[i]));
  return true;
}

export function assertGoldContrast() {
  const channel = n => { n /= 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; };
  const rgb = css => (css.match(/[\d.]+/g) || []).map(Number);
  const luminance = c => .2126 * channel(c[0]) + .7152 * channel(c[1]) + .0722 * channel(c[2]);
  const selectors = '.tb-zoom,.thumb-n,.gate-mark b,.badge.done,.disc-title,.gate-week,.month-ordinal,.section-title,.stat.done b,.stat.gate b,.link-btn,.tb-btn.on,.btn.accent,.gate-node,.badge.gate-badge,.gate-chip';
  const elements = [...document.querySelectorAll(selectors)].filter(visible);
  requireCheck('contrast-targets-present', elements.length > 0);
  for (const element of elements) {
    const foreground = rgb(getComputedStyle(element).color);
    const layers = [];
    for (let e = element; e; e = e.parentElement) layers.push(rgb(getComputedStyle(e).backgroundColor));
    let background = [255, 255, 255];
    for (const layer of layers.reverse()) {
      const alpha = layer[3] ?? 1;
      background = background.map((v, i) => alpha * layer[i] + (1 - alpha) * v);
    }
    const a = luminance(foreground), b = luminance(background);
    requireCheck('small-gold-label-or-hover-contrast-at-least-4.5', (Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5);
  }
  return true;
}

export { setNativeValue };
/* Integration examples (held synthetic fixture, no provider):
 * assertSourceNavigationFocus({selector:'[data-testid="source-page-select"]',
 *   activate:e=>setNativeValue(e,2), release:fixture.releaseLocation,
 *   expectedLocation:'Page 2'});
 * Repeat for Next/Previous page and slide buttons at first/last bounds,
 * worksheet select, Go to cells, next/previous rows, and rejected range (400).
 * Invoke assertGoldContrast again with .btn.accent physically hovered via CDP.
 * Repeat layout checks through desktop -> short -> phone -> desktop resize to
 * catch stale matchMedia state. Guide is never toggled by these helpers.
 */
