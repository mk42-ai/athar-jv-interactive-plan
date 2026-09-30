# Athar Open Agentic Pact deck — v1.5.2 close-out (2026-09-30)

`pact-deck/dist/` is the prebuilt, bilingual 39-slide deck (no build step; `vercel.json` in this folder declares
`framework: null`, a no-op build and `outputDirectory: dist`).

**Recommended deployment** — give the deck its own Vercel project (e.g. `athar-open-agentic-pact-deck`), Git-linked to
this repository with *Root Directory* = `pact-deck`. Production of `athar-jv-interactive-plan` currently serves the
JV interactive executive plan app (commit f10fec62, 2026-09-05); merging this branch to `main` must NOT be used as a
way to "promote" the deck there — that would replace that app. Promote the deck's own project instead.

Local preview: `cd pact-deck && node serve.mjs dist` → http://localhost:3000/?lang=en

Integrity: `sha256sum -c SHA256SUMS.txt` (232 files) · `node scripts/check-assets.mjs --dist dist` → PASS.
Narration clip map (George, ElevenLabs): `dist/narration/clip-map.json`.
