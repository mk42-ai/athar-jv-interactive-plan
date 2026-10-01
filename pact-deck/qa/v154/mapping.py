#!/usr/bin/env python3
"""Clip-mapping verification (v1.5.4): ElevenLabs Scribe transcripts (word timestamps) vs slide ids (DOM text), cues.json and the guide scripts.
Every cue is aligned onto the Scribe word stream (difflib over normalised tokens), so its true start/end come from the audio; every sentence
is scored against the slides of its own section with TF-IDF cosine on the slides' visible EN text. Usage: python3 mapping.py <dom-text.json> <out.json>"""
import json, re, sys, difflib, os, math, collections, datetime
HERE = os.path.dirname(os.path.abspath(__file__)); DIST = os.path.join(HERE, '..', '..', 'dist'); REPO = os.path.join(HERE, '..', '..', '..')
J = lambda p: json.load(open(p, encoding='utf-8'))
scribe = J(os.path.join(HERE, 'scribe', 'scribe-transcripts.json'))
cues = {c['clipId']: c for c in J(os.path.join(DIST, 'narration', 'cues.json'))['clips']}
clipmap = {c['clipId']: c for c in J(os.path.join(DIST, 'narration', 'clip-map.json'))['clips']}
man = J(os.path.join(DIST, 'narration', 'narration-manifest.json'))
segs = {s['n']: s for s in man['segments'] if s['segmentId'] != 'intro'}
script = {s['segmentId']: s for s in J(os.path.join(DIST, 'narration', 'narration-script.json'))}
gs = J(os.path.join(REPO, 'guide-script.json')); gsteps = [(f"slide {p['n']} · {st['id']}", st['text']) for p in gs for st in p.get('steps', [])]
dom = J(sys.argv[1]); out = sys.argv[2]; domtext = {r['n']: r for r in dom['slides']['en']}
NUM = {'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10', 'hundred': '00'}
def toks(t):
    t = t.lower().replace('one hundred', '100').replace('ai rev', 'airev').replace('aerev', 'airev').replace('arev', 'airev').replace('ethar', 'athar').replace('a gentick', 'agentic').replace('licenses', 'licences').replace('$', '')
    return [NUM.get(w, w) for w in re.findall(r"[a-z0-9&]+(?:\.[0-9]+)?", t)]
def ratio(a, b): return round(difflib.SequenceMatcher(None, toks(a), toks(b), autojunk=False).ratio(), 3)
STOP = set('a an the and or of to in on for by with from at is are be its it as that this so every each one into across through not no can how we our your you who what when where which their they them all any than then there here also'.split())
docs = {n: [w for w in toks(domtext[n]['text']) if w not in STOP and len(w) > 2] for n in range(1, 40)}
df = collections.Counter(w for d in docs.values() for w in set(d)); N = len(docs)
idf = {w: math.log((N + 1) / (c + 0.5)) for w, c in df.items()}
def vec(ws):
    c = collections.Counter(w for w in ws if w in idf); return {w: (1 + math.log(k)) * idf[w] for w, k in c.items()}
dvec = {n: vec(d) for n, d in docs.items()}
def cos(a, b):
    num = sum(v * b.get(w, 0) for w, v in a.items()); da = math.sqrt(sum(v * v for v in a.values())); db = math.sqrt(sum(v * v for v in b.values()))
    return round(num / (da * db), 3) if da and db else 0.0
def align(cl, words):
    """map every cue onto the Scribe word stream; returns [(start,end,ratio,scribe_text)] per cue"""
    W = [w for w in words if w['type'] == 'word']; wt = []; wi = []
    for i, w in enumerate(W):
        for t in toks(w['text']): wt.append(t); wi.append(i)
    ct = []; ci = []
    for k, q in enumerate(cl):
        for t in toks(q['text']): ct.append(t); ci.append(k)
    sm = difflib.SequenceMatcher(None, ct, wt, autojunk=False); hit = collections.defaultdict(list)
    for a, b, size in sm.get_matching_blocks():
        for o in range(size): hit[ci[a + o]].append(wi[b + o])
    res = []
    for k, q in enumerate(cl):
        h = sorted(set(hit[k]))
        if not h: res.append(None); continue
        s, e = W[h[0]]['start'], W[h[-1]]['end']; txt = ' '.join(W[i]['text'] for i in range(h[0], h[-1] + 1))
        res.append((s, e, ratio(txt, q['text']), txt))
    return res
clips_out = []; sent_by_slide = collections.defaultdict(list); reassigned = []
for cid in sorted(scribe):
    sc = scribe[cid]; cl = cues[cid]['cues']; cm = clipmap[cid]; al = align(cl, sc['words'])
    secSlides = sorted(n for n, s in segs.items() if s.get('clipId') == cid)
    rows = []
    for q, a in zip(cl, al):
        sv = vec([w for w in toks(q['text']) if w not in STOP and len(w) > 2])
        score = {m: cos(sv, dvec[m]) for m in secSlides}; ranked = sorted(score, key=score.get, reverse=True)
        best = ranked[0]; intro = bool(re.match(r'(?i)section \w+[,:]', q['text'])) and len(toks(q['text'])) <= 8
        verdict_slide = q['slide']
        if intro: verdict_slide = secSlides[0]
        elif best != q['slide'] and score[best] - score.get(q['slide'], 0) >= 0.05: verdict_slide = best
        r = {'cue': q['i'], 'anchor': q['anchor'], 'cueSlide': q['slide'], 'verifiedSlide': verdict_slide, 'cueText': q['text'],
             'scribeText': a[3] if a else None, 'textRatio': a[2] if a else 0.0,
             'cueStart': q['start'], 'cueEnd': q['end'], 'scribeStart': a[0] if a else None, 'scribeEnd': a[1] if a else None,
             'driftStart': round(q['start'] - a[0], 2) if a else None, 'driftEnd': round(q['end'] - a[1], 2) if a else None,
             'tfidfAssigned': score.get(q['slide'], 0.0), 'tfidfBest': score[best], 'bestSlide': best, 'sectionIntro': intro}
        rows.append(r); sent_by_slide[verdict_slide].append({'clip': cid, **r})
        if verdict_slide != q['slide']: reassigned.append({'clip': cid, 'cue': q['i'], 'from': q['slide'], 'to': verdict_slide, 'text': q['text'][:90], 'tfidf': [score.get(q['slide'], 0.0), score[best]]})
    gbest = max(gsteps, key=lambda g: ratio(sc['text'], g[1]))
    clips_out.append({'clipId': cid, 'section': cues[cid]['section'], 'file': cm['file'], 'sha256': cm['sha256'], 'transcriptionId': sc.get('transcription_id'),
        'scribeDurationSec': sc['audio_duration_secs'], 'localDurationSec': cues[cid]['durationSec'], 'language': sc['language_code'], 'languageProbability': sc['language_probability'],
        'words': sum(1 for w in sc['words'] if w['type'] == 'word'), 'scribeText': sc['text'], 'elevenLabsHistoryText': cm['text'],
        'ratioVsHistoryText': ratio(sc['text'], cm['text']), 'ratioVsCuesText': ratio(sc['text'], ' '.join(q['text'] for q in cl)),
        'ratioVsManifestText': ratio(sc['text'], segs[secSlides[0]]['text']), 'manifestSlides': secSlides, 'cueSlides': sorted(set(q['slide'] for q in cl)),
        'repoGuideScriptBest': {'step': gbest[0], 'ratio': ratio(sc['text'], gbest[1])},
        'maxAbsTimingDriftSec': max([abs(r['driftStart'] or 0) for r in rows] + [abs(r['driftEnd'] or 0) for r in rows]), 'cues': rows})
slides = []
for n in range(1, 40):
    sg = segs[n]; own = sent_by_slide.get(n, []); old = [r for c in clips_out for r in c['cues'] if r['cueSlide'] == n]
    sid = (script.get('s%02d' % n) or {})
    gsb = max(gsteps, key=lambda g: ratio(sid.get('text') or '', g[1]))
    notes = []
    if not old: verdict = 'MISSING'; notes.append('no George sentence for this slide in any clip')
    elif not own: verdict = 'MIS-MAPPED'; notes.append('cue table points here, but Scribe/TF-IDF shows the audio narrates slide ' + ','.join(str(r['verifiedSlide']) for r in old))
    else:
        verdict = 'OK'
        drift = [r for r in own if abs(r['driftStart'] or 0) > 0.4 or abs(r['driftEnd'] or 0) > 0.4]
        if drift: verdict = 'STALE'; notes.append('cue timing off the audio by up to %.2f s' % max(max(abs(r['driftStart'] or 0), abs(r['driftEnd'] or 0)) for r in drift))
        gained = [r for r in own if r['cueSlide'] != n]
        if gained: notes.append('also narrated by cue(s) mis-assigned to slide ' + ','.join(str(r['cueSlide']) for r in gained))
    slides.append({'n': n, 'slideId': domtext[n]['id'], 'manifestSlideId': sg['slideId'], 'sectionClip': sg.get('clipId'), 'section': sg.get('section'),
                   'cueTableSentences': [f"{r['anchor']}" for r in old], 'verifiedSentences': [f"{r['clip']}#{r['cue']} {r['scribeStart']:.2f}–{r['scribeEnd']:.2f} s" for r in own],
                   'verdict': verdict, 'notes': notes, 'scriptText': sid.get('text'), 'scriptStatus': sid.get('status'), 'scriptVoiceId': sid.get('voiceId'),
                   'repoGuideScriptBest': {'step': gsb[0], 'ratio': ratio(sid.get('text') or '', gsb[1])}})
res = {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'method': __doc__, 'clips': clips_out, 'slides': slides, 'reassigned': reassigned,
       'summary': dict(collections.Counter(s['verdict'] for s in slides))}
json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1)
for c in clips_out:
    print(c['clipId'], c['section'].ljust(24), 'Scribe %.2fs' % c['scribeDurationSec'], 'vsHistory', c['ratioVsHistoryText'], 'vsCues', c['ratioVsCuesText'], 'maxDrift', c['maxAbsTimingDriftSec'], 'repoGuide', c['repoGuideScriptBest']['ratio'])
    for r in c['cues']: print('    #%d cue→s%d verified→s%d ratio %.2f  cue %.2f–%.2f  scribe %.2f–%.2f  tfidf %.2f/%.2f(best s%d) %s' % (r['cue'], r['cueSlide'], r['verifiedSlide'], r['textRatio'], r['cueStart'], r['cueEnd'], r['scribeStart'] or -1, r['scribeEnd'] or -1, r['tfidfAssigned'], r['tfidfBest'], r['bestSlide'], r['cueText'][:60]))
print(res['summary']); print('reassigned', json.dumps(reassigned, indent=0)[:1500])
print('needs audio:', [s['n'] for s in slides if s['verdict'] in ('MISSING', 'MIS-MAPPED')])
