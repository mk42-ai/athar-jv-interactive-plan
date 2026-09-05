# Presentation workspace and protected original-source review

This extends the existing Athar application and `feature/new-deck-guide-mode`; it does not replace the deck, timeline, voice widget, or recorded narrator. Historical QA in README is historical only, not evidence for the current build.

## Runtime

Use Node 22+, `npm ci`, `npm test`, `npm run build`, then `npm start`. The production Express server serves `dist` and the existing API together. Do not use bare `vite preview` as an API test host. `PORT` defaults to 5173. `ATHAR_BUILD_SHA` identifies the deployed source commit through the public, content-free `/api/health`.

The existing presentation retains its exact PDF, timeline data and recorded narration. Confidential review deployments set `ATHAR_PRIVATE_PRESENTATION=1`, protecting the app bundle, deck, narration and QA assets behind the same reviewer boundary; the anonymous landing page contains only the access form. Its original tiny type cannot be legible at full-slide phone size: **Fit page** keeps it whole, **Readable zoom** enables intentional pan, and **Read text** exposes actual PDF.js text at 16px. The latter follows PDF source order, not an invented human reading order. The rail, expanded caption, month details and existing companion occupy distinct in-flow layout areas. Desktop companion width and stacked conversation height can be resized with a labelled native range control. Fullscreen and short windows can scroll expanded content rather than cover the canvas.

Narration uses only the existing verified static/embedded MP3s. Both audio and narration-script SHA256 must match. Missing source/failed playback produces an error and Retry; never a different provider, Web Speech, a silent timer or a live synthesis charge. Retry refreshes a failed manifest. The 750ms inter-moment breath pauses with the guide.

## Host-only configuration and storage

Provision **outside the project root**, via encrypted host environment or an owner-only file selected by `ATHAR_CONFIG_FILE`:

- `ON_DEMAND_API_KEY` (or `ONDEMAND_API_KEY`): existing provider credential; never a browser key.
- `ATHAR_REVIEW_PASSPHRASE`: a separate reviewer access code; never the provider key.
- `ATHAR_SESSION_SECRET`: independently random, at least 32 characters.
- `ATHAR_CORPUS_DIR`: absolute protected ingestion directory.

Do not put actual secrets in the template, repository, ZIP, public assets, URLs, logs or screenshots. The old redundant non-dot `env.local` delivery pattern is no longer recommended. Public health reports availability booleans/build identity, not key fragments, session IDs or private paths.

The source ZIP does **not** contain the originals or private corpus. Provision those separately on a trusted host. An ephemeral sandbox is not durable storage: after expiry the host must restore the protected corpus/configuration. Without them the evidence service fails closed, never falls back to the public timeline as authoritative original evidence.

## Ingestion

`python3 scripts/ingest_documents.py --input-dir /protected/originals --output-dir /protected/athar-corpus`

The extractor deduplicates by whole-file SHA256, preserves immutable originals, writes complete raw records as compressed JSONL, and atomically writes a deterministic bounded search index. It traverses every PDF page, actual slide/notes part and workbook sheet/cell. Cell provenance includes raw lexemes, formulas/shared-formula relationships, cache presence, styles/number formats, table headers, scenario/unit labels, exact ranges and derived display formatting. Explicitly absent saved formula results are **not zero**. Dense simulation rows are all preserved in raw storage; the search index contains bounded deterministic samples and raw selectors, not a fabricated statistical summary. PDF images and proprietary Office/OLE chart payloads are preserved as original parts but not OCR-decoded. Formula caches are not proof of a fresh recalculation.

`POST /api/documents/retry` reopens and validates an already-provisioned index; it does not pretend to recalculate workbooks or download missing files. Re-run the operator ingestion CLI when the original file or extractor changes.

## Access boundary

`POST /api/access` requires the separate reviewer code and a same-origin request, sets a signed HttpOnly cookie — `SameSite=None; Secure` over HTTPS so the session also works when the workspace is embedded in a preview panel (iframe); `Lax` on a plain-HTTP dev host; `ATHAR_COOKIE_SAMESITE` can pin `lax`/`strict` — and retains a bounded six-hour server session. Eight failed attempts trigger throttling. `DELETE /api/access` revokes it. No provider credential enters the client.

Document status, chat sessions/questions, citations and originals require review access. Conversation IDs belong to their authenticated principal. Missing, expired or forged access is rejected; mutation routes enforce same-origin/CSRF checks. Original download routes resolve only allowlisted immutable source IDs and rehash the original bytes. Source/citation responses are private/no-store. Voice calls share the same authorization and evidence answer path; audio callbacks use short-lived, single-media signed capabilities. Legacy arbitrary upstream execution/STT diagnostic entrypoints are closed.

This is a shared project reviewer role, not enterprise identity/RBAC. For multi-tenant production, replace the review-code gate with the host identity provider, durable session store, user/document ACLs and distributed rate limiting.

## Retrieval and answer contract

Local BM25 retrieval preserves selected-document/slide boundaries, prioritizes explicit real cell locators, diversifies comparisons and sends only bounded evidence to the existing On Demand fulfillment endpoint. Live public API reference documents were consulted for session creation and synchronous queries. Each answer gets a fresh upstream session; only previous **user question wording** in the same scope resolves follow-ups. Prior assistant facts cannot leak across document filters.

The model selects evidence and identifies calculations/conflicts/missing information. Documents, user queries and prior wording are explicitly untrusted data. No tools/URLs/document instructions are executed. Source facts are rendered from exact quotations, not model paraphrases. When a model repeats a heading and selects a later row, the server may expand it to the **actual contiguous source span**, including intervening rows/qualifiers; changed values or reordered fragments cannot be repaired into evidence. Unknown IDs, invented quotes and incompatible units are rejected before delivery. The server computes the small supported arithmetic operations from validated quoted operands. The existing chat receives only a validated final-answer SSE event, never unvalidated factual deltas. One repair attempt is allowed; unresolved validation failures are visible, not canned answers.

An exact quote is not proof of source truth or complete semantic interpretation. The API explicitly marks `sourceTruthVerified:false` and `semanticEntailmentVerified:false`. The real-source test suite separately checks completeness, scenarios, units, original locations, unresolved agreement language and requested arithmetic. Treat any failing/blocked case in the current QA manifest as unresolved.

## Tests and evidence

- `npm test`: native Node tests for retrieval, exact quotes, units, arithmetic, locator validity, access controls, ownership, negative provider behavior, narrator assets/failures and Python verifier regressions.
- `npm run test:ingestion`: synthetic complete-format/dedup/cache/path-injection tests.
- `npm run test:ui-unit`: runner/proxy/redaction fixtures.
- `python3 tests/grounding_cases.py --url <origin> --corpus /protected/athar-corpus --output /private/qa.json`: opt-in **real** AI suite. Supply reviewer code in environment only. Re-extracts complete originals and verifies returned IDs, locations, quotations, concepts, values and arithmetic independently. No raw answers or credentials in its report.
- `tests/ui/run.py`: documented ui-validator/installed Chromium driver, four real asserted inner dimensions and matching screenshots. Stage/sequence are real DOM and native audio; extended cases are explicitly mock fault injection. DOM focus/key dispatch is not physical keyboard certification. Full sequence proof requires all configured native ended events at playback rate 1 without seeks.

The current machine-readable QA manifest records build/origin/time and separates baseline defects, normal live behavior, fault injection, source-oracle corrections, unit assertions, grounding failures and external limitations. Do not substitute an earlier QA count or a successful HTTP response for grounded/browser success.


## In-place mobile and source review update

Phone layouts use persistent **Presentation / Ask AI** views rather than overlaying the slide. Both components remain mounted: switching view preserves the guide's current moment/audio, page, conversation and scope. The shared compact narration controls in Ask AI act on the same guide instance. Tablet/desktop keep the resizable adjacent/stacked companion. Technical voice information is a separate expandable in-flow disclosure; transcript expansion never covers the slide.

Exactly three starter questions are provided. **This document** sends a selected immutable source ID; **All documents** sends the all-document scope. A generic document-summary request retrieves the selected source rather than silently consulting the timeline. The model chooses deterministic source-passage IDs; original quotes are reconstructed server-side, avoiding fragile retyping. Page/slide/sheet bounds and original IDs remain checked independently. Calculations validate source operands and units; different scenarios are not automatically version conflicts. A capital/milestone co-occurrence is not a dependency: absent an explicit source linkage, the answer states that it is not established.

`GET /api/citations/:id/view` opens the actual citation location. PDF pages use the protected original, PPTX slides use a hash-bound private LibreOffice PDF derivative, and worksheets use bounded original cell regions with highlighting and separate value/formula/cache/number-format inspection. Navigation retains the initial citation and can return to it; no ingestion URL or guessed source identifier is exposed. Every view/preview/download route retains review authorization and private/no-store caching.

Prepare PPTX previews explicitly after ingestion with `python3 scripts/prepare_source_views.py --corpus /protected/athar-corpus`. This uses an isolated macro-restricted LibreOffice profile and rejects external relationships; for OS-enforced network isolation, run the conversion worker offline. No original is modified. Every authorized source open rehashes protected files; timestamp metadata is not sufficient integrity evidence on snapshot filesystems.

Current-turn QA is in the downloadable sanitized recovery/QA manifest, not a historical README count. Use `tests/ui/resume_runner.py` for current mobile views and real source viewer checks. Its authenticated loopback broker forwards actual deployed bytes/API while keeping the cookie only in memory; this does not by itself certify deployed-origin cookies or physical input, which need separate checks.


## Current recovery: forward-only confidential payload remediation

The public repository previously contained the exact rendered deck, its base64 copy, the consolidated presentation timeline, narration text and prerecorded MP3/base64 payloads. Those historical exposures cannot be recalled without coordinated repository/cache cleanup; no history was rewritten. The current tree removes all of those payloads and keeps only rendering/player logic. The immutable originals for document review remain separate in the protected corpus.

Provision `ATHAR_PRESENTATION_DIR` outside the source/static root, owner-only directory mode 0700 and files mode 0600. This store preserves the existing plan, full guide script, exact presentation PDF and all recorded clip hashes. The client requests `/api/presentation` only after legitimate reviewer access, initializes request-memory data and then loads the existing app. No confidential plan/deck/narration content is compiled into the JavaScript bundle. Both PDF and MP3 HTTP aliases require review authorization unconditionally; public rehydration is disabled. The private store is excluded from Git, source ZIPs and static builds. It must be separately restored for future deployments; a missing store gives a visible 503/retry state, never substitute content.

Exact selected worksheet constraints are now enforced even without a named cell. When a requested saved cell exists in complete raw storage but not the dense simulation sample index, the server loads that verified raw record, labels it explicitly as a raw-record projection, and issues a reviewer-bound citation. That citation opens the exact worksheet/cell, not a generic original download. Formula/cache/display provenance stays separate. Raw evidence is not mislabelled as indexed prose and cannot cross reviewer identities or selected documents.

Comparison and capital-decision starter questions receive substantive completeness checks, in addition to original quote/source-ID validation. Broad unresolved-item coverage does not improperly apply to a narrowly scoped follow-up about one threshold. No inferred capital-to-milestone dependency is promoted to a source-stated fact. Updated source-view UI retains focused navigation while loading and consumes Escape at the nearest disclosure before closing the companion.

`docs/resume-progress.jsonl` is a sanitized append-only checkpoint log for this execution. Exact input transport signatures, credentials, confidential excerpts and detailed answer traces are never recorded there. Use the private session evidence attachments for detailed current-run QA; historical QA counts elsewhere are not current proof.

## Spatial refinement, collapsible companion and document registry (5 Sept 2026)

The player remains the last in-flow row of the viewer (`GuideBar`), now reduced to transport · section indicator · Transcript ·
information menu · exit, with the progress line on its top edge. Technical narration details (provider, model, clip SHA-256
verification, shortcuts) moved into the ⓘ menu (`role="dialog"`, light-dismiss, Escape returns focus). The transcript is a jump
list. On desktop the companion column is collapsible (76 px rail) and resizable by splitter or range control; the presentation
column always takes the remaining width. Phone views are unchanged (Presentation / Ask AI tabs, persistent mounts).

`server/documentRegistry.js` is the source of truth for the four expected documents. `/api/documents` merges it with the
corpus index, so a document that was never provisioned appears with status `missing`, a reason, and the environment variable
that would provision it — never a silently smaller corpus. Answers append a `Coverage` section naming any document that could
not be consulted, and the same sentence is added to `evidence.missing` (voice reads it too). Citation labels now carry the
document and location (`<document> · Slide n | Page n | Sheet!Range`); a deck provisioned as its exact PDF rendering keeps slide
semantics end to end (retrieval maps `slide N` to page N; `evidenceAnswer.describeLocation` labels it `Slide N`).

`scripts/provision_sources.py` (`npm run provision`) downloads missing originals from `ATHAR_SOURCE_URL_<SLUG>` into the
protected input directory, pins slugs in a manifest and runs `ingest_documents.py`. Signed URLs stay in the host environment.
`GET /api/health?probe=1` (reviewer session) runs the live key probe (create + read session) and returns booleans/status codes
only. Tests: `tests/documentRegistry.test.mjs` covers registry merging, URL redaction, paged-deck slide scoping and labels.

## Embedding in preview panels (5 Sept 2026)

The deployed preview was reported as "refused to connect". Top-level navigation always worked; the failure was the
platform's *embedded* preview: every response carried `X-Frame-Options: SAMEORIGIN`, which makes Chromium render
"refused to connect" for any cross-origin `<iframe>`, and the reviewer cookie was `SameSite=Strict`, which a browser
never sends from a third-party frame. Both are now configurable at the host boundary (no client code involved):

- `Content-Security-Policy: frame-ancestors <ATHAR_FRAME_ANCESTORS | *>` replaces `X-Frame-Options` (removed on every
  response). Default `*` allows any embedder; set a CSP source list to restrict.
- The session cookie is `SameSite=None; Secure` on HTTPS (or `X-Forwarded-Proto: https`), `Lax` on plain HTTP, or the
  value pinned by `ATHAR_COOKIE_SAMESITE`. CSRF protection remains the same-origin `Origin`/`Sec-Fetch-Site` check on
  every mutating route, so the relaxed SameSite does not weaken it.
- The login shell detects a framed context and offers "open the workspace in a new tab"; after a successful sign-in it
  re-checks `GET /api/access` and says so explicitly when the browser dropped the cookie (Safari/ITP and browsers with
  third-party cookies disabled still block cookies inside cross-site frames — the new-tab link is the fallback there).

Tests: `tests/access.test.mjs` covers the SameSite matrix (HTTPS → `None; Secure`, HTTP → `Lax`, pinned modes), the
CSP header on every response and the absence of `X-Frame-Options`.

## Public presentation mode (5 Sept 2026)

`server/privatePresentation.js` owns the presentation access mode. It is decided at the host boundary only — by the
environment or an explicit start-up flag — never by request headers, cookies or query parameters:

| Mode | How it is selected | Bundle + login shell | `/api/presentation`, `/api/guide*`, `/deck`, `/guide-audio` | Document-connected AI (`/api/documents`, `/api/citations`, `/api/sources`, `/api/chat`, `/api/voice`) |
|---|---|---|---|---|
| Public | `ATHAR_PRIVATE_PRESENTATION=0` (or `false`/`public`), or `node server/index.js --presentation-preview` (`npm run preview`) | served to everyone, no shell | public, GET/HEAD only (`X-Presentation-Mode: public`, `no-store`) | reviewer session required (AccessGate inside the companion) |
| Private | `ATHAR_PRIVATE_PRESENTATION=1` | login shell, 401 elsewhere | reviewer session required | reviewer session required |
| Gated (legacy) | variable unset | bundle served, no shell | reviewer session required | reviewer session required |

`presentationReadAccess(access, { presentationPreview })` (alias `presentationAccess`) is the single guard used by
`server/api.js` and `server/index.js` for the payload routes; `GET /api/health` reports `presentationMode`. Public mode
means the deck, derived timeline and narration clips are readable by anyone who has the deployment URL — choose it
deliberately. Original source documents, citations and the On Demand-backed answers stay behind the reviewer code in
every mode. Tests: `tests/privatePresentation.test.mjs` (environment switch) and `tests/presentationPreview.test.mjs`
(start-up flag; headers/cookies/query strings cannot select the mode).
