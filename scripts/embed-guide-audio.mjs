#!/usr/bin/env node
// Embed the pre-baked narration (public/guide-audio/*.mp3 + manifest.json) as base64 in
// data/guide-audio.base64.json — a TEXT file that survives code-snapshot redeploys, exactly like
// data/deck-pdf.base64.json does for the deck PDF. server/guideAudioStore.js restores the clips from
// it at start-up and serves them directly when the static files are missing.
//   node scripts/embed-guide-audio.mjs      (run after every `npm run guide:prebake`)
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('public/guide-audio');
const out = path.resolve('data/guide-audio.base64.json');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const files = {};
let bytes = 0;
for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.mp3')).sort()) {
  const buf = fs.readFileSync(path.join(dir, name));
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  const listed = Object.values(manifest.clips).find((c) => c.file === name);
  if (!listed) {
    console.warn(`skip ${name}: not in manifest`);
    continue;
  }
  if (listed.sha256 !== sha256) throw new Error(`${name}: on-disk sha256 ${sha256.slice(0, 12)} ≠ manifest ${listed.sha256.slice(0, 12)}`);
  files[name] = { base64: buf.toString('base64'), sha256, bytes: buf.length };
  bytes += buf.length;
}
const payload = { version: manifest.version, generatedAt: new Date().toISOString(), provider: manifest.provider, model: manifest.model, voice: manifest.voice, clips: Object.keys(files).length, bytes, manifest, files };
fs.writeFileSync(out, JSON.stringify(payload));
console.log(`embedded ${Object.keys(files).length} clips (${(bytes / 1048576).toFixed(2)} MB audio → ${(fs.statSync(out).size / 1048576).toFixed(2)} MB JSON) into ${path.relative(process.cwd(), out)}`);
