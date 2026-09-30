import fs from 'node:fs';
let src=fs.readFileSync('js/impact-tiers.js','utf8');
src=src.replace("  var sections = [];", "  globalThis.__IT__={L:L,NEWS:NEWS,TIER_IMG:TIER_IMG,MARKS:MARKS,WALL:WALL,VERSION:VERSION,TOTAL:TOTAL,EXT:EXT};\n  return;\n  var sections = [];");
const noop=()=>{};
globalThis.window={location:{hash:''},addEventListener:noop,requestAnimationFrame:noop,history:{replaceState:noop},setInterval:noop,clearInterval:noop,setTimeout:noop};
globalThis.document={documentElement:{lang:'en',dir:'ltr'},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,createElement:()=>({setAttribute:noop,appendChild:noop,classList:{add:noop,toggle:noop,remove:noop},style:{}}),body:{classList:{toggle:noop}}};
globalThis.MutationObserver=function(){return {observe:noop}}; globalThis.HashChangeEvent=function(){};
globalThis.AtharOS=undefined; const aos=fs.readFileSync('js/athar-os.js','utf8'); (0,eval)(aos.replace("document.addEventListener('click'","(function(){})('click'")); (0,eval)(src);
const IT=globalThis.__IT__;
const ts=(s)=>`00:${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}.000`;
for (const lang of ['en','ar']) {
  const Lx=IT.L[lang];
  const out={chapter:Lx.chapter,kicker:Lx.kicker,srcNote:Lx.srcNote,ui:Lx.ui,slides:Lx.slides,counter:lang==='en'?'Slide {n} of {total}':'الشريحة {n} من {total}',version:'1.4.7',source:'Athar — Agentic AI for All: Three Impact Tiers for Foundation Funding (27 Sep 2026)',
    news:IT.NEWS.map(n=>({id:n.id,tier:n.tier,tag:n.tag,date:lang==='ar'?n.dateAr:n.date,publisher:lang==='ar'?n.publisherAr:n.publisher,headline:lang==='ar'?n.headlineAr:n.headline,url:n.url,alternate:n.alternate||null,flagged:!!n.flagged,secondary:n.secondary||null,mark:n.mark?'/assets/news/marks/'+n.mark:null,markKind:n.markKind,markName:n.markName})),
    tierImages:IT.TIER_IMG, marks:IT.MARKS, wall:IT.WALL, total:IT.TOTAL, atharOS:((globalThis.window&&globalThis.window.AtharOS)&&globalThis.window.AtharOS.strings[lang])||null};
  fs.writeFileSync(`locales/impact-tiers.${lang}.json`, JSON.stringify(out,null,1)+'\n');
  const cues=Lx.slides.map((s,i)=>`${i+1}\n${ts(i*8)} --> ${ts((i+1)*8)}\n${s.title}\n${s.sub}\n`).join('\n');
  fs.writeFileSync(`captions/impact-tiers-${lang}.vtt`, `WEBVTT\nKind: captions\nLanguage: ${lang}\n\nNOTE Athar Open Agentic Pact deck v1.4.7 — caption stub for slides 28–33 (Outcomes are the product section). Cue text = slide title and sub-line; no hero film exists in this lineage, timings are placeholders for a future narration track.\n\n`+cues);
  console.log(lang,'slides',Lx.slides.length,'news',IT.NEWS.length,IT.VERSION);
}
