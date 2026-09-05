#!/usr/bin/env node
// Attach ElevenLabs provenance to the pre-baked narration manifest WITHOUT spending credits:
// reads the account's generation history (GET /v1/history — free) and matches each clip to its history
// item by generation time (±180 s) and exact character count, recording history-item-id, request-id,
// character-cost, model and timestamp. Run after `npm run guide:prebake`:
//   ATHAR_PRESENTATION_DIR=/absolute/private/presentation node scripts/attach-guide-audio-provenance.mjs
import { getAudioManifest, presentationDirectory, writePresentationFile } from '../server/presentationStore.js';

process.umask(0o077);
presentationDirectory();
import { isElevenConfigured } from '../server/elevenlabs.js';

if (!isElevenConfigured()) {
  console.error('ELEVENLABS_API_KEY is not set');
  process.exit(2);
}
const manifestPath = 'public/guide-audio/manifest.json';
const manifest = structuredClone(getAudioManifest());
const res = await fetch(`${process.env.ELEVENLABS_API_HOST || 'https://api.elevenlabs.io'}/v1/history?page_size=100`, { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } });
if (!res.ok) {
  console.error('history request failed', res.status);
  process.exit(1);
}
const history = ((await res.json()).history || []).sort((a, b) => a.date_unix - b.date_unix);
const used = new Set();
let matched = 0;
for (const [id, c] of Object.entries(manifest.clips)) {
  const gen = Date.parse(c.generatedAt) / 1000;
  const h = history.find((x) => !used.has(x.history_item_id) && Math.abs(x.date_unix - gen) < 180 && x.character_count_change_to - x.character_count_change_from === c.chars && (!x.model_id || x.model_id === c.model));
  if (!h) {
    console.warn(`no history match for ${id}`);
    continue;
  }
  used.add(h.history_item_id);
  c.provenance = {
    'history-item-id': h.history_item_id,
    'request-id': h.request_id,
    'character-cost': h.character_count_change_to - h.character_count_change_from,
    model_id: h.model_id,
    generatedAtUnix: h.date_unix,
    generatedAtIso: new Date(h.date_unix * 1000).toISOString(),
    source: h.source,
    matchedBy: 'generation time ±180 s + exact character count',
  };
  matched++;
  console.log(`${id.padEnd(15)} history=${h.history_item_id} request=${h.request_id} cost=${c.provenance['character-cost']} at ${c.provenance.generatedAtIso}`);
}
manifest.provenanceAttachedAt = new Date().toISOString();
writePresentationFile(manifestPath, JSON.stringify(manifest, null, 1));
console.log(`attached provenance to ${matched}/${Object.keys(manifest.clips).length} clips`);
