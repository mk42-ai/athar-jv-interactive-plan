// Server-side secrets loader.
//
// Order of precedence (first value wins, nothing is ever overwritten):
//   1. process.env                      — Vercel project Environment Variables, `sandbox exec --env`, the shell
//   2. <root>/.env                      — git-ignored dot-file (conventional)
//   3. <root>/env.local                 — git-ignored NON-dot copy; some code-snapshot restores drop dot-files, so
//                                         the same KEY=value lines live here too and a restarted sandbox still boots
//                                         with its keys
// Both spellings of the On Demand key are accepted and mirrored onto each other, so a key set as
// ONDEMAND_API_KEY (the platform's own naming) is picked up exactly like ON_DEMAND_API_KEY (this app's name).
// Nothing here is prefixed VITE_, so Vite never bundles a secret into the browser code; logs and /api/health
// only ever show a masked fingerprint.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SECRET_FILES = ['.env', 'env.local'];
export const ONDEMAND_KEY_NAMES = ['ON_DEMAND_API_KEY', 'ONDEMAND_API_KEY'];
let loaded = null;

function parse(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, '');
    out[m[1]] = v;
  }
  return out;
}

export function loadDotEnv() {
  if (loaded) return loaded;
  loaded = { files: [], applied: [], source: {} }; // source[KEY] = 'process.env' | '.env' | 'env.local'
  for (const name of Object.keys(process.env)) if (process.env[name]) loaded.source[name] = 'process.env';
  for (const file of SECRET_FILES) {
    const p = path.join(ROOT, file);
    try {
      if (!fs.existsSync(p)) continue;
      loaded.files.push(file);
      for (const [k, v] of Object.entries(parse(fs.readFileSync(p, 'utf8')))) {
        if (!process.env[k] && v) {
          process.env[k] = v;
          loaded.applied.push(k);
          loaded.source[k] = file;
        }
      }
    } catch (e) {
      console.warn(`[env] could not read ${file}:`, e.message);
    }
  }
  // Mirror the On Demand key across both accepted names.
  const found = ONDEMAND_KEY_NAMES.find((n) => process.env[n]);
  if (found) for (const n of ONDEMAND_KEY_NAMES) if (!process.env[n]) {
    process.env[n] = process.env[found];
    loaded.source[n] = `${loaded.source[found] || 'process.env'} (as ${found})`;
  }
  return loaded;
}

/** The On Demand key under either accepted name (server-side only). */
export function onDemandKey() {
  loadDotEnv();
  return ONDEMAND_KEY_NAMES.map((n) => process.env[n]).find(Boolean) || null;
}

/** Where the On Demand key came from: 'process.env' | '.env' | 'env.local' | null. */
export function onDemandKeySource() {
  const l = loadDotEnv();
  const name = ONDEMAND_KEY_NAMES.find((n) => process.env[n]);
  return name ? l.source[name] || 'process.env' : null;
}

/** Masked fingerprint for logs/health — never the full secret. */
export const fingerprint = (v) => (v ? `${v.slice(0, 4)}…${v.slice(-4)} (${v.length} chars)` : null);
