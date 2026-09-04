import React, { useCallback, useRef, useState } from 'react';
import PdfViewer from './PdfViewer.jsx';
import TimelineStrip from './TimelineStrip.jsx';
import MonthPanel from './MonthPanel.jsx';
import { PDF_SRC, PDF_TITLE, PDF_PAGES } from '../../lib/deck.js';
import { MONTHS, OVERVIEW, monthKey } from '../../lib/plan.js';

export default function DeckTab() {
  const [pageNo, setPageNo] = useState(1);
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

  return (
    <section className={`deck ${panelOpen ? 'panel-open' : ''}`} aria-labelledby="deck-title">
      <header className="deck-head">
        <p className="eyebrow">{OVERVIEW.subtitle}</p>
        <h1 id="deck-title" className="deck-title">{pageMeta.title}</h1>
        <p className="deck-caption">{OVERVIEW.period} · exact presentation PDF, served from this app · {PDF_PAGES.length} pages</p>
      </header>

      <div className="deck-body">
        <PdfViewer src={PDF_SRC} title={PDF_TITLE} onPageChange={setPageNo} />
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
