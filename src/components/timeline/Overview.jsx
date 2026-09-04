import React from 'react';
import { OVERVIEW, GATES, GATE_COLORS, fmtDate, monthForDate } from '../../lib/plan.js';

export default function Overview({ onGateClick }) {
  return (
    <section className="overview" aria-labelledby="overview-title">
      <div className="overview-head">
        <div>
          <p className="eyebrow">{OVERVIEW.subtitle} · month-by-month plan</p>
          <h1 id="overview-title">{OVERVIEW.title}</h1>
          <p className="lede">{OVERVIEW.purpose}</p>
        </div>
      </div>

      <ul className="metrics" aria-label="Headline metrics">
        {OVERVIEW.headline_metrics.map((m) => (
          <li key={m.value} className="metric">
            <div className="metric-value">{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </li>
        ))}
      </ul>

      <div className="ladder" role="list" aria-label="Six-gate ladder">
        {GATES.map((g, i) => {
          const month = monthForDate(g.date);
          return (
            <button
              key={g.gate}
              role="listitem"
              className="gate"
              style={{ '--gate': GATE_COLORS[g.gate] }}
              onClick={() => month && onGateClick?.(month)}
              title={`Open ${month?.month || ''}`}
            >
              <span className="gate-node">
                <b>{g.gate}</b>
              </span>
              {i < GATES.length - 1 && <span className="gate-link" aria-hidden="true" />}
              <span className="gate-week">{g.week}</span>
              <span className="gate-date">{fmtDate(g.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className="gate-title">{g.title}</span>
              <span className="gate-phase">{g.phase}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
