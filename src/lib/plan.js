import { getPresentationData } from './presentationState.js';
const presentation = getPresentationData();
const plan = presentation.plan;

export const PLAN = plan;
export const MONTHS = plan.months;
export const OVERVIEW = plan.overview;
export const GATES = plan.gates;

export const GATE_COLORS = {
  G1: '#c9a84c',
  G2: '#2dd4bf',
  G3: '#f59e0b',
  G4: '#a78bfa',
  G5: '#60a5fa',
  G6: '#f472b6',
};

export const STATUS_META = {
  starts_and_completes: { label: 'Starts & completes', short: 'S+C', color: '#2dd4bf' },
  starts: { label: 'Starts this month', short: 'Starts', color: '#34d399' },
  continues: { label: 'Continues', short: 'Cont.', color: '#60a5fa' },
  completes: { label: 'Completes this month', short: 'Done', color: '#fbbf24' },
};

export function monthKey(m) {
  return m.month.toLowerCase().replace(/\s+/g, '-');
}

export function monthForDate(iso) {
  return MONTHS.find((m) => iso >= m.period.start && iso <= m.period.end) || null;
}

export function fmtDate(iso, opts = { day: 'numeric', month: 'short' }) {
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });
}

export function fmtAED(n) {
  if (n == null || isNaN(n)) return '—';
  if (Math.abs(n) >= 1e6) return `AED ${(n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 2)}M`;
  if (Math.abs(n) >= 1e3) return `AED ${(n / 1e3).toFixed(0)}k`;
  return `AED ${n}`;
}

export function countByStatus(month) {
  const c = { starts: 0, continues: 0, completes: 0, starts_and_completes: 0 };
  for (const i of month.initiatives) c[i.status_in_month] = (c[i.status_in_month] || 0) + 1;
  return c;
}

export const SUGGESTED_QUESTIONS = presentation.suggestedQuestions;
