import json, sys, os, importlib.util
sys.argv = ['run-validator.py', 'https://sb-4koagr3m5c3y.vercel.run', '1']
src = open('run-validator.py').read().split("os.makedirs(os.path.join(HERE, 'reports'), exist_ok=True)")[0]
exec(compile(src, 'run-validator.py', 'exec'))
want = [(int(x.split('-')[0]), x.split('-')[1]) for x in os.environ['ONLY'].split(',')]
summ = json.load(open(os.path.join(HERE, 'validator-summary.json')))
for s in TABLE['slides']:
    for vp, tag in (('1728x872', 'desktop'), ('390x844', 'phone')):
        if (s['n'], tag) not in want: continue
        r = job((s, (vp, tag))); print(('PASS' if r[2] else 'FAIL'), 's%02d' % r[0], r[1], 'exit', r[3], r[4], r[5], r[6] or '', flush=True)
        for row in summ['rows']:
            if row['n'] == r[0] and row['viewport'] == r[1]: row.update({'ok': bool(r[2]), 'exit': r[3], 'failed': r[4], 'console': r[5], 'error': r[6], 'rerun': True})
summ['pass'] = sum(1 for x in summ['rows'] if x['ok']); summ['fail'] = sum(1 for x in summ['rows'] if not x['ok'])
json.dump(summ, open(os.path.join(HERE, 'validator-summary.json'), 'w'), ensure_ascii=False, indent=1); print('views', summ['views'], 'pass', summ['pass'], 'fail', summ['fail'])
