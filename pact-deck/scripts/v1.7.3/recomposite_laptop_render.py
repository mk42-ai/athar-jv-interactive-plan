#!/usr/bin/env python3
"""v1.7.3 (audit A-08 / A-09) — deterministic re-composite of the official Athar logo onto the EDITED laptop + phone dashboard render.

The step-4 editImage pass replaced the identifiable skyline behind the glass with a neutral UAE-style waterfront (1536 × 1024, same
composition as GqSmsmQEOF.png). This script swaps that render into the `render-laptop-phone-dashboard` gallery set with a PINNED
placement (absolute position / scale / opacity written below, not a detected-zone index), regenerates the 1x / 2x WebP + JPEG tiles
content-addressed (sha256-prefixed names) and rewrites the three manifest entries in features/brand/assets.json in place.

    python3 scripts/v1.7.3/recomposite_laptop_render.py <edited_render.png> <Athar_Logo_Horizontal_transparent_v1.png>            # build
    python3 scripts/v1.7.3/recomposite_laptop_render.py <edited_render.png> <Athar_Logo_Horizontal_transparent_v1.png> --verify   # re-encode in memory, compare sha256 with assets.json

Reproducibility: same inputs (sha256-checked) + same Pillow/libwebp build → byte-identical outputs; the manifest records the input hashes,
the placement, the encoder settings and the Pillow version so the hashes can be re-derived.
"""
import hashlib, io, json, os, sys, datetime
import numpy as np
from PIL import Image, __version__ as PIL_VERSION

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FEAT = os.path.join(ROOT, 'features', 'brand'); OUT = os.path.join(FEAT, 'assets'); SET_ID = 'render-laptop-phone-dashboard'
EXPECT_RENDER_SHA = '46a9f70191cade82ebb48d37cdc057a118b883379b3509a9eec8b673dc79e9f6'   # ohVo7cVcwn.png (editImageUsing2.5 of GqSmsmQEOF.png)
EXPECT_LOGO_SHA = '862dc135e31fdd6299bd7cd989d2ce869fdf4803773791f67052548f26cbd1ab'     # Athar_Logo_Horizontal_transparent_v1.png (pack v3)
# PINNED placement (v1.7.3). The v1.7.2 composite set the HORIZONTAL lockup 81 px wide on the phone header — below the guidelines' 160 px digital
# minimum for that lockup (brand.json logo.minSizes). The edited render has no flat zone ≥ 160 × 38 px on either screen (checked over the flat-mask
# integral image), so the compliant mark for this surface is the MONOGRAM (أثر alone, minimum 32 px): Ivory, 56 px tall (49 px wide), set top-centre of the
# flat dark area of the phone screen (x 382–495 · y 527–666, local std < 4 over 8-px blocks, lum ≈ 16), 12 px below its top edge; opacity 1.0.
PLACEMENT = {'kind': 'monogram', 'x': 414, 'y': 540, 'h': 56, 'variant': 'Ivory monogram (أثر mark alone — reversed on the dark UI; lockup minimum 160 px cannot be met on this surface)', 'opacity': 1.0,
             'zone': {'x': 382, 'y': 527, 'w': 113, 'h': 139, 'note': 'phone screen — flat dark UI area below the dashboard cards (local std < 4 over 8-px blocks, lum ≈ 16)'},
             'minSize': {'rule': 'Monogram 8 mm / 32 px (guidelines minimum-size table)', 'renderedPx': 56}}
ENC = {'webp2x': {'width': 1536, 'quality': 84, 'method': 6}, 'webp1x': {'width': 800, 'quality': 84, 'method': 6}, 'jpg': {'width': 1536, 'quality': 84, 'optimize': True, 'progressive': True}}

def sha(b): return hashlib.sha256(b).hexdigest()
def rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def fit(im, w): return im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
def webp(im, q, m): b = io.BytesIO(); im.convert('RGB').save(b, 'WEBP', quality=q, method=m); return b.getvalue()
def jpg(im, q): b = io.BytesIO(); im.convert('RGB').save(b, 'JPEG', quality=q, optimize=True, progressive=True); return b.getvalue()

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]; verify = '--verify' in sys.argv
    if len(args) != 2: sys.exit(__doc__)
    render_path, logo_path = args
    render_bytes = open(render_path, 'rb').read(); logo_bytes = open(logo_path, 'rb').read()
    assert sha(render_bytes) == EXPECT_RENDER_SHA, 'edited render sha256 mismatch: ' + sha(render_bytes)
    assert sha(logo_bytes) == EXPECT_LOGO_SHA, 'logo sha256 mismatch: ' + sha(logo_bytes)
    tokens = json.load(open(os.path.join(FEAT, 'brand-tokens.json'))); PAL = {p['name']: p['hex'] for p in tokens['palette']}
    manifest = json.load(open(os.path.join(FEAT, 'assets.json'))); geom = manifest['logoGeometry']
    # reversed lockup exactly as build_brand_assets.py recolour(): mark columns ≤ markBbox.x1 → Ivory, wordmark columns ≥ wordmarkBbox.x0 → Champagne Gold
    official = Image.open(io.BytesIO(logo_bytes)).convert('RGBA'); A = np.array(official); alpha = A[..., 3]
    out = np.zeros_like(A); out[..., 3] = alpha; mark_x1 = geom['markBbox'][2]; word_x0 = geom['wordmarkBbox'][0]
    out[:, :mark_x1 + 1, :3] = rgb(PAL['Ivory']); out[:, word_x0:, :3] = rgb(PAL['Champagne Gold']); out[:, mark_x1 + 1:word_x0, :3] = rgb(PAL['Ivory'])
    full_rev = Image.fromarray(out, 'RGBA'); mb = geom['markBbox']; mono = full_rev.crop((mb[0], mb[1], mb[2] + 1, mb[3] + 1))  # the Arabic mark alone (monogram), Ivory
    im = Image.open(io.BytesIO(render_bytes)).convert('RGBA'); assert im.size == (1536, 1024), im.size
    h = PLACEMENT['h']; lg = mono.resize((max(1, round(mono.width * h / mono.height)), h), Image.LANCZOS)
    if PLACEMENT['opacity'] < 1.0:
        a2 = np.array(lg); a2[..., 3] = (a2[..., 3] * PLACEMENT['opacity']).astype(np.uint8); lg = Image.fromarray(a2, 'RGBA')
    im.alpha_composite(lg, (PLACEMENT['x'], PLACEMENT['y']))
    outputs = {'webp2x': webp(fit(im, ENC['webp2x']['width']), ENC['webp2x']['quality'], ENC['webp2x']['method']),
               'webp1x': webp(fit(im, ENC['webp1x']['width']), ENC['webp1x']['quality'], ENC['webp1x']['method']),
               'jpg': jpg(fit(im, ENC['jpg']['width']), ENC['jpg']['quality'])}
    names = {'webp2x': (SET_ID + '@2x', 'webp'), 'webp1x': (SET_ID + '@1x', 'webp'), 'jpg': (SET_ID, 'jpg')}
    items = {it['role']: it for it in manifest['items'] if it.get('setId') == SET_ID}
    assert set(items) == {'webp2x', 'webp1x', 'jpg'}, sorted(items)
    if verify:
        ok = True
        for role, data in outputs.items():
            same = items[role]['sha256'] == sha(data); ok &= same; print(f'{role}: manifest {items[role]["sha256"][:12]} recomputed {sha(data)[:12]} {"OK" if same else "MISMATCH"}')
        print('reproducible' if ok else 'NOT reproducible'); sys.exit(0 if ok else 1)
    gallery = os.path.join(OUT, 'gallery'); removed = []
    for it in items.values():
        old = os.path.join(OUT, it['file'])
        if os.path.exists(old): os.remove(old); removed.append(it['file'])
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    comp = {'method': 'PINNED placement (v1.7.3): Pillow alpha_composite of the official logo (the أثر mark cropped from the official horizontal lockup by its measured bbox, recoloured from the alpha layer with brand-tokens.json Ivory) at a fixed position / scale / opacity recorded here — no zone detection at build time',
            'zones': 'phone screen — flat dark UI area (monogram; the 160 px horizontal-lockup minimum has no flat zone on this render)', 'placements': [{'kind': 'monogram', 'x': PLACEMENT['x'], 'y': PLACEMENT['y'], 'w': lg.width, 'h': lg.height, 'variant': PLACEMENT['variant'], 'opacity': PLACEMENT['opacity'], 'zone': PLACEMENT['zone'], 'minSize': PLACEMENT['minSize']}],
            'encoder': {'pillow': PIL_VERSION, 'settings': ENC}, 'inputs': {'render': {'file': 'ohVo7cVcwn.png (editImageUsing2.5 → neutral UAE waterfront skyline; derived from GqSmsmQEOF.png)', 'sha256': EXPECT_RENDER_SHA, 'px': [1536, 1024]}, 'logo': {'file': 'Athar_Logo_Horizontal_transparent_v1.png', 'sha256': EXPECT_LOGO_SHA}},
            'reproduce': 'python3 scripts/v1.7.3/recomposite_laptop_render.py <render> <logo> --verify', 'generatedUtc': now}
    for role, data in outputs.items():
        name, ext = names[role]; h = sha(data); fn = f'{name}.{h[:10]}.{ext}'; open(os.path.join(gallery, fn), 'wb').write(data)
        it = items[role]; pim = Image.open(io.BytesIO(data)); it.update({'file': f'gallery/{fn}', 'bytes': len(data), 'sha256': h, 'w': pim.width, 'h': pim.height,
                                                                           'source': 'ohVo7cVcwn.png (editImageUsing2.5 of render-laptop-phone.png — neutral UAE-style waterfront skyline; generated render, agents library)', 'sourceSha256': EXPECT_RENDER_SHA, 'logoComposite': comp})
        it['caption'] = {'en': 'Laptop + phone dashboard — official أثر monogram composited onto the phone dashboard (v1.7.3 render: neutral UAE waterfront skyline)', 'ar': 'لوحة تحكم على حاسوب محمول وهاتف — مونوغرام أثر الرسمي مركّب على لوحة تحكم الهاتف (تصيير v1.7.3: أفق واجهة بحرية إماراتية محايد)'}
        print(f'  gallery/{fn}  {len(data)} B  {pim.width}×{pim.height}')
    manifest['version'] = '1.7.3'; manifest['generated_utc'] = now
    manifest.setdefault('history', []).append({'version': '1.7.3', 'utc': now, 'change': f'{SET_ID}: edited render swapped in (sha {EXPECT_RENDER_SHA[:12]}), pinned logo composite; removed ' + ', '.join(removed)})
    json.dump(manifest, open(os.path.join(FEAT, 'assets.json'), 'w'), ensure_ascii=False, indent=1); open(os.path.join(FEAT, 'assets.json'), 'a').write('\n')
    print('removed:', removed); print('manifest updated → features/brand/assets.json (%d items)' % len(manifest['items']))

if __name__ == '__main__': main()
