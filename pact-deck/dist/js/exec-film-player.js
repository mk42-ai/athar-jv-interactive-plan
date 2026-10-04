/* Athar Open Agentic Pact deck — v1.5.9 (2026-10-03) shared executive-film player: window.AtharExecFilmPlayer = { create, slot, players, version }.
   ONE clean component for every Section 09 card (dist/js/exec-team.js) — and the same contract the intro gate follows (dist/js/intro-gate.js):
   · press-to-play ONLY: no autoplay attribute, no muted auto-start, no programmatic play() on slide enter or on narration events — the film starts
     from the centred Play button (keyboard: Tab → Enter/Space) or a click on the poster;
   · poster frame (jpg/webp, ffmpeg still — the timestamp is recorded in features/exec-films/films.json) + a centred Play button + the duration
     label; native controls are enabled on the first play and the custom overlay is removed, so nothing sits on top of the <video> while it plays;
   · captions EN + AR as <track kind="subtitles"> WebVTT; the default track follows the deck language (html[lang]);
   · narration: the <video> carries data-narration-pause, so the guide (dist/js/narration.js) pauses on `play` and resumes on `pause` / `ended`;
   · RTL-safe (logical properties, dir/lang on the figure, the video itself is never mirrored), fixed 16:9 box (aspect-ratio) → no layout shift;
   · 1080p source by default, the 720p transcode for viewports ≤ 720 px or Save-Data; data-efp-* attributes for QA.
   slot(): the labelled, non-broken "Film coming soon / قريباً" ready slot used while a card has no verified film. */
(function () {
  'use strict';
  var VERSION = 'v1.6.1';
  var UI = {
    en: { play: 'Play film', playAria: 'Play the film', replay: 'Replay film', pause: 'Pause', captions: 'captions EN / AR', soon: 'Film coming soon', soonSub: 'A verified film for this card will appear here.', film: 'Film', duration: 'Duration', note: 'The narrated guide pauses while the film plays and resumes after it.' },
    ar: { play: 'تشغيل الفيلم', playAria: 'تشغيل الفيلم', replay: 'إعادة تشغيل الفيلم', pause: 'إيقاف مؤقت', captions: 'ترجمة إنجليزية / عربية', soon: 'الفيلم قريباً', soonSub: 'سيظهر هنا الفيلم المعتمد لهذه البطاقة.', film: 'فيلم', duration: 'المدة', note: 'يتوقف الدليل الصوتي أثناء عرض الفيلم ويستأنف بعده.' }
  };
  var api = { version: VERSION, players: [], create: create, slot: slot, UI: UI };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function mmss(s) { s = Math.max(0, Math.round(Number(s) || 0)); var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
  function small() { try { return (window.matchMedia && window.matchMedia('(max-width: 720px)').matches) || !!(navigator.connection && navigator.connection.saveData); } catch (e) { return false; } }
  function playIcon() { return '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>'; }
  function filmIcon() { return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 9h18M3 15h18M7 5v14M17 5v14" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'; }
  function isolate(node) { /* clicks and keys inside the player never reach the deck's slide router (same rule as video-player.js) */
    ['keydown', 'keyup', 'keypress'].forEach(function (t) { node.addEventListener(t, function (e) { if (!node.contains(e.target)) return; if (e.key !== 'Tab' && e.key !== 'Escape') e.stopPropagation(); }); });
    ['click', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'dblclick'].forEach(function (t) { node.addEventListener(t, function (e) { if (node.contains(e.target)) e.stopPropagation(); }, { passive: true }); });
  }
  function setTracks(v, L) { try { for (var i = 0; i < v.textTracks.length; i++) { var tt = v.textTracks[i]; tt.mode = tt.language === L ? 'showing' : 'disabled'; } } catch (e) {} }

  /* opts: { key, film: { mp4, mp4Mobile, poster, posterWebp, posterTimeSec, vttEn, vttAr, durationSec, durationLabel, inPt, outPt, w, h, sha256 },
            title: { en, ar }, aria?: { en, ar }, lang?, compact? } → <figure class="efp"> */
  function create(opts) {
    var L = opts.lang === 'ar' ? 'ar' : (opts.lang === 'en' ? 'en' : lang()), T = UI[L], f = opts.film, key = opts.key || 'film';
    var title = (opts.title && opts.title[L]) || '', aria = (opts.aria && opts.aria[L]) || title;
    var fig = el('figure', 'efp' + (opts.compact ? ' efp--compact' : '')); fig.setAttribute('data-efp', key); fig.setAttribute('data-efp-version', VERSION); fig.setAttribute('data-state', 'idle');
    fig.setAttribute('lang', L); fig.setAttribute('dir', L === 'ar' ? 'rtl' : 'ltr'); fig.setAttribute('data-testid', 'exec-film-' + key);
    var stage = el('div', 'efp-stage');
    var v = el('video', 'efp-video'); v.setAttribute('playsinline', ''); v.playsInline = true; v.setAttribute('preload', 'metadata'); v.preload = 'metadata';
    v.setAttribute('data-narration-pause', 'true'); v.setAttribute('data-in', String(f.inPt || 0)); v.setAttribute('data-out', String(f.outPt || f.durationSec || 0));
    v.setAttribute('data-poster-time', String(f.posterTimeSec)); v.setAttribute('data-testid', 'exec-film-video'); v.setAttribute('data-no-mirror', 'true'); v.setAttribute('aria-label', aria);
    v.setAttribute('data-efp-sha256', f.sha256 || ''); v.width = f.w || 1920; v.height = f.h || 1080; v.setAttribute('disablepictureinpicture', '');
    /* no autoplay / no muted auto-start — the attributes are deliberately absent; controls appear on the first play */
    v.removeAttribute('autoplay'); v.autoplay = false; v.muted = false; v.removeAttribute('muted'); v.controls = false;
    if (f.poster) { v.poster = f.poster; v.setAttribute('poster', f.poster); }
    var useMobile = !!(f.mp4Mobile && small()); var src = useMobile ? f.mp4Mobile : f.mp4; v.setAttribute('data-efp-variant', useMobile ? '720p' : '1080p');
    var so = el('source'); so.src = src; so.type = 'video/mp4'; v.appendChild(so);
    [['en', 'English', f.vttEn], ['ar', 'العربية', f.vttAr]].forEach(function (t) { if (!t[2]) return; var tr = el('track'); tr.kind = 'subtitles'; tr.srclang = t[0]; tr.label = t[1]; tr.src = t[2]; if (t[0] === L) tr.default = true; v.appendChild(tr); });
    stage.appendChild(v);
    var play = el('button', 'efp-play'); play.type = 'button'; play.setAttribute('data-testid', 'exec-film-play'); play.setAttribute('aria-label', T.playAria + ' — ' + title);
    play.innerHTML = '<span class="efp-play-ring" aria-hidden="true">' + playIcon() + '</span><span class="efp-play-label">' + T.play + '</span>' + (f.durationLabel ? '<span class="efp-play-dur" aria-hidden="true">' + f.durationLabel + '</span>' : '');
    stage.appendChild(play); fig.appendChild(stage);
    var cap = el('figcaption', 'efp-cap'); cap.appendChild(el('span', 'efp-title', title));
    var meta = el('span', 'efp-meta'); meta.appendChild(el('span', 'efp-dur', (f.durationLabel || mmss(f.durationSec)))); meta.appendChild(el('span', 'efp-dot', '·')); meta.appendChild(el('span', 'efp-cc', T.captions)); cap.appendChild(meta);
    if (opts.note !== false) cap.appendChild(el('span', 'efp-note', (opts.note && opts.note[L]) || T.note));
    fig.appendChild(cap);
    var p = { key: key, fig: fig, video: v, playBtn: play, lang: L, ended: false };
    function state(s) { fig.setAttribute('data-state', s); fig.classList.toggle('is-playing', s === 'playing'); }
    function requestPlay() { var pr; try { pr = v.play(); } catch (e) { return; } if (pr && pr.catch) pr.catch(function (err) { fig.setAttribute('data-efp-last-error', String(err && err.name)); state(v.paused ? 'paused' : 'playing'); }); }
    play.addEventListener('click', function (e) { e.preventDefault(); if (p.ended || v.currentTime >= (f.outPt || 1e9) - 0.05) { try { v.currentTime = f.inPt || 0; } catch (x) {} p.ended = false; } requestPlay(); });
    v.addEventListener('click', function () { if (!v.controls) requestPlay(); });
    v.addEventListener('loadedmetadata', function () { setTracks(v, L); });
    v.addEventListener('play', function () { v.controls = true; v.setAttribute('controls', ''); state('playing'); fig.setAttribute('data-efp-played', 'true'); if (v.currentTime < (f.inPt || 0)) { try { v.currentTime = f.inPt || 0; } catch (e) {} } });
    v.addEventListener('playing', function () { state('playing'); });
    v.addEventListener('pause', function () { if (p.ended) return; state('paused'); play.setAttribute('aria-label', T.play + ' — ' + title); play.querySelector('.efp-play-label').textContent = T.play; });
    v.addEventListener('ended', function () { p.ended = true; state('ended'); play.setAttribute('aria-label', T.replay + ' — ' + title); play.querySelector('.efp-play-label').textContent = T.replay; });
    v.addEventListener('timeupdate', function () { var out = f.outPt; if (out && !v.paused && v.currentTime >= out) { v.pause(); try { v.currentTime = out; } catch (e) {} v.setAttribute('data-ended-at-out', 'true'); p.ended = true; v.dispatchEvent(new Event('ended')); } });
    v.addEventListener('error', function () { fig.classList.add('has-error'); fig.setAttribute('data-efp-last-error', 'media:' + (v.error && v.error.code)); }, true);
    fig.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') && e.target === v && !v.controls) { e.preventDefault(); requestPlay(); } });
    isolate(fig);
    api.players.push(p); return fig;
  }

  /* opts: { key, lang?, person?: { en, ar }, label?: { en, ar }, compact? } → <div class="efp-slot" data-efp-slot=key data-state="coming-soon"> */
  function slot(opts) {
    var L = opts.lang === 'ar' ? 'ar' : (opts.lang === 'en' ? 'en' : lang()), T = UI[L], key = opts.key || 'film';
    var d = el('div', 'efp-slot' + (opts.compact ? ' efp-slot--compact' : '')); d.setAttribute('data-efp-slot', key); d.setAttribute('data-state', 'coming-soon'); d.setAttribute('data-efp-version', VERSION);
    d.setAttribute('lang', L); d.setAttribute('dir', L === 'ar' ? 'rtl' : 'ltr'); d.setAttribute('role', 'note'); d.setAttribute('data-testid', 'exec-film-slot-' + key);
    var who = opts.person && opts.person[L] ? opts.person[L] : '';
    d.setAttribute('aria-label', (opts.label && opts.label[L]) || T.soon + (who ? ' — ' + who : ''));
    var ic = el('span', 'efp-slot-ico'); ic.setAttribute('aria-hidden', 'true'); ic.innerHTML = filmIcon(); d.appendChild(ic);
    var tx = el('span', 'efp-slot-text'); tx.appendChild(el('span', 'efp-slot-title', (opts.label && opts.label[L]) || T.soon)); tx.appendChild(el('span', 'efp-slot-sub', (opts.sub && opts.sub[L]) || T.soonSub)); d.appendChild(tx);
    return d;
  }
  window.AtharExecFilmPlayer = api;
})();
