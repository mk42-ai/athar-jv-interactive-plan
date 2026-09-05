import React, { useCallback, useEffect, useRef, useState } from 'react';
import ChatWidget from './components/chat/ChatWidget.jsx';
import SourceViewer from './components/chat/SourceViewer.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { createSession, getDocuments, getHealth, getCitation } from './lib/api.js';

const shortTitle = doc => ({ 'financial-summary': 'Financial summary', 'executive-presentation': 'Executive presentation', 'financial-model': 'Financial model v13', 'implementation-plan': 'Implementation plan' }[doc.slug] || doc.title);
const countLabel = doc => doc.kind === 'pdf' ? doc.coverage.pages + ' pages' : doc.kind === 'pptx' ? doc.coverage.slides + ' slides' : doc.coverage.sheets.length + ' worksheets';
export default function App() {
  const [documents, setDocuments] = useState([]), [loading, setLoading] = useState(true), [documentsError, setDocumentsError] = useState('');
  const [selectedId, setSelectedId] = useState(null), [source, setSource] = useState(null), [sourceError, setSourceError] = useState('');
  const [health, setHealth] = useState(null), [serviceError, setServiceError] = useState(''), [session, setSession] = useState(null);
  const [askRequest, setAskRequest] = useState(null), [mobileView, setMobileView] = useState('documents');
  const [sourceBusy, setSourceBusy] = useState(false);
  const sessionRef = useRef(null), pendingSession = useRef(null), sourceRevision = useRef(0);
  const refresh = useCallback(async () => {
    setLoading(true); setDocumentsError('');
    try { const data = await getDocuments(); setDocuments(data.documents); setSelectedId(old => data.documents.some(d => d.id === old) ? old : data.documents.find(d => d.kind === 'pdf')?.id || data.documents[0]?.id || null); }
    catch (error) { setDocumentsError(error.message || 'The selected document corpus is unavailable.'); }
    finally { setLoading(false); }
  }, []);
  const refreshService = useCallback(async () => {
    setServiceError('');
    try { const data = await getHealth(); setHealth(data); if (!data.configured) setServiceError('The AI provider is not configured on the server.'); }
    catch { setServiceError('The assistant could not connect. Documents remain available.'); }
  }, []);
  useEffect(() => { refresh(); refreshService(); }, [refresh, refreshService]);
  const ensureSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;
    if (!pendingSession.current) pendingSession.current = createSession().then(value => { sessionRef.current = value; setSession(value); return value; }).finally(() => { pendingSession.current = null; });
    return pendingSession.current;
  }, []);
  const resetSession = useCallback(() => { sessionRef.current = null; setSession(null); }, []);
  const openSource = useCallback(async citation => {
    const revision = ++sourceRevision.current; setSourceBusy(true); setSourceError('');
    try { const data = await getCitation(citation.id); if (revision === sourceRevision.current) { setSelectedId(data.documentId); setSource(data); setMobileView('documents'); } }
    catch (error) { if (revision === sourceRevision.current) setSourceError(error.message || 'This source could not be opened.'); }
    finally { if (revision === sourceRevision.current) setSourceBusy(false); }
  }, []);
  const selectDocument = useCallback(doc => {
    setSelectedId(doc.id); setMobileView('documents');
    if (doc.defaultCitationId) openSource({ id: doc.defaultCitationId });
    else { setSource(null); setSourceError('A source locator is unavailable for this document.'); }
  }, [openSource]);
  useEffect(() => {
    if (!selectedId || source?.documentId === selectedId || sourceBusy || sourceError) return;
    const doc = documents.find(d => d.id === selectedId);
    if (doc?.defaultCitationId) openSource({ id: doc.defaultCitationId });
  }, [selectedId, documents, source, sourceBusy, sourceError, openSource]);
  const selected = documents.find(doc => doc.id === selectedId);
  const switchView = view => { setMobileView(view); requestAnimationFrame(() => document.getElementById(view === 'chat' ? 'chat-widget' : 'document-reader')?.scrollIntoView({block:'start',behavior:'auto'})); };
  const askSelected = () => { if (!selected) return; setAskRequest({ id: Date.now(), documentSlug: selected.slug, prompt: '' }); switchView('chat'); };
  const inputs = documents.reduce((n, doc) => n + (doc.aliases?.length || 1), 0);
  return <div className="app athar-workspace document-workspace" data-testid="document-workspace" data-mobile-view={mobileView}>
    <header className="document-top"><a href="/" className="brand" aria-label="Athar document workspace"><span className="brand-title">ATHAR<span className="brand-dot">.</span></span><span className="brand-sub">ODA × AIREV</span></a><div className="workspace-heading"><span className="eyebrow">Shared knowledge</span><h1>Document workspace</h1></div><a className="chat-jump" href="#chat-widget" onClick={() => switchView('chat')}>Ask AI <span aria-hidden="true">↗</span></a></header>
    <nav className="document-mobile-tabs" aria-label="Workspace view"><button aria-pressed={mobileView === 'documents'} onClick={() => switchView('documents')} data-testid="mobile-documents">Documents</button><button aria-pressed={mobileView === 'chat'} onClick={() => switchView('chat')} data-testid="mobile-chat">Ask AI</button></nav>
    <div className="document-layout">
      <aside className="document-library" data-testid="document-library" aria-label="Document library">
        <div className="library-heading"><h2>Library</h2><span>{documents.length.toString().padStart(2, '0')}</span></div>
        <p className="library-note">Original sources. One place.</p>
        {loading && <p role="status">Loading documents…</p>}
        {documentsError && <p role="alert">{documentsError}<button className="btn small" onClick={refresh}>Retry documents</button></p>}
        <nav aria-label="Choose a document">{documents.map((doc, i) => <button key={doc.id} className="document-card" aria-current={selectedId === doc.id ? 'page' : undefined} onClick={() => selectDocument(doc)} data-document-id={doc.id} data-testid={'document-' + doc.slug}>
          <span className="document-file-icon" aria-hidden="true">{doc.kind === 'xlsx' ? '▦' : doc.kind === 'pptx' ? '▱' : '▤'}</span><span className="document-card-body"><strong>{shortTitle(doc)}</strong><span>{doc.kind.toUpperCase()} · {countLabel(doc)}</span><small>SHA {doc.id.slice(0, 10)}{doc.aliases?.length > 1 ? ' · ' + doc.aliases.length + ' identical inputs' : ''}</small></span><span className="document-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        </button>)}</nav>
        {!!documents.length && <details className="library-provenance"><summary>Source identity</summary><p>{inputs} supplied files · {documents.length} unique originals. Only byte-identical files are combined. Hash labels identify a byte version, not an approval or date.</p>{documents.map(doc => <div key={doc.id}><b>{shortTitle(doc)}</b><code>{doc.id}</code><ul>{(doc.aliases || []).map((name,i) => <li key={i}>{name}</li>)}</ul></div>)}</details>}
      </aside>
      <main className="document-reader" id="document-reader" aria-label="Embedded document viewer">
        <div className="reader-context"><span>Library <span aria-hidden="true">/</span> {selected ? shortTitle(selected) : 'Documents'}</span>{selected && <button className="btn small" onClick={askSelected} data-testid="ask-selected-document">Ask about this document ↗</button>}</div>
        {sourceError && <div role="alert" className="reader-error">{sourceError}<button className="btn small" onClick={() => selected && selectDocument(selected)}>Retry</button></div>}
        {sourceBusy && !source && <p role="status">Opening original source…</p>}
        {source && <ErrorBoundary><SourceViewer key={source.id} source={source} citationId={source.id} libraryMode /></ErrorBoundary>}
        {!source && !loading && !sourceBusy && !sourceError && <p>Select a document to begin reading.</p>}
      </main>
      <aside className="document-chat" aria-label="Document AI companion"><ErrorBoundary><ChatWidget open ensureSession={ensureSession} session={session} resetSession={resetSession} configured={health?.configured ?? null} serviceError={serviceError} onRetryService={refreshService} documents={documents} documentsLoading={loading} documentsError={documentsError} onRefreshDocuments={refresh} onRetryDocuments={refresh} askRequest={askRequest} onOpenSource={openSource} activeDocumentId={selectedId} /></ErrorBoundary></aside>
    </div>
  </div>;
}
