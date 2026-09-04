import React from 'react';
import { MONTH_SEGMENTS, GATE_MARKS, WEEK_TICKS, WEEK_CALENDAR, W26_FRIDAY } from '../../lib/deck.js';
import { fmtDate } from '../../lib/plan.js';

const LONG = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
const cap = (iso) => fmtDate(iso, LONG).replace(/,/g, ''); // "Mon 5 Oct 2026" — same style as the original caption

// Slim, unobtrusive month strip under the presentation: click a month to open its plan detail.
export default function TimelineStrip({ activeKey, panelOpen, onSelect }) {
  return (
    <div className="strip" data-testid="timeline-strip">
      <div className="strip-head">
        <span className="eyebrow">Month by month · W1 {cap(WEEK_CALENDAR.W1_monday)} → W26 {cap(W26_FRIDAY)}</span>
        <span className="strip-hint">Select a month to expand its plan</span>
      </div>
      <div className="strip-track" role="group" aria-label="Months of the plan">
        <div className="strip-ticks" aria-hidden="true">
          {WEEK_TICKS.map((t) => (
            <span key={t.week} className={`tick ${t.week % 5 === 1 ? 'major' : ''}`} style={{ left: t.left }}>
              {t.week % 5 === 1 && <em>W{t.week}</em>}
            </span>
          ))}
        </div>
        <div className="strip-months">
          {MONTH_SEGMENTS.map((s) => {
            const active = s.key === activeKey;
            const gates = s.month.milestones.filter((m) => m.type === 'gate');
            return (
              <button
                key={s.key}
                type="button"
                className={`strip-month ${active ? 'active' : ''}`}
                style={{ flexGrow: s.share * 1000 }}
                aria-pressed={active}
                aria-expanded={active && panelOpen}
                aria-controls="month-panel"
                onClick={(e) => onSelect(s.key, e.currentTarget)}
                data-testid={`strip-${s.key}`}
              >
                <span className="sm-name">{s.short}</span>
                <span className="sm-sub">{s.month.period.weeks} · {s.month.initiatives.length}</span>
                {gates.map((g) => <i key={g.gate} className="sm-gate" aria-hidden="true" />)}
              </button>
            );
          })}
        </div>
        <div className="strip-gates" aria-hidden="true">
          {GATE_MARKS.map((g) => (
            <span key={g.gate} className="gate-mark" style={{ left: g.left }} title={`${g.gate} · ${fmtDate(g.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} — ${g.title}`}>
              <b>{g.gate}</b><em>{fmtDate(g.date)}</em>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
