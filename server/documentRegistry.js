// Registry of the four review documents the document-connected AI is expected to cover.
//
// The protected corpus (ATHAR_CORPUS_DIR) only knows about originals that were actually ingested.
// This registry lets the API tell the reviewer, explicitly, which of the four expected documents
// are indexed and which are MISSING — and how a missing original can be provisioned — instead of
// silently answering from a subset.
//
// Signed download URLs are time-limited credentials for confidential files. They are read from the
// host environment (git-ignored .env / deployment variables), never committed: this repository is
// public. `npm run provision` (scripts/provision_sources.py) downloads a missing original from its
// configured URL into the protected input directory and re-runs the offline ingestion.
import { loadDotEnv } from './env.js';

export const EXPECTED_DOCUMENTS = Object.freeze([
  Object.freeze({
    slug: 'executive-presentation', order: 1, kind: 'pptx', alternateKinds: Object.freeze(['pdf']),
    title: 'Executive-summary slide deck',
    role: 'The 2-slide executive summary presented in this workspace (v3 deck).',
    envUrl: 'ATHAR_SOURCE_URL_EXECUTIVE_PRESENTATION',
    note: 'Preferred original: the v3 PPTX. Alternate accepted original: the exact 2-page PDF rendering shown by the presentation viewer (slide N = page N).',
  }),
  Object.freeze({
    slug: 'financial-summary', order: 2, kind: 'pdf', alternateKinds: Object.freeze([]),
    title: 'Financial-model executive-summary PDF',
    role: 'Two-page executive summary of the consolidated financial model (status 31 Aug 2026).',
    envUrl: 'ATHAR_SOURCE_URL_FINANCIAL_SUMMARY',
    note: 'Derived from the consolidated model; figures here are stated values, not the model workbook itself.',
  }),
  Object.freeze({
    slug: 'financial-model', order: 3, kind: 'xlsx', alternateKinds: Object.freeze([]),
    title: 'Financial model v13 workbook',
    role: 'Consolidated financial model (Outputs, Control, Assumptions, Risk, Draws sheets).',
    envUrl: 'ATHAR_SOURCE_URL_FINANCIAL_MODEL',
    note: 'No signed URL was supplied for this workbook and the platform file directory holds no v13 copy; cell-level questions about the model cannot be answered until it is provisioned.',
  }),
  Object.freeze({
    slug: 'implementation-plan', order: 4, kind: 'xlsx', alternateKinds: Object.freeze([]),
    title: 'Six-month implementation-plan workbook',
    role: 'ODA × AIREV Athar 6-month implementation plan, Aug 2026 – Jan 2027 (v1).',
    envUrl: 'ATHAR_SOURCE_URL_IMPLEMENTATION_PLAN',
    companionEnvUrl: 'ATHAR_SOURCE_URL_IMPLEMENTATION_PLAN_PDF',
    note: 'A PDF export of the same workbook is configured as a companion reference; the workbook is the cited original.',
  }),
]);

const SIGNED_URL_HOSTS = /\.blob\.core\.windows\.net$/i;

/** Metadata only — never the URL itself, never a signature. */
export function describeSignedUrl(value) {
  if (!value || typeof value !== 'string') return { configured: false };
  let url;
  try { url = new URL(value); } catch { return { configured: false, valid: false }; }
  if (url.protocol !== 'https:') return { configured: false, valid: false };
  const params = url.searchParams;
  const expiresAt = params.get('se');
  const expires = expiresAt && Number.isFinite(Date.parse(expiresAt)) ? new Date(expiresAt) : null;
  const fileName = decodeURIComponent(url.pathname.split('/').pop() || '');
  return {
    configured: true, valid: true, host: url.hostname, trustedHost: SIGNED_URL_HOSTS.test(url.hostname), fileName,
    signed: params.has('sig'), expiresAt: expires ? expires.toISOString() : null,
    expired: expires ? expires.getTime() <= Date.now() : null,
  };
}

/** Env-configured provisioning URL for a slug (server-side only; returned to no client). */
export function provisioningUrl(slug) {
  loadDotEnv();
  const entry = EXPECTED_DOCUMENTS.find((d) => d.slug === slug);
  return entry ? process.env[entry.envUrl] || null : null;
}

/**
 * Merge the registry with the indexed corpus documents. Indexed documents keep their exact shape
 * (id === SHA-256, coverage, limitations, status). Expected documents that are not indexed are
 * appended with status "missing", a stable non-SHA id, and a provisioning description.
 */
export function mergeExpectedDocuments(indexed = []) {
  loadDotEnv();
  const bySlug = new Map();
  for (const doc of indexed) if (!bySlug.has(doc.slug)) bySlug.set(doc.slug, doc);
  const out = [];
  for (const expected of EXPECTED_DOCUMENTS) {
    const doc = bySlug.get(expected.slug);
    const source = describeSignedUrl(process.env[expected.envUrl]);
    const companion = expected.companionEnvUrl ? describeSignedUrl(process.env[expected.companionEnvUrl]) : null;
    const provisioning = {
      expectedKind: expected.kind, alternateKinds: [...expected.alternateKinds], envVar: expected.envUrl,
      signedUrl: { configured: source.configured, fileName: source.fileName || null, expiresAt: source.expiresAt || null, expired: source.expired ?? null },
      ...(companion ? { companionEnvVar: expected.companionEnvUrl, companion: { configured: companion.configured, fileName: companion.fileName || null, expiresAt: companion.expiresAt || null, expired: companion.expired ?? null } } : {}),
      note: expected.note,
    };
    if (doc) {
      out.push({ ...doc, order: expected.order, expectedTitle: expected.title, role: expected.role, provisioning,
        alternateOriginal: doc.kind !== expected.kind ? { indexedKind: doc.kind, expectedKind: expected.kind } : null });
    } else {
      out.push({
        id: `missing-${expected.slug}`, slug: expected.slug, title: expected.title, kind: expected.kind, status: 'missing',
        order: expected.order, expectedTitle: expected.title, role: expected.role, coverage: null,
        limitations: [
          `Original not provisioned: ${expected.title} is not in the protected corpus, so no question can be answered from it.`,
          source.configured
            ? `A signed download URL is configured (${source.fileName || 'file'}${source.expiresAt ? `, expires ${source.expiresAt}` : ''}${source.expired ? ', EXPIRED' : ''}); run \`npm run provision\` on the host to fetch and ingest it.`
            : `No download URL is configured (${expected.envUrl}); place the original in the protected input directory or set the variable, then run \`npm run provision\`.`,
        ],
        provisioning,
      });
    }
  }
  // Indexed documents with an unexpected slug (none today) are still returned after the registry.
  for (const doc of indexed) if (!EXPECTED_DOCUMENTS.some((e) => e.slug === doc.slug)) out.push({ ...doc, order: 99 });
  return out.sort((a, b) => a.order - b.order);
}

/** Summary for /api/health: counts only, no names of private files. */
export function registrySummary(indexed = []) {
  const merged = mergeExpectedDocuments(indexed);
  return {
    expected: EXPECTED_DOCUMENTS.length,
    indexed: merged.filter((d) => d.status !== 'missing').length,
    missing: merged.filter((d) => d.status === 'missing').map((d) => d.slug),
    signedUrlsConfigured: EXPECTED_DOCUMENTS.filter((e) => describeSignedUrl(process.env[e.envUrl]).configured).map((e) => e.slug),
  };
}
