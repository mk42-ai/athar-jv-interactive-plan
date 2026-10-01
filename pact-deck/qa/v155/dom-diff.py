#!/usr/bin/env python3
"""v1.5.5 DOM text/figure diff vs v1.5.4 — slides 1–39 compared (EN + AR); slides 40–46 reported as additions.
Every change is classified against the v1.5.5 allow-list (only the requested items may change):
  slide 32 · Mastercard Foundation tile (typed heading + 'official mark pending verification' → official mark image)
  slide 38 · montage image + caption ('Official brand imagery — tier progression (reused from slide 29)' → 'CONCEPT RENDER') + alt
  footer counter 'n of 39' → 'n of 46' and the deck-version string (version bump)
Usage: python3 dom-diff.py <v154.json> <v155.json> <out.json>"""
import json, sys, difflib, hashlib
a, b, out = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])), sys.argv[3]
ALLOWED_TEXT = {32: {'Mastercard', 'Foundation', 'official', 'mark', 'pending', 'verification', 'مؤسسة', 'ماستركارد', 'العلامة', 'الرسمية', 'بانتظار', 'التحقق'},
                38: set('Official brand imagery — tier progression (reused from slide 29) CONCEPT RENDER صورة رسمية من هوية أثر تدرّج الفئات (من الشريحة 29) تصوّر مفاهيمي ·'.split())}
rows, unexpected, changed = [], [], 0
for lang in ('en', 'ar'):
    A = {r['n']: r for r in a['slides'][lang]}; B = {r['n']: r for r in b['slides'][lang]}
    for n in range(1, 40):
        ra, rb = A[n], B[n]; ta, tb = ra['text'], rb['text']
        d = [x for x in difflib.unified_diff(ta.split(' '), tb.split(' '), lineterm='', n=0) if not x.startswith(('---', '+++', '@@'))]
        words = {x[1:] for x in d}
        imgs_a = [(i['src'], i['alt']) for i in ra['imgs']]; imgs_b = [(i['src'], i['alt']) for i in rb['imgs']]
        img_changes = [('-',) + x for x in imgs_a if x not in imgs_b] + [('+',) + x for x in imgs_b if x not in imgs_a]
        fig_a, fig_b = ra['figures'], rb['figures']
        fig_changes = [x for x in difflib.unified_diff(fig_a, fig_b, lineterm='', n=0) if not x.startswith(('---', '+++', '@@'))]
        counter_change = (ra.get('counter'), rb.get('counter')) if ra.get('counter') != rb.get('counter') else None
        same = not d and not img_changes and not fig_changes
        allowed = True; why = []
        if d:
            allow = {x.lower() for x in ALLOWED_TEXT.get(n, set())}; extra = {w for w in words if w and w.lower() not in allow}  # innerText applies text-transform: uppercase
            if extra: allowed = False; why.append('text outside allow-list: ' + ' '.join(sorted(extra))[:200])
        if img_changes and n not in (32, 38): allowed = False; why.append('image change outside slides 32/38')
        if fig_changes:
            extra_f = [f for f in fig_changes if not (n == 38 and f[1:] in ('29', '29)'))]
            if extra_f: allowed = False; why.append('figure change: ' + ' '.join(extra_f)[:200])
        if not same: changed += 1
        if not allowed: unexpected.append({'lang': lang, 'n': n, 'why': why})
        rows.append({'lang': lang, 'n': n, 'slideId': rb['id'], 'identical': same, 'allowed': allowed, 'textDiff': d[:24], 'imageChanges': img_changes, 'figureChanges': fig_changes,
                     'counter': counter_change, 'sha_v154': hashlib.sha256(ta.encode()).hexdigest()[:16], 'sha_v155': hashlib.sha256(tb.encode()).hexdigest()[:16],
                     'broken_v155': [i['src'] for i in rb['imgs'] if i['broken']]})
added = [{'lang': lang, 'n': r['n'], 'slideId': r['id'], 'chars': len(r['text']), 'imgs': [i['src'] for i in r['imgs']], 'broken': [i['src'] for i in r['imgs'] if i['broken']], 'videos': r.get('videos', []), 'counter': r.get('counter')}
         for lang in ('en', 'ar') for r in b['slides'][lang] if r['n'] > 39]
broken_all = [(lang, r['n'], i['src']) for lang in ('en', 'ar') for r in b['slides'][lang] for i in r['imgs'] if i['broken']]
res = {'baseline': a.get('base'), 'candidate': b.get('base'), 'compared': len(rows), 'changed': changed, 'unexpected': unexpected, 'added': added, 'brokenImages_v155': broken_all,
       'changedSlides': sorted({(r['lang'], r['n']) for r in rows if not r['identical']}), 'rows': rows}
json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1)
print(f"compared {len(rows)} slide views (39 × EN/AR); changed {changed}: {res['changedSlides']}; unexpected {len(unexpected)}; added {len(added)} views; broken images {len(broken_all)}")
for u in unexpected: print('UNEXPECTED', u)
