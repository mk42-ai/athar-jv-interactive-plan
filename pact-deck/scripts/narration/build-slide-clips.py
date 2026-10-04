#!/usr/bin/env python3
"""Athar deck v1.5.4 — per-slide George narration clips, keyed by stable slide id.

The ten George section clips (NAR-00…NAR-09) are split, frame-exactly and without re-encoding, at the silence between sentences
so that every slide that the audio actually narrates owns exactly one clip. Sentence→slide assignment = the v1.5.3 cue table,
corrected only where the ElevenLabs Scribe transcript + TF-IDF content match proves the cue table wrong (margin >= 0.15 and the
slide's sentences stay contiguous in the clip). Slides with no George sentence get the TTS render of their existing per-slide
script text (George, eleven_multilingual_v2, identical text) — listed in slide-narration.json → source.type == "tts".
Audio samples are never altered: a cut clip is a byte range of whole MPEG-1 Layer III frames of its parent (CBR 128 kbps, 44.1 kHz).
Usage: python3 scripts/narration/build-slide-clips.py --mapping qa/v154/mapping-before.json --tts-dir /path/with/tts-sNN.mp3 [--dist dist]"""
import argparse, json, os, re, struct, hashlib, datetime, collections
ap = argparse.ArgumentParser(); ap.add_argument('--mapping', required=True); ap.add_argument('--tts-dir', required=True); ap.add_argument('--tts-meta', default=None); ap.add_argument('--dist', default='dist')
A = ap.parse_args(); DIST = A.dist
J = lambda p: json.load(open(p, encoding='utf-8'))
mp = J(A.mapping); man = J(os.path.join(DIST, 'narration', 'narration-manifest.json')); script = {s['segmentId']: s for s in J(os.path.join(DIST, 'narration', 'narration-script.json'))}
segs = {s['n']: s for s in man['segments'] if s['segmentId'] != 'intro'}
dom = {s['n']: s['slideId'] for s in mp['slides']}
FD = 1152 / 44100.0; BR = {9: 128}
def frames(b):
    off = 0
    if b[:3] == b'ID3': off = 10 + ((b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9])
    out = []; i = off
    while i + 4 <= len(b):
        h = struct.unpack('>I', b[i:i + 4])[0]
        if (h >> 21) & 0x7ff != 0x7ff: break
        bri = (h >> 12) & 15; pad = (h >> 9) & 1
        if bri not in BR or ((h >> 10) & 3) != 0: raise SystemExit('unexpected frame header (not CBR 128k/44.1k)')
        L = 144 * 128000 // 44100 + pad; out.append((i, L)); i += L
    if out and (b'Info' in b[out[0][0]:out[0][0] + out[0][1]] or b'Xing' in b[out[0][0]:out[0][0] + out[0][1]]): out = out[1:]   # drop the LAME/Info header frame (no audio)
    return out
sha = lambda b: hashlib.sha256(b).hexdigest()
# 1 · final sentence → slide assignment
final = []
for c in mp['clips']:
    rows = c['cues']
    for r in rows:
        tgt = r['cueSlide']
        if r['verifiedSlide'] != r['cueSlide'] and (r['tfidfBest'] - r['tfidfAssigned']) >= 0.15: tgt = r['verifiedSlide']
        r['finalSlide'] = tgt
    # contiguity: a slide's sentences must be consecutive; otherwise revert the reassignment
    for r in rows:
        if r['finalSlide'] != r['cueSlide']:
            idx = [k for k, x in enumerate(rows) if x['finalSlide'] == r['finalSlide']]
            if idx != list(range(idx[0], idx[-1] + 1)): r['finalSlide'] = r['cueSlide']
    final.append(c)
# 2 · cut
os.makedirs(os.path.join(DIST, 'audio', 'guide', 'slides'), exist_ok=True)
slides = {}
for c in final:
    b = open(os.path.join(DIST, c['file'].lstrip('/')), 'rb').read(); fr = frames(b); dur = len(fr) * FD
    groups = []
    for r in c['cues']:
        if groups and groups[-1]['slide'] == r['finalSlide']: groups[-1]['rows'].append(r)
        else: groups.append({'slide': r['finalSlide'], 'rows': [r]})
    for k, g in enumerate(groups):
        s0 = g['rows'][0]['scribeStart']; e0 = g['rows'][-1]['scribeEnd']
        start = 0.0 if k == 0 else (groups[k - 1]['rows'][-1]['scribeEnd'] + s0) / 2
        end = dur if k == len(groups) - 1 else (e0 + groups[k + 1]['rows'][0]['scribeStart']) / 2
        fa = max(0, int(round(start / FD))); fb = min(len(fr), int(round(end / FD)))
        data = b''.join(b[o:o + L] for o, L in fr[fa:fb]); n = g['slide']; sid = dom[n]
        name = 'NAR-s%02d-%s.mp3' % (n, sid); open(os.path.join(DIST, 'audio', 'guide', 'slides', name), 'wb').write(data)
        t0 = fa * FD
        slides[n] = {'n': n, 'slideId': sid, 'clipId': 'NAR-s%02d' % n, 'file': '/audio/guide/slides/' + name, 'bytes': len(data), 'sha256': sha(data),
                     'durationSec': round((fb - fa) * FD, 3), 'section': segs[n].get('section'), 'sectionAr': segs[n].get('sectionAr'),
                     'source': {'type': 'cut', 'parentClip': c['clipId'], 'parentFile': c['file'], 'parentSha256': c['sha256'], 'startSec': round(t0, 3), 'endSec': round(fb * FD, 3),
                                'frames': [fa, fb], 'note': 'byte range of whole MPEG frames of the parent clip — no re-encoding'},
                     'text': ' '.join(r['cueText'] for r in g['rows']),
                     'cues': [{'i': j + 1, 'text': r['cueText'], 'start': round(max(0.0, r['scribeStart'] - t0), 2), 'end': round(max(0.0, r['scribeEnd'] - t0), 2), 'anchor': r['anchor'],
                               'fromCue': c['clipId'] + '#' + str(r['cue']), 'cueTableSlide': r['cueSlide']} for j, r in enumerate(g['rows'])]}
# 3 · TTS renders for slides the George audio does not narrate
meta = J(A.tts_meta) if A.tts_meta and os.path.exists(A.tts_meta) else {}
for n in range(1, 40):
    if n in slides: continue
    p = os.path.join(A.tts_dir, 'tts-s%02d.mp3' % n)
    if not os.path.exists(p): print('MISSING TTS for slide', n); continue
    b = open(p, 'rb').read(); fr = frames(b); sid = dom[n]; name = 'NAR-s%02d-%s.mp3' % (n, sid)
    open(os.path.join(DIST, 'audio', 'guide', 'slides', name), 'wb').write(b)
    sc = script['s%02d' % n]
    slides[n] = {'n': n, 'slideId': sid, 'clipId': 'NAR-s%02d' % n, 'file': '/audio/guide/slides/' + name, 'bytes': len(b), 'sha256': sha(b), 'durationSec': round(len(fr) * FD, 3),
                 'section': segs[n].get('section'), 'sectionAr': segs[n].get('sectionAr'),
                 'source': {'type': 'tts', 'voice': 'George', 'voiceId': 'JBFqnCBsd6RMkjVDRZzb', 'modelId': 'eleven_multilingual_v2', 'outputFormat': 'mp3_44100_128',
                            'textSource': 'dist/narration/narration-script.json ' + sc['segmentId'] + ' (identical text)', **(meta.get(str(n)) or {})},
                 'text': sc['text'], 'cues': []}
out = {'schema': 'athar.narration.slides/1', 'version': 'v1.5.4', 'generated_utc': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
       'keyedBy': 'data-slide-id (stable section id) — never by slide index', 'voice': 'George - Warm, Captivating Storyteller', 'voiceId': 'JBFqnCBsd6RMkjVDRZzb', 'modelId': 'eleven_multilingual_v2',
       'slides': [slides[n] for n in sorted(slides)]}
json.dump(out, open(os.path.join(DIST, 'narration', 'slide-narration.json'), 'w'), ensure_ascii=False, indent=1)
for s in out['slides']: print(s['n'], s['clipId'], s['slideId'].ljust(28), s['source']['type'], '%.2fs' % s['durationSec'], s['source'].get('parentClip', ''), s['source'].get('startSec', ''), s['source'].get('endSec', ''), '|', s['text'][:60])
print(len(out['slides']), 'slides,', collections.Counter(s['source']['type'] for s in out['slides']))
