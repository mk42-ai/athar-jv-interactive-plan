import React, { useCallback, useEffect, useRef, useState } from 'react';
import { streamChat } from '../../lib/api.js';
import { SUGGESTED_QUESTIONS } from '../../lib/plan.js';

// Minimal, dependency-free Markdown rendering (bold, inline code, bullets, numbered lists, headings).
function inline(text) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<strong key={m.index}>{tok.slice(2, -2)}</strong>);
    else parts.push(<code key={m.index}>{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ text }) {
  const lines = (text || '').split('\n');
  const out = [];
  let list = null; // { type: 'ul'|'ol', items: [] }
  const flush = () => {
    if (!list) return;
    const Tag = list.type;
    out.push(<Tag key={`l${out.length}`}>{list.items.map((it, i) => <li key={i}>{inline(it)}</li>)}</Tag>);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    let m;
    if ((m = /^\s*[-*•]\s+(.*)$/.exec(line))) {
      if (!list || list.type !== 'ul') {
        flush();
        list = { type: 'ul', items: [] };
      }
      list.items.push(m[1]);
    } else if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) {
      if (!list || list.type !== 'ol') {
        flush();
        list = { type: 'ol', items: [] };
      }
      list.items.push(m[1]);
    } else if ((m = /^\s*#{1,6}\s+(.*)$/.exec(line))) {
      flush();
      out.push(<p key={`h${out.length}`} className="md-h">{inline(m[1])}</p>);
    } else if (line.trim() === '') {
      flush();
    } else {
      flush();
      out.push(<p key={`p${out.length}`}>{inline(line)}</p>);
    }
  }
  flush();
  return <div className="md">{out}</div>;
}

let idc = 0;
const uid = () => `${Date.now().toString(36)}-${idc++}`;

export default function ChatWidget({ open, onClose, ensureSession, session, resetSession, configured }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 320);
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const patch = (id, fn) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...fn(m) } : m)));

  const send = useCallback(
    async (text) => {
      const query = (text ?? input).trim();
      if (!query || busy) return;
      setInput('');
      setBusy(true);
      const userId = uid();
      const botId = uid();
      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', text: query, ts: Date.now() },
        { id: botId, role: 'assistant', text: '', status: 'pending', ts: Date.now(), query },
      ]);
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const s = await ensureSession();
        patch(botId, () => ({ sessionId: s.sessionId }));
        let gotDelta = false;
        await streamChat({
          sessionId: s.sessionId,
          query,
          voice: false,
          signal: ac.signal,
          onEvent: (ev) => {
            if (ev.type === 'delta') {
              gotDelta = true;
              patch(botId, (m) => ({ text: m.text + ev.text, status: 'streaming' }));
            } else if (ev.type === 'done') {
              patch(botId, (m) => ({ text: ev.answer && ev.answer.length > m.text.length ? ev.answer : m.text, status: 'done', messageId: ev.messageId }));
            } else if (ev.type === 'metrics') {
              patch(botId, () => ({ metrics: ev.metrics }));
            } else if (ev.type === 'error') {
              patch(botId, (m) => ({ status: 'error', error: ev.message || 'Request failed', text: m.text }));
            }
          },
        });
        patch(botId, (m) => (m.status === 'error' ? {} : { status: 'done', text: m.text || (gotDelta ? m.text : m.text) }));
        setMessages((prev) =>
          prev.map((m) => (m.id === botId && m.status !== 'error' && !m.text ? { ...m, status: 'error', error: 'The assistant returned an empty answer.' } : m))
        );
      } catch (e) {
        if (e.name === 'AbortError') patch(botId, (m) => ({ status: m.text ? 'done' : 'error', error: m.text ? undefined : 'Cancelled' }));
        else patch(botId, () => ({ status: 'error', error: e.message || 'Network error' }));
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [input, busy, ensureSession]
  );

  const cancel = () => abortRef.current?.abort();
  const retry = (m) => {
    setMessages((prev) => prev.filter((x) => x.id !== m.id && !(x.role === 'user' && x.text === m.query && prev.indexOf(x) === prev.indexOf(m) - 1)));
    send(m.query);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const disabled = configured === false;
  const quick = SUGGESTED_QUESTIONS.slice(0, 3);

  return (
    <section className={`widget chat-widget ${open ? 'open' : ''}`} id="chat-widget" role="dialog" aria-modal="false" aria-labelledby="chat-widget-title" aria-hidden={!open} data-testid="chat-widget">
      <header className="widget-head">
        <div>
          <h2 id="chat-widget-title">Ask the plan</h2>
          <p className="widget-sub">{session?.sessionId ? `Grounded · session ${session.sessionId.slice(-6)}` : 'Grounded on the full Sep 2026 – Mar 2027 plan'}</p>
        </div>
        <div className="widget-actions">
          {session?.sessionId && (
            <button className="icon-btn" onClick={() => { resetSession(); setMessages([]); }} aria-label="Start a new session" title="New session">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5" /></svg>
            </button>
          )}
          <button className="icon-btn" onClick={onClose} aria-label="Close chat" data-testid="chat-close">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </header>

      <div className="chat-list" ref={listRef} role="log" aria-live="polite" aria-relevant="additions text">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="muted small">Gates, weeks, anchors, seat economics, products, governance — answers cite the plan.</p>
            <div className="chips">
              {quick.map((q) => (
                <button key={q} className="chip" onClick={() => send(q)} disabled={disabled || busy}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role} ${m.status || ''}`}>
            <div className="bubble">
              {m.role === 'user' ? (
                <p>{m.text}</p>
              ) : m.status === 'pending' ? (
                <div className="typing" aria-label="Assistant is typing"><span /><span /><span /></div>
              ) : (
                <>
                  {m.text && <Markdown text={m.text} />}
                  {m.status === 'streaming' && <span className="caret" aria-hidden="true" />}
                  {m.status === 'error' && (
                    <div className="msg-error" role="alert">
                      <span>{m.error}</span>
                      <button className="btn small" onClick={() => retry(m)}>Retry</button>
                    </div>
                  )}
                  {m.status === 'done' && m.metrics && <div className="msg-meta">grounded · {m.metrics.fulfillmentTimeSec}s</div>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={disabled ? 'Chat unavailable — server key missing' : 'Ask about the plan…'}
          disabled={disabled}
          aria-label="Your question"
        />
        {busy ? (
          <button type="button" className="btn small" onClick={cancel}>Stop</button>
        ) : (
          <button type="submit" className="btn small accent" disabled={disabled || !input.trim()} aria-label="Send">Send</button>
        )}
      </form>
    </section>
  );
}
