/* Athar Open Agentic Pact deck — v1.4.2 (2026-09-28) intro film gate · v1.5.9 (2026-10-03): PRESS-TO-PLAY.
   v1.5.9: the intro no longer autoplays and never auto-starts muted — the gate opens on the animated intro sign (the poster frame with a gentle float +
   sheen, none under prefers-reduced-motion) carrying the EN/AR label "Intro film — Athar · 1:00" / «فيلم المقدمة — أثر»; the film starts only from the
   gold Play button (click / Enter / Space), with sound; a click on the film pauses / resumes it. The <video> carries data-narration-pause, so the narrated
   guide pauses on `play` and resumes on `pause` / `ended` (dist/js/narration.js — the same wiring as the Section 09 executive-film player).
   Original v1.4.2 behaviour, otherwise unchanged:
   Renders BEFORE slide 1 on first load (EN and AR): full-bleed <video> (MP4 + WebM, poster, playsinline,
   preload=metadata, starts muted with an Unmute toggle, captions track when narration exists), a "Skip intro" /
   «تخطي المقدمة» button visible from t=0 (inline-end = top-right in LTR, top-left in RTL, ≥44×44 px,
   aria-label, visible focus ring), activated by click/tap, Enter/Space and Esc; the video's `ended` event
   auto-advances to slide 1. The skip/complete state is kept in sessionStorage so back-navigation and reloads
   do not replay; hash deep links to any slide other than 1 bypass the gate; `?intro=1` forces it; a
   "Replay intro" / «إعادة تشغيل المقدمة» control is added to the deck footer. Brand-motion rules: under
   prefers-reduced-motion there is no autoplay (poster + Play + Skip, 0 ms), otherwise a single 200 ms
   opacity fade-out. The 39 slides, the router and the slide-35 tour are untouched — this module only adds an
   overlay and one footer button. */
(function () {
  'use strict';
  var VERSION = 'v1.7.2'; /* sessionStorage key deliberately unchanged */
  var KEY = 'athar-intro-v1.4.2';
  var BASE = '/assets/intro/v1.4.2/';
  var MEDIA = {
    mp4: BASE + 'intro.mp4',
    mp4Type: 'video/mp4; codecs="avc1.640029, mp4a.40.2"',
    webm: null, /* v1.4.7: VP9 transcode not shipped on this restore — MP4 (H.264/AAC) only */
    webmType: null,
    poster: BASE + 'intro-poster.png',
    /* captions: only tracks whose narration transcript exists are listed (see CHANGELOG v1.4.2) */
    tracks: window.ATHAR_INTRO_TRACKS || []
  };
  var T = {
    en: { skip: 'Skip intro', skipAria: 'Skip intro — go straight to slide 1', unmute: 'Unmute', mute: 'Mute',
          unmuteAria: 'Unmute the intro film', muteAria: 'Mute the intro film', play: 'Play intro',
          playAria: 'Play the intro film', replay: 'Replay intro',
          replayAria: 'Replay the intro film', dialog: 'Intro film — Athar', film: 'Athar film',
          desc: 'Intro film — Athar. Press Play to watch it, or Escape / the Skip intro button to go to the deck.', label: 'Intro film — Athar', labelKicker: 'Intro', labelDur: '1:00', pauseFilm: 'Pause intro', pauseFilmAria: 'Pause the intro film', resume: 'Resume intro' },
    ar: { skip: 'تخطي المقدمة', skipAria: 'تخطي المقدمة — الانتقال مباشرة إلى الشريحة 1', unmute: 'تشغيل الصوت', mute: 'كتم الصوت',
          unmuteAria: 'تشغيل صوت فيلم المقدمة', muteAria: 'كتم صوت فيلم المقدمة', play: 'تشغيل المقدمة',
          playAria: 'تشغيل فيلم المقدمة', replay: 'إعادة تشغيل المقدمة',
          replayAria: 'إعادة تشغيل فيلم المقدمة', dialog: 'فيلم المقدمة — أثر', film: 'فيلم أثر',
          desc: 'فيلم المقدمة — أثر. اضغط «تشغيل» لمشاهدته، أو Escape / زر تخطي المقدمة للانتقال إلى العرض.', label: 'فيلم المقدمة — أثر', labelKicker: 'المقدمة', labelDur: '1:00', pauseFilm: 'إيقاف المقدمة مؤقتاً', pauseFilmAria: 'إيقاف فيلم المقدمة مؤقتاً', resume: 'متابعة المقدمة' }
  };
  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function dir() { return document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'; }
  function prefersReduced() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }
  function isStartHash(h) { return !h || h === '#' || h === '#/' || /^#\/0*1$/.test(h); }
  function getDone() { try { return sessionStorage.getItem(KEY) === 'done'; } catch (e) { return false; } }
  function setDone() { try { sessionStorage.setItem(KEY, 'done'); } catch (e) {} }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  var state = { open: false, node: null, video: null, reduced: false, reason: null, firstLoad: false, prevFocus: null, leaving: false };

  function focusables() {
    if (!state.node) return [];
    return Array.prototype.filter.call(state.node.querySelectorAll('button:not([hidden]):not([disabled])'), function (b) {
      return b.offsetParent !== null || getComputedStyle(b).position === 'fixed';
    });
  }
  function onKey(e) {
    if (!state.open) return;
    if (state.leaving) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    var k = e.key;
    if (k === 'Escape' || k === 'Esc') { e.preventDefault(); e.stopImmediatePropagation(); finish('esc'); return; }
    if (k === 'Tab') {
      var f = focusables(); if (!f.length) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey) { if (i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } }
      else if (i === -1 || i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      e.stopImmediatePropagation(); return;
    }
    /* Enter / Space on our own buttons keep their default activation (click); nothing reaches the deck router */
    if (!(state.node && state.node.contains(e.target) && e.target.tagName === 'BUTTON' && (k === 'Enter' || k === ' ' || k === 'Spacebar'))) {
      e.preventDefault();
    }
    e.stopImmediatePropagation();
  }
  function onKeyOther(e) { if (state.open) e.stopImmediatePropagation(); }
  function onWheel(e) { if (state.open) { e.stopPropagation(); } }

  function relabel() {
    if (!state.node) return;
    var L = lang(), t = T[L], n = state.node;
    n.setAttribute('lang', L); n.setAttribute('dir', dir()); n.setAttribute('aria-label', t.dialog);
    var d = n.querySelector('.intro-desc'); if (d) d.textContent = t.desc;
    var s = n.querySelector('.intro-skip'); if (s) { s.textContent = t.skip; s.setAttribute('aria-label', t.skipAria); s.setAttribute('title', t.skip); }
    var m = n.querySelector('.intro-mute'); if (m) { var muted = !state.video || state.video.muted; m.textContent = muted ? t.unmute : t.mute; m.setAttribute('aria-label', muted ? t.unmuteAria : t.muteAria); m.setAttribute('aria-pressed', muted ? 'false' : 'true'); }
    var p = n.querySelector('.intro-play'); if (p) { var started = state.video && state.video.currentTime > 0 && !state.video.ended; p.textContent = started ? t.resume : t.play; p.setAttribute('aria-label', t.playAria); }
    var lb = n.querySelector('.intro-label'); if (lb) { lb.querySelector('.intro-label-kicker').textContent = t.labelKicker; lb.querySelector('.intro-label-title').textContent = t.label; lb.querySelector('.intro-label-dur').textContent = t.labelDur; lb.setAttribute('aria-label', t.label + ' · ' + t.labelDur); }
    if (state.video) state.video.setAttribute('aria-label', t.film);
    var tracks = state.video ? state.video.querySelectorAll('track') : [];
    Array.prototype.forEach.call(tracks, function (tr) { try { tr.track.mode = (tr.srclang === L) ? 'showing' : 'disabled'; } catch (e) {} });
  }

  function build(opts) {
    var L = lang(), t = T[L];
    var n = el('div', 'intro-gate'); n.setAttribute('role', 'dialog'); n.setAttribute('aria-modal', 'true'); n.setAttribute('data-testid', 'intro-gate'); n.setAttribute('data-version', VERSION);
    n.setAttribute('data-reduced-motion', state.reduced ? 'true' : 'false'); n.setAttribute('data-reason', state.reason || 'first-load');
    var desc = el('p', 'intro-desc sr-only', t.desc); desc.id = 'intro-gate-desc'; n.setAttribute('aria-describedby', desc.id); n.appendChild(desc);
    var v = document.createElement('video');
    v.className = 'intro-video'; v.setAttribute('data-testid', 'intro-video'); v.setAttribute('playsinline', ''); v.playsInline = true;
    v.setAttribute('preload', 'metadata'); v.preload = 'metadata'; /* v1.5.9: no muted auto-start — the film plays with sound from the user's Play press */
    v.setAttribute('poster', MEDIA.poster); v.poster = MEDIA.poster; v.setAttribute('aria-label', t.film); v.setAttribute('disablepictureinpicture', '');
    v.setAttribute('data-narration-pause', 'true'); v.setAttribute('data-intro-film', 'true'); /* v1.5.9: the narrated guide pauses on play, resumes on pause / ended (narration.js) — no autoplay attribute, ever */
    v.autoplay = false; v.removeAttribute('autoplay');
    var s1 = document.createElement('source'); s1.src = MEDIA.mp4; s1.type = MEDIA.mp4Type; v.appendChild(s1);
    var s2 = document.createElement('source'); s2.src = MEDIA.webm; s2.type = MEDIA.webmType; v.appendChild(s2);
    MEDIA.tracks.forEach(function (tr) {
      var k = document.createElement('track'); k.kind = 'captions'; k.srclang = tr.lang; k.label = tr.label; k.src = tr.src; if (tr.lang === L) k.default = true; v.appendChild(k);
    });
    n.appendChild(v);
    /* v1.5.9: the animated intro sign — the poster frame as a layer over the paused film (gentle float + sheen via CSS; none under prefers-reduced-motion); removed the moment the film plays */
    var sign = el('div', 'intro-sign'); sign.setAttribute('aria-hidden', 'true'); sign.setAttribute('data-testid', 'intro-sign'); sign.setAttribute('data-motion', state.reduced ? 'reduced' : 'animated');
    var si = el('img', 'intro-sign-img'); si.src = MEDIA.poster; si.alt = ''; si.width = 1920; si.height = 1080; si.decoding = 'async'; si.setAttribute('data-no-mirror', 'true'); sign.appendChild(si);
    var sheen = el('span', 'intro-sign-sheen'); sheen.setAttribute('aria-hidden', 'true'); sign.appendChild(sheen); n.appendChild(sign);
    var label = el('div', 'intro-label'); label.setAttribute('data-testid', 'intro-label'); label.setAttribute('role', 'note'); label.setAttribute('aria-label', t.label + ' · ' + t.labelDur);
    label.appendChild(el('span', 'intro-label-kicker', t.labelKicker)); label.appendChild(el('span', 'intro-label-title', t.label)); label.appendChild(el('span', 'intro-label-dur', t.labelDur)); n.appendChild(label);
    var top = el('div', 'intro-top');
    var skip = el('button', 'intro-skip', t.skip); skip.type = 'button'; skip.setAttribute('data-testid', 'intro-skip'); skip.setAttribute('aria-label', t.skipAria);
    skip.addEventListener('click', function (e) { e.preventDefault(); finish('skip'); });
    top.appendChild(skip); n.appendChild(top);
    var bottom = el('div', 'intro-bottom');
    var mute = el('button', 'intro-mute', t.unmute); mute.type = 'button'; mute.setAttribute('data-testid', 'intro-mute'); mute.setAttribute('aria-pressed', 'false'); mute.setAttribute('aria-label', t.unmuteAria);
    mute.addEventListener('click', function () { v.muted = !v.muted; if (!v.muted) v.volume = 1; relabel(); });
    bottom.appendChild(mute); n.appendChild(bottom);
    var play = el('button', 'intro-play', t.play); play.type = 'button'; play.setAttribute('data-testid', 'intro-play'); play.setAttribute('aria-label', t.playAria); play.hidden = false; /* v1.5.9: press-to-play — visible from the start */
    function requestPlay() { play.hidden = true; n.classList.remove('is-paused'); var pr; try { pr = v.play(); } catch (e) { play.hidden = false; n.classList.add('is-paused'); return; } if (pr && pr.catch) pr.catch(function () { play.hidden = false; n.classList.add('is-paused'); }); }
    play.addEventListener('click', function (e) { e.preventDefault(); requestPlay(); });
    n.appendChild(play);
    v.addEventListener('click', function () { if (state.leaving) return; if (v.paused) requestPlay(); else v.pause(); });
    v.addEventListener('play', function () { n.classList.add('is-playing'); n.classList.remove('is-paused'); n.setAttribute('data-played', 'true'); play.hidden = true; });
    v.addEventListener('pause', function () { if (state.leaving || v.ended) return; n.classList.remove('is-playing'); n.classList.add('is-paused'); play.hidden = false; relabel(); try { play.focus({ preventScroll: true }); } catch (e) {} });
    v.addEventListener('ended', function () { finish('ended'); });
    v.addEventListener('error', function () { n.classList.add('has-error'); }, true);
    v.addEventListener('volumechange', relabel);
    n.addEventListener('wheel', onWheel, { passive: true });
    state.node = n; state.video = v; return n;
  }

  function open(opts) {
    opts = opts || {};
    if (state.open) return false;
    state.reduced = (opts.reducedMotion != null) ? !!opts.reducedMotion : prefersReduced();
    state.reason = opts.reason || 'first-load'; state.firstLoad = opts.reason == null || opts.reason === 'first-load' || opts.reason === 'forced';
    state.leaving = false; state.prevFocus = document.activeElement;
    var n = build(opts);
    document.body.appendChild(n); document.documentElement.classList.add('intro-open');
    var root = document.getElementById('root'); if (root) { try { root.inert = true; } catch (e) {} root.setAttribute('aria-hidden', 'true'); }
    state.open = true;
    window.addEventListener('keydown', onKey, true); window.addEventListener('keyup', onKeyOther, true); window.addEventListener('keypress', onKeyOther, true);
    relabel();
    n.classList.add('is-paused'); n.querySelector('.intro-play').hidden = false; /* v1.5.9: press-to-play for everyone — no autoplay, reduced motion or not */
    window.setTimeout(function () { var p = n.querySelector('.intro-play'); if (p && state.open) p.focus(); }, 0);
    try { document.dispatchEvent(new CustomEvent('athar:intro-open', { detail: { reason: state.reason, reducedMotion: state.reduced } })); } catch (e) {}
    return true;
  }

  function finish(reason) {
    if (!state.open || state.leaving) return;
    state.leaving = true; setDone();
    var n = state.node, v = state.video;
    try { v.pause(); } catch (e) {}
    var ms = state.reduced ? 0 : 200;
    n.classList.add('is-leaving');
    var cleanup = function () {
      if (!state.node) return;
      window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKeyOther, true); window.removeEventListener('keypress', onKeyOther, true);
      try { v.removeAttribute('src'); Array.prototype.forEach.call(v.querySelectorAll('source'), function (s) { s.remove(); }); v.load(); } catch (e) {}
      if (n.parentNode) n.parentNode.removeChild(n);
      document.documentElement.classList.remove('intro-open');
      var root = document.getElementById('root'); if (root) { try { root.inert = false; } catch (e) {} root.removeAttribute('aria-hidden'); }
      state.open = false; state.node = null; state.video = null; state.leaving = false;
      if (state.firstLoad && !/^#\/0*1$/.test(location.hash)) { location.hash = '#/01'; }
      var f = state.prevFocus && document.contains(state.prevFocus) && state.prevFocus !== document.body ? state.prevFocus : null;
      if (f) { try { f.focus(); } catch (e) {} } else { var r = document.querySelector('main.stage section.slide.is-active h1, main.stage section.slide.is-active [tabindex], main.stage'); if (r && r.focus) { r.setAttribute('tabindex', r.getAttribute('tabindex') || '-1'); try { r.focus({ preventScroll: true }); } catch (e) {} } }
      try { document.dispatchEvent(new CustomEvent('athar:intro-finished', { detail: { reason: reason } })); } catch (e) {}
    };
    window.setTimeout(cleanup, ms + 20);
  }

  /* footer "Replay intro" control — same MutationObserver pattern as the partner strip in index.html */
  function injectReplay() {
    var fr = document.querySelector('footer.pagefooter .footer-right'); if (!fr) return;
    var L = lang(), t = T[L]; var b = fr.querySelector('.intro-replay');
    if (!b) {
      b = el('button', 'intro-replay'); b.type = 'button'; b.setAttribute('data-testid', 'intro-replay');
      b.addEventListener('click', function () { open({ reason: 'replay' }); });
      var ver = fr.querySelector('.deck-version'); if (ver && ver.nextSibling) fr.insertBefore(b, ver.nextSibling); else fr.appendChild(b);
    }
    if (b.getAttribute('data-lang') !== L) { b.setAttribute('data-lang', L); b.textContent = t.replay; b.setAttribute('aria-label', t.replayAria); b.setAttribute('title', t.replay); }
  }
  var pending = false;
  function schedule() { if (pending) return; pending = true; window.requestAnimationFrame(function () { pending = false; try { injectReplay(); relabel(); } catch (e) {} }); }
  function watch() {
    var root = document.getElementById('root');
    if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    schedule();
  }

  window.AtharIntro = { VERSION: VERSION, KEY: KEY, MEDIA: MEDIA, open: open, skip: function () { finish('skip'); }, isOpen: function () { return state.open; },
    state: function () { return { open: state.open, reduced: state.reduced, reason: state.reason, done: getDone(), currentTime: state.video ? state.video.currentTime : null, paused: state.video ? state.video.paused : null, muted: state.video ? state.video.muted : null, autoplay: state.video ? state.video.hasAttribute('autoplay') : null, pressToPlay: true }; },
    reset: function () { try { sessionStorage.removeItem(KEY); } catch (e) {} },
    /* the exact first-load decision the module makes on (re)load: forced by ?intro=1, else once per session on the start slide */
    wouldShow: function (hash) { var f = false; try { f = new URLSearchParams(location.search).get('intro') === '1'; } catch (e) {} return f || (!getDone() && isStartHash(hash == null ? location.hash : hash)); } };

  var initialHash = location.hash;
  var params; try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
  var forced = !!(params && params.get('intro') === '1');
  var reducedParam = params && params.get('motion') === 'reduce' ? true : null; /* test hook mirrors the OS setting; production users are detected via prefers-reduced-motion */
  function start() {
    watch();
    if (forced || (!getDone() && isStartHash(initialHash))) { open({ reason: forced ? 'forced' : 'first-load', reducedMotion: reducedParam }); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
