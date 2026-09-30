/* Athar Open Agentic Pact deck — v1.5.2 (2026-09-30) narrated guide (ElevenLabs layer reinstated).
   Persistent player bottom-right above the footer: play/pause · mute · seek bar · autoplay-on-navigate toggle · captions
   drawer (EN always, AR when the segment carries textAr) · volume · keyboard N (toggle play). Segments are mapped by slideId
   from /narration/narration-manifest.json; the recovered intro render (/audio/intro-narration.mp3) is the intro segment;
   segments whose audio is not yet re-hosted ('recovered-text' / 'to-generate') show their transcript and a "audio pending"
   state. The next slide's segment is preloaded; preferences (autoplay, muted, captions, volume) persist in localStorage.
   "Listen to the guide" is added to the title slide; the footer "Replay intro" button also (re)starts the intro segment. */
(function () {
  'use strict';
  var VERSION = 'v1.5.2', KEY = 'athar-narration-prefs-v1', MANIFEST = '/narration/narration-manifest.json';
  var T = {
    en: { title: 'Guide', narrating: 'Narrating', ready: 'Ready', paused: 'Paused', guideOn: 'Guide on', guideOff: 'Guide', voice: 'George · ElevenLabs eleven_multilingual_v2', arNote: 'Guide audio is in English; Arabic transcript pending.', play: 'Play narration', pause: 'Pause narration', mute: 'Mute', unmute: 'Unmute', auto: 'Autoplay on navigate', captions: 'Transcript', close: 'Close', listen: 'Listen to the guide', pending: 'Audio pending — transcript only', none: 'No narration for this slide', intro: 'Intro', seek: 'Seek', volume: 'Volume', key: 'N toggles play', of: 'of', slide: 'Slide', recovered: 'Recovered render', script: 'Script (to generate)' },
    ar: { title: 'الدليل', narrating: 'جارٍ السرد', ready: 'جاهز', paused: 'متوقف مؤقتًا', guideOn: 'الدليل يعمل', guideOff: 'الدليل', voice: 'جورج · ElevenLabs eleven_multilingual_v2', arNote: 'الدليل الصوتي بالإنجليزية؛ النص العربي قيد الإعداد.', play: 'تشغيل التعليق', pause: 'إيقاف التعليق مؤقتًا', mute: 'كتم', unmute: 'إلغاء الكتم', auto: 'تشغيل تلقائي عند التنقّل', captions: 'النص', close: 'إغلاق', listen: 'استمع إلى الدليل', pending: 'الصوت قيد الإعداد — النص فقط', none: 'لا يوجد تعليق لهذه الشريحة', intro: 'المقدمة', seek: 'تقديم', volume: 'مستوى الصوت', key: 'N للتشغيل/الإيقاف', of: 'من', slide: 'الشريحة', recovered: 'تسجيل مستعاد', script: 'نص (بانتظار التوليد)' }
  };
  var SLIDE_IDS = {}; /* n -> slideId (filled from the manifest) */
  var prefs = load(); var man = null, segs = {}, byN = {}, cur = null, audio = new Audio(), preloaded = {};
  audio.preload = 'auto'; audio.volume = prefs.volume; audio.muted = !!prefs.muted;
  function load() { try { var p = JSON.parse(localStorage.getItem(KEY) || '{}'); return { autoplay: !!p.autoplay, muted: !!p.muted, captions: p.captions !== false, volume: typeof p.volume === 'number' ? p.volume : 0.9 }; } catch (e) { return { autoplay: false, muted: false, captions: true, volume: 0.9 }; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }
  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function fmt(s) { if (!isFinite(s)) return '0:00'; s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function currentN() { try { if (window.AtharImpactTiers && typeof window.AtharImpactTiers.current === 'function') { var c = window.AtharImpactTiers.current(); if (c) return c; } } catch (e) {} var a = document.querySelector('#root section.slide.is-active:not(.it-slide)'); var n = a ? parseInt(a.getAttribute('data-n'), 10) : 1; return n === 28 ? 39 : (n || 1); }
  function introActive() { var g = document.querySelector('.intro-gate'); return !!(g && g.offsetParent !== null); }

  /* ---------- UI ---------- */
  var ui = {};
  function build() {
    if (ui.root) return;
    var L = T[lang()];
    var root = el('aside', 'nar'); root.id = 'athar-narration'; root.setAttribute('data-testid', 'narration-player'); root.setAttribute('aria-label', L.title); root.setAttribute('data-version', VERSION);
    var bar = el('div', 'nar-bar');
    var gtog = el('button', 'nar-btn nar-guide'); gtog.type = 'button'; gtog.setAttribute('data-testid', 'guide-toggle'); gtog.setAttribute('aria-pressed', 'false'); gtog.textContent = L.guideOff; gtog.title = L.key; bar.appendChild(gtog); /* v1.5.2 close-out: visible 'Guide' toggle (Guide Mode) */
    var play = el('button', 'nar-btn nar-play'); play.type = 'button'; play.setAttribute('data-testid', 'nar-play'); play.innerHTML = icon('play'); bar.appendChild(play);
    var meta = el('div', 'nar-meta'); var ttl = el('span', 'nar-title', L.title); var sub = el('span', 'nar-sub', ''); meta.appendChild(ttl); meta.appendChild(sub); bar.appendChild(meta);
    var time = el('span', 'nar-time', '0:00 / 0:00'); bar.appendChild(time);
    var mute = el('button', 'nar-btn nar-mute'); mute.type = 'button'; mute.setAttribute('data-testid', 'nar-mute'); mute.innerHTML = icon(prefs.muted ? 'muted' : 'sound'); bar.appendChild(mute);
    var vol = el('input', 'nar-vol'); vol.type = 'range'; vol.min = '0'; vol.max = '1'; vol.step = '0.05'; vol.value = String(prefs.volume); vol.setAttribute('aria-label', L.volume); bar.appendChild(vol);
    var auto = el('button', 'nar-btn nar-toggle nar-auto'); auto.type = 'button'; auto.setAttribute('aria-pressed', prefs.autoplay ? 'true' : 'false'); auto.setAttribute('data-testid', 'nar-autoplay'); auto.textContent = 'AUTO'; auto.title = L.auto; bar.appendChild(auto);
    var cc = el('button', 'nar-btn nar-toggle nar-cc'); cc.type = 'button'; cc.setAttribute('aria-pressed', prefs.captions ? 'true' : 'false'); cc.setAttribute('data-testid', 'nar-captions'); cc.textContent = 'CC'; cc.title = L.captions; bar.appendChild(cc);
    root.appendChild(bar);
    var seek = el('div', 'nar-seek'); seek.setAttribute('role', 'slider'); seek.setAttribute('aria-label', L.seek); seek.setAttribute('aria-valuemin', '0'); seek.setAttribute('aria-valuemax', '100'); seek.setAttribute('aria-valuenow', '0'); seek.tabIndex = 0; seek.setAttribute('data-testid', 'nar-seek');
    var fill = el('span', 'nar-seek-fill'); seek.appendChild(fill); root.appendChild(seek);
    var drawer = el('div', 'nar-drawer'); drawer.setAttribute('data-testid', 'nar-transcript'); drawer.hidden = !prefs.captions;
    var dEn = el('p', 'nar-text nar-text--en'); dEn.setAttribute('lang', 'en'); dEn.dir = 'ltr'; var dAr = el('p', 'nar-text nar-text--ar'); dAr.setAttribute('lang', 'ar'); dAr.dir = 'rtl'; var dSt = el('p', 'nar-status');
    drawer.appendChild(dEn); drawer.appendChild(dAr); drawer.appendChild(dSt); root.appendChild(drawer);
    var hint = el('span', 'nar-hint', L.key); root.appendChild(hint);
    document.body.appendChild(root);
    ui = { root: root, gtog: gtog, play: play, ttl: ttl, sub: sub, time: time, mute: mute, vol: vol, auto: auto, cc: cc, seek: seek, fill: fill, drawer: drawer, dEn: dEn, dAr: dAr, dSt: dSt, hint: hint };
    play.addEventListener('click', toggle);
    gtog.addEventListener('click', function () { toggle(); });
    mute.addEventListener('click', function () { prefs.muted = !prefs.muted; audio.muted = prefs.muted; save(); render(); });
    vol.addEventListener('input', function () { prefs.volume = parseFloat(vol.value); audio.volume = prefs.volume; if (prefs.volume > 0 && prefs.muted) { prefs.muted = false; audio.muted = false; } save(); render(); });
    auto.addEventListener('click', function () { prefs.autoplay = !prefs.autoplay; save(); render(); });
    cc.addEventListener('click', function () { prefs.captions = !prefs.captions; save(); render(); });
    seek.addEventListener('click', function (ev) { seekTo((ev.clientX - seek.getBoundingClientRect().left) / seek.getBoundingClientRect().width); });
    seek.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { ev.preventDefault(); ev.stopPropagation(); if (audio.duration) audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + (ev.key === 'ArrowRight' ? 5 : -5))); } });
    audio.addEventListener('timeupdate', progress); audio.addEventListener('ended', function () { render(); }); audio.addEventListener('loadedmetadata', progress); audio.addEventListener('play', render); audio.addEventListener('pause', render);
  }
  function icon(k) { var d = { play: 'M8 5v14l11-7z', pause: 'M7 5h4v14H7zM13 5h4v14h-4z', sound: 'M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12', muted: 'M4 10v4h4l5 4V6L8 10zM16 9l5 6M21 9l-5 6' }[k]; return '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="' + d + '" fill="' + (k === 'play' || k === 'pause' ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function seekTo(f) { if (lang() === 'ar') f = 1 - f; if (audio.duration) audio.currentTime = Math.max(0, Math.min(1, f)) * audio.duration; }
  function progress() { if (!ui.root) return; var d = audio.duration || 0, c = audio.currentTime || 0, p = d ? (c / d) * 100 : 0; ui.fill.style.inlineSize = p + '%'; ui.seek.setAttribute('aria-valuenow', String(Math.round(p))); ui.time.textContent = fmt(c) + ' / ' + fmt(d); }
  function render() {
    if (!ui.root) return; var L = T[lang()], s = cur;
    ui.root.setAttribute('lang', lang()); ui.root.dir = lang() === 'ar' ? 'rtl' : 'ltr';
    ui.play.innerHTML = icon(!audio.paused && !audio.ended ? 'pause' : 'play'); ui.play.setAttribute('aria-label', !audio.paused ? L.pause : L.play); ui.play.disabled = !(s && s.audio); ui.root.classList.toggle('is-playing', !audio.paused && !audio.ended);
    ui.mute.innerHTML = icon(prefs.muted ? 'muted' : 'sound'); ui.mute.setAttribute('aria-label', prefs.muted ? L.unmute : L.mute); ui.mute.setAttribute('aria-pressed', prefs.muted ? 'true' : 'false');
    ui.auto.setAttribute('aria-pressed', prefs.autoplay ? 'true' : 'false'); ui.auto.title = L.auto; ui.cc.setAttribute('aria-pressed', prefs.captions ? 'true' : 'false'); ui.cc.title = L.captions;
    var playing = !audio.paused && !audio.ended; ui.ttl.textContent = L.title; ui.hint.textContent = L.key; ui.drawer.hidden = !prefs.captions; ui.vol.value = String(prefs.volume);
    ui.gtog.textContent = playing ? L.guideOn : L.guideOff; ui.gtog.setAttribute('aria-pressed', playing ? 'true' : 'false'); ui.gtog.disabled = !(s && s.audio); ui.root.setAttribute('data-narrating', playing ? 'true' : 'false'); ui.root.setAttribute('data-has-audio', s && s.audio ? 'true' : 'false');
    if (!s) { ui.sub.textContent = L.none; ui.dEn.textContent = ''; ui.dAr.textContent = ''; ui.dSt.textContent = L.none; ui.root.setAttribute('data-segment', ''); return; }
    ui.root.setAttribute('data-segment', s.segmentId); ui.root.setAttribute('data-status', s.status);
    var secLbl = s.n === 0 ? L.intro : (lang() === 'ar' ? (s.sectionAr || s.section || '') : (s.section || '')); ui.sub.textContent = (playing ? L.narrating : (audio.currentTime > 0 && s.audio ? L.paused : L.ready)) + ' · ' + secLbl + (s.n === 0 ? '' : ' · ' + L.slide + ' ' + s.n + ' ' + L.of + ' 39');
    ui.dEn.textContent = s.text || ''; ui.dAr.textContent = s.textAr || ''; ui.dAr.hidden = !s.textAr;
    ui.dSt.textContent = s.audio ? ((s.clipId ? s.clipId + ' · ' : '') + (s.n === 0 ? L.recovered : L.voice) + (lang() === 'ar' && !s.textAr ? ' · ' + L.arNote : '')) : (L.pending + (s.status === 'to-generate' ? ' · ' + L.script : ''));
    progress();
  }
  /* ---------- segments ---------- */
  function segFor(n) { return byN[n] || null; }
  function setSegment(s, autoplay) {
    if (!s) { cur = null; audio.pause(); render(); return; }
    if (cur && cur.segmentId === s.segmentId) { if (autoplay && s.audio && audio.paused) audio.play().catch(function () {}); render(); return; }
    if (cur && s.audio && cur.audio === s.audio) { cur = s; if (autoplay && audio.paused && !audio.ended && !introActive()) audio.play().catch(function () {}); render(); return; } /* v1.5.2 close-out: one clip per section — moving within the section never restarts the narration */
    var wasPlaying = !audio.paused && !audio.ended; cur = s; audio.pause(); /* v1.5.2 close-out: Guide Mode continuity — if the guide was narrating, the next section's clip starts automatically */
    if (s.audio) { audio.src = s.audio; audio.load(); if ((autoplay || wasPlaying) && !introActive()) audio.play().catch(function () {}); } else { audio.removeAttribute('src'); }
    var nx = null; for (var k = s.n + 1; k <= 39; k++) { var cand = segFor(k); if (cand && cand.audio && cand.audio !== s.audio) { nx = cand; break; } } if (nx && nx.audio && !preloaded[nx.audio]) { preloaded[nx.audio] = true; var a = new Audio(); a.preload = 'auto'; a.src = nx.audio; }
    render();
  }
  function toggle() { if (!cur || !cur.audio) return; if (audio.paused) audio.play().catch(function () {}); else audio.pause(); }
  function playIntro() { var s = segs.intro; if (!s) return; cur = null; setSegment(s, true); if (audio.paused) audio.play().catch(function () {}); }
  function onSlide() { var n = currentN(); if (cur && cur.n === 0 && !audio.paused) return; /* let the intro finish */ setSegment(segFor(n), prefs.autoplay); }
  /* ---------- hooks: title-slide button, Replay intro, keyboard ---------- */
  function hooks() {
    var L = T[lang()];
    var cov = document.getElementById('s-cover'); if (cov) { var cta = cov.querySelector('.cover-copy a.cta'); var ex = cov.querySelector('.nar-listen'); if (cta && (!ex || ex.getAttribute('data-lang') !== lang())) { if (ex) ex.remove(); var b = el('button', 'nar-listen', L.listen); b.type = 'button'; b.setAttribute('data-testid', 'listen-to-guide'); b.setAttribute('data-lang', lang()); b.addEventListener('click', playIntro); cta.insertAdjacentElement('afterend', b); } }
    var rp = document.querySelector('footer.pagefooter .intro-replay'); if (rp && !rp.getAttribute('data-nar')) { rp.setAttribute('data-nar', '1'); rp.addEventListener('click', function () { window.setTimeout(playIntro, 50); }); }
  }
  document.addEventListener('keydown', function (ev) { if (ev.defaultPrevented || ev.altKey || ev.ctrlKey || ev.metaKey) return; var t = ev.target; if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return; if (ev.key === 'n' || ev.key === 'N') { ev.preventDefault(); toggle(); } });
  /* ---------- boot ---------- */
  function boot(m) {
    man = m; (m.segments || []).forEach(function (s) { segs[s.segmentId] = s; byN[s.n] = s; SLIDE_IDS[s.n] = s.slideId; });
    build(); hooks(); onSlide();
    var root = document.getElementById('root'), pending = false;
    function schedule() { if (pending) return; pending = true; window.requestAnimationFrame(function () { pending = false; try { hooks(); onSlide(); render(); } catch (e) {} }); }
    if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    window.addEventListener('hashchange', schedule);
    window.AtharNarration = { version: VERSION, manifest: m, current: function () { return cur; }, play: function () { if (cur && cur.audio) audio.play(); }, pause: function () { audio.pause(); }, toggle: toggle, playIntro: playIntro, prefs: prefs, segmentFor: segFor, setCaptions: function (v) { prefs.captions = !!v; save(); render(); } };
  }
  fetch(MANIFEST, { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(boot).catch(function () { /* manifest missing: no player */ });
})();
