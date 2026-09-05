(() => {
  'use strict';
  const RUN = __RUN_CONFIG__, S = RUN.selectors;
  const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const now = () => new Date().toISOString();
  const E = window.__atharEvidence = {
    version: 3, mode: 'authorized', startUTC: now(), checks: [], actions: [],
    authMode: 'in-memory-real-api-broker',
    classification: 'Actual deployed assets and real authorized API; no mocks, no injected answers.',
    browserOriginLimitation: 'Browser runs on a loopback broker URL, not the deployed origin; cookie persistence, SameSite and deployed CSRF are not tested.',
    actionMethod: 'Synthetic DOM click/focus/native value setter/input/change, not trusted physical typing, dragging or keyboard events.',
    privacy: 'IDs, counts, booleans only. No answers, excerpts, source text, credentials, cookies, sessions or raw URLs recorded. Final screenshot uses actual new-session UI.',
  };
  const check = (id, ok, detail = {}) => { E.checks.push({id, ok: !!ok, detail}); return !!ok; };
  const requireCheck = (id, ok, detail) => { if (!check(id, ok, detail)) throw new Error('check-failed'); };
  const visible = el => {
    if (!el?.getClientRects().length) return false;
    for (let n = el; n; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (n.hidden || c.display === 'none' || c.visibility === 'hidden' || Number(c.opacity) === 0) return false;
    }
    return true;
  };
  const wait = async (predicate, ms = 12000) => {
    const end = performance.now() + ms;
    while (performance.now() < end) { if (await predicate()) return true; await sleep(150); }
    return false;
  };
  const click = async (selector, name) => {
    const el = typeof selector === 'string' ? q(selector) : selector;
    requireCheck(name + '-available', visible(el) && !el.disabled);
    el.focus?.({preventScroll: true}); el.click();
    E.actions.push({id: name, synthetic: true}); await sleep(350); return el;
  };
  const setValue = (el, value) => {
    if (!el) throw new Error('missing-control');
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', {bubbles: true}));
    el.dispatchEvent(new Event('change', {bubbles: true}));
    E.actions.push({id: 'native-value-input-change', synthetic: true});
  };
  const probe = async () => {
    const response = await fetch('/__athar_ui__/probe', {cache: 'no-store'});
    if (!response.ok) throw new Error('metadata-unavailable');
    return response.json();
  };
  const queries = ledger => ledger.requests.filter(r => r.kind === 'query' && r.method === 'POST');
  const box = el => el?.getBoundingClientRect();
  const area = (a, b) => a && b ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) : Infinity;
  const layout = async (id, focus) => {
    focus?.focus({preventScroll: true}); await sleep(400);
    const chat = q(S.chat), canvas = q(S.canvas), caption = q('[data-testid="guide-caption-full"]'), companion = q(S.companion);
    check(id, visible(chat) && visible(caption) && companion?.classList.contains('is-open') && document.activeElement === focus &&
      area(box(chat), box(canvas)) <= 1 && area(box(chat), box(caption)) <= 1 && area(box(canvas), box(caption)) <= 1 &&
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      {focused: document.activeElement === focus, captionExpanded: visible(caption)});
  };
  const documentsOpen = async () => {
    const details = q(S.documents);
    if (details && !details.open) await click(details.querySelector('summary'), 'open-source-status');
  };
  const normalise = text => (text || '').replace(/\s+/g, ' ').trim();
  (async () => {
    try {
      requireCheck('exact-requested-viewport', innerWidth === RUN.viewport.width && innerHeight === RUN.viewport.height);
      let ledger;
      await wait(async () => { ledger = await probe(); return ledger.sources.length === 4; });
      const sources = ledger?.sources || [], executive = sources.find(d => d.slug === 'executive-presentation'), financial = sources.find(d => d.slug === 'financial-summary');
      await click(S.askSlide, 'ask-this-slide'); await wait(() => visible(q(S.chat)) && !!q(S.input));
      await documentsOpen();
      const rows = qa(`${S.documents} [data-document-id]`);
      requireCheck('real-four-ready-documents', sources.length === 4 && new Set(sources.map(d => d.id)).size === 4 && sources.every(d => d.ready) &&
        rows.length === 4 && rows.every(r => sources.some(d => d.id === r.dataset.documentId) && r.dataset.status === 'ready'), {documentCount: sources.length, rowCount: rows.length});
      requireCheck('ask-slide-executive-pptx-slide1', executive?.kind === 'pptx' && Number(q(S.canvas)?.dataset.page) === 1 &&
        q(S.filter)?.value === executive?.id && /\bslide\s*1\b/i.test(q(S.slideContext)?.textContent || '') && /\bslide\s*1\b/i.test(q(S.input)?.value || ''));
      check('ask-slide-prefill-no-autosubmit', !!q(S.input)?.value.trim() && queries(await probe()).length === 0);
      setValue(q(S.filter), financial?.id); await sleep(350);
      requireCheck('financial-filter-clears-slide', !!financial && q(S.filter)?.value === financial.id && !visible(q(S.slideContext)));

      // Freeze the actual guide at slide 1 using its own controls; no synthetic audio/time changes.
      await click(S.toggle, 'start-guide');
      await wait(() => q(S.rail)?.dataset.status === 'speaking');
      await click(S.pause, 'pause-guide');
      await click('[data-testid="guide-expand"]', 'expand-caption');
      await layout('focused-composer-layout', q(S.input));

      const prompt = 'Compare UAE-only Base Case and International Expansion Upside Year-5 revenue. Quote the source and keep scenarios distinct.';
      setValue(q(S.input), prompt); await wait(() => q(S.send) && !q(S.send).disabled);
      await click(S.send, 'send-real-financial-question');
      // Only short awaits occur in the CLI's eval calls. The real server/AI receives one question.
      const completed = await wait(async () => {
        ledger = await probe(); const calls = queries(ledger);
        return calls.length > 0 && (calls.at(-1).complete || calls.at(-1).transportFailed);
      }, 100000);
      const calls = queries(ledger), answer = calls.at(-1);
      await wait(() => q('.msg.assistant.done') || q('.msg.assistant.error'), 3000);
      requireCheck('real-query-completed', completed && calls.length === 1 && answer?.status === 200 && answer.complete && !answer.transportFailed &&
        !answer.metadataInvalid && answer.answerNonempty && answer.doneFrameCount === 1 && answer.errorFrameCount === 0 &&
        answer.documentId === financial.id && answer.slide === null && !!q('.msg.assistant.done .md') && !q('.msg.assistant.error'), {requestCount: calls.length, httpStatus: answer?.status || 0});
      const citations = answer.citations || [], buttons = qa(S.citation), inlineLinks = qa('.msg.assistant.done a.inline-citation');
      requireCheck('returned-citations-match-ui', citations.length > 0 && answer.citationCount === citations.length && buttons.length === citations.length &&
        citations.every(c => c.documentId === financial.id && c.urlMatchesId && answer.retrievedIds.includes(c.id) && inlineLinks.some(a => a.getAttribute('href') === '/api/citations/' + c.id)),
        {citationCount: citations.length, uiCitationCount: buttons.length, retrievedCount: answer.retrievedIds.length});
      const trigger = await click(buttons[0], 'open-real-citation');
      let resolved;
      const loaded = await wait(async () => {
        ledger = await probe(); resolved = ledger.requests.filter(r => r.kind === 'citation').at(-1);
        return resolved?.complete && visible(q(S.citationPanel)) && q(S.citationPanel)?.getAttribute('aria-busy') !== 'true';
      });
      requireCheck('citation-server-resolves-excerpt', loaded && resolved.status === 200 && resolved.citationId === citations[0].id && resolved.documentId === financial.id &&
        resolved.excerptNonempty && !!normalise(q(`${S.citationPanel} blockquote`)?.textContent) && !q(`${S.citationPanel} [role="alert"]`));
      const original = q(S.original), href = original ? new URL(original.href, location.origin) : null;
      let originalStatus = 0;
      const safeOriginal = href && href.origin === location.origin && /^\/api\/sources\/[A-Za-z0-9_-]+$/.test(href.pathname) && !href.search && !href.hash &&
        resolved.originalSameOriginApi && href.pathname === resolved.originalPath;
      if (safeOriginal) originalStatus = (await fetch(href.href, {method: 'HEAD'})).status;
      check('source-original-same-origin-api', safeOriginal && originalStatus === 200, {httpStatus: originalStatus});
      await layout('focused-citation-layout', q(S.citationPanel));
      await click(S.citationClose, 'close-citation');
      check('citation-close-restores-focus', !visible(q(S.citationPanel)) && document.activeElement === trigger);
      setValue(q(S.filter), executive.id); await sleep(350);
      check('document-filter-switch', q(S.filter)?.value === executive.id && !visible(q(S.slideContext)) && !visible(q(S.citationPanel)));
      await documentsOpen(); const before = queries(await probe()).length;
      await click('[data-testid="ask-document-financial-summary"]', 'ask-financial-document');
      check('ask-document-prefill-no-autosubmit', q(S.filter)?.value === financial.id && !!q(S.input)?.value.trim() && !visible(q(S.slideContext)) && queries(await probe()).length === before);
      const range = q('#companion-size'), region = q(S.companion), beforeBox = box(region), logBefore = box(q(`${S.chat} .chat-list`));
      const oldValue = range?.value, n = Number(oldValue), step = Number(range?.step || 10), max = Number(range?.max);
      if (range?.matches('input[type="range"]')) setValue(range, String(n + (n >= max ? -step : step)));
      await sleep(500);
      const afterBox = box(region), logAfter = box(q(`${S.chat} .chat-list`));
      check('range-resize-value-and-layout', !!range && range.value !== oldValue && !!beforeBox && !!afterBox && !!logBefore && !!logAfter &&
        (Math.abs(afterBox.width - beforeBox.width) > .5 || Math.abs(afterBox.height - beforeBox.height) > .5 || Math.abs(logAfter.height - logBefore.height) > .5));
      await layout('focused-resized-layout', q(S.input));
      await click(S.chatClose, 'close-chat');
      const hidden = q(S.chat), candidates = hidden ? [...hidden.querySelectorAll('button,a[href],input,textarea,select,[tabindex]')] : [];
      let focusable = 0;
      for (const el of candidates) { el.focus({preventScroll: true}); if (document.activeElement === el) focusable++; }
      check('closed-chat-not-focusable', !visible(hidden) && !hidden?.contains(document.activeElement) && focusable === 0, {candidateCount: candidates.length, focusedCount: focusable});
    } catch (_) {
      check('authorized-execution', false); // No exception message/stack or API content persisted.
    } finally {
      // Use real application controls, never replace answer/excerpt DOM with made-up content.
      // If cleanup fails the launcher deletes this run's screenshot instead of publishing it.
      let clean = false;
      try {
        if (!visible(q(S.chat))) await click(S.chatOpen, 'reopen-for-safe-proof');
        const stop = qa(`${S.chat} form button`).find(b => b.type === 'button' && b.textContent.trim() === 'Stop');
        if (stop) { stop.click(); await wait(() => !qa(`${S.chat} form button`).some(b => b.textContent.trim() === 'Stop'), 10000); }
        const reset = q(`${S.chat} button[aria-label="Start a new session"]`);
        if (reset && !reset.disabled) await click(reset, 'clear-via-real-new-session');
        if (q(S.input)) setValue(q(S.input), '');
        await documentsOpen(); await sleep(400);
        clean = visible(q(S.chat)) && !q(`${S.chat} .msg`) && !q(S.citationPanel) && !q(S.input)?.value && !q(`${S.chat} [role="alert"]`);
        q(`${S.documents} summary`)?.focus({preventScroll: true});
      } catch (_) { clean = false; }
      check('proof-clean-session', clean);
      E.endUTC = now(); E.ok = E.checks.every(c => c.ok);
      window.__atharEvidenceB64 = btoa(unescape(encodeURIComponent(JSON.stringify(E))));
      window.__atharTransport = (i, n) => JSON.stringify({chunk: window.__atharEvidenceB64.slice(i*n, (i+1)*n), more: (i+1)*n < window.__atharEvidenceB64.length});
    }
  })();
  window.__atharPoll = async () => { if (!window.__atharEvidenceB64) await sleep(100); return true; };
  return true;
})()
