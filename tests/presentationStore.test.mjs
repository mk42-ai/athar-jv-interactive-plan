import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { getPresentationData, getPresentationDeck, getGuideSteps, getAudioClip, readPresentationFile, writePresentationFile, PresentationUnavailableError } from '../server/presentationStore.js';
import { clipStatus, rehydrateGuideAudio, guideAudioMiddleware, loadEmbeddedAudio } from '../server/guideAudioStore.js';
import { deckPdfMiddleware } from '../server/deck.js';

const hash = (v) => crypto.createHash('sha256').update(v).digest('hex');
const text = 'Synthetic narration only.';
const audio = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(1200, 5)]);
const pdf = Buffer.from('%PDF-1.7\nSynthetic test payload only.\n%%EOF');
const clipName = `test-${hash(audio).slice(0, 12)}.mp3`;
const plan = { months: [], gates: [], overview: { title: 'Synthetic test' } };
const script = [{ n: 1, title: 'Test slide', steps: [{ id: 'test', text, boxes: [{ x: 0, y: 0, w: 1, h: 1 }] }] }];
const manifest = { version: 2, clips: { test: { file: clipName, sha256: hash(audio), textSha256: hash(text), bytes: audio.length } } };
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'private-presentation-test-'));
  fs.chmodSync(root, 0o700);
  const previous = process.env.ATHAR_PRESENTATION_DIR;
  process.env.ATHAR_PRESENTATION_DIR = root;
  const json = (p, v) => writePresentationFile(p, JSON.stringify(v));
  json('data/athar-jv-month-timeline.json', plan);
  json('guide-script.json', script);
  json('presentation-config.json', { suggestedQuestions: ['Synthetic?'], deck: { title: 'Test deck', pages: [{ n: 1, title: 'Test slide' }] } });
  json('data/deck-pdf.base64.json', { name: 'test.pdf', pages: 1, sha256: hash(pdf), bytes: pdf.length, base64: pdf.toString('base64') });
  json('public/guide-audio/manifest.json', manifest);
  json('data/guide-audio.base64.json', { manifest, files: { [clipName]: { sha256: hash(audio), bytes: audio.length, base64: audio.toString('base64') } } });
  writePresentationFile(`public/guide-audio/${clipName}`, audio);
  writePresentationFile('public/deck/test.pdf', pdf);
  return { root, json, close() { if (previous === undefined) delete process.env.ATHAR_PRESENTATION_DIR; else process.env.ATHAR_PRESENTATION_DIR = previous; fs.rmSync(root, { recursive: true, force: true }); } };
}
function response() {
  return { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(v) { this.body = v ? Buffer.from(v) : Buffer.alloc(0); } };
}
function request(middleware, url, headers = {}, method = 'GET') {
  const res = response();
  middleware({ method, url, headers }, res, () => { res.next = true; });
  return res;
}

test('lazy store fails closed without an explicit private directory; rehydration never writes', () => {
  const previous = process.env.ATHAR_PRESENTATION_DIR;
  delete process.env.ATHAR_PRESENTATION_DIR;
  try {
    assert.throws(getPresentationData, PresentationUnavailableError);
    assert.equal(loadEmbeddedAudio().missing, true);
    assert.equal(rehydrateGuideAudio({ staticDir: 'public' }).restored, 0);
  } finally { if (previous !== undefined) process.env.ATHAR_PRESENTATION_DIR = previous; }
});
test('exact immutable payload; explicit initialized client modules preserve export contracts', async () => {
  const f = fixture();
  try {
    const data = getPresentationData();
    assert.deepEqual(data.plan, plan); assert.deepEqual(data.guideScript, script);
    assert.equal(data.deck.sha256, hash(pdf)); assert.deepEqual(data.suggestedQuestions, ['Synthetic?']);
    assert.ok(Object.isFrozen(data.plan.overview));
    assert.throws(() => { data.plan.overview.title = 'changed'; }, TypeError);
    const { initializePresentation, getPresentationData: clientData } = await import('../src/lib/presentationState.js');
    assert.throws(clientData, /bootstrap/);
    initializePresentation(data);
    const [clientPlan, clientGuide] = await Promise.all([import('../src/lib/plan.js'), import('../src/lib/guide.js')]);
    assert.deepEqual(clientPlan.PLAN, plan); assert.deepEqual(clientGuide.GUIDE_STEPS, getGuideSteps());
    assert.equal(clientGuide.firstStepOfSlide(1), 0); assert.equal(clientGuide.GUIDE_TOTAL, 1);
    assert.throws(() => initializePresentation(data), /already initialized/);
    const { resolveDeckSource } = await import('../src/lib/deckSource.js');
    const originalFetch = globalThis.fetch;
    let fetches = 0;
    try {
      globalThis.fetch = async (url, options) => {
        fetches++; assert.equal(url, '/deck/test.pdf');
        assert.equal(options.credentials, 'same-origin'); assert.equal(options.cache, 'no-store');
        return new Response(pdf, { headers: { 'Content-Type': 'application/pdf' } });
      };
      assert.deepEqual(Buffer.from((await resolveDeckSource('/deck/test.pdf')).data), pdf);
      await assert.rejects(resolveDeckSource('https://example.invalid/other.pdf'), /authorized presentation/);
      assert.equal(fetches, 1);
      globalThis.fetch = async () => new Response(null, { status: 401 });
      await assert.rejects(resolveDeckSource(), /unavailable/); // no sign-in path exists: a non-200 is simply unavailable
      globalThis.fetch = async () => new Response('%PDF-corrupt', { headers: { 'Content-Type': 'application/pdf' } });
      await assert.rejects(resolveDeckSource(), /integrity/);
    } finally { globalThis.fetch = originalFetch; }

  } finally { f.close(); }
});
test('private original bytes and embedded-only fallback both verify; wrong expected hash fails', () => {
  const f = fixture();
  try {
    assert.deepEqual(getAudioClip(clipName), audio); assert.deepEqual(getPresentationDeck().buf, pdf);
    getAudioClip(clipName).fill(0); getPresentationDeck().buf.fill(0);
    assert.deepEqual(getAudioClip(clipName), audio); assert.deepEqual(getPresentationDeck().buf, pdf);
    assert.equal(clipStatus(clipName, { expectedSha256: '0'.repeat(64) }).ok, false);
    fs.rmSync(path.join(f.root, 'public'), { recursive: true });
    assert.deepEqual(getAudioClip(clipName), audio); assert.deepEqual(getPresentationDeck().buf, pdf);
    getAudioClip(clipName).fill(0); getPresentationDeck().buf.fill(0);
    assert.deepEqual(getAudioClip(clipName), audio); assert.deepEqual(getPresentationDeck().buf, pdf);
    assert.equal(clipStatus(clipName, { expectedSha256: hash(audio) }).ok, true);
    assert.equal(rehydrateGuideAudio().restored, 0); assert.equal(fs.existsSync(path.join(f.root, 'public')), false);
  } finally { f.close(); }
});
test('corrupt files fail closed even after a previous successful read', () => {
  const f = fixture();
  try {
    getAudioClip(clipName); getPresentationDeck();
    writePresentationFile(`public/guide-audio/${clipName}`, Buffer.from('corrupt'));
    writePresentationFile('public/deck/test.pdf', Buffer.from('corrupt'));
    assert.throws(() => getAudioClip(clipName), PresentationUnavailableError);
    assert.throws(getPresentationDeck, PresentationUnavailableError);
    const res = request(guideAudioMiddleware(), `/guide-audio/${clipName}`);
    assert.equal(res.statusCode, 503); assert.doesNotMatch(res.body.toString(), /\/tmp|corrupt|private-presentation-test/);
  } finally { f.close(); }
});
test('traversal, symlinked files/directories/root, nonregular files and public permissions are refused', () => {
  const f = fixture();
  try {
    assert.throws(() => readPresentationFile('../outside'), PresentationUnavailableError);
    assert.throws(() => readPresentationFile('/etc/passwd'), PresentationUnavailableError);
    assert.throws(() => readPresentationFile('data\\x'), PresentationUnavailableError);
    fs.symlinkSync(path.join(f.root, 'guide-script.json'), path.join(f.root, 'link.json'));
    assert.throws(() => readPresentationFile('link.json'), PresentationUnavailableError);
    assert.throws(() => writePresentationFile('link.json', 'overwrite'), PresentationUnavailableError);
    fs.symlinkSync(path.join(f.root, 'data'), path.join(f.root, 'alias'));
    assert.throws(() => readPresentationFile('alias/athar-jv-month-timeline.json'), PresentationUnavailableError);
    assert.throws(() => readPresentationFile('data'), PresentationUnavailableError);
    fs.chmodSync(path.join(f.root, 'guide-script.json'), 0o644);
    assert.throws(() => readPresentationFile('guide-script.json'), PresentationUnavailableError);
    const rootLink = f.root + '-link'; fs.symlinkSync(f.root, rootLink);
    try { process.env.ATHAR_PRESENTATION_DIR = rootLink; assert.throws(getPresentationData, PresentationUnavailableError); }
    finally { fs.unlinkSync(rootLink); process.env.ATHAR_PRESENTATION_DIR = f.root; }
  } finally { f.close(); }
});
test('audio and PDF middleware return exact bytes, Range/HEAD, no-store and JSON errors (never SPA)', () => {
  const f = fixture();
  try {
    const middleware = guideAudioMiddleware();
    let res = request(middleware, `/guide-audio/${clipName}`, { range: 'bytes=2-7' });
    assert.equal(res.statusCode, 206); assert.deepEqual(res.body, audio.subarray(2, 8));
    assert.equal(res.headers['cache-control'], 'private, no-store'); assert.equal(res.headers.vary, 'Cookie');
    res = request(middleware, `/guide-audio/${clipName}`, { range: 'bytes=-5' }); assert.deepEqual(res.body, audio.subarray(-5));
    res = request(middleware, `/guide-audio/${clipName}`, {}, 'HEAD'); assert.equal(res.body.length, 0); assert.equal(res.headers['content-length'], String(audio.length));
    for (const range of ['bytes=999999-', 'bytes=-0', 'bytes=10-2', 'bytes=0-1,4-6', 'broken']) {
      assert.equal(request(middleware, `/guide-audio/${clipName}`, { range }).statusCode, 416);
    }
    for (const name of ['missing.mp3', '..%2Fdata', '%', 'unknown.json']) {
      res = request(middleware, `/guide-audio/${name}`); assert.equal(res.statusCode, 404); assert.match(res.headers['content-type'], /json/); assert.ok(!res.next);
    }
    res = request(deckPdfMiddleware(), '/deck/test.pdf', { range: 'bytes=0-4' }); assert.equal(res.statusCode, 206); assert.equal(res.body.toString(), '%PDF-');
    res = request(deckPdfMiddleware(), '/deck/missing.pdf'); assert.equal(res.statusCode, 404); assert.ok(!res.next);
    assert.equal(request(middleware, '/unrelated').next, true);
  } finally { f.close(); }
});
