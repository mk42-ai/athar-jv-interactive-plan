# Feature `execFilms` — Section 09 executive films (v1.6.1; v1.5.9 base)

**State in v1.5.9: ON** (`pact-deck/features.json` → `"execFilms": true`; replaces v1.5.7's `originsFilm`, which was OFF in v1.5.7 and v1.5.8).

Every Section 09 card (slides 41–44) carries **one film slot**. A card whose film is verified renders the shared press-to-play player
(`dist/js/exec-film-player.js` + `dist/assets/exec-film-player.css`); a card without a verified film renders the labelled **"Film coming soon / قريباً"**
ready slot (never a broken player). Swapping a slot for a film is a `films.json` entry + the files — not a code change.

| Card | Slide | Requested file | Found? | Shipped |
|---|---|---|---|---|
| H.E. Fahad Mohamed Al Ameri | 41 | `ATHAR_EP01_FahadAlAmeri_1080p_subtitled_v1 (1).mp4` | **yes** — supplied from the file library 2026-10-03 (v1.6.0) | **yes** — `assets/al-ameri/` (1080p remux, 720p, poster 00:07.0, EN/AR VTT; burned-in EN subtitles per the file name) |
| Ary Ferreira da Cunha | 42 | `ary_origins_1080p_FINAL_v1.mp4` | **yes** — supplied from the file library 2026-10-03 (v1.6.0) | **yes** — `assets/ferreira-da-cunha/` (1080p byte-identical remux, 720p, poster 00:04.0, EN/AR VTT; burned-in subtitles unknown) |
| Muhammed Khalid | 43 (v1.6.2: the ~50 s cut installed, full length) | `athar-origins-of-impact-ep01-muhammed-khalid_1080p_60MB.mp4` (library ids 6ac1b28a… / 6ac1b277…, byte-identical, uploaded 2026-10-04T01:57Z) | **yes** — supplied 2026-10-04 (v1.6.2) | **yes** — `assets/khalid/` (1080p faststart remux, 720p transcode, poster 00:18.8, EN/AR VTT; 50.000 s, sha256 288c67b2…c5d1) |
| Lorenzo Avitabile | 45 (v1.6.4: fifth card, after Kayaan Unwalla — end of section) | `lorenzo-origins-of-impact_4K-master_v1.mp4` (library id 6ac1d81a…, uploaded 2026-10-04T04:37:45Z) | **yes** — supplied 2026-10-04 (v1.6.4) | **yes** — `assets/lorenzo/` (1080p lorenzo-1080p.1566f3861a.mp4 · 720p lorenzo-720p.1b56c492fc.mp4 · poster 00:14.708 · EN/AR VTT) |
| Kayaan K. Unwalla | 44 | `athar-origins-of-impact_4K-master_v2.mp4` (4K master, library id 6ac1289e…) | **yes** — supplied 2026-10-03 (v1.6.1) | **yes** — `assets/unwalla/` (1080p + 720p from the 4K master, poster 00:20.0, EN/AR VTT) |

## Files

```
features/exec-films/
├── films.json                 ← the manifest (source of truth for the build, dist/build-info.json and the QA suite)
├── assets/khalid/
│   ├── athar-origins-of-impact-ep01-muhammed-khalid-1080p.288c67b22b.mp4   1920×1080 24 fps H.264 High 8.87 Mb/s + AAC-LC 48 kHz st, faststart remux of the delivered 50 s cut, 50.000 s, 56,677,908 B, sha256 288c67b2…c5d1 (v1.6.2)
│   ├── athar-origins-of-impact-ep01-muhammed-khalid-720p.f824472ae0.mp4    1280×720 transcode (libx264 High@4.0 crf 23, AAC 128k, +faststart), 7,843,290 B, sha256 f824472a…318d — viewports ≤ 720 px / Save-Data (v1.6.2)
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

**v1.6.2 (50 s cut):** `00:18.800` — the sharpest single-face frame (YuNet face detection + Laplacian sharpness over a 24 fps scan of 17.70–19.08 s) inside the 17.95–19.03 s window where the burned-in-subtitle band is empty (bottom-band white-on-dark text score 0.00). Files `athar-origins-of-impact-ep01-muhammed-khalid-poster-18s8.{jpg,webp}`; captions `athar-origins-of-impact-ep01-muhammed-khalid.{en,ar}.vtt` (11 cues, EN from On Demand speech-to-text, AR hand-translated). The film is installed full length (50.000 s): its last 7 s are a bright closing card with the narration still running to 49.1 s — not the dark end card trimmed in v1.5.6 — so nothing was cut. The v1.5.9–v1.6.1 files below are retired (not in `assets/`, `dist/` or `SHA256SUMS.txt`).

*v1.5.9–v1.6.1 (37.333 s trim, retired):* `00:09.100`: the only caption-free window in the transcript (between cues c03 08.800 → c04 09.400; the film carries burned-in English subtitles everywhere
else). The film has **no frame that is guaranteed free of its own title typography** — the frame was chosen by transcript timing + pixel heuristics, not by
eye. It replaces the v1.5.6 poster at 00:15.5, which showed the name title card under a burned-in caption (the "frozen title card" complaint).

## Adding a film later (one entry)

1. Drop `…-1080p.mp4` (+ optional `…-720p.mp4`), the poster and the EN/AR `.vtt` files into `assets/<person>/`.
2. In `films.json` fill the entry (sha256 of each file, `durationSec`, `durationLabel`, `posterTimeSec`, `w/h`, `outPt`) and set `"status": "shipped"`.
3. `node pact-deck/scripts/vercel-build.mjs` — the gate verifies the hashes and the WebVTT headers; commit `dist/`, `SHA256SUMS.txt` and `films.json`.
4. QA: `GUIDE_BASE=… npx playwright test -c qa/v159/playwright.config.mjs` (desktop + phone, EN + AR).

## Content-hashed filenames (v1.6.2)

Every served Khalid file is named `<name>.<first 10 hex of its own sha256>.<ext>` (`films.json` → `films.khalid.hashedFilenames.map`). The URL therefore changes whenever the bytes change, so neither a CDN nor a browser cache can keep serving an older Khalid film, poster or caption file under the same path; `serve.mjs` and `vercel.json` serve these hashed files with `Cache-Control: public, max-age=31536000, immutable`, while `/`, `/index.html`, `/build-info.json` and `/js/exec-films.js` (the generated manifest) are `no-store`. The other three films keep their v1.6.0/v1.6.1 names (unchanged bytes).
