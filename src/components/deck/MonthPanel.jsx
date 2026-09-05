import React, { useEffect, useRef, useState } from 'react';
import { GATE_COLORS, STATUS_META, countByStatus, fmtAED, fmtDate, monthKey } from '../../lib/plan.js';

const STATUS_ORDER = ['starts_and_completes', 'starts', 'continues', 'completes'];

function Disclosure({ id, title, count, open, onToggle, children, tone }) {
  return (
    <section className={`disc ${open ? 'open' : ''} ${tone || ''}`}>
      <h3 className="disc-h">
        <button type="button" className="disc-btn" aria-expanded={open} aria-controls={`${id}-body`} id={`${id}-btn`} onClick={onToggle}>
          <span className="disc-title">{title}</span>
          {count != null && <span className="disc-count">{count}</span>}
          <span className="disc-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
        </button>
      </h3>
      <div id={`${id}-body`} role="region" aria-labelledby={`${id}-btn`} className="disc-panel" aria-hidden={!open} inert={open ? undefined : ''}>
        <div className="disc-inner">{children}</div>
      </div>
    </section>
  );
}

export default function MonthPanel({ month, open, onClose, onPrev, onNext, hasPrev, hasNext, returnFocusRef }) {
  const panelRef = useRef(null);
  const titleRef = useRef(null);
  const key = month ? monthKey(month) : 'none';
  const [openSections, setOpenSections] = useState({ milestones: true, activities: true, financials: false, narrative: true });
  const [openGroups, setOpenGroups] = useState({ starts_and_completes: true, starts: true, continues: false, completes: true });

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => titleRef.current?.focus({ preventScroll: true }), 380);
      return () => clearTimeout(t);
    }
  }, [open, key]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        returnFocusRef?.current?.focus?.({ preventScroll: true });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, returnFocusRef]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (open) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [open]);

  const toggle = (k) => setOpenSections((s) => ({ ...s, [k]: !s[k] }));
  const toggleGroup = (k) => setOpenGroups((s) => ({ ...s, [k]: !s[k] }));

  if (!month) return <aside id="month-panel" ref={panelRef} className="month-panel-drawer" aria-hidden="true" hidden inert="" />;

  const counts = countByStatus(month);
  const gates = month.milestones.filter((m) => m.type === 'gate');
  const grouped = {};
  for (const i of month.initiatives) (grouped[i.status_in_month] ||= []).push(i);
  const fin = month.financials;
  const load = month.kpis.find((k) => k.name === 'Roadmap activity load')?.value;

  return (
    <aside
      id="month-panel"
      ref={panelRef}
      className={`month-panel-drawer ${open ? 'open' : ''}`}
      role="region"
      aria-labelledby="month-panel-title"
      aria-hidden={!open}
      hidden={!open}
      inert={open ? undefined : ''}
      data-testid="month-panel"
    >
      <div className="mp-head">
        <div className="mp-nav">
          <button className="tb-btn" onClick={onPrev} disabled={!hasPrev} aria-label="Previous month">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button className="tb-btn" onClick={onNext} disabled={!hasNext} aria-label="Next month">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
        <button className="tb-btn mp-close" onClick={() => { onClose(); returnFocusRef?.current?.focus?.({ preventScroll: true }); }} aria-label="Close month detail" data-testid="month-panel-close">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="mp-scroll">
        <p className="eyebrow">{month.phase} · {month.gate_focus}</p>
        <h2 id="month-panel-title" ref={titleRef} tabIndex={-1} className="mp-title">{month.month}</h2>
        <p className="mp-sub">
          {fmtDate(month.period.start, { day: 'numeric', month: 'short' })} – {fmtDate(month.period.end, { day: 'numeric', month: 'short', year: 'numeric' })} · {month.period.weeks}
        </p>

        <div className="mp-stats">
          <div className="stat"><b>{month.initiatives.length}</b><span>active</span></div>
          <div className="stat ok"><b>{counts.starts + counts.starts_and_completes}</b><span>starting</span></div>
          <div className="stat done"><b>{counts.completes + counts.starts_and_completes}</b><span>completing</span></div>
          <div className="stat"><b>{month.milestones.length}</b><span>milestones</span></div>
          {gates.map((g) => (
            <div key={g.gate} className="stat gate" style={{ '--gate': GATE_COLORS[g.gate] }}><b>{g.gate}</b><span>{fmtDate(g.date)}</span></div>
          ))}
        </div>

        <Disclosure id={`mp-${key}-milestones`} title="Milestones & gates" count={month.milestones.length} open={openSections.milestones} onToggle={() => toggle('milestones')}>
          <ol className="mp-milestones">
            {month.milestones.map((m, i) => (
              <li key={i} className={`mp-ms ${m.type}`} style={{ '--gate': GATE_COLORS[m.gate] || 'var(--gold)' }}>
                <time dateTime={m.date}>{fmtDate(m.date, { weekday: 'short', day: 'numeric', month: 'short' })}</time>
                <span className="ms-dot" aria-hidden="true" />
                <span className="ms-text">{m.gate && <span className="gate-chip" style={{ '--gate': GATE_COLORS[m.gate] }}>{m.gate}</span>}{m.label}</span>
              </li>
            ))}
          </ol>
        </Disclosure>

        <Disclosure id={`mp-${key}-activities`} title="Activities & initiatives" count={month.initiatives.length} open={openSections.activities} onToggle={() => toggle('activities')}>
          {STATUS_ORDER.filter((s) => grouped[s]?.length).map((s) => (
            <div key={s} className="mp-group">
              <button type="button" className="mp-group-btn" aria-expanded={openGroups[s]} aria-controls={`mp-${key}-${s}`} onClick={() => toggleGroup(s)} style={{ '--st': STATUS_META[s].color }}>
                <i aria-hidden="true" /> {STATUS_META[s].label} <span className="disc-count">{grouped[s].length}</span>
                <span className="disc-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></span>
              </button>
              <div id={`mp-${key}-${s}`} className={`disc-panel ${openGroups[s] ? 'open' : ''}`} aria-hidden={!openGroups[s]} inert={openGroups[s] ? undefined : ''}>
                <ul className="mp-acts disc-inner">
                  {grouped[s].map((i) => (
                    <li key={i.id} className="mp-act">
                      <span className="gate-chip" style={{ '--gate': GATE_COLORS[i.gate] }} title={i.workstream}>{i.gate}</span>
                      <span className="act-name">{i.name}</span>
                      <span className="act-weeks">{i.weeks} · {fmtDate(i.start)} → {fmtDate(i.end)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </Disclosure>

        <Disclosure id={`mp-${key}-financials`} title="Financials" open={openSections.financials} onToggle={() => toggle('financials')}>
          <dl className="mp-fin">
            <div><dt>Billing</dt><dd>{fin.billing_status}</dd></div>
            {fin.capital_event && <div><dt>Capital / corporate</dt><dd>{fin.capital_event}</dd></div>}
            {fin.contracts && <div><dt>Contracts</dt><dd>{fin.contracts}</dd></div>}
            {fin.revenue_basis && <div><dt>Revenue basis</dt><dd>{fin.revenue_basis}</dd></div>}
            {fin.revenue_trajectory && <div><dt>Revenue trajectory</dt><dd>{fin.revenue_trajectory}</dd></div>}
            {fin.cost_events?.length > 0 && <div><dt>Cost events</dt><dd><ul>{fin.cost_events.map((x, i) => <li key={i}>{x}</li>)}</ul></dd></div>}
            {fin.derived?.length > 0 && <div className="derived"><dt>Derived (not stated in deck)</dt><dd><ul>{fin.derived.map((x, i) => <li key={i}>{x}</li>)}</ul></dd></div>}
          </dl>
          <div className="mp-fin-nums">
            {fin.seats_live != null && <div><b>{fin.seats_live}</b><span>seats live</span></div>}
            {fin.seats_contracted != null && <div><b>{fin.seats_contracted}</b><span>seats contracted</span></div>}
            <div><b>{fin.seats_billable}</b><span>seats billable</span></div>
            <div><b>AED {fin.seat_rate_aed_per_seat_per_month.toLocaleString('en-GB')}</b><span>per seat / month</span></div>
            <div><b>{fmtAED(fin.committed_capital_aed)}</b><span>committed capital</span></div>
            <div><b>{fmtAED(fin.year1_revenue_aed_base_case)}</b><span>Y1 revenue (base)</span></div>
          </div>
        </Disclosure>

        <Disclosure id={`mp-${key}-narrative`} title="What happens this month" open={openSections.narrative} onToggle={() => toggle('narrative')}>
          <p className="mp-narrative">{month.details}</p>
          {load && (
            <p className="mp-load muted">Roadmap load: {load.activities_active} active · {load.starting} starting · {load.continuing} continuing · {load.completing} completing</p>
          )}
          <ul className="mp-kpis">
            {month.kpis.filter((k) => k.name !== 'Roadmap activity load').map((k, i) => (
              <li key={i} className={k.status === 'gate' ? 'is-gate' : ''}>
                <b>{k.name}</b>
                <span>{[k.target != null && `Target: ${typeof k.target === 'object' ? JSON.stringify(k.target) : k.target}`, k.due && `Due: ${k.due}`, k.window && `Window: ${k.window}`].filter(Boolean).join(' · ')}</span>
              </li>
            ))}
          </ul>
        </Disclosure>
      </div>
    </aside>
  );
}
