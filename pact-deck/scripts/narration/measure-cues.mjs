#!/usr/bin/env node
/* Athar deck — Guide Mode cue re-timer (v1.5.4).
   Measures the real duration of every narration clip (music-metadata frame scan; ffprobe when available) and rebuilds the
   sentence-cue timings in dist/narration/cues.json proportionally to the measured duration. Only numbers change: cue
   start/end and the durationSec fields of cues.json, clip-map.json and narration-manifest.json. Every sentence text,
   anchor, slide assignment and the manifest transcript stay byte-identical (the script verifies this before writing).
   Usage: node scripts/narration/measure-cues.mjs [--dist dist] [--dry] [--report qa/cue-timing-drift.md] */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseFile } from 'music-metadata';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true'] : []).filter(Boolean));
const DIST = args.dist || 'dist';
const DRY = args.dry === 'true';
const REPORT = args.report || 'qa/cue-timing-drift.md';
const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const r2 = (x) => Math.round(x * 100) / 100;

function ffprobe(file) {
  try { const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' }); const d = parseFloat(out); return isFinite(d) ? d : null; } catch (e) { return null; }
}
async function measure(file) {
  const ff = ffprobe(file);
  const mm = await parseFile(file, { duration: true });
  return { measured: ff != null ? ff : mm.format.duration, by: ff != null ? 'ffprobe' : 'music-metadata ' + (mm.format.codec || '') + ' ' + (mm.format.sampleRate || '') + 'Hz', mm: mm.format.duration, ff };
}

const cuesPath = path.join(DIST, 'narration/cues.json'), mapPath = path.join(DIST, 'narration/clip-map.json'), manPath = path.join(DIST, 'narration/narration-manifest.json');
const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8')); const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')); const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
const textsBefore = JSON.stringify(cues.clips.map((c) => c.cues.map((q) => [q.i, q.slide, q.anchor, q.text]))) + JSON.stringify(man.segments.map((s) => [s.segmentId, s.text, s.textAr || null]));

const rows = []; let maxDrift = 0, retimed = 0;
for (const clip of cues.clips) {
  const file = path.join(DIST, clip.file.replace(/^\//, ''));
  const m = await measure(file);
  const old = clip.durationSec; const nu = r2(m.measured); const drift = r2(nu - old); maxDrift = Math.max(maxDrift, Math.abs(drift));
  const lastEndOld = clip.cues[clip.cues.length - 1].end;
  const f = nu / old;
  const before = clip.cues.map((q) => [q.start, q.end]);
  if (Math.abs(drift) >= 0.005 || Math.abs(lastEndOld - nu) >= 0.005) {
    retimed++;
    clip.cues.forEach((q, i) => { q.start = i === 0 ? 0 : r2(q.start * f); q.end = i === clip.cues.length - 1 ? nu : r2(q.end * f); });
    for (let i = 1; i < clip.cues.length; i++) clip.cues[i].start = clip.cues[i - 1].end; /* contiguous sentences */
    clip.durationSec = nu;
  }
  const mc = map.clips.find((c) => c.clipId === clip.clipId); if (mc) { mc.durationSecOld = mc.durationSec; mc.durationSec = nu; mc.measuredBy = m.by; mc.measuredUtc = ts; }
  man.segments.forEach((s) => { if (s.clipId === clip.clipId) s.durationSec = nu; });
  rows.push({ clipId: clip.clipId, file: clip.file.split('/').pop(), oldDuration: old, measured: nu, drift, by: m.by, cues: clip.cues.length, timings: clip.cues.map((q, i) => `${q.i}: ${before[i][0]}–${before[i][1]} → ${q.start}–${q.end}`).join('; ') });
}
const textsAfter = JSON.stringify(cues.clips.map((c) => c.cues.map((q) => [q.i, q.slide, q.anchor, q.text]))) + JSON.stringify(man.segments.map((s) => [s.segmentId, s.text, s.textAr || null]));
if (textsBefore !== textsAfter) { console.error('ABORT: sentence texts / slide assignments would change'); process.exit(2); }

cues.generated_utc = ts; cues.measured = { utc: ts, tool: rows[0].by, maxDriftSec: maxDrift, clipsRetimed: retimed };
cues.method = 'proportional-by-characters sentence split (unchanged); start/end rescaled to the measured clip durations on ' + ts + ' by scripts/narration/measure-cues.mjs (' + rows[0].by.split(' ')[0] + ')';
const md = [`# Cue-timing drift — Guide Mode clips (${ts})`, '', `Tool: ${rows[0].by}${rows.some((r) => r.by !== rows[0].by) ? ' (mixed)' : ''} · clips: ${rows.length} · re-timed: ${retimed} · max |drift|: ${maxDrift.toFixed(2)} s`, '', '| clip | file | old durationSec | measured | drift (s) | sentences | timings old → new |', '|---|---|---|---|---|---|---|'];
rows.forEach((r) => md.push(`| ${r.clipId} | ${r.file} | ${r.oldDuration} | ${r.measured} | ${r.drift > 0 ? '+' : ''}${r.drift} | ${r.cues} | ${r.timings} |`));
md.push('', 'Sentence texts, anchors and slide assignments are byte-identical before and after (verified by the script); only start/end seconds and durationSec fields changed.');
console.log(md.join('\n'));
if (!DRY) {
  fs.writeFileSync(cuesPath, JSON.stringify(cues, null, 1) + '\n'); fs.writeFileSync(mapPath, JSON.stringify(map, null, 1) + '\n'); fs.writeFileSync(manPath, JSON.stringify(man, null, 1) + '\n');
  fs.mkdirSync(path.dirname(REPORT), { recursive: true }); fs.writeFileSync(REPORT, md.join('\n') + '\n'); fs.writeFileSync(REPORT.replace(/\.md$/, '.json'), JSON.stringify({ ts, rows, maxDrift, retimed }, null, 1));
  console.log(`\nwritten: ${cuesPath}, ${mapPath}, ${manPath}, ${REPORT}`);
}
