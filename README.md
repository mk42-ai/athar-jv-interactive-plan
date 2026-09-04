# Athar JV — Executive Summary · PDF presentation · Timeline · Grounded chat · Advanced Voice Mode

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
