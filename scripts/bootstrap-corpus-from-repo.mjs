#!/usr/bin/env node
// Build data/corpus/index.json from bundled repo assets (timeline JSON) for local/Vercel chat.
// Full originals still require `npm run provision` into a private ATHAR_CORPUS_DIR override.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCorpusIndex } from '../server/retrieval.js';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'data/corpus');
const TIMELINE = path.join(REPO, 'data/athar-jv-month-timeline.json');
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');

const docSha = (slug) => sha(`athar-bundled-corpus:${slug}`);
const fmt = (value) => JSON.stringify(value, null, 2);

const document = (slug, kind, title) => {
  const id = docSha(slug);
  return {
    id,
    sha256: id,
    slug,
    kind,
    title,
    originalFile: `originals/${id}.${kind === 'pdf' ? 'pdf' : 'xlsx'}`,
    status: 'extracted',
    coverage: { pages: kind === 'pdf' ? 2 : undefined, sheets: kind === 'xlsx' ? 1 : undefined, extracted: 1 },
    limitations: [
      'Bundled search index built from data/athar-jv-month-timeline.json for deployment without a private ATHAR_CORPUS_DIR.',
      'Replace with `npm run provision` output for full cell-level workbook evidence and verified originals.',
    ],
  };
};

const chunk = (id, documentId, slug, kind, text, location, label) => ({
  id: `src-${id}`,
  documentId,
  documentSlug: slug,
  kind,
  text,
  location,
  label,
});

const main = () => {
  if (!fs.existsSync(TIMELINE)) {
    console.error(`Missing ${path.relative(REPO, TIMELINE)}`);
    process.exit(1);
  }
  const plan = JSON.parse(fs.readFileSync(TIMELINE, 'utf8'));
  const overview = plan.overview || {};
  const gates = plan.gates || overview.six_gate_ladder?.gates || [];
  const commercials = overview.anchors_and_commercial_baseline || {};
  const chunks = [];
  let n = 0;

  const finSummary = document('financial-summary', 'pdf', 'Athar JV — Financial Model Executive Summary (3)');
  const finModel = document('financial-model', 'xlsx', 'Athar JV — Financial Model v13');
  const implPlan = document('implementation-plan', 'xlsx', 'ODA × AIREV Athar — 6-Month Implementation Plan (Oct 2026 – Mar 2027, v1)');

  const push = (doc, slug, kind, text, location, label) => {
    chunks.push(chunk(String(++n).padStart(3, '0'), doc.id, slug, kind, text, location, label));
  };

  push(
    finSummary,
    'financial-summary',
    'pdf',
    `${overview.title || 'Athar JV Executive Summary'}\n${overview.purpose || ''}\n${overview.status_banner || ''}\nPeriod: ${overview.period || ''}`,
    { page: 1 },
    'Executive summary — overview',
  );
  push(
    finSummary,
    'financial-summary',
    'pdf',
    (overview.headline_metrics || []).map((m) => `${m.value} — ${m.label}`).join('\n'),
    { page: 1 },
    'Executive summary — headline metrics',
  );
  push(
    finSummary,
    'financial-summary',
    'pdf',
    gates.map((g) => `${g.gate || g.id}: ${g.date_label || g.date} — ${g.title || g.label}`).join('\n'),
    { page: 1 },
    'Executive summary — six gates',
  );
  push(
    finSummary,
    'financial-summary',
    'pdf',
    [
      `Seat blocks total: ${commercials.seat_blocks_total ?? '~500'}`,
      ...(commercials.seat_blocks || []).map((b) => `${b.entity}: ${b.seats} seats`),
      `Seat rate: AED ${commercials.seat_rate?.aed_per_seat_per_month ?? 1000} per seat per month (USD ${commercials.seat_rate?.usd_per_seat_per_month ?? 272})`,
      commercials.contracting,
      commercials.billing_start,
      commercials.base_case,
      commercials.upside,
      commercials.financial_model_note,
    ].filter(Boolean).join('\n'),
    { page: 2 },
    'Executive summary — anchors and commercials',
  );

  push(
    finModel,
    'financial-model',
    'xlsx',
    [
      `Committed capital AED ${commercials.committed_capital_aed ?? '—'}`,
      `Equity per partner AED ${commercials.equity_per_partner_aed ?? '—'}`,
      `ODA NPV @ ${commercials.npv?.ODA?.discount_rate ?? '3.5%'}: AED ${commercials.npv?.ODA?.aed ?? '—'}`,
      `AIREV NPV @ ${commercials.npv?.AIREV?.discount_rate ?? '10%'}: AED ${commercials.npv?.AIREV?.aed ?? '—'}`,
      `Year-1 revenue AED ${commercials.year1_revenue?.aed ?? commercials.revenue_build_aed?.Y1 ?? '—'} (${commercials.year1_revenue?.basis || ''})`,
      `Revenue build AED Y1 ${commercials.revenue_build_aed?.Y1 ?? '—'} · Y2 ${commercials.revenue_build_aed?.Y2 ?? '—'} · Y3 ${commercials.revenue_build_aed?.Y3 ?? '—'}`,
      commercials.financial_model_note,
    ].filter(Boolean).join('\n'),
    { sheet: 'Outputs', range: 'A1:D12' },
    'Financial model v13 — consolidated outputs (from executive summary)',
  );
  push(
    finModel,
    'financial-model',
    'xlsx',
    [
      `Products: ${overview.product_and_compliance?.catalogue || '36 products · 12 departments · 16 hardened first'}`,
      `Owner-signed products at go-live (G3): ${overview.product_and_compliance?.owner_signed_products?.at_go_live_G3_2026_12_25 ?? 8}`,
      `End Year 1: ${overview.product_and_compliance?.owner_signed_products?.end_year_1 ?? 20}`,
      `Agents at maturity: ${overview.product_and_compliance?.agents_at_maturity || '~1,275'}`,
    ].join('\n'),
    { sheet: 'Assumptions', range: 'A1:D8' },
    'Financial model v13 — product assumptions',
  );

  push(
    implPlan,
    'implementation-plan',
    'xlsx',
    gates.map((g) => `${g.gate || g.id} · ${g.date_label || g.date} · ${g.title || g.label} · phase ${g.phase || ''}`).join('\n'),
    { sheet: 'Gates', range: 'A1:F8' },
    'Implementation plan — six gates',
  );
  for (const month of (plan.months || []).slice(0, 6)) {
    const lines = (month.initiatives || []).slice(0, 12).map((item) =>
      `${item.id || item.name}: ${item.name || item.title} · ${item.status_in_month || item.status} · gate ${item.gate || ''} · ${item.start || ''} → ${item.end || ''}`,
    );
    push(
      implPlan,
      'implementation-plan',
      'xlsx',
      `${month.month} (${month.period?.start || ''} → ${month.period?.end || ''})\n${lines.join('\n')}`,
      { sheet: 'Master', range: 'A1:H40' },
      `Implementation plan — ${month.month}`,
    );
  }
  push(
    implPlan,
    'implementation-plan',
    'xlsx',
    (overview.outcomes_by_month6_gate || []).join('\n'),
    { sheet: 'Milestones', range: 'A1:D10' },
    'Implementation plan — Month-6 outcomes',
  );

  const index = validateCorpusIndex({
    schemaVersion: 'athar-corpus/v1',
    extractorVersion: 'athar-bundled-bootstrap/1.0.0',
    generatedAt: new Date().toISOString(),
    documents: [finSummary, finModel, implPlan],
    chunks,
  });

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.json'), `${fmt({ schemaVersion: index.schemaVersion, extractorVersion: index.extractorVersion, generatedAt: index.generatedAt, documents: index.documents, chunks: index.chunks })}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(REPO, OUT),
    documents: index.documents.length,
    chunks: index.chunks.length,
    next: 'Restart the dev server. Chat uses data/corpus automatically when ATHAR_CORPUS_DIR is unset.',
  }, null, 2));
};

main();
