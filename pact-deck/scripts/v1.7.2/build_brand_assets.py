#!/usr/bin/env python3
"""Athar deck v1.7.2 — one-off generator for the Section 10 "Brand" assets (slides 46 Foundations · 47 Typography · 48 Product & asset gallery).
v1.7.2 (supersedes scripts/v1.7.1/build_brand_assets.py): every gallery image is exported as a SET — content-hashed 1x (800 px) and 2x (1600 px) WebP + a JPEG
fallback (+ a 2x PNG for the wireframe/screen pages, rendered at 144 dpi = 2× the 72-dpi page); the official logo is composited DETERMINISTICALLY (Pillow, no AI)
onto the blank reserved zones of the stationery flat-lay (navy cards → Ivory/Gold reversed variant, ivory cards / letterhead / badge → navy variant) and onto
the kiosk and laptop renders only where a clean flat zone exists; the IBM Plex Sans Medium + IBM Plex Sans Arabic Medium woff2 join the font set.

Usage: python3 scripts/v1.7.1/build_brand_assets.py <input dir> [fonts dir]
  <input dir>  the downloaded pack/product files (never committed): Athar_Logo_Horizontal_transparent_v1.png, moodboard.jpg (= the approved
               mood board, 1290×1909 — its five right-edge swatches sample to the palette HEX), athar_web_agent_avatar_system_v2.jpg,
               Athar_Wireframes_and_Screens_v1.pdf, render-{flatlay,kiosk,laptop-phone,brand-tile}.png
  [fonts dir]  the subset woff2 files built from google/fonts (SIL OFL 1.1) — see features/brand/README.md

Writes content-hashed files under features/brand/assets/{logo,mood,product,fonts}/<name>.<sha256[:10]>.<ext> and the manifest
features/brand/assets.json (sha256, pixel size, source, provenance label, EN/AR captions). Every colour used to derive a logo
variant is read from features/brand/brand-tokens.json (extracted from the guidelines) — nothing is typed by hand. The official
horizontal lockup is the ONLY mark; light / reversed / Ivory / monochrome / monogram versions are recolourings or crops of its
alpha layer (guidelines 2.4–2.6, 2.12) and are labelled DERIVED FROM OFFICIAL LOGO. The guidelines PDF/DOCX are never read here."""
import sys, os, json, hashlib, io, shutil, datetime, re
import numpy as np, cv2, pymupdf
from PIL import Image

IN = sys.argv[1]; FONTS = sys.argv[2] if len(sys.argv) > 2 else None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FEAT = os.path.join(ROOT, 'features', 'brand'); OUT = os.path.join(FEAT, 'assets')
TOK = json.load(open(os.path.join(FEAT, 'brand-tokens.json')))
PAL = {p['name']: p['hex'] for p in TOK['palette']}
def rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def sha(b): return hashlib.sha256(b).hexdigest()
for d in ('logo', 'mood', 'gallery', 'fonts'):
    pass
import shutil as _sh
for d in ('logo', 'mood', 'gallery', 'fonts', 'product'):
    p = os.path.join(OUT, d); _sh.rmtree(p, ignore_errors=True)
for d in ('logo', 'mood', 'gallery', 'fonts'):
    p = os.path.join(OUT, d); os.makedirs(p, exist_ok=True)
    for f in os.listdir(p): os.remove(os.path.join(p, f))  # regenerate from scratch (idempotent)
manifest = {'schema': 'athar.brand.assets/2', 'version': '1.7.2', 'generated_utc': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'distBase': '/assets/brand/', 'items': []}
def save(group, name, ext, data, **meta):
    h = sha(data)[:10]; fn = f'{name}.{h}.{ext}'; path = os.path.join(OUT, group, fn); open(path, 'wb').write(data)
    item = {'id': name, 'group': group, 'file': f'{group}/{fn}', 'bytes': len(data), 'sha256': sha(data)}
    if ext in ('png', 'jpg', 'webp'):
        im = Image.open(io.BytesIO(data)); item['w'], item['h'] = im.size
    item.update(meta); manifest['items'].append(item); print(f'  {group}/{fn}  {len(data)} B  {item.get("w","")}×{item.get("h","")}')
    return item
def png(im): b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return b.getvalue()
def webp(im, q=84): b = io.BytesIO(); im.convert('RGB').save(b, 'WEBP', quality=q, method=6); return b.getvalue()
def jpg(im, q=86): b = io.BytesIO(); im.convert('RGB').save(b, 'JPEG', quality=q, optimize=True, progressive=True); return b.getvalue()
def fit(im, w): 
    if im.width <= w: return im
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)

# ---------------------------------------------------------------- 1. logo variants (from the official horizontal transparent PNG)
print('logo')
official = Image.open(os.path.join(IN, 'Athar_Logo_Horizontal_transparent_v1.png')).convert('RGBA'); A = np.array(official); alpha = A[..., 3]
ink = A[alpha > 128][:, :3]; ink_med = tuple(int(v) for v in np.median(ink, axis=0))
ys, xs = np.where(alpha > 128); bbox = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
cols = (alpha > 128).sum(axis=0); runs, s = [], None
for i in range(bbox[0], bbox[2] + 1):
    if cols[i] == 0:
        if s is None: s = i
    elif s is not None: runs.append((s, i - 1)); s = None
runs = [r for r in runs if r[1] - r[0] >= 4]
groups, start = [], bbox[0]
for r in runs: groups.append((start, r[0] - 1)); start = r[1] + 1
groups.append((start, bbox[2]))
# the wordmark = the five widely tracked capitals at the right (ATHAR); the mark = everything left of the widest gap
gap = max(runs, key=lambda r: r[1] - r[0]); mark_x1 = gap[0] - 1; word_x0 = gap[1] + 1
letters = [g for g in groups if g[0] >= word_x0]
cap_rows = np.where((alpha[:, word_x0:bbox[2] + 1] > 128).any(axis=1))[0]; cap_h = int(cap_rows.max() - cap_rows.min() + 1)
geom = {'px': {'w': official.width, 'h': official.height}, 'inkBbox': bbox, 'markBbox': [bbox[0], int(np.where((alpha[:, :mark_x1 + 1] > 128).any(axis=1))[0].min()), mark_x1, int(np.where((alpha[:, :mark_x1 + 1] > 128).any(axis=1))[0].max())],
        'wordmarkBbox': [word_x0, int(cap_rows.min()), bbox[2], int(cap_rows.max())], 'letters': len(letters), 'capHeightPx': cap_h, 'clearSpaceX_overWidth': round(cap_h / official.width, 4), 'clearSpaceX_overHeight': round(cap_h / official.height, 4),
        'inkMedianRgb': ink_med, 'inkHex': '#%02X%02X%02X' % ink_med, 'inkMatchesDeepOcean': '#%02X%02X%02X' % ink_med == PAL['Deep Ocean']}
assert geom['letters'] == 5 and geom['inkMatchesDeepOcean'], geom
def recolour(hex_mark, hex_word, crop=None, width=1600):
    out = np.zeros_like(A); out[..., 3] = alpha
    out[:, :mark_x1 + 1, :3] = rgb(hex_mark); out[:, word_x0:, :3] = rgb(hex_word); out[:, mark_x1 + 1:word_x0, :3] = rgb(hex_mark)
    im = Image.fromarray(out, 'RGBA')
    if crop == 'mark': im = im.crop((max(0, geom['markBbox'][0] - 24), max(0, geom['markBbox'][1] - 24), geom['markBbox'][2] + 24, geom['markBbox'][3] + 24))
    return fit(im, width)
src_logo = {'source': 'Athar_Logo_Horizontal_transparent_v1.png (Athar_Brand_Asset_Pack_v3, Google Drive / SharePoint)', 'sourceSha256': sha(open(os.path.join(IN, 'Athar_Logo_Horizontal_transparent_v1.png'), 'rb').read())}
save('logo', 'athar-logo-horizontal-official', 'png', open(os.path.join(IN, 'Athar_Logo_Horizontal_transparent_v1.png'), 'rb').read(), label='OFFICIAL', variant='primary (Deep Ocean ink, transparent) — the pack file, bytes unchanged', **src_logo)
save('logo', 'athar-logo-horizontal-primary-1600', 'png', png(recolour(PAL['Deep Ocean'], PAL['Deep Ocean'])), label='OFFICIAL (display copy)', variant='primary — Deep Ocean on light grounds (Ivory 12.11:1 · Sand 6.24:1), downscaled to 1600 px', **src_logo)
save('logo', 'athar-logo-horizontal-reversed', 'png', png(recolour(PAL['Ivory'], PAL['Champagne Gold'])), label='DERIVED FROM OFFICIAL LOGO', variant='reversed — Ivory mark + Champagne Gold wordmark on Deep Ocean (mark 12.11:1 · wordmark 4.52:1; guidelines 2.4 / 2.12)', **src_logo)
save('logo', 'athar-logo-horizontal-ivory', 'png', png(recolour(PAL['Ivory'], PAL['Ivory'])), label='DERIVED FROM OFFICIAL LOGO', variant='all-Ivory lockup — on Emerald (6.41:1; guidelines 2.12)', **src_logo)
save('logo', 'athar-logo-horizontal-mono-black', 'png', png(recolour('#000000', '#000000')), label='DERIVED FROM OFFICIAL LOGO', variant='monochrome black — single-colour print, black on white (21.00:1; guidelines 2.5)', **src_logo)
save('logo', 'athar-logo-horizontal-mono-white', 'png', png(recolour('#FFFFFF', '#FFFFFF')), label='DERIVED FROM OFFICIAL LOGO', variant='monochrome white — single-colour reversed (guidelines 2.5)', **src_logo)
save('logo', 'athar-monogram-deep-ocean', 'png', png(recolour(PAL['Deep Ocean'], PAL['Deep Ocean'], crop='mark', width=600)), label='DERIVED FROM OFFICIAL LOGO', variant='monogram — the Arabic mark alone, Deep Ocean (guidelines 2.6; x = 1/6 of the mark height)', **src_logo)
save('logo', 'athar-monogram-champagne-gold', 'png', png(recolour(PAL['Champagne Gold'], PAL['Champagne Gold'], crop='mark', width=600)), label='DERIVED FROM OFFICIAL LOGO', variant='monogram — Champagne Gold, reversed on Deep Ocean / limestone signage (guidelines 2.6, 2.12)', **src_logo)
manifest['logoGeometry'] = geom

# ---------------------------------------------------------------- 2. mood board tiles
print('mood')
mb = Image.open(os.path.join(IN, 'moodboard.jpg')).convert('RGB')
# verify: the five swatches on the right edge (columns 1006–1084 of the 1290 × 1909 board, guidelines Chapter 3) sample to the palette
band = np.array(mb)[:, 1006:1085, :].astype(int); rowmean = band.mean(axis=1); runs, s = [], 0
for y in range(1, mb.height):
    if np.abs(rowmean[y] - rowmean[y - 1]).max() > 12:
        if y - s > 40: runs.append((s, y - 1))
        s = y
sw = ['#%02X%02X%02X' % tuple(np.median(band[a + 12:b - 12].reshape(-1, 3), axis=0).astype(int)) for a, b in runs[:5]]
def de(h1, h2): return sum(abs(a - b) for a, b in zip(rgb(h1), rgb(h2)))
swatch_check = {n: {'board': sw[i], 'token': PAL[n], 'absDiff': de(sw[i], PAL[n])} for i, n in enumerate(['Deep Ocean', 'Emerald', 'Sand', 'Ivory', 'Champagne Gold'])}
assert all(v['absDiff'] <= 3 for v in swatch_check.values()), swatch_check
save('mood', 'athar-mood-board-key-visual', 'jpg', jpg(fit(mb, 1100), 88), label='PACK ASSET', caption={'en': 'Mood board — the approved key visual (guidelines 5.1); its five right-edge swatches are the palette', 'ar': 'لوحة المزاج — المرئي الرئيسي المعتمد (الدليل 5.1)؛ عيّناتها الخمس على الحافة اليمنى هي لوحة الألوان'},
     source='image_picker_2FEAA08B-…1A58.jpg (media library) — identified as the 1290 × 1909 mood board of the guidelines (swatch columns 1006–1084 sample to the palette HEX)', sourceSha256=sha(open(os.path.join(IN, 'moodboard.jpg'), 'rb').read()), swatchCheck=swatch_check)

# ---------------------------------------------------------------- 3. gallery sets (1x / 2x WebP + JPEG fallback [+ 2x PNG for wireframe pages])
print('gallery')
def save_set(setId, im, label, kind, caption, source, sourceSha, extra=None, png2x=False):
    im = im.convert('RGB') if im.mode != 'RGBA' else im
    w2 = min(1600, im.width); w1 = min(800, im.width); meta = dict(setId=setId, label=label, kind=kind, caption=caption, source=source, sourceSha256=sourceSha, **(extra or {}))
    save('gallery', setId + '@2x', 'webp', webp(fit(im, w2), 84), role='webp2x', **meta)
    save('gallery', setId + '@1x', 'webp', webp(fit(im, w1), 84), role='webp1x', **meta)
    save('gallery', setId, 'jpg', jpg(fit(im, w2), 84), role='jpg', **meta)
    if png2x: save('gallery', setId + '@2x', 'png', png(fit(im.convert('RGB'), w2)), role='png2x', **meta)
doc = pymupdf.open(os.path.join(IN, 'Athar_Wireframes_and_Screens_v1.pdf')); wf_sha = sha(open(os.path.join(IN, 'Athar_Wireframes_and_Screens_v1.pdf'), 'rb').read())
def page_png(n, dpi=144):  # 2x of the 72-dpi page (842 × 595 pt → 1684 × 1190 px)
    pix = doc[n - 1].get_pixmap(dpi=dpi, alpha=False); return Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
WF = dict(source='Athar_Wireframes_and_Screens_v1.pdf (26 pp., Web app OD_v1.25, 27 Sep 2026) — page rendered at 144 dpi (2x)', sourceSha=wf_sha)
save_set('wireframe-p04-overview', page_png(4), 'PACK ASSET', 'wireframe', {'en': 'Wireframe · Overview — credits, six live metrics, activity, grants, plugins, storage, models (p. 4)', 'ar': 'إطار سلكي · النظرة العامة — الرصيد وستة مؤشرات حيّة والنشاط والمنح والإضافات والتخزين والنماذج (ص 4)'}, extra={'page': 4}, png2x=True, **WF)
save_set('screens-p09-overview-en', page_png(9), 'PACK ASSET', 'screens', {'en': 'Screens · Overview — English, light beside dark (p. 9)', 'ar': 'الشاشات · النظرة العامة — الإنجليزية، الفاتح بجانب الداكن (ص 9)'}, extra={'page': 9}, png2x=True, **WF)
save_set('screens-p16-agent-flow-builder', page_png(16), 'PACK ASSET', 'screens', {'en': 'Screens · Agent Flow Builder — multi-agent flows on a canvas (p. 16)', 'ar': 'الشاشات · منشئ تدفّق الوكلاء — تدفّقات متعددة الوكلاء على لوحة (ص 16)'}, extra={'page': 16}, png2x=True, **WF)
save_set('screens-p18-overview-ar', page_png(18), 'PACK ASSET', 'screens', {'en': 'Screens · Overview — Arabic RTL, light beside dark (p. 18)', 'ar': 'الشاشات · النظرة العامة — العربية من اليمين إلى اليسار، الفاتح بجانب الداكن (ص 18)'}, extra={'page': 18}, png2x=True, **WF)
# the avatar / persona system board (six personas, three sizes, four states) — pack asset
av = Image.open(os.path.join(IN, 'athar_web_agent_avatar_system_v2.jpg')).convert('RGB')
save_set('agent-avatar-system-v2', av, 'PACK ASSET', 'avatar', {'en': 'Agent avatar system v2 — six personas (Guide · Clerk · Scout · Tutor · Translator · Steward) at 96 / 48 / 24 px, four states', 'ar': 'نظام الصور الرمزية للوكلاء v2 — ست شخصيات (المرشد · الكاتب · الكاشف · المعلّم · المترجم · الأمين) بأحجام 96 / 48 / 24 بكسل وأربع حالات'}, 'athar_web_agent_avatar_system_v2.jpg (Athar_Brand_Asset_Pack_v3)', sha(open(os.path.join(IN, 'athar_web_agent_avatar_system_v2.jpg'), 'rb').read()))
# deterministic logo compositing onto the renders (flat zones found by local-std < 3 over 12-px blocks; colours decide the variant)
logo_dark = recolour(PAL['Deep Ocean'], PAL['Deep Ocean'], width=1600); logo_rev = recolour(PAL['Ivory'], PAL['Champagne Gold'], width=1600)
def flat_regions(im, block=12, std_thr=3.0, min_area_frac=0.0012):
    a = np.array(im.convert('RGB')); H, W = a.shape[:2]; g = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(np.float32)
    mu = cv2.blur(g, (block, block)); mu2 = cv2.blur(g * g, (block, block)); std = np.sqrt(np.maximum(mu2 - mu * mu, 0))
    flat = cv2.erode((std < std_thr).astype(np.uint8), np.ones((block, block), np.uint8)); n, lab, st, cen = cv2.connectedComponentsWithStats(flat, 8); out = []
    for i in range(1, n):
        x, y, w, h, ar = st[i]
        if ar < min_area_frac * H * W or w < 50 or h < 30 or (w >= W - 2 and h >= H - 2): continue
        m = lab[y:y + h, x:x + w] == i; out.append({'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h), 'area': int(ar), 'fill': round(float(ar / (w * h)), 2), 'lum': float(g[y:y + h, x:x + w][m].mean()), 'rgb': [int(v) for v in a[y:y + h, x:x + w][m].mean(axis=0)]})
    out.sort(key=lambda r: -r['area']); return out
def composite(im, region, frac, anchor='tl', pad=0.07):
    logo = logo_dark if region['lum'] > 110 else logo_rev; w = max(40, int(region['w'] * frac)); lg = logo.resize((w, max(1, round(logo.height * w / logo.width))), Image.LANCZOS)
    px = int(region['w'] * pad); x = region['x'] + px if anchor in ('tl', 'bl') else region['x'] + (region['w'] - w) // 2; y = region['y'] + px if anchor in ('tl', 'tc') else region['y'] + region['h'] - lg.height - px
    im.alpha_composite(lg, (x, y)); return {'x': x, 'y': y, 'w': w, 'h': lg.height, 'variant': 'navy (Deep Ocean)' if logo is logo_dark else 'Ivory / Champagne Gold (reversed)', 'zone': {k: region[k] for k in ('x', 'y', 'w', 'h', 'lum', 'rgb', 'fill')}}
def render(fn, setId, picks, cap_en, cap_ar, zones_note):
    im = Image.open(os.path.join(IN, fn)).convert('RGBA'); regs = flat_regions(im); placed = [composite(im, regs[i], frac, anchor) for i, frac, anchor in picks if i < len(regs)]
    save_set(setId, im, 'CONCEPT RENDER', 'render', {'en': cap_en, 'ar': cap_ar}, fn + ' (generated render, agents library)', sha(open(os.path.join(IN, fn), 'rb').read()),
             extra={'logoComposite': {'method': 'Pillow alpha_composite of the official horizontal lockup (recoloured from the alpha layer, colours from brand-tokens.json) onto flat blank zones detected deterministically (local std < 3 over 12-px blocks); zone luminance picks the variant: light zones → Deep Ocean lockup, dark/navy zones → Ivory mark + Champagne Gold wordmark', 'zones': zones_note, 'placements': placed}})
render('render-flatlay.png', 'render-stationery-flat-lay', [(0, 0.40, 'tl'), (1, 0.30, 'tl'), (2, 0.50, 'tl'), (3, 0.52, 'tl'), (4, 0.62, 'tc'), (5, 0.60, 'tl')], 'Stationery flat-lay — official logo composited onto the reserved zones (letterhead, navy cards, ivory card, badge, notebook)', 'مجموعة قرطاسية — الشعار الرسمي مركّب على المساحات المحجوزة (ورقة الرسائل والبطاقات الكحلية والبطاقة العاجية والشارة والدفتر)', 'letterhead (ivory) · navy header strip · navy card · ivory card · dark notebook/badge spine · small ivory badge')
render('render-kiosk.png', 'render-reception-kiosk', [(0, 0.46, 'tc')], 'Reception-lobby kiosk — official logo composited onto the kiosk header panel', 'كشك في بهو الاستقبال — الشعار الرسمي مركّب على لوحة رأس الكشك', 'kiosk front panel (light, top)')
render('render-laptop-phone.png', 'render-laptop-phone-dashboard', [(5, 0.72, 'tc')], 'Laptop + phone dashboard — official logo composited onto the dark UI header area', 'لوحة تحكم على حاسوب محمول وهاتف — الشعار الرسمي مركّب على رأس الواجهة الداكن', 'dark flat UI zone (phone screen header)')
tile = Image.open(os.path.join(IN, 'render-brand-tile.png')).convert('RGB')
save_set('render-brand-background-tile', tile, 'CONCEPT RENDER', 'render', {'en': 'Abstract brand background tile — the Section 10 backdrop', 'ar': 'بلاطة خلفية تجريدية — خلفية القسم 10'}, 'render-brand-tile.png (generated render, agents library)', sha(open(os.path.join(IN, 'render-brand-tile.png'), 'rb').read()))
# ---------------------------------------------------------------- 4. fonts (subset woff2 built from google/fonts, SIL OFL 1.1)
if FONTS:
    print('fonts'); built = json.load(open(os.path.join(FONTS, 'fonts-built.json')))
    for name, meta in built.items():
        data = open(os.path.join(FONTS, name + '.woff2'), 'rb').read()
        save('fonts', name, 'woff2', data, family=meta['family'] if 'Cormorant' not in name else 'Cormorant Garamond', weight=meta['weight'], style=meta['style'], glyphs=meta['glyphs'], subset=meta['subset'], licence='SIL Open Font License 1.1', source='github.com/google/fonts (main) ofl/' + meta['source'].replace('cg_', 'cormorantgaramond/'))
    for lic in ('cormorantgaramond', 'ibmplexmono', 'ibmplexsansarabic', 'ibmplexsans'):
        shutil.copyfile(os.path.join(FONTS, lic + '__OFL.txt'), os.path.join(OUT, 'fonts', 'OFL-' + lic + '.txt'))
json.dump(manifest, open(os.path.join(FEAT, 'assets.json'), 'w'), ensure_ascii=False, indent=1); open(os.path.join(FEAT, 'assets.json'), 'a').write('\n')
print('manifest: %d items → features/brand/assets.json' % len(manifest['items']))
