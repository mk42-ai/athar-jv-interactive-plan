#!/usr/bin/env python3
"""Athar v1.5.4 terminal worker (fallback for the unavailable delegate/sub-agent tool).
One long-lived job per sub-agent: reads its scoped brief, then executes its queue (/tmp/orch/queue/SAn/NN-*.{py,sh,mjs})
in order as the lead appends steps, logging ISO-8601 UTC start/end + rc for every step. Stops on queue/SAn/DONE or timeout."""
import json, os, subprocess, sys, time, datetime, glob, signal
sa = sys.argv[1]; Q = f'/tmp/orch/queue/{sa}'; LOG = f'/tmp/orch/logs/{sa}.jsonl'; ST = f'/tmp/orch/status/{sa}.json'
iso = lambda: datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
brief = json.load(open(f'/tmp/orch/briefs/{sa}.json'))
state = {'sa': sa, 'title': brief['title'], 'mechanism': 'terminal worker job (setsid python3 worker.py; own process group; hard timeout)',
         'pid': os.getpid(), 'pgid': os.getpgid(0), 'started': iso(), 'ended': None, 'steps': [], 'status': 'running'}
def save():
    json.dump(state, open(ST + '.tmp', 'w'), indent=1); os.replace(ST + '.tmp', ST)
def log(**k):
    k['t'] = iso(); open(LOG, 'a').write(json.dumps(k, ensure_ascii=False) + '\n')
log(ev='start', pid=state['pid'], pgid=state['pgid'], brief=brief['title']); save()
done = set(); deadline = time.time() + float(brief.get('timeout_s', 4 * 3600))
def stop(*_):
    state['status'] = 'terminated'; state['ended'] = iso(); save(); log(ev='terminated'); sys.exit(143)
signal.signal(signal.SIGTERM, stop)
while time.time() < deadline:
    steps = sorted(p for p in glob.glob(Q + '/[0-9][0-9]-*') if p not in done and not p.endswith('.out') and not p.endswith('.err'))
    if not steps:
        if os.path.exists(Q + '/DONE'): break
        time.sleep(2); continue
    p = steps[0]; done.add(p); name = os.path.basename(p)
    cmd = {'.py': ['python3', p], '.sh': ['bash', p], '.mjs': ['/tmp/orch/bin/pw-run.sh', '1500', f'{sa}-{name}', 'node', p]}.get(os.path.splitext(p)[1])
    if not cmd: continue
    rec = {'step': name, 'start': iso()}; log(ev='step-start', step=name); state['steps'].append(rec); save()
    try:
        r = subprocess.run(cmd, cwd='/tmp/orch', stdout=open(p + '.out', 'w'), stderr=open(p + '.err', 'w'), timeout=float(brief.get('step_timeout_s', 1800)))
        rec['rc'] = r.returncode
    except subprocess.TimeoutExpired:
        rec['rc'] = 'timeout'
    rec['end'] = iso(); log(ev='step-end', step=name, rc=rec['rc']); save()
state['status'] = 'done' if os.path.exists(Q + '/DONE') else 'timeout'; state['ended'] = iso(); save(); log(ev='end', status=state['status'])
