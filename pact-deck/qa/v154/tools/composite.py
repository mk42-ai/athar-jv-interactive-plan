"""SA2–SA5 compositing engine: exact Athar master + real UI/certificates warped into the chroma-key placeholders."""
import cv2, numpy as np, json, hashlib, sys, os
from PIL import Image
sys.path.insert(0, '/tmp/orch'); import chroma
A = '/tmp/orch/assets'
MANU = (247, 243, 234); NAVY_INK = (15, 30, 44); GULF = (30, 58, 95)
LOGO = np.array(Image.open(f'{A}/athar-master-navy.png').convert('RGBA'))
LOGO_W = np.array(Image.open(f'{A}/athar-master-white.png').convert('RGBA'))
INK_BOX = (34, 34, 4296, 889)            # ink bbox of the horizontal master (x0,y0,x1,y1)
ALIF_A = 644                             # alif cap-height in master px (clear space 1A)
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def logo_panel(w, h, bg=MANU, white=False, pad_scale=1.0):
    """Manuscript (or given) panel with the EXACT horizontal master centred and ≥1A clear space on every side."""
    src = LOGO_W if white else LOGO
    x0, y0, x1, y1 = INK_BOX; ink = src[y0:y1, x0:x1]; iw, ih = x1 - x0, y1 - y0
    s = min(w / (iw + 2 * ALIF_A * pad_scale), h / (ih + 2 * ALIF_A * pad_scale))
    lw, lh = max(1, int(round(iw * s))), max(1, int(round(ih * s)))
    lg = cv2.resize(ink, (lw, lh), interpolation=cv2.INTER_AREA)
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = bg; out[..., 3] = 255
    ox, oy = (w - lw) // 2, (h - lh) // 2
    a = lg[..., 3:4] / 255.0; reg = out[oy:oy + lh, ox:ox + lw, :3].astype(float)
    out[oy:oy + lh, ox:ox + lw, :3] = (lg[..., :3] * a + reg * (1 - a)).astype(np.uint8)
    mask = np.zeros((h, w), np.float32); mask[oy:oy + lh, ox:ox + lw] = lg[..., 3] / 255.0
    return out, mask, {'logo_px': [lw, lh], 'clear_space_px': round(ALIF_A * s, 1), 'scale': round(s, 5)}
def fit(img, w, h, bg=MANU, mode='cover'):
    ih, iw = img.shape[:2]; s = (max if mode == 'cover' else min)(w / iw, h / ih)
    nw, nh = max(1, int(round(iw * s))), max(1, int(round(ih * s)))
    r = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    if r.shape[2] == 3: r = np.dstack([r, np.full(r.shape[:2], 255, np.uint8)])
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = bg; out[..., 3] = 255
    if mode == 'cover':
        x, y = (nw - w) // 2, (nh - h) // 2; return r[y:y + h, x:x + w]
    x, y = (w - nw) // 2, (h - nh) // 2
    a = r[..., 3:4] / 255.0; out[y:y + nh, x:x + nw, :3] = (r[..., :3] * a + out[y:y + nh, x:x + nw, :3] * (1 - a)).astype(np.uint8); return out
def load_rgba(p): return np.array(Image.open(p).convert('RGBA'))
def order_quad(q, orient):
    p = np.array(q, float); c = p.mean(0); ang = np.arctan2(p[:, 1] - c[1], p[:, 0] - c[0]); p = p[np.argsort(ang)]  # clockwise (y down)
    best = None
    for r in range(4):
        tl, tr, br, bl = [p[(r + i) % 4] for i in range(4)]
        top = (np.linalg.norm(tr - tl) + np.linalg.norm(br - bl)) / 2; side = (np.linalg.norm(bl - tl) + np.linalg.norm(br - tr)) / 2
        my = (tl[1] + tr[1]) / 2; mx = (tl[0] + bl[0]) / 2
        ok = (top >= side) if orient == 'landscape' else (top <= side) if orient == 'portrait' else True
        score = my + (0 if ok else 1e6) + 0.001 * mx
        if best is None or score < best[0]: best = (score, np.array([tl, tr, br, bl], np.float32), top, side)
    return best[1], best[2], best[3]
def soft_alpha(bgr):
    f = bgr.astype(np.float32); b, g, r = f[..., 0], f[..., 1], f[..., 2]
    d = g - np.maximum(r, b); hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV); h = hsv[..., 0].astype(np.float32)
    gate = ((h >= 40) & (h <= 95)).astype(np.float32)
    return np.clip((d - 18) / (55 - 18), 0, 1) * gate
def edge_width(alpha, regmask):
    gy, gx = np.gradient(cv2.GaussianBlur(alpha, (0, 0), 0.6)); gm = np.hypot(gx, gy)
    ring = cv2.dilate(regmask, np.ones((5, 5), np.uint8)) & ~cv2.erode(regmask, np.ones((5, 5), np.uint8))
    v = gm[ring > 0]; v = v[v > 0.02]
    return float(1.0 / np.percentile(v, 90)) if len(v) else 1.0
def composite(raw_path, plan, out_path, report_path=None):
    bgr = cv2.imread(raw_path); H, W = bgr.shape[:2]; img = bgr.astype(np.float32)
    regions, _ = chroma.quads(raw_path, min_area=plan.get('min_area', 150))
    alpha_all = soft_alpha(bgr)
    rep = {'raw': raw_path, 'raw_sha256': sha(raw_path), 'regions': []}
    logo_masks = np.zeros((H, W), np.float32)
    used = set()
    for spec in plan['fills']:
        # pick region by nearest bbox centre to spec['near'] (raw px) or by rank
        if 'rank' in spec: reg = regions[spec['rank']]
        else:
            cx, cy = spec['near']; reg = min((r for i, r in enumerate(regions) if i not in used), key=lambda r: (r['bbox'][0] + r['bbox'][2] / 2 - cx) ** 2 + (r['bbox'][1] + r['bbox'][3] / 2 - cy) ** 2)
        used.add(regions.index(reg))
        quad, top, side = order_quad(reg['quad'], spec.get('orient', 'auto'))
        # expand the quad ~1.5 px outward so the fill always covers the anti-aliased green edge
        c = quad.mean(0); quad = c + (quad - c) * (1 + 1.5 / max(8.0, min(top, side)))
        aspect = top / max(1.0, side); FW = 1400; FH = max(8, int(round(FW / aspect)))
        if aspect < 1: FH = 1400; FW = max(8, int(round(FH * aspect)))
        kind = spec['kind']; lmask = None; meta = {}
        if kind in ('panel', 'badge', 'folder'):
            bg = spec.get('bg', MANU)
            if bg == 'sample':
                ring = cv2.dilate((np.zeros((H, W), np.uint8)), None)
                x, y, w, h = reg['bbox']; pad = 6; sl = bgr[max(0, y - pad):y + h + pad, max(0, x - pad):x + w + pad].reshape(-1, 3)
                al = alpha_all[max(0, y - pad):y + h + pad, max(0, x - pad):x + w + pad].reshape(-1)
                cand = sl[al < 0.05]; bg = tuple(int(v) for v in np.median(cand, 0)[::-1]) if len(cand) else GULF
            fill, lmask, meta = logo_panel(FW, FH, bg=bg, white=spec.get('white', False), pad_scale=spec.get('pad', 1.0))
        elif kind in ('screen', 'cert', 'phone', 'poster'):
            src = load_rgba(spec['asset']); fill = fit(src, FW, FH, mode=spec.get('fit', 'cover'))
            meta = {'asset': os.path.basename(spec['asset']), 'asset_sha256': sha(spec['asset'])}
            if 'logo_box' in spec:  # where the exact master sits inside this asset (asset px) for the exactness check
                pass
        M = cv2.getPerspectiveTransform(np.float32([[0, 0], [FW, 0], [FW, FH], [0, FH]]), quad.astype(np.float32))
        S = 2  # supersample
        M2 = np.diag([S, S, 1.0]) @ M
        warped = cv2.warpPerspective(fill, M2, (W * S, H * S), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
        warped = cv2.resize(warped, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32)
        wrgb = warped[..., :3][..., ::-1]; wa = warped[..., 3] / 255.0  # to BGR
        regmask = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(regmask, quad.astype(np.int32), 1)
        regd = cv2.dilate(regmask, np.ones((7, 7), np.uint8))
        a = alpha_all * regd
        a = np.maximum(a, cv2.erode(regmask, np.ones((5, 5), np.uint8)).astype(np.float32) * (alpha_all > 0.35))  # solid interior
        a = cv2.GaussianBlur(a, (0, 0), 0.7) * regd
        # shading from the placeholder (matte surfaces follow the light; screens mostly emissive)
        V = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)[..., 2].astype(np.float32)
        inside = (alpha_all > 0.6) & (regmask > 0)
        med = np.median(V[inside]) if inside.sum() > 20 else 200.0
        sig = max(2.0, 0.12 * min(top, side))
        Vf = V.copy(); Vf[~inside] = med; Vs = cv2.GaussianBlur(Vf, (0, 0), sig) / med
        k = {'screen': 0.35, 'phone': 0.35}.get(kind, 0.9)
        shade = np.clip(Vs, 0.55, 1.2) ** k
        wrgb = wrgb * shade[..., None]
        if kind in ('screen', 'phone'):
            wrgb = wrgb * 0.97 + 4  # slight screen black-lift
        # depth-of-field match
        ew = edge_width(alpha_all, regmask); blur = max(0.0, (ew - 1.4) * 0.55)
        if blur > 0.25:
            wrgb = cv2.GaussianBlur(wrgb, (0, 0), blur)
        # grain match from the neighbourhood
        ring = (cv2.dilate(regmask, np.ones((25, 25), np.uint8)) > 0) & (regd == 0)
        hp = img - cv2.GaussianBlur(img, (0, 0), 1.5); nstd = float(np.std(hp[ring])) if ring.sum() > 50 else 2.0
        wrgb = wrgb + np.random.default_rng(7).normal(0, min(nstd, 6.0) * 0.9, wrgb.shape).astype(np.float32)
        # despill the placeholder edge before blending
        spill = (alpha_all > 0.02) & (regd > 0)
        bch, gch, rch = img[..., 0], img[..., 1], img[..., 2]
        gch[spill] = np.minimum(gch[spill], (rch[spill] + bch[spill]) / 2 + 6)
        a3 = (a * wa)[..., None]
        img = wrgb * a3 + img * (1 - a3)
        if lmask is not None:
            lw = cv2.warpPerspective(lmask, M2, (W * S, H * S), flags=cv2.INTER_LINEAR); lw = cv2.resize(lw, (W, H), interpolation=cv2.INTER_AREA)
            logo_masks = np.maximum(logo_masks, lw * a)
        rep['regions'].append({'kind': kind, 'bbox': reg['bbox'], 'quad_TL_TR_BR_BL': quad.round(1).tolist(), 'orient': spec.get('orient', 'auto'), 'edge_blur_sigma': round(blur, 2), 'grain_std': round(nstd, 2), **meta})
    out = np.clip(img, 0, 255).astype(np.uint8)
    # fringe clean-up: any green left within 25 px of a composited region (anti-aliased edges, thin strips the quad missed,
    # green bounce light) is inpainted from its neighbours; natural greens further away (maize, status LEDs) are untouched
    union = np.zeros((H, W), np.uint8)
    for r in rep['regions']: cv2.fillConvexPoly(union, np.array(r['quad_TL_TR_BR_BL'], np.int32), 1)
    near = cv2.dilate(union, np.ones((51, 51), np.uint8)) > 0
    fr = ((soft_alpha(out) > 0.22) & near).astype(np.uint8)
    rep['fringe_px_inpainted'] = int(fr.sum())
    if fr.sum():
        out = cv2.inpaint(out, cv2.dilate(fr, np.ones((3, 3), np.uint8)), 4, cv2.INPAINT_TELEA)
    resid = soft_alpha(out); rep['residual_green_px'] = int((resid > 0.5).sum())
    cv2.imwrite(out_path, out); np.save(out_path.replace('.png', '-logomask.npy'), logo_masks.astype(np.float16))
    rep['out'] = out_path; rep['out_sha256'] = sha(out_path)
    if report_path: json.dump(rep, open(report_path, 'w'), indent=1)
    return rep
