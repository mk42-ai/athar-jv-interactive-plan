import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { GUIDE_STEPS, firstStepOfSlide } from '../src/lib/guide.js';
import { createNarrator, NarrationError } from '../src/lib/narrator.js';

const manifest = JSON.parse(fs.readFileSync(new URL('../public/guide-audio/manifest.json', import.meta.url)));
const store = JSON.parse(fs.readFileSync(new URL('../data/guide-audio.base64.json', import.meta.url)));
const hash = (v) => crypto.createHash('sha256').update(v).digest('hex');

test('every configured narration moment has identical static/embedded bytes and matching script hash', () => {
  assert.equal(GUIDE_STEPS.length, Object.keys(manifest.clips).length);
  assert.equal(firstStepOfSlide(2), GUIDE_STEPS.filter(s => s.slide === 1).length);
  for (const step of GUIDE_STEPS) {
    const clip = manifest.clips[step.id]; assert.ok(clip, step.id);
    const bytes = fs.readFileSync(new URL('../public/guide-audio/' + clip.file, import.meta.url));
    assert.equal(hash(bytes), clip.sha256); assert.equal(hash(step.text), clip.textSha256);
    assert.equal(hash(Buffer.from(store.files[clip.file].base64, 'base64')), clip.sha256);
    for (const box of step.boxes) { assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.w <= 1 && box.y + box.h <= 1); }
  }
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
const step = GUIDE_STEPS[0], entry = manifest.clips[step.id];
const bytes = fs.readFileSync(new URL('../public/guide-audio/' + entry.file, import.meta.url));
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
