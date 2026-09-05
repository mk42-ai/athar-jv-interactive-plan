import React, { useCallback, useEffect, useRef, useState } from 'react';
import Tabs, { TABS } from './components/Tabs.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import DeckTab from './components/deck/DeckTab.jsx';
import TimelineTab from './components/timeline/TimelineTab.jsx';
import ChatWidget from './components/chat/ChatWidget.jsx';
import { createSession, getHealth } from './lib/api.js';
import { OVERVIEW } from './lib/plan.js';

const newExternalUserId = () => `athar-web-${(globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).slice(0, 12)}`;
const COMPANION_WIDTH = 380;

// Public workspace: the presentation (deck, timeline, narrated guide) plus ONE plain chat panel that answers
// from the three review documents. No sign-in, no cookies, no scope toggles, no starter cards, no citation
// side panel, no collapsible rail — the chat is always present (right column on desktop, "Ask AI" view on phones).
export default function App() {
  // Deep links: #deck / #timeline select a section; #chat opens the Ask AI view on phones; #chat?q=…(&q=…) also
  // sends up to three questions on open (handy for embedding hosts and for end-to-end checks). Nothing is stored.
  const [{ initialTab, initialView, initialQuestions }] = useState(() => {
    const [h, qs] = (location.hash || '').replace(/^#/, '').split('?');
    const questions = h === 'chat' && qs ? new URLSearchParams(qs).getAll('q').map((q) => q.trim()).filter(Boolean).slice(0, 3) : [];
    return { initialTab: TABS.some((t) => t.id === h) ? h : 'deck', initialView: h === 'chat' || h === 'voice' ? 'ask' : 'presentation', initialQuestions: questions };
  });
  const [tab, setTab] = useState(initialTab);
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(null);
  const [session, setSession] = useState(null); // server-minted conversation id only; nothing secret is ever stored
  const [prefill, setPrefill] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  const [isShortViewport, setIsShortViewport] = useState(() => window.matchMedia('(max-height: 540px) and (min-width: 721px)').matches);
  const [mobileView, setMobileView] = useState(initialView);
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  const mobileTabRefs = useRef([]);
  const mobileScrollRef = useRef({ presentation: { top: 0, inner: [] }, ask: { top: 0, inner: [] } });
  const workspaceRef = useRef(null);
  const externalUserIdRef = useRef(newExternalUserId());
  const sessionRef = useRef(null);
  const sessionPromise = useRef(null);
  const sessionGeneration = useRef(0);
  const healthPromise = useRef(null);
  const requestCounter = useRef(0);

  const switchMobileView = useCallback((next) => {
    if (!isMobile || next === mobileView) return;
    const panel = document.getElementById(mobileView === 'presentation' ? 'mobile-panel-presentation' : 'mobile-panel-ask');
    mobileScrollRef.current[mobileView] = {
      top: window.scrollY,
      inner: Array.from(panel?.querySelectorAll('.pdfv-scroll, .chat-list') || []).map((el) => ({ el, top: el.scrollTop, left: el.scrollLeft })),
    };
    setMobileView(next);
  }, [isMobile, mobileView]);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const shortQuery = window.matchMedia('(max-height: 540px) and (min-width: 721px)');
    const update = () => { setIsMobile(query.matches); setIsShortViewport(shortQuery.matches); };
    query.addEventListener('change', update);
    shortQuery.addEventListener('change', update);
    return () => { query.removeEventListener('change', update); shortQuery.removeEventListener('change', update); };
  }, []);
  useEffect(() => {
    if (!isMobile) return;
    let second;
    const frame = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        const saved = mobileScrollRef.current[mobileView];
        saved.inner.forEach(({ el, top, left }) => { if (el.isConnected) el.scrollTo({ top, left, behavior: 'instant' }); });
        window.scrollTo({ top: saved.top, behavior: 'instant' });
      });
    });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(second); };
  }, [isMobile, mobileView]);
  const onMobileTabKey = (e) => {
    const current = mobileView === 'presentation' ? 0 : 1;
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : e.key === 'ArrowRight' || e.key === 'ArrowLeft' ? 1 - current : null;
    if (next == null) return;
    e.preventDefault();
    switchMobileView(next === 0 ? 'presentation' : 'ask');
    mobileTabRefs.current[next]?.focus({ preventScroll: true });
  };

  useEffect(() => {
    let alive = true;
    healthPromise.current ||= getHealth(); // the ref avoids duplicate health requests under React StrictMode
    healthPromise.current.then((h) => { if (alive) setHealth(h); }).catch(() => { if (alive) setHealthError('Assistant service unavailable'); });
    return () => { alive = false; };
  }, []);
  useEffect(() => { history.replaceState(null, '', `#${tab}`); }, [tab]);
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const measure = () => setWorkspaceWidth(el.clientWidth);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const ensureSession = useCallback(async () => {
    if (sessionRef.current?.sessionId) return sessionRef.current;
    if (!sessionPromise.current) {
      const generation = sessionGeneration.current;
      const promise = createSession(externalUserIdRef.current).then((s) => {
        if (generation !== sessionGeneration.current) throw new Error('The session was reset. Send your question again.');
        const next = { sessionId: s.sessionId, externalUserId: externalUserIdRef.current, ts: Date.now() };
        sessionRef.current = next;
        setSession(next);
        return next;
      }).finally(() => { if (sessionPromise.current === promise) sessionPromise.current = null; });
      sessionPromise.current = promise;
    }
    return sessionPromise.current;
  }, []);
  const resetSession = useCallback(() => {
    sessionGeneration.current++;
    sessionRef.current = null;
    sessionPromise.current = null;
    externalUserIdRef.current = newExternalUserId();
    setSession(null);
  }, []);
  const onAskSlide = useCallback((n) => {
    setPrefill({ id: ++requestCounter.current, text: `Explain slide ${n} of the executive summary.` });
    switchMobileView('ask');
  }, [switchMobileView]);
  const stacked = isShortViewport || (workspaceWidth > 0 ? workspaceWidth < 1060 : window.matchMedia('(max-width: 1100px)').matches);
  const configured = health ? health.configured : null;

  return (
    <div className="app athar-workspace">
      <header className="top">
        <div className="brand"><span className="brand-title">Athar JV</span><span className="brand-sub">ODA × AIREV · {OVERVIEW.period}</span></div>
        {!isMobile && <Tabs active={tab} onChange={setTab} />}
        <nav className="mobile-view-tabs" role="tablist" aria-label="Workspace view" data-testid="mobile-view-tabs" hidden={!isMobile} onKeyDown={onMobileTabKey}>
          {[{ id: 'presentation', label: 'Presentation' }, { id: 'ask', label: 'Ask AI' }].map((view, index) => <button key={view.id} ref={(el) => { mobileTabRefs.current[index] = el; }} id={`mobile-tab-${view.id}`} role="tab" aria-selected={mobileView === view.id} aria-controls={`mobile-panel-${view.id}`} tabIndex={mobileView === view.id ? 0 : -1} onClick={() => switchMobileView(view.id)} data-testid={`mobile-tab-${view.id}`}>{view.label}</button>)}
        </nav>
        <div className="top-status" aria-live="polite"><span className={`status ${configured === true ? 'ok' : configured === false || healthError ? 'warn' : ''}`}><i />{configured === true ? 'AI companion online' : configured === false || healthError ? 'AI companion offline' : 'Public presentation'}</span></div>
      </header>
      <main className="main">
        <div ref={workspaceRef} className={`presentation-workspace has-companion ${stacked ? 'is-stacked' : ''} ${isMobile ? 'is-mobile' : ''}`} style={{ '--companion-width': `${COMPANION_WIDTH}px` }} data-testid="presentation-workspace" data-layout={isMobile ? 'mobile-views' : stacked ? 'stacked' : 'columns'} data-mobile-view={mobileView} data-companion="open">
          <div className="workspace-primary" id="mobile-panel-presentation" role={isMobile ? 'tabpanel' : undefined} aria-labelledby={isMobile ? 'mobile-tab-presentation' : undefined} hidden={isMobile && mobileView !== 'presentation'} inert={isMobile && mobileView !== 'presentation' ? '' : undefined}>
            {isMobile && <nav className="mobile-section-nav" aria-label="Presentation sections"><button id="mobile-section-deck" aria-pressed={tab === 'deck'} onClick={() => setTab('deck')}>Slides</button><button id="mobile-section-timeline" aria-pressed={tab === 'timeline'} onClick={() => setTab('timeline')}>Timeline</button></nav>}
            <section id="panel-deck" role={isMobile ? 'region' : 'tabpanel'} aria-labelledby={isMobile ? 'mobile-section-deck' : 'tab-deck'} hidden={tab !== 'deck'} inert={tab !== 'deck' ? '' : undefined} className="tab-panel"><ErrorBoundary name="Presentation"><DeckTab onAskSlide={onAskSlide} visible={tab === 'deck' && (!isMobile || mobileView === 'presentation')} /></ErrorBoundary></section>
            <section id="panel-timeline" role={isMobile ? 'region' : 'tabpanel'} aria-labelledby={isMobile ? 'mobile-section-timeline' : 'tab-timeline'} hidden={tab !== 'timeline'} inert={tab !== 'timeline' ? '' : undefined} className="tab-panel"><ErrorBoundary name="Timeline"><TimelineTab /></ErrorBoundary></section>
          </div>
          <aside id="mobile-panel-ask" role={isMobile ? 'tabpanel' : undefined} aria-labelledby={isMobile ? 'mobile-tab-ask' : undefined} hidden={isMobile && mobileView !== 'ask'} inert={isMobile && mobileView !== 'ask' ? '' : undefined} className="workspace-companion is-open" aria-label={isMobile ? undefined : 'Ask AI'} data-testid="presentation-companion">
            <div className="companion-shell">
              <ErrorBoundary name="Chat"><ChatWidget open={!isMobile || mobileView === 'ask'} ensureSession={ensureSession} resetSession={resetSession} session={session} prefill={prefill} onPrefillConsumed={() => setPrefill(null)} autoAsk={initialQuestions} /></ErrorBoundary>
            </div>
          </aside>
        </div>
      </main>
      <footer className="foot"><span>Private &amp; Confidential · ODA × AIREV — Athar JV</span><span>Powered by On Demand · Grounded in the review documents</span></footer>
    </div>
  );
}
