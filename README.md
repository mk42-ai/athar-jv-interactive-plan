# Athar JV — Executive Summary · PDF presentation · Timeline · Grounded chat · Advanced Voice Mode

> Current implementation: [Presentation workspace and protected original-source review](docs/review-workspace.md).

> **5 Sept 2026 — public workspace.** The reviewer-code gate has been removed entirely (no login, no session cookie, no
> bearer token): presentation, narration and the document-connected AI are open to anyone with the deployment URL, and
> the app embeds in any iframe (`Content-Security-Policy: frame-ancestors *`, no `X-Frame-Options`). The AI corpus is
> exactly three documents — the Financial Model Executive Summary (3) PDF, the financial model v13 workbook and the
> 6-month implementation plan Oct 2026 – Mar 2027 (v1); see `docs/review-workspace.md` → "Public workspace". Sections
> below that mention a review code, private mode or a missing v13 workbook are historical.

## Spatial UI, collapsible AI panel and document-connected AI (5 Sept 2026)

Refinement of the existing workspace — same white · charcoal · gold palette, same playback engine, same evidence pipeline.

- **Slim docked player below the slide.** The Guide Mode player is the last row of the viewer grid, never an overlay:
  previous / play-pause / next, a current-section indicator (`3/21 · Slide 1 · Narrating` + the moment's caption), a 2 px gold
  progress line along its top edge, an in-flow expandable **Transcript** (click any moment to jump), and an **information menu**
  (ⓘ) holding the technical voice/model/integrity details and keyboard shortcuts. The menu opens below the player, so it never
  covers slide content; on phones it is an in-flow sheet.
- **Spatial layer (Glassmorphism 2.0 / Liquid Glass).** Frosted translucent panels (`backdrop-filter: blur`) with layered
  depth, a faint reflection along each panel's top edge, Bento-style ordering (one radius, one gap, lighter borders) and
  restrained kinetics (160–420 ms, reduced-motion aware). Everything is in `src/styles.css` under "SPATIAL LAYER"; a
  `@supports` fallback keeps panels opaque white where blur is unsupported.
- **Collapsible right-hand AI panel (desktop).** The companion is a grid column that *resizes the presentation* — collapse it to a
  76 px rail (‹ / ›), reopen it, drag the splitter on its left edge (`role="separator"`, arrow keys) or use the labelled range
  control. Phones keep separate **Presentation** and **Ask AI** views; both stay mounted so narration, page and conversation persist.
- **Document-connected AI.** `server/documentRegistry.js` declares the four review documents — (1) executive-summary slide deck,
  (2) financial-model executive-summary PDF, (3) financial model v13 workbook, (4) six-month implementation-plan workbook — and
  `/api/documents` always lists all four: indexed ones with their exact corpus record, missing ones with status **`missing`** and
  provisioning guidance. Answers keep the evidence contract: **Source facts** (stated), **Derived calculations** (server-computed
  from quoted operands), **Source conflicts**, **Not established by the selected evidence**, plus a **Coverage** section that names
  any document that could not be consulted. Each citation is an **Open source** action labelled with the document and its page /
  slide / worksheet!range (`Executive-summary deck · Slide 2`, `Implementation plan · Open Items!D31:G46`). Scopes: **This
  document** / **All documents**. Starter questions: *Compare the UAE base case with international expansion.* · *What capital
  decisions still need agreement?* · *Which implementation milestones depend on those decisions?*
- **Provisioning from signed URLs.** `npm run provision` (`scripts/provision_sources.py`) keeps originals already present under
  `ATHAR_SOURCE_INPUT_DIR`, downloads any missing original from `ATHAR_SOURCE_URL_<SLUG>` (HTTPS, content-type and file-signature
  checked; URLs are time-limited credentials read from the host environment / git-ignored `.env`, never committed — this repository
  is public), writes a slug-pinned manifest and runs the offline ingestion into `ATHAR_CORPUS_DIR`. The executive deck may be
  provisioned as its exact 2-page PDF rendering when the PPTX is unavailable (`slide N = page N`; recorded as a limitation and
  shown as an alternate original in the AI panel).
- **Public workspace — no review-access gate.** The former "Private review access" / "Review access code" card, the
  `/api/access` routes, the signed session cookie, the embedded bearer-token fallback and the
  `ATHAR_REVIEW_PASSPHRASE` / `ATHAR_SESSION_SECRET` / `ATHAR_PRIVATE_PRESENTATION` / `ATHAR_COOKIE_SAMESITE` settings are
  gone. The deck, timeline, narration AND the document-connected AI (chat, citations, original downloads, voice) are served
  to anyone with the deployment URL, top-level or inside an iframe, with no sign-in step anywhere. `GET /api/health`
  reports `access: "public"`. What remains in `server/publicAccess.js` is not authentication: an anonymous per-client
  conversation affinity (`X-Athar-Client`), per-IP throttling, the same-origin CSRF check on mutating routes and the
  120-second media capabilities for the speech callback. The On Demand key never leaves the server.
- **Embeddable in preview panels.** Responses send `Content-Security-Policy: frame-ancestors *` (configurable via
  `ATHAR_FRAME_ANCESTORS`) and never `X-Frame-Options`, so the workspace — including the AI panel — loads inside a
  cross-origin iframe as well as in a top-level tab. No cookie is set, so third-party-cookie policies cannot break it.
- **On Demand integration verified against the live public API docs (5 Sept 2026).** `POST https://api.on-demand.io/chat/v1/sessions`
  (`apikey` header, `{externalUserId, pluginIds}` → `data.id`) and `POST /chat/v1/sessions/{sessionId}/query`
  (`{query, endpointId, responseMode: "sync", fulfillmentOnly, modelConfigs: {fulfillmentPrompt, temperature}}` → `data.answer`,
  `data.messageId`, `data.status`) match `server/ondemand.js` field for field. `GET /api/health?probe=1` (public, upstream result cached 5 min)
  proves the server-side key is loaded *and accepted* upstream (session create 201 + read 200) without exposing the key, and
  reports the document registry summary. The key is `ON_DEMAND_API_KEY` / `ONDEMAND_API_KEY` in the host environment or the
  git-ignored `.env` — never in the tree.
 This runbook supersedes older public-chat, secret-copy and live-narration-fallback instructions below. Historical QA logs are retained for history only; consult the current run's machine-readable QA evidence for verified results.

React + Vite client with a server-side **On Demand API proxy** (`server/api.js`) that runs
inside the Vite dev server (`vite.config.js`) or standalone (`server/index.js`).
The On Demand `apikey` is read from `process.env.ON_DEMAND_API_KEY` on the server only.

## Run
```bash
npm install
ON_DEMAND_API_KEY=... npm run dev        # http://0.0.0.0:5173  (Vite + API proxy)
# or a production build:
npm run build && ON_DEMAND_API_KEY=... npm start
```

## Presentation
`public/deck/athar-jv-executive-summary-sep2026-mar2027-2-slide-deck.pdf` is the exact 2-slide PDF converted losslessly from the v3 PPTX with LibreOffice headless (served locally, rendered with PDF.js — page nav, zoom, fullscreen). The month strip under it opens month detail from `data/athar-jv-month-timeline.json`.

## Deep links
`#deck`, `#timeline`, `#chat` (opens the chat widget), `#voice`, and `#voice?q=<question>` (speaks the answer on load — the browser may require a tap on "Play response" because of autoplay rules).

## Data
`data/athar-jv-month-timeline.json` — month-by-month plan (Oct 2026 – Mar 2027; W1 = Mon 5 Oct 2026) extracted from
`athar-jv-executive-summary-sep2026-mar2027-2-slide-deck_v3 (1).pptx` (the 53 activity rows are carried forward from the
prior v4 Gantt extraction and re-anchored to the v3 calendar — see `meta.change_log_vs_prior_deck`). The timeline renders it directly; the server
injects a compact rendering of the whole file as grounding context on every chat / voice query.

## Production deployment (runbook)

The app is a Vite/React client plus a small Express proxy (`server/api.js`) that holds the On Demand key.
`vercel --prod` / production deploys are **not** run from the assistant's sandbox (platform guardrail) —
use one of these:

1. **Share / Publish from the platform UI** — redeploys the saved code snapshot server-side. The snapshot
   carries text files only, so `server/deck.js` + `data/deck-pdf.base64.json` (a checksum-verified copy of
   the deck PDF) keep the PDF.js viewer working even when `public/deck/*.pdf` is not present.
2. **Persistent Node host (works as-is)** — Railway, Render, Fly.io, Azure App Service, Docker, a VM:
   ```bash
   npm ci && npm run build
   ON_DEMAND_API_KEY=<key> PORT=8080 npm start     # server/index.js: dist/ + /api/* + deck fallback
   ```
   Set `PUBLIC_BASE_URL=https://<your-domain>` if the proxy in front does not forward `Host` /
   `X-Forwarded-*` (On Demand speech-to-text fetches the uploaded audio back from that base URL).
3. **Vercel (static build + one serverless function)** — `api/index.js` + `vercel.json` are prepared:
   ```bash
   vercel link                                   # create / select the project (e.g. athar-jv-plan)
   vercel env add ON_DEMAND_API_KEY production   # paste the key when prompted → stored encrypted / sensitive
   vercel --prod
   ```
   Caveats: the voice pipeline's in-memory media store (`/api/voice/audio/:id`) is per instance, so on
   serverless back it with Vercel Blob/KV or keep voice on option 2; `maxDuration` is set to 60 s for the
   voice turn; SSE streaming works on Vercel's Node runtime.

**Environment variable name:** the server reads `ON_DEMAND_API_KEY` (see `server/ondemand.js`), not
`ONDEMAND_API_KEY`. With the wrong name every `/api/*` call answers `503 not_configured`. Optional:
`AVM_WORKFLOW_ID` (default `6a97acf9b44c27163d2b211c`), `OD_ENDPOINT_ID` (default `predefined-openai-gpt4o`),
`OD_TTS_VOICE` (default `nova`). Never prefix any of these with `VITE_`.

**Secrets:** the On Demand key is stored in this GitHub repository only as the Actions secret `ON_DEMAND_API_KEY` — it is never
in the tree (`.env` is git-ignored; `.env.example` holds the placeholders). In a workflow expose it with
`env: { ON_DEMAND_API_KEY: ${{ secrets.ON_DEMAND_API_KEY }} }`; Actions secrets are not visible to Vercel, so set the Vercel
production variable separately (`vercel env add ON_DEMAND_API_KEY production`). Rotate any key that has ever been pasted into a chat.

**Smoke test (any base URL):**
```bash
B=https://<deployment>
curl -sSI "$B/deck/athar-jv-executive-summary-sep2026-mar2027-2-slide-deck.pdf" | head -1     # 1) 200 application/pdf (MD5 45f5edc9a5fa17a25caf517b417f7575)
S=$(curl -sS -X POST "$B/api/chat/session" -H 'content-type: application/json' -d '{"externalUserId":"smoke"}' | jq -r .sessionId)
curl -sSN -X POST "$B/api/chat/query" -H 'content-type: application/json' -d "{\"sessionId\":\"$S\",\"mode\":\"stream\",\"query\":\"When is G2?\"}"   # 2) SSE deltas → done
curl -sSN -X POST "$B/api/voice/text-turn" -H 'content-type: application/json' -d "{\"sessionId\":\"$S\",\"text\":\"When is G3?\"}" | grep -E '"avm'  # 3) avm executionId + avm-status success
```

## API proxy → On Demand
| Proxy route | On Demand endpoint |
|---|---|
| `POST /api/chat/session` | `POST https://api.on-demand.io/chat/v1/sessions` |
| `POST /api/chat/query` (`mode: stream|sync`) | `POST https://api.on-demand.io/chat/v1/sessions/{sessionId}/query` (`responseMode: stream|sync`, grounding in `modelConfigs.fulfillmentPrompt`) |
| `POST /api/voice/turn` (raw audio) | `POST …/services/v1/public/service/execute/speech_to_text` → `POST …/automation/public/v1/webhook/workflow/{AVM_WORKFLOW_ID}/execute` → Chat API (stream) → `POST …/services/v1/public/service/execute/text_to_speech` |
| `POST /api/voice/text-turn` | same pipeline without speech-to-text |
| `GET /api/voice/audio/:id` | serves uploaded clips (fetched by speech_to_text) and proxied TTS mp3s |
| `GET /api/voice/execution/:id` | `GET …/automation/api/execution/{id}` (+ `/logs`, `/transcript`) |
| `GET /api/health` | configuration check (no secrets) |

Advanced Voice Mode workflow: `6a97acf9b44c27163d2b211c` ("Sovereign Q&A Voice Assistant - Opus 5 (API-triggered)").
The `advancedVoiceMode` node emits no answer text over REST, so the spoken answer is sourced from the
Chat API (same session as the typed chat) while the workflow is executed with the turn payload.

## Guide Mode (AI-narrated walkthrough)

Click **Guide me** in the presentation toolbar. A calm, natural narrator walks through the deck moment by moment
(21 narrated moments across the 2 slides — headline numbers, the six gates, anchors, commercials, delivery, roadmap rows),
highlights the element being discussed on the rendered slide, and auto-advances the slide when narration completes.

- Controls: play/pause (`Space`), back (`[`), skip (`]`), exit (✕). Manual page navigation still works and re-syncs the guide.
- **Voice: ElevenLabs `River` — "Relaxed, Neutral, Informative"** (premade US voice, id `SAz9YHcvj6GT2YYXdXww`), model `eleven_v3`,
  voice settings stability 0.5 (Natural) · similarity 0.8 · style 0 · speed 0.92 · speaker boost, plus a 750 ms breath between moments.
  Chosen 2026-09-04 from the voices this key's (free) tier can synthesise: the brief's library voices return HTTP 402
  `paid_plan_required`; of the calm US narrators probed (Brian, Sarah, River) River returned the softest level.
- **Playback = verified pre-baked clips only.** `npm run guide:prebake` (needs `ELEVENLABS_API_KEY`) synthesises all 21 moments into
  `public/guide-audio/<moment>-<sha256:12>.mp3` and writes `manifest.json` (v2: per-clip SHA-256, text hash, voice/model/settings,
  timestamps). The client fetches the manifest with `cache: no-store`, downloads the moment's clip, **re-hashes the bytes and refuses
  to play anything that does not match**, then plays it from a blob URL on an audio element unlocked inside the user's click (iOS/Safari).
  Every moment is logged to `window.__atharGuide.sources` and the console (`[guide-audio] <moment> ← prebaked <url> sha256 verified`).
- **No silent fallbacks.** The Web Speech (robotic synthetic) and timed-silence fallbacks were removed: if a clip cannot be fetched,
  verified or played, the guide bar shows the error with a Retry button and does not auto-advance. Live synthesis through
  `POST /api/guide/tts` (ElevenLabs; On Demand `nova` only if ElevenLabs hard-fails) is used solely for a moment with no pre-baked clip.
- **Root cause of the "old voice" regression (fixed 2026-09-04):** the proxy chose the voice provider from server env vars *before*
  looking at the pre-baked clips, so any restart without `ELEVENLABS_API_KEY` (e.g. a snapshot restart that only had the On Demand key)
  silently synthesised with On Demand `nova`, and autoplay rejections fell through to Web Speech/silence. Pre-baked clips are now served
  first and independently of any key, clip filenames are content-hashed (a regenerated clip can never be served from a stale cache),
  `manifest.json` is `Cache-Control: no-store`, clips are `immutable`.

### Docked player (Sept 2026 redesign)

The narration controls are a **slim docked player, not a modal**: a ~57 px row that is the last grid row of the presentation
viewer (below the slide and the page thumbnails), so the whole slide stays visible while narrating. It holds — left to right —
the Guide pulse, position (`n/21 · S<slide>`), back / play-pause / skip, a 2-line clamped caption with an expand chevron that
reveals the full narration text inline, the status ("Narrating", "Paused", "Playback was blocked… Retry"), the provider badge
(`ElevenLabs · River · eleven_v3`) and exit; a 2 px gold progress line runs along its top edge. On phones (≤ 720 px) the same
player docks to the bottom edge of the screen (fixed, safe-area aware), the viewer scrolls to the top, the page area is capped
so toolbar + slide fit above it, the floating Voice/Ask dock moves up, and the page reserves the player's height
(`--guide-dock-h`). In fullscreen it remains a row of the fullscreen viewer, below the letterboxed slide.

## QA log — Guide Mode narration provenance, 2026-09-04 (voice fix)

Fresh, cookie-less headless Chromium sessions (desktop 1440×900 and mobile 390×844) against the live sandbox preview.
Per moment the client logged the source it actually played (`window.__atharGuide.sources`); the CDP network log was
captured for every audio request; `speechSynthesis.speak` was wrapped to count synthetic-voice calls (0 in both sessions).

| Check | Result | Time (UTC) |
|---|---|---|
| D1 Anonymous cookie-less session: deck PDF renders page 1 from the raw link (static same-origin asset) | pass | 2026-09-04 13:46:10 UTC |
| D2 Deck bytes match the bundled PDF (no signed/expiring URL) | pass | 2026-09-04 13:46:10 UTC |
| D3 Deployed manifest v2: ElevenLabs River (SAz9YHcvj6GT2YYXdXww) / eleven_v3, 21 clips, generated 2026-09-04T13:38Z | pass | 2026-09-04 13:46:10 UTC |
| D4 All 21 moments play the pre-baked ElevenLabs River clip: hashed filename == manifest, client SHA-256 verified, HTTP 200 audio/mpeg | pass | 2026-09-04 13:46:25 UTC |
| D5 Zero Web Speech (speechSynthesis.speak) calls and zero live-TTS proxy requests during the 21-moment pass | pass | 2026-09-04 13:46:25 UTC |
| D6 Network log: every played audio request hit /guide-audio/<moment>-<sha256:12>.mp3 with 200 + audio/mpeg (+ immutable cache header); no /api/voice/audio requests | pass | 2026-09-04 13:46:25 UTC |
| D7 Pacing: opening moment unhurried, audio clock advancing | pass | 2026-09-04 13:46:31 UTC |
| D8 Auto-advances to the next moment when the clip ends, with the 750 ms breath | pass | 2026-09-04 13:46:50 UTC |
| D9 Milestone highlight (3 KPI tiles) rendered | pass | 2026-09-04 13:46:50 UTC |
| D10 Pause stops narration | pass | 2026-09-04 13:46:51 UTC |
| D11 No advance while paused (3 s) | pass | 2026-09-04 13:46:54 UTC |
| D12 Resume continues narration | pass | 2026-09-04 13:46:55 UTC |
| D13 Skip → next moment | pass | 2026-09-04 13:46:55 UTC |
| D14 Back → previous moment | pass | 2026-09-04 13:46:55 UTC |
| D15 Gate highlight (G4 · 29 Jan 2027) spotlight + tag; verified River clip | pass | 2026-09-04 13:46:58 UTC |
| D16 Slide auto-advances to slide 2 when the last slide-1 moment finishes | pass | 2026-09-04 13:47:40 UTC |
| D17 Manual prev-page during Guide Mode re-syncs the guide (page 1 → s1-open) | pass | 2026-09-04 13:47:41 UTC |
| D18 Thumbnail navigation to slide 2 re-syncs the guide (s2-open) | pass | 2026-09-04 13:47:41 UTC |
| D19 Guide off: bar/highlights removed, audio stopped, manual navigation still works | pass | 2026-09-04 13:47:42 UTC |
| D20 Whole desktop session: 0 speechSynthesis calls, 0 live-TTS requests, every logged playback was a verified pre-baked clip | pass | 2026-09-04 13:47:42 UTC |
| D21 Zero console/page errors and no failed requests (desktop) | pass | 2026-09-04 13:47:42 UTC |
| M1 Mobile 390×844 fresh session: deck renders anonymously, fits viewport, no overflow | pass | 2026-09-04 13:47:44 UTC |
| M2 Mobile: all 21 moments play verified pre-baked River clips; guide bar + controls on screen | pass | 2026-09-04 13:47:59 UTC |
| M3 Mobile network log: 21 × /guide-audio hashed mp3, 200 audio/mpeg; 0 speech calls; 0 live-TTS requests | pass | 2026-09-04 13:47:59 UTC |
| M4 Mobile: skip + pause work; milestone highlight (3 boxes) | pass | 2026-09-04 13:48:03 UTC |
| M5 Mobile: manual navigation to slide 2 re-syncs the guide | pass | 2026-09-04 13:48:03 UTC |
| M6 Zero console/page errors and no failed requests (mobile) | pass | 2026-09-04 13:48:04 UTC |

### Clip provenance (served file == committed file == manifest)

| Moment | File | SHA-256 | Manifest | Git HEAD | Served |
|---|---|---|---|---|---|
| s1-open | `s1-open-e54d4a80fd65.mp3` | `e54d4a80fd651100…` | ✓ | ✓ | 200 audio/mpeg |
| s1-kpis | `s1-kpis-96ed430975f2.mp3` | `96ed430975f20ace…` | ✓ | ✓ | 200 audio/mpeg |
| s1-kpis-2 | `s1-kpis-2-b1cd88f114af.mp3` | `b1cd88f114af7bcb…` | ✓ | ✓ | 200 audio/mpeg |
| s1-g1 | `s1-g1-fbd21e23242b.mp3` | `fbd21e23242b1b6a…` | ✓ | ✓ | 200 audio/mpeg |
| s1-g2 | `s1-g2-74bb27933c89.mp3` | `74bb27933c89e644…` | ✓ | ✓ | 200 audio/mpeg |
| s1-g3 | `s1-g3-341af54905ff.mp3` | `341af54905ff2e4c…` | ✓ | ✓ | 200 audio/mpeg |
| s1-g4 | `s1-g4-1a8eef9b20df.mp3` | `1a8eef9b20df9aaa…` | ✓ | ✓ | 200 audio/mpeg |
| s1-g5 | `s1-g5-8da68c041eeb.mp3` | `8da68c041eeb4d98…` | ✓ | ✓ | 200 audio/mpeg |
| s1-g6 | `s1-g6-99c23979c3b4.mp3` | `99c23979c3b424c9…` | ✓ | ✓ | 200 audio/mpeg |
| s1-anchors | `s1-anchors-b2e54b1af8c3.mp3` | `b2e54b1af8c31e82…` | ✓ | ✓ | 200 audio/mpeg |
| s1-commercials | `s1-commercials-68d5af140a3b.mp3` | `68d5af140a3b21d3…` | ✓ | ✓ | 200 audio/mpeg |
| s1-delivery | `s1-delivery-81db41985ab1.mp3` | `81db41985ab1600f…` | ✓ | ✓ | 200 audio/mpeg |
| s1-product | `s1-product-eae93d4721f0.mp3` | `eae93d4721f044ef…` | ✓ | ✓ | 200 audio/mpeg |
| s2-open | `s2-open-81bac71892f3.mp3` | `81bac71892f3fc2a…` | ✓ | ✓ | 200 audio/mpeg |
| s2-g1 | `s2-g1-dbeb472cbba3.mp3` | `dbeb472cbba3894e…` | ✓ | ✓ | 200 audio/mpeg |
| s2-g2 | `s2-g2-6c21e61a6371.mp3` | `6c21e61a6371af14…` | ✓ | ✓ | 200 audio/mpeg |
| s2-g3 | `s2-g3-0ea9ad84aa27.mp3` | `0ea9ad84aa274cd4…` | ✓ | ✓ | 200 audio/mpeg |
| s2-g4 | `s2-g4-c02c99fd01b2.mp3` | `c02c99fd01b22158…` | ✓ | ✓ | 200 audio/mpeg |
| s2-g5 | `s2-g5-774552ee7127.mp3` | `774552ee71272b19…` | ✓ | ✓ | 200 audio/mpeg |
| s2-g6 | `s2-g6-a7e5eb9d5092.mp3` | `a7e5eb9d5092065d…` | ✓ | ✓ | 200 audio/mpeg |
| s2-close | `s2-close-df46405edea3.mp3` | `df46405edea3938d…` | ✓ | ✓ | 200 audio/mpeg |

## Secrets & runtime checks

- The On Demand key is accepted under **either** name — `ON_DEMAND_API_KEY` (this app) or `ONDEMAND_API_KEY` (the platform's
  naming) — and is read from `process.env`, then the git-ignored `.env`, then the git-ignored non-dot `env.local`
  (`server/env.js`). Keep `.env` and `env.local` identical: a code-snapshot restart of the sandbox may drop dot-files, and the
  non-dot copy keeps the key installed across redeploys. On Vercel set the variable in Project → Environment Variables.
- Nothing is `VITE_`-prefixed, so no secret is ever bundled for the browser; logs and `/api/health` show a masked
  fingerprint only (`iehV…Pp7M (32 chars)`).
- Start-up logs `[env] secret files present: …`, `[ondemand] API key loaded <fingerprint> from <source>` and the result of a
  live probe. `GET /api/health` (`?probe=1` forces a fresh probe) returns machine-readable
  `ondemand.keyInstalled`, `keySource`, `sessionCreated`, `checkedAt` (ISO-8601) and `probe.httpStatus`
  (`createSession: 201`, `getSession: 200`). `ELEVENLABS_API_KEY` is loaded the same way (live narration synthesis only —
  the 21 pre-baked clips need no key).
- Why a key can show as "not installed": the sandbox is ephemeral (90-minute TTL) and a restart does not inherit
  `sandbox exec --env`; the key must therefore exist in `.env`/`env.local` inside the deployed tree (or in the host's
  environment) and the process must be (re)started after the file changes.

## Narration assets survive redeploys (fix for "Audio element error (code 4)")

A redeploy built from a code snapshot can drop `public/guide-audio/*.mp3` while keeping `manifest.json`; the dev server then
answers the clip URL with the SPA's `index.html` (HTTP 200, `text/html`) and the `<audio>` element fails with MediaError 4.
The clips are therefore also embedded as base64 in `data/guide-audio.base64.json` (`npm run guide:embed`, after every bake):
`server/guideAudioStore.js` restores missing files at start-up, serves `/guide-audio/<clip>.mp3` from the store with
`audio/mpeg`, `Accept-Ranges`/206 and immutable caching when the file is still absent, answers a JSON 404 for unknown clips,
and `/api/guide/tts` only hands out URLs of clips that are actually servable. The client additionally rejects non-audio
responses, falls back to `/api/guide-audio/<clip>` and retries a blob decode error from the direct URL.

## QA log — narration audit & fix verification, 2026-09-04 13:54–14:00 UTC

Fresh, cookie-less headless Chromium sessions (desktop 1440×900 full 21-moment run, mobile 390×844) against the redeployed
preview, with a CDP network trace. Every played moment fetched its content-hashed River clip from `/guide-audio/`
(HTTP 200, `audio/mpeg`), the browser re-hashed the bytes and matched the manifest, and there were **zero** requests to
`/api/guide/tts`, `/api/voice/audio` or any previous clip. Breath gaps between moments: 0.81–0.87 s.

| Check | Result | Time (UTC) | Screenshot |
|---|---|---|---|
| D1 Cold shared link, cookie-less session: deck PDF renders page 1 (static same-origin asset) | pass | 2026-09-04 13:54:28 | qa-d01-anon-deck-2026-09-04T135428Z-1440x900.png |
| D2 Server: 21 pre-baked ElevenLabs River / eleven_v3 clips, key-independent playback | pass | 2026-09-04 13:54:28 | — |
| D3 Manifest reachable anonymously; every clip carries ElevenLabs provenance (request-id / history-item-id) | pass | 2026-09-04 13:54:28 | — |
| D4 Clip is real, audible audio: decodes in the browser, RMS well above silence, ≈unhurried pace | pass | 2026-09-04 13:54:29 | — |
| D5 Guide starts: first moment plays the NEW River clip from a Blob of hash-verified bytes (badge shows ElevenLabs · River · eleven_v3) | pass | 2026-09-04 13:54:29 | qa-d05-guide-river-playing-2026-09-04T135429Z-1440x900.png |
| D6 Pause during moment 2 (status=paused, audio element paused) | pass | 2026-09-04 13:54:51 | qa-d06-paused-2026-09-04T135451Z-1440x900.png |
| D7 No advance while paused | pass | 2026-09-04 13:54:54 | — |
| D8 Resume continues the same clip | pass | 2026-09-04 13:54:55 | — |
| D9 Skip → next moment | pass | 2026-09-04 13:54:55 | — |
| D10 Back → previous moment (restarts its River clip) | pass | 2026-09-04 13:54:55 | — |
| D11 Milestone highlight (3 KPI tiles) rendered | pass | 2026-09-04 13:54:55 | qa-d11-milestone-highlight-2026-09-04T135455Z-1440x900.png |
| D12 Gate highlight (G4 · 29 Jan 2027) spotlight + tag on the slide | pass | 2026-09-04 13:55:59 | qa-d12-gate4-highlight-2026-09-04T135559Z-1440x900.png |
| D13 Slide auto-advanced to slide 2 in sync with the roadmap moment | pass | 2026-09-04 13:57:56 | qa-d13-auto-slide2-2026-09-04T135756Z-1440x900.png |
| D14 All 21 moments auto-advanced to the end; each played its own NEW River clip (file + SHA-256 = manifest, prebaked, verified) | pass | 2026-09-04 13:59:42 | qa-d14-tour-complete-2026-09-04T135942Z-1440x900.png |
| D15 Breath gap between consecutive auto-advanced moments ≈ 0.75 s | pass | 2026-09-04 13:59:42 | — |
| D16 Network trace: every played clip was fetched from /guide-audio/ (HTTP 200, audio/mpeg); ZERO requests to /api/guide/tts, /api/voice/audio or any old clip | pass | 2026-09-04 13:59:42 | — |
| D17 Manual thumbnail navigation to slide 2 re-syncs the guide (s2-open) | pass | 2026-09-04 13:59:42 | qa-d17-manual-nav-resync-2026-09-04T135942Z-1440x900.png |
| D18 Manual prev-page re-syncs to s1-open | pass | 2026-09-04 13:59:43 | — |
| D19 Guide off: audio stopped, bar removed, manual navigation works | pass | 2026-09-04 13:59:43 | qa-d19-guide-off-2026-09-04T135943Z-1440x900.png |
| D20 Zero console errors, zero page errors, zero failed requests (desktop, full run) | pass | 2026-09-04 13:59:43 | — |
| D21 Network-trace proof captured (PNG + JSON) | pass | 2026-09-04 13:59:45 | — |
| M1 Mobile 390×844 cold session: deck renders anonymously, fits viewport, no horizontal overflow | pass | 2026-09-04 13:59:46 | qa-m01-mobile-deck-2026-09-04T135946Z-390x844.png |
| M2 Mobile: Guide bar + controls on screen, highlight drawn, NEW River clip playing (hash-verified) | pass | 2026-09-04 13:59:47 | qa-m02-mobile-guide-river-2026-09-04T135947Z-390x844.png |
| M3 Mobile: auto-advance to moment 2 after narration | pass | 2026-09-04 14:00:09 | qa-m03-mobile-auto-advanced-2026-09-04T140009Z-390x844.png |
| M4 Mobile: pause works; milestone highlight (3 boxes) | pass | 2026-09-04 14:00:09 | qa-m04-mobile-paused-highlight-2026-09-04T140009Z-390x844.png |
| M5 Mobile: resume, skip and back work | pass | 2026-09-04 14:00:11 | — |
| M6 Mobile: manual navigation to slide 2 re-syncs the guide (roadmap highlight) | pass | 2026-09-04 14:00:11 | qa-m06-mobile-slide2-resync-2026-09-04T140011Z-390x844.png |
| M7 Mobile network trace: clips fetched from /guide-audio/ only, zero proxy/fallback audio requests | pass | 2026-09-04 14:00:11 | — |
| M8 Zero console errors, zero page errors, zero failed requests (mobile) | pass | 2026-09-04 14:00:11 | — |

### Per-clip SHA-256 — new River bake vs previous Adam bake (all 21 differ; disk == manifest == served)

| # | Moment | New file | New SHA-256 (River, 13:38–13:40 UTC) | Old SHA-256 (Adam bake 12:44 UTC) | ElevenLabs request-id / history-item-id / cost |
|---|---|---|---|---|---|
| 1 | s1-open | `s1-open-e54d4a80fd65.mp3` | `e54d4a80fd651100…b6a9e5ba` | `1cac3b045c5de4ab…` | `LHMpnGInQ4Kt7j9nX4jp` / `sPyOXjjiWkrm5sajEy8X` / 285 |
| 2 | s1-kpis | `s1-kpis-96ed430975f2.mp3` | `96ed430975f20ace…df449a94` | `65574c753f54a6d2…` | `E8HSNEJcPqaBHIN3PToI` / `WfUxoLikR3EEgzAUVGHk` / 244 |
| 3 | s1-kpis-2 | `s1-kpis-2-b1cd88f114af.mp3` | `b1cd88f114af7bcb…3965c794` | `bc0777736d37e8ed…` | `hY9xhonOOXVktlYUuai8` / `rgod2pCRAHs5NcCcFe0T` / 300 |
| 4 | s1-g1 | `s1-g1-fbd21e23242b.mp3` | `fbd21e23242b1b6a…0c0ec7e7` | `23e969ec2be292ae…` | `CCI5zpuuZzooikQz4dHL` / `kTDRhBypiDjyZGWFlGWE` / 162 |
| 5 | s1-g2 | `s1-g2-74bb27933c89.mp3` | `74bb27933c89e644…584350c8` | `fbce956b2fd6a5ac…` | `psQipdSdUD4tVLvCsLjS` / `eSiVKfnKzIqS8pdWnGW4` / 124 |
| 6 | s1-g3 | `s1-g3-341af54905ff.mp3` | `341af54905ff2e4c…d60059ca` | `a1944200130eb8b8…` | `MtIRB3G75vpnj0hKt9Fo` / `C4gjB5kGgFiHilU0zgAD` / 114 |
| 7 | s1-g4 | `s1-g4-1a8eef9b20df.mp3` | `1a8eef9b20df9aaa…f8a96609` | `80a9e783ee077581…` | `v9K6PLSUQRcCvpPHy5zT` / `v9dIPFat5ZN6jxD1u8tS` / 127 |
| 8 | s1-g5 | `s1-g5-8da68c041eeb.mp3` | `8da68c041eeb4d98…fbb1a290` | `d02b1628158a5241…` | `qgqzAkeNmILRgpauwnMs` / `nfNFq4znzkbe3Hf4ir1y` / 108 |
| 9 | s1-g6 | `s1-g6-99c23979c3b4.mp3` | `99c23979c3b424c9…2bc82052` | `5964d2f95b1c2749…` | `4k3809mo4kQNS2BkDUqC` / `ftXe72eggDF1DMnNesZw` / 108 |
| 10 | s1-anchors | `s1-anchors-b2e54b1af8c3.mp3` | `b2e54b1af8c31e82…ca38d78f` | `689782a7eeddf164…` | `7Pfg40bVeTp2KtdZCHBs` / `Ii6bjfWf7SGOWZf35AY7` / 273 |
| 11 | s1-commercials | `s1-commercials-68d5af140a3b.mp3` | `68d5af140a3b21d3…d1a3468d` | `85df2b9ee212a314…` | `wVP1fsm7NBQSpycbI0wc` / `RbEjhxGbWGoPD8oEMTZO` / 427 |
| 12 | s1-delivery | `s1-delivery-81db41985ab1.mp3` | `81db41985ab1600f…7bcd9d63` | `15ee22a0e6767478…` | `Uxu1jGhTmUD5jbcvEMpt` / `y7qAHRoo1WUoZIthEWLT` / 264 |
| 13 | s1-product | `s1-product-eae93d4721f0.mp3` | `eae93d4721f044ef…a34b75e9` | `6cedf9f0cef1cfa6…` | `gp3FRAToD5Wjg4rf1Uax` / `FfEERbzG0BwMRf9axHlY` / 286 |
| 14 | s2-open | `s2-open-81bac71892f3.mp3` | `81bac71892f3fc2a…7727329e` | `693baaaffc791721…` | `LiFMyiuh2jpdFasrflxI` / `5OBOOohfMw9jGiXmZpT1` / 226 |
| 15 | s2-g1 | `s2-g1-dbeb472cbba3.mp3` | `dbeb472cbba3894e…cff1cfac` | `e92e50627c4c2d1b…` | `YwadenxHrpXLVLE2C6CM` / `2sPZ94uoRkU5OdTqGyfq` / 170 |
| 16 | s2-g2 | `s2-g2-6c21e61a6371.mp3` | `6c21e61a6371af14…1ef2964a` | `b4bb112bebf3b321…` | `tx4X903nt5UdaNGmezja` / `IuOLaj3mEs5h1v1ruhxZ` / 181 |
| 17 | s2-g3 | `s2-g3-0ea9ad84aa27.mp3` | `0ea9ad84aa274cd4…e2c3904f` | `ec82b556872de808…` | `TZfAt4DsQff5KvPz5ML3` / `rvUow9kx59VrJscNITWQ` / 177 |
| 18 | s2-g4 | `s2-g4-c02c99fd01b2.mp3` | `c02c99fd01b22158…4db1b7c2` | `92ef6590e304b378…` | `D3kKlYBYmUmW4Yy3Ax1e` / `N3KzHjskkb2eCiRkszWa` / 172 |
| 19 | s2-g5 | `s2-g5-774552ee7127.mp3` | `774552ee71272b19…e374be6d` | `755027f22b08b8ad…` | `VvtQdt328WHWoi4Y49e7` / `yf3692TJE0ps7x96RD3P` / 156 |
| 20 | s2-g6 | `s2-g6-a7e5eb9d5092.mp3` | `a7e5eb9d5092065d…0938fe46` | `56600a56101b7f45…` | `M6bg55Xc8KaT22oBFxkZ` / `TWEzPcreGSk4UcwmymC9` / 164 |
| 21 | s2-close | `s2-close-df46405edea3.mp3` | `df46405edea3938d…cbd292a7` | `da6aaafd8c67291d…` | `nxqd1ztpchdAXPlXMP3X` / `NnK7pVH2RD8V38xCXr6M` / 220 |

Provenance columns come from the ElevenLabs generation history (`npm run guide:provenance`, matched by generation time and
exact character count). Free-tier quota after the bake: 9,909 / 10,000 credits (resets 2026-10-05) — a further re-bake needs
a key with ≥ 4,300 credits.

## QA log — audio-error fix + On Demand key, 2026-09-04 14:21–14:27 UTC

Root cause reproduced first: with `public/guide-audio/*.mp3` removed (a code-snapshot redeploy) the dev server answered the
clip URL with `index.html` (HTTP 200, `text/html`) and Guide Mode showed exactly *Audio element error (code 4) while playing
s1-open-e54d4a80fd65.mp3*. After the fix the same scenario serves the clip from the embedded store (HTTP 200 `audio/mpeg`,
SHA-256 = manifest, `X-Guide-Audio: embedded-base64`, Range → 206) — verified locally with a read-only asset directory and
on the deployed sandbox with all binaries moved away. Fresh, cookie-less headless Chromium sessions (desktop full
21-moment run with network trace, autoplay-refused session, mobile 390×844):

| Check | Result | Time (UTC) | Screenshot |
|---|---|---|---|
| D1 Cold shared link, cookie-less session: deck PDF renders page 1 (static same-origin asset) | pass | 2026-09-04 14:21:30 | qa-d01-anon-deck-2026-09-04T142130Z-1440x900.png |
| D2 Server: 21 pre-baked ElevenLabs River / eleven_v3 clips, key-independent playback | pass | 2026-09-04 14:21:30 | — |
| D3 Manifest reachable anonymously; every clip carries ElevenLabs provenance (request-id / history-item-id) | pass | 2026-09-04 14:21:30 | — |
| D3b On Demand API key present at runtime (server-side, masked) and functional — live probe created a chat session | pass | 2026-09-04 14:21:30 | — |
| D3c All 21 clips servable (static or embedded store); On Demand fallback key loaded on the TTS proxy | pass | 2026-09-04 14:21:30 | — |
| D4 Clip is real, audible audio: decodes in the browser, RMS well above silence, ≈unhurried pace | pass | 2026-09-04 14:21:30 | — |
| D5 Guide starts: first moment plays the NEW River clip from a Blob of hash-verified bytes (badge shows ElevenLabs · River · eleven_v3) | pass | 2026-09-04 14:21:30 | qa-d05-guide-river-playing-2026-09-04T142130Z-1440x900.png |
| D6 Pause during moment 2 (status=paused, audio element paused) | pass | 2026-09-04 14:21:53 | qa-d06-paused-2026-09-04T142153Z-1440x900.png |
| D7 No advance while paused | pass | 2026-09-04 14:21:55 | — |
| D8 Resume continues the same clip | pass | 2026-09-04 14:21:56 | — |
| D9 Skip → next moment | pass | 2026-09-04 14:21:56 | — |
| D10 Back → previous moment (restarts its River clip) | pass | 2026-09-04 14:21:57 | — |
| D11 Milestone highlight (3 KPI tiles) rendered | pass | 2026-09-04 14:21:57 | qa-d11-milestone-highlight-2026-09-04T142157Z-1440x900.png |
| D12 Gate highlight (G4 · 29 Jan 2027) spotlight + tag on the slide | pass | 2026-09-04 14:23:01 | qa-d12-gate4-highlight-2026-09-04T142301Z-1440x900.png |
| D13 Slide auto-advanced to slide 2 in sync with the roadmap moment | pass | 2026-09-04 14:24:58 | qa-d13-auto-slide2-2026-09-04T142458Z-1440x900.png |
| D14 All 21 moments auto-advanced to the end; each played its own River clip (file + SHA-256 = manifest, prebaked, verified) with ZERO audio element errors | pass | 2026-09-04 14:26:43 | qa-d14-tour-complete-2026-09-04T142643Z-1440x900.png |
| D15 Breath gap between consecutive auto-advanced moments ≈ 0.75 s | pass | 2026-09-04 14:26:43 | — |
| D16 Network trace: every played clip was fetched from /guide-audio/ with HTTP 200 + Content-Type audio/mpeg (audio/mpeg); ZERO requests to /api/guide/tts, /api/voice/audio or any old clip | pass | 2026-09-04 14:26:43 | — |
| D17 Manual thumbnail navigation to slide 2 re-syncs the guide (s2-open) | pass | 2026-09-04 14:26:44 | qa-d17-manual-nav-resync-2026-09-04T142644Z-1440x900.png |
| D18 Manual prev-page re-syncs to s1-open | pass | 2026-09-04 14:26:44 | — |
| D19 Guide off: audio stopped, bar removed, manual navigation works | pass | 2026-09-04 14:26:45 | qa-d19-guide-off-2026-09-04T142645Z-1440x900.png |
| D20 Zero console errors, zero page errors, zero failed requests (desktop, full run) | pass | 2026-09-04 14:26:45 | — |
| D21 Network-trace proof captured (PNG + JSON) | pass | 2026-09-04 14:26:46 | — |
| B1 Autoplay refused by the browser → visible 'Playback was blocked… Tap play' state with Retry, and NO fallback voice | pass | 2026-09-04 14:26:48 | qa-b1-blocked-state-retry-2026-09-04T142648Z-1440x900.png |
| B2 Retry re-attempts playback of the same verified clip (no voice swap) | pass | 2026-09-04 14:26:49 | — |
| M1 Mobile 390×844 cold session: deck renders anonymously, fits viewport, no horizontal overflow | pass | 2026-09-04 14:26:50 | qa-m01-mobile-deck-2026-09-04T142650Z-390x844.png |
| M2 Mobile: Guide bar + controls on screen, highlight drawn, NEW River clip playing (hash-verified) | pass | 2026-09-04 14:26:51 | qa-m02-mobile-guide-river-2026-09-04T142651Z-390x844.png |
| M3 Mobile: auto-advance to moment 2 after narration | pass | 2026-09-04 14:27:13 | qa-m03-mobile-auto-advanced-2026-09-04T142713Z-390x844.png |
| M4 Mobile: pause works; milestone highlight (3 boxes) | pass | 2026-09-04 14:27:13 | qa-m04-mobile-paused-highlight-2026-09-04T142713Z-390x844.png |
| M5 Mobile: resume, skip and back work | pass | 2026-09-04 14:27:14 | — |
| M6 Mobile: manual navigation to slide 2 re-syncs the guide (roadmap highlight) | pass | 2026-09-04 14:27:15 | qa-m06-mobile-slide2-resync-2026-09-04T142715Z-390x844.png |
| M7 Mobile network trace: clips fetched from /guide-audio/ only, zero proxy/fallback audio requests | pass | 2026-09-04 14:27:15 | — |
| M8 Zero console errors, zero page errors, zero failed requests (mobile) | pass | 2026-09-04 14:27:15 | — |

## QA log — new On Demand key installed, 2026-09-04 16:25–16:31 UTC

Deployed preview restarted WITHOUT any injected environment so the key had to come from the secret files:
`[ondemand] API key loaded iehV…Pp7M (32 chars) from .env` → probe `POST /chat/v1/sessions` 201 + `GET` 200.
`GET /api/health?probe=1` at `2026-09-04T16:23:33.594Z` returned `ondemand.keyInstalled=true`,
`sessionCreated=true`, `keySource=.env`, `probe.httpStatus={"createSession": 201, "getSession": 200}`,
`sessionId=6a9af08598ed33a866ffbaaf`. Fresh cookie-less headless Chromium (desktop full 21-moment run, autoplay-refused session, mobile 390×844):

| Check | Result | Time (UTC) | Screenshot |
|---|---|---|---|
| D1 Cold shared link, cookie-less session: deck PDF renders page 1 (static same-origin asset) | pass | 2026-09-04 16:25:44 | qa-d01-anon-deck-2026-09-04T162544Z-1440x900.png |
| D2 /api/health: key-installed=true (new key iehV…Pp7M loaded from .env, server-side, masked) and session-created=true (POST 201 + GET 200) | pass | 2026-09-04 16:25:45 | — |
| D2b Key is not present in client code (narrator bundle contains no key material) | pass | 2026-09-04 16:25:45 | — |
| D3 Server: 21 pre-baked ElevenLabs River / eleven_v3 clips, all servable; On Demand fallback key loaded on the TTS proxy | pass | 2026-09-04 16:25:45 | — |
| D4 Clip is real, audible audio: decodes in the browser, RMS well above silence, unhurried pace | pass | 2026-09-04 16:25:45 | — |
| D5 Guide starts: first moment plays the River clip from hash-verified bytes (badge ElevenLabs · River · eleven_v3) | pass | 2026-09-04 16:25:45 | qa-d05-guide-river-playing-2026-09-04T162545Z-1440x900.png |
| D6 Pause during moment 2 (status=paused, audio element paused) | pass | 2026-09-04 16:26:08 | qa-d06-paused-2026-09-04T162608Z-1440x900.png |
| D7 No advance while paused | pass | 2026-09-04 16:26:11 | — |
| D8 Resume continues the same clip | pass | 2026-09-04 16:26:12 | — |
| D9 Skip → next moment | pass | 2026-09-04 16:26:12 | — |
| D10 Back → previous moment (restarts its River clip) | pass | 2026-09-04 16:26:12 | — |
| D11 Milestone highlight (3 KPI tiles) rendered | pass | 2026-09-04 16:26:12 | qa-d11-milestone-highlight-2026-09-04T162612Z-1440x900.png |
| D12 Gate highlight (G4 · 29 Jan 2027) spotlight + tag on the slide | pass | 2026-09-04 16:27:16 | qa-d12-gate4-highlight-2026-09-04T162716Z-1440x900.png |
| D13 Slide auto-advanced to slide 2 in sync with the roadmap moment | pass | 2026-09-04 16:29:13 | qa-d13-auto-slide2-2026-09-04T162913Z-1440x900.png |
| D14 All 21 moments auto-advanced to the end; each played its own River clip (file + SHA-256 = manifest, prebaked, verified) with ZERO audio element errors (no code 4) | pass | 2026-09-04 16:30:58 | qa-d14-tour-complete-2026-09-04T163058Z-1440x900.png |
| D15 Breath gap between consecutive auto-advanced moments ≈ 0.75 s | pass | 2026-09-04 16:30:58 | — |
| D16 Network trace: every played clip fetched from /guide-audio/ with HTTP 200 + Content-Type audio/mpeg (audio/mpeg); ZERO proxy/fallback audio requests | pass | 2026-09-04 16:30:58 | — |
| D17 Manual thumbnail navigation to slide 2 re-syncs the guide (s2-open) | pass | 2026-09-04 16:30:59 | qa-d17-manual-nav-resync-2026-09-04T163059Z-1440x900.png |
| D18 Manual prev-page re-syncs to s1-open | pass | 2026-09-04 16:30:59 | — |
| D19 Guide off: audio stopped, bar removed, manual navigation works | pass | 2026-09-04 16:31:00 | qa-d19-guide-off-2026-09-04T163100Z-1440x900.png |
| D20 Zero console errors, zero page errors, zero failed requests (desktop, full run) | pass | 2026-09-04 16:31:00 | — |
| D21 Network-trace proof captured (PNG + JSON) | pass | 2026-09-04 16:31:01 | — |
| B1 Autoplay refused by the browser → visible 'Playback was blocked… Tap play' + Retry; NO fallback voice, NO MediaError 4 | pass | 2026-09-04 16:31:04 | qa-b1-blocked-state-retry-2026-09-04T163104Z-1440x900.png |
| M1 Mobile 390×844 cold session: deck renders anonymously, fits viewport, no horizontal overflow | pass | 2026-09-04 16:31:07 | qa-m01-mobile-deck-2026-09-04T163107Z-390x844.png |
| M2 Mobile: /api/health key-installed=true, session-created=true | pass | 2026-09-04 16:31:07 | — |
| M3 Mobile: Guide bar + controls on screen, highlight drawn, River clip playing (hash-verified) | pass | 2026-09-04 16:31:07 | qa-m03-mobile-guide-river-2026-09-04T163107Z-390x844.png |
| M4 Mobile: auto-advance to moment 2 after narration | pass | 2026-09-04 16:31:29 | qa-m04-mobile-auto-advanced-2026-09-04T163129Z-390x844.png |
| M5 Mobile: pause works; milestone highlight (3 boxes) | pass | 2026-09-04 16:31:30 | qa-m05-mobile-paused-highlight-2026-09-04T163130Z-390x844.png |
| M6 Mobile: resume, skip and back work | pass | 2026-09-04 16:31:31 | — |
| M7 Mobile: manual navigation to slide 2 re-syncs the guide (roadmap highlight) | pass | 2026-09-04 16:31:31 | qa-m07-mobile-slide2-resync-2026-09-04T163131Z-390x844.png |
| M8 Mobile network trace: clips fetched from /guide-audio/ only, zero proxy audio requests, zero audio element errors | pass | 2026-09-04 16:31:31 | — |
| M9 Zero console errors, zero page errors, zero failed requests (mobile) | pass | 2026-09-04 16:31:31 | — |

## QA log — docked Guide player, 2026-09-04 16:55–17:02 UTC

Baseline first: the previous centred modal intersected the slide canvas on both 1440×900 and 390×844 (screenshots
`before-1440x900`, `before-390x844`). After the redesign, fresh cookie-less headless Chromium sessions (desktop full
21-moment run with a per-moment overlap check, autoplay-refused session, mobile 390×844, plus a desktop layout session
with the viewer scrolled into view) — 41/41 passed:

| Check | Result | Time (UTC) | Screenshot |
|---|---|---|---|
| D1 Cold shared link, cookie-less session: deck PDF renders page 1 (static same-origin asset) | pass | 2026-09-04 16:55:39 | qa-d01-anon-deck-2026-09-04T165539Z-1440x900.png |
| D2 /api/health: keyInstalled=true and sessionCreated=true (iehV…Pp7M from .env; POST 201 + GET 200) | pass | 2026-09-04 16:55:39 | — |
| D3 NEW LAYOUT (desktop): Guide player is a slim docked row BELOW the slide + thumbnails (in-flow, not fixed/absolute), ≤ 64 px tall, does not intersect the slide canvas | pass | 2026-09-04 16:55:39 | qa-d03-docked-player-narrating-2026-09-04T165539Z-1440x900.png |
| D4 Narration plays the hash-verified River clip; badge shows ElevenLabs · River · eleven_v3; caption is compact (≤ 2 lines) | pass | 2026-09-04 16:55:40 | — |
| D5 Expand chevron reveals the full narration text inline below the player row — still no overlap with the slide | pass | 2026-09-04 16:55:40 | qa-d05-caption-expanded-2026-09-04T165540Z-1440x900.png |
| D6 Pause during moment 2 (status=paused, audio paused, player shows 'Paused') | pass | 2026-09-04 16:56:02 | qa-d06-paused-2026-09-04T165602Z-1440x900.png |
| D7 No advance while paused | pass | 2026-09-04 16:56:05 | — |
| D8 Resume continues the same clip | pass | 2026-09-04 16:56:06 | — |
| D9 Skip → next moment | pass | 2026-09-04 16:56:06 | — |
| D10 Back → previous moment | pass | 2026-09-04 16:56:06 | — |
| D11 Milestone highlight (3 KPI tiles) rendered on the unobstructed slide (player below, no intersection with highlights) | pass | 2026-09-04 16:56:06 | qa-d11-milestone-highlight-2026-09-04T165606Z-1440x900.png |
| D12 Gate highlight (G4 · 29 Jan 2027) spotlight + tag on the slide; player docked below, no overlap | pass | 2026-09-04 16:57:10 | qa-d12-gate4-highlight-2026-09-04T165710Z-1440x900.png |
| D13 Slide auto-advanced to slide 2 in sync with the roadmap moment; player still below the (new) slide | pass | 2026-09-04 16:59:07 | qa-d13-auto-slide2-2026-09-04T165907Z-1440x900.png |
| D14 All 21 moments auto-advanced to the end; each played its own River clip (file + SHA-256 = manifest, prebaked, verified) with ZERO audio element errors | pass | 2026-09-04 17:00:52 | qa-d14-tour-complete-2026-09-04T170052Z-1440x900.png |
| D15 Player never intersected the slide canvas or a highlight at ANY of the 21 moments (checked at each moment start) | pass | 2026-09-04 17:00:53 | — |
| D16 Breath gap between consecutive auto-advanced moments ≈ 0.75 s | pass | 2026-09-04 17:00:53 | — |
| D17 Network trace: every played clip fetched from /guide-audio/ with HTTP 200 + audio/mpeg (audio/mpeg); zero proxy/fallback audio requests | pass | 2026-09-04 17:00:53 | — |
| D18 Manual thumbnail navigation to slide 2 re-syncs the guide (s2-open) | pass | 2026-09-04 17:00:53 | qa-d18-manual-nav-resync-2026-09-04T170053Z-1440x900.png |
| D19 Manual prev-page re-syncs to s1-open | pass | 2026-09-04 17:00:53 | — |
| D20 Guide off: player removed, audio stopped, page flag cleared, manual navigation works | pass | 2026-09-04 17:00:54 | qa-d20-guide-off-2026-09-04T170054Z-1440x900.png |
| D21 Zero console errors, zero page errors, zero failed requests (desktop, full run) | pass | 2026-09-04 17:00:54 | — |
| D22 Overlap + network-trace proof captured (PNG + JSON) | pass | 2026-09-04 17:00:55 | — |
| B1 Autoplay refused → docked player shows 'Playback was blocked… Tap play' + Retry (no fallback voice), still not overlapping the slide | pass | 2026-09-04 17:00:57 | qa-b1-blocked-state-retry-2026-09-04T170057Z-1440x900.png |
| M1 Mobile 390×844 cold session: deck renders anonymously, fits viewport, no horizontal overflow | pass | 2026-09-04 17:00:59 | qa-m01-mobile-deck-2026-09-04T170059Z-390x844.png |
| M2 Mobile: /api/health keyInstalled=true, sessionCreated=true | pass | 2026-09-04 17:00:59 | — |
| M3 Mobile NEW LAYOUT: player is FIXED to the bottom edge of the screen (bottom = viewport height), within the viewport width, does not intersect the slide; assistants dock moved above it | pass | 2026-09-04 17:01:01 | qa-m03-mobile-docked-narrating-2026-09-04T170101Z-390x844.png |
| M4 Mobile: controls present, highlight drawn on the slide, River clip playing (hash-verified) | pass | 2026-09-04 17:01:01 | — |
| M5 Mobile: auto-advance to moment 2 after narration; player still docked below the slide | pass | 2026-09-04 17:01:21 | qa-m05-mobile-auto-advanced-2026-09-04T170121Z-390x844.png |
| M6 Mobile: pause works; milestone highlight (3 boxes) visible above the docked player | pass | 2026-09-04 17:01:22 | qa-m06-mobile-paused-highlight-2026-09-04T170122Z-390x844.png |
| M7 Mobile: resume, skip and back work | pass | 2026-09-04 17:01:23 | — |
| M8 Mobile: Gate 4 highlight on the slide with the player docked below (no overlap) | pass | 2026-09-04 17:01:26 | qa-m08-mobile-gate4-highlight-2026-09-04T170126Z-390x844.png |
| M9 Mobile: manual navigation to slide 2 re-syncs the guide; slide 2 fully visible above the player | pass | 2026-09-04 17:01:26 | qa-m09-mobile-slide2-resync-2026-09-04T170126Z-390x844.png |
| M10 Mobile: expanded caption grows the docked player upward but still does not cover the slide | pass | 2026-09-04 17:01:26 | qa-m10-mobile-caption-expanded-2026-09-04T170126Z-390x844.png |
| M11 Mobile network trace: clips from /guide-audio/ only, zero proxy audio requests, zero audio element errors | pass | 2026-09-04 17:01:27 | — |
| M12 Zero console errors, zero page errors, zero failed requests (mobile) | pass | 2026-09-04 17:01:27 | — |
| L1 Desktop 1440×900 with the viewer scrolled into view: whole slide AND the docked player visible together, player below the slide, no overlap | pass | 2026-09-04 17:02:14 | qa-l01-desktop-layout-narrating-2026-09-04T170214Z-1440x900.png |
| L2 Desktop layout — paused state | pass | 2026-09-04 17:02:15 | qa-l02-desktop-layout-paused-2026-09-04T170215Z-1440x900.png |
| L3 Desktop layout — Gate 4 highlight on the unobstructed slide with the player docked below | pass | 2026-09-04 17:02:19 | qa-l03-desktop-layout-gate4-2026-09-04T170219Z-1440x900.png |
| L4 Desktop layout — caption expanded inline below the row (slide untouched) | pass | 2026-09-04 17:02:20 | qa-l04-desktop-layout-caption-expanded-2026-09-04T170220Z-1440x900.png |
| L5 Desktop layout — slide 2 (roadmap) with the player docked below | pass | 2026-09-04 17:02:21 | qa-l05-desktop-layout-slide2-2026-09-04T170221Z-1440x900.png |
| L6 Zero console/page errors during the layout session | pass | 2026-09-04 17:02:21 | — |
