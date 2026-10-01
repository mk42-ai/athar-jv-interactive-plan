"""SA9 finishing: one unified warm cream/navy/gold grade for every generated image, film grain + micro-contrast against
the 'AI-smooth' look, 3:2 frame kept whole (no letterbox), exports AVIF/WebP + PNG fallback."""
import cv2, numpy as np, json, os, hashlib
from PIL import Image
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
GULF = np.array([95, 58, 30], np.float32) / 255  # BGR
MANU = np.array([234, 243, 247], np.float32) / 255
GOLD = np.array([90, 151, 184], np.float32) / 255
GRADE = {'contrast_s': 0.10, 'shadow_tint': 0.055, 'highlight_tint': 0.05, 'mid_gold': 0.025, 'sat': 0.92, 'warm': 0.012,
         'usm_sigma': 1.1, 'usm_amount': 0.42, 'grain_std': 0.020, 'grain_sigma': 0.55, 'vignette': 0.07}
def grade(bgr, seed=11, g=GRADE):
    x = bgr.astype(np.float32) / 255.0
    # micro-contrast (texture) before tone shaping
    blur = cv2.GaussianBlur(x, (0, 0), g['usm_sigma']); x = np.clip(x + g['usm_amount'] * (x - blur), 0, 1)
    L = cv2.cvtColor((x * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    # gentle S-curve on luminance
    s = g['contrast_s']; Lc = L + s * (L - 0.5) * (1 - np.abs(2 * L - 1)); ratio = (Lc + 1e-4) / (L + 1e-4)
    x = np.clip(x * ratio[..., None], 0, 1)
    # split tone: shadows -> Gulf Blue, highlights -> Manuscript, mids -> a breath of Legacy Gold
    wS = np.clip(1 - L / 0.45, 0, 1)[..., None] ** 1.5; wH = np.clip((L - 0.6) / 0.4, 0, 1)[..., None] ** 1.2; wM = (1 - np.abs(2 * L - 1))[..., None] ** 2
    x = x * (1 - g['shadow_tint'] * wS) + GULF * g['shadow_tint'] * wS * 0.9 + 0
    x = x * (1 - g['highlight_tint'] * wH) + MANU * g['highlight_tint'] * wH
    x = x * (1 - g['mid_gold'] * wM) + GOLD * g['mid_gold'] * wM
    # saturation + warmth
    gray = x.mean(axis=2, keepdims=True); x = gray + (x - gray) * g['sat']
    x[..., 2] *= (1 + g['warm']); x[..., 0] *= (1 - g['warm'])
    # vignette
    H, W = L.shape; yy, xx = np.mgrid[0:H, 0:W]; r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / np.sqrt(2)
    x = x * (1 - g['vignette'] * r[..., None] ** 2)
    # film grain (luminance, midtone-weighted, slightly soft)
    rng = np.random.default_rng(seed); n = rng.normal(0, 1, (H, W)).astype(np.float32); n = cv2.GaussianBlur(n, (0, 0), g['grain_sigma'])
    n = n / (n.std() + 1e-6) * g['grain_std'] * (0.55 + 0.9 * wM[..., 0])
    x = np.clip(x + n[..., None], 0, 1)
    return (x * 255 + 0.5).astype(np.uint8)
def export(bgr, base, size=(1200, 800), avif_q=62, webp_q=86):
    os.makedirs(os.path.dirname(base), exist_ok=True)
    h, w = bgr.shape[:2]; assert abs(w / h - 1.5) < 0.003, 'not 3:2'
    im = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)).resize(size, Image.LANCZOS)
    out = {}
    im.save(base + '.png', optimize=True); out['png'] = base + '.png'
    im.save(base + '.webp', quality=webp_q, method=6); out['webp'] = base + '.webp'
    im.save(base + '.avif', quality=avif_q, speed=4); out['avif'] = base + '.avif'
    return {k: {'path': v, 'bytes': os.path.getsize(v), 'sha256': sha(v), 'size': list(size)} for k, v in out.items()}
