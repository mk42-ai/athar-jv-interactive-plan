# Athar Open Agentic Pact deck — v1.5.1 offline bundle (2026-09-30)

Self-contained static deck: `dist/` (39 slides, EN/AR) + `serve.mjs` (dependency-free Node 22 static server with MIME table, HTTP Range/206 for media, no X-Frame-Options, `/favicon.ico` alias) + `vercel.json` + `SHA256SUMS.txt` (212 files over dist/).

## Run locally
    node --version            # 22.12+ required
    node serve.mjs dist       # serves on http://localhost:3000  (PORT=8080 node serve.mjs dist to change)
Open http://localhost:3000/?lang=en  or  ?lang=ar  — deep links `#/NN` (slides 1-27), `#/27/new-1…new-11` (28-38), `#/28` (closing 39/39); `?intro=1` replays the intro film.

## Verify integrity
    sha256sum -c SHA256SUMS.txt        # expects 212 OK
    node scripts/check-assets.mjs --dist dist   # asset gate: missing 0 / zero 0 / unreferenced 0

## What changed in v1.5.1
16 dist slots replaced by the v1.5.1 renders (same path + filename; see slot-map-v1.5.1.csv): favicon 16/32/.ico, apple-touch 180, icon-512, og-image 1200x630, khatam pattern tile 512, and the 9 pillar/pack icons (incl. the 4 new glyphs automation / community / data-privacy / impact). Footer + manifest + package stamps bumped to v1.5.1. No slide markup, CSS or video binaries were touched.
