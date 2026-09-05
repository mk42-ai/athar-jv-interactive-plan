#!/usr/bin/env node
// Optional operator override: populate ATHAR_PRESENTATION_DIR from repo assets + git history.
// When ATHAR_PRESENTATION_DIR is unset, the server serves bundled repo files directly (Vercel/default).
//
//   node scripts/provision-presentation-store.mjs
//   node scripts/provision-presentation-store.mjs --target /Users/you/.athar-presentation
//
// Copies timeline/deck/audio metadata from the repo, restores guide-script.json from the last
// committed guide source, and writes presentation-config.json. Audio clips are served from the
// embedded base64 backup unless MP3 files are present under public/guide-audio/.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GUIDE_COMMIT = 'd7f6a66';

const parseTarget = () => {
  const idx = process.argv.indexOf('--target');
  if (idx !== -1 && process.argv[idx + 1]) return path.resolve(process.argv[idx + 1]);
  const env = process.env.ATHAR_PRESENTATION_DIR;
  if (env) return path.resolve(env);
  return path.join(os.homedir(), '.athar-presentation');
};

const refuseInsideRepo = (target) => {
  if (target === REPO || target.startsWith(REPO + path.sep)) {
    console.error(`Refusing a presentation store inside the repository: ${target}`);
    process.exit(2);
  }
};

const copyFile = (source, target) => {
  fs.mkdirSync(path.dirname(target), { mode: 0o700, recursive: true });
  fs.copyFileSync(source, target);
  fs.chmodSync(target, 0o600);
};

const writeJson = (target, value) => {
  fs.mkdirSync(path.dirname(target), { mode: 0o700, recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
};

const guideScriptFromGit = () => {
  const source = execSync(`git show ${GUIDE_COMMIT}:src/lib/guide.js`, { cwd: REPO, encoding: 'utf8' });
  const body = source.replace(/^export const GUIDE_SCRIPT/m, 'const GUIDE_SCRIPT').replace(/^export /gm, '');
  return new Function(`${body}; return GUIDE_SCRIPT;`)();
};

const presentationConfig = () => ({
  suggestedQuestions: [
    'What happens at each of the six gates, and when?',
    'When does billing start and what is the seat rate?',
    'Which anchors are contracted at G4 and how many seats each?',
    'What must be finished in November 2026 before G2?',
    'Summarise the financial baseline: capital, NPV and the Y1–Y3 revenue build.',
    'What is decided at the Month-6 gate in March 2027?',
  ],
  deck: {
    title: 'Athar JV — Executive Summary (2-slide deck)',
    pages: [
      { n: 1, title: 'Athar JV — Executive Summary' },
      { n: 2, title: 'Implementation Roadmap — Six Gates' },
    ],
  },
});

const main = () => {
  process.umask(0o077);
  const target = parseTarget();
  refuseInsideRepo(target);
  fs.mkdirSync(target, { mode: 0o700, recursive: true });

  const required = [
    'data/athar-jv-month-timeline.json',
    'data/deck-pdf.base64.json',
    'data/guide-audio.base64.json',
  ];
  for (const relative of required) {
    const source = path.join(REPO, relative);
    if (!fs.existsSync(source)) {
      console.error(`Missing repo asset: ${relative}`);
      process.exit(1);
    }
    copyFile(source, path.join(target, relative));
  }

  const deckMeta = JSON.parse(fs.readFileSync(path.join(REPO, 'data/deck-pdf.base64.json'), 'utf8'));
  const deckPdf = path.join(REPO, 'public/deck', deckMeta.name);
  if (fs.existsSync(deckPdf)) copyFile(deckPdf, path.join(target, 'public/deck', deckMeta.name));

  const embedded = JSON.parse(fs.readFileSync(path.join(REPO, 'data/guide-audio.base64.json'), 'utf8'));
  if (embedded.manifest) writeJson(path.join(target, 'public/guide-audio/manifest.json'), embedded.manifest);
  copyFile(path.join(REPO, 'data/guide-audio.base64.json'), path.join(target, 'data/guide-audio.base64.json'));

  writeJson(path.join(target, 'guide-script.json'), guideScriptFromGit());
  writeJson(path.join(target, 'presentation-config.json'), presentationConfig());

  console.log(JSON.stringify({
    ok: true,
    target,
    files: [
      'presentation-config.json',
      'guide-script.json',
      'data/athar-jv-month-timeline.json',
      'data/deck-pdf.base64.json',
      'data/guide-audio.base64.json',
      'public/guide-audio/manifest.json',
      deckMeta.name ? `public/deck/${deckMeta.name}` : null,
    ].filter(Boolean),
    next: `Set ATHAR_PRESENTATION_DIR=${target} in .env and restart the dev server.`,
  }, null, 2));
};

main();
