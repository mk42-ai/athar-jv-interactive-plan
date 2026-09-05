import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createApiApp } from './server/api.js';
function onDemandApiPlugin() {
  return { name: 'ondemand-api-proxy', configureServer(server) {
    server.middlewares.use(createApiApp());
    server.middlewares.use((req,res,next) => {
      if (/^\/(?:\.env|env\.local|\.private|\.git|originals|raw|corpus|server|scripts|tests|data|deck|guide-audio)(?:[/.]|$)/i.test(req.url || '')) {
        res.statusCode = 404; res.setHeader('Content-Type', 'application/json'); return res.end('{"code":"not_found"}');
      }
      next();
    });
  }};
}
export default defineConfig({
  plugins: [react(), onDemandApiPlugin()],
  publicDir: false,
  server: { host: '0.0.0.0', port: 5173, strictPort: true, allowedHosts: true, hmr: false },
  preview: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  build: { outDir: 'dist', sourcemap: false },
});
