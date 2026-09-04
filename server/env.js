// Server-side secrets loader. Reads a git-ignored `.env` next to the project root (KEY=value lines) and
// fills in any process.env keys that are not already set — so the sandbox / `node server/index.js` /
// `vite` all see ON_DEMAND_API_KEY and ELEVENLABS_API_KEY without ever exposing them to the client
// (nothing here is prefixed VITE_, so Vite never bundles it). On Vercel, set the same names as
// Environment Variables in the project settings; this loader is then a no-op.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let loaded = null;

export function loadDotEnv() {
  if (loaded) return loaded;
  loaded = { file: path.join(ROOT, '.env'), applied: [], present: false };
  try {
    if (!fs.existsSync(loaded.file)) return loaded;
    loaded.present = true;
    for (const raw of fs.readFileSync(loaded.file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      else v = v.replace(/\s+#.*$/, '');
      if (!process.env[m[1]]) {
        process.env[m[1]] = v;
        loaded.applied.push(m[1]);
      }
    }
  } catch (e) {
    console.warn('[env] could not read .env:', e.message);
  }
  return loaded;
}

/** Masked fingerprint for logs/health — never the full secret. */
export const fingerprint = (v) => (v ? `${v.slice(0, 4)}…${v.slice(-4)} (${v.length} chars)` : null);
