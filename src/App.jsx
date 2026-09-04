import React, { useCallback, useEffect, useRef, useState } from 'react';
import Tabs, { TABS } from './components/Tabs.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import DeckTab from './components/deck/DeckTab.jsx';
import TimelineTab from './components/timeline/TimelineTab.jsx';
import ChatWidget from './components/chat/ChatWidget.jsx';
import VoiceWidget from './components/voice/VoiceWidget.jsx';
import { createSession, getHealth } from './lib/api.js';
import { OVERVIEW } from './lib/plan.js';

const LS_KEY = 'athar-jv-session-v1';

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s && s.sessionId && s.externalUserId && Date.now() - (s.ts || 0) < 6 * 3600 * 1000) return s;
  } catch {}
  return null;
}
const newExternalUserId = () => `athar-web-${(crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).slice(0, 12)}`;

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A8 8 0 1 1 21 12z" /></svg>
);
const MicIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
);

export default function App() {
  // Deep links: #deck | #timeline | #chat | #voice | #voice?q=<question>
  const [{ initialTab, initialWidget, initialVoiceQuestion }] = useState(() => {
    const raw = (location.hash || '').replace(/^#/, '');
    const [h, qs] = raw.split('?');
    const q = qs ? new URLSearchParams(qs).get('q') : null;
    const tab = TABS.some((t) => t.id === h) ? h : 'deck';
    const widget = h === 'chat' || h === 'voice' ? h : null;
    return { initialTab: tab, initialWidget: widget, initialVoiceQuestion: h === 'voice' && q ? q : null };
  });
  const [tab, setTab] = useState(initialTab);
  const [widget, setWidget] = useState(initialWidget); // null | 'chat' | 'voice'
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(null);
  const [session, setSession] = useState(() => loadStoredSession());
  const externalUserIdRef = useRef(session?.externalUserId || newExternalUserId());
  const sessionPromise = useRef(null);

  useEffect(() => {
    let alive = true;
    getHealth().then((h) => alive && setHealth(h)).catch((e) => alive && setHealthError(e.message));
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    history.replaceState(null, '', `#${tab}`);
  }, [tab]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && widget && setWidget(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [widget]);

  // One On Demand chat session shared by the chat widget and voice mode (created lazily).
  const ensureSession = useCallback(async () => {
    if (session?.sessionId) return session;
    if (!sessionPromise.current) {
      sessionPromise.current = createSession(externalUserIdRef.current)
        .then((s) => {
          const next = { sessionId: s.sessionId, externalUserId: s.externalUserId || externalUserIdRef.current, ts: Date.now() };
          setSession(next);
          try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
          return next;
        })
        .finally(() => { sessionPromise.current = null; });
    }
    return sessionPromise.current;
  }, [session]);
  const resetSession = useCallback(() => {
    setSession(null);
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  const configured = health ? health.configured : null;
  const toggle = (w) => setWidget((cur) => (cur === w ? null : w));

  return (
    <div className={`app ${widget ? `widget-${widget}` : ''}`}>
      <header className="top">
        <div className="brand">
          <span className="brand-title">Athar JV</span>
          <span className="brand-sub">ODA × AIREV · {OVERVIEW.period}</span>
        </div>
        <Tabs active={tab} onChange={setTab} />
        <div className="top-status" aria-live="polite">
          {health && <span className={`status ${configured ? 'ok' : 'warn'}`}><i /> {configured ? 'Live' : 'Key missing'}</span>}
          {healthError && <span className="status warn"><i /> Proxy unreachable</span>}
        </div>
      </header>

      {configured === false && (
        <div className="banner" role="alert">The server has no <code>ON_DEMAND_API_KEY</code> configured, so chat and voice are disabled. Set it in the server environment (never in the client bundle) and restart.</div>
      )}

      <main className="main">
        <section id="panel-deck" role="tabpanel" aria-labelledby="tab-deck" hidden={tab !== 'deck'} className="tab-panel">
          <ErrorBoundary name="Presentation">{tab === 'deck' && <DeckTab />}</ErrorBoundary>
        </section>
        <section id="panel-timeline" role="tabpanel" aria-labelledby="tab-timeline" hidden={tab !== 'timeline'} className="tab-panel">
          <ErrorBoundary name="Timeline">{tab === 'timeline' && <TimelineTab />}</ErrorBoundary>
        </section>
      </main>

      <footer className="foot">
        <span>Private &amp; Confidential · ODA × AIREV — Athar JV</span>
        <span>Powered by On Demand · Chat API · Services API · Agents Flow Builder</span>
      </footer>

      {/* Floating dock: compact chat + minimal voice control */}
      <div className="dock" role="group" aria-label="Assistants">
        <button className={`dock-btn ${widget === 'voice' ? 'active' : ''}`} onClick={() => toggle('voice')} aria-expanded={widget === 'voice'} aria-controls="voice-widget" aria-label="Advanced Voice Mode" data-testid="dock-voice"><MicIcon /><span>Voice</span></button>
        <button className={`dock-btn ${widget === 'chat' ? 'active' : ''}`} onClick={() => toggle('chat')} aria-expanded={widget === 'chat'} aria-controls="chat-widget" aria-label="Ask the plan" data-testid="dock-chat"><ChatIcon /><span>Ask</span></button>
      </div>
      <ErrorBoundary name="Chat">
        <ChatWidget open={widget === 'chat'} onClose={() => setWidget(null)} ensureSession={ensureSession} session={session} resetSession={resetSession} configured={configured} />
      </ErrorBoundary>
      <ErrorBoundary name="Advanced Voice Mode">
        <VoiceWidget open={widget === 'voice'} onClose={() => setWidget(null)} ensureSession={ensureSession} session={session} configured={configured} health={health} initialQuestion={initialVoiceQuestion} />
      </ErrorBoundary>
    </div>
  );
}
