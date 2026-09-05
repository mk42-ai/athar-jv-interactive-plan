// Standalone supported runtime: compiled React app + the same server-side API as Vite.
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApiApp } from './api.js';
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const port = Number(process.env.PORT || 5173);
const app = express();
app.disable('x-powered-by');
app.use(createApiApp());
// Explicit build asset allowlist. Never expose the project/workspace or old public folders.
const assets = path.join(dist, 'assets');
const allowedAssets = new Set(fs.existsSync(assets) ? fs.readdirSync(assets).filter(name => /^[A-Za-z0-9_.-]+$/.test(name) && fs.lstatSync(path.join(assets, name)).isFile() && !fs.lstatSync(path.join(assets, name)).isSymbolicLink()) : []);
app.get('/assets/:name', (req, res) => {
  if (!allowedAssets.has(req.params.name)) return res.status(404).json({ code: 'not_found' });
  res.set('Cache-Control', 'public, max-age=31536000, immutable').sendFile(path.join(assets, req.params.name));
});
app.get(['/', '/index.html'], (req, res) => fs.existsSync(path.join(dist, 'index.html')) ? res.set('Cache-Control', 'no-store').sendFile(path.join(dist, 'index.html')) : res.status(503).send('Build unavailable.'));
app.get('/favicon.ico', (req,res) => res.status(204).end());
app.use((req, res) => res.status(404).json({ code: 'not_found', message: 'Resource not found.' }));
app.listen(port, '0.0.0.0', () => console.log('Athar document workspace listening on port ' + port));
