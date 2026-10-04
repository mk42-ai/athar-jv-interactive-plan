# Feature `execFilms` — Section 09 executive films (v1.6.1; v1.5.9 base)

**State in v1.5.9: ON** (`pact-deck/features.json` → `"execFilms": true`; replaces v1.5.7's `originsFilm`, which was OFF in v1.5.7 and v1.5.8).

Every Section 09 card (slides 41–44) carries **one film slot**. A card whose film is verified renders the shared press-to-play player
(`dist/js/exec-film-player.js` + `dist/assets/exec-film-player.css`); a card without a verified film renders the labelled **"Film coming soon / قريباً"**
ready slot (never a broken player). Swapping a slot for a film is a `films.json` entry + the files — not a code change.

| Card | Slide | Requested file | Found? | Shipped |
|---|---|---|---|---|
| H.E. Fahad Mohamed Al Ameri | 41 | `ATHAR_EP01_FahadAlAmeri_1080p_subtitled_v1 (1).mp4` | **yes** — supplied from the file library 2026-10-03 (v1.6.0) | **yes** — `assets/al-ameri/` (1080p remux, 720p, poster 00:07.0, EN/AR VTT; burned-in EN subtitles per the file name) |
| Ary Ferreira da Cunha | 42 | `ary_origins_1080p_FINAL_v1.mp4` | **yes** — supplied from the file library 2026-10-03 (v1.6.0) | **yes** — `assets/ferreira-da-cunha/` (1080p byte-identical remux, 720p, poster 00:04.0, EN/AR VTT; burned-in subtitles unknown) |
| Muhammed Khalid | 43 (v1.6.0: retained unchanged — still no `_v2`; a 4K master v2 exists in the library but is not used) | `athar-origins-of-impact-ep01-muhammed-khalid_1080p_subtitled_v2.mp4` (~109 MB) | **no** — the `_v2` does not exist anywhere searched; the media library holds the non-v2 master `…_1080p_subtitled.mp4` (id `6abe166ad64782b8259834dc`, 40.000 s, sha256 `c7c20005…3ab2a`) | **yes** — the master's v1.5.6 trim (end card removed at 37.333 s), see below |
| Kayaan K. Unwalla | 44 | `athar-origins-of-impact_4K-master_v2.mp4` (4K master, library id 6ac1289e…) | **yes** — supplied 2026-10-03 (v1.6.1) | **yes** — `assets/unwalla/` (1080p + 720p from the 4K master, poster 00:20.0, EN/AR VTT) |

## Files

```
features/exec-films/
├── films.json                 ← the manifest (source of truth for the build, dist/build-info.json and the QA suite)
├── assets/khalid/
│   ├── athar-origins-of-impact-ep01-muhammed-khalid-1080p.mp4   1920×1080 24 fps H.264 High 9.45 Mb/s + AAC-LC 48 kHz st, faststart, 37.333 s, 45,357,475 B, sha256 f71b761b…6048 — the 1080p source (shipped as-is: already web-ready, no re-encode)
│   ├── athar-origins-of-impact-ep01-muhammed-khalid-720p.mp4    1280×720 transcode (libx264 High@4.0 crf 23, AAC 128k, +faststart), 6,442,036 B, sha256 e8638ddc…acf3 — viewports ≤ 720 px / Save-Data
│   ├── athar-origins-of-impact-ep01-poster-09s1.jpg / .webp     poster frame at 00:09.100 (1280×720)
│   └── athar-origins-of-impact-ep01.en.vtt / .ar.vtt            WebVTT captions, 12 cues each (EN from the burned-in subtitles, AR translation), cues at line:6%
└── sources/khalid/SOURCE.md   ← provenance of the master (not committed: 89 MB) and of the trim
```

Build (`scripts/v1.4.7/build.mjs`, run by `scripts/vercel-build.mjs`): validates every shipped entry (files present, sha256 as in `films.json`, captions are
WebVTT), copies `assets/<person>/` → `dist/assets/exec/films/<person>/`, **generates** `dist/js/exec-films.js` (`window.AtharExecFilms`, absolute dist paths)
and injects `<script src="/js/exec-films.js" data-v159="exec-films">` before `exec-team.js`; `dist/build-info.json` lists every film (status, file, sha256,
bytes, duration, poster timestamp, captions). Flag OFF → the generated file, the film folders and the tag are removed and the v1.5.7 "no film string served" gate runs.

## Player contract (shared with the intro gate)

- **Press-to-play only** — no `autoplay`, no muted auto-start, no programmatic `play()` on slide enter or narration events. Poster + one centred gold
  Play button (+ duration); native controls appear on the first play and the custom overlay is removed, so nothing sits on top of the `<video>` while it plays.
- Captions EN + AR as `<track kind="subtitles">`; the default track follows the deck language (`html[lang]`).
- `data-narration-pause`: the narrated guide pauses on `play` and resumes on `pause` and on `ended` (`dist/js/narration.js`).
- 1080p by default, the 720p transcode for viewports ≤ 720 px or Save-Data; fixed 16:9 box (`aspect-ratio`) → no layout shift; RTL-safe (logical
  properties, `dir`/`lang` on the figure, the video itself never mirrored); keyboard: Tab → Enter / Space.
- Layout (v1.6.0): a card profile WITH a film (Fahad · Ary) renders the player in the side column above the profile card — the same size and position as the
  CEO slide's player beside the letter; a card profile without a film (Kayaan) keeps the ready slot beside the monogram roundel. Desktop side by side, phone stacked.

## Poster frame — Khalid

`00:09.100`: the only caption-free window in the transcript (between cues c03 08.800 → c04 09.400; the film carries burned-in English subtitles everywhere
else). The film has **no frame that is guaranteed free of its own title typography** — the frame was chosen by transcript timing + pixel heuristics, not by
eye. It replaces the v1.5.6 poster at 00:15.5, which showed the name title card under a burned-in caption (the "frozen title card" complaint).

## Adding a film later (one entry)

1. Drop `…-1080p.mp4` (+ optional `…-720p.mp4`), the poster and the EN/AR `.vtt` files into `assets/<person>/`.
2. In `films.json` fill the entry (sha256 of each file, `durationSec`, `durationLabel`, `posterTimeSec`, `w/h`, `outPt`) and set `"status": "shipped"`.
3. `node pact-deck/scripts/vercel-build.mjs` — the gate verifies the hashes and the WebVTT headers; commit `dist/`, `SHA256SUMS.txt` and `films.json`.
4. QA: `GUIDE_BASE=… npx playwright test -c qa/v159/playwright.config.mjs` (desktop + phone, EN + AR).
