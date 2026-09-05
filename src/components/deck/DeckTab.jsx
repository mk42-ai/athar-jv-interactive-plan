import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGuide } from './useGuide.js';
import { GuideToggle, GuideOverlay, GuideBar } from './GuideMode.jsx';
import PdfViewer from './PdfViewer.jsx';
import TimelineStrip from './TimelineStrip.jsx';
import MonthPanel from './MonthPanel.jsx';
import { PDF_SRC, PDF_TITLE, PDF_PAGES } from '../../lib/deck.js';
import { MONTHS, OVERVIEW, monthKey } from '../../lib/plan.js';

export default function DeckTab({ onAskSlide, visible = true, onGuideStateChange }) {
  const [pageNo, setPageNo] = useState(1);
  const [requestedPage, setRequestedPage] = useState(null);
  const guide = useGuide({ onSlide: (n) => setRequestedPage({ n, t: Date.now() }) });
  // Report transport state only; visibility never stops or recreates the narrator.
  useEffect(() => { onGuideStateChange?.(guide); }, [guide.active, guide.playing, guide.status, guide.idx, onGuideStateChange]);
  const syncRef = useRef(guide.syncSlide);
  syncRef.current = guide.syncSlide;
  const onUserNavigate = useCallback((n) => syncRef.current(n), []);
  useEffect(() => { if (guide.active) setPanelOpen(false); }, [guide.active]);
  const [activeKey, setActiveKey] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const returnFocusRef = useRef(null);
  const activeIdx = MONTHS.findIndex((m) => monthKey(m) === activeKey);
  const month = activeIdx >= 0 ? MONTHS[activeIdx] : null;

  const select = useCallback((key, triggerEl) => {
    returnFocusRef.current = triggerEl || null;
    setActiveKey((prev) => {
      if (prev === key && panelOpen) {
        setPanelOpen(false);
        return prev;
      }
      setPanelOpen(true);
      return key;
    });
  }, [panelOpen]);

  const step = (d) => {
    const next = MONTHS[activeIdx + d];
    if (next) setActiveKey(monthKey(next));
  };
  const pageMeta = PDF_PAGES[pageNo - 1] || PDF_PAGES[0];
  const guideStepCount = guide.total;

  return (
    <section className={`deck ${panelOpen ? 'panel-open' : ''} ${guide.active ? 'guiding' : ''}`} aria-labelledby="deck-title" data-guide-active={guide.active}>
      <header className="deck-head">
        <div className="deck-heading">
          <p className="eyebrow">{OVERVIEW.subtitle}</p>
          <h1 id="deck-title" className="deck-title">{pageMeta.title}</h1>
        </div>
        <p className="deck-caption"><span>{OVERVIEW.period} · Original presentation · {PDF_PAGES.length} slides</span></p>
        <div className="deck-head-actions">
          <button className="link-btn" onClick={() => guide.toggle(pageNo)} data-testid="guide-link">{guide.active ? 'exit Guide Mode' : `Guide Mode: ${guideStepCount} narrated moments`}</button>
          <button className="btn deck-ask-slide" onClick={() => onAskSlide?.(pageNo)} data-testid="ask-this-slide">Ask this slide <span aria-hidden="true">↗</span></button>
        </div>
      </header>

      <div className="deck-body">
        <div className="pdfv-stage">
          <PdfViewer src={PDF_SRC} title={PDF_TITLE} onPageChange={setPageNo} onUserNavigate={onUserNavigate} requestedPage={requestedPage} overlay={<GuideOverlay guide={guide} />} toolbarExtra={<GuideToggle guide={guide} page={pageNo} />} footer={<GuideBar guide={guide} page={pageNo} visible={visible} sectionLabel={pageMeta.title} />} />
        </div>
        <MonthPanel
          month={month}
          open={panelOpen && Boolean(month)}
          onClose={() => setPanelOpen(false)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          hasPrev={activeIdx > 0}
          hasNext={activeIdx >= 0 && activeIdx < MONTHS.length - 1}
          returnFocusRef={returnFocusRef}
        />
      </div>

      <TimelineStrip activeKey={activeKey} panelOpen={panelOpen} onSelect={select} />
    </section>
  );
}
