// Builds the grounding context injected into every Chat API query
// (modelConfigs.fulfillmentPrompt). It is a compact, lossless-enough rendering of
// data/athar-jv-month-timeline.json — overview + all seven months (initiatives,
// milestones, financials, KPIs, details). ~37 KB / ~9.5k tokens.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAN_PATH = path.resolve(__dirname, '../data/athar-jv-month-timeline.json');

let cache = null;

export function loadPlan() {
  if (!cache) cache = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));
  return cache;
}

function j(v) {
  return JSON.stringify(v);
}

export function buildPlanContext() {
  const plan = loadPlan();
  const ov = plan.overview;
  const L = [];
  L.push(`# ${ov.title} — ${ov.subtitle}`);
  L.push(`Period: ${ov.period}`);
  L.push(`PURPOSE: ${ov.purpose}`);
  L.push('HEADLINE METRICS: ' + ov.headline_metrics.map((m) => `${m.value} = ${m.label}`).join('; '));
  L.push(
    'SIX-GATE LADDER: ' +
      ov.six_gate_ladder.gates
        .map((g) => `${g.gate} ${g.week} ${g.date_label} (${g.date}) — ${g.title} [${g.phase}]`)
        .join('; ')
  );
  L.push('OUTCOMES BY MONTH-6 GATE: ' + ov.outcomes_by_month6_gate.join(' | '));
  L.push('ANCHORS & COMMERCIAL BASELINE: ' + j(ov.anchors_and_commercial_baseline));
  L.push('PRODUCT & COMPLIANCE: ' + j(ov.product_and_compliance));
  L.push('DELIVERY MODEL & CADENCE: ' + j(ov.delivery_model_and_cadence));
  L.push('NEXT 90 DAYS: ' + ov.next_90_days.map((w) => `${w.window}: ${w.items.join('; ')}`).join(' | '));
  L.push(`WEEK CALENDAR: ${j(plan.meta.week_calendar)}`);
  const cl = plan.meta.change_log_vs_prior_deck || {};
  L.push(
    'DECK NOTES (v3): ' +
      j({
        status_banner: ov.status_banner,
        financial_model_note: ov.anchors_and_commercial_baseline?.financial_model_note,
        roadmap_slide: ov.roadmap_slide && { title: ov.roadmap_slide.title, subtitle: ov.roadmap_slide.subtitle, gate_rows: ov.roadmap_slide.gate_rows },
        changes_vs_prior_deck: { calendar: cl.calendar, gates: cl.gates, roadmap_slide: cl.roadmap_slide, months: cl.months },
      })
  );
  for (const m of plan.months) {
    L.push('');
    L.push(
      `## ${m.month} (${m.period.start} → ${m.period.end}, ${m.period.weeks}) — phase: ${m.phase} — gate focus: ${m.gate_focus}`
    );
    L.push(
      'MILESTONES: ' +
        m.milestones.map((x) => `${x.date} [${x.type}${x.gate ? '/' + x.gate : ''}] ${x.label}`).join(' | ')
    );
    L.push(
      'INITIATIVES: ' +
        m.initiatives
          .map((i) => `${i.id} ${i.name} (${i.weeks}, ${i.start}→${i.end}, ${i.status_in_month}, feeds ${i.gate})`)
          .join(' | ')
    );
    const fin = Object.fromEntries(Object.entries(m.financials).filter(([k]) => k !== 'currency'));
    L.push('FINANCIALS (AED unless stated): ' + j(fin));
    L.push('KPIS: ' + j(m.kpis));
    L.push('DETAILS: ' + m.details);
  }
  L.push('');
  L.push('CAVEATS: ' + plan.meta.caveats.join(' | '));
  return L.join('\n');
}

export function buildFulfillmentPrompt({ voice = false } = {}) {
  const style = voice
    ? 'The user is talking to you by VOICE. Reply in 1–3 short spoken sentences of plain text: no markdown, no bullet lists, no headings; say numbers and dates naturally (e.g. "five February twenty twenty-seven").'
    : 'Reply in concise, well-structured Markdown (short paragraphs or bullets). Quote gate codes (G1–G6), week numbers (W1–W26) and dates exactly as they appear in the plan.';
  return (
    'You are the Athar JV business-plan assistant embedded in the ODA × AIREV Athar Joint Venture app. ' +
    'Answer ONLY from the BUSINESS PLAN CONTEXT below (the October 2026 → March 2027 executive summary and six-gate roadmap; v3 deck, all dates indicative pending MoU signature confirmation). ' +
    'If the context does not cover the question, say so plainly and do not invent figures. ' +
    'Values marked "derived" are arithmetic on deck figures, not statements from the deck — label them as derived if you use them. ' +
    style +
    '\n\n===== BUSINESS PLAN CONTEXT =====\n' +
    buildPlanContext() +
    '\n===== END OF CONTEXT ====='
  );
}
