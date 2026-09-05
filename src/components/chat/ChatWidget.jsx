import React, { useCallback, useEffect, useRef, useState } from 'react';
import { askQuestion } from '../../lib/api.js';

// Minimal, dependency-free Markdown rendering (bold, inline code, bullets, numbered lists, headings).
function inline(text) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m;
  const clean = (value) => value.replace(/\\([\\`*_{}\[\]()#+!|])/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(clean(text.slice(last, m.index)));
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<strong key={m.index}>{clean(tok.slice(2, -2))}</strong>);
    else parts.push(<code key={m.index}>{clean(tok.slice(1, -1))}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(clean(text.slice(last)));
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
      if (!list || list.type !== 'ul') { flush(); list = { type: 'ul', items: [] }; }
      list.items.push(m[1]);
    } else if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) {
      if (!list || list.type !== 'ol') { flush(); list = { type: 'ol', items: [] }; }
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

/**
 * Plain chat: a scrollable message thread and a text input with a Send button. Nothing else —
 * no scope toggles, starter cards, citation panels or rails. Every reply is a grounded answer
 * from the three review documents; failures are shown as a message in the thread, never as a blank.
 */
export default function ChatWidget({ open = true, ensureSession, resetSession, prefill = null, onPrefillConsumed, autoAsk = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const busyRef = useRef(false);
  const autoAskDone = useRef(false);

  // No abort-on-unmount effect: React StrictMode's simulated unmount would cancel the first in-flight question in dev.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
  }, [messages]);
  useEffect(() => {
    if (!prefill?.text) return;
    setInput(prefill.text);
    onPrefillConsumed?.(prefill.id);
    inputRef.current?.focus({ preventScroll: true });
  }, [prefill?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (id, fn) => setMessages((prev) => prev.map((m) => m.id === id ? { ...m, ...fn(m) } : m));

  const send = useCallback(async (text) => {
    const query = (text ?? input).trim();
    if (!query || busyRef.current) return;
    busyRef.current = true;
    setInput('');
    setBusy(true);
    const botId = uid();
    setMessages((prev) => [...prev,
      { id: uid(), role: 'user', text: query, ts: Date.now() },
      { id: botId, role: 'assistant', text: '', status: 'pending', ts: Date.now(), query, citations: [] },
    ]);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      let session = await ensureSession();
      let result;
      try {
        result = await askQuestion({ sessionId: session.sessionId, query, signal: ac.signal });
      } catch (e) {
        // A conversation the server no longer knows (restart, expiry) is restarted transparently.
        if (e?.status === 404 && resetSession) { resetSession(); session = await ensureSession(); result = await askQuestion({ sessionId: session.sessionId, query, signal: ac.signal }); }
        else throw e;
      }
      const answer = typeof result?.answer === 'string' && result.answer.trim() ? result.answer.trim() : 'The service returned an empty reply. Please send the question again.';
      patch(botId, () => ({ text: answer, status: result?.answer?.trim() ? 'done' : 'error', citations: Array.isArray(result?.citations) ? result.citations : [], grounding: result?.grounding || null }));
    } catch (e) {
      if (e?.name === 'AbortError') patch(botId, () => ({ status: 'error', text: 'The request was stopped. Send the question again.' }));
      else patch(botId, () => ({ status: 'error', text: e?.message || 'The request could not be completed. Please retry.' }));
    } finally {
      busyRef.current = false;
      setBusy(false);
      abortRef.current = null;
    }
  }, [input, ensureSession, resetSession]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
  };
  // Questions passed in the URL (#chat?q=…) are sent once, in order, each after the previous answer arrived.
  useEffect(() => {
    if (autoAskDone.current || !Array.isArray(autoAsk) || !autoAsk.length) return;
    autoAskDone.current = true; // the ref (not an effect cleanup) guards StrictMode's double-invoked effect, so the sequence always completes
    (async () => { for (const question of autoAsk) await send(question); })();
  }, [autoAsk]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className={`widget chat-widget ${open ? 'open' : ''}`} id="chat-widget" role="region" aria-labelledby="chat-widget-title" aria-hidden={!open} hidden={!open} inert={open ? undefined : ''} data-testid="chat-widget">
      <header className="widget-head"><div><h2 id="chat-widget-title">Ask AI</h2><p className="widget-sub">Answers come from the three Athar JV review documents.</p></div></header>
      <div className="chat-list" ref={listRef} role="log" aria-live="polite" aria-relevant="additions text" aria-label="Conversation" data-testid="chat-thread">
        {messages.length === 0 && <p className="chat-empty muted small" data-testid="chat-empty">Ask a question about the financial model, the executive summary or the six-month implementation plan.</p>}
        {messages.map((m) => <div key={m.id} className={`msg ${m.role} ${m.status || ''}`} data-testid={`chat-message-${m.role}`} data-status={m.status || 'done'}><div className="bubble">
          {m.role === 'user' ? <p>{m.text}</p> : m.status === 'pending' ? <div className="typing" aria-label="Preparing an answer"><span /><span /><span /></div> : <>
            <Markdown text={m.text} />
            {m.status === 'error' && <div className="msg-error" role="alert"><button className="btn small" onClick={() => send(m.query)} disabled={busy}>Retry</button></div>}
            {m.citations?.length > 0 && <p className="msg-meta" data-testid="chat-sources">Sources: {m.citations.map((c) => c.label).join(' · ')}</p>}
          </>}
        </div></div>)}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea ref={inputRef} rows={2} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} placeholder="Ask about the Athar JV documents…" aria-label="Your message" data-testid="chat-input" />
        {busy ? <button type="button" className="btn small" onClick={() => abortRef.current?.abort()} aria-label="Stop">Stop</button>
          : <button type="submit" className="btn small accent" disabled={!input.trim()} aria-label="Send" data-testid="chat-send">Send</button>}
      </form>
    </section>
  );
}
