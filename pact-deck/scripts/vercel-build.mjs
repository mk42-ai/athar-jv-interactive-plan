#!/usr/bin/env node
/* Athar deck — Vercel / Share build step (v1.5.5). Replaces the old "prebuilt — nothing to build" echo: the version is read from
   pact-deck/package.json at build time, the real build runs (scripts/v1.4.7/build.mjs = version gate across every runtime module +
   check-assets gate + SHA256SUMS over dist/), and dist/build-info.json records what was built, so a deployed preview can be checked
   for the exact version and commit. Exits non-zero if any gate fails, which fails the deployment. */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
let commit = process.env.VERCEL_GIT_COMMIT_SHA || '';
if (!commit) { try { commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim() || ''; } catch (e) { commit = ''; } } /* v1.5.9: local builds record the checkout they were built FROM (dist/ is committed on top of it) */
const branch = process.env.VERCEL_GIT_COMMIT_REF || (() => { try { return spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim() || null; } catch (e) { return null; } })();
console.log(`Athar Open Agentic Pact deck v${pkg.version}: building pact-deck/dist (version from package.json${commit ? ', commit ' + commit.slice(0, 7) : ''})`);
const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/v1.4.7/build.mjs')], { stdio: 'inherit', cwd: ROOT });
if (r.status !== 0) { console.error(`Athar deck v${pkg.version}: BUILD FAILED (exit ${r.status})`); process.exit(r.status || 1); }
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else files.push(p); } })(path.join(ROOT, 'dist'));
const FILMS = JSON.parse(fs.readFileSync(path.join(ROOT, 'features/exec-films/films.json'), 'utf8'));
const films = Object.entries(FILMS.films).map(([id, f]) => f.status === 'shipped'
  ? { id, status: 'shipped', person: f.person.en, title: f.title.en, requestedFile: f.requestedFile, requestedFileFound: !!f.requestedFileFound, usedInsteadOf: f.usedInsteadOf || null, file: FILMS.distBase + f.mp4, sha256: f.mp4Sha256, bytes: f.mp4Bytes, mobileFile: f.mp4Mobile ? FILMS.distBase + f.mp4Mobile : null, mobileSha256: f.mp4MobileSha256 || null,
      durationSec: f.durationSec, durationLabel: f.durationLabel, width: f.w, height: f.h, poster: FILMS.distBase + f.poster, posterTimeSec: f.posterTimeSec, posterSha256: f.posterSha256, captions: { en: FILMS.distBase + f.captions.en, ar: FILMS.distBase + f.captions.ar }, captionsSha256: f.captionsSha256 || null }
  : { id, status: f.status || 'coming-soon', person: f.person.en, requestedFile: f.requestedFile || null, requestedFileFound: !!f.requestedFileFound, slot: 'Film coming soon / قريباً' });
const info = { deck: 'Athar Open Agentic Pact', version: pkg.version, commit: commit || null, commitNote: process.env.VERCEL_GIT_COMMIT_SHA ? 'VERCEL_GIT_COMMIT_SHA' : (commit ? 'git HEAD at build time (the commit this dist/ was built from)' : null), branch,
  vercelEnv: process.env.VERCEL_ENV || null, builtAt: new Date().toISOString(), features: JSON.parse(fs.readFileSync(path.join(ROOT, 'features.json'), 'utf8')), films, distFiles: files.length, gates: ['version gate', 'check-assets', 'films manifest (sha256 + WebVTT)', 'SHA256SUMS'] };
fs.writeFileSync(path.join(ROOT, 'dist', 'build-info.json'), JSON.stringify(info, null, 1) + '\n');
console.log(`Athar Open Agentic Pact deck v${pkg.version}: build complete — ${files.length} files in dist/, gates PASS, dist/build-info.json written`);
