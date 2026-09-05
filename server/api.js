// Existing Express/OnDemand integration, now an anonymous read-only document workspace.
// Provider credentials remain server-side. No presentation bootstrap or access-code middleware.
import express from 'express';
import { createEvidenceRoutes } from './evidenceRoutes.js';
import { loadDotEnv } from './env.js';
import { isConfigured } from './ondemand.js';
import { requestProtections } from './requestSecurity.js';

export function createApiApp({ corpusDir, provider, clock } = {}) {
  loadDotEnv();
  const app = express();
  app.disable('x-powered-by');
  const frameAncestors = String(process.env.ATHAR_FRAME_ANCESTORS || '*').replace(/[\r\n;]/g, '').trim() || '*';
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', 'frame-ancestors ' + frameAncestors);
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', requestProtections());
  app.get('/api/health', (req, res) => res.json({ ok: true, configured: provider?.isConfigured ? Boolean(provider.isConfigured()) : isConfigured(), build: process.env.ATHAR_BUILD_SHA || 'workspace', checkedAt: new Date().toISOString(), mode: 'document-workspace' }));
  const evidence = createEvidenceRoutes({ corpusDir: corpusDir || process.env.ATHAR_CORPUS_DIR, ...(provider ? { provider } : {}), ...(clock ? { clock } : {}) });
  app.use('/api', evidence.router);
  app.use('/api', (req, res) => res.status(404).json({ code: 'not_found', message: 'Route not found.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500;
    res.status(status).json({ code: status === 413 ? 'request_too_large' : status === 400 ? 'invalid_json' : 'service_error', message: status === 500 ? 'The service could not complete this request.' : 'Invalid request body.' });
  });
  return app;
}
