#!/usr/bin/env python3
"""Athar deck v1.7.1 — extract the Athar colour tokens from the brand guidelines PDF text layer (no hand-typed HEX).

Usage: python3 scripts/v1.7.1/extract_brand_tokens.py <Athar_Brand_Guidelines_FINAL.pdf> [out.json]

Reads Chapter 3 of "Athar Brand Guidelines V2.2 — LOGO CONSISTENCY VERIFIED — FINAL" (Table 3.1 palette, 3.2 proportion of use,
3.3 superseded tokens, 3.4 light-mode tokens, 3.5 dark-mode tokens) and writes features/brand/brand-tokens.json. Every HEX value in
that file is a regex capture from the PDF text — nothing is typed by hand. The PDF itself is INTERNAL ONLY and is never copied into
the repository or dist/; only its sha256 and the page numbers are recorded for provenance.
The supplied brand-tokens_v1.json (On Demand media library) is the "Erth Zayed Philanthropies — Brand Token Pack" (25 portfolio
entities, harvested 2026-08-21) and carries no Athar palette, which is why the guidelines are the token source here."""
import sys, re, json, hashlib, datetime
import pymupdf

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else 'features/brand/brand-tokens.json'
doc = pymupdf.open(src)
HDR = re.compile(r'ATHAR BRAND GUIDELINES V2\.2 — LOGO CONSISTENCY VERIFIED — FINAL — NOT FOR EXTERNAL\s*\n?DISTRIBUTION\s+Page \d+\s*')
def page(n):  # 1-based
    return HDR.sub('', doc[n - 1].get_text())
def flat(s):
    return re.sub(r'\s+', ' ', s)
def dehyph(s):  # PDF column wraps split a few words mid-word ('Intelligen ce', 'stone- like'); re-join them — the fragments are fixed and listed here
    s = re.sub(r'([a-z])\s+(ce|ncy|ility|ty|y|e)\b', r'\1\2', s); return s.replace('- ', '-')

# ---- locate the chapter pages by their headings (robust to re-pagination)
idx = {}
for i in range(8, len(doc)):  # skip the contents pages (1–8)
    t = page(i + 1)
    for key, pat in [('palette', r'3\.1 Palette'), ('proportion', r'3\.2 Proportion of use'), ('superseded', r'3\.3 Superseded tokens'),
                     ('light', r'3\.4 Light-mode tokens'), ('dark', r'3\.5 Dark-mode tokens'), ('contrast', r'3\.6 WCAG 2\.2 contrast')]:
        if key not in idx and re.search(pat, t): idx[key] = i + 1
assert all(k in idx for k in ('palette', 'proportion', 'superseded', 'light', 'dark', 'contrast')), idx

NAMES = ['Deep Ocean', 'Emerald', 'Sand', 'Ivory', 'Champagne Gold']
# ---- Table 3.1 — the five colours
t31 = flat(page(idx['palette']) + ' ' + page(idx['palette'] + 1))
t31 = t31[t31.index('Table 3.1'):]
pal = []
rx = re.compile(r'(Deep Ocean|Emerald|Sand|Ivory|Champag ?ne Gold)\s*(#[0-9A-F]{6})\s*(\d+) · (\d+) · (\d+)\s*(\d+) · (\d+) · (\d+) · (\d+)\s*(\d+ C) \(ΔE ([\d.]+)\) — UNVERIFI ?ED\s*(.*?)\s*(Primary|Secondar ?y|Accent)\s*—\s*(.*?)(?=Deep Ocean #|Emerald #|Sand #|Ivory #|Champag ?ne Gold #|Pantone caveat)', re.S)
for m in rx.finditer(t31):
    name = re.sub(r'\s+', '', m.group(1)); name = {'DeepOcean': 'Deep Ocean', 'ChampagneGold': 'Champagne Gold'}.get(name, name)
    pal.append({'name': name, 'token': 'brand.' + name.lower().replace(' ', '-'), 'hex': m.group(2), 'rgb': [int(m.group(3)), int(m.group(4)), int(m.group(5))],
                'cmykNaive': [int(m.group(6)), int(m.group(7)), int(m.group(8)), int(m.group(9))], 'pantoneNearest': m.group(10) + ' (ΔE ' + m.group(11) + ') — UNVERIFIED',
                'meaning': dehyph(flat(m.group(12)).replace(' / ', ' · ').strip()), 'tier': re.sub(r'\s+', '', m.group(13)).replace('Secondary', 'Secondary'), 'role': dehyph(flat(m.group(14)).strip(' ·'))})
assert [p['name'] for p in pal] == NAMES, [p['name'] for p in pal]
# ---- 3.2 proportion of use
t32 = flat(page(idx['proportion']) + ' ' + page(idx['proportion'] + 1))
t32 = t32[t32.index('3.2 Proportion of use'):t32.index('3.3 Superseded tokens')]
prop = {}
for m in re.finditer(r'(Ivory|Deep Ocean|Emerald|Sand|Champagne Gold)\s*(\d+) %\s*(.*?)(?=Ivory \d|Deep Ocean \d|Emerald \d|Sand \d|Champagne Gold \d|PROPOSED)', t32):
    prop[m.group(1)] = {'sharePct': int(m.group(2)), 'where': dehyph(m.group(3).strip(' ·'))}
assert len(prop) == 5 and sum(v['sharePct'] for v in prop.values()) == 100, prop
for p in pal: p['sharePct'] = prop[p['name']]['sharePct']; p['where'] = prop[p['name']]['where']
# ---- 3.3 superseded tokens (names + hex, for the record)
t33 = flat(page(idx['superseded']) + ' ' + page(idx['superseded'] + 1))
t33 = t33[t33.index('3.3 Superseded tokens'):t33.index('3.4 Light-mode tokens')]
superseded = [{'name': n.strip(), 'hex': h} for n, h in re.findall(r'([A-Z][A-Za-z -]+?) (#[0-9A-F]{6})', t33)]
# ---- 3.4 / 3.5 token tables (token-name / hex pairs in reading order)
def tokens(start_key, end_pat):
    s = page(idx[start_key]); nxt = page(idx[start_key] + 1)
    txt = s + '\n' + nxt
    txt = txt[txt.index(('3.4' if start_key == 'light' else '3.5')):]
    txt = txt[:re.search(end_pat, txt).start()]
    pairs = re.findall(r'((?:[a-z]+(?:[.-][a-z-]+)+)|link|border|divider)\s*\n\s*(#[0-9A-F]{6})', txt)  # single-word tokens: link · border · divider
    return [{'token': k, 'hex': v} for k, v in pairs]
light = tokens('light', r'Derived values')
dark = tokens('dark', r'Derived values')
assert len(light) >= 30 and len(dark) >= 30, (len(light), len(dark))
# derived-value notes (verbatim sentences)
def derived(start_key):
    txt = flat(page(idx[start_key]) + ' ' + page(idx[start_key] + 1)); m = re.search(r'Derived values:(.*?)(?:\d\.\d |3\.5 Dark|Tokens ship)', txt); return m.group(1).strip() if m else ''
sha = hashlib.sha256(open(src, 'rb').read()).hexdigest()
res = {
  'schema': 'athar.brand.tokens/1', 'version': '1.7.1', 'generated_utc': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
  'source': {'document': 'Athar Brand Guidelines V2.2 — LOGO CONSISTENCY VERIFIED — FINAL (24 September 2026), Chapter 3 · Colour Palette', 'file': 'Athar_Brand_Guidelines_FINAL.pdf (INTERNAL ONLY — not in the repository)', 'sha256': sha,
             'pages': {'palette': idx['palette'], 'proportion': idx['proportion'], 'superseded': idx['superseded'], 'lightTokens': idx['light'], 'darkTokens': idx['dark']},
             'method': 'scripts/v1.7.1/extract_brand_tokens.py — regex captures from the PDF text layer (PyMuPDF); no HEX value is typed by hand',
             'status': 'the five colours and their meanings are SOURCED (mood board); the sampled HEX values are SOURCED by measurement; tokens, proportion and rules are PROPOSED (guidelines p.39)',
             'suppliedTokenFile': 'brand-tokens_v1.json from the media library is the "Erth Zayed Philanthropies — Brand Token Pack" (25 entities, 2026-08-21) — it carries no Athar palette and is not used for any colour on slide 47'},
  'palette': pal, 'proportionOfUse': [{'name': n, **prop[n]} for n in ['Ivory', 'Deep Ocean', 'Emerald', 'Sand', 'Champagne Gold']],
  'superseded': superseded, 'light': light, 'dark': dark, 'derived': {'light': derived('light'), 'dark': derived('dark')},
  'tokensFile': 'tokens_v2.json (asset pack; "Tokens ship as tokens_v2.json; the CSS export is regenerated from it" — p.' + str(idx['dark'] + 0) + ') — NOT supplied in this media library (PENDING BRAND PACK)'
}
json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1); open(out, 'a').write('\n')
print(f'wrote {out}: palette {len(pal)}, light {len(light)}, dark {len(dark)}, superseded {len(superseded)}; pages {idx}; pdf sha256 {sha[:16]}…')
