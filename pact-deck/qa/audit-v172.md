# Audit of v1.7.2 — Section 10 · Brand (slides 46–48) and the slide-48 lightbox

Target: v1.7.2 · commit `4c2a45b` · https://sb-4damt33hbl2d.vercel.run · Vercel `dpl_5kQy5TBJ6vruTw8K7VBpJ7hsKWrY`  
Written (UTC): 2026-10-04T14:16:15Z

> The scheduled step-3 audit (executePrompt) failed upstream ("a request is already running in this session") and the criteria step (perplexity) failed ("Query too long"), so no qa/audit-v172.json existed; this file was produced in the v1.7.3 run by auditing the live v1.7.2 preview directly.

**Method.** headless Chromium 154 (playwright-core 1.63 from the repo), fresh context per slide×locale×viewport, CDP Network.setCacheDisabled; axe-core 4.13.0 (wcag2a/aa, wcag21a/aa, wcag22aa, best-practice) on the active section; Lighthouse 12 desktop emulation 1440x900 (accessibility, best-practices, performance); in-page WCAG contrast of every visible text node (effective background by compositing ancestor backgrounds); keyboard-origin focus styles; lightbox keyboard walk (Enter, Tab×4, Shift+Tab, Esc) and pointer walk; touch-target boxes; overflow/clipping scan; RTL geometry (swatch/tile x-order, chevrons, inline-end controls); srcset/type/fallback inspection; document.fonts.check; N-key narration playback with autoplay allowed; deep-link and runtime hash walk; rail order

**Check groups (UTC).** slides+lightbox: 2026-10-04T13:41:50.187Z → 2026-10-04T13:42:38.919Z · routes: 2026-10-04T14:13:18.114Z → 2026-10-04T14:13:52.131Z · narration: 2026-10-04T14:13:52.131Z → 2026-10-04T13:42:38.919Z · lighthouse: 2026-10-04T13:53Z → 13:58Z (46–48) · 14:00Z → 14:04Z (38/45 reference) · guidelines check: 2026-10-04T13:36Z

**Summary.** P0 1 · P1 8 · P2 13 — fixed in 1.7.3: 14 · verified / no change: 8 · deferred (out of scope): 5 · won't-fix: 1

## Findings

| ID | Pri | Slide | Locale | Viewport | Criterion | Finding | Fix specification | Resolution |
|---|---|---|---|---|---|---|---|---|
| A-01 | P0 | 46,47,48 | en,ar | 1440x900 (47), 390x844 (46,47,48), 1440x900 EN (48) | 2.1.1 Keyboard; axe scrollable-region-focusable (serious) | Scrollable slide bodies are not keyboard-focusable | Make `.s-body.br-body` a named region: tabindex=0, role=region, aria-label="<slide title> — Slide content — scrolls"; add a visible 3 px focus ring (`.br-body:focus-visible`); tighten the desktop rhythm so 46/48 do not scroll at 1440x900 (see A-13) | **fixed** (1.7.3) |
| A-02 | P1 | 48 + lightbox | en,ar | both | 4.1.2 Name, Role, Value; ARIA dialog pattern | Lightbox dialog has no accessible name tied to its content (no aria-labelledby; inherits "Enlarge") | Give the caption text span an id; tile aria-labelledby=<caption-txt id> (+ aria-describedby=<source id>); when expanded keep role=dialog aria-modal=true aria-labelledby; no aria-label on the dialog; restore on close | **fixed** (1.7.3) |
| A-03 | P1 | 48 lightbox | en,ar | both | 2.5.8 Target Size (min) passes at 24; project threshold 44x44 (2.5.5 AAA) | Lightbox Close control is 40 x 40 CSS px | Close = 48 x 48 px (both rules), centred glyph, ink colour, 3 px focus ring with a halo | **fixed** (1.7.3) |
| A-04 | P1 | 48 | en,ar | both | 4.1.2; ARIA in HTML (figure allows no button/dialog role); axe aria-allowed-role (minor x11); Lighthouse label-content-name-mismatch | Tiles are figure[role=button] (role not allowed on figure); the expanded figure takes role=dialog (also not allowed); visible caption text not part of the accessible name | Tile = <div class=br-tile role=group aria-labelledby aria-describedby>; the picture sits in a real <button type=button class=br-tile-open aria-label="Enlarge: <caption>"> (native Enter/Space, visible focus ring); caption = <div>; expanded: role=dialog on the div (allowed); the picture button becomes "Close the enlarged view"; Tab/Shift+Tab cycle inside (capture-phase trap) | **fixed** (1.7.3) |
| A-05 | P1 | 48 | en,ar | 1440x900 | 1.4.10 Reflow / 1.4.4; visual clipping | Tile source lines are cut: unbreakable file name overflows horizontally and the 2-line clamp hides the rest | `overflow-wrap:anywhere; word-break:break-word`, clamp 3 lines on tiles (ellipsis, full text in a `title` tooltip and in the dialog), no clamp inside the lightbox | **fixed** (1.7.3) |
| A-06 | P1 | 46,47,48 | ar | both | RTL typography (brand rule: Arabic is never tracked); 1.3.2 | Arabic kicker and chapter number rendered with letter-spacing in the AR deck | html[lang=ar] .br-slide .s-head .s-kicker, .chapter-n { letter-spacing:0 } (Section 10 scope; deck-wide header style left for a separate change — see D-02) | **fixed** (1.7.3) |
| A-07 | P1 | 47 | en,ar | both | narration completeness (release requirement: every slide a George EN/AR clip matching its content) | Slide 47 reuses the v1.7.1 typography clip NAR-s47 (cue anchors s46-*), written before the v1.7.2 re-cut; it does not mention the primary IBM Plex Sans Medium / IBM Plex Sans Arabic Medium pairing now on the slide; AR Scribe WER 0.283 | Generate NAR-s52 EN + AR with the same pipeline (George JBFqnCBsd6RMkjVDRZzb, eleven_multilingual_v2, mp3_44100_128), Scribe-verify (scribe_v1, word timestamps → sentence cues s47-c1…c8), wire into slide-narration.json + narration-manifest.json + brand.json, retire NAR-s47 files, update SHA256SUMS | **fixed** (1.7.3) |
| A-08 | P1 | 48 | en,ar | both | brand compliance: render content + logo minimum size (guidelines minimum-size table: horizontal lockup 160 px, monogram 32 px) | Laptop + phone render: identifiable Riyadh/Kingdom-Centre skyline behind the glass (conflicts with the UAE narrative — flagged for the editImage step, which produced ohVo7cVcwn.png); the v1.7.2 composite set the horizontal lockup at 81 px wide on the phone header — below the 160 px digital minimum | New scripts/v1.7.3/recomposite_laptop_render.py: asserts the input sha256s, composites the أثر MONOGRAM (Ivory, 56 px ≥ 32 px minimum) at a PINNED position (414, 540), opacity 1.0, encodes 2x WebP 1536 / 1x WebP 800 / JPEG 1536 with fixed settings, content-addressed names, rewrites the 3 assets.json entries (placement, encoder, inputs, reproduce command); `--verify` re-derives and compares the hashes | **fixed** (1.7.3) |
| A-09 | P1 | 48 | en,ar | both | srcset correctness (HTML standard: x descriptors assume exact density multiples) | Density descriptors inexact: 1x candidates are 800 px wide while 2x candidates are 1536 px (renders) / 1600 px (wireframes); `<img srcset>` repeats the JPEG without a descriptor | Width descriptors (`800w, 1536w|1600w`) + `sizes="(max-width:700px) 92vw, (max-width:1100px) 30vw, 11vw"` derived from the gallery grid; JPEG stays the <img src> fallback; width/height attributes keep the intrinsic ratio (no CLS); slide-38 plates keep exact 1x/2x | **fixed** (1.7.3) |
| A-10 | P2 | 46 | en,ar | both | 1.3.1 Info and Relationships; axe empty-table-header (minor); Lighthouse td-has-header | Minimum-size table: empty first header cell, no scope attributes | First header = "Version"/"النسخة", scope=col on all headers, the version cell becomes <th scope=row> | **fixed** (1.7.3) |
| A-11 | P2 | 46,47,48 | en,ar | both | 1.4.3 / 1.4.11 contrast | Header and clear-space marks reported "incomplete" by axe (background image behind the header) — manual measurement required | No change; measured values recorded; qa/v173 re-measures every visible text node and asserts ≥ 4.5:1 (≥ 3:1 large) | **verified-no-change** |
| A-12 | P2 | 46 | en,ar | both | brand guidelines compliance (Table 3.1) | Two extra swatches #405A5B / #BEAA91 shown under "Moodboard accents" next to the five v1.0 tokens — are they in the guidelines? | KEEP the two swatches (they are listed) as a labelled SECONDARY row: heading "Secondary colours — guidelines Table 3.1 (p. 30)" (+ tooltip note), core row prefixed "Core tokens — tokens_v1 (guidelines p. 32)"; brand.json colourSystem.secondaryRow carries the citation; hex still from brand-tokens.json; the five core tokens unchanged | **fixed** (1.7.3) |
| A-13 | P2 | 46,47,48 | en,ar | 1440x900 | visual: scrollbars on a 900 px-tall desktop | Slide bodies overflow a 744 px viewport by a few pixels (46 EN 754, 48 EN 771; 47 EN 807 / AR 862) | @media (min-width:701px) and (max-height:940px): body gap clamp(6px,1vh,10px), grid/col gaps 10 px, card padding 8/11, tile gap 10, swatch chip clamp(28px,3.6vh,36px); 47 stays a dense reference slide that may scroll (focusable, A-01) | **fixed** (1.7.3) |
| A-14 | P2 | 48 lightbox | en,ar | both | visual: truncation inside the dialog | Dialog caption keeps a 3-line clamp (long source strings truncated) | No clamp in the dialog (display:block; overflow:visible) | **fixed** (1.7.3) |
| A-15 | P2 | 48 lightbox | en,ar | 390x844 | mobile lightbox | Phone lightbox: image 374 x 249 in an 844 px viewport, caption centred, Close at inline-end (left in AR) — acceptable; swipe-to-close not implemented | No change (Esc, Close button and the picture button all close; swipe gesture deferred — D-03) | **verified-no-change** |
| A-16 | P2 | 46,47,48 | en,ar | both | routing / deep links | #/29/brand-1…3 aliases normalise away from the address bar (shown as #/28/brand-k) at boot and at runtime | Register the public alias: show(k) keeps #/28/brand-k during the dispatch, then setTimeout(0) → replaceState #/29/brand-k; hashchange accepts both forms; rail link href #/29/brand-1; tryDeep tolerates the alias; qa hashFor(46–48) = #/29/brand-k | **fixed** (1.7.3) |
| A-17 | P2 | 46,47,48 | en,ar | both | 2.5.8 Target Size | Touch targets | No change (Close raised to 48 px under A-03; tile picture buttons ≥ 44 px asserted in qa/v173) | **verified-no-change** |
| A-18 | P2 | 46,47,48 | en,ar | both | fonts | document.fonts.check 500 16px "IBM Plex Sans" and "IBM Plex Sans Arabic" | No change | **verified-no-change** |
| A-19 | P2 | 46,47,48 | en,ar | both | runtime errors | Console errors / failed requests | No change | **verified-no-change** |
| A-20 | P2 | 45→46 | en,ar | both | navigation | Navigator shows "10 · Brand" after Section 09 with Lorenzo on 45; counter n of 48; footer v1.7.2 | No change (footer becomes v1.7.3) | **verified-no-change** |
| A-21 | P2 | 46,47,48 | en,ar | 1440x900 | Lighthouse 12 (desktop emulation) | Lighthouse baseline | Target after fixes: accessibility ≥ 95 on 46/47/48 (baseline 100/100/99); td-has-header + aria-allowed-role fixed by A-10/A-04; label-content-name-mismatch on the tiles fixed by A-04 (deck-chrome instances → D-01) | **verified-no-change** |
| A-22 | P2 | 46,47,48 | en,ar | both | spacing parity with 38–45 | Header/body geometry parity | No change | **verified-no-change** |

## Evidence per finding

### A-01 — Scrollable slide bodies are not keyboard-focusable

- Root cause: dist/js/brand-section.js body(): the dense reference body gets overflow-y:auto (brand-section.css .br-slide .s-body.br-body) but no tabindex/role
- axe: scrollable-region-focusable · serious · 1 node per slide (`.s-body.br-body`) on 47 desktop EN/AR, 46/47/48 phone EN/AR; `#s-brand-foundations` on phone
- measured: `{"47 EN 1440x900 body": "807/744 px", "47 AR 1440x900": "862/744", "46 EN 1440x900": "754/744", "48 EN 1440x900": "771/744", "phone": "1650–4053 px of 622"}`
- screenshots: `["before-slide-47-en-1440x900.png", "before-slide-47-en-390x844.png", "before-slide-47-ar-1440x900.png", "before-slide-47-ar-390x844.png"]`
- Verification: pending public run

### A-02 — Lightbox dialog has no accessible name tied to its content (no aria-labelledby; inherits "Enlarge")

- Root cause: brand-section.js expandFig(): sets role/aria-modal only; the figure keeps aria-label="Enlarge" from galleryTile()
- measured: opened dialog: role=dialog ✓ aria-modal=true ✓ aria-labelledby=null ✗ aria-label="Enlarge"/"تكبير" (the tile's button label) — a screen reader announces "Enlarge, dialog"
- screenshots: `["before-slide-48-lightbox-en-1440x900.png", "before-slide-48-lightbox-ar-1440x900.png", "before-slide-48-lightbox-en-390x844.png", "before-slide-48-lightbox-ar-390x844.png"]`
- Verification: pending public run

### A-03 — Lightbox Close control is 40 x 40 CSS px

- Root cause: brand-section.css .br-lb-close inline-size/block-size 40px (fixed) / 36px (in-flow fallback)
- measured: `.br-lb-close` 40x40 at (1386,14) EN / (14,14) AR desktop; 40x40 at (336,14) phone
- Verification: pending public run

### A-04 — Tiles are figure[role=button] (role not allowed on figure); the expanded figure takes role=dialog (also not allowed); visible caption text not part of the accessible name

- Root cause: brand-section.js galleryTile()/personasPanel(): <figure role=button tabindex=0 aria-label=Enlarge>
- axe: aria-allowed-role · minor · 11 nodes (figure.br-tile--board + 10 figure.br-tile)
- lighthouse: label-content-name-mismatch flags the 11 tiles (aria-label "Enlarge" vs visible caption)
- Verification: pending public run

### A-05 — Tile source lines are cut: unbreakable file name overflows horizontally and the 2-line clamp hides the rest

- Root cause: brand-section.css .br-tile-src{overflow:hidden;-webkit-line-clamp:2} without overflow-wrap; tokens like Athar_Wireframes_and_Screens_v1.pdf cannot break
- measured: `.br-tile-src` scrollWidth 177–189 > clientWidth 153 (clipsX) on the four wireframe/screen tiles; scrollHeight 39–75 vs clientHeight 26–30 (2-line clamp) on 9/10 tiles EN and 10/10 AR
- screenshots: `["before-slide-48-en-1440x900.png", "before-slide-48-en-390x844.png", "before-slide-48-ar-1440x900.png", "before-slide-48-ar-390x844.png"]`
- Verification: pending public run

### A-06 — Arabic kicker and chapter number rendered with letter-spacing in the AR deck

- Root cause: deck header CSS (.s-kicker letter-spacing .12em uppercase) has no html[lang=ar] override; brand-section.css only reset its own classes
- measured: `.s-kicker` letter-spacing 1.60 px, `.chapter-n` 1.37 px on 46/47/48 AR (deck header style; 38–45 share it)
- Verification: pending public run

### A-07 — Slide 47 reuses the v1.7.1 typography clip NAR-s47 (cue anchors s46-*), written before the v1.7.2 re-cut; it does not mention the primary IBM Plex Sans Medium / IBM Plex Sans Arabic Medium pairing now on the slide; AR Scribe WER 0.283

- Root cause: dist/narration/slide-narration.json row 47 re-homed from v1.7.1 slide 46; brand.json narration.clips
- measured: N toggles DID play NAR-s47 / NAR-s47-ar on 47 (audible 3.4 s after keypress) — the clip was present, not missing; content drift + weak AR check are the findings
- before: `{"en": "NAR-s47 28.68 s WER 0.000", "ar": "NAR-s47-ar 31.19 s WER 0.283"}`
- Verification: local: NAR-s52 34.69 s (EN, WER 0.000, 79/79 words) · NAR-s52-ar 37.64 s (AR raw WER 0.324 → 0.015 with the Latin font names normalised, 67/67 words); N toggles → data-state=playing, audible NAR-s52(.ar).mp3 on 47 EN/AR

### A-08 — Laptop + phone render: identifiable Riyadh/Kingdom-Centre skyline behind the glass (conflicts with the UAE narrative — flagged for the editImage step, which produced ohVo7cVcwn.png); the v1.7.2 composite set the horizontal lockup at 81 px wide on the phone header — below the 160 px digital minimum

- Root cause: scripts/v1.7.2/build_brand_assets.py render(): index-based detected zones, 0.72 x zone width → 81 px lockup
- before: render-laptop-phone-dashboard set from GqSmsmQEOF.png (sha 70442001…), lockup 81 x 17 px at (398,374) on a 1536 x 1024 render
- edited render: ohVo7cVcwn.png 1536 x 1024, sha256 46a9f70191cade82ebb48d37cdc057a118b883379b3509a9eec8b673dc79e9f6; 5.5 % of pixels changed (skyline), devices/desk unchanged
- flat-zone analysis: no flat dark zone ≥ 160 x 38 px on either screen; phone screen flat area x 382–495 · y 527–666 (lum ≈ 16)
- Verification: local: files gallery/render-laptop-phone-dashboard@2x.76dd14ac83.webp · @1x.74893cb52a.webp · .9840e43bdd.jpg; --verify → reproducible (3/3 sha256 match)

### A-09 — Density descriptors inexact: 1x candidates are 800 px wide while 2x candidates are 1536 px (renders) / 1600 px (wireframes); `<img srcset>` repeats the JPEG without a descriptor

- Root cause: brand-section.js picture()
- measured: <source type=image/webp srcset="…@1x 1x, …@2x 2x"> on 9 sets; img width/height attrs 1536x1024 / 1600x1131 (2x intrinsic); currentSrc = @1x at DPR 1 ✓; JPEG fallback ✓; type attribute ✓
- Verification: pending public run

### A-10 — Minimum-size table: empty first header cell, no scope attributes

- Root cause: brand-section.js minSizes(): ["", print, digital] headers
- axe: empty-table-header · minor · 1 (`.br-table--min > tr:nth-child(1) > th:nth-child(1)`)
- lighthouse: td-has-header fails on 46
- Verification: pending public run

### A-11 — Header and clear-space marks reported "incomplete" by axe (background image behind the header) — manual measurement required

- Root cause: axe cannot resolve the composited backdrop; the measured ratios pass
- measured: `{"chapter-n": "9.88:1 (#1e3a5f on #f3ede4)", "s-kicker": "9.88:1", "h2": "13.3:1", "clear-space x marks": "12.11:1 (#192e3c on #f2eee5)", "min text pair on 46": "6.92:1 (#4d5c65 on #ffffff)", "47": "5.61:1 (fonts-state chip #f2eee5 on #1b6b43)", "48": "5.95:1 (.br-tile-src #4d5c65 on #f3ede4)", "pairs measured": "77 / 85 / 59 per slide, 0 failures in all 12 slide×locale×viewport combinations"}`
- Verification: pending public run

### A-12 — Two extra swatches #405A5B / #BEAA91 shown under "Moodboard accents" next to the five v1.0 tokens — are they in the guidelines?

- Root cause: brand.json colourSystem.accents role text; brand-section.js T.found.accents
- guidelines check: Athar_Brand_Guidelines_FINAL.pdf (sha 8883b4c5…, 310 pp.) p. 30 Table 3.1 "The five colours": "Deep Ocean and Ivory lead; Emerald and Sand are secondary; Champagne Gold is the accent" — Emerald #405A5B, Sand #BEAA91; tokens pp. 33–34: brand.emerald #405A5B, brand.sand #BEAA91, text.secondary, action.secondary.*; also pp. 7, 141; v3 cross-check (cd826c2d…) pp. 6, 30, 33–34, 142
- before: row heading "Moodboard accents"; hex from brand-tokens.json palette by name ✓
- Verification: pending public run

### A-13 — Slide bodies overflow a 744 px viewport by a few pixels (46 EN 754, 48 EN 771; 47 EN 807 / AR 862)

- Root cause: brand-section.css vertical rhythm tuned for ≥ 940 px viewports
- measured: scrollHeight/clientHeight above; 46 AR and 48 AR fit (744/744)
- Verification: pending public run

### A-14 — Dialog caption keeps a 3-line clamp (long source strings truncated)

- Root cause: brand-section.css
- measured: `.br-tile.is-lightbox .br-tile-src{-webkit-line-clamp:3}`
- Verification: pending public run

### A-15 — Phone lightbox: image 374 x 249 in an 844 px viewport, caption centred, Close at inline-end (left in AR) — acceptable; swipe-to-close not implemented

- Root cause: —
- measured: rect 390x844, img 374x249, close (336,14) EN / (14,14) AR
- Verification: pending public run

### A-16 — #/29/brand-1…3 aliases normalise away from the address bar (shown as #/28/brand-k) at boot and at runtime

- Root cause: brand-section.js normaliseAlias() + show() setHash(#/28/brand-k)
- measured: `{"#/29/brand-1 → hash": "#/28/brand-1 (slide 46 ✓)", "runtime location.hash=#/29/brand-3": "#/28/brand-3 (48 ✓)", "router": "compiled bundle Pd() = /^#\\/(\\d{1,2})/ → index for 1..28, else 0 (cover): a bare #/29 reaching the router sends the deck to the cover"}`
- risk: LOW when done as replaceState AFTER the hashchange dispatch (no event → the router never sees #/29); reloads use the pre-boot alias in index.html; #/28/brand-k and #slide-46…48 unaffected
- Verification: pending public run

### A-17 — Touch targets

- Root cause: —
- Evidence: verified: Section 10 tiles 153 x ≈140 px desktop / 326–352 px wide phone; deck controls (arrows, lang toggle, overview, guide bar) ≥ 44 px; slide 45 footer source links 111 x 13 (inline-link exception, out of scope)
- Verification: pending public run

### A-18 — document.fonts.check 500 16px "IBM Plex Sans" and "IBM Plex Sans Arabic"

- Root cause: —
- Evidence: verified true in all 12 combinations; section data-fonts=loaded
- Verification: pending public run

### A-19 — Console errors / failed requests

- Root cause: —
- Evidence: verified 0 / 0 in all 20 slide loads (38, 45, 46, 47, 48 × EN/AR × 2 viewports)
- Verification: pending public run

### A-20 — Navigator shows "10 · Brand" after Section 09 with Lorenzo on 45; counter n of 48; footer v1.7.2

- Root cause: —
- Evidence: verified: rail 01…10 ("10Brand"), slide 45 = s-exec-lorenzo, counter "Slide 46 of 48", footer v1.7.2; keyboard 45 → 46 → 45 ✓
- Verification: pending public run

### A-21 — Lighthouse baseline

- Root cause: —
- scores: `{"46-ar": {"accessibility": 100, "bestPractices": 100, "performance": 3, "LCP": "35.3 s", "CLS": "0.975", "TBT": "3,500 ms", "failingA11yAudits": ["label-content-name-mismatch", "td-has-header"]}, "46-en": {"accessibility": 100, "bestPractices": 100, "performance": 29, "LCP": "34.7 s", "CLS": "0.005", "TBT": "2,220 ms", "failingA11yAudits": ["label-content-name-mismatch", "td-has-header"]}, "47-ar": {"accessibility": 100, "bestPractices": 100, "performance": 4, "LCP": "31.7 s", "CLS": "0.975", "TBT": "3,380 ms", "failingA11yAudits": ["label-content-name-mismatch"]}, "47-en": {"accessibility": `
- Verification: pending public run

### A-22 — Header/body geometry parity

- Root cause: —
- Evidence: verified: .s-head top 75 / left 45, h2 33.12/39.744 px, body gap 11.7 px, body top 64, section padding 68/48/48/32 identical to slides 38 and 45 (desktop); phone 74/16, 24/28.8 identical; only Section 10 differences are by design (Cormorant display h2, 4 px inline-end padding for the scrollbar)
- Verification: pending public run

## Deferred / out of scope

| ID | Pri | Scope | Item | Status | Reason |
|---|---|---|---|---|---|
| D-01 | P2 | deck chrome (all slides) | Lighthouse label-content-name-mismatch on button.lang-toggle (AR: visible "EN" vs aria-label), button.intro-replay (EN), button.gbar-auto (narration bar) | deferred | outside Section 10 — lang toggle lives in the compiled React bundle; intro-gate.js / narration.js chrome shared by all 48 slides; a deck-wide copy change needs its own review |
| D-02 | P2 | deck header (slides 38–45 and the real slides) | Arabic kicker letter-spacing in the deck-wide header style (.s-kicker .12em) | deferred | fixed for Section 10 (A-06); the shared header CSS belongs to the bundle stylesheet — deck-wide change out of scope for this release |
| D-03 | P2 | 48 lightbox (mobile) | Swipe-to-close gesture | won't-fix | not a WCAG requirement; Esc, Close (48 px) and tapping the picture close the dialog; adding touch-gesture handling risks conflicts with the deck's swipe navigation |
| D-04 | P1 | AR deck boot (all slides) | Core Web Vitals: CLS ≈ 0.98 and Lighthouse performance 3–4 on EVERY AR slide (38, 45, 46, 47, 48 measured); EN CLS 0.005 — the LTR→RTL flip after boot shifts the whole layout | deferred | pre-existing and deck-wide (reproduced on slides 38 and 45 AR, identical numbers), not Section 10; the fix is a pre-boot dir/lang on <html> in index.html — affects all 48 slides and the intro gate, so it needs a dedicated change + full AR visual regression |
| D-05 | P2 | all slides | Lighthouse performance 28–29 EN (LCP ≈ 35 s simulated, TBT 2.2–3.9 s): LCP element on 46–48 is the Section 10 backdrop tile; deck JS bundle + media weight | deferred | simulated slow-4G throttling of a media-heavy deck; no performance threshold in this release; a targeted follow-up (backdrop image-set for small viewports, bundle splitting) is recommended |
| D-06 | P2 | slide 38 | Lighthouse accessibility 92 (EN) on slide 38: aria-allowed-attr + color-contrast in athar-os.js | deferred | Section 08 module, outside the Section 10 audit scope |

## render_edits

- `GqSmsmQEOF.png (render-laptop-phone.png)` — identifiable Riyadh/Kingdom-Centre skyline behind the glass; composited lockup below the 160 px minimum → replace the skyline with a neutral, non-identifiable Abu Dhabi/UAE-style waterfront (done upstream → ohVo7cVcwn.png 1536x1024, sha 46a9f701…); re-composite with the أثر monogram at a pinned position (A-08) — applied in 1.7.3

## Lighthouse 12 baseline (desktop 1440×900, v1.7.2)

| Slide | Accessibility | Best practices | Performance | LCP | CLS | TBT | Failing a11y audits |
|---|---|---|---|---|---|---|---|
| 46-ar | 100 | 100 | 3 | 35.3 s | 0.975 | 3,500 ms | label-content-name-mismatch, td-has-header |
| 46-en | 100 | 100 | 29 | 34.7 s | 0.005 | 2,220 ms | label-content-name-mismatch, td-has-header |
| 47-ar | 100 | 100 | 4 | 31.7 s | 0.975 | 3,380 ms | label-content-name-mismatch |
| 47-en | 100 | 100 | 28 | 36.0 s | 0.005 | 2,540 ms | label-content-name-mismatch |
| 48-ar | 99 | 100 | 4 | 34.1 s | 0.975 | 3,870 ms | aria-allowed-role, label-content-name-mismatch |
| 48-en | 99 | 100 | 28 | 35.8 s | 0.005 | 2,500 ms | aria-allowed-role, label-content-name-mismatch |

## axe-core 4.13 baseline (active section)

| Slide · locale · viewport | Violations (id · impact · nodes) |
|---|---|
| 46 en 1440x900 | empty-table-header · minor · 1 |
| 46 en 390x844 | empty-table-header · minor · 1, scrollable-region-focusable · serious · 1 |
| 46 ar 1440x900 | empty-table-header · minor · 1 |
| 46 ar 390x844 | empty-table-header · minor · 1, scrollable-region-focusable · serious · 1 |
| 47 en 1440x900 | scrollable-region-focusable · serious · 1 |
| 47 en 390x844 | scrollable-region-focusable · serious · 1 |
| 47 ar 1440x900 | scrollable-region-focusable · serious · 1 |
| 47 ar 390x844 | scrollable-region-focusable · serious · 1 |
| 48 en 1440x900 | aria-allowed-role · minor · 11 |
| 48 en 390x844 | aria-allowed-role · minor · 11 |
| 48 ar 1440x900 | aria-allowed-role · minor · 11 |
| 48 ar 390x844 | aria-allowed-role · minor · 11 |

## Minimum measured text contrast per combination (v1.7.2)

46 en 1440x900: 6.92:1 · 46 en 390x844: 6.92:1 · 46 ar 1440x900: 6.92:1 · 46 ar 390x844: 6.92:1 · 47 en 1440x900: 5.61:1 · 47 en 390x844: 5.61:1 · 47 ar 1440x900: 5.61:1 · 47 ar 390x844: 5.61:1 · 48 en 1440x900: 5.95:1 · 48 en 390x844: 5.95:1 · 48 ar 1440x900: 5.95:1 · 48 ar 390x844: 5.95:1

## Routes baseline

`#/29/brand-1` → `#/28/brand-1` (slide 46) · `#/29/brand-2` → `#/28/brand-2` (slide 47) · `#/29/brand-3` → `#/28/brand-3` (slide 48) · `#/28/brand-1` → `#/28/brand-1` (slide 46) · `#/28/brand-3` → `#/28/brand-3` (slide 48) · `#slide-46` → `#/28/brand-1` (slide 46) · `#slide-47` → `#/28/brand-2` (slide 47) · `#slide-48` → `#/28/brand-3` (slide 48) · `#/27/new-5` → `#/27/new-5` (slide 32) · `#/27/new-11` → `#/27/new-11` (slide 38) · `#/28` → `#/28` (slide 39) · `#/28/exec-1` → `#/28/exec-1` (slide 40) · `#/28/exec-6` → `#/28/exec-6` (slide 45) · `#/27/new-1` → `#/27/new-1` (slide 28) · `#/1` → `#/01` (slide 1) · `#/27` → `#/27` (slide 27) · `#/12` → `#/12` (slide 12) · `#/28/exec-7` → `#/28/exec-6` (slide 45)

## Narration baseline (N key, autoplay allowed)

46 en: NAR-s50-s-brand-foundations.mp3 (playing) · 47 en: NAR-s47-s-brand-typography.mp3 (playing) · 48 en: NAR-s51-s-brand-gallery.mp3 (playing) · 46 ar: NAR-s50-s-brand-foundations.ar.mp3 (playing) · 47 ar: NAR-s47-s-brand-typography.ar.mp3 (playing) · 48 ar: NAR-s51-s-brand-gallery.ar.mp3 (playing)

