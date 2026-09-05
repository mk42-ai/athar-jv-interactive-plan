import React, { useCallback, useEffect, useRef, useState } from 'react';
import Tabs, { TABS } from './components/Tabs.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import DeckTab from './components/deck/DeckTab.jsx';
import TimelineTab from './components/timeline/TimelineTab.jsx';
import ChatWidget from './components/chat/ChatWidget.jsx';
import VoiceWidget from './components/voice/VoiceWidget.jsx';
import AccessGate from './components/AccessGate.jsx';
import { createSession, getHealth, getAccess, unlockAccess, getDocuments, retryDocuments } from './lib/api.js';
import { OVERVIEW } from './lib/plan.js';

const newExternalUserId = () => `athar-web-${(globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).slice(0, 12)}`;
const ChatIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A8 8 0 1 1 21 12z" /></svg>;
const MicIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3" /></svg>;

export default function App() {
  const [{ initialTab, initialWidget, initialVoiceQuestion }] = useState(() => {
    const [h, qs] = (location.hash || '').replace(/^#/, '').split('?');
    return {
      initialTab: TABS.some((t) => t.id === h) ? h : 'deck',
      initialWidget: h === 'chat' || h === 'voice' ? h : null,
      initialVoiceQuestion: h === 'voice' && qs ? new URLSearchParams(qs).get('q') : null,
    };
  });
  const [tab, setTab] = useState(initialTab);
  const [widget, setWidget] = useState(initialWidget);
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(null);
  const [access, setAccess] = useState({ authenticated: false, configured: null, loading: true });
  const [session, setSession] = useState(null); // server-owned session; never persist an access credential
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState('');
  const [askRequest, setAskRequest] = useState(null);
  const [companionWidth, setCompanionWidth] = useState(340);
  const [companionHeight, setCompanionHeight] = useState(360);
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  const workspaceRef = useRef(null);
  const returnFocusRef = useRef(null);
  const externalUserIdRef = useRef(newExternalUserId());
  const sessionRef = useRef(null);
  const sessionPromise = useRef(null);
  const sessionGeneration = useRef(0);
  const accessPromise = useRef(null);
  const healthPromise = useRef(null);
  const accessStateRef = useRef(access);
  accessStateRef.current = access;
  const documentPromise = useRef(null);
  const requestCounter = useRef(0);

  useEffect(() => {
    let alive = true;
    // Refs also avoid duplicate access/health requests under React StrictMode.
    accessPromise.current ||= getAccess();
    healthPromise.current ||= getHealth();
    accessPromise.current.then((a) => { if (alive) setAccess({ ...a, loading: false }); }).catch(() => { if (alive) setAccess({ authenticated: false, configured: null, loading: false, error: 'Access could not be checked. Please retry.' }); });
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

  const retryAccess = useCallback(async () => {
    setAccess((a) => ({ ...a, loading: true, error: null }));
    try { const a = await getAccess(); setAccess({ ...a, loading: false }); }
    catch { setAccess({ authenticated: false, configured: null, loading: false, error: 'Access could not be checked. Please retry.' }); }
  }, []);
  const retryService = useCallback(async () => {
    setHealthError(null);
    setHealth(null);
    try { setHealth(await getHealth()); }
    catch { setHealthError('Assistant service unavailable'); }
  }, []);
  const onUnlock = useCallback(async (passphrase) => {
    // Password POST -> HttpOnly server session; no API key or query-string credential.
    const a = await unlockAccess(passphrase);
    if (!a?.authenticated) throw new Error('The review access code was not accepted.');
    setAccess({ ...a, loading: false });
    return a;
  }, []);
  const onAuthRequired = useCallback(() => {
    sessionGeneration.current++;
    sessionRef.current = null;
    sessionPromise.current = null;
    setSession(null);
    setDocuments([]);
    setDocumentsError('');
    setAccess((a) => ({ ...a, authenticated: false, loading: false, error: null }));
  }, []);
  const loadDocuments = useCallback(async (retry = false) => {
    if (!access.authenticated) return;
    setDocumentsLoading(true);
    setDocumentsError('');
    try {
      documentPromise.current ||= (retry ? retryDocuments() : getDocuments());
      const data = await documentPromise.current;
      if (accessStateRef.current.authenticated) setDocuments(Array.isArray(data?.documents) ? data.documents : []);
    } catch (e) {
      if (e?.status === 401 || e?.code === 'unauthorized') onAuthRequired();
      else setDocumentsError('Sources could not be loaded. Retry to check their status.');
    } finally { documentPromise.current = null; setDocumentsLoading(false); }
  }, [access.authenticated, onAuthRequired]);
  useEffect(() => { if (access.authenticated) loadDocuments(); }, [access.authenticated, loadDocuments]);
  useEffect(() => {
    if (!access.authenticated || !widget || documentsLoading || documentsError) return;
    if (!documents.some((d) => /^(queued|pending|processing|ingesting|indexing|loading|retrying)$/i.test(typeof d.status === 'string' ? d.status : d.status?.state || ''))) return;
    const timer = setTimeout(() => loadDocuments(), 5000);
    return () => clearTimeout(timer);
  }, [access.authenticated, widget, documents, documentsLoading, documentsError, loadDocuments]);

  const ensureSession = useCallback(async () => {
    if (!access.authenticated) throw new Error('Sign in with your review access code first.');
    if (sessionRef.current?.sessionId) return sessionRef.current;
    if (!sessionPromise.current) {
      const generation = sessionGeneration.current;
      const promise = createSession(externalUserIdRef.current).then((s) => {
        if (generation !== sessionGeneration.current) throw new Error('The session was reset. Send your question again.');
        const next = { sessionId: s.sessionId, externalUserId: s.externalUserId || externalUserIdRef.current, ts: Date.now() };
        sessionRef.current = next;
        setSession(next);
        return next;
      }).finally(() => { if (sessionPromise.current === promise) sessionPromise.current = null; });
      sessionPromise.current = promise;
    }
    return sessionPromise.current;
  }, [access.authenticated]);
  const resetSession = useCallback(() => {
    sessionGeneration.current++;
    sessionRef.current = null;
    sessionPromise.current = null;
    externalUserIdRef.current = newExternalUserId();
    setSession(null);
  }, []);
  const closeWidget = useCallback(() => {
    const closing = widget;
    setWidget(null);
    requestAnimationFrame(() => {
      const target = returnFocusRef.current?.isConnected ? returnFocusRef.current : workspaceRef.current?.querySelector(`[data-testid="dock-${closing || 'chat'}"]`);
      target?.focus?.({ preventScroll: true });
    });
  }, [widget]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && widget && !document.fullscreenElement && e.target?.closest?.('.workspace-companion')) {
        e.preventDefault(); closeWidget();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [widget, closeWidget]);
  const openWidget = (w, e) => {
    if (!widget) returnFocusRef.current = e?.currentTarget || document.activeElement;
    setWidget(w);
  };
  const onAskSlide = useCallback((n) => {
    returnFocusRef.current = document.activeElement;
    setAskRequest({ id: ++requestCounter.current, documentSlug: 'executive-presentation', slide: n, prompt: `Explain slide ${n} and cite the source.` });
    setWidget('chat');
  }, []);
  const stacked = workspaceWidth > 0 ? workspaceWidth < 1060 : window.matchMedia('(max-width: 1100px)').matches;
  const maxCompanionWidth = Math.min(420, Math.max(300, Math.floor(workspaceWidth - 738)));
  const effectiveWidth = Math.min(companionWidth, maxCompanionWidth);
  const configured = health ? health.configured : null;

  return (
    <div className={`app athar-workspace ${widget ? `widget-${widget}` : ''}`}>
      <header className="top">
        <div className="brand"><span className="brand-title">Athar JV</span><span className="brand-sub">ODA × AIREV · {OVERVIEW.period}</span></div>
        <Tabs active={tab} onChange={setTab} />
        <div className="top-status" aria-live="polite"><span className={`status ${access.authenticated ? 'ok' : ''}`}><i />{access.authenticated ? 'Review access' : 'Presentation'}</span></div>
      </header>
      <main className="main">
        <div ref={workspaceRef} className={`presentation-workspace ${widget ? 'has-companion' : ''} ${stacked ? 'is-stacked' : ''}`} style={{ '--companion-width': `${effectiveWidth}px`, '--companion-log-height': `${companionHeight}px` }} data-testid="presentation-workspace" data-layout={stacked ? 'stacked' : 'columns'}>
          <div className="workspace-primary">
            <section id="panel-deck" role="tabpanel" aria-labelledby="tab-deck" hidden={tab !== 'deck'} className="tab-panel"><ErrorBoundary name="Presentation">{tab === 'deck' && <DeckTab onAskSlide={onAskSlide} />}</ErrorBoundary></section>
            <section id="panel-timeline" role="tabpanel" aria-labelledby="tab-timeline" hidden={tab !== 'timeline'} className="tab-panel"><ErrorBoundary name="Timeline">{tab === 'timeline' && <TimelineTab />}</ErrorBoundary></section>
          </div>
          <aside className={`workspace-companion ${widget ? 'is-open' : 'is-collapsed'}`} aria-label="Presentation companion" data-testid="presentation-companion">
            {!widget && <div className="companion-teaser"><p>Explore with the companion<small>{access.authenticated ? 'Ask a question, inspect a source, or continue by voice.' : 'Review access unlocks document questions and voice. The presentation stays open.'}</small></p><div className="companion-actions"><button className="dock-btn" onClick={(e) => openWidget('voice', e)} aria-expanded="false" aria-controls="voice-widget" aria-label="Advanced Voice Mode" data-testid="dock-voice"><MicIcon /><span>Voice</span></button><button className="dock-btn" onClick={(e) => openWidget('chat', e)} aria-expanded="false" aria-controls="chat-widget" aria-label="Ask the plan" data-testid="dock-chat"><ChatIcon /><span>Ask the plan</span></button></div></div>}
            <div className="companion-shell" hidden={!widget} inert={!widget ? '' : undefined}>
              <div className="companion-switcher" role="group" aria-label="Companion mode">
                <button className={`dock-btn ${widget === 'chat' ? 'active' : ''}`} onClick={(e) => openWidget('chat', e)} aria-expanded={widget === 'chat'} aria-controls="chat-widget" aria-label="Ask the plan" data-testid={widget ? 'dock-chat' : undefined}><ChatIcon /><span>Ask the plan</span></button>
                <button className={`dock-btn ${widget === 'voice' ? 'active' : ''}`} onClick={(e) => openWidget('voice', e)} aria-expanded={widget === 'voice'} aria-controls="voice-widget" aria-label="Advanced Voice Mode" data-testid={widget ? 'dock-voice' : undefined}><MicIcon /><span>Voice</span></button>
              </div>
              {widget && <div className="companion-resize"><label htmlFor="companion-size">{stacked ? 'Reading height' : 'Panel width'}</label><input id="companion-size" type="range" min={stacked ? 220 : 300} max={stacked ? 640 : maxCompanionWidth} step={stacked ? 20 : 10} value={stacked ? companionHeight : effectiveWidth} onChange={(e) => stacked ? setCompanionHeight(Number(e.target.value)) : setCompanionWidth(Number(e.target.value))} aria-label={stacked ? 'Companion reading height' : 'Companion width'} aria-valuetext={`${stacked ? companionHeight : effectiveWidth} pixels`} /><output htmlFor="companion-size">{stacked ? companionHeight : effectiveWidth}px</output></div>}
              <ErrorBoundary name="Chat"><ChatWidget open={widget === 'chat'} onClose={closeWidget} ensureSession={ensureSession} session={session} resetSession={resetSession} configured={configured} serviceError={healthError} onRetryService={retryService} access={access} onUnlock={onUnlock} onRetryAccess={retryAccess} onAuthRequired={onAuthRequired} documents={documents} documentsLoading={documentsLoading} documentsError={documentsError} onRefreshDocuments={() => loadDocuments()} onRetryDocuments={() => loadDocuments(true)} askRequest={askRequest} /></ErrorBoundary>
              <div hidden={widget !== 'voice'} inert={widget !== 'voice' ? '' : undefined}>
                {!access.authenticated ? <section className="widget voice-widget open" id="voice-widget" aria-labelledby="voice-widget-title" data-testid="voice-widget"><header className="widget-head"><div><h2 id="voice-widget-title">Advanced Voice Mode</h2><p className="widget-sub">Sign in first to use the existing voice companion.</p></div><button className="icon-btn" onClick={closeWidget} aria-label="Close voice mode" data-testid="voice-close">×</button></header><AccessGate access={access} onUnlock={onUnlock} onRetry={retryAccess} context="voice" active={widget === 'voice'} /></section> : <ErrorBoundary name="Advanced Voice Mode"><VoiceWidget open={widget === 'voice'} onClose={closeWidget} ensureSession={ensureSession} session={session} configured={configured === true} health={health} initialQuestion={initialVoiceQuestion} /></ErrorBoundary>}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <footer className="foot"><span>Private &amp; Confidential · ODA × AIREV — Athar JV</span><span>Powered by On Demand · Chat API · Services API · Agents Flow Builder</span></footer>
    </div>
  );
}
