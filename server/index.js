// Standalone production server: serves the Vite build from ./dist and mounts the
// same On Demand API proxy used by the dev server. `npm run build && npm start`.
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApiApp } from './api.js';
import { deckPdfMiddleware } from './deck.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '../dist');
const port = Number(process.env.PORT || 5173);

const app = express();
app.use(deckPdfMiddleware({ staticDir: 'dist' })); // deck PDF fallback when dist/deck/ (copied from public/ by vite build) is absent
app.use(createApiApp());
if (fs.existsSync(dist)) {
  app.use(
    express.static(dist, {
      index: 'index.html',
      maxAge: '1h',
      setHeaders(res, filePath) {
        if (/guide-audio[\\/]manifest\.json$/.test(filePath)) res.setHeader('Cache-Control', 'no-store, must-revalidate');
        else if (/guide-audio[\\/].+\.mp3$/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  app.get('*', (req, res) => res.status(503).send('Build missing — run `npm run build` first.'));
}
app.listen(port, '0.0.0.0', () => {
  console.log(`athar-jv app listening on http://0.0.0.0:${port} (apikey configured: ${Boolean(process.env.ON_DEMAND_API_KEY)})`);
});
