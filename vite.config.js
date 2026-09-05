import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createApiApp } from './server/api.js';
import { privatePresentation } from './server/privatePresentation.js';
import { deckPdfMiddleware } from './server/deck.js';
import { guideAudioMiddleware, rehydrateGuideAudio } from './server/guideAudioStore.js';

// The On Demand API proxy runs INSIDE the Vite dev server as connect middleware
// (and standalone via server/index.js for a production build). The apikey is
// read from process.env on the server only — it is never exposed to the client.
function onDemandApiPlugin() {
  return {
    name: 'ondemand-api-proxy',
    configureServer(server) {
      const apiApp = createApiApp();
      server.middlewares.use(apiApp);
      server.middlewares.use(privatePresentation(apiApp.locals.reviewAccess));
      rehydrateGuideAudio({ staticDir: 'public' }); // restore narration clips lost by a code-snapshot redeploy
      server.middlewares.use(guideAudioMiddleware({ staticDir: 'public' })); // clips from the embedded store when public/guide-audio/*.mp3 is absent; JSON 404 instead of SPA HTML
      server.middlewares.use(deckPdfMiddleware({ staticDir: 'public' })); // deck PDF fallback when public/deck/ is absent (snapshot redeploys)

    },
  };
}

export default defineConfig({
  plugins: [react(), onDemandApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    hmr: false,
  },
  preview: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  build: { outDir: 'dist', sourcemap: false },
});
