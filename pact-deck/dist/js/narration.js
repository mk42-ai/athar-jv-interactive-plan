/* Athar Open Agentic Pact deck — Guide Mode v1.5.4 (2026-10-01) — narration/tour engine, rebuilt around one source of truth.
   Docked guide bar (52 px, Manuscript/Sand surface, Falaj-Teal progress, navy text, 8 px grid, 44 px targets; layout space is
   reserved via html.has-guide-bar so the bar never covers slide content, footer or chevrons). Sentence cues
   (/narration/cues.json, built from the ten George clips) drive the active slide, the [data-cue] anchor, the live caption (CC)
   and the transcript highlight. The ten ElevenLabs clips are unchanged — see /narration/clip-map.json. Narration text is never
   edited here.

   v1.5.4 sync model (fixes the "guide not playing / not narrating the slide on screen" reports):
   • slide index → cue is the single source of truth: syncToSlide(n, source) derives clip + sentence from the slide→cue map,
     updates caption/transcript synchronously (independent of audio loading) and decides the audio action.
   • every navigation funnels into it — the deck router (arrow keys, chevrons, rail, dots, swipe, hashchange, Esc overview
     tiles, #/N and #slide-NN deep links), the bar's previous/next buttons, slide-38 country tabs, AUTO hand-overs,
     "Replay intro" return, tab-visibility / window-focus regain and the Resync button. A slide change is detected by
     comparing the visible slide index with the engine's index (never by a timing heuristic), so DOM mutations on the same
     slide can no longer seek the clip backwards (the v1.5.3 loop that stalled AUTO on slides 2 / 5).
   • one monotonic play token: every load/seek/play bumps it, and stale play() promises, loadedmetadata seeks, watchdogs and
     fallback timers from a previous slide are discarded; pause() + src swap + load() happen before the next clip starts.
   • autoplay policy: nothing plays before a user gesture. A persisted "guide on" state restores as a visible
     "tap to start" (blocked) state; the first click / key / touch unlocks and starts the narration on the slide on screen;
     play() rejecting with NotAllowedError surfaces the same blocked state instead of failing silently.
   • network / decode failure: the bar reports "audio unavailable", opens the transcript and runs the cues on a timer
     (measured clip duration) so AUTO still advances; the next clip tries audio again. Next clip is preloaded.
   • AUTO / CC / transcript / mute / "guide on" persist in localStorage and restore on reload without auto-playing.
   • intro film: no narration while the intro gate is open (also on "Replay intro"); narration resumes on the slide that is
     on screen when the gate closes (slide 1 on first load).
   Keyboard: N toggles the guide; ← → change slide (handled by the deck, never intercepted here). */
(function () {
  'use strict';
  var VERSION = 'v1.5.4', KEY = 'athar-narration-prefs-v2', MANIFEST = '/narration/narration-manifest.json', CUES = '/narration/cues.json', TOTAL = 39;
  var T = {
    en: { region: 'Narrated guide', guide: 'Guide', guideOn: 'Guide on', start: 'Start guide', play: 'Play narration', pause: 'Pause narration', mute: 'Mute', unmute: 'Unmute', auto: 'AUTO — advance to the next section when the narration ends', cc: 'CC — live caption of the sentence being narrated', tx: 'Transcript', txOpen: 'Hide transcript', txShow: 'Show transcript', resync: 'Resync the narration to this slide', resyncShort: 'Resync', narratingN: 'Narrating slide {n} of 39', pausedN: 'Guide paused · slide {n} of 39', readyN: 'Guide ready · slide {n} of 39', loadingN: 'Loading narration · slide {n} of 39', blockedN: 'Blocked by the browser — tap or press a key to start the guide · slide {n} of 39', unavailableN: 'Audio unavailable — transcript shown · slide {n} of 39', endedN: 'Narration finished · slide {n} of 39', none: 'No narration for this slide', intro: 'Intro film', of: 'of', slide: 'Slide', seek: 'Narration position', key: 'N guide on/off · ← → slides', voice: 'George · ElevenLabs eleven_multilingual_v2', arNote: 'Guide audio is in English; Arabic transcript pending.', listen: 'Listen to the guide', prev: 'Previous slide', next: 'Next slide', introTx: 'Intro film · transcript', introPos: 'Intro narration position', status: 'Guide status' },
    ar: { region: 'الدليل الصوتي', guide: 'الدليل', guideOn: 'الدليل يعمل', start: 'بدء الدليل', play: 'تشغيل التعليق', pause: 'إيقاف مؤقت', mute: 'كتم', unmute: 'إلغاء الكتم', auto: 'تلقائي — الانتقال إلى القسم التالي عند انتهاء التعليق', cc: 'CC — تعليق مباشر للجملة المسرودة', tx: 'النص', txOpen: 'إخفاء النص', txShow: 'إظهار النص', resync: 'إعادة مزامنة التعليق مع هذه الشريحة', resyncShort: 'مزامنة', narratingN: 'يروي الدليل الشريحة {n} من 39', pausedN: 'الدليل متوقف مؤقتًا · الشريحة {n} من 39', readyN: 'الدليل جاهز · الشريحة {n} من 39', loadingN: 'جارٍ تحميل التعليق · الشريحة {n} من 39', blockedN: 'منع المتصفح التشغيل التلقائي — اضغط أو المس الشاشة لبدء الدليل · الشريحة {n} من 39', unavailableN: 'الصوت غير متاح — النص معروض · الشريحة {n} من 39', endedN: 'انتهى التعليق · الشريحة {n} من 39', none: 'لا يوجد تعليق لهذه الشريحة', intro: 'فيلم المقدمة', of: 'من', slide: 'الشريحة', seek: 'موضع التعليق', key: 'N تشغيل/إيقاف الدليل · ← → الشرائح', voice: 'جورج · ElevenLabs eleven_multilingual_v2', arNote: 'الدليل الصوتي بالإنجليزية؛ النص العربي قيد الإعداد.', listen: 'استمع إلى الدليل', prev: 'الشريحة السابقة', next: 'الشريحة التالية', introTx: 'فيلم المقدمة · النص', introPos: 'موضع تعليق المقدمة', status: 'حالة الدليل' }
  };
  var ANCHORS = { 's13-c2': '#s-pillar-plugins .pv-svg', 's14-c1': '#s-pillar-skills h2', 's17-c1': '#s-pillar-universal-licence h2', 's29-c1': '#s-it-tiers .it-tiers', 's29-c2': '#s-it-tiers .it-tier--t3', 's30-c1': '#s-it-metrics [data-testid="agreement-band"]', 's31-c1': '#s-it-sustain h2', 's36-c1': '#s-aos-roadmap .aos-tl-grid, #s-aos-roadmap h2', 's38-c1': '#s-aos-nations h2', 's38-c2': '#s-aos-nations .aos-country:nth-of-type(1)', 's38-c3': '#s-aos-nations .aos-country:nth-of-type(2)', 's38-c4': '#s-aos-nations .aos-country:nth-of-type(3)', 's39-c4': '#s-closing .cta, #s-closing a', 's39-c7': '#s-closing .cta, #s-closing a' };
  var TAB_CUE = { lb: 's38-c2', 'in': 's38-c3', ke: 's38-c4' };
  var prefs = load(); var man = null, segs = {}, byN = {}, cues = {}, ui = {}, preloaded = {}, syncLog = [], lastHl = null, selfClick = false;
  var S = { n: 0, seg: null, clip: null, cue: null, cueClip: null, on: !!prefs.on, unlocked: false, blocked: false, hold: false, token: 0, audio: 'idle', pendingNav: 0, pendingSrc: '', pendingNavAt: 0, pendingSeek: null, fallback: null, watchdog: null, ownPauseAt: 0, debounce: null };
  var audio = new Audio(); audio.preload = 'auto'; audio.volume = prefs.volume; audio.muted = !!prefs.muted;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function load() { try { var p = JSON.parse(localStorage.getItem(KEY) || '{}'); return { autoplay: p.autoplay !== false, muted: !!p.muted, captions: p.captions !== false, transcript: !!p.transcript, volume: typeof p.volume === 'number' ? p.volume : 0.9, on: !!p.on }; } catch (e) { return { autoplay: true, muted: false, captions: true, transcript: false, volume: 0.9, on: false }; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }
  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function fmt(s) { if (!isFinite(s)) return '0:00'; s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function fill(str, n) { return String(str).replace('{n}', String(n)); }
  function currentN() { try { if (window.AtharImpactTiers && typeof window.AtharImpactTiers.current === 'function') { var c = window.AtharImpactTiers.current(); if (c) return c; } } catch (e) {} var a = document.querySelector('#root section.slide.is-active:not(.it-slide)'); var n = a ? parseInt(a.getAttribute('data-n'), 10) : 0; return n === 28 ? TOTAL : (n || 0); }
  function introActive() { var g = document.querySelector('.intro-gate'); return !!(g && g.offsetParent !== null); }
  function hashFor(n) { return n <= 27 ? '#/' + n : (n === TOTAL ? '#/28' : '#/27/new-' + (n - 27)); }
  function hasActivation() { try { return !!(navigator.userActivation && navigator.userActivation.hasBeenActive); } catch (e) { return false; } }
  function icon(k) { var d = { play: 'M8 5v14l11-7z', pause: 'M7 5h4v14H7zM13 5h4v14h-4z', prev: 'M15 6l-6 6 6 6', next: 'M9 6l6 6-6 6', sound: 'M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12', muted: 'M4 10v4h4l5 4V6L8 10zM16 9l5 6M21 9l-5 6', up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6', resync: 'M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5' }[k]; return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="' + d + '" fill="' + (k === 'play' || k === 'pause' ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }

  /* ---------- slide → cue map (pure) ---------- */
  function clipOf(n) { var s = byN[n]; return s && s.audio ? s.clipId : null; }
  function clipSrc(clipId) { return cues[clipId] ? cues[clipId].file : null; }
  function cueList(clipId) { var c = cues[clipId]; return c ? c.cues : []; }
  function cueAt(clipId, t) { var list = cueList(clipId); for (var i = 0; i < list.length; i++) { if (t >= list[i].start && (t < list[i].end || i === list.length - 1)) return list[i]; } return null; }
  function cueFor(clipId, n) { /* the sentence that narrates slide n: its own first sentence, else the last sentence of an earlier slide of the section */
    var list = cueList(clipId), first = null, cover = null; for (var i = 0; i < list.length; i++) { if (list[i].slide === n && !first) first = list[i]; if (list[i].slide <= n) cover = list[i]; } return first || cover || list[0] || null; }
  function covers(clipId, q, n) { /* true when sentence q narrates slide n (n is q's slide or a following slide before the next sentence's slide) */
    if (!q || n < q.slide) return false; var list = cueList(clipId); if (!list.length) return n === q.slide; for (var i = 0; i < list.length; i++) { if (list[i].i > q.i && list[i].slide > q.slide) return n < list[i].slide; } return true; }
  function cueByAnchor(clipId, anchor) { var list = cueList(clipId); for (var i = 0; i < list.length; i++) if (list[i].anchor === anchor) return list[i]; return null; }
  function duration(clipId) { var c = cues[clipId]; return c && c.durationSec ? c.durationSec : (audio.duration || 0); }
  function now() { return S.fallback ? Math.max(0, (performance.now() - S.fallback.t0) / 1000) : (audio.currentTime || 0); }

  /* ---------- UI ---------- */
  function build() {
    if (ui.root) return;
    var L = T[lang()];
    var root = el('aside', 'gbar'); root.id = 'athar-narration'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', L.region); root.setAttribute('data-testid', 'narration-player'); root.setAttribute('data-version', VERSION);
    var seek = el('div', 'gbar-seek'); seek.setAttribute('role', 'progressbar'); seek.setAttribute('aria-label', L.seek); seek.setAttribute('aria-valuemin', '0'); seek.setAttribute('aria-valuemax', '100'); seek.setAttribute('aria-valuenow', '0'); seek.setAttribute('data-testid', 'nar-seek');
    var fillEl = el('div', 'gbar-fill'); seek.appendChild(fillEl); root.appendChild(seek);
    var row = el('div', 'gbar-row');
    var prev = el('button', 'gbar-btn gbar-icon gbar-nav gbar-prev'); prev.type = 'button'; prev.setAttribute('data-testid', 'nar-prev'); prev.setAttribute('aria-label', L.prev); prev.title = L.prev; prev.innerHTML = icon('prev'); row.appendChild(prev);
    var guide = el('button', 'gbar-btn gbar-guide'); guide.type = 'button'; guide.setAttribute('data-testid', 'guide-toggle'); guide.setAttribute('aria-pressed', 'false'); guide.textContent = L.guide; row.appendChild(guide);
    var play = el('button', 'gbar-btn gbar-icon gbar-play'); play.type = 'button'; play.setAttribute('data-testid', 'nar-play'); play.innerHTML = icon('play'); row.appendChild(play);
    var mute = el('button', 'gbar-btn gbar-icon gbar-mute'); mute.type = 'button'; mute.setAttribute('data-testid', 'nar-mute'); mute.innerHTML = icon('sound'); row.appendChild(mute);
    var auto = el('button', 'gbar-btn gbar-toggle gbar-auto'); auto.type = 'button'; auto.setAttribute('data-testid', 'nar-autoplay'); auto.setAttribute('aria-pressed', prefs.autoplay ? 'true' : 'false'); auto.innerHTML = '<span class="gbar-dot" aria-hidden="true"></span>AUTO'; auto.title = L.auto; auto.setAttribute('aria-label', L.auto); row.appendChild(auto);
    var cc = el('button', 'gbar-btn gbar-toggle gbar-cc'); cc.type = 'button'; cc.setAttribute('data-testid', 'nar-captions'); cc.setAttribute('aria-pressed', prefs.captions ? 'true' : 'false'); cc.innerHTML = '<span class="gbar-dot" aria-hidden="true"></span>CC'; cc.title = L.cc; cc.setAttribute('aria-label', L.cc); row.appendChild(cc);
    var resync = el('button', 'gbar-btn gbar-icon gbar-resync'); resync.type = 'button'; resync.setAttribute('data-testid', 'nar-resync'); resync.setAttribute('aria-label', L.resync); resync.title = L.resync; resync.innerHTML = icon('resync'); row.appendChild(resync);
    var status = el('div', 'gbar-status'); var ttl = el('span', 'gbar-title'); ttl.setAttribute('role', 'status'); ttl.setAttribute('aria-live', 'polite'); ttl.setAttribute('aria-atomic', 'true'); ttl.setAttribute('data-testid', 'nar-status'); var cap = el('span', 'gbar-caption'); cap.setAttribute('aria-live', 'polite'); cap.setAttribute('data-testid', 'nar-caption'); status.appendChild(ttl); status.appendChild(cap); row.appendChild(status);
    var time = el('span', 'gbar-time', '0:00 / 0:00'); time.setAttribute('aria-label', 'elapsed / total'); row.appendChild(time);
    var tx = el('button', 'gbar-btn gbar-icon gbar-tx'); tx.type = 'button'; tx.setAttribute('data-testid', 'nar-transcript'); tx.setAttribute('aria-expanded', prefs.transcript ? 'true' : 'false'); tx.setAttribute('aria-controls', 'athar-narration-transcript'); tx.innerHTML = icon('up'); row.appendChild(tx);
    var next = el('button', 'gbar-btn gbar-icon gbar-nav gbar-next'); next.type = 'button'; next.setAttribute('data-testid', 'nar-next'); next.setAttribute('aria-label', L.next); next.title = L.next; next.innerHTML = icon('next'); row.appendChild(next);
    root.appendChild(row);
    var drawer = el('div', 'gbar-drawer'); drawer.id = 'athar-narration-transcript'; drawer.setAttribute('role', 'group'); drawer.setAttribute('aria-label', L.tx); drawer.hidden = !prefs.transcript;
    var tEn = el('p', 'gbar-text gbar-text--en'); tEn.setAttribute('lang', 'en'); tEn.dir = 'ltr'; var tAr = el('p', 'gbar-text gbar-text--ar'); tAr.setAttribute('lang', 'ar'); tAr.dir = 'rtl'; var meta = el('p', 'gbar-meta');
    drawer.appendChild(tEn); drawer.appendChild(tAr); drawer.appendChild(meta); root.appendChild(drawer);
    document.body.appendChild(root); document.documentElement.classList.add('has-guide-bar'); fit(); window.addEventListener('resize', fit);
    ui = { root: root, seek: seek, fill: fillEl, guide: guide, play: play, mute: mute, auto: auto, cc: cc, resync: resync, ttl: ttl, cap: cap, time: time, tx: tx, drawer: drawer, tEn: tEn, tAr: tAr, meta: meta, prev: prev, next: next };
    prev.addEventListener('click', function () { unlock(); goRel(-1); }); next.addEventListener('click', function () { unlock(); goRel(1); });
    guide.addEventListener('click', function () { unlock(); toggle(); });
    play.addEventListener('click', function () { unlock(); toggle(); });
    mute.addEventListener('click', function () { prefs.muted = !prefs.muted; audio.muted = prefs.muted; save(); render(); });
    auto.addEventListener('click', function () { prefs.autoplay = !prefs.autoplay; save(); render(); });
    cc.addEventListener('click', function () { prefs.captions = !prefs.captions; save(); render(); });
    tx.addEventListener('click', function () { prefs.transcript = !prefs.transcript; save(); render(); });
    resync.addEventListener('click', function () { unlock(); resyncNow('button'); });
    /* audio events — every handler ignores events from a superseded load (token) */
    audio.addEventListener('timeupdate', tick);
    audio.addEventListener('loadedmetadata', function () { if (S.pendingSeek != null) { var t = S.pendingSeek; S.pendingSeek = null; try { audio.currentTime = t; } catch (e) {} } progress(); });
    audio.addEventListener('canplay', function () { clearWatchdog(); if (S.audio === 'loading') { S.audio = audio.paused ? 'paused' : 'starting'; render(); } });
    audio.addEventListener('play', function () { S.audio = 'starting'; render(); });
    audio.addEventListener('playing', function () { S.audio = 'playing'; S.blocked = false; render(); });
    audio.addEventListener('waiting', function () { if (!audio.paused) { S.audio = 'buffering'; render(); } });
    audio.addEventListener('pause', function () { if (audio.ended) return; S.audio = (!S.on || Date.now() - S.ownPauseAt < 800) ? (S.audio === 'loading' ? 'loading' : 'paused') : 'interrupted'; render(); logSync(S.audio); });
    audio.addEventListener('ended', function () { onEnded(); });
    audio.addEventListener('error', function () { if (S.clip && !S.fallback && S.on) enterFallback('error:' + (audio.error ? audio.error.code : '?')); });
    audio.addEventListener('stalled', function () { /* network stall: the watchdog decides */ });
    /* user wheel / touch / pointer interaction outside the bar pauses the anchor auto-scroll for the current slide (audio and navigation continue) */
    var hold = function (ev) { if (!ui.root || ui.root.contains(ev.target)) return; if (S.on && S.audio === 'playing') { S.hold = true; render(); } };
    ['wheel', 'touchstart', 'pointerdown'].forEach(function (t) { window.addEventListener(t, hold, { passive: true, capture: true }); });
  }
  function fit() { var cs = getComputedStyle(document.documentElement); var fh = parseFloat(cs.getPropertyValue('--footer-h')) || 56, gh = parseFloat(cs.getPropertyValue('--guide-h')) || 52, vh = window.innerHeight || 900; var f = Math.max(0.6, Math.min(1, (vh - fh - gh) / (vh - fh))); document.documentElement.style.setProperty('--guide-fit', f.toFixed(4)); }
  function goRel(d) { var n = Math.max(1, Math.min(TOTAL, currentN() + d)); if (n === currentN()) return; goToSlide(n, 'bar'); }
  function progress() { if (!ui.root) return; var d = S.fallback ? duration(S.clip) : (audio.duration || 0), c = now(), p = d ? Math.min(100, (c / d) * 100) : 0; ui.fill.style.inlineSize = p + '%'; ui.seek.setAttribute('aria-valuenow', String(Math.round(p))); ui.seek.setAttribute('aria-valuetext', fmt(c) + ' / ' + fmt(d)); ui.time.textContent = fmt(c) + ' / ' + fmt(d); }
  function audioState() { if (S.fallback) return 'unavailable'; if (S.blocked) return 'blocked'; if (!S.clip) return 'idle'; if (audio.ended) return 'ended'; if (!audio.paused) return S.audio === 'playing' || S.audio === 'buffering' ? S.audio : 'starting'; return S.audio === 'loading' ? 'loading' : (S.audio === 'interrupted' ? 'interrupted' : 'paused'); }
  function render() {
    if (!ui.root) return; var L = T[lang()], s = S.seg, n = S.n || currentN(), st = audioState(), playing = st === 'playing' || st === 'starting' || st === 'buffering' || (S.fallback && S.on);
    ui.root.setAttribute('lang', lang()); ui.root.dir = lang() === 'ar' ? 'rtl' : 'ltr'; ui.root.setAttribute('aria-label', L.region);
    ui.root.setAttribute('data-narrating', playing ? 'true' : 'false'); ui.root.setAttribute('data-has-audio', s && s.audio ? 'true' : 'false'); ui.root.setAttribute('data-hold', S.hold ? 'true' : 'false'); ui.root.setAttribute('data-blocked', S.blocked ? 'true' : 'false'); ui.root.setAttribute('data-audio', st); ui.root.setAttribute('data-on', S.on ? 'true' : 'false');
    ui.root.classList.toggle('is-playing', playing); ui.root.classList.toggle('is-reduced', reduced); ui.root.classList.toggle('is-blocked', S.blocked); ui.root.classList.toggle('is-unavailable', !!S.fallback);
    ui.guide.textContent = S.blocked ? L.start : (S.on ? L.guideOn : L.guide); ui.guide.setAttribute('aria-pressed', S.on ? 'true' : 'false'); ui.guide.disabled = !(s && s.audio); ui.guide.title = L.key;
    ui.play.innerHTML = icon(S.on && !S.blocked ? 'pause' : 'play'); ui.play.setAttribute('aria-label', S.on && !S.blocked ? L.pause : L.play); ui.play.setAttribute('aria-pressed', S.on ? 'true' : 'false'); ui.play.disabled = !(s && s.audio);
    ui.mute.innerHTML = icon(prefs.muted ? 'muted' : 'sound'); ui.mute.setAttribute('aria-label', prefs.muted ? L.unmute : L.mute); ui.mute.setAttribute('aria-pressed', prefs.muted ? 'true' : 'false');
    ui.auto.setAttribute('aria-pressed', prefs.autoplay ? 'true' : 'false'); ui.auto.title = L.auto; ui.auto.setAttribute('aria-label', L.auto);
    ui.cc.setAttribute('aria-pressed', prefs.captions ? 'true' : 'false'); ui.cc.title = L.cc; ui.cc.setAttribute('aria-label', L.cc);
    ui.resync.setAttribute('aria-label', L.resync); ui.resync.title = L.resync; ui.resync.disabled = !(s && s.audio);
    var drawerOpen = prefs.transcript || !!S.fallback; ui.tx.setAttribute('aria-expanded', drawerOpen ? 'true' : 'false'); ui.tx.setAttribute('aria-label', drawerOpen ? L.txOpen : L.txShow); ui.tx.innerHTML = icon(drawerOpen ? 'down' : 'up'); ui.drawer.hidden = !drawerOpen;
    ui.prev.setAttribute('aria-label', L.prev); ui.prev.title = L.prev; ui.next.setAttribute('aria-label', L.next); ui.next.title = L.next; ui.prev.disabled = n <= 1; ui.next.disabled = n >= TOTAL;
    progress();
    if (!s) { ui.ttl.textContent = L.none; ui.cap.textContent = ''; ui.tEn.textContent = ''; ui.tAr.textContent = ''; ui.tAr.hidden = true; ui.meta.textContent = L.none; ui.root.setAttribute('data-segment', ''); ui.root.setAttribute('data-clip', ''); publish(); return; }
    ui.root.setAttribute('data-segment', s.segmentId); ui.root.setAttribute('data-status', s.status || ''); ui.root.setAttribute('data-clip', s.clipId || '');
    var secLbl = lang() === 'ar' ? (s.sectionAr || s.section || '') : (s.section || '');
    var key = S.blocked ? 'blockedN' : S.fallback ? 'unavailableN' : (S.on ? (playing ? 'narratingN' : (st === 'loading' ? 'loadingN' : (st === 'ended' ? 'endedN' : 'pausedN'))) : 'readyN');
    var title = fill(L[key], n) + (secLbl ? ' · ' + secLbl : '');
    if (ui.ttl.textContent !== title) ui.ttl.textContent = title;
    ui.cap.hidden = !prefs.captions; var capText = prefs.captions && S.cue ? S.cue.text : ''; if (ui.cap.textContent !== capText) ui.cap.textContent = capText;
    renderTranscript(s); publish();
  }
  function renderTranscript(s) {
    var L = T[lang()]; var list = cueList(s.clipId);
    if (ui.tEn.getAttribute('data-seg') !== s.segmentId + '|' + lang()) {
      ui.tEn.setAttribute('data-seg', s.segmentId + '|' + lang()); ui.tEn.textContent = '';
      if (list.length) { list.forEach(function (q, i) { var sp = el('span', 'gbar-sent', q.text + ' '); sp.setAttribute('data-cue-i', String(i)); sp.setAttribute('data-slide', String(q.slide)); sp.setAttribute('data-cue-anchor', q.anchor); ui.tEn.appendChild(sp); }); } else ui.tEn.textContent = s.text || '';
      ui.tAr.textContent = s.textAr || ''; ui.tAr.hidden = !s.textAr;
      ui.meta.textContent = (s.clipId ? s.clipId + ' · ' : '') + L.voice + (lang() === 'ar' && !s.textAr ? ' · ' + L.arNote : '') + ' · ' + L.key;
    }
    var idx = S.cue && S.cueClip === s.clipId ? S.cue.i - 1 : -1; var sps = ui.tEn.querySelectorAll('.gbar-sent');
    for (var i = 0; i < sps.length; i++) { var on = i === idx; if (sps[i].classList.contains('is-active') !== on) { sps[i].classList.toggle('is-active', on); if (on) sps[i].setAttribute('aria-current', 'true'); else sps[i].removeAttribute('aria-current'); if (on && !ui.drawer.hidden) { try { sps[i].scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' }); } catch (e) { sps[i].scrollIntoView(); } } } }
  }
  function publish() { window.__guideState = { version: VERSION, slideIndex: S.n, cueId: S.clip || null, sentence: S.cue && S.cueClip === S.clip ? S.cue.anchor : null, sentenceIndex: S.cue && S.cueClip === S.clip ? S.cue.i : null, sentenceSlide: S.cue && S.cueClip === S.clip ? S.cue.slide : null, audioState: audioState(), autoOn: !!prefs.autoplay, on: S.on, unlocked: S.unlocked, blocked: S.blocked, fallback: !!S.fallback, time: Math.round(now() * 100) / 100, lang: lang(), token: S.token }; }

  /* ---------- the single source of truth: slide index → cue ---------- */
  function setCue(q) { S.cue = q || null; S.cueClip = q ? S.clip : null; }
  function syncToSlide(n, source) {
    var seg = byN[n] || null, prevClip = S.clip, loadedClip = audio.getAttribute('data-clip') || null;
    S.n = n; S.seg = seg; S.clip = seg && seg.audio ? seg.clipId : null; S.hold = false; S.pendingNav = 0;
    if (!S.clip) { stopAudio(); setCue(null); render(); logSync('segment:' + source); return; }
    var target = cueFor(S.clip, n);
    if (source !== 'auto') setCue(target); /* caption + transcript follow the slide immediately, before any audio loads */
    if (S.clip !== prevClip || loadedClip !== S.clip) { loadClip(S.clip, target ? target.start : 0, S.on && !introActive()); }
    else if (source !== 'auto') { var q = cueAt(S.clip, now()); if (!q || !covers(S.clip, q, n) || audio.ended) seekTo(target ? target.start + 0.01 : 0); if (S.on && !S.fallback && audio.paused && !introActive()) tryPlay(); }
    else if (S.on && !S.fallback && audio.paused && !audio.ended && !introActive() && !S.blocked) { tryPlay(); }
    preloadNext(n); render(); logSync('segment:' + source);
  }
  function goToSlide(n, source) {
    n = Math.max(1, Math.min(TOTAL, n | 0)); var cur = currentN();
    if (n === cur) { if (n !== S.n) syncToSlide(n, source); return; }
    S.pendingNav = n; S.pendingSrc = source; S.pendingNavAt = Date.now();
    try { location.hash = hashFor(n); } catch (e) {}
    window.setTimeout(function () { if (S.pendingNav === n) { S.pendingNav = 0; var k = currentN(); if (k && k !== S.n) syncToSlide(k, source); } }, 1500); /* the router did not land: re-derive from what is on screen */
  }
  function onDomChange() {
    var n = currentN(); if (!n) return;
    if (n === S.n) { render(); return; }
    if (S.pendingNav === n) { syncToSlide(n, S.pendingSrc || 'auto'); return; }
    if (S.debounce) return; /* confirm the new slide index across two frames so a transient router state never seeks the clip */
    S.debounce = window.setTimeout(function () { S.debounce = null; var k = currentN(); if (k && k !== S.n) syncToSlide(k, S.pendingNav === k ? (S.pendingSrc || 'auto') : 'user'); }, 50);
  }
  function resyncNow(why) { var n = currentN(); if (!n) return; S.n = 0; syncToSlide(n, 'resync'); if (S.on && !S.fallback && audio.paused && !introActive()) tryPlay(); logSync('resync:' + why); }

  /* ---------- audio control (token-guarded) ---------- */
  function ownPause() { S.ownPauseAt = Date.now(); try { audio.pause(); } catch (e) {} }
  function clearWatchdog() { if (S.watchdog) { clearTimeout(S.watchdog); S.watchdog = null; } }
  function clearFallback() { if (S.fallback) { clearInterval(S.fallback.timer); S.fallback = null; } }
  function stopAudio() { S.token++; clearWatchdog(); clearFallback(); S.pendingSeek = null; ownPause(); audio.removeAttribute('data-clip'); audio.removeAttribute('src'); try { audio.load(); } catch (e) {} S.audio = 'idle'; }
  function loadClip(clipId, startAt, play) {
    var tok = ++S.token; clearWatchdog(); clearFallback(); S.blocked = false; ownPause();
    try { audio.currentTime = 0; } catch (e) {}
    audio.setAttribute('data-clip', clipId); audio.src = clipSrc(clipId); audio.load(); S.audio = 'loading'; S.pendingSeek = startAt || 0; if (!startAt) S.pendingSeek = null;
    S.watchdog = window.setTimeout(function () { if (tok === S.token && S.audio === 'loading' && S.on) enterFallback('timeout'); }, 12000);
    if (play) tryPlay(tok); else render();
  }
  function seekTo(t) { if (S.fallback) { S.fallback.t0 = performance.now() - t * 1000; setCue(cueAt(S.clip, t)); render(); return; } if (audio.readyState >= 1) { try { audio.currentTime = t; S.pendingSeek = null; } catch (e) { S.pendingSeek = t; } } else S.pendingSeek = t; }
  function tryPlay(tok) {
    tok = tok || S.token; if (!S.on || S.fallback || !S.clip || introActive()) return;
    if (!S.unlocked && !hasActivation()) { S.blocked = true; render(); logSync('blocked:no-gesture'); return; } /* never autoplay before a user gesture */
    var p; try { p = audio.play(); } catch (e) { p = Promise.reject(e); }
    if (p && p.then) p.then(function () { if (tok !== S.token) return; S.blocked = false; render(); }, function (err) { if (tok !== S.token) return; var nm = err && err.name; if (nm === 'NotAllowedError') { S.blocked = true; S.audio = 'blocked'; render(); logSync('blocked:NotAllowedError'); } else if (nm === 'AbortError') { /* superseded by a newer load/pause */ } else { enterFallback('play:' + nm); } });
  }
  function unlock() { if (!S.unlocked) { S.unlocked = true; } }
  function onGesture(ev) { if (ev && ev.type === 'keydown' && (ev.key === 'Escape' || ev.key === 'Esc')) return; /* Esc is not an activation-triggering input */ unlock(); if (S.on && !S.fallback && S.clip && audio.paused && !audio.ended && !introActive() && (S.blocked || S.audio === 'interrupted')) { S.blocked = false; window.setTimeout(function () { if (S.on && audio.paused) { S.n = 0; syncToSlide(currentN(), 'resync'); tryPlay(); } }, 0); } }
  function enterFallback(reason) {
    if (S.fallback) return; S.token++; clearWatchdog(); var t0 = now(); ownPause();
    S.fallback = { clip: S.clip, reason: reason, t0: performance.now() - t0 * 1000, timer: window.setInterval(function () { if (!S.fallback) return; if (!S.on || introActive()) { S.fallback.t0 += 250; return; } tick(); if (now() >= duration(S.clip)) { clearFallback(); onEnded(); } }, 250) };
    S.pendingSeek = null; render(); logSync('fallback:' + reason);
  }
  function onEnded() { clearWatchdog(); S.audio = 'ended'; clearHighlight(); render(); logSync('ended'); if (S.on && prefs.autoplay && !introActive()) advance(); else render(); }
  function advance() { var nx = null; for (var k = S.n + 1; k <= TOTAL; k++) { var c = byN[k]; if (c && c.audio && c.clipId !== S.clip) { nx = c; break; } } if (!nx) { S.on = false; prefs.on = false; save(); render(); return; } goToSlide(nx.n, 'auto'); }
  function preloadNext(n) { var nx = null; for (var k = n + 1; k <= TOTAL; k++) { var c = byN[k]; if (c && c.audio && c.clipId !== S.clip) { nx = c; break; } } if (nx && !preloaded[nx.audio]) { preloaded[nx.audio] = true; try { var a = new Audio(); a.preload = 'auto'; a.src = nx.audio; } catch (e) {} } }
  function start() { S.on = true; prefs.on = true; save(); S.n = 0; syncToSlide(currentN(), 'resync'); if (!S.fallback && audio.paused && !introActive()) tryPlay(); render(); }
  function pause() { S.on = false; prefs.on = false; save(); S.blocked = false; ownPause(); render(); logSync('pause'); }
  function toggle() { if (!S.seg || !S.seg.audio) return; if (S.on && !S.blocked) pause(); else start(); }
  function playIntro() { /* v1.5.4: the intro film carries no spoken narration; kept for API compatibility — narration starts on slide 1 after the gate closes */ }

  /* ---------- cue engine ---------- */
  function clearHighlight() { if (lastHl) { lastHl.classList.remove('gbar-cue-active'); lastHl = null; } }
  function anchorFor(q) { var sel = ANCHORS[q.anchor]; var e = sel ? document.querySelector(sel) : null; if (!e) e = document.querySelector('[data-cue="' + q.anchor + '"]'); if (!e) { var slide = document.querySelector('section.it-slide.is-active') || document.querySelector('#root section.slide.is-active:not(.it-slide)'); e = slide ? slide.querySelector('h2, h1') : null; } return e; }
  function applyCue(q) {
    if (!q || !S.on || introActive()) return;
    if (q.slide !== S.n && !covers(S.clip, q, S.n)) { goToSlide(q.slide, 'auto'); window.setTimeout(function () { if (S.cue === q) applyAnchor(q); }, 450); } else applyAnchor(q);
  }
  function applyAnchor(q) {
    if (S.hold || !S.on) return; var e = anchorFor(q); if (!e) return;
    if (e.classList && e.classList.contains('aos-country') && !e.classList.contains('is-on')) { selfClick = true; try { e.click(); } catch (er) {} selfClick = false; }
    try { e.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' }); } catch (er) {}
    clearHighlight(); if (!reduced) { e.classList.add('gbar-cue-active'); lastHl = e; }
  }
  function tick() {
    progress(); if (!S.clip || S.pendingSeek != null || introActive()) return; var q = cueAt(S.clip, now());
    if (q && (!S.cue || S.cueClip !== S.clip || S.cue.i !== q.i)) { setCue(q); logSync('cue'); render(); applyCue(q); }
  }
  function onTabClick(ev) { var b = ev.target && ev.target.closest ? ev.target.closest('#s-aos-nations .aos-country') : null; if (!b || selfClick) return; var q = cueByAnchor(S.clip, TAB_CUE[b.getAttribute('data-country')]); if (!q || S.n !== 38) return; unlock(); seekTo(q.start + 0.01); setCue(q); S.hold = false; render(); logSync('tab:' + b.getAttribute('data-country')); if (S.on && !S.fallback && audio.paused && !audio.ended) tryPlay(); }
  function logSync(why) { try { syncLog.push({ t: Date.now(), why: why, slide: S.n, visible: currentN(), clip: S.clip, cue: S.cue ? S.cue.i : null, cueSlide: S.cue ? S.cue.slide : null, audioTime: Math.round(now() * 100) / 100, state: audioState(), on: S.on }); if (syncLog.length > 500) syncLog.shift(); } catch (e) {} }
  /* ---------- anchors on slide elements ---------- */
  function tagAnchors() {
    document.querySelectorAll('#root section.slide[data-n], section.it-slide').forEach(function (sec) { var n = sec.getAttribute('data-n') ? parseInt(sec.getAttribute('data-n'), 10) : null; if (n === 28) n = TOTAL; if (!n && window.AtharImpactTiers && sec.classList.contains('is-active')) { try { n = window.AtharImpactTiers.current(); } catch (e) {} } if (!n) return; var h = sec.querySelector('h1, h2'); if (h && !h.hasAttribute('data-cue')) h.setAttribute('data-cue', 's' + n + '-c1'); });
    Object.keys(ANCHORS).forEach(function (k) { var e = document.querySelector(ANCHORS[k].split(',')[0]); if (e && !e.hasAttribute('data-cue')) e.setAttribute('data-cue', k); });
  }
  /* ---------- hooks: title-slide button, intro transcript ---------- */
  function hooks() {
    var L = T[lang()];
    var cov = document.getElementById('s-cover'); if (cov) { var cta = cov.querySelector('.cover-copy a.cta'); var ex = cov.querySelector('.nar-listen'); if (cta && (!ex || ex.getAttribute('data-lang') !== lang())) { if (ex) ex.remove(); var b = el('button', 'nar-listen', L.listen); b.type = 'button'; b.setAttribute('data-testid', 'listen-to-guide'); b.setAttribute('data-lang', lang()); b.addEventListener('click', function () { unlock(); if (!S.on) start(); else resyncNow('listen'); }); cta.parentNode.insertBefore(b, cta.nextSibling); } }
    if (cov && segs.intro && (segs.intro.text || segs.intro.textAr)) { /* bilingual intro-film transcript lives on the cover itself (never clipped, no overlay) */
      var host = cov.querySelector('.cover-copy'); var ex2 = cov.querySelector('.nar-intro');
      if (host && (!ex2 || ex2.getAttribute('data-lang') !== lang())) {
        if (ex2) ex2.remove(); var box = el('section', 'nar-intro'); box.setAttribute('data-testid', 'intro-transcript'); box.setAttribute('data-lang', lang()); box.setAttribute('aria-label', L.introTx);
        var head = el('div', 'nar-intro-head'); head.appendChild(el('span', 'nar-intro-lbl', L.introTx)); box.appendChild(head);
        var cols = el('div', 'nar-intro-cols'); var pe = el('p', 'nar-intro-en', segs.intro.text || ''); pe.setAttribute('lang', 'en'); pe.dir = 'ltr'; var pa = el('p', 'nar-intro-ar', segs.intro.textAr || ''); pa.setAttribute('lang', 'ar'); pa.dir = 'rtl'; cols.appendChild(lang() === 'ar' ? pa : pe); cols.appendChild(lang() === 'ar' ? pe : pa); box.appendChild(cols);
        var anchor = cov.querySelector('.cover-copy .nar-listen') || cov.querySelector('.cover-copy a.cta'); if (anchor && anchor.parentNode === host) host.insertBefore(box, anchor.nextSibling); else host.appendChild(box);
      }
    }
    tagAnchors();
  }
  /* ---------- deep-link alias #slide-NN → the deck's #/N scheme ---------- */
  function aliasHash() { var m = /^#slide-0*(\d+)$/i.exec(location.hash || ''); if (!m) return false; var n = parseInt(m[1], 10); if (!(n >= 1 && n <= TOTAL)) return false; var h = hashFor(n); try { history.replaceState(null, '', h); } catch (e) { location.hash = h; return true; } try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { window.dispatchEvent(new Event('hashchange')); } return true; }
  document.addEventListener('keydown', function (ev) { if (ev.defaultPrevented || ev.altKey || ev.ctrlKey || ev.metaKey) return; var t = ev.target; if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return; if (ev.key === 'n' || ev.key === 'N') { ev.preventDefault(); unlock(); toggle(); } });
  ['pointerdown', 'keydown', 'touchstart', 'mousedown'].forEach(function (t) { window.addEventListener(t, onGesture, { capture: true, passive: true }); });
  document.addEventListener('click', onTabClick, true);
  document.addEventListener('athar:intro-open', function () { if (S.clip && !audio.paused) { ownPause(); S.audio = 'paused'; } render(); logSync('intro-open'); });
  document.addEventListener('athar:intro-finished', function () { window.setTimeout(function () { S.n = 0; syncToSlide(currentN(), 'intro'); if (S.on && !S.fallback && audio.paused && !audio.ended) tryPlay(); logSync('intro-finished'); }, 80); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { resyncNow('visibility'); } });
  window.addEventListener('focus', function () { if (S.on && S.clip && audio.paused && !audio.ended && !S.fallback && !introActive()) resyncNow('focus'); });
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) resyncNow('pageshow'); });
  /* ---------- boot ---------- */
  function boot(m) {
    man = m; (m.segments || []).forEach(function (s) { segs[s.segmentId] = s; byN[s.n] = s; });
    if (hasActivation()) S.unlocked = true;
    build(); hooks(); aliasHash(); onDomChange();
    var root = document.getElementById('root'), pending = false;
    function schedule() { if (pending) return; pending = true; window.requestAnimationFrame(function () { pending = false; try { hooks(); onDomChange(); } catch (e) {} }); }
    if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    new MutationObserver(function () { hooks(); render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    window.addEventListener('hashchange', function () { if (!aliasHash()) schedule(); }); window.addEventListener('load', schedule);
    window.AtharNarration = { version: VERSION, manifest: m, cues: cues, cueFor: function (n) { return cueFor(S.clip, n); }, covers: function (q, n) { return covers(S.clip, q, n); }, current: function () { return S.seg; }, activeCue: function () { return S.cue && S.cueClip === S.clip ? S.cue : null; }, play: start, pause: pause, toggle: toggle, playIntro: playIntro, prefs: prefs, segmentFor: function (n) { return byN[n] || null; }, setCaptions: function (v) { prefs.captions = !!v; save(); render(); }, setTranscript: function (v) { prefs.transcript = !!v; save(); render(); }, isHeld: function () { return S.hold; }, go: goRel, goToSlide: function (n) { goToSlide(n, 'api'); }, alignToSlide: function () { resyncNow('api'); return true; }, resync: function () { resyncNow('api'); }, syncLog: function () { return syncLog.slice(); }, audioTime: function () { return now(); }, audioElement: function () { return audio; }, state: function () { publish(); return window.__guideState; } };
    render();
  }
  Promise.all([fetch(MANIFEST, { cache: 'no-cache' }).then(function (r) { return r.json(); }), fetch(CUES, { cache: 'no-cache' }).then(function (r) { return r.json(); }).catch(function () { return { clips: [] }; })])
    .then(function (res) { (res[1].clips || []).forEach(function (c) { cues[c.clipId] = c; }); boot(res[0]); })
    .catch(function () { /* manifest missing: no guide bar */ });
})();
