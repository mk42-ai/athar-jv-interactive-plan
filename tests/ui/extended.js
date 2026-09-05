(() => {
  (async () => {
    'use strict';
    const RUN = __RUN_CONFIG__, S = RUN.selectors;
    const q = selector => selector ? document.querySelector(selector) : null;
    const qa = selector => [...document.querySelectorAll(selector)];
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const now = () => new Date().toISOString();
    const evidence = window.__atharEvidence = {
      version: 2, mode: 'extended', case: RUN.case, startUTC: now(), buildSha: RUN.buildSha,
      classification: 'isolated-synthetic-ui-contract; NOT server authorization, corpus grounding, or physical keyboard proof',
      actionMethod: 'DOM click/focus/input/change and untrusted KeyboardEvent dispatch only. Native media recovery is observed, not a full sequence test.',
      viewport: {width: innerWidth, height: innerHeight, dpr: devicePixelRatio},
      checks: [], actions: [], errors: [],
      privacy: 'No page text, prompts, source excerpts, credentials, cookies, sessions, raw responses or URLs retained.',
    };
    const check = (id, ok, detail = {}) => { evidence.checks.push({utc: now(), id, ok: !!ok, detail}); return !!ok; };
    const action = (name, detail = {}) => evidence.actions.push({utc: now(), name, ...detail});
    const wait = async (predicate, timeout = 12000) => {
      const start = performance.now();
      while (performance.now() - start < timeout) { if (predicate()) return true; await sleep(80); }
      return false;
    };
    const visible = element => {
      if (!element?.getClientRects().length) return false;
      for (let n = element; n; n = n.parentElement) {
        const style = getComputedStyle(n);
        if (n.hidden || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      }
      return true;
    };
    const bounds = element => {
      const r = element?.getBoundingClientRect();
      return r ? {x: r.x, y: r.y, r: r.right, b: r.bottom, w: r.width, h: r.height} : null;
    };
    const contained = (a, b, tolerance = RUN.thresholds.layoutTolerancePx) =>
      !!a && !!b && a.x >= b.x-tolerance && a.y >= b.y-tolerance && a.r <= b.r+tolerance && a.b <= b.b+tolerance;
    const overlap = (a,b) => a && b ? Math.max(0,Math.min(a.r,b.r)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.y,b.y)) : 0;
    const click = async (selector, name, delay = 350) => {
      const element = q(selector);
      if (!element || !visible(element) || element.disabled) { check(name + '-available', false); return false; }
      element.focus?.({preventScroll:true}); element.click(); action(name, {method:'DOM click'}); await sleep(delay); return true;
    };
    const press = async (element, key) => {
      if (!element) return false;
      element.focus({preventScroll:true});
      element.dispatchEvent(new KeyboardEvent('keydown', {key, code:key, bubbles:true, cancelable:true}));
      element.dispatchEvent(new KeyboardEvent('keyup', {key, code:key, bubbles:true, cancelable:true}));
      action('synthetic-key-dispatch', {key, isTrusted:false}); await sleep(450); return true;
    };
    const setValue = (element, value) => {
      if (!element) return false;
      const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto,'value').set.call(element,value);
      element.dispatchEvent(new Event('input',{bubbles:true}));
      element.dispatchEvent(new Event('change',{bubbles:true}));
      action('synthetic-form-event',{method:'native value setter plus untrusted input/change'}); return true;
    };
    const probe = () => fetch('/__athar_ui__/probe').then(response => response.json());
    const control = body => fetch('/__athar_ui__/control', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const queryCalls = async () => (await probe()).requests.filter(r => r.kind === 'query');
    const page = () => Number(q(S.canvas)?.dataset.page);
    const scale = () => Number(q(S.canvas)?.dataset.scale);
    const status = () => q(S.rail)?.dataset.status;
    const audio = () => window.__atharGuide?.audio;
    const activeControls = root => [...root.querySelectorAll('button,a[href],input,textarea,select,[tabindex]')]
      .filter(e => visible(e) && !e.disabled && e.tabIndex >= 0 && !e.closest('[inert]'));
    const geometrySettled = async () => {
      let previous = '', stable = 0;
      return wait(() => {
        const current = JSON.stringify([bounds(q(S.canvas)),bounds(q(S.holder)),bounds(q(S.reader))]);
        stable = current === previous ? stable + 1 : 0; previous = current;
        const busy = q(S.holder)?.getAttribute('aria-busy') === 'true';
        return stable >= 2 && !busy;
      }, RUN.settleMs);
    };
    const openChat = async () => {
      if (!visible(q(S.chat))) await click(S.chatOpen,'open-chat');
      return wait(() => visible(q(S.chat)));
    };
    const sendMock = async () => {
      await openChat();
      await wait(() => q(S.input) && !q(S.input).disabled && q(S.send));
      setValue(q(S.input),'MOCK UI test: inspect the selected synthetic source.');
      await wait(() => q(S.send) && !q(S.send).disabled, 2500);
      return click(S.send,'send-synthetic-query',500);
    };
    const retrySources = async () => {
      let element = q(S.documentsRetry);
      if (!element) element = qa('button').find(e => visible(e) && (/retry.*sources|retry documents|refresh sources|retry loading/i.test(e.textContent) || (/^retry$/i.test(e.textContent.trim()) && /sources could not be loaded|sources.*unavailable/i.test(e.parentElement?.textContent || ''))));
      if (!element) { check('source-retry-control',false); return; }
      element.click(); action('retry-sources',{method:'DOM click'}); await sleep(500);
    };
    const caption = name => { // permanent disclosure in every extended screenshot, never business content
      const n=document.createElement('div'); n.id='athar-mock-disclosure'; n.textContent='MOCK / ISOLATED UI CONTRACT — '+name+' — not grounding or authorization proof';
      Object.assign(n.style,{position:'fixed',bottom:'0',left:'0',right:'0',background:'#111827',color:'#fff',font:'12px sans-serif',padding:'6px',zIndex:'2147483647',pointerEvents:'none'}); document.body.append(n);
    };
    try {
      check('exact-requested-viewport', innerWidth === RUN.viewport.width && innerHeight === RUN.viewport.height, {expected:RUN.viewport,actual:{width:innerWidth,height:innerHeight}});
      if (RUN.case === 'reader') {
        await click(S.fit,'fit-entire-page'); await geometrySettled();
        const fitScale = scale(), holder=q(S.holder), canvas=bounds(q(S.canvas));
        const inner=holder ? {x:bounds(holder).x+holder.clientLeft,y:bounds(holder).y+holder.clientTop,r:bounds(holder).x+holder.clientLeft+holder.clientWidth,b:bounds(holder).y+holder.clientTop+holder.clientHeight} : null;
        check('fit-page-explicit-control',visible(q(S.fit)) && q(S.fit)?.getAttribute('aria-pressed')==='true' && q(S.viewer)?.dataset.fitMode==='page');
        check('fit-page-both-dimensions',contained(canvas,inner),{canvas,holder:inner});
        const startPage=page(); await press(holder,'ArrowRight'); await geometrySettled();
        check('synthetic-reader-next-page',page()===startPage+1,{physicalKeyboardTested:false});
        await press(holder,'ArrowLeft'); await geometrySettled();
        check('synthetic-reader-previous-page',page()===startPage,{physicalKeyboardTested:false});
        await click(S.readableZoom,'readable-zoom'); await geometrySettled();
        const zoomScale=scale(), zoomHolder=q(S.holder);
        check('readable-zoom-enlarges-source',Number.isFinite(fitScale)&&zoomScale>fitScale+.01&&q(S.viewer)?.dataset.fitMode==='zoom',{fitScale,zoomScale});
        const overflowX=zoomHolder&&zoomHolder.scrollWidth>zoomHolder.clientWidth+1;
        const overflowY=zoomHolder&&zoomHolder.scrollHeight>zoomHolder.clientHeight+1;
        const oldX=zoomHolder?.scrollLeft||0,oldY=zoomHolder?.scrollTop||0;
        zoomHolder?.scrollTo({left:oldX>0?0:30,top:oldY>0?0:30}); await sleep(100);
        check('readable-zoom-pan-surface',!!zoomHolder&&(/auto|scroll/.test(getComputedStyle(zoomHolder).overflowX+' '+getComputedStyle(zoomHolder).overflowY))&&(!overflowX||Math.abs(zoomHolder.scrollLeft-oldX)>.5)&&(!overflowY||Math.abs(zoomHolder.scrollTop-oldY)>.5),{overflowX,overflowY,method:'DOM scroll; not physical drag'});
        await click(S.textToggle,'open-reflow-reader'); await wait(()=>visible(q(S.sourceText))); await geometrySettled();
        const text=q(S.sourceText), reader=q(S.reader), style=text&&getComputedStyle(text);
        const paragraphs=text?[...text.querySelectorAll('p')]:[];
        check('reflow-reader-visible-and-labelled',visible(reader)&&q(S.textToggle)?.getAttribute('aria-expanded')==='true'&&!!reader?.getAttribute('aria-label'));
        check('reflow-reader-readable-type',!!style&&paragraphs.length>0&&parseFloat(style.fontSize)>=RUN.thresholds.readerFontPx&&paragraphs.every(p=>{const c=getComputedStyle(p);return parseFloat(c.fontSize)>=RUN.thresholds.readerFontPx&&parseFloat(c.lineHeight)/parseFloat(c.fontSize)>=RUN.thresholds.readerLineHeight;}),{fontPx:style?parseFloat(style.fontSize):null,paragraphCount:paragraphs.length});
        check('reflow-reader-wrap-no-horizontal-overflow',!!reader&&reader.scrollWidth<=reader.clientWidth+1&&!!text&&text.scrollWidth<=text.clientWidth+1&&document.documentElement.scrollWidth<=document.documentElement.clientWidth+1);
        check('reflow-reader-no-added-summary-claim',!!reader&&/extract|source order|original/i.test(reader.textContent)&&/no summary|no added|no.*added content/i.test(reader.textContent),{contentNotRetained:true,doesNotProveExtractionAccuracy:true});
        const before=page(); await click(S.next,'reader-next-page'); await wait(()=>page()===before+1&&visible(q(S.sourceText))&&new RegExp('slide\\s*'+page(),'i').test(q(S.reader)?.getAttribute('aria-label')||''));
        check('reflow-reader-follows-active-page',page()===before+1&&visible(q(S.sourceText))&&new RegExp('slide\\s*'+page(),'i').test(q(S.reader)?.getAttribute('aria-label')||''));
        await click(S.readerClose,'close-reader'); await click(S.fit,'restore-fit-page'); await geometrySettled();
        const controls=[q(S.fit),q(S.readableZoom),q(S.textToggle)].filter(Boolean), bad=controls.filter(e=>{const b=bounds(e);return b.w<RUN.thresholds.targetPx-.1||b.h<RUN.thresholds.targetPx-.1;});
        check('reader-controls-focus-and-target-size',controls.length===3&&bad.length===0&&controls.every(e=>{e.focus({preventScroll:true});return document.activeElement===e;}),{count:controls.length,undersized:bad.length,physicalTabOrderTested:false});
      } else if (RUN.case === 'context') {
        const current=page(); await click(S.askSlide,'ask-this-slide'); await wait(()=>visible(q(S.chat))&&q(S.filter)?.value==='ui-fixture-a');
        check('ask-slide-opens-scoped-composer',visible(q(S.chat))&&q(S.filter)?.value==='ui-fixture-a'&&new RegExp('slide\\s*'+current,'i').test(q(S.slideContext)?.textContent||''));
        check('ask-slide-prefills-without-submitting',!!q(S.input)?.value&&(await queryCalls()).length===0);
        await sendMock(); let calls=await queryCalls();
        check('slide-query-preserves-document-and-page',calls.length===1&&calls[0].documentId==='ui-fixture-a'&&calls[0].slide===current,{mockPayloadOnly:true});
        setValue(q(S.filter),'ui-fixture-b'); await sleep(300);
        check('document-filter-clears-slide-context',q(S.filter)?.value==='ui-fixture-b'&&!visible(q(S.slideContext)));
        const details=q(S.documents); if(details&&!details.open){details.querySelector('summary')?.click();await sleep(100);}
        const prior=calls.length; await click(S.askDocument,'ask-this-document');
        check('ask-document-prefills-without-submitting',q(S.filter)?.value==='ui-fixture-b'&&!!q(S.input)?.value&&(await queryCalls()).length===prior);
        await sendMock(); calls=await queryCalls();
        check('document-query-preserves-filter',calls.length===prior+1&&calls.at(-1).documentId==='ui-fixture-b'&&calls.at(-1).slide===null,{mockPayloadOnly:true});
        setValue(q(S.filter),'ui-fixture-pending');await sleep(250);setValue(q(S.input),'MOCK pending source query.');await sleep(100);
        check('pending-source-does-not-broaden-scope',q(S.filter)?.value==='ui-fixture-pending'&&!!q(S.send)?.disabled&&(await queryCalls()).length===calls.length);
        const handles=qa(S.companionResize).filter(visible), handle=handles.find(e=>e.getAttribute('role')==='separator'||e.matches('input[type="range"]'));
        let resized=false;
        if(handle){const region=q(S.companion), beforeBounds=bounds(region), isRange=handle.matches('input[type="range"]'), before=isRange?handle.value:handle.getAttribute('aria-valuenow'), numeric=Number(before),max=Number(isRange?handle.max:handle.getAttribute('aria-valuemax'));
          if (isRange) { setValue(handle,String(numeric+(numeric>=max?-1:1)*Number(handle.step||10))); await sleep(350); }
          else await press(handle,handle.getAttribute('aria-orientation')==='horizontal'?(numeric>=max?'ArrowUp':'ArrowDown'):(numeric>=max?'ArrowLeft':'ArrowRight'));
          const afterBounds=bounds(region);resized=(isRange?handle.value:handle.getAttribute('aria-valuenow'))!==before&&!!beforeBounds&&!!afterBounds&&(Math.abs(afterBounds.w-beforeBounds.w)>.5||Math.abs(afterBounds.h-beforeBounds.h)>.5);}
        check('synthetic-companion-resize',!!handle&&resized,{syntheticKeyboardOnly:true,handleCount:handles.length});
        const chat=q(S.chat); const focusTargets=chat?activeControls(chat):[];
        check('companion-focusable-targets-44',focusTargets.length>0&&focusTargets.every(e=>{const r=bounds(e);return r.w>=43.9&&r.h>=43.9;}),{tested:focusTargets.length});
        check('companion-outside-canvas',overlap(bounds(q(S.chat)),bounds(q(S.canvas)))<=1);
        await press(q(S.chatClose)||chat,'Escape');
        check('synthetic-escape-closes-companion',!visible(q(S.chat)),{physicalKeyboardTested:false});
        const hidden=q(S.chat), focusCandidates=hidden?[...hidden.querySelectorAll('button,a[href],input,textarea,select,[tabindex]')]:[];
        const restored=document.activeElement;
        check('closed-companion-inert-and-unfocusable',(!hidden||hidden.hidden||hidden.inert||hidden.getAttribute('aria-hidden')==='true')&&focusCandidates.every(e=>{e.focus({preventScroll:true});return document.activeElement!==e;}));
        check('companion-restores-trigger-focus',!!restored&&(restored.matches(S.chatOpen)||restored.matches(S.askSlide)),{nativeFocusProbe:true});
      } else if (RUN.case === 'citations') {
        await sendMock(); await wait(()=>visible(q(S.citation))); await click(S.citation,'open-mock-citation'); await wait(()=>visible(q(S.original)));
        const original=q(S.original), url=original?new URL(original.href,location.origin):null;
        check('citation-opens-labelled-source-panel',visible(q(S.citationPanel))&&!!q(S.citationPanel)?.getAttribute('aria-labelledby')&&q(S.citation)?.getAttribute('aria-expanded')==='true');
        check('citation-original-is-same-origin-protected-path',!!url&&url.origin===location.origin&&url.pathname.startsWith('/api/')&&!url.search&&!url.hash,{mockLinkPolicyOnly:true});
        check('citation-panel-receives-focus',!!q(S.citationPanel)&&q(S.citationPanel).contains(document.activeElement));
        await click(S.citationClose,'close-citation');
        check('citation-close-restores-focus',!visible(q(S.citationPanel))&&document.activeElement===q(S.citation));
        for(const scenario of ['external','javascript','data']){
          await control({citation:scenario});await click(S.citation,'open-'+scenario+'-citation');await sleep(300);
          check('citation-rejects-'+scenario+'-original',visible(q(S.citationPanel))&&!q(S.original));
          await click(S.citationClose,'close-'+scenario+'-citation');
        }
        await control({citation:'error'});await click(S.citation,'open-failing-citation');await sleep(350);
        check('citation-fetch-failure-no-invented-excerpt',visible(q(S.citationPanel))&&!q(S.original)&&!q(S.citationPanel)?.querySelector('blockquote')&&/unavailable|could not|retry/i.test(q(S.citationPanel)?.textContent||''));
        await click(S.citationClose,'close-failed-citation');await control({citation:'denied'});await click(S.citation,'open-unauthorized-citation');await wait(()=>visible(q(S.gate)));
        check('citation-401-clears-protected-content',visible(q(S.gate))&&!visible(q(S.citationPanel))&&!q(S.citation)&&!q(S.original));
      } else if (RUN.case === 'source-errors') {
        await openChat();await sleep(400);setValue(q(S.input),'MOCK disabled-source query.');await sleep(100);
        check('source-load-error-visible',/sources could not be loaded|sources.*unavailable/i.test(q(S.chat)?.textContent||''));
        check('source-load-error-disables-query',!!q(S.send)?.disabled&&(await queryCalls()).length===0);
        await control({documents:'ready'});await retrySources();await wait(()=>q(S.filter)?.querySelector('option[value="ui-fixture-b"]'));
        check('source-load-retry-recovers-fixture-list',!!q(S.filter)?.querySelector('option[value="ui-fixture-b"]'),{mockRecoveryOnly:true});
        setValue(q(S.filter),'ui-fixture-b');await sleep(100);await control({query:'error'});await sendMock();
        check('chat-fetch-error-visible-no-fallback-answer',/MOCK chat transport failure|request failed|retry/i.test(q(S.chat)?.textContent||'')&&!/MOCK UI fixture response/.test(q(S.chat)?.textContent||'')&&!q(S.citation));
        check('chat-fetch-error-preserves-filter',q(S.filter)?.value==='ui-fixture-b'&&(await queryCalls()).at(-1)?.documentId==='ui-fixture-b');
      } else if (RUN.case === 'source-loading') {
        await openChat();await wait(()=>q(S.filter)?.querySelector('option[value="ui-fixture-pending"]'));
        const details=q(S.documents);if(details&&!details.open){details.querySelector('summary')?.click();await sleep(100);}
        setValue(q(S.input),'MOCK processing-source query.');await sleep(100);
        check('source-processing-status-visible',!!q(S.documents)&&/processing|ingest|loading|indexing/i.test(q(S.documents).textContent||''));
        check('source-processing-disables-query',!!q(S.send)?.disabled&&(await queryCalls()).length===0);
        check('source-processing-no-answer-or-citation',!q(S.citation)&&!q(S.citationPanel)&&!/MOCK UI fixture response/.test(q(S.chat)?.textContent||''));
        await control({documents:'ready'});
        const ready=await wait(()=>q(S.send)&&!q(S.send).disabled,8000);
        check('source-processing-poll-recovers-fixture-list',ready,{mockPollingOnly:true});
      } else if (RUN.case === 'context-missing') {
        const current=page();await click(S.askSlide,'ask-slide-with-missing-source');await wait(()=>visible(q(S.chat))&&visible(q(S.slideContext)));
        const selected=q(S.filter)?.value;setValue(q(S.input),'MOCK missing-source query.');await sleep(100);
        check('missing-slide-source-does-not-broaden-filter',selected!=='all'&&selected!=='ui-fixture-b'&&new RegExp('slide\\s*'+current,'i').test(q(S.slideContext)?.textContent||''));
        check('missing-slide-source-disables-query',!!q(S.send)?.disabled&&(await queryCalls()).length===0);
        check('missing-slide-source-explains-unavailability',/pending|unavailable|not.*available|not.*loaded|missing|could not/i.test(q(S.chat)?.textContent||''));
      } else if (RUN.case === 'auth-denied') {
        await click(S.askSlide,'ask-slide-without-access');await wait(()=>visible(q(S.gate)));
        const field=q(S.passphrase);
        check('unauthorized-ui-shows-password-gate',visible(q(S.gate))&&field?.type==='password');
        check('unauthorized-ui-blocks-query',!q(S.send)||q(S.send).disabled);
        const access=await fetch(RUN.api.access).then(r=>r.json());
        check('access-contract-authenticated-and-enabled',access.authenticated===false&&typeof access.configured==='boolean',{mockSchemaOnly:true});
        const ledger=await probe();
        check('unauthorized-ui-no-protected-fetch',!ledger.requests.some(r=>['query','session','documents','protected-denied'].includes(r.kind)));
        const citationPath=RUN.mock.deniedCitationPath||'/api/citations/ui-citation-a';
        const [citationResponse,originalResponse]=await Promise.all([fetch(citationPath),fetch(RUN.mock.citationOriginal)]);
        check('mock-protected-citation-and-original-denied',[401,403].includes(citationResponse.status)&&[401,403].includes(originalResponse.status),{classification:'mock response handling, not real endpoint enforcement'});
        check('unauthorized-no-citation-or-original-links',!q(S.citation)&&!q(S.original)&&!q(S.citationPanel));
      } else if (RUN.case === 'audio-error') {
        const original=HTMLMediaElement.prototype.play;let rejections=0;
        try {
          HTMLMediaElement.prototype.play=function(){rejections++;return Promise.reject(new DOMException('MOCK playback rejected','NotAllowedError'));};
          await click(S.toggle,'start-with-play-rejection');await wait(()=>status()==='error');
          check('audio-play-rejection-error-visible',rejections>0&&status()==='error'&&visible(q(S.retry)),{injectedPlayRejections:rejections});
          const t=audio()?.currentTime||0;await sleep(500);
          check('audio-play-rejection-clock-stopped',!audio()||(audio().paused&&Math.abs(audio().currentTime-t)<.1));
        } finally {HTMLMediaElement.prototype.play=original;action('restore-original-audio-play');}
        await click(S.retry,'retry-original-audio');await wait(()=>status()==='speaking'&&audio()&&!audio().paused&&audio().currentTime>0);
        check('audio-retry-original-playback-recovers',status()==='speaking'&&!!audio()&&!audio().paused&&audio().playbackRate===1&&audio().currentTime>0,{isolatedRecoveryNotFullSequence:true});
        await click(S.pause,'pause-recovered-audio');
      } else if (RUN.case === 'fetch-error') {
        const originalFetch=window.fetch, originalSpeak=window.speechSynthesis?.speak;
        let failed=0, browserFallback=0;
        try {
          window.fetch=function(input,...rest){const p=new URL(typeof input==='string'?input:input.url,location.origin).pathname;if(new RegExp(S.guideFetchPattern).test(p)){failed++;return Promise.reject(new TypeError('MOCK fetch failure'));}return originalFetch.call(this,input,...rest);};
          if(window.speechSynthesis)window.speechSynthesis.speak=function(){browserFallback++;};
          await click(S.toggle,'start-with-wrapped-fetch-failure');await wait(()=>status()==='error');await sleep(400);
          check('wrapped-fetch-error-visible',failed>0&&status()==='error'&&visible(q(S.retry)),{injectedFailures:failed});
          check('wrapped-fetch-no-browser-tts-fallback',browserFallback===0,{browserSpeechCalls:browserFallback});
          const t=audio()?.currentTime||0;await sleep(400);
          check('wrapped-fetch-no-false-playback-success',status()==='error'&&(!audio()||(audio().paused&&Math.abs(audio().currentTime-t)<.1)));
        } finally {window.fetch=originalFetch;if(window.speechSynthesis)window.speechSynthesis.speak=originalSpeak;action('restore-original-fetch-and-speech');}
        await click(S.retry,'retry-after-fetch-restored');await wait(()=>status()==='speaking'&&audio()&&!audio().paused&&audio().currentTime>0);
        check('fetch-retry-original-playback-recovers',status()==='speaking'&&!!audio()&&!audio().paused&&audio().playbackRate===1,{isolatedRecoveryNotAvailabilityProof:true});
        await click(S.pause,'pause-recovered-fetch-audio');
      }
    } catch (error) {
      evidence.errors.push({utc:now(),name:error.name,message:'Exception details intentionally omitted'});
      check('extended-harness-execution',false,{errorName:error.name});
    } finally {
      caption(RUN.case);
      evidence.endUTC=now();evidence.ok=evidence.checks.every(c=>c.ok);
      window.__atharEvidenceB64=btoa(unescape(encodeURIComponent(JSON.stringify(evidence))));
      window.__atharTransport=(i,n)=>JSON.stringify({chunk:window.__atharEvidenceB64.slice(i*n,(i+1)*n),more:(i+1)*n<window.__atharEvidenceB64.length});
    }
  })();
  window.__atharPoll=async()=>{if(!window.__atharEvidenceB64)await new Promise(resolve=>setTimeout(resolve,100));return true;};
  return true;
})()
