#!/usr/bin/env node
// Operator-only backup: private audio bytes -> ATHAR_PRESENTATION_DIR/data/guide-audio.base64.json.
// Never writes original narration or its embedded bytes into public/ or the repository.
import crypto from 'node:crypto';
import { getAudioManifest, presentationDirectory, readPresentationFile, writePresentationFile } from '../server/presentationStore.js';

process.umask(0o077);
presentationDirectory();

const out = 'data/guide-audio.base64.json';
const manifest = getAudioManifest();
const files = {};
let bytes = 0;
for (const name of [...new Set(Object.values(manifest.clips).map(c => c.file))].sort()) {
  const buf = readPresentationFile(`public/guide-audio/${name}`);
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
writePresentationFile(out, JSON.stringify(payload));
console.log(`embedded ${Object.keys(files).length} clips (${(bytes / 1048576).toFixed(2)} MB audio → ${(Buffer.byteLength(JSON.stringify(payload)) / 1048576).toFixed(2)} MB JSON) into the private embedded store`);
