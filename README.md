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
