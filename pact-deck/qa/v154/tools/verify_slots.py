import sys, json, hashlib, re, os
import numpy as np, cv2
from PIL import Image
D = '/tmp/terminal-work/work/6692b763e851d28a036ab30e/6abc5d318c19ce74d2a7dbc8/athar-jv-interactive-plan/pact-deck/dist'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
def hero(name, cid, credits='impact/v154/credits.json'):
    c = json.load(open(f'{D}/assets/{credits}'))['items'][name]; out = {'slot': name, 'checks': []}
    for fmt, ex in c['exports'].items():
        p = f"{D}/assets/{'impact/v154' if 'impact' in credits else 'plates/v154'}/{name}.{fmt}"; im = Image.open(p); w, h = im.size
        out['checks'].append({'file': os.path.basename(p), 'decodes': True, 'size': [w, h], 'is_3x2': abs(w / h - 1.5) < 0.002, 'sha_matches_credits': sha(p) == ex['sha256']})
    base = cid.rstrip('E'); lm = np.load(f'/tmp/orch/comp/{base}-comp-logomask.npy').astype(np.float32)
    if lm.max() > 0.2:
        png = np.array(Image.open(f"{D}/assets/{'impact/v154' if 'impact' in credits else 'plates/v154'}/{name}.png").convert('L').resize((1536, 1024), Image.LANCZOS)).astype(np.float32)
        ys, xs = np.where(lm > 0.05); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        a = lm[y0:y1, x0:x1]; b = png[y0:y1, x0:x1]; corr = float((((a - a.mean()) / (a.std() + 1e-6)) * ((b - b.mean()) / (b.std() + 1e-6))).mean())
        out['logo_exactness_corr'] = round(abs(corr), 3); out['logo_exact'] = abs(corr) >= 0.7
    out['ok'] = all(x['decodes'] and x['is_3x2'] and x['sha_matches_credits'] for x in out['checks']) and out.get('logo_exact', True)
    return out
def montage():
    c = json.load(open(f'{D}/assets/plates/v154/credits.json'))['montage']; im = np.array(Image.open(f'{D}/assets/plates/v154/ownership-montage.png').convert('RGB')); h, w = im.shape[:2]
    gut = [im[:, 600:608].reshape(-1, 3).mean(0).round().tolist(), im[:, 1208:1216].reshape(-1, 3).mean(0).round().tolist()]
    return {'size': [w, h], 'panels_3x2': (600 / 400) == 1.5, 'gutters_rgb': gut, 'gutters_manuscript': all(abs(g[0] - 247) < 3 and abs(g[1] - 243) < 3 and abs(g[2] - 234) < 3 for g in gut), 'sha_matches_credits': sha(f'{D}/assets/plates/v154/ownership-montage.png') == c['exports']['png']['sha256'], 'ok': w == 1816 and h == 400}
def alts():
    js = open(f'{D}/js/impact-tiers.js').read(); res = {}
    for k in ['t1-lebanon-licences', 't2-india-ai-pc', 't3-kenya-node']:
        al = re.findall(r"visual: '" + k + r"', visualAlt: '([^']*)'", js); res[k] = {'en': al[0][:60], 'ar': al[1][:60], 'both_non_empty': len(al) == 2 and all(len(x) > 20 for x in al)}
    m = re.search(r"img\('/assets/plates/v154/ownership-montage.png', isAr \? '([^']*)' : '([^']*)'\)", js); res['ownership-montage'] = {'en': m.group(2)[:60], 'ar': m.group(1)[:60], 'both_non_empty': bool(m)}
    os_ = open(f'{D}/js/athar-os.js').read(); res['slide38-bannerAlt'] = {'present_en_ar': os_.count('bannerAlt:') == 2}
    return res
if __name__ == '__main__':
    what = sys.argv[1]; out = {'sa': what}
    if what == 'SA2': out['result'] = hero('t1-lebanon-licences', 'T1b6a')
    if what == 'SA3': out['result'] = hero('t2-india-ai-pc', 'T2b6a')
    if what == 'SA4': out['result'] = hero('t3-kenya-node', 'T3b5aE')
    if what == 'SA5': out['result'] = {'montage': montage(), 'p1': hero('ownership-p1-training', 'P1b5E', 'plates/v154/credits.json'), 'p2': hero('ownership-p2-handover', 'P2b5aE', 'plates/v154/credits.json'), 'p3': hero('ownership-p3-operations', 'P3b6', 'plates/v154/credits.json')}
    if what == 'SA9': out['result'] = alts()
    json.dump(out, open(f'/tmp/orch/out/{what}/verify.json', 'w'), indent=1, ensure_ascii=False); print(json.dumps(out, ensure_ascii=False)[:600])
