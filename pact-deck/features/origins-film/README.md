# Optional feature: `originsFilm` — "Athar — Origins of Impact, Episode 01: Muhammed Khalid"

**State in v1.5.7: OFF (not shipped).** The film, its poster and its EN/AR WebVTT captions are kept here, in the repo, but are **not** part of `dist/` while
`pact-deck/features.json` says `"originsFilm": false`. Nothing about the film (names, paths, captions, "the narrated guide pauses while the film plays" note) is served.

| File | What it is |
|---|---|
| `assets/athar-origins-of-impact-ep01-muhammed-khalid-1080p.mp4` | 1920×1080 H.264 High + AAC, faststart, burned-in English subtitles, **37.333 s** — the 40 s master cut at the closing end card (frame 896). sha256 `f71b761b…6048` |
| `assets/athar-origins-of-impact-ep01-poster-15s5.jpg` | poster frame at 00:15.5 |
| `assets/athar-origins-of-impact-ep01.en.vtt`, `…ar.vtt` | captions (cue c12 clipped to "Athar." / «أثر.», out-point 37.300 s) |
| `exec-film.js` | defines `window.AtharExecFilm` (paths, in/out points, strings EN/AR, the extra letter paragraph) which `dist/js/exec-team.js` reads |

## Re-enable
1. Set `"originsFilm": true` in `pact-deck/features.json`.
2. `node pact-deck/scripts/vercel-build.mjs` — the build copies `exec-film.js` → `dist/js/exec-film.js`, `assets/*` → `dist/assets/exec/video/`, injects
   `<script src="/js/exec-film.js" data-v157="origins-film">` before `exec-team.js` in `dist/index.html`, adds the files to the required-asset gate and regenerates `SHA256SUMS.txt` / `build-info.json`.
   The CEO letter then renders in the two-block layout again (letter + film, captions EN/AR, the guide pauses while the film plays and resumes after it). Commit `dist/` and `SHA256SUMS.txt` (the Vercel build repeats the same sync).
3. **Narration:** the CEO clip `NAR-s43` was trimmed in v1.5.7 to drop its last sentence ("Press play to watch his Athar impact story.") because there is no film. To bring the sentence back restore the untrimmed clip and table entry from `3b625be`:
   `git show 3b625be:pact-deck/dist/audio/guide/slides/NAR-s43-s-exec-khalid.mp3 > pact-deck/dist/audio/guide/slides/NAR-s43-s-exec-khalid.mp3` and the `s-exec-khalid` entry (text, 4th cue, `durationSec` 20.92, `bytes`, `sha256`) of `dist/narration/slide-narration.json`; then rebuild.
4. QA: with the flag on, `qa/v155/guide-sync-all.spec.mjs` runs the film pause/resume test automatically and the v1.5.7 regression test only checks that the film is present.

Turning the flag off again (and rebuilding) removes the files and the script tag from `dist/` and the build gate proves no film string is served.
