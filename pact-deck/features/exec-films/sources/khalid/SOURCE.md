# Muhammed Khalid — "Athar — Origins of Impact, Episode 01": source provenance (v1.5.9)

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
