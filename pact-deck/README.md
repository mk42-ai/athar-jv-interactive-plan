# Athar Open Agentic Pact deck — v1.7.0 (2026-10-04) · final release

Bilingual (EN/AR, RTL) **45-slide** community-pact deck by ODA × AIREV, skinned to the Athar brand tokens. `dist/` is the shipped artefact (v1.2.1 Vite build + runtime modules `dist/js/*.js` + appended CSS); the React/TypeScript sources have been 0-byte since the first platform restore, so every change since v1.2.0 is applied in place at runtime. Release summary v1.6.2 → v1.7.0: `RELEASE_NOTES.md`; full history: `CHANGELOG.md`.

## v1.7.0 — run, build, deploy, verify

**What is in the build.** 45 slides (01–27 bundle, 28–38 runtime sections 07/08, 39 closing, 40–45 Section 09 "Executive Team"), press-to-play intro film, narrated guide (56 George clips, pauses while any film plays), five executive films in the shared `ExecFilmPlayer` (`dist/js/exec-film-player.js`; EN/AR `<track>` captions; 1080p on desktop, 720p ≤ 720 px wide): Fahad Al Ameri 41 · Ary Ferreira da Cunha 42 · Muhammed Khalid 43 (50 s, untrimmed) · Kayaan Unwalla 44 · Lorenzo Avitabile 45 (`#/28/exec-2 … exec-6`). Source of truth for Section 09: `features/exec-films/films.json` (one entry per card — source file + sha256, 1080p/720p/poster/VTT paths + sha256, durations, poster time, identity notes). **Every served film asset is content-hashed** (`<name>.<sha256[0:10]>.<ext>`, `public, max-age=31536000, immutable`); **every non-content-addressed file is `Cache-Control: no-store`** (html, json, js, css, vtt, webmanifest, txt) and the build stamps `?v=1.7.0` on every bundle tag — a viewer can never be served a stale deck or a stale film under a reused URL.

**Run locally**

```bash
npm ci                                  # Playwright 1.63 is a devDependency; the QA suites use the system Chromium (/usr/bin/chromium, or CHROMIUM_BIN)
npm run build                           # prebuild check-assets → scripts/v1.4.7/build.mjs (version gate, films sync → dist/assets/exec/films + dist/js/exec-films.js, ?v= stamps, SHA256SUMS.txt) → postbuild check-assets
node scripts/vercel-build.mjs           # = npm run build + writes dist/build-info.json {version, commit (git HEAD or VERCEL_GIT_COMMIT_SHA), builtAt, films[], distFiles, sha256sums}
PORT=3000 node serve.mjs dist           # static server: Range → 206, SPA fallback, MIME, the cache policy above (same rules as vercel.json)
```

Clean rebuild of the generated parts only (never `rm -rf dist` — `dist/` is committed and hand-maintained): `rm -rf dist/js/exec-films.js dist/assets/exec/films dist/build-info.json && npm run build`.

**Verify (any base URL — local or public)**

```bash
cd qa/v170 && GUIDE_BASE=https://<host> EXPECT_COMMIT=$(git rev-parse HEAD) DECK_TOTAL=45 PW_WORKERS=2 SHOTS_DIR=/tmp/shots \
  node ../../node_modules/@playwright/test/cli.js test -c playwright.config.mjs
# older suites the same way: qa/v154 v155 v159 v160 v161 v162 v163 v164 (results land in qa/<suite>/results/*.json; delete qa/*/results/test-output before committing)
cd ../.. && npm test                    # repository root: node --test tests/*.test.mjs (124 pass / 1 skipped at v1.7.0)
python3 tests/ingestion.test.py && python3 -m unittest discover -s tests/ui -p 'test_*.py' && python3 tests/grounding_cases.py --self-test
```

`qa/v170` is the release gate: 1.7.0 in every version literal and `?v=` stamp; five shipped films with 30 content-hashed files whose hash prefix is their own sha256 and which are listed in `SHA256SUMS.txt`; each card × EN/AR × 1440x900/390x844 in a cache-disabled context (hashed `currentSrc` per viewport, films.json duration ± 0.5 s, hashed poster + EN/AR tracks, plays with the language's cues; poster + mid-playback screenshots; overview tiles 40–45); served checks (sha256 + `immutable` on the 30 film files, `no-store` on `/`, `index.html`, `build-info.json`, `js/exec-films.js`, served build-info commit == deployed HEAD, 24 retired paths 404); 45 slides EN + AR with 0 console errors / 0 failed requests; deep links 32, 38, 39–45 in both languages. Cold-start determinism: every suite that opens a card first runs `warmUp()` (`qa/v154/lib.mjs`) — see the v1.7.0 CHANGELOG entry.

**Deploy**

* *Vercel (GitHub integration).* Every push to the PR branch builds a preview (root `vercel.json` → `buildCommand: node pact-deck/scripts/vercel-build.mjs`, `outputDirectory: pact-deck/dist`); `build-info.json` records `VERCEL_GIT_COMMIT_SHA`. Previews are immutable per commit.
* *Vercel Sandbox preview (the public URL used for sign-off).* The sandbox serves whatever `node serve.mjs dist` process runs inside it, so a new build must be re-provisioned **in place**: stage `serve.mjs`, `package.json`, `SHA256SUMS.txt`, `features.json`, `films.json` and `dist/` into one tarball, copy it in, then inside the sandbox stop the old server, extract, verify `sha256sum -c SHA256SUMS.txt`, start the server, and **re-check the served commit**.

> **Sandbox re-provision caveat.** Stop the old server with `pkill -x node` — a `pkill -f "[s]erve.mjs"` run through `sandbox exec … bash -lc` matches its *own* shell, exits non-zero and silently leaves the previous build running (seen during the v1.6.3 pass). Start the server in a second `sandbox exec` (`(PORT=3000 nohup node serve.mjs dist > /tmp/serve.log 2>&1 &)`) and only announce the preview after `curl -H 'Cache-Control: no-cache' https://<host>/build-info.json?cb=$(date +%s)` reports the new `commit`. Sandboxes expire at their `--timeout`; a re-created sandbox gets a new random `https://sb-<token>.vercel.run` URL.

**Decisions recorded for the handover**

* **Khalid end card left untrimmed.** The 50 s cut delivered on 4 Oct 2026 (`athar-origins-of-impact-ep01-muhammed-khalid_1080p_60MB.mp4`, 50.005 s container) is installed full length — it ends on the Athar end card and no trim was requested. If the client wants the card cut, set `films.json` → `films.khalid.outPt` and rebuild (the player stops at the out-point; no re-encode needed).
* **Lorenzo Avitabile role line — source.** "Senior Advisor — Office of Development Affairs, UAE Presidential Court" / «مستشار أول — مكتب شؤون التنمية، ديوان الرئاسة بدولة الإمارات» comes from the LinkedIn profile match recorded in `films.json` → `films.lorenzo.identity` (face match against the film's title-card portrait, SFace cosine 0.902, confidence high) and from the film's own narration. **To be confirmed by the client**; no independent UAE government source was found.
* Fahad Al Ameri and Ary Ferreira da Cunha role lines rest on self-reported (LinkedIn) sources as documented in `docs/` and the v1.5.8 / v1.6.0 changelog entries; Khalid and Unwalla were verified in v1.6.x.

---

# Earlier README (v1.4.7, kept verbatim)

# Athar Open Agentic Pact deck — v1.4.7 (2026-09-29) · image-integrity release

Bilingual (EN/AR, RTL) **39-slide** community-pact deck by ODA × AIREV, skinned to the Athar brand tokens. `dist/` is the shipped artefact (v1.2.1 Vite build + runtime modules `dist/js/*.js` + appended CSS); the React/TypeScript sources have been 0-byte since the first platform restore, so every change since v1.2.0 is applied in place at runtime.

## v1.4.7 in one screen

* **Every image renders, everywhere.** The five/six broken slots reported by the v1.4.6 master QC (slide 29 ×4 — three tier heroes + OWNERSHIP banner; slide 32 — Mastercard Foundation tile; slide 30 — Qualcomm mark / Lebanon evidence) are restored or replaced from official sources only (Athar Brand Asset Pack v3 imagery, canonical UAE–Lebanon "One Million Lebanese AI Experts" launch photo with attribution and a whole-card link to The National, unaltered Qualcomm vector wordmark, typographic Mastercard Foundation tile). Provenance per slot: `IMAGE_VERIFICATION_REPORT.md` § 2, `proof/v1.4.7/prov-slots.json`.
* **Bullet-proof against image breakage.** `dist/js/img-guard.js` (first script in `<head>`) swaps any failed `<img>` — static, runtime-inserted or in the lightbox — to the branded `dist/assets/img/fallback-athar.svg` and marks it `data-img-fallback="1"`; posters and CSS backgrounds get a fallback layer; every `<img>` has width/height + alt (EN/AR), `decoding="async"`, `loading="lazy"` off-slide; zero external hotlinks.
* **Build gate.** `npm run build` = `check-assets` (prebuild) → `scripts/v1.4.7/build.mjs` (versions + required assets + `SHA256SUMS.txt`) → `check-assets --quiet` (postbuild). `scripts/check-assets.mjs` resolves static AND runtime-composed image paths (module manifests, tour screens/stills, icon pack, Vite video templates) and exits 1 on any missing / 0-byte / case- or encoding-mismatched / external image, or a static `<img>` without alt/width/height. Standalone: `npm run check:assets`.
* **Serving.** `npm start` → `node serve.mjs dist` (`PORT`, default 3000): correct Content-Type for png/jpg/jpeg/svg (image/svg+xml)/webp/ico (image/x-icon)/gif/avif/mp4/webm/vtt/json/webmanifest, single-range `Range` → 206, 416 on unsatisfiable ranges, SPA fallback, nosniff.
* **Verification.** 39 slides × en/ar walked in fresh headless Chromium on localhost AND on the live sandbox: every `<img>` complete + naturalWidth > 0 + not the fallback, every asset 200 + right MIME + sha256, 0 console errors, 0 failed/4xx requests, 0 axe image violations, no slot overflow (RTL included), no text overlap on slides 21/30 — `IMAGE_VERIFICATION_REPORT.md`, `image-render-matrix.csv`, `contact-sheet-v1.4.7.png`, `screenshots-v1.4.7.zip`.
* Deep links: `#/NN` (bundle slides 01–27), `#/27/new-1 … new-11` (runtime slides 28–38), `#/28` (closing, shown as 39/39); `?lang=en|ar`; `?intro=1` replays the intro film.
* Version string: `<meta name="application-version" content="1.4.7">`, `html[data-deck-version="1.4.7"]`, footer badge `v1.4.7`, module `VERSION`s, `package.json`, locales/captions, `tour-assets.json`, `site.webmanifest`.

## Lineage (see `CHANGELOG.md`)

v1.4.0 section 08 "Athar OS" + whole-card news links → v1.4.1 real product screens + product film → v1.4.1-r1 byte-for-byte recovery → v1.4.2 intro film gate with Skip → v1.4.3–v1.4.6 (shared uncropped video player with Expand → lightbox, launch film on 34/35, hygiene; sources not recoverable on this pod — behaviour re-implemented in `dist/js/video-player.js` for v1.4.7) → **v1.4.7 image-integrity release**. Restore ledger for this build: `proof/v1.4.7/restore147-ledger.json` (181 files byte-identical to the v1.4.6 checksum log, 21 text files carried from the v1.4.2 snapshot and patched, 93 non-rendering files absent — listed).

---

### Historic notes (v1.3.x, kept verbatim)

* Serve: `npm start` (→ `node serve.mjs dist`, Range requests, SPA fallback, MIME for .mp4/.webm/.vtt/.svg/.webp). Version: `<meta name="application-version" content="1.3.3">`, `html[data-deck-version]`, footer `v1.3.3`.
* v1.2.1 (2026-09-24): three partners retired everywhere (cards, lineups, locale strings, alt text, CSS, logo files, manifests, contact sheet — grep gate 0 hits); candidate marks for ODA, UNDP, UNICEF, IFRC, WFP, UNHCR, Discord and the United Arab Emirates (`brand/partners/`, `BRAND_USAGE_NOTES.md` § 12); slide 21 as a uniform 5×2 wall with role chips; pillar visual system (pack icons in the six pillar headers, native inline-SVG motifs on slides 13/14/18, pattern band, RTL-mirrored — `dist/js/pillar-visuals.js`); one step-3 texture (`brand/step3-gate-results.md`); asset-pack inventory (`brand/asset-pack-inventory.csv`, `brand/asset-pack-notes.md`); WCAG AA contrast gate (`brand/wcag-contrast-v1.2.1.json`).
* v1.3.3 (2026-09-27): workspace restored in place again (v1.3.2 served build recovered byte-for-byte from the still-live v1.3.2 sandbox — `proof/restore-v1.3.3.json`); slide 17 rebuilt as an API-licence tile grid (bundle copy reduced to title + new subtitle, seat ladder moved to `docs/appendix-seat-ladder.md`; runtime module `dist/js/api-licences.js` + `dist/assets/api-licences.css`; 10 tiles with official marks under `dist/assets/api/`); slide 29 heroes replaced by photoreal concept renders with the official Athar logo composited programmatically (`dist/assets/impact/v133/`, credits with quads/blend/sha256), tags *Concept render*; slide 30 cards show publisher / technology-partner marks instead of article photos (`dist/assets/news/marks/`; photos deleted), + Qualcomm (WAM 2026-08-13) and Middle East AI News cards, Dragonwing in the trademark footnote; programme acronym removed from the served bundle; `BRAND_USAGE_NOTES.md` § 15; contact sheet regenerated; footer/meta/package v1.3.3.
* v1.3.2 (2026-09-27): workspace restored in place (v1.3.1 served build recovered byte-for-byte from the still-live v1.3.1 sandbox, then v1.3.0 and v1.2.1 archives — `proof/restore-v1.3.2.json`); slides 29/30/32 rebuilt in the runtime module — 29 three equal product-led columns (Licences · Appliance AI PCs & desktops · Sovereign data-centre nodes) with product visual, What is delivered, Outcomes measured, impact band with World Bank WDI tags (2026-07-13), Intel/Qualcomm technology-partner marks row (reference only) and a full-width Ownership call-out with handover / asset-transfer / farmer-impact visuals; 30 agreement band + 4-column "In the news" strip (12 cards: hero thumbnail, favicon, headline, date, tag pill, tier chip; `dist/assets/news/credits.json`); 32 four funder tiles in one identical treatment (Gates · Rockefeller · McGovern · Mastercard Foundation master artwork) + disclaimer in its own band; footer/meta/package v1.3.2; contact sheet regenerated; `BRAND_USAGE_NOTES.md` § 14.
* v1.3.1 (2026-09-27): slides 29/30/32 revised in place (runtime module + stylesheet, bundle untouched) — 29 "Three impact tiers" rebuilt as three product-led columns (Licences · Appliance AI PCs & AI desktops · Data centres) with product visuals, impact bands, World Bank WDI baseline tags, an Intel/Qualcomm technology-partners row with trademark footnote and the ownership call-out; header visual = UAE-origin arcs map (`dist/assets/tiers/`, never mirrored); 30 "What we deliver" — agreement line in its own band + "In the news" evidence strip (8 items, local thumbnails/favicons, © credits, Direct announcement / Related coverage tags, `docs/news-provenance.md`); 32 "Delivered with" — the two non-foundation funder cards removed, Rockefeller / McGovern / Mastercard Foundation official site marks (`brand/partners/`, `BRAND_USAGE_NOTES.md` § 13), disclaimer + source note in their own band. Footer v1.3.1.
* v1.3.0 (2026-09-27): "Outcomes are the product" section — six slides (28–33) between Roadmap and Closing (deck now 34 slides), added in place as a runtime module `dist/js/impact-tiers.js` + `dist/assets/impact-tiers.css` (bundle untouched); every figure from *Athar — Agentic AI for All: Three Impact Tiers for Foundation Funding* (27 Sep 2026) with page references in `data-src`; EN/AR strings in `dist/locales/impact-tiers.{en,ar}.json`, caption stubs `dist/captions/impact-tiers-{en,ar}.vtt`; deep links `#/27/new-1…6`; slide 32 "Delivered with" reuses the v1.2.1 candidate marks + Gates mark (INTERNAL REVIEW ONLY; provenance `brand/download-manifest.json` → `reused_in_v1_3_0`), funders without a sourced official mark are typographic wordmarks.
* Brand rules and evidence: `BRAND_USAGE_NOTES.md` (§ 10 permissions, § 11 AIREV lock-up, § 12 v1.2.1 candidate marks), `BRAND_COMPLIANCE_REPORT.md` (v1.1.0), `brand/` (tokens, logo manifest, partner-mark provenance, download manifest, contact sheet), `proof/`.
* Motion: `public/video/V1–V4` are locally rendered loops; `prefers-reduced-motion` disables slide, trace-rule and motif animation.
* History: `CHANGELOG.md`. **The v1.3.0 hero film / interactive hero / brand-expansion assets remain unrecovered** (0-byte after the platform restore; no v1.3.0 archive exists in the session) — this build is the v1.2.0 brand-pass lineage.


## v1.3.4 — 2026-09-27 (rebuilt in place; acceptance pass)

- The deck is served from `dist/` by `serve.mjs` (`npm start`, `PORT=3000`). 39 slides: 28 bundle slides + 11 runtime slides registered with `dist/js/deck-core.js` (07 Impact & funding 28–33 from `dist/js/impact-tiers.js`; 08 Athar OS 34–38 from `dist/js/athar-os.js`); slide-17 grid from `dist/js/api-licences.js`; styles in `dist/assets/deck-ext.css`.
- News link register (slide 30): `dist/assets/news/link-register.json` (authoritative at runtime) · `docs/news-link-register.md`.
- Acceptance evidence: `proof/v1.3.4/` (gate scripts, per-check JSON, restore log, 16:40Z link check) and `acceptance-v1.3.4.json` at the archive root.
- Deep links: `#/NN` for bundle slides, `#/27/v-1 … #/27/v-11` for the runtime slides.
