#!/usr/bin/env node
/* Athar deck — Vercel / Share build step (v1.5.5). Replaces the old "prebuilt — nothing to build" echo: the version is read from
   pact-deck/package.json at build time, the real build runs (scripts/v1.4.7/build.mjs = version gate across every runtime module +
   check-assets gate + SHA256SUMS over dist/), and dist/build-info.json records what was built, so a deployed preview can be checked
   for the exact version and commit. Exits non-zero if any gate fails, which fails the deployment. */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const commit = process.env.VERCEL_GIT_COMMIT_SHA || '';
console.log(`Athar Open Agentic Pact deck v${pkg.version}: building pact-deck/dist (version from package.json${commit ? ', commit ' + commit.slice(0, 7) : ''})`);
const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/v1.4.7/build.mjs')], { stdio: 'inherit', cwd: ROOT });
if (r.status !== 0) { console.error(`Athar deck v${pkg.version}: BUILD FAILED (exit ${r.status})`); process.exit(r.status || 1); }
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else files.push(p); } })(path.join(ROOT, 'dist'));
const info = { deck: 'Athar Open Agentic Pact', version: pkg.version, commit: commit || null, branch: process.env.VERCEL_GIT_COMMIT_REF || null, vercelEnv: process.env.VERCEL_ENV || null,
  builtAt: new Date().toISOString(), features: JSON.parse(fs.readFileSync(path.join(ROOT, 'features.json'), 'utf8')), distFiles: files.length, gates: ['version gate', 'check-assets', 'SHA256SUMS'] };
fs.writeFileSync(path.join(ROOT, 'dist', 'build-info.json'), JSON.stringify(info, null, 1) + '\n');
console.log(`Athar Open Agentic Pact deck v${pkg.version}: build complete — ${files.length} files in dist/, gates PASS, dist/build-info.json written`);
