# Muhammed Khalid — "Athar — Origins of Impact, Episode 01": source provenance

## v1.6.2 (2026-10-04) — the ~50 s cut, INSTALLED

**Delivered:** `athar-origins-of-impact-ep01-muhammed-khalid_1080p_60MB.mp4`, uploaded to the session media library twice on 2026-10-04 (A: id `6ac1b28a1899bfd8cf0ffd67`, blob `…_60MB_d561.mp4`, 01:57:29Z; B: id `6ac1b2771899bfd8cf0ffd66`, blob `…_60MB_lf5f.mp4`, 01:57:09Z). Both downloaded 2026-10-04T02:03–02:04Z; `cmp` → **byte-identical**.
- sha256 `d5c79e683be445b5e05d31987d8a1d5f2ca0737715c361d969c98c964dc8488a`, 56,677,901 B
- ffprobe (2026-10-04T02:04:01Z): video h264 High 1920×1080 24/1 fps, 1200 frames, **50.000 s**, 8,868,681 b/s; audio aac LC 48 kHz stereo 50.005 s 193,910 b/s; container 50.005 s, 9,067,557 b/s; no subtitle streams (English subtitles burned in)
- Gate: 45–55 s → **PASS** (the 40.000 s master `6abe166ad64782b8259834dc`, sha256 `c7c20005…3ab2a`, and its 37.333 s trim are explicitly NOT used any more)

**Installed (full length, no trim):** `assets/khalid/athar-origins-of-impact-ep01-muhammed-khalid-1080p.mp4` = faststart remux (`ffmpeg -c copy -movflags +faststart`; moov before mdat), 56,677,908 B, sha256 `288c67b22bbe38ede92aa4db345c2b0cde7a18d9f3d056d543b4dc1d2e3ac5d1`, 50.000 s. The last 7 s (43.0–50.0 s) are a bright static closing card (mean luma ≈ 238) over which the narration continues to 49.1 s; it is not the dark end card removed in v1.5.6 (mean luma ≈ 44), so the delivered and installed durations are both 50.000 s.
- 720p: `…-720p.mp4` (libx264 High@4.0 crf 23, AAC 128k, +faststart), 7,843,290 B, sha256 `f824472ae0b4c1674210e24e9f339742a78c8fda7c5175de69ac8668e42e318d`
- poster: `…-poster-18s8.{jpg,webp}` at **00:18.800** (`ffmpeg -ss 18.8 -frames:v 1 -vf scale=1280:720`), jpg sha256 `32839348…4155`, webp `aaa6152b…0fa5` — YuNet face + Laplacian sharpness inside the caption-free band window 17.95–19.03 s
- captions: `athar-origins-of-impact-ep01-muhammed-khalid.{en,ar}.vtt` (11 cues; EN On Demand speech-to-text 2026-10-04T02:06Z with proper nouns corrected, AR hand-translated; proportional timing over silencedetect spans), sha256 EN `4242fc2d…4d02`, AR `e11f3209…1b0f`
- retired from `assets/`, `dist/` and `SHA256SUMS.txt`: `…-1080p.mp4` (f71b761b…), `…-720p.mp4` (e8638ddc…), `…-poster-09s1.{jpg,webp}`, `athar-origins-of-impact-ep01.{en,ar}.vtt`

---

## v1.5.9 — v1.6.1 (historical)

**Requested:** `athar-origins-of-impact-ep01-muhammed-khalid_1080p_subtitled_v2.mp4` (~109.23 MB) — **not found** (2026-10-03): not in the On Demand media
library (Media API `GET /media/v1/public/file`, 2,244 items listed), not in the uploads index, not in this or any other session workspace, not in the prior-turn
artefacts, not in the v1.5.6 / v1.5.7 / v1.5.8 deployment zips, not in the repository history (`git log --all -- '*.mp4'`), and the blob-storage name probes
answered HTTP 409 (no public access) / 403 (SAS scoped to another blob).

**Master actually used (best verified file):** media-library item `athar-origins-of-impact-ep01-muhammed-khalid_1080p_subtitled.mp4`
- id `6abe166ad64782b8259834dc`, created 2026-10-01T08:14:32Z, `sizeBytes` 89,359,557, `video/mp4`
- downloaded 2026-10-03T12:50:59Z from the item's signed `sourceUrl` (HTTP 200, 89,359,557 bytes) — **sha256 `c7c200050a422d580426b9972e83335c0b0456d442df51c1604b482a3a43ab2a`**
  (byte-identical to `…_subtitled_ORIGINAL-backup.mp4` inside the v1.5.6 deployment zip `code-files-20261002-140938_v1.zip`, and the master named in the v1.5.6 notes)
- ffprobe: 40.000 s, 1920×1080, 24 fps, H.264 High 17.57 Mb/s, AAC-LC 48 kHz stereo 306 kb/s, `isom` faststart; **no subtitle streams** — the English captions are burned in
- not committed (89 MB; above GitHub's 50 MB soft limit, and dist/ already carries the trimmed 1080p below)

**Committed 1080p source** = the master's **v1.5.6 trim**: the closing end card removed at frame 896 / **37.333 s** (`assets/khalid/athar-origins-of-impact-ep01-muhammed-khalid-1080p.mp4`,
45,357,475 B, sha256 `f71b761b455fd329eb96d66de2c9bbf48bb6e69ab90a904b8146397f33ad6048`; 1920×1080 24 fps H.264 High 9.45 Mb/s + AAC-LC 48 kHz stereo, faststart).
It is byte-identical to `…_subtitled_trimmed.mp4` in the v1.5.6 zip and to the file shipped at `dist/assets/exec/video/` in v1.5.6 (`git show 74bf291`).
Shipped as-is (already web-ready); the 720p variant and the poster are derived from it.

**Captions:** `athar-origins-of-impact-ep01.{en,ar}.vtt` (12 cues each; EN transcribed from the burned-in subtitles, AR translated; out-point 37.300 s) — unchanged since v1.5.6.

**Poster:** `ffmpeg -ss 9.10 -i <1080p source> -frames:v 1 -vf scale=1280:720` (jpg q2 + webp q86). See README for the choice.

**Signed-URL note (for the record):** the media library's `url` field for this item resolves to `6abe166ad64782b8259834dc.mp3` (623,955 B, MPEG layer III 64 kb/s) — the
platform's audio extraction used for indexing, not the film; the film bytes are only on the `sourceUrl` blob.
