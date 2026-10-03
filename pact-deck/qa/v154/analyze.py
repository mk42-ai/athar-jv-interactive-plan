#!/usr/bin/env python3
"""Score every checkpoint of a repro run: did the deck land where the user went, and is the audible narration about the slide on screen?
Section clips (v1.5.3) are resolved to the sentence being spoken via the Scribe word timings (mapping-before.json → verifiedSlide);
per-slide clips (v1.5.4) carry their slide id. Usage: python3 analyze.py <run-dir> [mapping.json] [slide-narration.json]"""
import json, sys, os, collections
run = sys.argv[1]; mp = json.load(open(sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), 'mapping-before.json')))
sn = None
try: sn = json.load(open(sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(__file__), '..', '..', 'dist', 'narration', 'slide-narration.json')))
except Exception: pass
byclip = {c['clipId']: c for c in mp['clips']}; ids = {s['n']: s['slideId'] for s in mp['slides']}; n_of = {v: k for k, v in ids.items()}
perslide = {s['clipId']: s for s in (sn or {}).get('slides', [])}
def narrated(audio):
    if not audio: return None, None
    c = audio.get('clip'); t = audio.get('t') or 0
    if c in perslide: return perslide[c]['n'], 'clip ' + c
    if c in byclip:
        rows = byclip[c]['cues']; cur = rows[0]
        for r in rows:
            if r['scribeStart'] is not None and t >= r['scribeStart'] - 0.15: cur = r
        return cur['verifiedSlide'], '%s#%d "%s"' % (c, cur['cue'], cur['cueText'][:48])
    return None, c
M = json.load(open(os.path.join(run, 'marks.json')))
rows = []; tally = collections.Counter()
for m in M['marks']:
    if m.get('step') == 'ERROR': rows.append({**m, 'verdict': 'HARNESS-ERROR'}); tally['HARNESS-ERROR'] += 1; continue
    vis = m['vis']['n']; exp = m.get('expect'); a = m.get('audio'); g = m.get('guide') or {}
    nn, what = narrated(a); state = g.get('state')
    deck_ok = (exp is None) or (vis == exp)
    if 'no gesture' in m['step']:
        tap = g.get('tap') or state == 'blocked'
        v = 'PASS' if (not a and tap and deck_ok) else ('AUTOPLAY-WITHOUT-GESTURE' if a else ('NO-TAP-TO-PLAY' if not tap else 'DECK-MOVED'))
    elif 'AUTO off +' in m['step']:
        v = 'PASS' if deck_ok and (not a or nn == vis) else ('DECK-MOVED-WITH-AUTO-OFF' if not deck_ok else 'WRONG-PAGE')
    elif not deck_ok: v = 'DECK-JUMPED'
    elif not a: v = 'PASS' if ('AUTO' in m['step'] and state in ('ended', 'loading')) else 'SILENT'
    elif nn != vis: v = 'WRONG-PAGE'
    else: v = 'PASS'
    tally[v] += 1
    rows.append({'t': m['t'], 'scenario': m['scenario'], 'step': m['step'], 'expect': exp, 'visible': vis, 'visibleId': m['vis']['id'], 'dataSlideId': m['vis'].get('slideId'),
                 'audible': (a or {}).get('clip'), 'audioT': (a or {}).get('t'), 'narrates': nn, 'what': what, 'state': state, 'cc': (m.get('cc') or '')[:70], 'verdict': v})
json.dump({'run': M.get('label'), 'base': M.get('base'), 'tally': dict(tally), 'rows': rows, 'consoleErrors': M.get('console', [])}, open(os.path.join(run, 'verdicts.json'), 'w'), ensure_ascii=False, indent=1)
for r in rows:
    if r['verdict'] != 'PASS': print(r['t'][11:19], r['scenario'][:24].ljust(24), str(r.get('step'))[:36].ljust(36), 'exp', r.get('expect'), 'vis', r.get('visible'), '| audible', r.get('what'), '| ', r['verdict'])
print(dict(tally), 'console errors', len(M.get('console', [])))
