import React, { useEffect, useMemo, useRef } from 'react';
import { GATE_COLORS, STATUS_META, countByStatus, fmtDate, fmtAED, monthKey } from '../../lib/plan.js';

const FIN_LABELS = {
  billing_status: 'Billing',
  capital_event: 'Capital / corporate event',
  contracts: 'Contracts',
  revenue_basis: 'Revenue basis',
  revenue_trajectory: 'Revenue trajectory',
  cost_events: 'Cost events',
  derived: 'Derived figures (not stated in deck)',
};

const FIN_NUMBERS = [
  ['seats_live', 'Seats live'],
  ['seats_contracted', 'Seats contracted'],
  ['seats_billable', 'Seats billable'],
  ['seat_rate_aed_per_seat_per_month', 'Seat rate (AED / seat / month)'],
  ['committed_capital_aed', 'Committed capital'],
  ['equity_per_partner_aed', 'Equity per partner'],
  ['year1_revenue_aed_base_case', 'Year-1 revenue (base case)'],
  ['oda_funded_pmo_envelope_aed', 'ODA-funded PMO envelope'],
];

function fmtNum(key, v) {
  if (v == null) return '—';
  if (/_aed/.test(key) || key === 'committed_capital_aed') return fmtAED(v);
  if (key === 'seat_rate_aed_per_seat_per_month') return `AED ${v.toLocaleString('en-GB')}`;
  return typeof v === 'number' ? v.toLocaleString('en-GB') : String(v);
}

const STATUS_ORDER = ['starts_and_completes', 'starts', 'continues', 'completes'];

export default function MonthCard({ month, open, onToggle, onHeaderKeyDown, headerRef, index }) {
  const key = monthKey(month);
  const panelRef = useRef(null);
  const counts = useMemo(() => countByStatus(month), [month]);
  const gates = useMemo(() => month.milestones.filter((m) => m.type === 'gate'), [month]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    // Keep collapsed panels out of the tab order / accessibility tree while
    // still animating height via CSS grid rows.
    if (open) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [open]);

  const grouped = useMemo(() => {
    const g = {};
    for (const i of month.initiatives) (g[i.status_in_month] ||= []).push(i);
    return g;
  }, [month]);

  return (
    <article className={`month-card ${open ? 'open' : ''}`} data-month={key} style={{ '--delay': `${index * 40}ms` }}>
      <h2 className="month-h">
        <button
          ref={headerRef}
          id={`hdr-${key}`}
          className="month-hdr"
          aria-expanded={open}
          aria-controls={`panel-${key}`}
          onClick={onToggle}
          onKeyDown={onHeaderKeyDown}
          data-testid={`month-toggle-${key}`}
        >
          <span className="month-ordinal" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <span className="month-title">
            <span className="month-name">{month.month}</span>
            <span className="month-sub">
              {fmtDate(month.period.start)} – {fmtDate(month.period.end)} · {month.period.weeks} · {month.phase}
            </span>
          </span>
          <span className="month-badges">
            {gates.map((g) => (
              <span key={g.gate} className="badge gate-badge" style={{ '--gate': GATE_COLORS[g.gate] }} title={g.label}>
                {g.gate}
              </span>
            ))}
            <span className="badge" title="Initiatives active this month">
              {month.initiatives.length} initiatives
            </span>
            <span className="badge subtle" title="Milestones">
              {month.milestones.length} milestones
            </span>
            {counts.starts + counts.starts_and_completes > 0 && (
              <span className="badge ok" title="Starting this month">▲ {counts.starts + counts.starts_and_completes}</span>
            )}
            {counts.completes + counts.starts_and_completes > 0 && (
              <span className="badge done" title="Completing this month">✓ {counts.completes + counts.starts_and_completes}</span>
            )}
          </span>
          <span className="chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>
      </h2>

      <div id={`panel-${key}`} ref={panelRef} role="region" aria-labelledby={`hdr-${key}`} className="month-panel" aria-hidden={!open}>
        <div className="month-panel-inner">
          <div className="month-body">
            <p className="month-details">{month.details}</p>

            <div className="section">
              <h3 className="section-title">Milestones &amp; gates</h3>
              <ol className="milestones">
                {month.milestones.map((m, i) => (
                  <li key={i} className={`milestone ${m.type}`} style={{ '--gate': GATE_COLORS[m.gate] || 'var(--accent)' }}>
                    <time dateTime={m.date}>{fmtDate(m.date, { weekday: 'short', day: 'numeric', month: 'short' })}</time>
                    <span className="milestone-dot" aria-hidden="true" />
                    <span className="milestone-text">
                      {m.gate && <span className="badge gate-badge" style={{ '--gate': GATE_COLORS[m.gate] }}>{m.gate}</span>}
                      {m.label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="section">
              <h3 className="section-title">
                Activities &amp; initiatives <span className="muted">({month.initiatives.length} active · {month.period.weeks})</span>
              </h3>
              <div className="status-groups">
                {STATUS_ORDER.filter((s) => grouped[s]?.length).map((s) => (
                  <div key={s} className="status-group">
                    <div className="status-head" style={{ '--st': STATUS_META[s].color }}>
                      <i /> {STATUS_META[s].label} <span className="muted">· {grouped[s].length}</span>
                    </div>
                    <ul className="initiatives">
                      {grouped[s].map((i) => (
                        <li key={i.id} className="initiative">
                          <span className="init-gate" style={{ '--gate': GATE_COLORS[i.gate] }} title={i.workstream}>
                            {i.gate}
                          </span>
                          <span className="init-name">{i.name}</span>
                          <span className="init-weeks">
                            {i.weeks} · {fmtDate(i.start)} → {fmtDate(i.end)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="section two-col">
              <div>
                <h3 className="section-title">Financials</h3>
                <dl className="fin-list">
                  {Object.entries(FIN_LABELS)
                    .filter(([k]) => month.financials[k] != null && !(Array.isArray(month.financials[k]) && month.financials[k].length === 0))
                    .map(([k, label]) => (
                      <div key={k} className={`fin-item ${k}`}>
                        <dt>{label}</dt>
                        <dd>
                          {Array.isArray(month.financials[k]) ? (
                            <ul>
                              {month.financials[k].map((x, i) => (
                                <li key={i}>{x}</li>
                              ))}
                            </ul>
                          ) : (
                            month.financials[k]
                          )}
                        </dd>
                      </div>
                    ))}
                </dl>
                <div className="fin-numbers">
                  {FIN_NUMBERS.filter(([k]) => month.financials[k] != null).map(([k, label]) => (
                    <div key={k} className="fin-num">
                      <span className="fin-num-v">{fmtNum(k, month.financials[k])}</span>
                      <span className="fin-num-l">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="section-title">KPIs</h3>
                <ul className="kpis">
                  {month.kpis
                    .filter((k) => k.name !== 'Roadmap activity load')
                    .map((k, i) => (
                      <li key={i} className={`kpi ${k.status === 'gate' ? 'kpi-gate' : ''}`}>
                        <span className="kpi-name">{k.name}</span>
                        <span className="kpi-meta">
                          {k.target != null && <span>Target: {typeof k.target === 'object' ? JSON.stringify(k.target) : String(k.target)}</span>}
                          {k.due && <span>Due: {k.due}</span>}
                          {k.window && <span>Window: {k.window}</span>}
                        </span>
                      </li>
                    ))}
                </ul>
                {(() => {
                  const load = month.kpis.find((k) => k.name === 'Roadmap activity load')?.value;
                  return load ? (
                    <div className="load-strip" aria-label="Roadmap activity load">
                      <span>{load.activities_active} active</span>
                      <span className="ok">{load.starting} starting</span>
                      <span className="cont">{load.continuing} continuing</span>
                      <span className="done">{load.completing} completing</span>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
