# Athar Open Agentic Pact deck — v1.5.2 (2026-09-30)
Serve: `node serve.mjs dist` (PORT=3000) → http://localhost:3000/?lang=en|ar · deep links #/N (1–27), #/27/new-K (28–38), #/28 (closing 39) · ?intro=1 replays the intro film.
Narrated guide: player bottom-right (N toggles play); manifest/scripts in dist/narration/; audio in dist/audio/.
QA: `cd qa && npm install && node qa-gate.mjs http://127.0.0.1:3000 out --shots` (156 renders → out/qa-report.json); `node shots.mjs <url> out` for the deliverable renders + fix assertions.
See CHANGELOG.md → v1.5.2 for every change with file path, section and UTC timestamp.

## Close-out 2026-09-30 (v1.5.2)
Guide Mode: bottom-right player on every slide — **Guide** toggle (or key `N`) starts George's section narration; one clip per section (Welcome, 01–08, Join), map in `dist/narration/clip-map.json`, audio in `dist/audio/guide/`. Slide 32 carries the Redington signing photograph (Gulf News, 22 Jul 2026; provenance in `dist/assets/news/credits.json`). Slide 21's trademark line sits on its own strip. Deploy as a static site: `dist/` is prebuilt — no build step (see `vercel.json`); for a Git-linked Vercel project set *Root Directory* to this folder.
