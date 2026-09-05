(() => {
(async () => {
  const RUN = __RUN_CONFIG__;
  const MODE = 'interaction'; // Resume always exercises real stage interactions, not a synthetic full sequence.
  const EXPECTED_VIEWPORT = RUN.viewport;
  const S = {...{
    canvas: '[data-testid="pdf-canvas"]', holder: '.pdfv-scroll', rail: '[data-testid="guide-bar"]',
    toggle: '[data-testid="guide-toggle"]', pause: '[data-testid="guide-playpause"]',
    skip: '[data-testid="guide-skip"]', back: '[data-testid="guide-back"]', exit: '[data-testid="guide-exit"]',
    expand: '[data-testid="guide-expand"]', expanded: '[data-testid="guide-caption-full"]',
    chat: '[data-testid="chat-widget"]', chatOpen: '[data-testid="dock-chat"]', chatClose: '[data-testid="chat-close"]',
    overlay: '[data-testid="guide-overlay"]', source: '[data-testid="guide-source"]'
  }, ...RUN.selectors};
  const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const round = n => Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null;
  const now = () => new Date().toISOString();
  const ev = window.__atharEvidence = {version:2, mode:RUN.mode, buildSha:RUN.buildSha, classification:'live-resume-dom-and-natural-audio', startUTC:now(), viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio}, actionMethod:'DOM activation from documented ui_validate --eval and native focus() probes. Hit tests recorded separately; not a claim of trusted physical keyboard/pointer input. Fresh Chromium launched via documented CHROMIUM_BIN with --autoplay-policy=no-user-gesture-required for real audio playback; app source/rate/clock/ended unmodified.', actions:[],checks:[],stages:[],audioEvents:[],samples:[],errors:[],privacy:'No question/answer/narration/DOM text or session identifiers retained; computed text styles and font metrics only.'};
  const sleep = ms => new Promise(r => setTimeout(r,ms));
  const record = (name,data={}) => ev.actions.push({utc:now(),elapsedMs:round(performance.now()),name,...data});
  const check = (id,ok,detail={}) => {ev.checks.push({utc:now(),id,ok:!!ok,detail});return !!ok;};
  const wait = async (pred,ms=18000) => {const start=performance.now();while(performance.now()-start<ms){if(await pred())return true;await sleep(75);}return false;};
  const rect = e => {if(!e)return null;const r=e.getBoundingClientRect();return {x:round(r.x),y:round(r.y),w:round(r.width),h:round(r.height),r:round(r.right),b:round(r.bottom)};};
  const inside = (a,b,t=1.1) => !!(a&&b&&a.x>=b.x-t&&a.y>=b.y-t&&a.r<=b.r+t&&a.b<=b.b+t);
  const area = (a,b) => a&&b ? round(Math.max(0,Math.min(a.r,b.r)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.y,b.y))) : 0;
  const visible = e => {if(!e||!e.getClientRects().length)return false;for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);if(c.display==='none'||c.visibility==='hidden'||parseFloat(c.opacity)===0||n.hidden)return false;if(n.tagName==='DETAILS'&&!n.open&&!n.querySelector(':scope > summary')?.contains(e))return false;}return true;};
  const id = e => e ? e.dataset.testid || (e.id && /^[a-z-]+$/.test(e.id) ? '#'+e.id : '') || (e.tagName.toLowerCase()+'.'+[...e.classList].filter(x=>/^[a-z][a-z0-9-]{0,40}$/.test(x)).slice(0,3).join('.')) : null;
  const rgb = s => {const m=s.match(/[\d.]+/g);return m ? m.map(Number) : [0,0,0,0];};
  const composite = (f,b) => {const a=f.length>3?f[3]:1;return [0,1,2].map(i=>f[i]*a+b[i]*(1-a));};
  const lum = c => c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const textStyle = e => {if(!e)return null;const c=getComputedStyle(e),chain=[];for(let n=e;n;n=n.parentElement)chain.push(n);let bg=[255,255,255];for(const n of chain.reverse())bg=composite(rgb(getComputedStyle(n).backgroundColor),bg);const fg=composite(rgb(c.color),bg),a=lum(fg),b=lum(bg);return {fontPx:parseFloat(c.fontSize),lineHeight:c.lineHeight,fontWeight:c.fontWeight,color:c.color,effectiveBackground:bg.map(round),basicContrast:round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)),contrastCaveat:'CSS sRGB compositing; no raster glyph/image/opacity gradient validation',letterSpacing:c.letterSpacing,overflow:c.overflow,whiteSpace:c.whiteSpace,lineClamp:c.webkitLineClamp};};
  const measure = e => {if(!e)return null;const r=rect(e),c=getComputedStyle(e),cx=r.x+r.w/2,cy=r.y+r.h/2;let clip={x:0,y:0,r:innerWidth,b:innerHeight},anc=[];for(let n=e.parentElement;n;n=n.parentElement){const cs=getComputedStyle(n);if(/hidden|clip|auto|scroll/.test(cs.overflowX+' '+cs.overflowY)){const nr=rect(n);anc.push({id:id(n),rect:nr,overflowX:cs.overflowX,overflowY:cs.overflowY});if(/hidden|clip|auto|scroll/.test(cs.overflowX)){clip.x=Math.max(clip.x,nr.x);clip.r=Math.min(clip.r,nr.r);}if(/hidden|clip|auto|scroll/.test(cs.overflowY)){clip.y=Math.max(clip.y,nr.y);clip.b=Math.min(clip.b,nr.b);}}}const hit=cx>=0&&cy>=0&&cx<innerWidth&&cy<innerHeight?document.elementFromPoint(cx,cy):null;return {id:id(e),bounds:r,visible:visible(e),tabIndex:e.tabIndex,disabled:!!e.disabled,position:c.position,pointerEvents:c.pointerEvents,clipped:!inside(r,clip),visibleAreaFraction:round(area(r,clip)/Math.max(1,r.w*r.h)),hitTarget:id(hit),centerHit:!!(hit&&(e===hit||e.contains(hit))),clipAncestors:anc,text:textStyle(e)};};
  const audio = () => window.__atharGuide?.audio;
  const state = () => {const a=audio(),bar=q(S.rail),src=q(S.source);return {step:bar?.dataset.step||null,slide:Number(bar?.dataset.slide)||null,status:bar?.dataset.status||null,canvasPage:Number(q(S.canvas)?.dataset.page)||null,audio:a?{currentTime:round(a.currentTime),duration:round(a.duration),paused:a.paused,ended:a.ended,muted:a.muted,rate:a.playbackRate,readyState:a.readyState,errorCode:a.error?.code||null}:null,source:src?{source:src.dataset.source,clipSource:src.dataset.clipSource,file:src.dataset.clipFile,verified:src.dataset.verified,sha256:src.dataset.clipSha}:null};};
  const click = async (name,selector,settle=450) => {const e=q(selector);record(name,{selector,before:state(),target:measure(e)});if(!e){check(name+'-target',false,{missing:true});return false;}e.click();await sleep(settle);record(name+'-settled',{after:state()});return true;};
  const focusables = (root=document) => [...root.querySelectorAll('button,a[href],input,textarea,select,summary,[tabindex]')].filter(e=>e.tabIndex>=0&&!e.disabled&&!e.closest('[inert]'));
  const focusProbe = () => {const active=document.activeElement,els=focusables().filter(e=>visible(e)&&(e.closest('.pdfv')||e.closest('.dock')||e.closest('.widget')||e.closest('.workspace-companion')));const controls=els.map(e=>{e.focus({preventScroll:true});const m=measure(e.matches('input[type=radio]') ? e.closest('label') || e : e);return {id:m.id,bounds:m.bounds,focused:document.activeElement===e,centerHit:m.centerHit,clipped:m.clipped,tabIndex:m.tabIndex};});active?.focus?.({preventScroll:true});return controls;};
  let config=[];
  // CSS highlight entry/layout transitions must finish before geometry is judged.
  // Wait for settling, never change styles, playback rate/time, or highlight boxes.
  const settleGeometry = async () => {
    const started = performance.now(); let previous = '', stable = 0;
    const ready = await wait(() => {
      const overlay = q(S.overlay), busy = q(S.holder)?.getAttribute('aria-busy') === 'true';
      const animated = overlay?.getAnimations?.({subtree:true}).some(a => a.playState === 'running' && a.effect?.getComputedTiming?.().iterations !== Infinity);
      const current = JSON.stringify([rect(q(S.canvas)), rect(overlay), ...qa('.guide-hl').map(rect)]);
      stable = current === previous ? stable + 1 : 0; previous = current;
      return !busy && !animated && stable >= 2;
    }, RUN.settleMs || 3000);
    record('geometry-settle', {ready, waitedMs:round(performance.now()-started)});
  };
  const stage = async name => {
    // On <=640px the panels intentionally exclude each other. Measure primary
    // geometry while actually visible, and separately measure/focus the Ask view.
    // Never treat a hidden 0x0 canvas as successful geometry.
    const separate = innerWidth <= 640 && visible(q(S.chat));
    let askControls = [], askState = null;
    if (separate) {
      const canvasNode=q(S.canvas), primary=q('#mobile-panel-presentation'), a=audio();
      askState={utc:now(),canvasMounted:!!canvasNode,canvasHidden:!visible(canvasNode),primaryHidden:!!primary?.hidden,primaryInert:!!primary?.inert,chatVisible:visible(q(S.chat)),guideStep:state().step};
      askControls=focusProbe();
      check(name+':mobile-views-exclusive',askState.canvasMounted&&askState.canvasHidden&&askState.primaryHidden&&askState.primaryInert&&askState.chatVisible,askState);
      await click('measure-visible-presentation','[data-testid="mobile-tab-presentation"]');
      check(name+':mobile-preserves-mounted-guide',q(S.canvas)===canvasNode&&audio()===a&&visible(canvasNode)&&!visible(q(S.chat)));
    }
    await settleGeometry();
    const canvas=q(S.canvas),holder=q(S.holder),rail=q(S.rail),chat=q(S.chat),cr=rect(canvas),hr=rect(holder),rr=rect(rail),or=visible(chat)?rect(chat):null;
    const controls=[...focusProbe(),...askControls],small=controls.filter(x=>x.focused&&(x.bounds.w<44-.1||x.bounds.h<44-.1));
    const page=Number(canvas?.dataset.page)||1,scale=Number(canvas?.dataset.scale)||0,minFontPt=7.001999855041504,effectiveMinFontPx=round(minFontPt*scale);
    const candidates=qa('[data-testid*="readab"],[data-testid*="fit-note"],.readability-warning,.fit-note,[role="status"],[role="note"],.pdfv-guidance,.pdfv-hint,[data-testid="pdf-text-toggle"]').filter(visible);
    const recognized=candidates.some(e=>/readab|zoom.*(read|text)|small.*(fit|text)|fit.*(small|read)|read.*zoom|read text|enlarge/i.test(e.textContent||''));
    const h=holder?{x:hr.x+holder.clientLeft,y:hr.y+holder.clientTop,r:hr.x+holder.clientLeft+holder.clientWidth,b:hr.y+holder.clientTop+holder.clientHeight}:null;
    const s={name,utc:now(),mobileSeparateView:askState,state:state(),elements:{canvas:measure(canvas),holder:measure(holder),rail:measure(rail),chat:measure(chat),assistants:measure(q('.dock')),thumbnails:measure(q('.pdfv-thumbs')),caption:measure(q('[data-testid="guide-caption"]')),expandedCaption:measure(q(S.expanded))},controls,undersized:small,overlap:{railCanvas:area(rr,cr),chatCanvas:area(or,cr),assistantsCanvas:area(rect(q('.dock')),cr)},document:{clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth},holderOverflow:holder?{clientWidth:holder.clientWidth,scrollWidth:holder.scrollWidth,clientHeight:holder.clientHeight,scrollHeight:holder.scrollHeight}:null,readability:{page,scale,minFontPt,effectiveMinFontPx,thresholdPx:12,method:'Source PDF measured with PyMuPDF text spans; app canvas data-scale converts pt to CSS px. Not glyph OCR.',tiny:effectiveMinFontPx<12,uiRecognizesLimitation:recognized},highlights:qa('.guide-hl').map(measure)};
    ev.stages.push(s);
    check(name+':canvas-contained-in-holder',visible(canvas)&&cr?.w>0&&cr?.h>0&&inside(cr,h),{canvas:cr,holder:h});
    check(name+':rail-outside-canvas',visible(rail)&&rr?.w>0&&rr?.h>0&&area(rr,cr)<=1,{overlapPx:s.overlap.railCanvas});
    check(name+':chat-outside-canvas',!visible(chat)||area(or,cr)<=1,{chatOpen:visible(chat),overlapPx:s.overlap.chatCanvas});
    check(name+':keyboard-focusable-targets-44',small.length===0,{tested:controls.length,undersized:small.map(x=>({id:x.id,w:x.bounds.w,h:x.bounds.h}))});
    check(name+':tiny-fit-limitation-recognized',!s.readability.tiny||recognized,s.readability);
    check(name+':no-horizontal-overflow',s.document.scrollWidth<=s.document.clientWidth+1&&s.document.bodyScrollWidth<=s.document.clientWidth+1,s.document);
    const step=config.find(x=>x.id===s.state.step),hls=qa('.guide-hl'),ov=rect(q(S.overlay));
    check(name+':highlight-registration',visible(canvas)&&visible(q(S.overlay))&&!!step&&inside(ov,cr)&&inside(cr,ov)&&step.boxes.length===hls.length&&step.boxes.every((b,i)=>{const r=rect(hls[i]);return Math.abs(r.x-(cr.x+b.x*cr.w))<2&&Math.abs(r.y-(cr.y+b.y*cr.h))<2&&Math.abs(r.w-b.w*cr.w)<2&&Math.abs(r.h-b.h*cr.h)<2;}),{step:s.state.step,count:hls.length,expected:step?.boxes.length||0});
    if(separate) await click('restore-ask-after-geometry','[data-testid="mobile-tab-ask"]');
    return s;
  };

  const norm = v => String(v || '').replace(/\s+/g,' ').trim();
  const must = (id,ok,detail={}) => {if(!check(id,ok,detail))throw new Error('resume-assertion');};
  const getJSON = async path => {const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error('source-or-probe-unavailable');return r.json();};
  const ledger = () => getJSON('/__athar_ui__/probe');
  const queryCalls = p => p.requests.filter(r=>r.kind==='query'&&r.method==='POST');
  const setValue = (e,value) => {
    if(!e)throw new Error('missing-input');
    const proto=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:e instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(e,value);
    e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));
    record('native-value-setter',{synthetic:true});
  };
  const activate = async (e,name) => {
    const hit = e?.matches('input[type=radio]') ? e.closest('label') : e;
    must(name+'-available',visible(hit)&&!e?.disabled);
    e.focus({preventScroll:true});record(name,{synthetic:true,target:measure(hit)});hit.click();await sleep(400);return e;
  };
  const present = async () => {if(innerWidth<=640&&!visible(q(S.canvas)))await activate(q('[data-testid="mobile-tab-presentation"]'),'show-presentation');};
  const ask = async () => {if(!visible(q(S.chat)))await activate(q(innerWidth<=640?'[data-testid="mobile-tab-ask"]':S.chatOpen),'show-ask');};
  const layoutAsk = async name => {
    q(S.input)?.focus({preventScroll:true});await sleep(150);
    const c=q(S.canvas),chat=q(S.chat),caption=q(S.expanded);
    const separate=innerWidth<=640;
    check(name,visible(chat)&&document.activeElement===q(S.input)&&
      (separate?!!c&&!visible(c)&&q('#mobile-panel-presentation')?.hidden&&q('#mobile-panel-presentation')?.inert:
        visible(c)&&visible(caption)&&area(rect(chat),rect(c))<=1&&area(rect(chat),rect(caption))<=1&&area(rect(c),rect(caption))<=1)&&
      document.documentElement.scrollWidth<=innerWidth+1,
      {separateMobileViews:separate,canvasVisible:visible(c),chatVisible:visible(chat)});
  };
  let injectedTrigger=null;
  const cleanProof = async () => {
    let clean=false;
    try {
      injectedTrigger?.remove();injectedTrigger=null;
      await ask();
      const stop=qa(`${S.chat} form button`).find(b=>b.type==='button'&&norm(b.textContent)==='Stop');
      if(stop){await activate(stop,'stop-before-proof');await wait(()=>!qa(`${S.chat} form button`).some(b=>norm(b.textContent)==='Stop'),15000);}
      const close=q(`${S.citationPanel} button[aria-label*="Close"]`);if(close)await activate(close,'close-source-before-proof');
      const reset=q(`${S.chat} button[aria-label="Start a new session"]`);if(reset&&!reset.disabled)await activate(reset,'reset-real-session-before-proof');
      if(q(S.input))setValue(q(S.input),'');
      await present();if(audio()&&!audio().paused)await activate(q(S.pause),'pause-before-proof');
      if(q(S.expand)?.getAttribute('aria-expanded')==='true')await activate(q(S.expand),'collapse-transcript-before-proof');
      if(q('[data-testid="guide-info"]')?.getAttribute('aria-expanded')==='true')await activate(q('[data-testid="guide-info"]'),'hide-provider-before-proof');
      await ask();await sleep(300);
      clean=visible(q(S.chat))&&!q(`${S.chat} .msg`)&&!q(S.citationPanel)&&!q(S.input)?.value&&!q(`${S.chat} [role="alert"]`);
    } catch(_) {clean=false;}
    check('proof-clean-session',clean);
  };
  const sourceCase = async (ref,index) => {
    const prefix=`source-${index}-${ref.kind}`;
    // Test-only delegated route stimulus: real corpus ID, NOT an AI-returned
    // citation or injected answer. App mounts its unchanged SourceViewer and
    // fetches unchanged protected source records/bytes through the real broker.
    injectedTrigger=document.createElement('a');injectedTrigger.className='inline-citation';
    injectedTrigger.href='/api/citations/'+ref.id;injectedTrigger.textContent='Open source QA location';
    q(`${S.chat} .chat-list`).append(injectedTrigger);
    record('corpus-citation-route-stimulus',{synthetic:true,kind:ref.kind,index,modelReturnedCitation:false});
    await activate(injectedTrigger,prefix+'-open');
    const base='/api/citations/'+ref.id+'/view';const view=await getJSON(base);
    must(prefix+'-real-source-identity',view.citationId===ref.id&&view.documentId===ref.documentId&&view.kind===ref.kind&&!!view.originalSha256);
    const ready=()=>q('[data-testid="source-viewer"]')?.getAttribute('aria-busy')==='false'&&!q('[data-testid="source-viewer"] [role="alert"]');
    must(prefix+'-viewer-ready',await wait(ready,25000));
    const original=await getJSON('/api/citations/'+ref.id);
    check(prefix+'-exact-excerpt',!!norm(original.excerpt)&&norm(q(`${S.citationPanel} blockquote`)?.textContent)===norm(original.excerpt));
    const locationMatch = v => norm(q('[data-testid="source-location"]')?.textContent)===
      (v.kind==='xlsx'?`${v.location.sheet}!${v.location.range}`:`${v.kind==='pptx'?'Slide':'Page'} ${v.location[v.kind==='pptx'?'slide':'page']}`);
    check(prefix+'-exact-location-label',locationMatch(view));
    if(ref.kind==='xlsx') {
      const cells=view.rows.flatMap(r=>r.cells),grid=q('[data-testid="source-sheet"]');
      must(prefix+'-real-grid-cells',!!grid&&cells.length>0&&cells.every(c=>grid.querySelector(`[data-cell="${CSS.escape(c.address)}"]`)));
      check(prefix+'-exact-cited-highlights',cells.some(c=>c.highlight)&&cells.every(c=>grid.querySelector(`[data-cell="${CSS.escape(c.address)}"]`)?.dataset.highlighted===String(!!c.highlight))&&qa('[data-testid="source-sheet"] [data-highlighted="true"]').length===cells.filter(c=>c.highlight).length,{cells:cells.length,highlighted:cells.filter(c=>c.highlight).length});
      const printable=v=>v==null?'Not recorded':typeof v==='object'?JSON.stringify(v):String(v);
      const display=c=>c.availability==='missing-formula-cache'?'Saved result unavailable':c.value==null?'Blank / not recorded':printable(c.value);
      check(prefix+'-saved-values-not-recalculated',cells.every(c=>{const b=grid.querySelector(`[data-cell="${CSS.escape(c.address)}"] button`);return b&&norm([...b.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join(''))===norm(display(c));}),{recordCount:cells.length});
      const recorded=cells[0],button=grid.querySelector(`[data-cell="${CSS.escape(recorded.address)}"] button`);
      await activate(button,prefix+'-inspect-cell');
      check(prefix+'-cell-record-detail',visible(q('[data-testid="source-cell-details"]'))&&norm(q('[data-testid="source-cell-details"] h4')?.textContent)===`${view.location.sheet}!${recorded.address}`);
      const newRange=`${recorded.address}:${recorded.address}`;
      setValue(q('[data-testid="source-range-input"]'),newRange);
      await activate(q('.source-nav button[type="submit"]'),prefix+'-navigate-range');
      const one=await getJSON(base+'?'+new URLSearchParams({sheet:view.location.sheet,range:newRange}));
      must(prefix+'-bounded-range-navigation',await wait(()=>ready()&&locationMatch(one),15000)&&one.requestedCellCount===1);
      const other=view.availableLocations.sheets.find(x=>x.name!==view.location.sheet);
      must(prefix+'-other-sheet-available',!!other);
      setValue(q('[data-testid="source-sheet-select"]'),other.name);
      const otherView=await getJSON(base+'?'+new URLSearchParams({sheet:other.name}));
      check(prefix+'-worksheet-navigation',await wait(()=>ready()&&locationMatch(otherView),15000)&&otherView.location.sheet===other.name);
      await activate(q('[data-testid="source-return-citation"]'),prefix+'-return');
      check(prefix+'-return-to-citation',await wait(()=>ready()&&locationMatch(view),15000));
    } else {
      const canvas=()=>q('[data-testid="source-pdf-canvas"][data-page]');
      must(prefix+'-protected-preview-available',view.preview?.available===true&&view.preview.url===`/api/sources/${ref.documentId}/preview`);
      must(prefix+'-actual-cited-page-rendered',await wait(()=>ready()&&q('[data-testid="source-pdf"]')?.dataset.state==='ready'&&visible(canvas())&&Number(canvas().dataset.page)===view.previewPage,25000));
      const key=ref.kind==='pptx'?'slide':'page',max=view.availableLocations[key==='slide'?'slideCount':'pageCount'];
      const next=view.location[key]<max?view.location[key]+1:view.location[key]-1;
      must(prefix+'-navigation-page-available',max>1&&next>0);
      setValue(q('[data-testid="source-page-select"]'),String(next));
      const moved=await getJSON(base+'?'+new URLSearchParams({[key]:next}));
      check(prefix+'-page-navigation',await wait(()=>ready()&&locationMatch(moved)&&Number(canvas()?.dataset.page)===next,25000));
      await activate(q('[data-testid="source-return-citation"]'),prefix+'-return');
      check(prefix+'-return-to-citation',await wait(()=>ready()&&locationMatch(view)&&Number(canvas()?.dataset.page)===view.previewPage,25000));
      const p=await ledger();check(prefix+'-protected-preview-real-http',p.requests.some(r=>r.kind==='source'&&r.path===view.preview.url&&r.method==='GET'&&r.status===200&&r.complete&&r.byteCount>5));
    }
    const sourceControls=qa(`${S.citationPanel} button,${S.citationPanel} select,${S.citationPanel} input,${S.citationPanel} a`).filter(e=>visible(e)&&!e.disabled);
    const tiny=sourceControls.filter(e=>{const r=rect(e);return r.w<43.9||r.h<43.9;});
    check(prefix+'-controls-44',sourceControls.length>0&&tiny.length===0,{tested:sourceControls.length,undersizedCount:tiny.length});
    await activate(q(`${S.citationPanel} button[aria-label*="Close"]`),prefix+'-close');
    check(prefix+'-close-focus',!q(S.citationPanel)&&document.activeElement===injectedTrigger);
    injectedTrigger.remove();injectedTrigger=null;
    record('source-case-complete',{index,kind:ref.kind});
  };
  const realQuery = async (scope,documentId) => {
    await activate(q(`input[name="chat-answer-scope"][value="${scope}"]`),'select-scope-'+scope);
    const prior=queryCalls(await ledger()).length;
    setValue(q(S.input),scope==='all'?'What capital decisions still need agreement?':'Summarize this document with source citations.');
    must('scope-'+scope+'-send-ready',await wait(()=>q(S.send)&&!q(S.send).disabled));
    await activate(q(S.send),'send-real-'+scope);
    let calls=[];
    must('scope-'+scope+'-request-completed',await wait(async()=>{calls=queryCalls(await ledger());return calls.length>prior&&(calls.at(-1).complete||calls.at(-1).transportFailed);},110000));
    const r=calls.at(-1);await wait(()=>q('.msg.assistant.done')||q('.msg.assistant.error'),4000);
    check('scope-'+scope+'-real-request',calls.length===prior+1&&r.documentId===documentId&&r.slide===null&&r.status===200&&r.complete&&!r.transportFailed&&r.answerNonempty&&r.doneFrameCount===1&&r.errorFrameCount===0&&!r.metadataInvalid&&!!q('.msg.assistant.done .md')&&!q('.msg.assistant.error'),{requests:calls.length-prior,status:r.status,documentMatches:r.documentId===documentId,slideCleared:r.slide===null});
    const ids=r.citations||[];
    check('scope-'+scope+'-citations-real',ids.length>0&&ids.every(c=>c.urlMatchesId&&r.retrievedIds.includes(c.id)&&qa('.msg.assistant.done a.inline-citation').some(a=>a.getAttribute('href')==='/api/citations/'+c.id)),{count:ids.length});
  };
  const resumeChecks = async () => {
    must('resume-mode-allowed',['smoke','sources','live'].includes(RUN.resumeMode));
    await present();if(audio()&&!audio().paused)await activate(q(S.pause),'pause-for-state-tests');
    const provenance=q(S.source);check('provider-hidden-by-default',!!provenance&&!visible(provenance));
    await activate(q('[data-testid="guide-info"]'),'show-guide-information');
    check('provider-information-disclosure',q(S.source)===provenance&&visible(provenance)&&q('[data-testid="guide-info"]')?.getAttribute('aria-expanded')==='true');
    await activate(q('[data-testid="guide-info"]'),'hide-guide-information');
    check('provider-hidden-metadata-preserved',q(S.source)===provenance&&!visible(provenance)&&provenance.dataset.source==='elevenlabs'&&provenance.dataset.verified==='true');
    if(q(S.expand)?.getAttribute('aria-expanded')!=='true')await activate(q(S.expand),'show-full-transcript');
    const items=qa(`${S.expanded} ol > li`);
    const digests=await Promise.all(items.map(async e=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(norm(e.querySelector('p')?.textContent))))].map(b=>b.toString(16).padStart(2,'0')).join('')));
    check('transcript-exact-original-text',Array.isArray(RUN.transcriptDigests)&&RUN.transcriptDigests.length===21&&JSON.stringify(digests)===JSON.stringify(RUN.transcriptDigests),{count:digests.length,method:'SHA256 of normalized rendered labels and complete narration vs checked-out guide module; no text retained'});
    check('transcript-all-21-moments',visible(q(S.expanded))&&items.length===21&&config.length===21&&items.every((e,i)=>norm(e.querySelector('.guide-transcript-meta')?.textContent)===`${i+1} / 21 · Slide ${config[i].slide}`&&norm(e.querySelector('p')?.textContent).length>0)&&new Set(items.map(e=>norm(e.querySelector('p')?.textContent))).size===21,{count:items.length});
    check('transcript-current-moment',items.filter(e=>e.getAttribute('aria-current')==='step').length===1&&items[config.findIndex(c=>c.id===state().step)]?.getAttribute('aria-current')==='step');
    const mobile=innerWidth<=640,tabs=q('[data-testid="mobile-view-tabs"]');
    check('responsive-tabs-breakpoint',!!tabs&&visible(tabs)===mobile&&tabs.classList.contains('mobile-view-tabs'));
    if(mobile)check('mobile-tabs-aria',tabs.getAttribute('role')==='tablist'&&qa('[data-testid="mobile-view-tabs"] [role="tab"]').length===2&&q('[data-testid="mobile-tab-presentation"]')?.getAttribute('aria-selected')==='true');
    await ask();
    let p=await ledger();const beforeQueries=queryCalls(p).length;
    must('four-real-documents',p.sources.length===4&&new Set(p.sources.map(d=>d.id)).size===4,{count:p.sources.length});
    const expected=['Compare the UAE base case with international expansion.','What capital decisions still need agreement?','Which implementation milestones depend on those decisions?'];
    const chips=qa(`${S.chat} .chat-empty .chip`).filter(visible);
    check('exact-three-starters',chips.length===3&&JSON.stringify(chips.map(e=>norm(e.textContent)))===JSON.stringify(expected),{visibleCount:chips.length});
    for(let i=0;i<chips.length;i++){await activate(chips[i],'starter-'+i);check('starter-'+i+'-prefill-no-send',q(S.input)?.value===expected[i]&&queryCalls(await ledger()).length===beforeQueries);}
    await layoutAsk('focused-composer-layout');
    if(innerWidth>640){
      const slider=q('#companion-size'),companion=q(S.companion),log=q(`${S.chat} .chat-list`),before=rect(companion),beforeLog=rect(log),old=slider?.value;
      must('desktop-tablet-resize-control',visible(slider)&&slider.matches('input[type=range]'));
      const n=Number(old),step=Number(slider.step||10),max=Number(slider.max);setValue(slider,String(n+(n>=max?-step:step)));await sleep(500);
      const after=rect(companion),afterLog=rect(log);
      check('range-resize-value-and-layout',slider.value!==old&&!!before&&!!after&&!!beforeLog&&!!afterLog&&(Math.abs(before.w-after.w)>.5||Math.abs(before.h-after.h)>.5||Math.abs(beforeLog.h-afterLog.h)>.5));
      await layoutAsk('focused-resized-layout');
    }
    if(mobile){
      const a=audio(),canvas=q(S.canvas),bar=q(S.rail),chat=q(S.chat),input=q(S.input),draft=input.value,t=a.currentTime,step=state().step;
      const caption=q(S.expanded),selStart=input.selectionStart;
      must('mobile-hidden-guide-still-mounted',!!canvas&&!visible(canvas)&&q('#mobile-panel-presentation')?.hidden&&q('#mobile-panel-presentation')?.inert&&a.paused);
      const hiddenControls=qa('#mobile-panel-presentation button,#mobile-panel-presentation input,#mobile-panel-presentation [tabindex]');
      let focused=0;for(const e of hiddenControls){e.focus({preventScroll:true});if(document.activeElement===e)focused++;}
      check('mobile-hidden-presentation-not-focusable',focused===0,{tested:hiddenControls.length,focused});
      await activate(q('[data-testid="mobile-tab-presentation"]'),'mobile-return-presentation');
      check('mobile-guide-time-index-preserved',q(S.canvas)===canvas&&q(S.rail)===bar&&audio()===a&&a.paused&&Math.abs(a.currentTime-t)<.12&&state().step===step&&q(S.expanded)===caption&&visible(caption),{beforeTime:round(t),afterTime:round(a.currentTime)});
      check('mobile-chat-mounted-hidden',q(S.chat)===chat&&!visible(chat)&&q('#mobile-panel-ask')?.hidden&&q('#mobile-panel-ask')?.inert);
      await activate(q('[data-testid="mobile-tab-ask"]'),'mobile-return-ask');
      check('mobile-chat-draft-preserved',q(S.chat)===chat&&q(S.input)===input&&input.value===draft&&input.selectionStart===selStart);
      const transport=q('[data-testid="mobile-guide-transport"]');
      must('mobile-shared-transport',visible(transport));
      await activate(transport.querySelector('button[aria-label="Play presentation narration"]'),'shared-transport-play');
      const t0=a.currentTime;await sleep(700);
      check('mobile-hidden-guide-play-advances',audio()===a&&!a.paused&&a.currentTime>t0+.2&&state().step===step&&!visible(canvas),{beforeTime:round(t0),afterTime:round(a.currentTime)});
      await activate(transport.querySelector('button[aria-label="Pause presentation narration"]'),'shared-transport-pause');
      const t1=a.currentTime;await sleep(550);
      check('mobile-hidden-guide-pause-freezes',audio()===a&&a.paused&&Math.abs(a.currentTime-t1)<.12&&!visible(canvas),{beforeTime:round(t1),afterTime:round(a.currentTime)});
      const tab=q('[data-testid="mobile-tab-ask"]');tab.focus();
      tab.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true,cancelable:true}));await sleep(400);
      record('mobile-keyboard-home',{synthetic:true,trustedKeyboardTest:false});
      check('mobile-synthetic-keyboard-home',q('[data-testid="mobile-tab-presentation"]')?.getAttribute('aria-selected')==='true'&&document.activeElement===q('[data-testid="mobile-tab-presentation"]'));
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true}));await sleep(400);
      record('mobile-keyboard-end',{synthetic:true,trustedKeyboardTest:false});
      check('mobile-synthetic-keyboard-end',q('[data-testid="mobile-tab-ask"]')?.getAttribute('aria-selected')==='true'&&document.activeElement===q('[data-testid="mobile-tab-ask"]'));
      const controls=focusProbe(),small=controls.filter(c=>c.bounds.w<43.9||c.bounds.h<43.9);
      check('mobile-ask-focus-targets-44',controls.length>0&&controls.every(c=>c.focused)&&small.length===0,{tested:controls.length,undersized:small.map(c=>({id:c.id,w:c.bounds.w,h:c.bounds.h})),notFocused:controls.filter(c=>!c.focused).map(c=>c.id)});
    }
    const executive=p.sources.find(d=>d.slug==='executive-presentation');
    await present();await activate(q(S.askSlide),'ask-current-slide');await ask();
    check('ask-slide-current-document',q(S.filter)?.value===executive?.id&&visible(q(S.slideContext))&&queryCalls(await ledger()).length===beforeQueries);
    await activate(q('input[name="chat-answer-scope"][value="all"]'),'scope-all-draft');
    check('all-scope-clears-slide',q('input[name="chat-answer-scope"][value="all"]')?.checked&&q(S.filter)?.value==='__choose__'&&!visible(q(S.slideContext)));
    await activate(q('input[name="chat-answer-scope"][value="this"]'),'scope-this-draft');
    check('this-scope-restores-document',q('input[name="chat-answer-scope"][value="this"]')?.checked&&q(S.filter)?.value===executive?.id&&!visible(q(S.slideContext)));
    check('scope-draft-changes-no-request',queryCalls(await ledger()).length===beforeQueries);
    if(RUN.resumeMode==='live'){await realQuery('this',executive.id);await realQuery('all','all');}
    if(RUN.resumeMode==='sources'||RUN.resumeMode==='live'){
      must('source-fixtures-dynamic-all-kinds',Array.isArray(RUN.sourceRefs)&&new Set(RUN.sourceRefs.map(r=>r.kind)).size===3&&RUN.sourceRefs.length===4&&RUN.sourceRefs.every(r=>p.sources.some(d=>d.id===r.documentId&&d.kind===r.kind)),{count:RUN.sourceRefs?.length||0});
      for(let i=0;i<RUN.sourceRefs.length;i++)await sourceCase(RUN.sourceRefs[i],i);
      check('all-source-cases-completed',ev.actions.filter(a=>a.name==='source-case-complete').length===RUN.sourceRefs.length,{completed:ev.actions.filter(a=>a.name==='source-case-complete').length});
    }
    if(RUN.resumeMode!=='live')check('no-live-query-sent',queryCalls(await ledger()).length===0,{count:queryCalls(await ledger()).length});
    record('resume-checks-complete',{resumeMode:RUN.resumeMode});
  };

  let longTaskCount=0,longTaskMs=0,maxLongTaskMs=0;
  try{new PerformanceObserver(l=>l.getEntries().forEach(e=>{longTaskCount++;longTaskMs+=e.duration;maxLongTaskMs=Math.max(maxLongTaskMs,e.duration);})).observe({type:'longtask',buffered:true});}catch{}
  try {
    check('idle-guide-rail-present',!!q(S.rail)&&q(S.rail).dataset.active==='false');
    check('idle-provider-metadata-hidden',!!q(S.source)&&!visible(q(S.source)));
    record('start-guide-dom-activation');q(S.toggle)?.click();record('headless-audio-permission',{browserFlag:'--autoplay-policy=no-user-gesture-required',audioMutation:false});
    const configResponse = await fetch('/api/guide/config');
    if (!configResponse.ok) throw new Error('Configured narration metadata unavailable');
    const module = await configResponse.json(); config = module.moments;
    ev.config=config.map(({id,slide,boxes})=>({id,slide,boxes}));check('exact-requested-viewport',innerWidth===EXPECTED_VIEWPORT.width&&innerHeight===EXPECTED_VIEWPORT.height,{expected:EXPECTED_VIEWPORT,actual:{width:innerWidth,height:innerHeight}});
    check('configured-21-moments',config.length===21,{count:config.length});
    check('guide-started',await wait(()=>q(S.rail)&&audio()&&!audio().paused&&audio().currentTime>0&&q(S.rail).dataset.status==='speaking'),state());
    const a=audio();
    if(!a)throw new Error('No diagnostic audio element after guide start');
    ['playing','pause','ended','error','ratechange','seeking','seeked','waiting','stalled','durationchange','loadedmetadata'].forEach(type=>a.addEventListener(type,e=>ev.audioEvents.push({utc:now(),type,trusted:e.isTrusted,...state()})));
    if(MODE==='interaction'){
      await sleep(700);await stage('playing-collapsed');
      check('back-disabled-at-first',q(S.back)?.disabled===true);
      await click('pause',S.pause);const t=a.currentTime;await sleep(700);check('pause-freezes-clock',a.paused&&Math.abs(a.currentTime-t)<.12,{before:t,after:a.currentTime,status:state().status});
      await stage('paused');
      await click('resume',S.pause);const t2=a.currentTime;await sleep(700);check('resume-advances-clock',!a.paused&&a.currentTime>t2+.2,{before:t2,after:a.currentTime,status:state().status});
      await click('skip',S.skip,800);check('skip-next-moment',await wait(()=>state().step===config[1].id&&!a.paused),state());
      await click('back',S.back,800);check('back-previous-moment',await wait(()=>state().step===config[0].id&&!a.paused),state());
      await click('manual-page-2','[data-testid="pdf-thumb-2"]',900);check('manual-nav-sync-page2',await wait(()=>state().step===config.find(s=>s.slide===2).id&&state().canvasPage===2),state());await stage('manual-page-2');
      await click('manual-page-1','[data-testid="pdf-thumb-1"]',900);check('manual-nav-sync-page1',await wait(()=>state().step===config[0].id&&state().canvasPage===1),state());
      await click('caption-expand',S.expand);check('caption-expanded',visible(q(S.expanded))&&q(S.expand)?.getAttribute('aria-expanded')==='true');await stage('caption-expanded');
      await click('chat-open',S.chatOpen,650);check('chat-opens',visible(q(S.chat))&&q(S.chat)?.getAttribute('aria-hidden')==='false');await stage('chat-open-expanded');
      const chat=q(S.chat),resizeRoot=chat?.closest('.workspace-companion')||chat,handles=resizeRoot?[...resizeRoot.querySelectorAll(RUN.selectors.companionResize || '[data-testid*="resize"],[role="separator"],[aria-label*="resize" i],.resize-handle')].filter(visible):[];
      const mobilePanel=innerWidth<=640;
      const fixedMobile=mobilePanel&&visible(q('[data-testid="mobile-view-tabs"]'))&&q('[data-testid="presentation-workspace"]')?.dataset.layout==='mobile-views'&&q('#mobile-panel-presentation')?.hidden&&q('#mobile-panel-presentation')?.inert&&visible(chat)&&rect(chat)?.w>innerWidth-50&&rect(chat)?.w<=innerWidth+1&&document.documentElement.scrollWidth<=innerWidth+1;
      check('chat-resize-available',mobilePanel?fixedMobile:!!chat&&(getComputedStyle(chat).resize!=='none'||handles.length>0),{cssResize:chat?getComputedStyle(chat).resize:null,handleCount:handles.length,interaction:mobilePanel?'Updated mobile semantics: fixed single-view full-width panel, exclusive hidden/inert presentation, no horizontal overflow; resize control intentionally absent. Desktop/tablet still require genuine resize.':'Genuine desktop/tablet resize affordance required.'});
      await click('chat-close',S.chatClose,650);check('chat-closes',!visible(q(S.chat)));
      const hidden=q(S.chat),focusResults=[];for(const e of hidden?focusables(hidden):[]){e.focus({preventScroll:true});focusResults.push({id:id(e),focused:document.activeElement===e});}
      check('closed-chat-not-focusable',focusResults.every(e=>!e.focused),{mounted:!!hidden,focusResults});q(S.pause)?.focus({preventScroll:true});await stage('closed-chat-expanded');
      check('actual-speed',ev.audioEvents.every(e=>e.audio?.rate===1)&&a.playbackRate===1);
      await resumeChecks();
    }
  }catch(e){ev.errors.push({utc:now(),name:e.name,message:'Harness exception; raw message intentionally omitted'});check('harness-execution',false,{error:e.name,message:'Harness exception; raw message intentionally omitted'});}
  await cleanProof();
  const d=window.__atharGuide||{};
  ev.diagSources=(d.sources||[]).map(s=>({utc:s.t?new Date(s.t).toISOString():null,moment:s.moment,slide:s.slide,source:s.source,provider:s.provider,model:s.model,voice:s.voice,file:s.file,sha256:s.sha256,verified:s.verified,httpStatus:s.httpStatus,bytes:s.bytes,duration:round(s.duration)}));
  ev.diagEvents=(d.events||[]).map(e=>({utc:typeof e.t==='number'?new Date(e.t).toISOString():null,type: typeof e.event==='string'?e.event:(typeof e.type==='string'?e.type:null),keys:Object.keys(e),detailRetained:false}));
  const nav=performance.getEntriesByType('navigation')[0],resources=performance.getEntriesByType('resource');
  ev.performance={timeOriginUTC:new Date(performance.timeOrigin).toISOString(),elapsedMs:round(performance.now()),domContentLoadedMs:round(nav?.domContentLoadedEventEnd),loadMs:round(nav?.loadEventEnd),resourceCount:resources.length,resourceDurationMs:round(resources.reduce((s,r)=>s+r.duration,0)),transferBytes:resources.reduce((s,r)=>s+r.transferSize,0),audioResources:resources.filter(r=>/guide-audio\//.test(r.name)).map(r=>({path:new URL(r.name).pathname,durationMs:round(r.duration),transferBytes:r.transferSize})),longTaskCount,longTaskMs:round(longTaskMs),maxLongTaskMs:round(maxLongTaskMs),paint:performance.getEntriesByType('paint').map(x=>({name:x.name,ms:round(x.startTime)}))};
  ev.endUTC=now();ev.ok=ev.checks.every(c=>c.ok);
  const node=document.createElement('script');node.type='application/json';node.id='athar-baseline-evidence';node.textContent=JSON.stringify(ev);document.body.append(node);
  window.__atharEvidenceB64=btoa(unescape(encodeURIComponent(node.textContent)));
  window.__atharTransport=(i,n)=>JSON.stringify({chunk:window.__atharEvidenceB64.slice(i*n,(i+1)*n),more:(i+1)*n<window.__atharEvidenceB64.length});
  return true;
})();
window.__atharPoll=async()=>{if(!window.__atharEvidenceB64)await new Promise(r=>setTimeout(r,100));return true;};
return true;
})()
