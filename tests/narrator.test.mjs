import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { getGuideSteps, getAudioManifest, getEmbeddedAudioData, readPresentationFile, getPresentationDeck, getPresentationData } from '../server/presentationStore.js';
import { createNarrator, NarrationError } from '../src/lib/narrator.js';

const hash = (v) => crypto.createHash('sha256').update(v).digest('hex');
// Synthetic unit-test data only; actual confidential files are never required or committed.
const step = { id: 'test-moment', text: 'Synthetic narration test.', slide: 1, boxes: [{ x: 0, y: 0, w: 1, h: 1 }] };
const bytes = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(1200, 7)]);
const entry = { file: `test-moment-${hash(bytes).slice(0, 12)}.mp3`, sha256: hash(bytes), bytes: bytes.length, textSha256: hash(step.text) };
const manifest = { version: 2, provider: 'test', model: 'test', voice: 'test', clips: { [step.id]: entry } };

test('explicit private assets retain exact disk/embedded/audio/script hashes', { skip: process.env.ATHAR_PRESENTATION_DIR ? false : 'ATHAR_PRESENTATION_DIR is not set; private-asset checks intentionally skipped' }, () => {
  const steps = getGuideSteps(), actual = getAudioManifest(), embedded = getEmbeddedAudioData();
  assert.equal(steps.length, Object.keys(actual.clips).length);
  for (const moment of steps) {
    const clip = actual.clips[moment.id]; assert.ok(clip, moment.id);
    assert.equal(hash(readPresentationFile(`public/guide-audio/${clip.file}`)), clip.sha256);
    assert.equal(hash(moment.text), clip.textSha256);
    assert.equal(hash(Buffer.from(embedded.files[clip.file].base64, 'base64')), clip.sha256);
    for (const box of moment.boxes) assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.w <= 1 && box.y + box.h <= 1);
  }
  const deck = getPresentationDeck(); assert.equal(hash(deck.buf), deck.sha256);
  assert.deepEqual(getPresentationData().guideScript.flatMap(s => s.steps).map(s => s.text), steps.map(s => s.text));
});

class TestAudio {
  constructor() { this.dataset = {}; this.paused = true; this.ended = false; this.duration = 1; this.currentTime = 0; }
  setAttribute() {}
  play() { this.paused = false; queueMicrotask(() => { this.onplaying?.(); this.ended = true; this.onended?.(); }); return Promise.resolve(); }
  pause() { this.paused = true; }
}
async function mocked(fn, handler) {
  const originalFetch = globalThis.fetch, originalAudio = globalThis.Audio;
  globalThis.fetch = handler; globalThis.Audio = TestAudio;
  try { await fn(); } finally { globalThis.fetch = originalFetch; if (originalAudio) globalThis.Audio = originalAudio; else delete globalThis.Audio; }
}
const json = v => new Response(JSON.stringify(v), { headers: { 'Content-Type': 'application/json' } });
const audio = () => new Response(bytes, { headers: { 'Content-Type': 'audio/mpeg' } });

test('thrown static fetch retries hash-verified embedded bytes, never live TTS', async () => {
  const requests = [];
  await mocked(async () => { const narrator = createNarrator(); assert.equal(await narrator.speak(step), true); }, async url => {
    requests.push(String(url));
    if (String(url).includes('manifest')) return json(manifest);
    if (String(url).startsWith('/api/guide-audio/')) return audio();
    throw new TypeError('synthetic static offline');
  });
  assert.ok(requests.some(p => p.startsWith('/api/guide-audio/'))); assert.ok(!requests.includes('/api/guide/tts'));
});
test('script mismatch fails closed even if old embedded clip exists', async () => {
  const requests = [];
  await mocked(async () => { const narrator = createNarrator(); await assert.rejects(narrator.speak({ ...step, text: step.text + 'changed' }), NarrationError); }, async url => { requests.push(String(url)); return json(manifest); });
  assert.equal(requests.length, 1);
});
test('manifest source outage is retried after network recovery', async () => {
  let manifestTries = 0;
  await mocked(async () => {
    const narrator = createNarrator(); await assert.rejects(narrator.speak(step), NarrationError);
    assert.equal(await narrator.speak(step), true); assert.equal(manifestTries, 2);
  }, async url => {
    if (String(url).includes('manifest')) { if (++manifestTries === 1) throw new TypeError('synthetic offline'); return json(manifest); }
    return audio();
  });
});
test('HTML or corrupt bytes cannot be mislabeled as successful audio', async () => {
  const urls=[];
  await mocked(async () => { await assert.rejects(createNarrator().speak(step), NarrationError); }, async url => {
    urls.push(String(url));if(String(url).includes('manifest'))return json(manifest);
    return new Response('<html>no clip</html>',{headers:{'Content-Type':'text/html'}});
  });
  assert.ok(!urls.includes('/api/guide/tts'));
});
