#!/usr/bin/env node
// Pre-bake Guide Mode narration with ElevenLabs into public/guide-audio/ so the deployed app serves
// the same natural voice to every visitor with zero runtime quota use (and no key at runtime).
//   ELEVENLABS_API_KEY=… node scripts/prebake-guide-audio.mjs [--force]
// Clips are keyed exactly like the runtime proxy (server/elevenlabs.js clipKey), so /api/guide/tts
// serves them first and only synthesises live for text that is not in the manifest.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { GUIDE_STEPS } from '../src/lib/guide.js';
import { ELEVEN, clipKey, elevenStatus, elevenTts, isElevenConfigured } from '../server/elevenlabs.js';

if (!isElevenConfigured()) {
  console.error('ELEVENLABS_API_KEY is not set — nothing to do.');
  process.exit(2);
}
const force = process.argv.includes('--force');
const outDir = path.resolve('public/guide-audio');
fs.mkdirSync(outDir, { recursive: true });
const manifestPath = path.join(outDir, 'manifest.json');
const manifest = fs.existsSync(manifestPath) && !force ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { clips: {} };
manifest.provider = 'elevenlabs';
manifest.model = ELEVEN.model;
manifest.voice = ELEVEN.voiceName;
manifest.voiceId = ELEVEN.voiceId;
manifest.settings = ELEVEN.settings;
manifest.generatedAt = new Date().toISOString();

const before = await elevenStatus().catch((e) => ({ error: e.message }));
console.log('quota before:', before);
let generated = 0;
let chars = 0;
let model = ELEVEN.model;
for (const step of GUIDE_STEPS) {
  const key = clipKey(crypto, step.text, { model });
  const file = `${key}.mp3`;
  if (manifest.clips[key] && fs.existsSync(path.join(outDir, file))) {
    console.log(`skip   ${step.id} (cached)`);
    continue;
  }
  let buf;
  try {
    buf = await elevenTts(step.text, { model });
  } catch (e) {
    if (model === ELEVEN.model && !['quota_exceeded', 'paid_plan_required', 'invalid_api_key'].includes(e.code)) {
      console.warn(`  ${model} failed (${e.message}) — switching to ${ELEVEN.fallbackModel} for the rest of the run`);
      model = ELEVEN.fallbackModel;
      buf = await elevenTts(step.text, { model });
    } else throw e;
  }
  const finalKey = clipKey(crypto, step.text, { model });
  const finalFile = `${finalKey}.mp3`;
  fs.writeFileSync(path.join(outDir, finalFile), buf);
  manifest.clips[finalKey] = {
    file: finalFile,
    id: step.id,
    slide: step.slide,
    provider: 'elevenlabs',
    model,
    voice: ELEVEN.voiceName,
    voiceId: ELEVEN.voiceId,
    settings: ELEVEN.settings,
    chars: step.text.length,
    bytes: buf.length,
    approxSeconds: Math.round((buf.length * 8) / 128000),
    generatedAt: new Date().toISOString(),
  };
  generated++;
  chars += step.text.length;
  console.log(`baked  ${step.id} ${model} ${buf.length} bytes (~${Math.round((buf.length * 8) / 128000)}s)`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1)); // checkpoint after every clip
}
const after = await elevenStatus().catch((e) => ({ error: e.message }));
console.log(`done: ${generated} clips generated, ${chars} characters, ${Object.keys(manifest.clips).length} in manifest`);
console.log('quota after:', after);
