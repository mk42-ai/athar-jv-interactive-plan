import React, { useRef } from 'react';

export const TABS = [
  { id: 'deck', label: 'Presentation', short: 'Presentation' },
  { id: 'timeline', label: 'Timeline', short: 'Timeline' },
];

// Minimal text navigation with a hairline gold underline.
export default function Tabs({ active, onChange }) {
  const refs = useRef([]);
  const idx = Math.max(0, TABS.findIndex((t) => t.id === active));
  const onKeyDown = (e) => {
    let next = null;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = TABS.length - 1;
    if (next == null) return;
    e.preventDefault();
    onChange(TABS[next].id);
    refs.current[next]?.focus();
  };
  return (
    <nav className="tabs" role="tablist" aria-label="Sections" onKeyDown={onKeyDown}>
      {TABS.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => (refs.current[i] = el)}
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={active === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={active === t.id ? 0 : -1}
          className={`tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
          data-tab={t.id}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
