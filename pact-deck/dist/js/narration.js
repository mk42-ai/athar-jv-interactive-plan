/* Athar Open Agentic Pact deck — Guide Mode v1.5.4 (2026-10-01) — slide-ID-keyed narration player.
   Fixes the "narration does not always play / narrates a different page than the one on screen" reports (root causes in
   CHANGELOG.md v1.5.4). Docked guide bar (52 px, Manuscript/Sand surface, Falaj-Teal progress, 44 px targets; layout space is
   reserved via html.has-guide-bar so the bar never covers slide content, footer or chevrons).

   ONE SOURCE OF TRUTH — the visible slide's stable id.
   • Every slide <section> carries data-slide-id (= its stable section id, e.g. "s-aos-nations"). The player reads the id of the
     slide that is on screen (never an index, never a timer) and looks its narration up in /narration/slide-narration.json, which
     maps each of the 39 slide ids to exactly ONE George clip (NAR-sNN). Audible clip id ⇔ visible slide id, by construction.
   • Narration never moves the deck. The only navigation the player ever performs is AUTO: after the current slide's clip fires
     'ended' (and only if the generation token still matches) it advances to the next slide.

   SINGLE FINITE STATE MACHINE — idle · loading · playing · paused · blocked · ended (exposed as #athar-narration[data-state]).
     idle    guide off (no audio).                      loading  the visible slide's clip is being fetched / buffered.
     playing the visible slide's clip is audible.       paused   user (or the browser / intro film) paused it.
     blocked play() was rejected (NotAllowedError) or a persisted "guide on" was restored before any user gesture — a visible,
             accessible "Tap to play" control is shown; reason "error" = the clip failed to load (tap to retry).
     ended   the visible slide's clip finished (AUTO off, or last slide).
   ON EVERY NAVIGATION (arrows, chevrons, swipe, rail, dots, Esc-overview tiles, Home/End, #/N · #/27/new-k · #slide-NN deep
   links, bar prev/next, AUTO, language re-render): generation++ → AbortController.abort() on the pending fetch → old audio
   paused and currentTime reset → every pending cue / settle / progress timer cleared → the new slide's clip is loaded and, if
   the guide is engaged, played after a 140 ms settle (so a burst of key presses never starts audio for intermediate slides).
   Every async continuation (fetch, play() promise, playing / pause / ended / timeupdate handlers, timers) carries the
   generation it was started for and is discarded when it no longer matches.
   CC + transcript always show the sentence of the visible slide's clip (first sentence before the audio starts).
   Slide 38 country tabs: a tab click seeks inside the slide-38 clip to that country's sentence (same clip, same slide id), and
   while narrating the tab follows the sentence unless the user picked a tab in the last 6 s.
   Narration text and George audio are unchanged — cut clips are byte ranges of the original section clips; the slides the
   George audio never narrated carry the TTS render of their existing script text (see slide-narration.json → source).
   Keyboard: N = play / pause (start when off, retry when blocked); ← → change slide (handled by the deck, never intercepted). */
(function () {
  'use strict';
  var VERSION = 'v1.6.3', KEY = 'athar-guide-prefs-v3', OLDKEY = 'athar-narration-prefs-v2', TABLE = '/narration/slide-narration.json', MANIFEST = '/narration/narration-manifest.json', TOTAL = 39 + ((window.AtharExecTeam && window.AtharExecTeam.count) || 0), SETTLE_MS = 140, NOCLIP_MS = 9000; /* v1.5.5: 39 + section 09 Executive Team (slides 40–46) */
  var STATES = { idle: 1, loading: 1, playing: 1, paused: 1, blocked: 1, ended: 1 };
  var T = {
    en: { region: 'Narrated guide', guide: 'Guide', guideOn: 'Guide on', play: 'Play narration', pause: 'Pause narration', mute: 'Mute', unmute: 'Unmute', auto: 'AUTO — advance to the next slide when its narration ends', cc: 'CC — live caption of the sentence being narrated', txOpen: 'Hide transcript', txShow: 'Show transcript', tx: 'Transcript', tap: 'Tap to play', tapRetry: 'Retry narration', tapAria: 'The browser blocked the narration. Tap to play the narration for slide {n} of {t}', tapRetryAria: 'The narration could not load. Tap to retry slide {n} of {t}',
      idleN: 'Guide ready · slide {n} of {t}', loadingN: 'Loading narration · slide {n} of {t}', playingN: 'Narrating slide {n} of {t}', pausedN: 'Guide paused · slide {n} of {t}', blockedN: 'Narration blocked by the browser — tap to play · slide {n} of {t}', errorN: 'Narration could not load — tap to retry · slide {n} of {t}', endedN: 'Narration finished · slide {n} of {t}', noclipN: 'No narration clip for slide {n} of {t} yet — caption shown', videoN: 'Guide paused while the film plays · slide {n} of {t}',
      seek: 'Narration position', key: 'N play / pause · ← → slides', voice: 'George · ElevenLabs eleven_multilingual_v2', arNote: 'Guide audio is in English; Arabic transcript pending.', listen: 'Listen to the guide', prev: 'Previous slide', next: 'Next slide', introTx: 'Intro film · transcript', status: 'Guide status' },
    ar: { region: 'الدليل الصوتي', guide: 'الدليل', guideOn: 'الدليل يعمل', play: 'تشغيل التعليق', pause: 'إيقاف مؤقت', mute: 'كتم', unmute: 'إلغاء الكتم', auto: 'تلقائي — الانتقال إلى الشريحة التالية عند انتهاء تعليقها', cc: 'CC — تعليق مباشر للجملة المسرودة', txOpen: 'إخفاء النص', txShow: 'إظهار النص', tx: 'النص', tap: 'اضغط للتشغيل', tapRetry: 'إعادة المحاولة', tapAria: 'منع المتصفح تشغيل التعليق. اضغط لتشغيل تعليق الشريحة {n} من {t}', tapRetryAria: 'تعذّر تحميل التعليق. اضغط لإعادة المحاولة للشريحة {n} من {t}',
      idleN: 'الدليل جاهز · الشريحة {n} من {t}', loadingN: 'جارٍ تحميل التعليق · الشريحة {n} من {t}', playingN: 'يروي الدليل الشريحة {n} من {t}', pausedN: 'الدليل متوقف مؤقتًا · الشريحة {n} من {t}', blockedN: 'منع المتصفح التعليق — اضغط للتشغيل · الشريحة {n} من {t}', errorN: 'تعذّر تحميل التعليق — اضغط لإعادة المحاولة · الشريحة {n} من {t}', endedN: 'انتهى التعليق · الشريحة {n} من {t}', noclipN: 'لا يتوفر مقطع تعليق للشريحة {n} من {t} بعد — يظهر النص', videoN: 'الدليل متوقف أثناء عرض الفيلم · الشريحة {n} من {t}',
      seek: 'موضع التعليق', key: 'N تشغيل/إيقاف · ← → الشرائح', voice: 'جورج · ElevenLabs eleven_multilingual_v2', arNote: 'الدليل الصوتي بالإنجليزية؛ النص العربي قيد الإعداد.', listen: 'استمع إلى الدليل', prev: 'الشريحة السابقة', next: 'الشريحة التالية', introTx: 'فيلم المقدمة · النص', status: 'حالة الدليل' }
  };
  var TAB_CUE = { lb: 's38-c2', 'in': 's38-c3', ke: 's38-c4' }, CUE_TAB = { 's38-c2': 'lb', 's38-c3': 'in', 's38-c4': 'ke' }, NATIONS = 's-aos-nations';
  var prefs = loadPrefs(), BY_ID = {}, ORDER = [], manifest = null, ui = {}, cache = {}, cacheOrder = [], journal = [], selfClick = false, booted = false;
  var S = { state: 'idle', reason: '', gen: 0, slideId: null, n: 0, clip: null, cue: null, ac: null, pac: null, timers: [], raf: 0, unlocked: false, ownPause: false, resumeAfterIntro: false, userTabAt: 0, navCause: '', lastHl: null };
  var audio = new Audio(); audio.preload = 'auto'; audio.volume = prefs.volume; audio.muted = !!prefs.muted; audio.setAttribute('data-guide', 'athar');
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- small helpers ---------- */
  function loadPrefs() {
    var d = { auto: true, captions: true, transcript: false, muted: false, volume: 0.9, on: false };
    try { var p = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!p) { var o = JSON.parse(localStorage.getItem(OLDKEY) || '{}'); p = { auto: o.autoplay, captions: o.captions, transcript: o.transcript, muted: o.muted, volume: o.volume, on: o.on }; }
      return { auto: p.auto !== false, captions: p.captions !== false, transcript: !!p.transcript, muted: !!p.muted, volume: typeof p.volume === 'number' ? p.volume : 0.9, on: !!p.on }; } catch (e) { return d; }
  }
  function savePrefs() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }
  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function fmt(s) { if (!isFinite(s)) return '0:00'; s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function fill(str, n) { return String(str).replace('{n}', String(n)).replace('{t}', String(TOTAL)); }
  function hashFor(n) { return n <= 27 ? '#/' + n : n <= 38 ? '#/27/new-' + (n - 27) : n === 39 ? '#/28' : '#/28/exec-' + (n - 39); } /* v1.5.5: slides 40–46 */
  function introActive() { var g = document.querySelector('.intro-gate'); return !!(g && g.offsetParent !== null); }
  function iso() { return new Date().toISOString(); }
  function log(ev, extra) { var r = { t: iso(), ev: ev, state: S.state, reason: S.reason, gen: S.gen, slideId: S.slideId, clip: S.clip ? S.clip.clipId : null, at: Math.round((audio.currentTime || 0) * 100) / 100 }; if (extra) for (var k in extra) r[k] = extra[k]; journal.push(r); if (journal.length > 600) journal.shift(); }
  function icon(k) { var d = { play: 'M8 5v14l11-7z', pause: 'M7 5h4v14H7zM13 5h4v14h-4z', prev: 'M15 6l-6 6 6 6', next: 'M9 6l6 6-6 6', sound: 'M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12', muted: 'M4 10v4h4l5 4V6L8 10zM16 9l5 6M21 9l-5 6', up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6' }[k]; return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="' + d + '" fill="' + (k === 'play' || k === 'pause' ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }

  /* ---------- slide identity (stable ids, never indexes) ---------- */
  function tagSlides() { var list = document.querySelectorAll('#root section.slide'); for (var i = 0; i < list.length; i++) { var s = list[i]; if (s.id && s.getAttribute('data-slide-id') !== s.id) s.setAttribute('data-slide-id', s.id); } }
  function visibleSection() { var virt = document.body && document.body.classList.contains('it-virtual'); return virt ? document.querySelector('#root section.it-slide.is-active') : document.querySelector('#root section.slide.is-active:not(.it-slide)'); }
  function visibleSlideId() { var s = visibleSection(); if (!s) return null; var id = s.getAttribute('data-slide-id') || s.id || null; return id && BY_ID[id] ? id : null; }
  function entry(id) { return id ? BY_ID[id] || null : null; }
  function nextId(id) { var e = entry(id); return e && e.n < TOTAL ? ORDER[e.n] : null; } /* ORDER is 0-based: ORDER[n] is slide n+1 */
  function current() { return !!(S.clip && audio.getAttribute('data-gen') === String(S.gen) && S.clip.slideId === S.slideId); }

  /* ---------- the state machine ---------- */
  function setState(st, reason) { if (!STATES[st]) throw new Error('guide: unknown state ' + st); var prev = S.state; S.state = st; S.reason = reason || ''; if (st !== 'idle') { prefs.on = true; } savePrefs(); log('state', { from: prev }); render(); }
  function later(fn, ms, g) { var id = window.setTimeout(function () { S.timers = S.timers.filter(function (x) { return x !== id; }); if (g === S.gen) fn(); }, ms); S.timers.push(id); return id; }
  function clearPending() { S.timers.forEach(function (id) { window.clearTimeout(id); }); S.timers = []; if (S.raf) { window.cancelAnimationFrame(S.raf); S.raf = 0; } }
  function abortLoads() { if (S.ac) { try { S.ac.abort(); } catch (e) {} S.ac = null; } if (S.pac) { try { S.pac.abort(); } catch (e) {} S.pac = null; } }
  function hardStop() { abortLoads(); clearPending(); S.ownPause = true; try { audio.pause(); } catch (e) {} try { if (audio.readyState > 0) audio.currentTime = 0; } catch (e) {} S.ownPause = false; clearHighlight(); }
  function engaged() { return S.state !== 'idle'; }

  /* every navigation path ends here (detected from the DOM: the slide on screen changed) */
  function onSlideChange(id, cause) {
    var g = ++S.gen; hardStop(); var e = entry(id); S.slideId = id; S.n = e ? e.n : 0; S.cue = e && e.cues && e.cues.length ? e.cues[0] : null;
    log('slide', { cause: cause }); S.resumeAfterFilm = false;
    if (e && S.state === 'paused' && S.reason === 'video') { setState('loading'); prepare(e, g, true); return; } /* v1.5.5: the film paused the guide; a new slide re-engages it */
    if (!e) { render(); return; }
    if (S.state === 'idle') { render(); return; }                                        /* guide off: labels + caption follow the slide, no audio */
    if (S.state === 'paused' && S.reason !== 'intro') { prepare(e, g, false); render(); return; } /* stay paused on the new slide (its clip is ready) */
    if (S.state === 'blocked' && !(S.reason === 'autoplay' && S.unlocked)) { prepare(e, g, false); render(); return; }
    if (introActive()) { S.resumeAfterIntro = true; setState('paused', 'intro'); prepare(e, g, false); return; }
    setState('loading'); prepare(e, g, true);                                              /* loading / playing / ended → narrate the slide on screen */
  }
  /* fetch the slide's clip (abortable) and put it in the single <audio> element; optionally play after the settle delay */
  function prepare(e, g, play) {
    if (!e.file) { noClip(e, g, play); return; } /* v1.5.5: slides whose George clip has not been generated yet */
    if (S.ac) { try { S.ac.abort(); } catch (x) {} }
    var ac = ('AbortController' in window) ? new AbortController() : null; S.ac = ac;
    blobUrl(e, ac ? ac.signal : undefined).then(function (url) {
      if (g !== S.gen) return;                                                              /* superseded while loading */
      if (S.ac === ac) S.ac = null;
      S.clip = e; audio.setAttribute('data-gen', String(g)); audio.setAttribute('data-clip', e.clipId); audio.setAttribute('data-slide-id', e.slideId);
      if (audio.getAttribute('src') !== url) { audio.src = url; try { audio.load(); } catch (x) {} } else { try { audio.currentTime = 0; } catch (x) {} }
      render();
      if (play) later(function () { playNow(g); }, SETTLE_MS, g);
    }, function (err) { if (g !== S.gen || (err && err.name === 'AbortError')) return; log('load-error', { err: String(err && err.message || err) }); if (engaged()) setState('blocked', 'error'); });
  }
  function filmOnSlide() { var sec = visibleSection(); return !!(sec && sec.querySelector('video[data-narration-pause]')); }
  function noClip(e, g, play) { /* v1.5.5: no clip → caption only; AUTO moves on after NOCLIP_MS unless the slide carries the impact-story film */
    S.clip = null; try { audio.removeAttribute('src'); audio.load(); } catch (x) {} audio.setAttribute('data-gen', String(g));
    if (play && S.state !== 'idle') { setState('ended', 'no-clip'); if (prefs.auto && !introActive() && !filmOnSlide()) { var nx = nextId(S.slideId); if (nx) later(function () { if (S.filmPlaying) return; S.navCause = 'auto'; log('auto-advance', { to: nx, reason: 'no-clip' }); try { location.hash = hashFor(entry(nx).n); } catch (x) {} }, NOCLIP_MS, g); } }
    render();
  }
  function blobUrl(e, signal) {
    if (cache[e.clipId]) return Promise.resolve(cache[e.clipId]);
    if (!window.fetch || !window.URL || !URL.createObjectURL) return Promise.resolve(e.file);
    return fetch(e.file, { signal: signal, credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + e.file); return r.blob(); }).then(function (b) {
      var u = URL.createObjectURL(b); cache[e.clipId] = u; cacheOrder.push(e.clipId);
      while (cacheOrder.length > 10) { var old = cacheOrder.shift(); if (cache[old] && audio.getAttribute('src') !== cache[old]) { URL.revokeObjectURL(cache[old]); delete cache[old]; } else { cacheOrder.push(old); break; } }
      return u;
    });
  }
  function prefetchNext() { var nx = entry(nextId(S.slideId)); if (!nx || cache[nx.clipId] || S.pac) return; var ac = ('AbortController' in window) ? new AbortController() : null; S.pac = ac; blobUrl(nx, ac ? ac.signal : undefined).then(function () { if (S.pac === ac) S.pac = null; }, function () { if (S.pac === ac) S.pac = null; }); }
  function playNow(g) {
    if (g !== S.gen || !S.clip || S.clip.slideId !== S.slideId) return;
    if (introActive()) { S.resumeAfterIntro = true; setState('paused', 'intro'); return; }
    if (!S.unlocked) { setState('blocked', 'autoplay'); return; }                         /* never start before a user gesture */
    if (S.state !== 'loading') setState('loading');
    var p; try { p = audio.play(); } catch (err) { p = Promise.reject(err); }
    if (p && p.then) p.then(function () { if (g !== S.gen && audio.getAttribute('data-gen') !== String(S.gen)) { S.ownPause = true; audio.pause(); S.ownPause = false; } }, function (err) {
      if (g !== S.gen) return; var nm = err && err.name;
      if (nm === 'NotAllowedError') { log('play-rejected', { err: nm }); setState('blocked', 'autoplay'); }
      else if (nm === 'AbortError') { /* superseded by a newer load or pause */ }
      else { log('play-rejected', { err: nm }); setState('blocked', 'error'); }
    });
  }
  /* user intents */
  function start() { S.unlocked = true; if (!S.slideId) observe('start'); var e = entry(S.slideId); if (!e) return; if (!e.file) { var g0 = ++S.gen; hardStop(); setState('loading'); noClip(e, g0, true); return; } if (S.clip && S.clip.slideId === S.slideId && audio.getAttribute('data-gen') === String(S.gen)) { if (audio.ended) { try { audio.currentTime = 0; } catch (x) {} } setState('loading'); playNow(S.gen); return; } var g = ++S.gen; hardStop(); setState('loading'); prepare(e, g, true); }
  function resume() { start(); }
  function pause(reason) { if (S.state === 'idle') return; clearPending(); S.ownPause = true; try { audio.pause(); } catch (e) {} S.ownPause = false; abortLoads(); var e = entry(S.slideId); if (e && (!S.clip || S.clip.slideId !== S.slideId)) prepare(e, S.gen, false); setState('paused', reason || 'user'); }
  function stop() { ++S.gen; hardStop(); setState('idle'); prefs.on = false; savePrefs(); render(); }
  function toggle() { if (S.state === 'playing' || S.state === 'loading') pause('user'); else start(); }
  function goRel(d) { var e = entry(S.slideId); if (!e) return; var n = Math.max(1, Math.min(TOTAL, e.n + d)); if (n !== e.n) { try { location.hash = hashFor(n); } catch (x) {} } }

  /* ---------- audio events (generation-guarded) ---------- */
  audio.addEventListener('playing', function () { if (!current()) { S.ownPause = true; audio.pause(); S.ownPause = false; return; } setState('playing'); loop(S.gen); prefetchNext(); });
  audio.addEventListener('pause', function () { if (!current() || S.ownPause || audio.ended) return; if (S.state === 'playing' || S.state === 'loading') { clearPending(); setState('paused', 'external'); } });
  /* v1.5.5: impact-story film (video[data-narration-pause]) — narration pauses while it plays and resumes after it ends (or stops at its out-point).
     v1.5.9: the same wiring serves EVERY film (the intro gate's film and each Section 09 executive film) and the guide now also resumes when the USER pauses a film, not only at its end. */
  function filmOf(t) { return t && t.tagName === 'VIDEO' && t.hasAttribute && t.hasAttribute('data-narration-pause') ? t : null; }
  document.addEventListener('play', function (ev) { var v = filmOf(ev.target); if (!v) return; S.filmPlaying = true; clearPending();
    if (S.state === 'playing' || S.state === 'loading' || (S.state === 'ended' && S.reason === 'no-clip')) { S.resumeAfterFilm = true; log('film-play', { resume: true }); if (S.state === 'ended') { setState('paused', 'video'); render(); } else pause('video'); }
    else log('film-play', { resume: false }); }, true);
  function filmDone(ev) { var v = filmOf(ev.target); if (!v) return; var out = parseFloat(v.getAttribute('data-out') || '0');
    var userPause = ev.type === 'pause' && !(v.ended || (out && v.currentTime >= out - 0.3));
    S.filmPlaying = false; if (!S.resumeAfterFilm) return; S.resumeAfterFilm = false; log(userPause ? 'film-pause-user' : 'film-done', { how: ev.type, resume: true }); /* v1.5.9: resume on pause AND on ended */
    var e = entry(S.slideId); if (!e) return; var g = S.gen;
    if (e.file) { start(); return; }
    if (prefs.auto && !introActive()) { var nx = nextId(S.slideId); if (nx) { later(function () { S.navCause = 'auto'; log('auto-advance', { to: nx, reason: 'film-ended' }); try { location.hash = hashFor(entry(nx).n); } catch (x) {} }, 600, g); setState('ended', 'no-clip'); render(); return; } }
    setState('ended', 'no-clip'); render(); }
  document.addEventListener('ended', filmDone, true); document.addEventListener('pause', filmDone, true);
  audio.addEventListener('ended', function () {
    if (!current()) return; var g = S.gen; clearPending(); setState('ended');
    if (prefs.auto && !introActive()) { var nx = nextId(S.slideId); if (nx) { var e = entry(nx); later(function () { S.navCause = 'auto'; log('auto-advance', { to: nx }); try { location.hash = hashFor(e.n); } catch (x) {} }, 0, g); } }
  });
  audio.addEventListener('timeupdate', function () { if (current()) { cueTick(); progress(); } });
  audio.addEventListener('error', function () { if (!current() || !audio.getAttribute('src')) return; log('media-error', { code: audio.error ? audio.error.code : null }); if (engaged()) setState('blocked', 'error'); });
  function loop(g) { if (S.raf) window.cancelAnimationFrame(S.raf); var f = function () { S.raf = 0; if (g !== S.gen || S.state !== 'playing') return; cueTick(); progress(); S.raf = window.requestAnimationFrame(f); }; S.raf = window.requestAnimationFrame(f); }

  /* ---------- cues: CC, transcript highlight, slide-38 tab follow ---------- */
  function cueTick() { var e = S.clip; if (!e || !e.cues || !e.cues.length) return; var t = audio.currentTime || 0, q = e.cues[0]; for (var i = 0; i < e.cues.length; i++) if (t >= e.cues[i].start - 0.05) q = e.cues[i]; if (q !== S.cue) { S.cue = q; log('cue', { cue: q.i }); renderCaption(); highlight(q); tabFollow(q); } }
  function clearHighlight() { if (S.lastHl) { S.lastHl.classList.remove('gbar-cue-active'); S.lastHl = null; } }
  function highlight(q) { clearHighlight(); if (reduced || !q || !q.anchor || S.state !== 'playing') return; var sec = visibleSection(); if (!sec) return; var t = sec.querySelector('[data-cue="' + q.anchor + '"]'); if (t && t !== sec.querySelector('h1, h2')) { t.classList.add('gbar-cue-active'); S.lastHl = t; } }
  function tabFollow(q) { if (S.slideId !== NATIONS || S.state !== 'playing' || !q || !CUE_TAB[q.anchor] || Date.now() - S.userTabAt < 6000) return; var b = document.querySelector('#s-aos-nations .aos-country[data-country="' + CUE_TAB[q.anchor] + '"]'); if (b && !b.classList.contains('is-on')) { selfClick = true; try { b.click(); } catch (e) {} selfClick = false; log('tab-follow', { tab: CUE_TAB[q.anchor] }); } }
  function onTabClick(ev) {
    if (selfClick || !ev.isTrusted) return; var b = ev.target && ev.target.closest ? ev.target.closest('#s-aos-nations .aos-country') : null; if (!b) return;
    S.userTabAt = Date.now(); var e = entry(S.slideId); if (S.slideId !== NATIONS || !e) return;
    var a = TAB_CUE[b.getAttribute('data-country')], q = null; (e.cues || []).forEach(function (c) { if (c.anchor === a) q = c; }); if (!q) return;
    if (current()) { try { audio.currentTime = q.start + 0.01; } catch (e) {} } S.cue = q; renderCaption(); log('tab', { tab: b.getAttribute('data-country'), cue: q.i });
    if (S.state === 'ended') { setState('loading'); playNow(S.gen); }
  }

  /* ---------- UI ---------- */
  function build() {
    if (ui.root) return; var L = T[lang()];
    var root = el('aside', 'gbar'); root.id = 'athar-narration'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', L.region); root.setAttribute('data-testid', 'narration-player'); root.setAttribute('data-version', VERSION);
    var seek = el('div', 'gbar-seek'); seek.setAttribute('role', 'progressbar'); seek.setAttribute('aria-label', L.seek); seek.setAttribute('aria-valuemin', '0'); seek.setAttribute('aria-valuemax', '100'); seek.setAttribute('aria-valuenow', '0'); seek.setAttribute('data-testid', 'nar-seek');
    var fillEl = el('div', 'gbar-fill'); seek.appendChild(fillEl); root.appendChild(seek);
    var row = el('div', 'gbar-row');
    function btn(cls, tid, html) { var b = el('button', 'gbar-btn ' + cls); b.type = 'button'; b.setAttribute('data-testid', tid); if (html) b.innerHTML = html; row.appendChild(b); return b; }
    var prev = btn('gbar-icon gbar-nav gbar-prev', 'nar-prev', icon('prev'));
    var guide = btn('gbar-guide', 'guide-toggle'); guide.setAttribute('aria-pressed', 'false');
    var tap = btn('gbar-tap', 'guide-tap-to-play'); tap.hidden = true; tap.setAttribute('aria-describedby', 'athar-narration-status');
    var play = btn('gbar-icon gbar-play', 'nar-play', icon('play'));
    var mute = btn('gbar-icon gbar-mute', 'nar-mute', icon('sound'));
    var auto = btn('gbar-toggle gbar-auto', 'nar-autoplay', '<span class="gbar-dot" aria-hidden="true"></span>AUTO');
    var cc = btn('gbar-toggle gbar-cc', 'nar-captions', '<span class="gbar-dot" aria-hidden="true"></span>CC');
    var status = el('div', 'gbar-status'); var ttl = el('span', 'gbar-title'); ttl.id = 'athar-narration-status'; ttl.setAttribute('role', 'status'); ttl.setAttribute('aria-live', 'polite'); ttl.setAttribute('aria-atomic', 'true'); ttl.setAttribute('data-testid', 'nar-status');
    var cap = el('span', 'gbar-caption'); cap.setAttribute('aria-live', 'polite'); cap.setAttribute('data-testid', 'nar-caption'); status.appendChild(ttl); status.appendChild(cap); row.appendChild(status);
    var time = el('span', 'gbar-time', '0:00 / 0:00'); time.setAttribute('aria-label', 'elapsed / total'); row.appendChild(time);
    var tx = btn('gbar-icon gbar-tx', 'nar-transcript', icon('up')); tx.setAttribute('aria-controls', 'athar-narration-transcript');
    var next = btn('gbar-icon gbar-nav gbar-next', 'nar-next', icon('next'));
    root.appendChild(row);
    var drawer = el('div', 'gbar-drawer'); drawer.id = 'athar-narration-transcript'; drawer.setAttribute('role', 'group'); drawer.hidden = !prefs.transcript;
    var tEn = el('p', 'gbar-text gbar-text--en'); tEn.setAttribute('lang', 'en'); tEn.dir = 'ltr'; tEn.setAttribute('data-testid', 'nar-transcript-text'); var meta = el('p', 'gbar-meta');
    drawer.appendChild(tEn); drawer.appendChild(meta); root.appendChild(drawer);
    document.body.appendChild(root); document.documentElement.classList.add('has-guide-bar'); fit(); window.addEventListener('resize', fit);
    ui = { root: root, seek: seek, fill: fillEl, guide: guide, tap: tap, play: play, mute: mute, auto: auto, cc: cc, ttl: ttl, cap: cap, time: time, tx: tx, drawer: drawer, tEn: tEn, meta: meta, prev: prev, next: next };
    prev.addEventListener('click', function () { S.unlocked = true; goRel(-1); });
    next.addEventListener('click', function () { S.unlocked = true; goRel(1); });
    guide.addEventListener('click', function () { S.unlocked = true; if (S.state === 'idle' || S.state === 'blocked') start(); else stop(); });
    tap.addEventListener('click', function () { S.unlocked = true; start(); });
    play.addEventListener('click', function () { S.unlocked = true; toggle(); });
    mute.addEventListener('click', function () { prefs.muted = !prefs.muted; audio.muted = prefs.muted; savePrefs(); render(); });
    auto.addEventListener('click', function () { prefs.auto = !prefs.auto; savePrefs(); log('auto', { on: prefs.auto }); render(); });
    cc.addEventListener('click', function () { prefs.captions = !prefs.captions; savePrefs(); render(); });
    tx.addEventListener('click', function () { prefs.transcript = !prefs.transcript; savePrefs(); render(); });
  }
  function fit() { var cs = getComputedStyle(document.documentElement); var fh = parseFloat(cs.getPropertyValue('--footer-h')) || 56, gh = parseFloat(cs.getPropertyValue('--guide-h')) || 52, vh = window.innerHeight || 900; var f = Math.max(0.6, Math.min(1, (vh - fh - gh) / (vh - fh))); document.documentElement.style.setProperty('--guide-fit', f.toFixed(4)); }
  function progress() { if (!ui.root) return; var e = entry(S.slideId); var d = current() && isFinite(audio.duration) && audio.duration > 0 ? audio.duration : (e ? e.durationSec : 0), c = current() ? (audio.currentTime || 0) : 0, p = d ? Math.min(100, (c / d) * 100) : 0; ui.fill.style.inlineSize = p + '%'; ui.seek.setAttribute('aria-valuenow', String(Math.round(p))); ui.seek.setAttribute('aria-valuetext', fmt(c) + ' / ' + fmt(d)); var tt = fmt(c) + ' / ' + fmt(d); if (ui.time.textContent !== tt) ui.time.textContent = tt; }
  function renderCaption() { if (!ui.root) return; var txt = prefs.captions && S.cue ? S.cue.text : ''; ui.cap.hidden = !prefs.captions; if (ui.cap.textContent !== txt) ui.cap.textContent = txt; renderTranscript(); }
  function renderTranscript() {
    var e = entry(S.slideId), L = T[lang()]; if (!e) { ui.tEn.textContent = ''; ui.meta.textContent = ''; return; }
    if (ui.tEn.getAttribute('data-slide-id') !== e.slideId + '|' + lang()) {
      ui.tEn.setAttribute('data-slide-id', e.slideId + '|' + lang()); ui.tEn.textContent = '';
      (e.cues && e.cues.length ? e.cues : [{ i: 1, text: e.text }]).forEach(function (q) { var sp = el('span', 'gbar-sent', q.text + ' '); sp.setAttribute('data-cue-i', String(q.i)); ui.tEn.appendChild(sp); });
      ui.meta.textContent = e.clipId + ' · ' + L.voice + (lang() === 'ar' ? ' · ' + L.arNote : '') + ' · ' + L.key;
    }
    var sps = ui.tEn.querySelectorAll('.gbar-sent'), idx = S.cue ? S.cue.i : -1;
    for (var i = 0; i < sps.length; i++) { var on = parseInt(sps[i].getAttribute('data-cue-i'), 10) === idx; if (sps[i].classList.contains('is-active') !== on) { sps[i].classList.toggle('is-active', on); if (on) sps[i].setAttribute('aria-current', 'true'); else sps[i].removeAttribute('aria-current'); } }
  }
  function render() {
    if (!ui.root) return; var L = T[lang()], e = entry(S.slideId), n = S.n || 0, st = S.state, playing = st === 'playing';
    var r = ui.root; r.setAttribute('lang', lang()); r.dir = lang() === 'ar' ? 'rtl' : 'ltr'; r.setAttribute('aria-label', L.region);
    r.setAttribute('data-state', st); r.setAttribute('data-reason', S.reason || ''); r.setAttribute('data-gen', String(S.gen)); r.setAttribute('data-slide-id', S.slideId || ''); r.setAttribute('data-clip', e ? e.clipId : '');
    r.setAttribute('data-audible-slide-id', playing && current() ? S.clip.slideId : ''); r.setAttribute('data-auto', prefs.auto ? 'true' : 'false'); r.setAttribute('data-narrating', playing ? 'true' : 'false');
    r.classList.toggle('is-playing', playing); r.classList.toggle('is-reduced', reduced); r.classList.toggle('is-blocked', st === 'blocked'); r.classList.toggle('is-unavailable', st === 'blocked' && S.reason === 'error');
    ui.guide.textContent = st === 'idle' ? L.guide : L.guideOn; ui.guide.setAttribute('aria-pressed', st === 'idle' ? 'false' : 'true'); ui.guide.disabled = !e; ui.guide.title = L.key;
    var blocked = st === 'blocked', retry = blocked && S.reason === 'error'; ui.tap.hidden = !blocked; ui.tap.innerHTML = icon('play') + '<span>' + (retry ? L.tapRetry : L.tap) + '</span>'; ui.tap.setAttribute('aria-label', fill(retry ? L.tapRetryAria : L.tapAria, n));
    var pp = playing || st === 'loading'; ui.play.innerHTML = icon(pp ? 'pause' : 'play'); ui.play.setAttribute('aria-label', pp ? L.pause : L.play); ui.play.setAttribute('aria-pressed', pp ? 'true' : 'false'); ui.play.disabled = !e || !e.file;
    ui.mute.innerHTML = icon(prefs.muted ? 'muted' : 'sound'); ui.mute.setAttribute('aria-label', prefs.muted ? L.unmute : L.mute); ui.mute.setAttribute('aria-pressed', prefs.muted ? 'true' : 'false');
    ui.auto.setAttribute('aria-pressed', prefs.auto ? 'true' : 'false'); ui.auto.title = L.auto; ui.auto.setAttribute('aria-label', L.auto);
    ui.cc.setAttribute('aria-pressed', prefs.captions ? 'true' : 'false'); ui.cc.title = L.cc; ui.cc.setAttribute('aria-label', L.cc);
    ui.tx.setAttribute('aria-expanded', prefs.transcript ? 'true' : 'false'); ui.tx.setAttribute('aria-label', prefs.transcript ? L.txOpen : L.txShow); ui.tx.innerHTML = icon(prefs.transcript ? 'down' : 'up'); ui.drawer.hidden = !prefs.transcript; ui.drawer.setAttribute('aria-label', L.tx);
    ui.prev.setAttribute('aria-label', L.prev); ui.prev.title = L.prev; ui.next.setAttribute('aria-label', L.next); ui.next.title = L.next; ui.prev.disabled = n <= 1; ui.next.disabled = !n || n >= TOTAL;
    var key = retry ? 'errorN' : S.reason === 'no-clip' ? 'noclipN' : (S.reason === 'video' && st === 'paused') ? 'videoN' : st + 'N', sec = e ? (lang() === 'ar' ? (e.sectionAr || e.section || '') : (e.section || '')) : '';
    var title = n ? fill(L[key], n) + (sec ? ' · ' + sec : '') : ''; if (ui.ttl.textContent !== title) ui.ttl.textContent = title;
    progress(); renderCaption(); publish();
  }
  function publish() { window.__guideState = { version: VERSION, state: S.state, reason: S.reason, gen: S.gen, slideId: S.slideId, slideIndex: S.n, clipId: entry(S.slideId) ? entry(S.slideId).clipId : null, audibleClipSlideId: S.state === 'playing' && current() ? S.clip.slideId : null, cue: S.cue ? S.cue.i : null, auto: prefs.auto, unlocked: S.unlocked, time: Math.round((audio.currentTime || 0) * 100) / 100 }; }

  /* ---------- cover hooks: "Listen to the guide" + bilingual intro-film transcript (copy unchanged from v1.5.3) ---------- */
  function hooks() {
    var L = T[lang()], intro = manifest && (manifest.segments || []).filter(function (s) { return s.segmentId === 'intro'; })[0];
    var cov = document.getElementById('s-cover'); if (!cov) return;
    var cta = cov.querySelector('.cover-copy a.cta'); var ex = cov.querySelector('.nar-listen');
    if (cta && (!ex || ex.getAttribute('data-lang') !== lang())) { if (ex) ex.remove(); var b = el('button', 'nar-listen', L.listen); b.type = 'button'; b.setAttribute('data-testid', 'listen-to-guide'); b.setAttribute('data-lang', lang()); b.addEventListener('click', function () { S.unlocked = true; start(); }); cta.parentNode.insertBefore(b, cta.nextSibling); }
    if (intro && (intro.text || intro.textAr)) {
      var host = cov.querySelector('.cover-copy'); var ex2 = cov.querySelector('.nar-intro');
      if (host && (!ex2 || ex2.getAttribute('data-lang') !== lang())) {
        if (ex2) ex2.remove(); var box = el('section', 'nar-intro'); box.setAttribute('data-testid', 'intro-transcript'); box.setAttribute('data-lang', lang()); box.setAttribute('aria-label', L.introTx);
        var head = el('div', 'nar-intro-head'); head.appendChild(el('span', 'nar-intro-lbl', L.introTx)); box.appendChild(head);
        var cols = el('div', 'nar-intro-cols'); var pe = el('p', 'nar-intro-en', intro.text || ''); pe.setAttribute('lang', 'en'); pe.dir = 'ltr'; var pa = el('p', 'nar-intro-ar', intro.textAr || ''); pa.setAttribute('lang', 'ar'); pa.dir = 'rtl'; cols.appendChild(lang() === 'ar' ? pa : pe); cols.appendChild(lang() === 'ar' ? pe : pa); box.appendChild(cols);
        var anchor = cov.querySelector('.cover-copy .nar-listen') || cov.querySelector('.cover-copy a.cta'); if (anchor && anchor.parentNode === host) host.insertBefore(box, anchor.nextSibling); else host.appendChild(box);
      }
    }
  }

  /* ---------- observation: the slide on screen is read from the DOM after every mutation / hash change ---------- */
  function observe(why) {
    if (!booted) return; tagSlides(); hooks(); aliasHash();
    var id = visibleSlideId(); if (!id) return;                                            /* transient re-render (e.g. language switch): keep the current slide */
    if (id !== S.slideId) { var c = S.navCause || why || 'user'; S.navCause = ''; onSlideChange(id, c); }
  }
  function aliasHash() { var m = /^#slide-0*(\d+)$/i.exec(location.hash || ''); if (!m) return; var n = parseInt(m[1], 10); if (!(n >= 1 && n <= TOTAL)) return; var h = hashFor(n); try { history.replaceState(null, '', h); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { location.hash = h; } }
  function onGesture(ev) {
    if (!ev.isTrusted) return; if (ev.type === 'keydown' && (ev.key === 'Escape' || ev.key === 'Esc' || ev.key === 'Shift' || ev.key === 'Control' || ev.key === 'Alt' || ev.key === 'Meta' || ev.key === 'Tab')) return;
    S.unlocked = true;
    if (S.state === 'blocked' && S.reason === 'autoplay' && !introActive() && !(ui.root && ui.root.contains(ev.target))) { var g = S.gen; later(function () { if (S.state === 'blocked') start(); }, 0, g); }
  }

  /* ---------- boot ---------- */
  function boot(table, man) {
    manifest = man; (table.slides || []).forEach(function (s) { BY_ID[s.slideId] = s; ORDER[s.n - 1] = s.slideId; });
    booted = true; build(); tagSlides(); hooks(); aliasHash();
    S.slideId = visibleSlideId(); var e = entry(S.slideId); S.n = e ? e.n : 0; S.cue = e && e.cues && e.cues.length ? e.cues[0] : null;
    if (prefs.on && e) { S.state = 'blocked'; S.reason = 'autoplay'; prepare(e, S.gen, false); log('restored-on'); } /* a persisted "guide on" never autoplays: tap to play */
    render();
    var root = document.getElementById('root');
    if (root) new MutationObserver(function () { observe('dom'); }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    new MutationObserver(function () { observe('virtual'); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(function () { hooks(); render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    window.addEventListener('hashchange', function () { window.setTimeout(function () { observe('hash'); }, 0); });
    window.addEventListener('load', function () { observe('load'); });
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) { observe('pageshow'); if (S.state === 'playing' && audio.paused) setState('paused', 'external'); } });
    document.addEventListener('athar:intro-open', function () { log('intro-open', { pressToPlay: true }); }); /* v1.5.9: opening the (press-to-play) intro no longer pauses the guide by itself — the intro film's own `play` does, through the film wiring above; `pause` / `ended` resume it */
    document.addEventListener('athar:intro-finished', function () { window.setTimeout(function () { observe('intro'); if (S.resumeAfterIntro && S.state === 'paused' && S.reason === 'intro') { S.resumeAfterIntro = false; start(); } }, 60); });
    window.AtharGuide = {
      version: VERSION, states: Object.keys(STATES),
      get state() { return S.state; }, get reason() { return S.reason; }, get gen() { return S.gen; }, get slideId() { return S.slideId; }, get slideIndex() { return S.n; },
      get clipId() { var x = entry(S.slideId); return x ? x.clipId : null; }, get auto() { return prefs.auto; },
      audibleSlideId: function () { return S.state === 'playing' && current() && !audio.paused ? S.clip.slideId : null; },
      audibleClipId: function () { return S.state === 'playing' && current() && !audio.paused ? S.clip.clipId : null; },
      clipFor: function (id) { var x = entry(id); return x ? x.clipId : null; }, table: function () { return ORDER.map(function (id) { return BY_ID[id]; }); },
      start: start, stop: stop, pause: function () { pause('user'); }, resume: resume, toggle: toggle, next: function () { goRel(1); }, prev: function () { goRel(-1); },
      setAuto: function (v) { prefs.auto = !!v; savePrefs(); render(); }, setCaptions: function (v) { prefs.captions = !!v; savePrefs(); render(); }, setTranscript: function (v) { prefs.transcript = !!v; savePrefs(); render(); },
      audio: function () { return audio; }, journal: function () { return journal.slice(); }, cue: function () { return S.cue; }
    };
    window.AtharNarration = { version: VERSION, play: start, pause: function () { pause('user'); }, toggle: toggle, prefs: prefs, state: function () { publish(); return window.__guideState; }, audioElement: function () { return audio; } };
  }
  document.addEventListener('keydown', function (ev) { if (ev.defaultPrevented || ev.altKey || ev.ctrlKey || ev.metaKey) return; var t = ev.target; if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return; if (ev.key === 'n' || ev.key === 'N') { ev.preventDefault(); S.unlocked = true; if (S.state === 'idle' || S.state === 'blocked') start(); else toggle(); } });
  ['pointerdown', 'keydown', 'touchend'].forEach(function (t) { window.addEventListener(t, onGesture, { capture: true, passive: true }); });
  document.addEventListener('click', onTabClick, true);
  Promise.all([fetch(TABLE, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('slide-narration ' + r.status); return r.json(); }), fetch(MANIFEST, { cache: 'no-cache' }).then(function (r) { return r.json(); }).catch(function () { return null; })])
    .then(function (res) { boot(res[0], res[1]); })
    .catch(function (e) { try { console.warn('[guide] narration table missing — guide bar disabled', e && e.message); } catch (x) {} });
})();
