#!/usr/bin/env node
// Operator-only generation into ATHAR_PRESENTATION_DIR/public/guide-audio (never the public repo).
// Requires an explicitly configured private presentation directory and provider credentials in env.
//
//   ATHAR_PRESENTATION_DIR=/absolute/private/presentation node scripts/prebake-guide-audio.mjs [--keep]
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
import { getGuideSteps, presentationDirectory, presentationPath, readPresentationFile, writePresentationFile } from '../server/presentationStore.js';

process.umask(0o077);
presentationDirectory();
const GUIDE_STEPS = getGuideSteps();
import { ELEVEN, elevenStatus, elevenTts, isElevenConfigured } from '../server/elevenlabs.js';

if (!isElevenConfigured()) {
  console.error('ELEVENLABS_API_KEY is not set — nothing to do.');
  process.exit(2);
}
const keep = process.argv.includes('--keep');
const manifestRelative = 'public/guide-audio/manifest.json';
const manifestPath = presentationPath(manifestRelative, { createParents: true });
const outDir = path.dirname(manifestPath);
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const iso = () => new Date().toISOString();

if (!keep) {
  for (const f of fs.readdirSync(outDir)) if (f.endsWith('.mp3')) fs.unlinkSync(presentationPath(`public/guide-audio/${f}`));
  console.log(`${iso()} purged old private clips`);
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
  writePresentationFile(`public/guide-audio/${file}`, buf);
  const back = sha256(readPresentationFile(`public/guide-audio/${file}`));
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
  writePresentationFile(manifestRelative, JSON.stringify(manifest, null, 1)); // checkpoint after every clip
}
const after = await elevenStatus().catch((e) => ({ error: e.message }));
console.log(`${iso()} done: ${Object.keys(manifest.clips).length} clips, ${chars} characters saved privately`);
console.log(`${iso()} quota after:`, JSON.stringify(after));
