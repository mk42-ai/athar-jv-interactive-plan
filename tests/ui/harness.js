(() => {
(async () => {
  const RUN = __RUN_CONFIG__;
  const MODE = RUN.mode === 'stage' ? 'interaction' : RUN.mode;
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
  const ev = window.__atharEvidence = {version:2, mode:RUN.mode, buildSha:RUN.buildSha, classification:'live-baseline-dom-and-natural-audio', startUTC:now(), viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio}, actionMethod:'DOM activation from documented ui_validate --eval and native focus() probes. Hit tests recorded separately; not a claim of trusted physical keyboard/pointer input. Fresh Chromium launched via documented CHROMIUM_BIN with --autoplay-policy=no-user-gesture-required for real audio playback; app source/rate/clock/ended unmodified.', actions:[],checks:[],stages:[],audioEvents:[],samples:[],errors:[],privacy:'No question/answer/narration/DOM text or session identifiers retained; computed text styles and font metrics only.'};
  const sleep = ms => new Promise(r => setTimeout(r,ms));
  const record = (name,data={}) => ev.actions.push({utc:now(),elapsedMs:round(performance.now()),name,...data});
  const check = (id,ok,detail={}) => {ev.checks.push({utc:now(),id,ok:!!ok,detail});return !!ok;};
  const wait = async (pred,ms=18000) => {const start=performance.now();while(performance.now()-start<ms){if(pred())return true;await sleep(75);}return false;};
  const rect = e => {if(!e)return null;const r=e.getBoundingClientRect();return {x:round(r.x),y:round(r.y),w:round(r.width),h:round(r.height),r:round(r.right),b:round(r.bottom)};};
  const inside = (a,b,t=1.1) => !!(a&&b&&a.x>=b.x-t&&a.y>=b.y-t&&a.r<=b.r+t&&a.b<=b.b+t);
  const area = (a,b) => a&&b ? round(Math.max(0,Math.min(a.r,b.r)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.y,b.y))) : 0;
  const visible = e => {if(!e||!e.getClientRects().length)return false;for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);if(c.display==='none'||c.visibility==='hidden'||parseFloat(c.opacity)===0||n.hidden)return false;}return true;};
  const id = e => e ? e.dataset.testid || (e.id && /^[a-z-]+$/.test(e.id) ? '#'+e.id : '') || (e.tagName.toLowerCase()+'.'+[...e.classList].filter(x=>/^[a-z][a-z0-9-]{0,40}$/.test(x)).slice(0,3).join('.')) : null;
  const rgb = s => {const m=s.match(/[\d.]+/g);return m ? m.map(Number) : [0,0,0,0];};
  const composite = (f,b) => {const a=f.length>3?f[3]:1;return [0,1,2].map(i=>f[i]*a+b[i]*(1-a));};
  const lum = c => c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const textStyle = e => {if(!e)return null;const c=getComputedStyle(e),chain=[];for(let n=e;n;n=n.parentElement)chain.push(n);let bg=[255,255,255];for(const n of chain.reverse())bg=composite(rgb(getComputedStyle(n).backgroundColor),bg);const fg=composite(rgb(c.color),bg),a=lum(fg),b=lum(bg);return {fontPx:parseFloat(c.fontSize),lineHeight:c.lineHeight,fontWeight:c.fontWeight,color:c.color,effectiveBackground:bg.map(round),basicContrast:round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)),contrastCaveat:'CSS sRGB compositing; no raster glyph/image/opacity gradient validation',letterSpacing:c.letterSpacing,overflow:c.overflow,whiteSpace:c.whiteSpace,lineClamp:c.webkitLineClamp};};
  const measure = e => {if(!e)return null;const r=rect(e),c=getComputedStyle(e),cx=r.x+r.w/2,cy=r.y+r.h/2;let clip={x:0,y:0,r:innerWidth,b:innerHeight},anc=[];for(let n=e.parentElement;n;n=n.parentElement){const cs=getComputedStyle(n);if(/hidden|clip|auto|scroll/.test(cs.overflowX+' '+cs.overflowY)){const nr=rect(n);anc.push({id:id(n),rect:nr,overflowX:cs.overflowX,overflowY:cs.overflowY});if(/hidden|clip|auto|scroll/.test(cs.overflowX)){clip.x=Math.max(clip.x,nr.x);clip.r=Math.min(clip.r,nr.r);}if(/hidden|clip|auto|scroll/.test(cs.overflowY)){clip.y=Math.max(clip.y,nr.y);clip.b=Math.min(clip.b,nr.b);}}}const hit=cx>=0&&cy>=0&&cx<innerWidth&&cy<innerHeight?document.elementFromPoint(cx,cy):null;return {id:id(e),bounds:r,visible:visible(e),tabIndex:e.tabIndex,disabled:!!e.disabled,position:c.position,pointerEvents:c.pointerEvents,clipped:!inside(r,clip),visibleAreaFraction:round(area(r,clip)/Math.max(1,r.w*r.h)),hitTarget:id(hit),centerHit:!!(hit&&(e===hit||e.contains(hit))),clipAncestors:anc,text:textStyle(e)};};
  const audio = () => window.__atharGuide?.audio;
  const state = () => {const a=audio(),bar=q(S.rail),src=q(S.source);return {step:bar?.dataset.step||null,slide:Number(bar?.dataset.slide)||null,status:bar?.dataset.status||null,canvasPage:Number(q(S.canvas)?.dataset.page)||null,audio:a?{currentTime:round(a.currentTime),duration:round(a.duration),paused:a.paused,ended:a.ended,muted:a.muted,rate:a.playbackRate,readyState:a.readyState,errorCode:a.error?.code||null}:null,source:src?{source:src.dataset.source,clipSource:src.dataset.clipSource,file:src.dataset.clipFile,verified:src.dataset.verified,sha256:src.dataset.clipSha}:null};};
  const click = async (name,selector,settle=450) => {const e=q(selector);record(name,{selector,before:state(),target:measure(e)});if(!e){check(name+'-target',false,{missing:true});return false;}e.click();await sleep(settle);record(name+'-settled',{after:state()});return true;};
  const focusables = (root=document) => [...root.querySelectorAll('button,a[href],input,textarea,select,[tabindex]')].filter(e=>e.tabIndex>=0&&!e.disabled&&!e.closest('[inert]'));
  const focusProbe = () => {const active=document.activeElement,els=focusables().filter(e=>visible(e)&&(e.closest('.pdfv')||e.closest('.dock')||e.closest('.widget')||e.closest('.workspace-companion')));const controls=els.map(e=>{e.focus({preventScroll:true});const m=measure(e);return {id:m.id,bounds:m.bounds,focused:document.activeElement===e,centerHit:m.centerHit,clipped:m.clipped,tabIndex:m.tabIndex};});active?.focus?.({preventScroll:true});return controls;};
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
    await settleGeometry();
    const canvas=q(S.canvas),holder=q(S.holder),rail=q(S.rail),chat=q(S.chat),cr=rect(canvas),hr=rect(holder),rr=rect(rail),or=visible(chat)?rect(chat):null;
    const controls=focusProbe(),small=controls.filter(x=>x.focused&&(x.bounds.w<44-.1||x.bounds.h<44-.1));
    const page=Number(canvas?.dataset.page)||1,scale=Number(canvas?.dataset.scale)||0,minFontPt=7.001999855041504,effectiveMinFontPx=round(minFontPt*scale);
    const candidates=qa('[data-testid*="readab"],[data-testid*="fit-note"],.readability-warning,.fit-note,[role="status"],[role="note"],.pdfv-guidance,.pdfv-hint,[data-testid="pdf-text-toggle"]').filter(visible);
    const recognized=candidates.some(e=>/readab|zoom.*(read|text)|small.*(fit|text)|fit.*(small|read)|read.*zoom|read text|enlarge/i.test(e.textContent||''));
    const h=holder?{x:hr.x+holder.clientLeft,y:hr.y+holder.clientTop,r:hr.x+holder.clientLeft+holder.clientWidth,b:hr.y+holder.clientTop+holder.clientHeight}:null;
    const s={name,utc:now(),state:state(),elements:{canvas:measure(canvas),holder:measure(holder),rail:measure(rail),chat:measure(chat),assistants:measure(q('.dock')),thumbnails:measure(q('.pdfv-thumbs')),caption:measure(q('[data-testid="guide-caption"]')),expandedCaption:measure(q(S.expanded))},controls,undersized:small,overlap:{railCanvas:area(rr,cr),chatCanvas:area(or,cr),assistantsCanvas:area(rect(q('.dock')),cr)},document:{clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth},holderOverflow:holder?{clientWidth:holder.clientWidth,scrollWidth:holder.scrollWidth,clientHeight:holder.clientHeight,scrollHeight:holder.scrollHeight}:null,readability:{page,scale,minFontPt,effectiveMinFontPx,thresholdPx:12,method:'Source PDF measured with PyMuPDF text spans; app canvas data-scale converts pt to CSS px. Not glyph OCR.',tiny:effectiveMinFontPx<12,uiRecognizesLimitation:recognized},highlights:qa('.guide-hl').map(measure)};
    ev.stages.push(s);
    check(name+':canvas-contained-in-holder',inside(cr,h),{canvas:cr,holder:h});
    check(name+':rail-outside-canvas',!!rail&&area(rr,cr)<=1,{overlapPx:s.overlap.railCanvas});
    check(name+':chat-outside-canvas',!visible(chat)||area(or,cr)<=1,{chatOpen:visible(chat),overlapPx:s.overlap.chatCanvas});
    check(name+':keyboard-focusable-targets-44',small.length===0,{tested:controls.length,undersized:small.map(x=>({id:x.id,w:x.bounds.w,h:x.bounds.h}))});
    check(name+':tiny-fit-limitation-recognized',!s.readability.tiny||recognized,s.readability);
    check(name+':no-horizontal-overflow',s.document.scrollWidth<=s.document.clientWidth+1&&s.document.bodyScrollWidth<=s.document.clientWidth+1,s.document);
    const step=config.find(x=>x.id===s.state.step),hls=qa('.guide-hl'),ov=rect(q(S.overlay));
    check(name+':highlight-registration',!!step&&inside(ov,cr)&&inside(cr,ov)&&step.boxes.length===hls.length&&step.boxes.every((b,i)=>{const r=rect(hls[i]);return Math.abs(r.x-(cr.x+b.x*cr.w))<2&&Math.abs(r.y-(cr.y+b.y*cr.h))<2&&Math.abs(r.w-b.w*cr.w)<2&&Math.abs(r.h-b.h*cr.h)<2;}),{step:s.state.step,count:hls.length,expected:step?.boxes.length||0});
    return s;
  };
  let longTaskCount=0,longTaskMs=0,maxLongTaskMs=0;
  try{new PerformanceObserver(l=>l.getEntries().forEach(e=>{longTaskCount++;longTaskMs+=e.duration;maxLongTaskMs=Math.max(maxLongTaskMs,e.duration);})).observe({type:'longtask',buffered:true});}catch{}
  try {
    record('start-guide-dom-activation');q(S.toggle)?.click();record('headless-audio-permission',{browserFlag:'--autoplay-policy=no-user-gesture-required',audioMutation:false});
    const configResponse = await fetch('/api/guide/config');
    if (!configResponse.ok) throw new Error('Configured narration metadata unavailable');
    const module = await configResponse.json(); config = module.moments;
    ev.config=config;check('exact-requested-viewport',innerWidth===EXPECTED_VIEWPORT.width&&innerHeight===EXPECTED_VIEWPORT.height,{expected:EXPECTED_VIEWPORT,actual:{width:innerWidth,height:innerHeight}});
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
      check('chat-resize-available',!!chat&&(getComputedStyle(chat).resize!=='none'||handles.length>0),{cssResize:chat?getComputedStyle(chat).resize:null,handleCount:handles.length,interaction:'No resize performed when no genuine resize affordance exists; recorded missing, never fabricated.'});
      await click('chat-close',S.chatClose,650);check('chat-closes',!visible(q(S.chat)));
      const hidden=q(S.chat),focusResults=[];for(const e of hidden?focusables(hidden):[]){e.focus({preventScroll:true});focusResults.push({id:id(e),focused:document.activeElement===e});}
      check('closed-chat-not-focusable',focusResults.every(e=>!e.focused),{mounted:!!hidden,focusResults});q(S.pause)?.focus({preventScroll:true});await stage('closed-chat-expanded');
      check('actual-speed',ev.audioEvents.every(e=>e.audio?.rate===1)&&a.playbackRate===1);
    } else {
      record('full-sequence-observation-start',{initial:state(),noAcceleration:true,noSyntheticEnded:true,noSkipBackManualNav:true});
      const started=performance.now();let last='';
      while(performance.now()-started<1800000){
        const s=state();
        if(s.step&&s.status==='speaking'&&s.step!==last&&s.source?.file&&s.canvasPage===s.slide){last=s.step;ev.samples.push({utc:now(),...s,canvas:rect(q(S.canvas)),holder:rect(q(S.holder)),highlights:qa('.guide-hl').map(rect)});record('natural-moment-start',{step:s.step,slide:s.slide});}
        if(s.status==='ended'||s.status==='error')break;
        await sleep(100);
      }
      const ends=ev.audioEvents.filter(e=>e.type==='ended'&&e.audio?.duration>.1),srcs=(window.__atharGuide?.sources||[]).filter(s=>config.some(c=>c.id===s.moment));
      const expected=config.map(s=>s.id),observed=ends.map(s=>s.step);
      check('full-sequence-21-natural-ended',JSON.stringify(observed)===JSON.stringify(expected),{expected,observed,count:ends.length});
      check('full-sequence-trusted-ended',ends.length===21&&ends.every(e=>e.trusted&&e.audio.ended&&Math.abs(e.audio.currentTime-e.audio.duration)<.15));
      check('full-sequence-rate-one-no-seek',ev.audioEvents.every(e=>e.audio?.rate===1&&!['seeking','seeked'].includes(e.type))&&a.playbackRate===1);
      check('full-sequence-source-provenance',ev.samples.length===21&&ev.samples.every(s=>s.source?.source==='elevenlabs'&&s.source?.clipSource==='prebaked'&&s.source?.verified==='true'),{samples:ev.samples.length,files:ev.samples.map(s=>({step:s.step,...s.source}))});
      check('full-sequence-page-sync',ev.samples.length===21&&ev.samples.every(s=>s.slide===s.canvasPage));
      check('full-sequence-tour-complete',state().status==='ended',state());
      const totalSeconds=ends.reduce((n,e)=>n+(e.audio.duration||0),0);ev.fullSequence={observationSeconds:round((performance.now()-started)/1000),totalMediaSeconds:round(totalSeconds),firstObservedCurrentTime:ev.actions.find(x=>x.name==='full-sequence-observation-start')?.initial.audio?.currentTime,complete:state().status==='ended',endedCount:ends.length};
      await stage('natural-completion');
    }
  }catch(e){ev.errors.push({utc:now(),name:e.name,message:'Harness exception; raw message intentionally omitted'});check('harness-execution',false,{error:e.name,message:'Harness exception; raw message intentionally omitted'});}
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
