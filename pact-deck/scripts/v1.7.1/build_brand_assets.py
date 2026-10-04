#!/usr/bin/env python3
"""Athar deck v1.7.1 — one-off generator for the Section 10 "Branding" assets (slides 46–48).

Usage: python3 scripts/v1.7.1/build_brand_assets.py <input dir> [fonts dir]
  <input dir>  the downloaded pack/product files (never committed): logo-horizontal.png, brand-image-picker.jpg (= the approved
               mood board, 1290×1909 — its five right-edge swatches sample to the palette HEX), moodboard-avatar-system.jpg,
               render-brand-tile.png, wireframes.pdf, shot-*.png, filmstill-432x169.png, render-{flatlay,kiosk,laptop-phone}.png
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
for d in ('logo', 'mood', 'product', 'fonts'):
    p = os.path.join(OUT, d); os.makedirs(p, exist_ok=True)
    for f in os.listdir(p): os.remove(os.path.join(p, f))  # regenerate from scratch (idempotent)
manifest = {'schema': 'athar.brand.assets/1', 'version': '1.7.1', 'generated_utc': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'distBase': '/assets/brand/', 'items': []}
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
official = Image.open(os.path.join(IN, 'logo-horizontal.png')).convert('RGBA'); A = np.array(official); alpha = A[..., 3]
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
src_logo = {'source': 'Athar_Logo_Horizontal_transparent_v1.png (Athar_Brand_Asset_Pack_v3, Google Drive / SharePoint)', 'sourceSha256': sha(open(os.path.join(IN, 'logo-horizontal.png'), 'rb').read())}
save('logo', 'athar-logo-horizontal-official', 'png', open(os.path.join(IN, 'logo-horizontal.png'), 'rb').read(), label='OFFICIAL', variant='primary (Deep Ocean ink, transparent) — the pack file, bytes unchanged', **src_logo)
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
mb = Image.open(os.path.join(IN, 'brand-image-picker.jpg')).convert('RGB')
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
     source='image_picker_2FEAA08B-…1A58.jpg (media library) — identified as the 1290 × 1909 mood board of the guidelines (swatch columns 1006–1084 sample to the palette HEX)', sourceSha256=sha(open(os.path.join(IN, 'brand-image-picker.jpg'), 'rb').read()), swatchCheck=swatch_check)
av = Image.open(os.path.join(IN, 'moodboard-avatar-system.jpg')).convert('RGB')
save('mood', 'athar-web-agent-avatar-system-v2', 'webp', webp(fit(av, 1200), 86), label='PACK ASSET', caption={'en': 'Agent avatar / persona system board (athar_web_agent_avatar_system_v2; guidelines 6.7)', 'ar': 'لوحة نظام الصور الرمزية للوكلاء (athar_web_agent_avatar_system_v2؛ الدليل 6.7)'},
     source='athar_web_agent_avatar_system_v2.jpg (Athar_Brand_Asset_Pack_v3)', sourceSha256=sha(open(os.path.join(IN, 'moodboard-avatar-system.jpg'), 'rb').read()))
tile = Image.open(os.path.join(IN, 'render-brand-tile.png')).convert('RGB')
save('mood', 'athar-brand-background-tile', 'webp', webp(fit(tile, 1200), 82), label='CONCEPT RENDER · ILLUSTRATIVE', caption={'en': 'Abstract brand background tile — supplementary render (step 4), used as the panel ground', 'ar': 'بلاطة خلفية تجريدية — تصيير تكميلي (الخطوة 4) يُستخدم أرضيةً للوحة'},
     source='DFrA2lssVy.png (supplementary render, agents library)', sourceSha256=sha(open(os.path.join(IN, 'render-brand-tile.png'), 'rb').read()))

# ---------------------------------------------------------------- 3. product assets
print('product')
doc = pymupdf.open(os.path.join(IN, 'wireframes.pdf')); wf_sha = sha(open(os.path.join(IN, 'wireframes.pdf'), 'rb').read())
def page_png(n, dpi=150):
    pix = doc[n - 1].get_pixmap(dpi=dpi, alpha=False); return Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
WF = {'source': 'Athar_Wireframes_and_Screens_v1.pdf (26 pp., Web app OD_v1.25, 27 Sep 2026) — page rasterised at 150 dpi', 'sourceSha256': wf_sha}
save('product', 'wireframes-p04-overview', 'webp', webp(page_png(4), 84), label='PACK ASSET', kind='wireframe', caption={'en': 'Wireframe · Overview — credits, six live metrics, activity, grants, plugins, storage, models (p. 4)', 'ar': 'إطار سلكي · النظرة العامة — الرصيد وستة مؤشرات حيّة والنشاط والمنح والإضافات والتخزين والنماذج (ص 4)'}, page=4, **WF)
en = page_png(9); ar = page_png(18)
stack = Image.new('RGB', (en.width, en.height + ar.height + 12), rgb(PAL['Ivory'])); stack.paste(en, (0, 0)); stack.paste(ar, (0, en.height + 12))
save('product', 'screens-p09-p18-overview-en-ar', 'webp', webp(fit(stack, 1400), 84), label='PACK ASSET', kind='screens', caption={'en': 'Screens · Overview — English LTR (p. 9) over Arabic RTL (p. 18), light beside dark', 'ar': 'الشاشات · النظرة العامة — الإنجليزية (ص 9) فوق العربية من اليمين إلى اليسار (ص 18)، الفاتح بجانب الداكن'}, page='9+18', **WF)
save('product', 'screens-p16-agent-flow-builder', 'webp', webp(page_png(16), 84), label='PACK ASSET', kind='screens', caption={'en': 'Screens · Agent Flow Builder — multi-agent flows on a canvas (p. 16)', 'ar': 'الشاشات · منشئ تدفّق الوكلاء — تدفّقات متعددة الوكلاء على لوحة (ص 16)'}, page=16, **WF)
for fn, idn, cap_en, cap_ar in [('shot-s38-nations-1473x738.png', 'deck-slide-38-nations-empowered', 'Deck screenshot · slide 38 “Nations empowered” (canvas 1473 × 738)', 'لقطة من العرض · الشريحة 38 «دول متمكّنة» (1473 × 738)'),
                               ('shot-s30-impact-1728x871.png', 'deck-slide-30-impact-funding', 'Deck screenshot · slide 30 “Impact & funding” (canvas 1728 × 871)', 'لقطة من العرض · الشريحة 30 «الأثر والتمويل» (1728 × 871)')]:
    im = Image.open(os.path.join(IN, fn)); bg = Image.new('RGB', im.size, rgb(PAL['Ivory'])); bg.paste(im.convert('RGBA'), (0, 0), im.convert('RGBA'))
    save('product', idn, 'webp', webp(fit(bg, 1400), 82), label='PACK ASSET', kind='deck', caption={'en': cap_en, 'ar': cap_ar}, source=fn.replace('shot-', 'canvas-screenshot-').replace('s38-nations-', '').replace('s30-impact-', '') + ' (pack screenshot)', sourceSha256=sha(open(os.path.join(IN, fn), 'rb').read()))
# film-still collage: crop the collage out of the slide screenshot (the non-background region under the tab label)
fs = Image.open(os.path.join(IN, 'filmstill-432x169.png')).convert('RGB'); F = np.array(fs).astype(int); bgc = np.median(np.concatenate([F[0], F[-1], F[:, 0], F[:, -1]]), axis=0)
mask = (np.abs(F - bgc).sum(axis=2) > 36); rows = np.where(mask.any(axis=1))[0]; colsm = np.where(mask.any(axis=0))[0]
# photographic region = rows whose coloured-pixel density is high (the collage), excluding the thin label rows
dens = mask.mean(axis=1); photo_rows = np.where(dens > 0.45)[0]; y0, y1 = int(photo_rows.min()), int(photo_rows.max()); x0, x1 = int(np.where(mask[y0:y1 + 1].mean(axis=0) > 0.6)[0].min()), int(np.where(mask[y0:y1 + 1].mean(axis=0) > 0.6)[0].max())
crop = fs.crop((x0, y0, x1 + 1, y1 + 1))
save('product', 'product-film-still-16s7-collage', 'webp', webp(crop, 88), label='FILM STILL', kind='film', caption={'en': 'Product-film still · at 16.7 s — concept collage (tablet · team · reception kiosk), as shown on slide 38 before v1.5.7', 'ar': 'لقطة من فيلم المنتج · عند 16.7 ث — كولاج مفاهيمي (لوح · فريق · كشك استقبال) كما عُرض في الشريحة 38 قبل v1.5.7'},
     source='canvas-screenshot-432x169.png (pack) — collage cropped from the slide capture', sourceSha256=sha(open(os.path.join(IN, 'filmstill-432x169.png'), 'rb').read()), cropBox=[x0, y0, x1 + 1, y1 + 1])
# step-4 renders with the official logo composited onto flat (blank) areas — regions found programmatically (local-std < 3 over 16 px blocks)
logo_dark = recolour(PAL['Deep Ocean'], PAL['Deep Ocean'], width=1600); logo_rev = recolour(PAL['Ivory'], PAL['Champagne Gold'], width=1600)
def flat_regions(im, block=16, std_thr=3.0, min_area_frac=0.004):
    a = np.array(im.convert('RGB')); H, W = a.shape[:2]; g = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(np.float32)
    mu = cv2.blur(g, (block, block)); mu2 = cv2.blur(g * g, (block, block)); std = np.sqrt(np.maximum(mu2 - mu * mu, 0))
    flat = cv2.erode((std < std_thr).astype(np.uint8), np.ones((block, block), np.uint8)); n, lab, st, cen = cv2.connectedComponentsWithStats(flat, 8); out = []
    for i in range(1, n):
        x, y, w, h, ar = st[i]
        if ar < min_area_frac * H * W or w < 60 or h < 40 or (w >= W - 2 and h >= H - 2): continue
        out.append({'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h), 'area': int(ar), 'lum': float(g[y:y + h, x:x + w][lab[y:y + h, x:x + w] == i].mean())})
    out.sort(key=lambda r: -r['area']); return out
def composite(im, region, frac, anchor='tl', pad=0.07):
    logo = logo_dark if region['lum'] > 110 else logo_rev; w = max(48, int(region['w'] * frac)); lg = logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS)
    px = int(region['w'] * pad); x = region['x'] + px if anchor in ('tl', 'bl') else region['x'] + (region['w'] - w) // 2; y = region['y'] + px if anchor in ('tl', 'tc') else region['y'] + region['h'] - lg.height - px
    im.alpha_composite(lg, (x, y)); return {'x': x, 'y': y, 'w': w, 'h': lg.height, 'variant': 'primary' if logo is logo_dark else 'reversed', 'region': region}
def render(fn, idn, picks, cap_en, cap_ar):
    im = Image.open(os.path.join(IN, fn)).convert('RGBA'); regs = flat_regions(im); placed = [composite(im, regs[i], frac, anchor) for i, frac, anchor in picks if i < len(regs)]
    save('product', idn, 'webp', webp(fit(im, 1400), 84), label='CONCEPT RENDER · ILLUSTRATIVE', kind='render', caption={'en': cap_en, 'ar': cap_ar}, source=fn + ' (supplementary render, step 4; agents library)', sourceSha256=sha(open(os.path.join(IN, fn), 'rb').read()),
         logoComposite={'method': 'official horizontal lockup composited onto flat (blank) regions detected programmatically (local std < 3 over 16-px blocks); Deep Ocean on light regions, Ivory/Gold reversed on dark regions', 'placements': placed})
render('render-flatlay.png', 'render-stationery-flat-lay', [(0, 0.40, 'tl'), (2, 0.50, 'tl'), (3, 0.52, 'tl')], 'Stationery flat-lay — official logo composited onto the blank logo areas', 'مجموعة قرطاسية — الشعار الرسمي مركّب على مساحات الشعار الفارغة')
render('render-kiosk.png', 'render-reception-kiosk', [(0, 0.46, 'tc')], 'Reception-lobby kiosk — official logo composited onto the kiosk header panel', 'كشك في بهو الاستقبال — الشعار الرسمي مركّب على لوحة رأس الكشك')
render('render-laptop-phone.png', 'render-laptop-phone-dashboard', [(5, 0.72, 'tc')], 'Laptop + phone dashboard — official logo composited onto the dark UI header area', 'لوحة تحكم على حاسوب محمول وهاتف — الشعار الرسمي مركّب على رأس الواجهة')

# ---------------------------------------------------------------- 4. fonts (subset woff2 built from google/fonts, SIL OFL 1.1)
if FONTS:
    print('fonts'); built = json.load(open(os.path.join(FONTS, 'fonts-built.json')))
    for name, meta in built.items():
        data = open(os.path.join(FONTS, name + '.woff2'), 'rb').read()
        save('fonts', name, 'woff2', data, family=meta['family'] if 'Cormorant' not in name else 'Cormorant Garamond', weight=meta['weight'], style=meta['style'], glyphs=meta['glyphs'], subset=meta['subset'], licence='SIL Open Font License 1.1', source='github.com/google/fonts (main) ofl/' + meta['source'].replace('cg_', 'cormorantgaramond/'))
    for lic in ('cormorantgaramond', 'ibmplexmono', 'ibmplexsansarabic'):
        shutil.copyfile(os.path.join(FONTS, lic + '__OFL.txt'), os.path.join(OUT, 'fonts', 'OFL-' + lic + '.txt'))
json.dump(manifest, open(os.path.join(FEAT, 'assets.json'), 'w'), ensure_ascii=False, indent=1); open(os.path.join(FEAT, 'assets.json'), 'a').write('\n')
print('manifest: %d items → features/brand/assets.json' % len(manifest['items']))
