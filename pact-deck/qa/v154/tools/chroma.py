import cv2, numpy as np, json, sys
def green_mask(bgr):
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    b, g, r = [bgr[..., i].astype(int) for i in range(3)]
    m = (h >= 45) & (h <= 90) & (s >= 90) & (v >= 60) & (g > r + 35) & (g > b + 25)
    return m.astype(np.uint8) * 255
def quads(path, min_area=600):
    bgr = cv2.imread(path); H, W = bgr.shape[:2]
    m = green_mask(bgr)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, stats, cent = cv2.connectedComponentsWithStats(m, 8)
    res = []
    for i in range(1, n):
        x, y, w, h, a = stats[i]
        if a < min_area: continue
        comp = (lab == i).astype(np.uint8) * 255
        cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        c = max(cnts, key=cv2.contourArea); hull = cv2.convexHull(c)
        peri = cv2.arcLength(hull, True); q = None
        for eps in (0.01, 0.02, 0.03, 0.04, 0.05, 0.07):
            ap = cv2.approxPolyDP(hull, eps * peri, True)
            if len(ap) == 4: q = ap.reshape(4, 2).tolist(); break
        if q is None:
            rect = cv2.minAreaRect(c); q = cv2.boxPoints(rect).astype(int).tolist()
        fill = a / max(1, cv2.contourArea(hull))
        res.append({'bbox': [int(x), int(y), int(w), int(h)], 'area': int(a), 'quad': q, 'fill': round(float(fill), 3), 'area_frac': round(a / (W * H), 4)})
    res.sort(key=lambda r: -r['area'])
    return res, float((m > 0).mean())
if __name__ == '__main__':
    out = {}
    for p in sys.argv[1:]:
        r, frac = quads(p); out[p] = {'green_frac': round(frac, 4), 'regions': r}
        print(p.split('/')[-1], 'green%', round(frac * 100, 2), 'regions', len(r))
        for q in r[:8]: print('   bbox', q['bbox'], 'area', q['area'], 'fill', q['fill'], 'quad', q['quad'])
    json.dump(out, open('/tmp/orch/out/chroma-latest.json', 'w'), indent=1)
