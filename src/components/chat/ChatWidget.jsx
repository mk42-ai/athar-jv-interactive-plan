import React, { useCallback, useEffect, useRef, useState } from 'react';
import { streamChat, getCitation } from '../../lib/api.js';
import SourceViewer from './SourceViewer.jsx';

// Minimal, dependency-free Markdown rendering (bold, inline code, bullets, numbered lists, headings).
function inline(text) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]\n]+\]\(\/api\/citations\/[A-Za-z0-9_-]+\))/g;
  let last = 0, m;
  const clean = (value) => value.replace(/\\([\\`*_{}\[\]()#+!|])/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(clean(text.slice(last, m.index)));
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<strong key={m.index}>{clean(tok.slice(2, -2))}</strong>);
    else if (tok.startsWith('`')) parts.push(<code key={m.index}>{clean(tok.slice(1, -1))}</code>);
    else { const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok); parts.push(<a key={m.index} href={link[2]} className="inline-citation" target="_blank" rel="noreferrer">{clean(link[1])}</a>); }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(clean(text.slice(last)));
  return parts;
}

// Answer sections rendered by the server (see server/evidenceAnswer.js renderEvidenceAnswer):
// stated source facts vs derived (server-computed) calculations vs conflicts vs missing evidence.
const SECTION_KIND = { 'source facts': 'stated', 'derived calculations': 'derived', 'source conflicts': 'conflict', 'not established by the selected evidence': 'missing', 'sources': 'sources', 'coverage': 'coverage' };
const SECTION_TAG = { stated: 'Stated in source', derived: 'Derived · server-computed', conflict: 'Conflict', missing: 'Missing', sources: 'Open source', coverage: 'Coverage' };

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
      const kind = SECTION_KIND[m[1].trim().toLowerCase()] || '';
      out.push(<p key={`h${out.length}`} className={`md-h ${kind ? `md-h-${kind}` : ''}`} data-section={kind || undefined}>{kind && <span className={`evidence-tag ${kind}`} aria-hidden="true">{SECTION_TAG[kind]}</span>}{inline(m[1])}</p>);
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

const QUICK_QUESTIONS = [
  'Compare the UAE base case with international expansion.',
  'What capital decisions still need agreement?',
  'Which implementation milestones depend on those decisions?',
];
const describe = (value) => {
  if (value == null) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.map(describe).filter(Boolean).join(' · ');
  return Object.entries(value).map(([key, v]) => `${key.replace(/_/g, ' ')}: ${describe(v)}`).join(' · ');
};
const coverageSummary = (doc) => {
  const c = doc.coverage || {};
  if (doc.kind === 'pdf') return `${c.pages || 0} pages · complete text extraction`;
  if (doc.kind === 'pptx') return `${c.slides || 0} slides · ${c.notes || 0} speaker-note parts`;
  return `${Array.isArray(c.sheets) ? c.sheets.length : 0} sheets · ${(c.cellCount || 0).toLocaleString()} cells · ${(c.formulaCount || 0).toLocaleString()} formulas${c.missingFormulaCaches ? ` · ${c.missingFormulaCaches} missing saved results` : ''}`;
};
const documentStatus = (doc) => typeof doc.status === 'string' ? doc.status : doc.status?.state || doc.status?.status || 'Unknown';
const UNAVAILABLE = /^(error|failed|pending|queued|processing|ingesting|indexing|loading|unavailable|missing)$/i;
const isMissing = (doc) => /^missing$/i.test(documentStatus(doc));
const kindLabel = { pdf: 'PDF', pptx: 'PowerPoint', xlsx: 'Workbook (XLSX)', docx: 'Word' };
const statusLabel = (doc) => isMissing(doc) ? 'Missing — not provisioned' : documentStatus(doc) === 'ready' ? 'Indexed' : documentStatus(doc);
export default function ChatWidget({ open, onClose, ensureSession, session, resetSession, configured, serviceError, onRetryService, documents = [], documentsLoading, documentsError, onRefreshDocuments, onRetryDocuments, askRequest }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [documentId, setDocumentId] = useState('all');
  const [lastDocumentId, setLastDocumentId] = useState(null);
  const [documentSlug, setDocumentSlug] = useState(null);
  const [slide, setSlide] = useState(null);
  const [citationState, setCitationState] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const citationPanelRef = useRef(null);
  const abortRef = useRef(null);
  const busyRef = useRef(false);
  const requestSeen = useRef(null);
  const focusCitationRef = useRef(null);
  const citationVersion = useRef(0);

  useEffect(() => {
    if (!open || window.matchMedia('(max-width: 640px)').matches) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 1100px)').matches) inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);
  useEffect(() => () => { abortRef.current?.abort(); citationVersion.current++; }, []);
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
  }, [messages]); // Switching views must not discard the reader's conversation scroll.

  useEffect(() => {
    if (!askRequest || requestSeen.current === askRequest.id) return;
    requestSeen.current = askRequest.id;
    const doc = documents.find((d) => d.slug === askRequest.documentSlug && !UNAVAILABLE.test(documentStatus(d)));
    // The deck itself is not one of the three indexed documents: a slide ask searches ALL documents and keeps the
    // slide number in the question instead of a slide filter (which needs an indexed presentation document).
    setDocumentSlug(doc ? askRequest.documentSlug : null);
    setDocumentId(doc?.id || 'all');
    if (doc?.id) setLastDocumentId(doc.id);
    setSlide(doc ? (askRequest.slide ?? null) : null);
    setInput(askRequest.prompt || '');
    setCitationState(null);
    citationVersion.current++;
    inputRef.current?.focus({ preventScroll: true });
  }, [askRequest, documents]);
  useEffect(() => {
    if (!documentSlug) return;
    const doc = documents.find((d) => d.slug === documentSlug);
    setDocumentId(doc?.id || null); // never broaden a missing requested source to all documents
    if (doc?.id) setLastDocumentId(doc.id);
  }, [documentSlug, documents]);

  useEffect(() => {
    if (!open || !citationState?.id) return;
    citationPanelRef.current?.focus({ preventScroll: true });
    citationPanelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [citationState?.id]); // Restoring the Ask AI view must not jump to a previously opened citation.

  const selectedDocument = documents.find((d) => d.id === documentId);
  const sourceMissing = !documentId || (documentId !== 'all' && !selectedDocument);
  const sourceUnavailable = selectedDocument && UNAVAILABLE.test(documentStatus(selectedDocument));
  const allUnavailable = documentId === 'all' && documents.length > 0 && documents.every((d) => UNAVAILABLE.test(documentStatus(d)));
  const indexedDocuments = documents.filter((d) => !UNAVAILABLE.test(documentStatus(d)));
  const missingDocuments = documents.filter(isMissing);
  const disabled = configured !== true || sourceMissing || sourceUnavailable || allUnavailable || documents.length === 0;
  const patch = (id, fn) => setMessages((prev) => prev.map((m) => m.id === id ? { ...m, ...fn(m) } : m));
  const prefill = (text) => { setInput(text); inputRef.current?.focus({ preventScroll: true }); };
  const chooseDocument = (id) => {
    setDocumentSlug(null);
    setDocumentId(id);
    if (id && id !== 'all') setLastDocumentId(id);
    setSlide(null);
    setCitationState(null);
    citationVersion.current++;
  };
  const askDocument = (doc) => {
    chooseDocument(doc.id);
    prefill('Summarize this document and cite the relevant evidence.');
    // A deliberate source action on a narrow screen brings the in-flow composer into view.
    inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const send = useCallback(async (text) => {
    const query = (text ?? input).trim();
    if (!query || busyRef.current || disabled) return;
    busyRef.current = true;
    setInput('');
    setBusy(true);
    const botId = uid();
    const context = { documentId, slide };
    setMessages((prev) => [...prev,
      { id: uid(), role: 'user', text: query, ts: Date.now(), context },
      { id: botId, role: 'assistant', text: '', status: 'pending', ts: Date.now(), query, context, citations: [] },
    ]);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const s = await ensureSession();
      if (ac.signal.aborted) { const e = new Error('Cancelled'); e.name = 'AbortError'; throw e; }
      patch(botId, () => ({ sessionId: s.sessionId }));
      await streamChat({
        sessionId: s.sessionId, query, voice: false, documentId: context.documentId, slide: context.slide, signal: ac.signal,
        onEvent: (ev) => {
          if (ac.signal.aborted) return;
          if (ev.type === 'delta') patch(botId, (m) => ({ text: m.text + (ev.text || ''), status: 'streaming' }));
          else if (ev.type === 'done') patch(botId, (m) => ({ text: typeof ev.answer === 'string' ? ev.answer : m.text, status: 'done', messageId: ev.messageId, citations: Array.isArray(ev.citations) ? ev.citations : [], grounding: ev.grounding || null }));
          else if (ev.type === 'metrics') patch(botId, () => ({ metrics: ev.metrics }));
          else if (ev.type === 'error') {
            patch(botId, () => ({ status: 'error', error: ev.message || 'The request could not be completed.' }));
          }
        },
      });
      patch(botId, (m) => m.status === 'error' ? {} : m.text ? { status: 'done' } : { status: 'error', error: 'The assistant returned an empty answer. Please retry.' });
    } catch (e) {
      if (e.name === 'AbortError') patch(botId, (m) => ({ status: m.text ? 'stopped' : 'error', error: m.text ? undefined : 'Response stopped. You can send the question again.' }));
      else patch(botId, () => ({ status: 'error', error: e.message || 'Network error. Please retry.' }));
    } finally {
      busyRef.current = false;
      setBusy(false);
      abortRef.current = null;
    }
  }, [input, disabled, ensureSession, documentId, slide]);

  const openCitation = async (citation, trigger) => {
    if (citationState?.id === citation.id && citationState?.status !== 'error') {
      setCitationState(null); citationVersion.current++; return;
    }
    focusCitationRef.current = trigger || focusCitationRef.current;
    const version = ++citationVersion.current;
    setCitationState({ id: citation.id, status: 'loading', citation });
    try {
      const data = await getCitation(citation.id);
      if (version === citationVersion.current) setCitationState({ id: citation.id, status: 'ready', citation, data });
    } catch {
      if (version === citationVersion.current) setCitationState({ id: citation.id, status: 'error', citation });
    }
  };
  const closeCitation = () => { citationVersion.current++; setCitationState(null); focusCitationRef.current?.focus?.({ preventScroll: true }); };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
  };
  const newSession = () => {
    if (busyRef.current) return;
    resetSession(); setMessages([]); setCitationState(null); citationVersion.current++;
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <section ref={rootRef} className={`widget chat-widget ${open ? 'open' : ''}`} id="chat-widget" role="region" aria-labelledby="chat-widget-title" aria-hidden={!open} hidden={!open} inert={open ? undefined : ''} data-testid="chat-widget">
      <header className="widget-head"><div><h2 id="chat-widget-title">Ask AI</h2><p className="widget-sub">One conversation · answers with source evidence · no sign-in</p></div><div className="widget-actions">
        {session?.sessionId && <button className="icon-btn" onClick={newSession} disabled={busy} aria-label="Start a new session" title="New session">↻</button>}
        <button className="icon-btn" onClick={onClose} aria-label="Close chat" data-testid="chat-close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
      </div></header>
      <>
        <div className="chat-context">
          <fieldset className="chat-scope" data-testid="chat-scope-controls">
            <legend>Answer scope</legend>
            <div className="chat-scope-options">
              <label><input type="radio" name="chat-answer-scope" value="this" checked={documentId !== 'all'} onChange={() => chooseDocument(indexedDocuments.find((doc) => doc.id === lastDocumentId)?.id || indexedDocuments.find((doc) => doc.slug === 'executive-presentation')?.id || indexedDocuments[0]?.id || null)} /><span>This document</span></label>
              <label><input type="radio" name="chat-answer-scope" value="all" checked={documentId === 'all'} onChange={() => chooseDocument('all')} /><span>All documents</span></label>
            </div>
          </fieldset>
          <label htmlFor="chat-document-filter">Document</label>
          <select id="chat-document-filter" value={documentId === 'all' ? '__choose__' : documentId || '__pending__'} onChange={(e) => chooseDocument(e.target.value)} data-testid="chat-document-filter" aria-describedby="chat-source-note">
            <option value="__choose__" disabled>Choose a document…</option>
            {sourceMissing && <option value={documentId || '__pending__'} disabled>{documentSlug === 'executive-presentation' ? 'Waiting for presentation source…' : 'Selected source unavailable'}</option>}
            {documents.map((doc) => <option key={doc.id} value={doc.id} disabled={isMissing(doc)}>{isMissing(doc) ? `${doc.title} — missing` : doc.title}</option>)}
          </select>
          {slide != null && <div className="chat-slide-context" data-testid="chat-slide-context"><span>Slide {slide}{sourceMissing ? ' · source pending' : ' · presentation'}</span><button onClick={() => setSlide(null)} aria-label="Clear slide context">Clear slide</button></div>}
          {documents.length > 0 && <p className="chat-coverage" data-testid="chat-coverage" role="status"><b>{indexedDocuments.length} of {documents.length}</b> documents indexed{missingDocuments.length ? <> · missing: {missingDocuments.map((d) => d.title).join(', ')}</> : ''}</p>}
          {sourceMissing && <p className="companion-note" role="status">This question is waiting for its exact source. It will not be sent against other documents.</p>}
          {sourceUnavailable && <p className="companion-note" role="status">This source is not ready for questions. Check its status below.</p>}
        </div>
        <details className="chat-documents" data-testid="chat-documents"><summary>Documents &amp; ingestion status {documents.length > 0 && `(${documents.length})`}</summary>
          {documentsLoading && <p role="status">Checking sources…</p>}
          {documentsError && <div className="chat-service-error" role="alert">{documentsError}<button className="btn small" onClick={onRefreshDocuments} disabled={documentsLoading}>Retry source status</button></div>}
          {!documentsLoading && !documentsError && !documents.length && <p role="status">No sources are available yet.</p>}
          <ul>{documents.map((doc) => <li className="chat-document" key={doc.id} data-status={documentStatus(doc).toLowerCase()} data-document-id={doc.id} data-slug={doc.slug}>
            <h3>{doc.order ? <span className="document-order" aria-hidden="true">{doc.order}</span> : null}{doc.title}</h3><span className="document-status">{statusLabel(doc)}</span>
            {doc.role && <p className="document-role">{doc.role}</p>}
            <p>{kindLabel[doc.kind] || doc.kind}{doc.alternateOriginal ? ` · indexed from its ${kindLabel[doc.alternateOriginal.indexedKind] || doc.alternateOriginal.indexedKind} rendering (${kindLabel[doc.alternateOriginal.expectedKind] || doc.alternateOriginal.expectedKind} original not provisioned)` : ''}</p>
            {doc.coverage && <p><b>Coverage:</b> {coverageSummary(doc)}</p>}
            {doc.provisioning?.signedUrl?.configured && <p><b>Source link:</b> configured on the server{doc.provisioning.signedUrl.expiresAt ? ` · expires ${new Date(doc.provisioning.signedUrl.expiresAt).toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} UTC` : ''}{doc.provisioning.signedUrl.expired ? ' · expired' : ''}</p>}
            {doc.limitations && describe(doc.limitations) && <p><b>{isMissing(doc) ? 'Why it is missing:' : 'Limitations:'}</b> {describe(doc.limitations)}</p>}
            {doc.status?.error && <p role="alert">{describe(doc.status.error)}</p>}
            <div className="document-actions">{isMissing(doc) ? <span className="document-missing-note">Not askable until the original is provisioned.</span> : <button className="btn small" onClick={() => askDocument(doc)} data-testid={`ask-document-${doc.slug}`}>Ask this document</button>}{/error|failed|unavailable/i.test(documentStatus(doc)) && <button className="btn small" onClick={onRetryDocuments} disabled={documentsLoading}>Retry ingestion</button>}</div>
          </li>)}</ul>
          <div className="document-actions"><button className="btn small" onClick={onRefreshDocuments} disabled={documentsLoading}>Refresh status</button><button className="btn small" onClick={onRetryDocuments} disabled={documentsLoading} data-testid="retry-documents">Retry documents</button></div>
        </details>
        {documentsError && <div className="chat-service-error" role="alert">{documentsError}<button className="btn small" onClick={onRefreshDocuments} disabled={documentsLoading}>Retry</button></div>}
        {(configured === false || serviceError) && <div className="chat-service-error" role="status">The assistant service is unavailable. Your source selection is retained; the presentation remains usable.<button className="btn small" onClick={onRetryService}>Retry connection</button></div>}
        {documentsLoading && !documents.length && <p className="companion-note" role="status">Loading the available sources…</p>}
        {!documentsLoading && !documentsError && !documents.length && <p className="companion-note" role="status">No sources are available yet. Open Documents &amp; ingestion status to retry.</p>}
        {configured == null && !serviceError && <p className="companion-note" role="status">Connecting to the assistant…</p>}
        <div className="chat-list" ref={listRef} onClick={(e) => {
          const anchor = e.target.closest?.('a.inline-citation');
          const match = anchor?.getAttribute('href')?.match(/^\/api\/citations\/([A-Za-z0-9_-]+)$/);
          if (!match) return;
          e.preventDefault();
          openCitation({ id: match[1], label: anchor.textContent }, anchor);
        }} role="log" aria-live="polite" aria-relevant="additions text" aria-label="Conversation">
          {messages.length === 0 && <div className="chat-empty"><p className="muted small">Answers quote the original page, slide or worksheet cells and open the source on request. Stated figures, server-derived calculations, version conflicts and missing evidence are labelled separately.</p><div className="chips" data-testid="starter-questions">{QUICK_QUESTIONS.map((question) => <button key={question} className="chip" onClick={() => prefill(question)} disabled={busy} data-testid="starter-question">{question}</button>)}</div></div>}
          {messages.map((m) => <div key={m.id} className={`msg ${m.role} ${m.status || ''}`}><div className="bubble">
            {m.role === 'user' ? <p>{m.text}</p> : m.status === 'pending' ? <div className="typing" aria-label="Assistant is preparing an answer"><span /><span /><span /></div> : <>
              {m.text && <Markdown text={m.text} />}
              {m.status === 'streaming' && <span className="caret" aria-hidden="true" />}
              {m.status === 'error' && <div className="msg-error" role="alert"><span>{m.error}</span><button className="btn small" onClick={() => send(m.query)} disabled={disabled || busy}>Retry</button></div>}
              {m.status === 'stopped' && <div className="msg-meta">Response stopped · partial answer</div>}
              {m.citations?.length > 0 && <div className="chat-citations" role="list" aria-label="Cited evidence">{m.citations.map((c, i) => <button key={`${c.id}-${i}`} role="listitem" className="chat-citation-button" onClick={(e) => openCitation(c, e.currentTarget)} aria-expanded={citationState?.id === c.id} aria-controls="chat-citation-panel" aria-label={`Open source ${i + 1}: ${c.label || describe(c.location) || 'source'}`} data-testid="chat-citation" data-kind={c.kind || undefined}><span className="cite-n" aria-hidden="true">{i + 1}</span><span className="cite-label">{c.label || describe(c.location) || `Source ${i + 1}`}</span><span className="cite-action" aria-hidden="true">Open source ↗</span></button>)}</div>}
              {m.status === 'done' && <div className="msg-meta">{m.citations?.length ? `${m.citations.length} source reference${m.citations.length === 1 ? '' : 's'}` : 'No source citations returned'}{m.grounding?.status ? ` · grounding ${m.grounding.status}` : ''}{m.grounding?.scope ? ` · scope ${m.grounding.scope === 'all' ? 'all documents' : 'this document'}` : ''}{m.metrics?.fulfillmentTimeSec != null ? ` · ${m.metrics.fulfillmentTimeSec}s` : ''}</div>}
            </>}
          </div></div>)}
        </div>
        {citationState && <section ref={citationPanelRef} tabIndex={-1} className="citation-panel" id="chat-citation-panel" aria-busy={citationState.status === 'loading'} aria-label="Cited source document" data-testid="citation-panel" onKeyDown={(e) => {
          if (e.key !== 'Escape' || e.defaultPrevented) return;
          e.preventDefault(); e.stopPropagation(); closeCitation();
        }}>
          {citationState.status !== 'ready' && <header><h3>{citationState.citation.label || 'Source evidence'}</h3><button className="icon-btn" onClick={closeCitation} aria-label="Close source viewer">×</button></header>}
          {citationState.status === 'loading' && <p role="status">Loading cited source…</p>}
          {citationState.status === 'error' && <div className="chat-service-error" role="alert">This source could not be loaded.<button className="btn small" onClick={() => openCitation(citationState.citation)}>Retry source</button></div>}
          {citationState.status === 'ready' && <SourceViewer source={citationState.data} citationId={citationState.id} onClose={closeCitation} />}
        </section>}
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <textarea ref={inputRef} rows={2} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} placeholder={sourceMissing ? 'Waiting for the selected source…' : slide != null ? `Ask about slide ${slide}…` : 'Ask about the selected documents…'} aria-label="Your question" aria-describedby="chat-source-note" />
          {busy ? <button type="button" className="btn small" onClick={() => abortRef.current?.abort()}>Stop</button> : <button type="submit" className="btn small accent" disabled={disabled || !input.trim()} aria-label="Send">Send</button>}
        </form>
        <p className="chat-context-note" id="chat-source-note">Changing the source keeps this conversation. Each new question retrieves only from the current selection. Shift + Enter adds a line.</p>
      </>}
    </section>
  );
}
