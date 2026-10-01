#!/usr/bin/env python3
"""Athar deck v1.5.4 — verify every per-slide clip with its ElevenLabs Scribe transcript and time its CC sentences from the audio.
For each slide: Scribe text vs the slide's narration text (difflib over normalised tokens) → ratio; canonical sentences (the unchanged
narration text) are aligned onto the Scribe word stream → cue start/end. Writes the cues + a `scribe` block into
dist/narration/slide-narration.json and the per-slide verdicts to qa/v154/scribe/slide-clips-verified.json.
Usage: python3 scripts/narration/verify-slide-clips.py [--dist dist] [--raw qa/v154/scribe/slides]"""
import argparse, json, os, re, difflib, collections, datetime
ap = argparse.ArgumentParser(); ap.add_argument('--dist', default='dist'); ap.add_argument('--raw', default='qa/v154/scribe/slides'); A = ap.parse_args()
P = os.path.join(A.dist, 'narration', 'slide-narration.json'); tab = json.load(open(P, encoding='utf-8'))
NUM = {'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10', 'hundred': '00', 'thirty': '30', 'twelve': '12'}
def toks(t):
    t = t.lower().replace('one hundred', '100').replace('ai rev', 'airev').replace('aerev', 'airev').replace('arev', 'airev').replace('ethar', 'athar').replace('a gentick', 'agentic').replace('licenses', 'licences').replace('$', '').replace('—', ' ').replace('-', ' ')
    return [NUM.get(w, w) for w in re.findall(r"[a-z0-9&]+(?:\.[0-9]+)?", t)]
def ratio(a, b): return round(difflib.SequenceMatcher(None, toks(a), toks(b), autojunk=False).ratio(), 3)
def split_sentences(text): return [s.strip() for s in re.split(r'(?<=[.!?])\s+(?=[A-Z0-9“"(])', text.strip()) if s.strip()]
def align(sents, words):
    W = [w for w in words if w['type'] == 'word']; wt, wi = [], []
    for i, w in enumerate(W):
        for t in toks(w['text']): wt.append(t); wi.append(i)
    ct, ci = [], []
    for k, s in enumerate(sents):
        for t in toks(s): ct.append(t); ci.append(k)
    sm = difflib.SequenceMatcher(None, ct, wt, autojunk=False); hit = collections.defaultdict(list)
    for a, b, size in sm.get_matching_blocks():
        for o in range(size): hit[ci[a + o]].append(wi[b + o])
    out = []
    for k in range(len(sents)):
        h = sorted(set(hit[k])); out.append((W[h[0]]['start'], W[h[-1]]['end']) if h else None)
    # fill gaps (unmatched sentences) by interpolation
    for k, v in enumerate(out):
        if v is None:
            prev_end = next((out[j][1] for j in range(k - 1, -1, -1) if out[j]), 0.0); nxt = next((out[j][0] for j in range(k + 1, len(out)) if out[j]), W[-1]['end'] if W else 0.0)
            out[k] = (prev_end, nxt)
    return out
rows = []
for s in tab['slides']:
    raw = json.load(open(os.path.join(A.raw, s['clipId'] + '.raw.json'))); a = raw['data']['answer']
    j = json.loads(re.search(r"```json\s*(\{.*\})\s*```", a, re.S).group(1))
    if s['source']['type'] == 'cut': sents = [c['text'] for c in s['cues']]; anchors = [c.get('anchor') for c in s['cues']]
    else: sents = split_sentences(s['text']); anchors = [None] * len(sents)
    al = align(sents, j['words']); r = ratio(j['text'], ' '.join(sents)); dur = s['durationSec']
    s['cues'] = [dict({'i': k + 1, 'text': t, 'start': round(max(0.0, al[k][0]), 2), 'end': round(min(dur, al[k][1]), 2)}, **({'anchor': anchors[k]} if anchors[k] else {})) for k, t in enumerate(sents)]
    s['scribe'] = {'transcriptionId': j.get('transcription_id'), 'model': 'scribe_v1 (requested)', 'language': j.get('language_code'), 'languageProbability': j.get('language_probability'),
                   'audioDurationSec': j.get('audio_duration_secs'), 'ratioVsNarrationText': r, 'transcript': j.get('text'), 'utc': raw.get('_utc')}
    verdict = 'OK' if r >= 0.9 else ('CHECK' if r >= 0.8 else 'WRONG')
    rows.append({'n': s['n'], 'slideId': s['slideId'], 'clipId': s['clipId'], 'source': s['source']['type'], 'durationSec': dur, 'scribeDurationSec': j.get('audio_duration_secs'), 'ratio': r, 'verdict': verdict, 'transcriptionId': j.get('transcription_id'), 'transcript': j.get('text')})
tab['generated_utc'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'); tab['verifiedBy'] = 'ElevenLabs Scribe (speechToText, model scribe_v1 requested, language en) on every per-slide clip'
json.dump(tab, open(P, 'w'), ensure_ascii=False, indent=1)
json.dump({'generated': tab['generated_utc'], 'rows': rows, 'summary': dict(collections.Counter(r['verdict'] for r in rows))}, open('qa/v154/scribe/slide-clips-verified.json', 'w'), ensure_ascii=False, indent=1)
for r in rows: print(r['n'], r['clipId'], r['slideId'].ljust(28), r['source'], '%.2f/%.2f' % (r['durationSec'], r['scribeDurationSec']), r['ratio'], r['verdict'])
print(collections.Counter(r['verdict'] for r in rows))
