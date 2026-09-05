// The original PDF is available only through the same-origin server route (public, checksum-verified).
// No static/bundled/base64 fallback, third-party URL or signed-link persistence.
import { getPresentationData } from './presentationState.js';
export async function resolveDeckSource(src) {
  const meta = getPresentationData().deck;
  const privatePath = `/deck/${encodeURIComponent(meta.filename)}`;
  if (src && src !== privatePath) throw new Error('The requested deck is not part of the authorized presentation.');
  const response = await fetch(privatePath, { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok || !/pdf|octet-stream/i.test(response.headers.get('content-type') || '')) throw new Error('The deck is unavailable. Please retry.');
  const data = new Uint8Array(await response.arrayBuffer());
  if (data.length < 5 || new TextDecoder().decode(data.subarray(0, 5)) !== '%PDF-' || !globalThis.crypto?.subtle) throw new Error('The deck could not be verified.');
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (digest !== meta.sha256) throw new Error('The deck failed integrity verification.');
  return { data, source: 'private' };
}
if (typeof window !== 'undefined') window.__atharResolveDeck = resolveDeckSource;
