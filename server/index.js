// Standalone production server: serves the Vite build from ./dist and mounts the
// same On Demand API proxy used by the dev server. `npm run build && npm start`.
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApiApp } from './api.js';
import { privatePresentation, presentationAccess } from './privatePresentation.js';
import { onDemandKey } from './env.js';
import { deckPdfMiddleware } from './deck.js';
import { guideAudioMiddleware, rehydrateGuideAudio } from './guideAudioStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '../dist');
const port = Number(process.env.PORT || 5173);

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  if (/^\/(?:\.env|env\.local|\.private|\.git|\.creds|originals|raw|protected|corpus|server|scripts|tests|src|data)(?:[/.]|$)/i.test(req.path)) {
    return res.status(404).set('Cache-Control', 'no-store').json({ code: 'not_found' });
  }
  next();
});
const apiApp = createApiApp();
app.use(apiApp);
app.use(privatePresentation(apiApp.locals.reviewAccess));
app.use(['/deck', '/guide-audio'], presentationAccess(apiApp.locals.reviewAccess)); // reviewer session only in private mode
rehydrateGuideAudio({ staticDir: 'dist' });
app.use(guideAudioMiddleware({ staticDir: 'dist' }));
app.use(deckPdfMiddleware({ staticDir: 'dist' }));
if (fs.existsSync(dist)) {
  app.use(
    express.static(dist, {
      index: 'index.html',
      maxAge: process.env.ATHAR_PRIVATE_PRESENTATION === '1' ? 0 : '1h',
      setHeaders(res, filePath) {
        if (process.env.ATHAR_PRIVATE_PRESENTATION === '1') { res.setHeader('Cache-Control', 'private, no-store'); return; }
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
  console.log(`athar-jv app listening on http://0.0.0.0:${port} (On Demand key configured: ${Boolean(onDemandKey())})`);
});
