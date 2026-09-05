# UI regression contract

Tests only. Uses the **installed `ui-validator` CLI** as the sole Chromium/CDP
driver; Python standard library; no Playwright/Puppeteer, no new browser stack,
no app/server/package edits. Load the `github` and `ui-validator` skills before
use. Do not inspect or modify `ui_validate.py`.

## Baseline provenance and honesty

`assertions-contract.json` is a **byte-for-byte** copy of the completed baseline
contract supplied in `/tmp/athar-run`. Its SHA-256 is
`77b7ca52399937ab2c3db0027d11b4ad62fe9637d0dc234b4cee3d2e4c0fee1b`.
The original `harness.js` SHA-256 was
`096acdae0066796a6fb9b843759658fee4d5e31172bfe58ececea84e50afbe5d`.
The historical baseline is already complete; porting these tests does **not**
constitute another baseline or an after result.

The supplied baseline README reports all **21 natural, trusted ended events**
at rate one, page sync and clip provenance at all four sizes: 1440×900, 390×844,
834×1112, 1275×451. Each full tour took approximately 308 seconds, including
290.960 seconds of media. Layout/focus/readability defects were intentionally
failing baseline assertions, not failures to execute the baseline. This port
has not independently rerun or reinterpreted those historical observations.

All original 16 interaction assertions, 8 sequence assertions and 7 per-stage
assertions remain mandatory. Stage mode requires every one of the six original
stages; a missing stage cannot become a vacuous pass. Before/after use the same
code, tolerances, stage IDs and contract. The new code additionally:

* awaits stable rendered geometry and finite highlight entry animations before
  measuring alignment (up to configurable `settleMs`, no style or media mutation);
* recognizes explicit **Read text / Readable zoom** guidance as acknowledgement
  of tiny fit-mode text, not a claim that fit mode is readable;
* includes in-flow companion focus targets and genuine companion resize
  affordances adjacent to the chat widget;
* rejects wrong CSS viewport **and** wrong PNG dimensions;
* treats decoded checks as the pass criterion, not truthy polling/transport evals.

The source-PDF minimum font metric (7.001999855041504 pt) is preserved from the
baseline as a numeric metric, not source text. Canvas containment alone does not
prove viewport visibility. CSS contrast calculations do not prove raster text
contrast. DOM `.click()`, `.focus()`, scrolling and `KeyboardEvent` dispatch do
not prove physical mouse, keyboard, tab order, dragging or native fullscreen.
No media clock/rate/ended event manipulation occurs in stage/sequence mode.

## Commands

Run from the **workspace root**, not an arbitrary temp directory. Screenshots
and sanitized JSON go to that cwd's `.ui-proof/`; no `--out-dir` is passed to the
validator. Paths below assume the repository is `athar-jv-interactive-plan/`.

```bash
# Offline unit tests and syntax checks; no changed-app browser run.
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s athar-jv-interactive-plan/tests/ui -p 'test_*.py' -v
node --check athar-jv-interactive-plan/tests/ui/harness.js
node --check athar-jv-interactive-plan/tests/ui/extended.js

# Safe planning only; no browser, authentication, network or evidence files.
python3 athar-jv-interactive-plan/tests/ui/run.py --url http://127.0.0.1:5173 --stage after --mode stage --dry-run

# Six original interaction/layout stages, all four baseline sizes by default.
python3 athar-jv-interactive-plan/tests/ui/run.py --url http://127.0.0.1:5173 --stage after --mode stage

# Unaccelerated 21-moment tour at all four sizes (roughly 21 min total).
python3 athar-jv-interactive-plan/tests/ui/run.py --url http://127.0.0.1:5173 --stage after --mode sequence

# Isolated fixture UI contracts; fresh Chromium and mock origin per case/size.
python3 athar-jv-interactive-plan/tests/ui/run.py --url http://127.0.0.1:5173 --stage after --mode extended

# Select sizes/cases; replace the URL with the live sb-*.vercel.run origin if needed.
python3 athar-jv-interactive-plan/tests/ui/run.py --url http://127.0.0.1:5173 --stage after --mode extended --case reader --case citations --viewport 390x844 --viewport 1275x451
```

Add `--build-sha "$BUILD_SHA"` when the main agent has the actual revision.
It is optional, stored verbatim as caller-supplied metadata, and is **not**
independently verified by this runner. Actual UTC timestamps are generated at
start/end; no claimed build or current date is invented.

`--stage before` changes only artifact labels. Do not overwrite the completed
baseline. Existing selected reports are refused unless `--overwrite` is given;
that flag replaces only the selected run, never globs/deletes `.ui-proof`.
Output names: `after-stage-1440x900.json/.png`,
`after-playback-1440x900.json/.png`, `after-extended-reader-390x844.json/.png`.
Exit codes: **0 pass, 1 assertion failure, 2 unavailable/invalid invocation**.
The runner never prints the subprocess command or raw stdout/stderr.

Optional settings: `--validator PATH`, `--config overrides.json`,
`--wait-ms N`, `--timeout SEC`, `--polls N`, `--max-chunks N`,
`--chunk-size N` (≤160, default 112). `--viewport` / `--case` are repeatable.
An unaccelerated sequence is intentionally not a short CI smoke test.

The exec-only `chromium-test` wrapper is selected through documented
`CHROMIUM_BIN`. It uses the installed binary (`ATHAR_CHROMIUM_REAL_BIN`, default
`/usr/bin/chromium`), app-window mode, and the baseline's measured 56px height
compensation (`ATHAR_CHROME_HEIGHT`). Wrong viewport assertions must fail rather
than silently accepting a new Chromium/window-manager behavior. The wrapper is
not a second browser driver.

## Extended cases (separate from baseline/grounding)

Every extended screenshot includes a **MOCK / ISOLATED UI CONTRACT** disclosure.
The fixture proxy supplies invented document titles, document IDs and marked
mock response text only. No source corpora, extracted answers, signed links,
API credentials, or proprietary content are included in these tests.

| Case | Assertions / important scope |
|---|---|
| `reader` | Explicit fit-page state and two-axis containment, readable zoom enlargement and scrollable pan surface, synthetic next/previous keys, reflow text labels/font/line height/wrapping/page sync, focus and 44px controls. No extraction accuracy/physical keyboard claim. |
| `context` | Ask-this-slide opens/pre-fills without sending; outgoing mocked query retains selected document and slide. Ask-this-document changes context without auto-send; document filtering clears slide; pending source cannot broaden to all; synthetic separator keys, closed inertness/escape/focus restoration, controls and canvas separation. |
| `context-missing` | Missing requested slide source stays unavailable; no silent fallback to another/all sources and no send. |
| `citations` | Mock citation panel, focus, same-origin protected original link; rejection of external/JavaScript/data URLs; failure has no invented excerpt; 401 clears citation/answer UI. Link target is inspected, not downloaded. |
| `source-errors` | Initial sources-fetch failure, query disabled, explicit retry to ready fixtures, query transport failure with no fallback answer/citation and selected filter retained. |
| `source-loading` | Processing/ingestion status, no query/answer/citations before ready, recovery through the real UI's polling against changing fixture state. |
| `auth-denied` | Mock GET `/api/access` returns `{authenticated:false,enabled:true}`; password gate and query disabled; no protected fetch before explicit negative probes; mock citations/originals denied. **Not actual server authorization enforcement.** |
| `audio-error` | Temporarily reject `HTMLMediaElement.play`; require error/retry and stopped clock, restore original `play` in `finally`, click Retry, observe original rate-one playback recover. Not full-sequence/provenance proof. |
| `fetch-error` | Wrap failing guide fetches; require error and no browser-TTS/false playback success. Restore original fetch/speech in `finally`, then Retry. The injected-failure count must be >0: a cached/unintercepted path cannot pass. |

Negative fixture HTTP console errors are permitted only when the matching
401/503 failure was actually recorded by the proxy, bounded by that request
count. Unexpected console messages and page errors still fail; reports retain
counts, not raw messages. `--allow-console-errors` is used only for extended
cases, with this explicit post-validation gate rather than blanket success.

The proxy blocks unconfigured `/api/*` routes rather than forwarding them to
production. `/__athar_ui__/probe` exposes only allowlisted booleans, mock IDs,
slide numbers, method/kind counters; never prompts, cookies or response bodies.
It binds only loopback, rejects foreign Host/Origin/cross-site requests, does not
follow redirects, and strips all upstream cookies/headers except basic content
metadata. For Vite it replaces only `/@vite/client` with an inert HMR shim: hot
reload/websocket behavior is explicitly outside these tests. App modules,
styles, PDF/media assets are forwarded, not edited. No ground-truth server or AI
claim should be inferred from mocked success.

## Configurable interface integration

`config.json` records the one-time observed UI-agent draft selectors. That draft
was **not integrated and no browser run was performed** during this port.
The main agent must run after integration. Missing controls or API mismatches
fail visibly rather than being fabricated or skipped.

Selectors, endpoints, health payload, query field names, source IDs/slugs used
by the safe fixture, and sizing thresholds are kept in one place; use a JSON
`--config` deep-merge override for final interface differences. In particular
confirm the send button, citation-close, retry-sources and separator selectors;
`health.configured`, document retry/citation route shapes; and `documentId` /
`slide` request fields. The slide fixture slug is `executive-presentation`, the
observed `Ask this slide` source slug. Mock fixtures do not assert business
answers. `guideModule` defaults to the existing Vite `/src/lib/guide.js`; a
non-Vite build must provide the compatible geometry-only guide module/config.

## Authentication: no secret inside the harness

Default `--auth none` uses no secret. `extended` is always mock-only and refuses
`--auth env`. Never insert a passphrase into `--eval`, `--url`, `--config`, a
screenshot, a target expression, a command line, a fixture or a report.

For **live stage/sequence access**, the optional mechanism is:

```bash
# ATHAR_REVIEW_PASSPHRASE must ALREADY be supplied by a secure environment/secrets manager.
# Do not paste the value into the shell command or documentation.
python3 athar-jv-interactive-plan/tests/ui/run.py --url http://127.0.0.1:5173 --stage after --mode stage --auth env
```

1. The Python launcher alone reads `ATHAR_REVIEW_PASSPHRASE`.
2. An in-memory `CookieJar` posts `{passphrase}` to real `POST /api/access`.
   It requires `authenticated:true` and a server-issued **HttpOnly** cookie.
3. In stage/sequence, a short-lived, loopback, read-only same-origin broker forwards GET/HEAD using
   that cookie. Browser JS never sees the secret or the cookie; no cookie is
   injected into the harness, profile, CLI arguments, or a temporary file.
4. The child validator environment has the passphrase removed. The broker
   forwards no Set-Cookie or credentials back to the browser, denies protected
   POSTs in stage/sequence (authorized mode is described below), clears its cookie jar on shutdown, and writes no access log.

This exercises real access/status reads but **does not prove browser cookie /
SameSite semantics, CSRF, cookie persistence, authorized AI, POST authorization,
or end-to-end protection**. Those actual API/AI/security tests belong to the
main agent's server runner. Avoid a persistent authenticated browser profile:
it can spill cookies into files/ZIPs. Avoid JS login even with a transient secret:
`ui-validator` serializes the eval target into its report. A same-origin
in-memory test broker is safer within the documented CLI's constraints, with
these explicit limitations. The authenticated app is still visible to its test
browser; review normal presentation screenshots before publishing them.

## Artifact hygiene

Only selected test source/contract/config/docs are ported from the completed
baseline. **No raw old answers, corpus, previous CLI output, signed URLs,
confidential source files, real cookies or previous screenshots are copied.**
Only sanitized decoded evidence, count-only validator failures and screenshot
paths are persisted. Raw validator stdout/stderr, page title, request URL,
console text, eval targets and exception messages are never written.

The old four cancelled/wrong-viewport sequence files and early attempt/invalid
reports remain outside selected outputs in `/tmp/athar-run`; they are **not**
valid before evidence and are not copied or deleted by this tests-only port.
The main agent owns any cleanup outside `tests/ui/**`. Do not bulk-delete proofs
or confuse historical invalid artifacts with the completed four-size baseline.
No commit, remote git operation, deployment or changed-app browser result was
made by this subagent.

## Authorized companion mode (opt-in; real AI, not the extended fixtures)

`--mode authorized --auth env` is a separate real-API scenario. It is **not run
by default**, never falls back to mocks, and may incur real model usage. Keep the
existing `stage`, natural `sequence`, and mock-only `extended` modes separate.
The passphrase must already be supplied through `ATHAR_REVIEW_PASSPHRASE` by the
private environment/secrets manager; never paste it into a command or eval.

From the workspace containing this repository, after loading `ui-validator`:

```bash
# Offline suite; no browser or remote connections:
python3 -m unittest discover -s athar-jv-interactive-plan/tests/ui -p test_runner.py -v
# Configuration only; does NOT log in, send questions, or launch Chromium:
python3 athar-jv-interactive-plan/tests/ui/run.py --url https://sb-7619bkx28s02.vercel.run --stage after --mode authorized --auth env --build-sha 1743c96 --dry-run
# ONLY after the owner authorizes a live run and the retrieval fix is deployed:
python3 athar-jv-interactive-plan/tests/ui/run.py --url "$PREVIEW_URL" --stage after --mode authorized --auth env --build-sha "$DEPLOYED_SHA"
```

The last command defaults to **1440x900, 390x844, 834x1112, 1275x451**, one fresh
in-memory login/session and one real question per viewport. Use `--viewport`
for a focused run. The SHA is caller supplied, not remotely verified. Do not
label the future retrieval fix as `1743c96`; supply its actual deployed SHA.
No browser installation is needed or permitted. `run.py` invokes the normal
installed `ui_validate.py` CLI, using short 100ms poll evals (default 2300) while
the scenario bounds the real answer wait at **100 seconds**. The broker permits
105 seconds for that upstream request; no retry invents or substitutes an answer.

### Broker boundary and provenance

The Python launcher performs real `POST /api/access` with `{passphrase}` and
requires `authenticated:true` plus an HttpOnly cookie. The cookie stays only in
Python's memory jar, is removed from child environments and browser responses,
and is cleared when the loopback server closes. Authentication responses and
private API bodies are not persisted. `--eval` contains no credential.

Authorized mode binds **only 127.0.0.1**, validates exact Host and caller Origin,
and permits POST only to `/api/chat/session`, `/api/chat/query`, and
`/api/documents/retry`. POST requires the exact broker Origin; null, missing,
foreign and duplicate origins are rejected. JSON keys/types/size are allowlisted
(session/query/filter plus the client's explicit false voice/transport fields);
unknown fields, duplicate JSON keys, transfer encoding and malformed lengths
fail closed. The forwarded Origin is the fixed real upstream origin. The broker
never forwards browser cookies, Authorization, arbitrary hosts or forwarding
headers. It rejects redirects, encoded/traversal paths, query-string routes,
unknown APIs, voice endpoints, logout and mutation verbs other than those POSTs.
The sole query-string exception is the app’s `/guide-audio/manifest.json?t=`
numeric timestamp (10–16 digits); it is forwarded unchanged and only the path is
recorded. The fixed `/api/guide-audio/:file` GET audio fallback is also permitted.
GET/HEAD are restricted to the app entry, known static asset directories,
access/health/documents/guide config, citations, and `/api/sources/:id`.

**Response bodies/statuses/assets are forwarded as received**, including SSE;
there are no HMR stubs, response fixtures, injected scripts, fake citations, or
rewritten answers in authorized mode. Only hop-by-hop/credential headers are
stripped; transport framing is local. A broker-only `/__athar_ui__/probe` reports
IDs, counts, booleans and request paths/statuses, never bodies. It observes a
bounded copy without rewriting responses; it is not an application endpoint.

Report `authMode` is **`in-memory-real-api-broker`**. The browser loads actual
deployed assets, but its URL/origin is the **local broker**, not the deployed
URL. This deliberately does **not** verify browser HttpOnly storage, cookie
persistence, SameSite, deployed-origin CSRF, physical mouse/keyboard events, or
independent semantic/numeric grounding. The server owns grounding validation;
this test verifies actual response/citation transport and UI integration. All
interactions are disclosed as synthetic DOM activation/value/input/change.

### Scenario and private proof

The scenario checks four actual ready sources; Ask this slide selects the
executive PPTX with slide 1 prefilled and no submission. It selects
`financial-summary`, clears slide context, and sends exactly:

> Compare UAE-only Base Case and International Expansion Upside Year-5 revenue. Quote the source and keep scenarios distinct.

It requires a real successful final-answer response, matching returned/retrieved
citation IDs and UI links/buttons, a successfully resolved server excerpt, and a
same-origin `/api/sources/:id` original (HEAD only; no original saved). It checks
citation close/focus restoration, document switching, Ask document draft with
no auto-submit, native range-value/input resizing with actual geometry change,
caption/companion non-overlap in focused composer/citation/resized states, and
closed companion controls refusing focus. A real paused guide keeps slide 1
stable; no audio clock/source manipulation is used.

There is **no fake application output or screenshot overlay**. Finally the test
uses the real New session control to clear answers/excerpts and opens source
status (titles/status/coverage counts only), with an empty composer. If that
cleanup cannot be proven, the launcher discards this run's private screenshot
and marks failure. Reports retain check IDs/counts, allowed source/citation IDs,
request paths/statuses/byte counts; never answer/excerpt text, source records,
credentials, cookies, sessions, raw validator stdout/stderr or protected URLs.
No `--allow-console-errors` or fixture error budgets apply: failed API calls,
missing citations, app errors, timeout and failed checks remain failures.
