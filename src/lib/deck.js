// Presentation metadata + month strip geometry. The week calendar is read from the plan JSON
// (meta.week_calendar — v3 deck: W1 = Mon 5 Oct 2026 … W26 = Fri 2 Apr 2027).
import { MONTHS, GATES, PLAN, monthKey } from './plan.js';

import { getPresentationData } from './presentationState.js';
const deck = getPresentationData().deck;
export const PDF_SRC = `/deck/${encodeURIComponent(deck.filename)}`;
export const PDF_TITLE = deck.title;
export const PDF_PAGES = deck.pageTitles;

const DAY = 86400000;
const dateUTC = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
export const WEEK_CALENDAR = PLAN.meta.week_calendar;
const W1 = dateUTC(WEEK_CALENDAR.W1_monday); // Monday of W1 (MoU signing week)
const END = W1 + 26 * 7 * DAY; // end of W26 column
export const W26_FRIDAY = WEEK_CALENDAR.W26_friday;
const share = (a, b) => (b - a) / (END - W1);
const pct = (v) => `${(v * 100).toFixed(3)}%`;

function nextMonthStart(iso) {
  const [y, m] = iso.split('-').map(Number);
  return Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1);
}

export const MONTH_SEGMENTS = MONTHS.map((m, i) => {
  const start = i === 0 ? W1 : dateUTC(`${m.period.start.slice(0, 7)}-01`);
  const end = i === MONTHS.length - 1 ? END : nextMonthStart(m.period.start);
  return {
    key: monthKey(m),
    month: m,
    short: m.month.slice(0, 3).toUpperCase(),
    label: m.month,
    share: share(start, end),
  };
});

export const GATE_MARKS = GATES.map((g) => ({ ...g, left: pct((dateUTC(g.date) + 0.5 * DAY - W1) / (END - W1)) }));
export const WEEK_TICKS = Array.from({ length: 26 }, (_, i) => ({ week: i + 1, left: pct(i / 26) }));
