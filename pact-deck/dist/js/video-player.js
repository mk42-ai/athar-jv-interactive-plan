/* Athar Open Agentic Pact deck — v1.4.7 (2026-09-29) shared product-video player + lightbox.
   Re-implementation of the v1.4.4/v1.4.6 behaviour (the v1.4.6 module source was not recoverable on the build host — see CHANGELOG v1.4.7):
   ONE vanilla player reused on slides 34–35: uncropped <video> (object-fit: contain), native controls, MP4-first source, poster + playsinline,
   app-level Play/Pause with play()-promise handling and muted retry + Unmute, bilingual Expand → lightbox on the SAME <video> node
   (Popover API top layer when available, CSS fixed fallback), aria-modal + focus trap + Esc/Close + focus return, keys and clicks isolated
   from the deck's slide router, reduced-motion honoured (no autoplay), data-avp-* attributes for QA. window.AtharVideoPlayer = { create, players, isOpen, log }. */
(function () {
  'use strict';
  var VERSION = 'v1.5.6';
  var UI = {
    en: { play: 'Play video', pause: 'Pause video', expand: 'Expand', close: 'Close', exitFs: 'Exit fullscreen', unmute: 'Unmute', mute: 'Mute', playing: 'Playing', paused: 'Paused', loading: 'Loading…', error: 'The film could not be played in this browser.', download: 'Download the MP4', dialog: 'Video lightbox' },
    ar: { play: 'تشغيل الفيديو', pause: 'إيقاف الفيديو مؤقتًا', expand: 'توسيع', close: 'إغلاق', exitFs: 'الخروج من ملء الشاشة', unmute: 'تشغيل الصوت', mute: 'كتم الصوت', playing: 'قيد التشغيل', paused: 'متوقف مؤقتًا', loading: 'جارٍ التحميل…', error: 'تعذّر تشغيل الفيلم في هذا المتصفح.', download: 'تنزيل ملف MP4', dialog: 'نافذة الفيديو' }
  };
  var api = { version: VERSION, players: [], log: {}, isOpen: function () { return !!open; }, create: create, close: function () { if (open) collapse(open); } };
  var open = null;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function reduced() { try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function plog(p, kind, extra) { var l = api.log[p.key] || (api.log[p.key] = []); l.push({ t: Date.now(), e: kind, ct: Math.round((p.video.currentTime || 0) * 100) / 100, rs: p.video.readyState, ns: p.video.networkState, paused: p.video.paused, muted: p.video.muted, x: extra || null }); if (l.length > 40) l.shift(); }
  function isolate(node) {
    /* events that ORIGINATE inside the player stop at its boundary so the deck's window-level router never sees them; Tab is left alone */
    ['keydown', 'keyup', 'keypress'].forEach(function (t) { node.addEventListener(t, function (e) { if (!node.contains(e.target)) return; if (e.key !== 'Tab') e.stopPropagation(); }); });
    ['click', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'dblclick'].forEach(function (t) { node.addEventListener(t, function (e) { if (node.contains(e.target)) e.stopPropagation(); }, { passive: true }); });
  }
  function focusables(p) { return Array.prototype.slice.call(p.fig.querySelectorAll('button:not([hidden]), a[href], video')).filter(function (b) { return b.offsetParent !== null || b === p.video; }); }
  function setOpenFlag(on) { if (on) document.documentElement.setAttribute('data-avp-open', ''); else document.documentElement.removeAttribute('data-avp-open'); }
  function refresh(p) {
    var T = p.T, v = p.video, playing = !v.paused && !v.ended;
    p.fig.classList.toggle('is-playing', playing); p.fig.setAttribute('data-state', playing ? 'playing' : 'paused');
    p.playBtn.setAttribute('aria-label', (playing ? T.pause : T.play) + ' — ' + p.title); p.playBtn.querySelector('.avp-btn-label').textContent = playing ? T.pause : T.play;
    p.fig.classList.toggle('is-muted', v.muted); p.unmuteBtn.setAttribute('aria-pressed', v.muted ? 'false' : 'true'); p.unmuteBtn.querySelector('.avp-btn-label').textContent = v.muted ? T.unmute : T.mute; p.unmuteBtn.hidden = !v.muted && !p.userUnmuted;
    p.status.textContent = playing ? T.playing : (v.readyState < 2 && v.networkState === 2 ? T.loading : T.paused);
  }
  function requestPlay(p, mutedRetry) {
    var v = p.video, T = p.T; p.fig.setAttribute('data-avp-play-result', 'pending'); p.userPause = false;
    var pr;
    try { pr = v.play(); } catch (e) { onPlayError(p, e); return; }
    if (pr && pr.then) { pr.then(function () { p.fig.setAttribute('data-avp-play-result', 'resolved'); refresh(p); }).catch(function (err) { if (!mutedRetry && !v.muted) { v.muted = true; plog(p, 'muted-retry', String(err && err.name)); requestPlay(p, true); } else onPlayError(p, err); }); }
    else { p.fig.setAttribute('data-avp-play-result', 'no-promise'); refresh(p); }
  }
  function onPlayError(p, err) { var name = err && err.name ? err.name : 'error'; p.fig.setAttribute('data-avp-play-result', 'rejected:' + name); p.fig.setAttribute('data-avp-last-error', name); plog(p, 'play-error', name); if (name !== 'AbortError' && name !== 'NotAllowedError') showError(p); refresh(p); }
  function showError(p) { if (p.errorShown) return; p.errorShown = true; p.fig.classList.add('has-error'); var e = el('p', 'avp-error'); e.setAttribute('role', 'alert'); e.textContent = p.T.error + ' '; var a = el('a', 'avp-download', p.T.download); a.href = p.src; a.setAttribute('download', ''); e.appendChild(a); p.bar.appendChild(e); }
  function toggle(p) { var v = p.video; if (v.paused || v.ended) requestPlay(p, false); else { p.userPause = true; v.pause(); refresh(p); } }
  function expand(p, trig) {
    if (open && open !== p) collapse(open);
    p.trigger = trig || document.activeElement; var f = p.fig; p.wasPlaying = !p.video.paused;
    if (typeof f.showPopover === 'function') { try { f.setAttribute('popover', 'manual'); f.showPopover(); p.usedPopover = true; } catch (e) { f.removeAttribute('popover'); p.usedPopover = false; } }
    f.classList.add('is-lightbox'); f.setAttribute('role', 'dialog'); f.setAttribute('aria-modal', 'true'); f.setAttribute('aria-labelledby', p.titleEl.id);
    p.closeBtn.hidden = false; p.expandBtn.hidden = true; open = p; setOpenFlag(true); document.body.classList.add('avp-lightbox-open');
    plog(p, 'lightbox', 'open'); document.addEventListener('focusin', onDocFocus, true);
    try { p.closeBtn.focus({ preventScroll: true }); } catch (e) {}
    if (p.wasPlaying && p.video.paused) requestPlay(p, false); /* continuing playback on the SAME node — currentTime is preserved by construction */
  }
  function collapse(p) {
    var f = p.fig; f.classList.remove('is-lightbox'); f.removeAttribute('role'); f.removeAttribute('aria-modal'); f.removeAttribute('aria-labelledby');
    if (p.usedPopover) { try { f.hidePopover(); } catch (e) {} f.removeAttribute('popover'); }
    p.closeBtn.hidden = true; p.expandBtn.hidden = false; open = null; setOpenFlag(false); document.body.classList.remove('avp-lightbox-open'); document.removeEventListener('focusin', onDocFocus, true);
    plog(p, 'lightbox', 'close');
    var t = p.trigger; if (t && document.contains(t) && !t.hidden) { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } } else { try { p.expandBtn.focus({ preventScroll: true }); } catch (e) {} }
  }
  function onDocFocus(e) { if (!open) return; if (!open.fig.contains(e.target)) { var f = focusables(open); if (f.length) f[0].focus(); } }
  function btn(cls, label, T) { var b = el('button', 'avp-btn ' + cls); b.type = 'button'; b.setAttribute('data-keys', 'own'); b.innerHTML = '<span class="avp-ico" aria-hidden="true"></span><span class="avp-btn-label"></span>'; b.querySelector('.avp-btn-label').textContent = label; b.setAttribute('aria-label', label); return b; }
  function lazyPreload(v) { /* v1.4.7: preload=none until the player is on the shown slide, then metadata (no speculative range fetch that DevTools logs as an aborted media request) */
    try {
      if (!('IntersectionObserver' in window)) { v.preload = 'metadata'; v.setAttribute('preload', 'metadata'); return; }
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio > 0) { v.preload = 'metadata'; v.setAttribute('preload', 'metadata'); io.disconnect(); } }); }, { threshold: [0.01] });
      io.observe(v);
    } catch (e) {}
  }
  function create(opts) {
    var lang = opts.lang === 'ar' ? 'ar' : 'en', T = UI[lang];
    var fig = el('figure', 'avp' + (opts.className ? ' ' + opts.className : '')); fig.setAttribute('data-avp', opts.key || 'film'); fig.setAttribute('data-avp-version', VERSION); fig.setAttribute('lang', lang); fig.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    var stage = el('div', 'avp-stage');
    var v = el('video'); v.className = 'avp-video'; v.controls = true; v.setAttribute('controls', ''); v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'none'; v.setAttribute('preload', 'none'); lazyPreload(v); v.muted = true; v.setAttribute('muted', ''); v.loop = !!opts.loop; if (opts.loop) v.setAttribute('loop', '');
    if (opts.poster) { v.poster = opts.poster; v.setAttribute('poster', opts.poster); }
    var s = el('source'); s.src = opts.src; s.type = opts.type || 'video/mp4'; v.appendChild(s); /* MP4 (H.264/AAC) first and only shipped source */
    if (opts.tracks) opts.tracks.forEach(function (t) { var tr = el('track'); tr.kind = 'captions'; tr.srclang = t.lang; tr.label = t.label; tr.src = t.src; if (t.default) tr.default = true; v.appendChild(tr); });
    v.setAttribute('aria-label', opts.title || ''); stage.appendChild(v); fig.appendChild(stage);
    var bar = el('div', 'avp-bar');
    var titleEl = el('span', 'avp-title', opts.title || ''); titleEl.id = 'avp-title-' + Math.random().toString(36).slice(2, 8); bar.appendChild(titleEl);
    var playBtn = btn('avp-play', T.play, T), expandBtn = btn('avp-expand', T.expand, T), unmuteBtn = btn('avp-unmute', T.unmute, T), closeBtn = btn('avp-close', T.close, T); closeBtn.hidden = true;
    var status = el('span', 'avp-status'); status.setAttribute('aria-live', 'polite'); status.textContent = T.paused;
    bar.appendChild(playBtn); bar.appendChild(expandBtn); bar.appendChild(unmuteBtn); bar.appendChild(closeBtn); bar.appendChild(status);
    fig.appendChild(bar);
    if (opts.caption) { var cap = el('figcaption', 'avp-caption', opts.caption); fig.appendChild(cap); }
    var p = { key: opts.key || 'film', fig: fig, video: v, bar: bar, playBtn: playBtn, expandBtn: expandBtn, unmuteBtn: unmuteBtn, closeBtn: closeBtn, status: status, titleEl: titleEl, T: T, title: opts.title || '', src: opts.src, userUnmuted: false };
    playBtn.addEventListener('click', function () { toggle(p); });
    expandBtn.addEventListener('click', function () { expand(p, expandBtn); });
    closeBtn.addEventListener('click', function () { collapse(p); });
    unmuteBtn.addEventListener('click', function () { v.muted = !v.muted; if (!v.muted) p.userUnmuted = true; refresh(p); });
    v.addEventListener('click', function () { toggle(p); });
    ['play', 'pause', 'ended', 'loadedmetadata', 'canplay', 'waiting', 'stalled', 'volumechange', 'seeked', 'error'].forEach(function (evn) { v.addEventListener(evn, function () { plog(p, evn); if (evn === 'error') { var err = v.error; p.fig.setAttribute('data-avp-last-error', 'media:' + (err && err.code)); if (v.networkState === 3) showError(p); } refresh(p); }); });
    fig.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && open === p) { e.preventDefault(); collapse(p); return; }
      if (e.key === 'Tab' && open === p) { var f = focusables(p), first = f[0], last = f[f.length - 1]; if (!f.length) return; if (e.shiftKey && (document.activeElement === first || !fig.contains(document.activeElement))) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } return; }
      if ((e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') && e.target === v) { e.preventDefault(); toggle(p); }
    });
    isolate(fig);
    p.autoplayOk = !reduced();
    api.players.push(p); refresh(p); return fig;
  }
  document.addEventListener('keydown', function (e) { if ((e.key === 'Escape' || e.key === 'Esc') && open) { e.stopPropagation(); e.preventDefault(); collapse(open); } }, true);
  window.AtharVideoPlayer = api;
})();
