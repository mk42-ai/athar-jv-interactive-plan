import React, { useCallback, useRef, useState } from 'react';
import Overview from './Overview.jsx';
import MonthCard from './MonthCard.jsx';
import { MONTHS, monthKey } from '../../lib/plan.js';

export default function TimelineTab() {
  const [open, setOpen] = useState(() => new Set([monthKey(MONTHS[0])]));
  const headerRefs = useRef([]);

  const toggle = useCallback((key) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expandAll = () => setOpen(new Set(MONTHS.map(monthKey)));
  const collapseAll = () => setOpen(new Set());

  const openMonth = (month) => {
    const key = monthKey(month);
    setOpen((prev) => new Set(prev).add(key));
    requestAnimationFrame(() => {
      document.querySelector(`[data-month="${key}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      headerRefs.current[MONTHS.indexOf(month)]?.focus({ preventScroll: true });
    });
  };

  // WAI-ARIA accordion keyboard support: Up/Down move between headers, Home/End jump.
  const onHeaderKeyDown = (i) => (e) => {
    let target = null;
    if (e.key === 'ArrowDown') target = (i + 1) % MONTHS.length;
    else if (e.key === 'ArrowUp') target = (i - 1 + MONTHS.length) % MONTHS.length;
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = MONTHS.length - 1;
    if (target == null) return;
    e.preventDefault();
    headerRefs.current[target]?.focus();
  };

  return (
    <div className="timeline">
      <Overview onGateClick={openMonth} />

      <div className="timeline-toolbar">
        <h2 className="timeline-title">Month-by-month plan</h2>
        <div className="toolbar-actions">
          <span className="muted small">{open.size}/{MONTHS.length} expanded</span>
          <button className="btn ghost" onClick={expandAll}>Expand all</button>
          <button className="btn ghost" onClick={collapseAll}>Collapse all</button>
        </div>
      </div>

      <div className="months" data-testid="month-accordion">
        {MONTHS.map((m, i) => {
          const key = monthKey(m);
          return (
            <MonthCard
              key={key}
              index={i}
              month={m}
              open={open.has(key)}
              onToggle={() => toggle(key)}
              onHeaderKeyDown={onHeaderKeyDown(i)}
              headerRef={(el) => (headerRefs.current[i] = el)}
            />
          );
        })}
      </div>
    </div>
  );
}
