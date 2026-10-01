#!/usr/bin/env python3
"""v1.5.4 full UI validation: ui-validator's ui_validate.py on all 39 slides × desktop 1728×872 + phone 390×844 against the live preview.
Per view: overflow, clipped text, broken images, console/page errors, guide-bar overlap with footer / chevrons / dots / rail / top controls,
44 px bar targets, stage not under the bar, visible slide == expected slide id, guide started (Guide toggle clicked) and narrating the
visible slide. Usage: python3 run-validator.py <previewUrl> [workers]"""
import json, os, subprocess, sys, concurrent.futures as cf, time
HERE = os.path.dirname(os.path.abspath(__file__)); BASE = sys.argv[1].rstrip('/'); W = int(sys.argv[2]) if len(sys.argv) > 2 else 4
SKILL = '/home/appuser/.agents/skills/ui-validator/scripts/ui_validate.py'
CHECK = open(os.path.join(HERE, 'ui-check.js')).read()
TABLE = json.load(open(os.path.join(HERE, '..', '..', '..', 'dist', 'narration', 'slide-narration.json')))
WS = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', '..'))   # the session working directory (screenshots → ./.ui-proof)
hashFor = lambda n: '#/%d' % n if n <= 27 else ('#/28' if n == 39 else '#/27/new-%d' % (n - 27))
def job(args):
    s, (vp, tag) = args; n = s['n']
    cmd = ['python3', SKILL, '--url', BASE + '/' + hashFor(n), '--label', 'v154-s%02d-%s' % (n, tag), '--wait-selector', '#athar-narration', '--wait-ms', '2600', '--timeout', '60',
           '--viewport', vp, '--viewport-only', '--eval', CHECK,
           '--eval', "window.AtharGuide && window.AtharGuide.slideId === '%s'" % s['slideId'],
           '--eval', "document.documentElement.getAttribute('data-deck-version') === '1.5.4' && /v1\\.5\\.4/.test((document.querySelector('footer.pagefooter .deck-version') || {}).textContent || '')",
           # ui_validate clicks via el.click() (no user activation) → Chromium's autoplay policy rejects play(): the guide must land in
           # 'blocked' with the visible tap-to-play control (or loading/playing if the browser allows it), keyed to the visible slide
           '--eval', "(['loading','playing'].includes(window.AtharGuide.state) || (window.AtharGuide.state === 'blocked' && !!document.querySelector('[data-testid=\"guide-tap-to-play\"]:not([hidden])') && document.querySelector('[data-testid=\"guide-tap-to-play\"]').getBoundingClientRect().width >= 44)) && document.querySelector('#athar-narration').getAttribute('data-slide-id') === '%s'" % s['slideId']]
    if n == 1: cmd += ['--click', '.intro-skip']
    cmd += ['--click', '[data-testid="guide-toggle"]']
    t0 = time.time(); p = subprocess.run(cmd, capture_output=True, text=True, cwd=WS, timeout=400)
    try: rep = json.loads(p.stdout)
    except Exception: rep = {'ok': False, 'error': 'no JSON: ' + p.stderr[-300:]}
    rep['_exit'] = p.returncode; rep['_secs'] = round(time.time() - t0, 1); rep['_n'] = n; rep['_slideId'] = s['slideId']; rep['_viewport'] = vp
    json.dump(rep, open(os.path.join(HERE, 'reports', 'v154-s%02d-%s.json' % (n, tag)), 'w'), ensure_ascii=False, indent=1)
    fails = [a for a in rep.get('assertions', []) if not a.get('ok')]
    return n, tag, rep.get('ok'), p.returncode, [(a['kind'], str(a['target'])[:40], str(a['detail'])[:80]) for a in fails], rep.get('consoleErrors', [])[:2], rep.get('error')
os.makedirs(os.path.join(HERE, 'reports'), exist_ok=True)
jobs = [(s, v) for s in TABLE['slides'] for v in (('1728x872', 'desktop'), ('390x844', 'phone'))]
res = []
with cf.ThreadPoolExecutor(max_workers=W) as ex:
    for r in ex.map(job, jobs):
        res.append(r); print(('PASS' if r[2] else 'FAIL'), 's%02d' % r[0], r[1], 'exit', r[3], r[4] if r[4] else '', r[5] if r[5] else '', r[6] or '', flush=True)
summary = {'base': BASE, 'finished': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'views': len(res), 'pass': sum(1 for r in res if r[2]), 'fail': sum(1 for r in res if not r[2]),
           'rows': [{'n': r[0], 'viewport': r[1], 'ok': bool(r[2]), 'exit': r[3], 'failed': r[4], 'console': r[5], 'error': r[6]} for r in sorted(res)]}
json.dump(summary, open(os.path.join(HERE, 'validator-summary.json'), 'w'), ensure_ascii=False, indent=1)
print('views', summary['views'], 'pass', summary['pass'], 'fail', summary['fail'])
