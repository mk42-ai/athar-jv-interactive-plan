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

Click **Guide me** in the presentation toolbar. A soft-spoken American voice narrates the deck moment by moment
(21 narrated moments across the 2 slides — headline numbers, the six gates, anchors, commercials, delivery, roadmap rows),
highlights the element being discussed on the rendered slide, and auto-advances the slide when narration completes.

- Controls: play/pause (`Space`), back (`[`), skip (`]`), exit (`Esc` via the ✕). Manual page navigation still works and re-syncs the guide.
- Voice (primary): **ElevenLabs** — voice `Adam` (premade, id `pNInz6obpgDQGcFmaJgB`), model `eleven_v3` (fallback `eleven_multilingual_v2`), soft-spoken settings stability 0.7 · similarity 0.8 · style 0 · speed 0.9 · speaker boost, plus a 750 ms breath between moments. The key lives ONLY in `ELEVENLABS_API_KEY` (server env). The brief's ranked library voices (Spuds Oxley, Michael C. Vincent, James, Peter) return HTTP 402 `paid_plan_required` on the free plan, so the first usable shortlist voice (Adam) is used; set `ELEVEN_VOICE_ID`/`ELEVEN_VOICE_NAME` to switch once the plan allows library voices.
- Pre-baked narration: `npm run guide:prebake` synthesises all 21 moments into `public/guide-audio/` (+ `manifest.json`); `POST /api/guide/tts` serves those first (zero quota, identical voice for every visitor, works anonymously), synthesises live only for new text, and falls back to On Demand `gpt-4o-mini-tts`/`nova` (`ON_DEMAND_API_KEY`) when ElevenLabs is unavailable. Every request is logged server-side as `provider/model/voice/source`; `GET /api/guide/voice` reports the active provider, settings, pre-baked clip count, shortlist usability and remaining ElevenLabs quota.
  Falls back to the browser Web Speech API (soft `en-US` voice, rate 0.92) when the API key is missing/unavailable, and to a
  timed silent pace when no audio engine exists — so auto-advance always works. The active source is shown in the guide bar.
- Script + highlight geometry: `src/lib/guide.js` (boxes are slide fractions measured from the PPTX shapes).

## QA log — Guide Mode voice (ElevenLabs Adam / eleven_v3), 2026-09-04

End-to-end run in fresh, cookie-less headless Chromium sessions (desktop 1440×900 and mobile 390×844) against the live
sandbox preview. Provider/model/voice are asserted from the `/api/guide/voice` response, the per-request proxy log and the
clip URL actually loaded by the `<audio>` element; timestamped screenshots live in the run's `.ui-proof/` attachments.

| Check | Result | Time (UTC) |
|---|---|---|
| D1 Anonymous cookie-less session: deck PDF renders page 1 from the raw link (static same-origin asset) | pass | 2026-09-04 12:49:41 UTC |
| D2 Deck bytes match the bundled PDF (no signed/expiring URL in the load path) | pass | 2026-09-04 12:49:42 UTC |
| D3 Server reports provider=elevenlabs, voice Adam, model eleven_v3, 21 pre-baked clips, live quota via the new token | pass | 2026-09-04 12:49:42 UTC |
| D4 Guide Mode starts; narration plays the ElevenLabs Adam/eleven_v3 clip (badge + provider log + pre-baked clip URL) | pass | 2026-09-04 12:49:42 UTC |
| D5 Pacing: opening moment is unhurried (≈120–160 wpm at speed 0.9) and the audio clock advances | pass | 2026-09-04 12:49:45 UTC |
| D6 Auto-advances to the next moment after narration completes, with the 750 ms breath | pass | 2026-09-04 12:50:04 UTC |
| D7 Milestone highlight (3 KPI tiles) rendered for the new moment | pass | 2026-09-04 12:50:04 UTC |
| D8 Pause stops narration (status=paused, audio element paused) | pass | 2026-09-04 12:50:05 UTC |
| D9 No advance while paused (3 s) | pass | 2026-09-04 12:50:08 UTC |
| D10 Resume continues narration (status=speaking, audio playing) | pass | 2026-09-04 12:50:09 UTC |
| D11 Skip → next moment | pass | 2026-09-04 12:50:09 UTC |
| D12 Back → previous moment | pass | 2026-09-04 12:50:09 UTC |
| D13 Gate highlight (G4 · 29 Jan 2027) spotlight + tag on the slide; gate clip is the pre-baked ElevenLabs one | pass | 2026-09-04 12:50:11 UTC |
| D14 Slide auto-advances to slide 2 when the last slide-1 moment finishes (in sync with narration) | pass | 2026-09-04 12:50:55 UTC |
| D15 Manual prev-page during Guide Mode re-syncs the guide (page 1 → s1-open) | pass | 2026-09-04 12:50:56 UTC |
| D16 Thumbnail navigation to slide 2 re-syncs the guide (s2-open, roadmap highlight) | pass | 2026-09-04 12:50:56 UTC |
| D17 Guide off: bar/highlights removed, audio stopped, manual navigation still works | pass | 2026-09-04 12:50:57 UTC |
| D18 Live (non-pre-baked) synthesis through the proxy also uses the new token: ElevenLabs Adam | pass | 2026-09-04 12:50:58 UTC |
| D19 Zero console/page errors and no failed requests (desktop) | pass | 2026-09-04 12:50:58 UTC |
| M1 Mobile 390×844 fresh session: deck renders anonymously, fits viewport, no horizontal overflow | pass | 2026-09-04 12:50:59 UTC |
| M2 Mobile: Guide bar + play/skip/back on screen, highlight drawn, ElevenLabs clip playing | pass | 2026-09-04 12:50:59 UTC |
| M3 Mobile: skip + pause work; milestone highlight (3 boxes) rendered | pass | 2026-09-04 12:51:01 UTC |
| M4 Mobile: manual navigation to slide 2 re-syncs the guide | pass | 2026-09-04 12:51:01 UTC |
| M5 Zero console/page errors and no failed requests (mobile) | pass | 2026-09-04 12:51:01 UTC |
