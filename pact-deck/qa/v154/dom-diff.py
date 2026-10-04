#!/usr/bin/env python3
"""Zero-copy-change proof: normalised visible text of every slide, EN + AR, v1.5.3 workspace baseline vs v1.5.4. Usage: python3 dom-diff.py <base.json> <new.json> <out.json>"""
import json, sys, difflib, hashlib
a, b, out = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])), sys.argv[3]
rows = []; changed = 0
for lang in ('en', 'ar'):
    A = {r['n']: r for r in a['slides'][lang]}; B = {r['n']: r for r in b['slides'][lang]}
    for n in range(1, 40):
        ta, tb = A[n]['text'], B[n]['text']; same = ta == tb
        d = [] if same else [x for x in difflib.unified_diff(ta.split(' '), tb.split(' '), lineterm='', n=0) if not x.startswith(('---', '+++', '@@'))][:20]
        changed += 0 if same else 1
        rows.append({'lang': lang, 'n': n, 'slideId': B[n]['id'], 'chars': len(tb), 'sha256_v153': hashlib.sha256(ta.encode()).hexdigest()[:16], 'sha256_v154': hashlib.sha256(tb.encode()).hexdigest()[:16], 'identical': same, 'diff': d})
json.dump({'baseline': a.get('base'), 'candidate': b.get('base'), 'slidesCompared': len(rows), 'slidesChanged': changed, 'rows': rows}, open(out, 'w'), ensure_ascii=False, indent=1)
print('compared', len(rows), 'slide views (39 × EN/AR); changed:', changed)
for r in rows:
    if not r['identical']: print(r['lang'], r['n'], r['slideId'], r['diff'][:6])
