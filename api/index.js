// Vercel serverless entry (prepared for a self-service `vercel --prod`; not used by the Vite dev
// server or by server/index.js). Vercel's Node runtime invokes the default export as an (req, res)
// handler; an Express app is one. vercel.json rewrites /api/(.*) here and the request keeps its
// original URL, so the router mounted at /api inside createApiApp() matches unchanged.
//
// Caveat — statefulness: the voice pipeline keeps uploaded mic audio and proxied TTS clips in an
// in-process map (GET /api/voice/audio/:id). Serverless instances do not share memory, so under
// concurrent instances those fetches can 404. For production voice, back that store with Vercel
// Blob/KV or run server/index.js on a persistent Node host (see README → Production deployment).
import { createApiApp } from '../server/api.js';

const app = createApiApp();
export default app;
