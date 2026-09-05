// Exact deck PDF; never steps aside for a stale public/dist copy. Served publicly (no reviewer gate).
import { getPresentationDeck, isPresentationFilename } from './presentationStore.js';
import { sendPrivateBuffer, privateAssetError } from './guideAudioStore.js';

export const loadEmbeddedDeck = getPresentationDeck;
export function deckPdfMiddleware() {
  return (req, res, next) => {
    const pathname = String(req.url || '').split('?')[0];
    if (!pathname.startsWith('/deck/')) return next();
    if (req.method !== 'GET' && req.method !== 'HEAD') return privateAssetError(req, res);
    let name;
    try { name = decodeURIComponent(pathname.slice('/deck/'.length)); }
    catch { return privateAssetError(req, res); }
    if (!isPresentationFilename(name) || !name.endsWith('.pdf')) return privateAssetError(req, res);
    try {
      const deck = getPresentationDeck();
      if (name !== deck.name) return privateAssetError(req, res);
      res.setHeader('X-Deck-Source', 'private-store');
      return sendPrivateBuffer(req, res, deck.buf, { type: 'application/pdf', etag: deck.sha256 });
    } catch { return privateAssetError(req, res, 503); }
  };
}
