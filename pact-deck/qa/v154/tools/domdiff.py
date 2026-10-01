import json, difflib, re, sys
B = json.load(open(sys.argv[1] if len(sys.argv) > 1 else '/tmp/orch/out/SA10/dom-before.json'))
A = json.load(open(sys.argv[2] if len(sys.argv) > 2 else '/tmp/orch/out/SA10/dom-after.json'))
def key(v): return (v['lang'], v['n'])
bm = {key(v): v for v in B['views']}; am = {key(v): v for v in A['views']}
def imgset(v): return [(i['attrSrc'], i['alt']) for i in v['imgs']]
res = {'views': [], 'summary': {}}
tot_text = tot_tc = tot_img = 0
for k in sorted(bm):
    b, a = bm[k], am.get(k)
    if not a: continue
    row = {'lang': k[0], 'n': k[1], 'id': a['id']}
    sm = difflib.SequenceMatcher(None, b['text'], a['text'])
    row['text_equal'] = b['text'] == a['text']
    row['text_ops'] = [(op, b['text'][i1:i2], a['text'][j1:j2]) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
    row['textContent_equal'] = b['textContent'] == a['textContent']
    smc = difflib.SequenceMatcher(None, b['textContent'], a['textContent'], autojunk=False)
    row['textContent_ops'] = [(op, b['textContent'][i1:i2][:160], a['textContent'][j1:j2][:160]) for op, i1, i2, j1, j2 in smc.get_opcodes() if op != 'equal'][:12]
    bi, ai = imgset(b), imgset(a)
    row['img_removed'] = [x for x in bi if x not in ai]; row['img_added'] = [x for x in ai if x not in bi]
    row['footer_equal'] = b['footer'] == a['footer']; row['footer_ops'] = [] if row['footer_equal'] else [(b['footer'], a['footer'])]
    row['tabs'] = []
    for tb, ta in zip(b.get('tabs', []), a.get('tabs', [])):
        row['tabs'].append({'k': tb['k'], 'text_equal': tb['text'] == ta['text'], 'ops': [(op, tb['text'][i1:i2], ta['text'][j1:j2]) for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, tb['text'], ta['text']).get_opcodes() if op != 'equal'],
                            'img_removed': [x for x in [(i['attrSrc'], i['alt']) for i in tb['imgs']] if x not in [(i['attrSrc'], i['alt']) for i in ta['imgs']]],
                            'img_added': [x for x in [(i['attrSrc'], i['alt']) for i in ta['imgs']] if x not in [(i['attrSrc'], i['alt']) for i in tb['imgs']]]})
    tot_text += 0 if row['text_equal'] else 1; tot_tc += 0 if row['textContent_equal'] else 1; tot_img += 1 if (row['img_removed'] or row['img_added']) else 0
    res['views'].append(row)
res['summary'] = {'views': len(res['views']), 'rendered_text_changed_views': tot_text, 'textContent_changed_views': tot_tc, 'img_changed_views': tot_img, 'before': B['generated'], 'after': A['generated']}
json.dump(res, open('/tmp/orch/out/SA10/domdiff.json', 'w'), indent=1, ensure_ascii=False)
print(json.dumps(res['summary']))
for r in res['views']:
    if not r['text_equal'] or not r['textContent_equal'] or r['img_removed'] or r['img_added'] or not r['footer_equal'] or any(not t['text_equal'] or t['img_removed'] or t['img_added'] for t in r['tabs']):
        print(f"== {r['lang']} s{r['n']} {r['id']}")
        for op in r['text_ops'][:6]: print('   TEXT', op[0], repr(op[1][:120]), '->', repr(op[2][:120]))
        if r['textContent_equal'] is False and r['text_equal']: 
            for op in r['textContent_ops'][:4]: print('   TC  ', op[0], repr(op[1][:100]), '->', repr(op[2][:100]))
        for x in r['img_removed'][:4]: print('   IMG-', x[0], '|', (x[1] or '')[:70])
        for x in r['img_added'][:4]: print('   IMG+', x[0], '|', (x[1] or '')[:70])
        for op in r['footer_ops']: print('   FOOTER', op)
        for t in r['tabs']:
            if not t['text_equal'] or t['img_removed'] or t['img_added']: print('   TAB', t['k'], [ (o[0], o[1][:60], o[2][:60]) for o in t['ops'][:3]], 'img-', [x[0] for x in t['img_removed']], 'img+', [x[0] for x in t['img_added']])
