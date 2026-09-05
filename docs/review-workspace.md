# Presentation workspace and protected original-source review

This extends the existing Athar application and `feature/new-deck-guide-mode`; it does not replace the deck, timeline, voice widget, or recorded narrator. Historical QA in README is historical only, not evidence for the current build.

## Runtime

Use Node 22+, `npm ci`, `npm test`, `npm run build`, then `npm start`. The production Express server serves `dist` and the existing API together. Do not use bare `vite preview` as an API test host. `PORT` defaults to 5173. `ATHAR_BUILD_SHA` identifies the deployed source commit through the public, content-free `/api/health`.

The public presentation retains its existing exact PDF, timeline data and recorded narration. Its original tiny type cannot be legible at full-slide phone size: **Fit page** keeps it whole, **Readable zoom** enables intentional pan, and **Read text** exposes actual PDF.js text at 16px. The latter follows PDF source order, not an invented human reading order. The rail, expanded caption, month details and existing companion occupy distinct in-flow layout areas. Desktop companion width and stacked conversation height can be resized with a labelled native range control. Fullscreen and short windows can scroll expanded content rather than cover the canvas.

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

`POST /api/access` requires the separate reviewer code and a same-origin request, sets a signed HttpOnly SameSite=Strict cookie (Secure over HTTPS), and retains a bounded six-hour server session. Eight failed attempts trigger throttling. `DELETE /api/access` revokes it. No provider credential enters the client.

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
