// Server-only presentation payload. Nothing is loaded until the environment has been configured.
// HTTP callers MUST enforce reviewer access before calling these getters or serving their bytes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const buffers = new Map(); // SHA-256 -> verified bytes, never filenames or public output paths
const documents = new Map(); // SHA-256 -> immutable parsed configuration
const validHash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

export class PresentationUnavailableError extends Error {
  constructor() {
    super('The private presentation is unavailable. Restore the configured source and retry.');
    this.code = 'presentation_unavailable';
    this.status = 503;
  }
}
const unavailable = () => new PresentationUnavailableError();
const privateMode = (stat) => (stat.mode & 0o077) === 0 && (!process.getuid || stat.uid === process.getuid());

export function presentationDirectory() {
  try {
    const value = process.env.ATHAR_PRESENTATION_DIR;
    if (!value || !path.isAbsolute(value)) throw unavailable();
    const root = path.resolve(value);
    if (root === REPO || root.startsWith(REPO + path.sep)) throw unavailable();
    let current = path.parse(root).root;
    for (const component of root.slice(current.length).split(path.sep).filter(Boolean)) {
      current = path.join(current, component);
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw unavailable();
    }
    if (!privateMode(fs.statSync(root))) throw unavailable();
    return root;
  } catch { throw unavailable(); }
}

function segments(relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.includes('\0') || path.isAbsolute(relative)) throw unavailable();
  const parts = relative.split('/');
  if (parts.some((p) => !p || p === '.' || p === '..')) throw unavailable();
  return parts;
}

// Also used by operator scripts: rejects traversal, symlinked parents and non-private files.
export function presentationPath(relative, { createParents = false, optional = false } = {}) {
  try {
    const parts = segments(relative);
    let current = presentationDirectory();
    for (const part of parts.slice(0, -1)) {
      current = path.join(current, part);
      if (createParents && !fs.existsSync(current)) fs.mkdirSync(current, { mode: 0o700 });
      let stat;
      try { stat = fs.lstatSync(current); }
      catch (error) { if (optional && error.code === 'ENOENT') return null; throw error; }
      if (stat.isSymbolicLink() || !stat.isDirectory() || !privateMode(stat)) throw unavailable();
    }
    const target = path.join(current, parts.at(-1));
    try {
      const stat = fs.lstatSync(target);
      if (stat.isSymbolicLink() || !stat.isFile() || !privateMode(stat)) throw unavailable();
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    return target;
  } catch { throw unavailable(); }
}

export function readPresentationFile(relative, { optional = false } = {}) {
  let fd;
  try {
    const target = presentationPath(relative, { optional });
    if (target === null) return null;
    try { fd = fs.openSync(target, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW); }
    catch (error) { if (optional && error.code === 'ENOENT') return null; throw error; }
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || !privateMode(stat)) throw unavailable();
    const bytes = fs.readFileSync(fd), digest = hash(bytes);
    if (!buffers.has(digest)) buffers.set(digest, bytes);
    return Buffer.from(buffers.get(digest));
  } catch { throw unavailable(); }
  finally { if (fd !== undefined) fs.closeSync(fd); }
}

export function writePresentationFile(relative, bytes) {
  let fd;
  try {
    const target = presentationPath(relative, { createParents: true });
    fd = fs.openSync(target, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_NOFOLLOW, 0o600);
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || !privateMode(stat) || stat.nlink !== 1) throw unavailable();
    fs.ftruncateSync(fd, 0);
    fs.writeFileSync(fd, bytes);
  } catch { throw unavailable(); }
  finally { if (fd !== undefined) fs.closeSync(fd); }
}

export function readPresentationJson(relative, options) {
  try {
    const bytes = readPresentationFile(relative, options);
    if (bytes === null) return null;
    const digest = hash(bytes);
    if (!documents.has(digest)) documents.set(digest, freeze(JSON.parse(bytes.toString('utf8'))));
    return documents.get(digest);
  } catch { throw unavailable(); }
}

function verified(bytes, meta) {
  if (!bytes || !validHash(meta?.sha256) || hash(bytes) !== meta.sha256 || (meta.bytes !== undefined && bytes.length !== meta.bytes)) throw unavailable();
  if (!buffers.has(meta.sha256)) buffers.set(meta.sha256, bytes);
  return Buffer.from(buffers.get(meta.sha256));
}
export const isPresentationFilename = (name) => typeof name === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) && !name.includes('..');

export function getPresentationPlan() {
  const plan = readPresentationJson('data/athar-jv-month-timeline.json');
  if (!plan || !Array.isArray(plan.months) || !Array.isArray(plan.gates) || !plan.overview) throw unavailable();
  return plan;
}
export function getGuideScript() {
  const script = readPresentationJson('guide-script.json');
  if (!Array.isArray(script) || !script.length || script.some((slide) => !Array.isArray(slide?.steps) || slide.steps.some((step) => !step || typeof step.id !== 'string' || typeof step.text !== 'string' || !Array.isArray(step.boxes)))) throw unavailable();
  return script;
}
export function getGuideSteps() {
  return freeze(getGuideScript().flatMap((s) => s.steps.map((st, i) => ({ ...st, slide: s.n, slideTitle: s.title, stepInSlide: i + 1, stepsInSlide: s.steps.length }))));
}
export function getPresentationDeck() {
  const meta = readPresentationJson('data/deck-pdf.base64.json');
  if (!isPresentationFilename(meta?.name) || !meta.name.endsWith('.pdf')) throw unavailable();
  const file = readPresentationFile(`public/deck/${meta.name}`, { optional: true });
  const buf = verified(file || Buffer.from(meta.base64 || '', 'base64'), meta);
  if (buf.subarray(0, 5).toString() !== '%PDF-') throw unavailable();
  return { name: meta.name, buf, bytes: buf.length, sha256: meta.sha256, pages: meta.pages };
}
export function getPresentationData() {
  const config = readPresentationJson('presentation-config.json');
  if (!Array.isArray(config?.suggestedQuestions) || !Array.isArray(config?.deck?.pages) || typeof config.deck.title !== 'string') throw unavailable();
  const deck = getPresentationDeck();
  return freeze({ plan: getPresentationPlan(), guideScript: getGuideScript(), suggestedQuestions: config.suggestedQuestions,
    deck: { filename: deck.name, sha256: deck.sha256, bytes: deck.bytes, pages: deck.pages, title: config.deck.title, pageTitles: config.deck.pages } });
}
export function getEmbeddedAudioData() {
  return readPresentationJson('data/guide-audio.base64.json', { optional: true });
}
export function getAudioManifest() {
  const manifest = readPresentationJson('public/guide-audio/manifest.json', { optional: true }) || getEmbeddedAudioData()?.manifest;
  if (!manifest?.clips || typeof manifest.clips !== 'object' || Array.isArray(manifest.clips)) throw unavailable();
  return manifest;
}
export function getAudioClip(name) {
  if (!isPresentationFilename(name) || !name.endsWith('.mp3')) return null;
  const entry = Object.values(getAudioManifest().clips).find((clip) => clip.file === name);
  if (!entry) return null;
  const file = readPresentationFile(`public/guide-audio/${name}`, { optional: true });
  if (file) return verified(file, entry);
  const embedded = getEmbeddedAudioData()?.files?.[name];
  if (!embedded || embedded.sha256 !== entry.sha256) throw unavailable();
  return verified(verified(Buffer.from(embedded.base64 || '', 'base64'), embedded), entry);
}
