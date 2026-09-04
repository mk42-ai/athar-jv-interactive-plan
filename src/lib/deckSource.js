// Deck bytes resolver — the presentation must open for anyone with the raw link, with zero session
// context. Order: (1) the static PDF bundled in public/deck/ (stable relative path, served by the app
// itself — no signed or expiring URL anywhere); (2) the same bytes embedded as base64 in the client
// bundle (data/deck-pdf.base64.json), decoded in the browser. Never a third-party or signed URL.
export async function resolveDeckSource(src) {
  try {
    const res = await fetch(src, { cache: 'force-cache' });
    const type = res.headers.get('content-type') || '';
    if (res.ok && /pdf|octet-stream/i.test(type)) {
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.length > 1000 && buf[0] === 0x25 && buf[1] === 0x50) return { data: buf, source: 'static' }; // %PDF
    }
    throw new Error(`static deck unavailable (${res.status} ${type || 'no type'})`);
  } catch (e) {
    const mod = await import('../../data/deck-pdf.base64.json');
    const meta = mod.default || mod;
    const bin = atob(meta.base64);
    const data = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
    console.info('[deck] using embedded copy:', e?.message || e);
    return { data, source: 'embedded' };
  }
}
if (typeof window !== 'undefined') window.__atharResolveDeck = resolveDeckSource; // QA/support hook
