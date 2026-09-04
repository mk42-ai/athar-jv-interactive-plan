#!/usr/bin/env node
// Pre-bake Guide Mode narration with ElevenLabs into public/guide-audio/ so every visitor hears the same
// verified voice with zero runtime quota use and no API key at runtime.
//
//   ELEVENLABS_API_KEY=… node scripts/prebake-guide-audio.mjs [--keep]
//
// Provenance & cache-busting (manifest v2):
//   • every clip is written as <momentId>-<sha256(bytes)[0:12]>.mp3 — content-addressed, so a regenerated clip
//     ALWAYS gets a new filename and can never be served from a stale browser/CDN cache;
//   • manifest.json records, per moment: file, full sha256 of the bytes, sha256 of the narration text, size,
//     voice/model/settings and the generation timestamp — the client re-hashes what it downloads before playing;
//   • previous clips are deleted first (unless --keep) so no orphaned/old audio remains in the folder.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { GUIDE_STEPS } from '../src/lib/guide.js';
import { ELEVEN, elevenStatus, elevenTts, isElevenConfigured } from '../server/elevenlabs.js';

if (!isElevenConfigured()) {
  console.error('ELEVENLABS_API_KEY is not set — nothing to do.');
  process.exit(2);
}
const keep = process.argv.includes('--keep');
const outDir = path.resolve('public/guide-audio');
fs.mkdirSync(outDir, { recursive: true });
const manifestPath = path.join(outDir, 'manifest.json');
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const iso = () => new Date().toISOString();

if (!keep) {
  for (const f of fs.readdirSync(outDir)) if (f.endsWith('.mp3')) fs.unlinkSync(path.join(outDir, f));
  console.log(`${iso()} purged old clips from ${outDir}`);
}
const manifest = {
  version: 2,
  provider: 'elevenlabs',
  model: ELEVEN.model,
  voice: ELEVEN.voiceName,
  voiceId: ELEVEN.voiceId,
  settings: ELEVEN.settings,
  outputFormat: ELEVEN.outputFormat,
  generatedAt: iso(),
  clips: {},
};

const before = await elevenStatus().catch((e) => ({ error: e.message }));
console.log(`${iso()} quota before:`, JSON.stringify(before));
let chars = 0;
let model = ELEVEN.model;
for (const step of GUIDE_STEPS) {
  const t0 = Date.now();
  let buf;
  try {
    buf = await elevenTts(step.text, { model });
  } catch (e) {
    if (model === ELEVEN.model && !['quota_exceeded', 'paid_plan_required', 'invalid_api_key'].includes(e.code)) {
      console.warn(`${iso()}   ${model} failed (${e.message}) — switching to ${ELEVEN.fallbackModel} for the rest of the run`);
      model = ELEVEN.fallbackModel;
      buf = await elevenTts(step.text, { model });
    } else throw e;
  }
  if (!(buf.length > 1000 && (buf.subarray(0, 3).toString() === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)))) {
    throw new Error(`${step.id}: response is not an MP3 (${buf.length} bytes)`);
  }
  const hash = sha256(buf);
  const file = `${step.id}-${hash.slice(0, 12)}.mp3`;
  fs.writeFileSync(path.join(outDir, file), buf);
  const back = sha256(fs.readFileSync(path.join(outDir, file)));
  if (back !== hash) throw new Error(`${step.id}: write verification failed`);
  manifest.clips[step.id] = {
    file,
    sha256: hash,
    bytes: buf.length,
    textSha256: sha256(step.text),
    chars: step.text.length,
    slide: step.slide,
    provider: 'elevenlabs',
    model,
    voice: ELEVEN.voiceName,
    voiceId: ELEVEN.voiceId,
    settings: ELEVEN.settings,
    approxSeconds: Math.round((buf.length * 8) / 128000),
    generatedAt: iso(),
  };
  chars += step.text.length;
  console.log(`${iso()} baked ${step.id.padEnd(14)} ${model} ${String(buf.length).padStart(7)} B sha256=${hash.slice(0, 16)}… (~${Math.round((buf.length * 8) / 128000)}s, ${Date.now() - t0} ms)`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1)); // checkpoint after every clip
}
const after = await elevenStatus().catch((e) => ({ error: e.message }));
console.log(`${iso()} done: ${Object.keys(manifest.clips).length} clips, ${chars} characters → ${manifestPath}`);
console.log(`${iso()} quota after:`, JSON.stringify(after));
