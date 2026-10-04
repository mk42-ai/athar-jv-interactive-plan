# Athar Open Agentic Pact — interactive deck · release notes v1.6.2 → v1.7.0

**v1.7.2 (2026-10-04) re-cuts section 10 as "Brand" — 46 Brand foundations · 47 Typography · 48 Product & asset gallery (deep links #/28/brand-1…3, aliases #/29/brand-1…3) — see `CHANGELOG.md` and `features/brand/README.md`.**

**v1.7.1 (2026-10-04) added section 10 "Branding" (slides 46 Typography · 47 Brand assets · 48 Product assets, deck total 48) on top of v1.7.0 — see `CHANGELOG.md` and `features/brand/README.md`; the v1.7.0 notes below are retained.**

**v1.7.0 (2026-10-04) is the final release of the PR #8 line** (`deck/pact-v1.5.2-close-out`, edit-in-place on v1.6.4 `131e1b5b`).
45 slides EN/AR (RTL), press-to-play intro, Section 09 "Executive Team" with five executive films in the shared `ExecFilmPlayer`
(EN/AR captions, narrated guide pauses while a film plays and resumes after it), every served film asset content-hashed, every
non-content-addressed file `Cache-Control: no-store`. Full detail per release: `CHANGELOG.md`.

| Release | Commit | What changed |
|---|---|---|
| v1.6.2 | `1482418` | **Muhammed Khalid 50 s cut installed untrimmed** (source `…khalid_1080p_60MB.mp4`, 50.005 s container / 50.000 s video, sha256 `d5c79e68…`; faststart 1080p remux + 720p transcode; face-detected caption-free poster at 18.8 s; EN STT + AR captions, 11 cues). **Stale-build fix:** the six Khalid files carry their own content hash in the filename (`<name>.<sha256[0:10]>.<ext>`) and `/`, `index.html`, `build-info.json`, `js/exec-films.js` became `no-store`; the retired un-hashed Khalid paths answer 404. New `qa/v162`. |
| v1.6.3 | `87faef3` | **No-store cache policy generalised:** every non-content-addressed file (html, json, js, css, vtt, webmanifest, txt) is `no-store` in `serve.mjs` and both `vercel.json`; content-hashed files stay `immutable`; the build stamps `?v=<version>` on every bundle tag so a browser that cached an older bundle misses it as soon as the new `index.html` loads. Sandbox re-provision pitfall identified (a `pkill -f serve.mjs` inside the sandbox matched its own shell and left the previous build running — see the README caveat). New `qa/v163`. |
| v1.6.4 | `131e1b5b` | **Fifth Section 09 card — Lorenzo Avitabile** (slide 45, `#/28/exec-6`, end of section): 4K master → 1080p (crf 20, audio copied) + 720p, hashed names, poster 14.708 s, EN/AR captions (10 cues), George guide clip `NAR-s46`, narration table entry 45; identity from the LinkedIn profile match (SFace cosine 0.902) + film narration. New `qa/v164`; suites moved to 45 slides / 56 clips / 6 Section 09 tiles. |
| **v1.7.2** | this release | **Section 10 re-cut as Brand** — foundations (lockups, clear space, minimum size, colour system by token name, tone lines, tile backdrop), typography (Plex Medium self-hosted, specimen, scale, do/don't), product & asset gallery (personas, composited renders, India/Kenya, wireframes 2x; 1x/2x WebP + JPEG; lightbox); `#/29/brand-k` aliases; `qa/v172`. |
| v1.7.1 | `ef50223` | **Section 10 Branding** — slides 46–48 (typography specimen in the self-hosted OFL brand fonts; logo lockups derived from the official horizontal mark, clear space, minimum sizes, misuse, the five-colour palette + light/dark tokens read from `features/brand/brand-tokens.json` (extracted from the guidelines), mood board, asset-pack summary with PENDING BRAND PACK items; product-asset grid with source pills), EN + AR George clips, `qa/v171`, older suites at 48 slides. |
| v1.7.0 | `4ea5cc0` | **Final release.** Content-hash policy completed for the three remaining films (Al Ameri, Ferreira da Cunha, Unwalla — 18 files renamed, bytes unchanged, 18 old paths retired); `qa/v161` cold-start flake removed (per-worker warm-up, guide settles to `playing` before Play, widened waits, journal on timeout) and proven on 3 consecutive cold-start runs; new `qa/v170` final-release suite; version 1.7.0 everywhere; `SHA256SUMS.txt` + `build-info.json` regenerated; README run/deploy/verify section; this file. No slide content, copy or media bytes changed. |

## What ships in v1.7.0

* `dist/` — the served artefact (45 slides; `dist/js/*.js` runtime modules; `dist/assets/exec/films/<id>/` five films — see the table below; `dist/audio/guide/` 56 George clips; `dist/build-info.json` written at build time with the git commit).
* `features/exec-films/films.json` — source of truth for Section 09 (status, person, titles EN/AR, role lines, source file + sha256, 1080p/720p/poster/VTT paths + sha256, durations, in/out points, poster time, identity notes, hashed-filename maps).
* `SHA256SUMS.txt` — sha256 of every file under `dist/` except `build-info.json` (which records its own sha).
* `qa/v154 … v164`, `qa/v170` — Playwright suites (system Chromium) with committed result JSON.

| Card | Slide · deep link | Role line (EN) | Duration | 1080p / 720p / poster (hashed) |
|---|---|---|---|---|
| H.E. Fahad Mohamed Al Ameri | 41 · `#/28/exec-2` | Executive Director, Development and Humanitarian Affairs, UAE Presidential Court | 40.000 s | `…fahad-al-ameri-1080p.66d9a6d6e0.mp4` / `…-720p.7aef034321.mp4` / `…-poster-07s0.6b79ef7542.jpg` |
| Ary Ferreira da Cunha | 42 · `#/28/exec-3` | Principal, Presidential Court (UAE), Abu Dhabi | 40.000 s | `…ary-ferreira-da-cunha-1080p.b155cd834b.mp4` / `…-720p.281f18ef25.mp4` / `…-poster-04s0.c7cb38c99b.jpg` |
| Muhammed Khalid | 43 · `#/28/exec-4` | Founder & CEO, AIREV | 50.005 s (untrimmed) | `…muhammed-khalid-1080p.288c67b22b.mp4` / `…-720p.f824472ae0.mp4` / `…-poster-18s8.32839348ca.jpg` |
| Kayaan K. Unwalla | 44 · `#/28/exec-5` | Co-founder & Chief Strategy Officer, AIREV | 40.000 s | `…kayaan-unwalla-1080p.2c1c7f0f3b.mp4` / `…-720p.1818dc83fb.mp4` / `…-poster-20s0.976a2a5387.jpg` |
| Lorenzo Avitabile | 45 · `#/28/exec-6` | Senior Advisor — Office of Development Affairs, UAE Presidential Court *(to be confirmed by the client)* | 40.000 s | `lorenzo-1080p.1566f3861a.mp4` / `lorenzo-720p.1b56c492fc.mp4` / `lorenzo-poster.dceede4679.jpg` |

## Open decisions (handover)

1. **Khalid end card left untrimmed.** The delivered 50 s cut ends on the Athar end card; it is installed full length (in 0 s, out 50.0 s). A trim is a one-line `films.json` change (`outPt`) + rebuild if the client wants it.
2. **Lorenzo role line to confirm.** "Senior Advisor — Office of Development Affairs, UAE Presidential Court" rests on the LinkedIn profile match recorded in `films.json` → `identity` and the film's narration; no independent UAE government source was found.
3. Fahad Al Ameri / Ary Ferreira da Cunha role lines rest on self-reported sources (LinkedIn) as documented in `docs/` and the v1.5.8 / v1.6.0 changelog entries.

## Run · deploy · verify (short form; full text in README.md)

```bash
npm ci && npm run build && node scripts/vercel-build.mjs      # version gate + films sync + SHA256SUMS + dist/build-info.json
PORT=3000 node serve.mjs dist                                   # serves dist/ (Range, SPA fallback, cache policy)
cd qa/v170 && GUIDE_BASE=http://127.0.0.1:3000 EXPECT_COMMIT=$(git rev-parse HEAD) PW_WORKERS=2 \
  node ../../node_modules/@playwright/test/cli.js test -c playwright.config.mjs
```

Sandbox re-provision caveat: inside the sandbox stop the old server with `pkill -x node` (a `pkill -f serve.mjs` matches its own shell
and silently leaves the previous build running), extract the new `dist/`, start `serve.mjs`, then **re-check** `/build-info.json?cb=<now>`
reports the new commit before announcing the preview.
