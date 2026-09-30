/* Athar Open Agentic Pact deck — v1.4.1 (2026-09-27) real-screen product tour.
   Replaces the v1.4.0 hand-coded tour mockups (/js/tour/{overview,marketplace,playground,flow}.js) with the ACTUAL
   product screens: 2880×1800 PNGs from Athar_Package.zip (05 Web & Product/UI_Screens/*) and the Agent Flow Builder
   frames extracted losslessly from Athar_Wireframes_and_Screens_v1.pdf (pages 16 / 25). Served at native 1440×900
   aspect with srcset 1x (LANCZOS 1440×900) / 2x (native), object-fit: contain, never upscaled beyond native pixels.
   Also provides the package film (08 Web Prototype/athar_web_UI.mp4 → H.264 MP4 + VP9 WebM, poster = still p30) and the
   extracted stills that replace the v1.4.0 concept-render plates on slides 34, 36, 37 and 38.
   Tab / theme / language state lives inside the slide (sessionStorage key aos-tour-state); the deck's own language
   switch is untouched. Hotspot captions are the pack's own labels (Athar_Wireframes_and_Screens_v1.pdf page captions). */
(function () {
  'use strict';
  var BASE = '/assets/tour/';
  var TS = { 'kf-0000.png': 0, 'kf-0571.png': 19.05, 'kf-0673.png': 22.46, 'kf-0875.png': 29.2, 'kf-1178.png': 39.31, 'kf-1481.png': 49.42, 'kf-1682.png': 56.12, 'kf-1783.png': 59.49, 'kf-2086.png': 69.6, 'kf-2389.png': 79.71, 'p20.png': 16.7, 'p50.png': 41.75, 'p80.png': 66.8, 'poster.png': 25.05 };
  var FILM = ['kf-0000.png', 'kf-0571.png', 'kf-0875.png', 'kf-1178.png', 'kf-1481.png', 'kf-1783.png', 'kf-2086.png', 'kf-2389.png'];
  var META = { timestamps: TS, filmstrip: FILM }; // mirrored in /assets/tour/tour-assets.json
  var SCREENS = { // key → {src key, page reference, label}
    'overview': { pack: '01_overview', pdf: { en: 9, ar: 18 }, en: 'Overview', ar: 'النظرة العامة' },
    'marketplace': { pack: '02_marketplace', pdf: { en: 10, ar: 19 }, en: 'Marketplace', ar: 'السوق' },
    'playground-empty': { pack: '03_playground_empty', pdf: { en: 11, ar: 20 }, en: 'Playground — empty', ar: 'الملعب — فارغ' },
    'playground-streaming': { pack: '04_playground_streaming', pdf: { en: 12, ar: 21 }, en: 'Playground — conversation (streaming)', ar: 'الملعب — محادثة (بث)' },
    'playground-completed': { pack: '05_playground_completed_outputs', pdf: { en: 13, ar: 22 }, en: 'Playground — conversation (completed + Outputs)', ar: 'الملعب — محادثة (مكتملة + المخرجات)' },
    'flow': { pack: null, pdf: { en: 16, ar: 25 }, en: 'Agent Flow Builder', ar: 'منشئ تدفقات الوكلاء' }
  };
  /* every view exists in all four variants (light/dark × EN/AR); the fallback notes below are kept for completeness */
  var AVAILABLE = {}; Object.keys(SCREENS).forEach(function (k) { AVAILABLE[k] = { 'light-en': 1, 'dark-en': 1, 'light-ar': 1, 'dark-ar': 1 }; });
  /* hotspots: caption text = the pack's own page captions (page-text.json); positions are percentage anchors on the 1440×900 frame */
  var HOT = {
    'overview': [[13, 22, 'Credits', 'الأرصدة'], [50, 30, 'Six live metrics', 'ستة مقاييس حية'], [38, 62, 'Agent activity and token charts', 'مخططات نشاط الوكلاء والرموز'], [84, 44, 'Grants · plugins', 'المنح · الإضافات'], [84, 76, 'Storage · models', 'التخزين · النماذج']],
    'marketplace': [[10, 24, 'Types — agents, agent flows, plugins, skills', 'الأنواع — وكلاء، تدفقات، إضافات، مهارات'], [50, 14, 'Search', 'البحث'], [28, 36, 'Categories', 'التصنيفات'], [90, 36, 'Sort', 'الفرز'], [55, 66, 'Agent grid', 'شبكة الوكلاء']],
    'playground-empty': [[50, 34, 'Promise line', 'سطر الوعد'], [50, 58, 'Suggestions', 'الاقتراحات'], [50, 78, 'Composer — model, mode', 'المحرّر — النموذج والوضع']],
    'playground-streaming': [[30, 22, 'Agent card', 'بطاقة الوكيل'], [36, 42, 'Status steps — tools chosen for the prompt resolving', 'خطوات الحالة — الأدوات المختارة للطلب'], [40, 66, 'Answer streaming in', 'الإجابة قيد البث'], [86, 50, 'Outputs panel', 'لوحة المخرجات']],
    'playground-completed': [[30, 22, 'Agent card', 'بطاقة الوكيل'], [38, 48, 'Answer with key points', 'الإجابة مع النقاط الرئيسية'], [40, 72, 'Answer with file — Ask about this file', 'إجابة مع ملف — اسأل عن هذا الملف'], [86, 50, 'Outputs panel opens when the run completes', 'تُفتح لوحة المخرجات عند اكتمال التشغيل']],
    'flow': [[16, 46, 'Trigger', 'المُطلِق'], [44, 46, 'Model — selected node highlighted in gold', 'النموذج — العقدة المحددة مبرزة بالذهبي'], [80, 46, 'Output', 'المخرج'], [60, 72, 'Hand-offs between agents', 'التسليمات بين الوكلاء'], [10, 14, 'Canvas — compose multi-agent flows', 'اللوحة — تأليف تدفقات متعددة الوكلاء']]
  };
  var NOTE = { en: { ar: 'AR screen not in pack', dark: 'Dark screen not in pack' }, ar: { ar: 'AR screen not in pack', dark: 'Dark screen not in pack' } };
  var UI = { en: { src: 'Source', pdfPage: 'Wireframes & Screens v1 · page', pack: 'Athar_Package.zip · UI_Screens', native: 'native 1440×900 (2x file 2880×1800)', hot: 'Hotspot', state: 'Conversation state', streaming: 'Streaming', completed: 'Completed', film: 'Product film · athar_web_UI.mp4', still: 'Product film still', at: 'at', sec: 's', filmstrip: 'Product film keyframes (athar_web_UI.mp4, 83.5 s)' },
             ar: { src: 'المصدر', pdfPage: 'الإطارات والشاشات v1 · صفحة', pack: 'Athar_Package.zip · UI_Screens', native: 'أصلي 1440×900 (ملف 2x بحجم 2880×1800)', hot: 'نقطة', state: 'حالة المحادثة', streaming: 'بث', completed: 'مكتمل', film: 'فيلم المنتج · athar_web_UI.mp4', still: 'لقطة من فيلم المنتج', at: 'عند', sec: 'ث', filmstrip: 'إطارات مفتاحية من فيلم المنتج (athar_web_UI.mp4، 83.5 ث)' } };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; return e; }
  function store(patch) { var s = {}; try { s = JSON.parse(sessionStorage.getItem('aos-tour-state') || '{}'); } catch (e) {} if (patch) { Object.assign(s, patch); try { sessionStorage.setItem('aos-tour-state', JSON.stringify(s)); } catch (e) {} } return s; }
  function variant(key, theme, lang) {
    var want = theme + '-' + lang, notes = [];
    if (!AVAILABLE[key][want]) {
      if (lang === 'ar' && !AVAILABLE[key][theme + '-ar']) { notes.push(NOTE[lang].ar); lang = 'en'; }
      if (theme === 'dark' && !AVAILABLE[key]['dark-' + lang]) { notes.push(NOTE[lang].dark); theme = 'light'; }
    }
    return { theme: theme, lang: lang, notes: notes, base: BASE + 'screens/' + key + '-' + theme + '-' + lang };
  }
  function frame(key, theme, lang, uiLang) {
    var v = variant(key, theme, lang), meta = SCREENS[key], T = UI[uiLang];
    var fig = el('figure', 'rs-device rs-device--' + v.theme); fig.setAttribute('data-screen', key); fig.setAttribute('data-theme', v.theme); fig.setAttribute('data-lang', v.lang); fig.setAttribute('dir', v.lang === 'ar' ? 'rtl' : 'ltr');
    var bar = el('div', 'rs-titlebar'); bar.setAttribute('aria-hidden', 'true'); bar.appendChild(el('span', 'rs-dots')); bar.appendChild(el('span', 'rs-url', 'athar.os / ' + key.replace(/-/g, ' '))); fig.appendChild(bar);
    var stage = el('div', 'rs-stage');
    var img = el('img', 'rs-shot'); img.src = v.base + '@1x.png'; img.srcset = v.base + '@1x.png 1x, ' + v.base + '@2x.png 2x'; img.width = 1440; img.height = 900; img.decoding = 'async'; img.loading = 'eager'; img.setAttribute('data-no-mirror', 'true');
    img.alt = meta[uiLang] + ' — ' + (v.theme === 'dark' ? (uiLang === 'ar' ? 'داكن' : 'dark') : (uiLang === 'ar' ? 'فاتح' : 'light')) + ' · ' + v.lang.toUpperCase();
    stage.appendChild(img);
    var hs = el('ol', 'rs-hotspots'); hs.setAttribute('aria-label', T.hot + 's');
    (HOT[key] || []).forEach(function (h, i) {
      var li = el('li', 'rs-hot'); li.style.insetInlineStart = h[0] + '%'; li.style.insetBlockStart = h[1] + '%';
      var b = el('button', 'rs-hot-btn', String(i + 1)); b.type = 'button'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', T.hot + ' ' + (i + 1) + ': ' + h[uiLang === 'ar' ? 3 : 2]); b.setAttribute('data-keys', 'own');
      var cap = el('span', 'rs-hot-cap', h[uiLang === 'ar' ? 3 : 2]); cap.setAttribute('role', 'tooltip'); cap.id = 'rs-cap-' + key + '-' + (i + 1); b.setAttribute('aria-describedby', cap.id);
      function toggle(force) { var on = force !== undefined ? force : b.getAttribute('aria-expanded') !== 'true'; hs.querySelectorAll('.rs-hot.is-open').forEach(function (o) { if (o !== li) { o.classList.remove('is-open'); o.querySelector('button').setAttribute('aria-expanded', 'false'); } }); li.classList.toggle('is-open', on); b.setAttribute('aria-expanded', on ? 'true' : 'false'); }
      b.addEventListener('click', function () { toggle(); });
      b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggle(); } else if (e.key === 'Escape') { toggle(false); } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); var all = Array.prototype.slice.call(hs.querySelectorAll('.rs-hot-btn')); var j = all.indexOf(b); var rtl = fig.getAttribute('dir') === 'rtl'; var fwd = (e.key === 'ArrowRight' && !rtl) || (e.key === 'ArrowLeft' && rtl) || e.key === 'ArrowDown'; all[(j + (fwd ? 1 : all.length - 1)) % all.length].focus(); } });
      li.appendChild(b); li.appendChild(cap); hs.appendChild(li);
    });
    stage.appendChild(hs); fig.appendChild(stage);
    var cap = el('figcaption', 'rs-cap');
    v.notes.forEach(function (n) { cap.appendChild(el('span', 'rs-note', n)); });
    var srcTxt = meta.pack ? (T.pack + ' · athar_web_ui_' + meta.pack + '_' + (v.lang === 'ar' ? 'ar_' : '') + v.theme + '_v1.png') : (T.pdfPage + ' ' + meta.pdf[v.lang] + ' (xref)');
    cap.appendChild(el('span', 'rs-src', T.src + ': ' + srcTxt + ' · ' + T.native)); fig.appendChild(cap);
    return fig;
  }
  function make(key) {
    return { mount: function (app, ctx) {
      var uiLang = ctx.lang === 'ar' ? 'ar' : 'en', theme = ctx.theme === 'dark' ? 'dark' : 'light';
      var wrap = el('div', 'rs-tab rs-tab--' + key); wrap.setAttribute('data-testid', 'rs-' + key);
      var sub = null, current = key;
      if (key === 'playground-conversation') {
        current = (store().convState === 'completed') ? 'playground-completed' : 'playground-streaming';
        sub = el('div', 'rs-substate'); sub.setAttribute('role', 'group'); sub.setAttribute('aria-label', UI[uiLang].state);
        [['playground-streaming', UI[uiLang].streaming], ['playground-completed', UI[uiLang].completed]].forEach(function (o) {
          var b = el('button', 'rs-sub-btn' + (o[0] === current ? ' is-on' : ''), o[1]); b.type = 'button'; b.setAttribute('aria-pressed', o[0] === current ? 'true' : 'false'); b.setAttribute('data-state', o[0]); b.setAttribute('data-keys', 'own');
          b.addEventListener('click', function () { current = o[0]; store({ convState: o[0] === 'playground-completed' ? 'completed' : 'streaming' }); sub.querySelectorAll('button').forEach(function (x) { var on = x.getAttribute('data-state') === current; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); paint(); });
          sub.appendChild(b);
        });
        wrap.appendChild(sub);
      }
      var holder = el('div', 'rs-holder'); wrap.appendChild(holder);
      function paint() { holder.innerHTML = ''; holder.appendChild(frame(current, theme, uiLang, uiLang)); }
      paint(); app.appendChild(wrap);
      store({ tab: key, theme: theme, lang: uiLang });
      return { setTheme: function (t) { theme = t === 'dark' ? 'dark' : 'light'; store({ theme: theme }); paint(); }, setActive: function () {}, destroy: function () { wrap.remove(); } };
    } };
  }
  /* ---------- video + stills for slides 34–38 ---------- */
  function video(cls, lang) {
    /* v1.4.3/1.4.4/1.4.6 behaviour re-applied in v1.4.7: launch film (MP4 first), uncropped shared player with Expand → lightbox
       (dist/js/video-player.js), poster + playsinline, keys isolated from the slide router. Falls back to the plain player if the module is absent. */
    if (window.AtharVideoPlayer && window.AtharVideoPlayer.create) {
      var T2 = UI[lang === 'ar' ? 'ar' : 'en'];
      var fig2 = window.AtharVideoPlayer.create({ src: BASE + 'video/athar-os-launch-30s.mp4', type: 'video/mp4', poster: BASE + 'video/athar-os-launch-30s-poster.jpg', lang: lang === 'ar' ? 'ar' : 'en',
        title: lang === 'ar' ? 'فيلم إطلاق Athar OS (30 ثانية)' : 'Athar OS launch film (30 s)', caption: lang === 'ar' ? 'الفيلم الرسمي لإطلاق Athar OS — بدون تعليق صوتي' : 'Official Athar OS launch film — no narration track', key: cls || 'film' });
      fig2.classList.add('rs-video'); if (cls) fig2.classList.add(cls); fig2.setAttribute('data-testid', 'rs-video'); return fig2;
    }
    var T = UI[lang === 'ar' ? 'ar' : 'en'];
    var fig = el('figure', 'rs-video' + (cls ? ' ' + cls : '')); fig.setAttribute('data-testid', 'rs-video');
    var v = el('video'); v.muted = true; v.loop = true; v.controls = true; v.preload = 'none'; v.setAttribute('muted', ''); v.setAttribute('loop', ''); v.setAttribute('playsinline', ''); v.setAttribute('controls', ''); v.setAttribute('preload', 'none'); /* v1.4.7: metadata only once shown */ if ('IntersectionObserver' in window) { try { var io0 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { v.preload = 'metadata'; v.setAttribute('preload', 'metadata'); io0.disconnect(); } }); }, { threshold: [0.01] }); io0.observe(v); } catch (e0) {} } v.poster = BASE + 'video/athar-os-launch-30s-poster.jpg'; v.width = 1920; v.height = 848; v.setAttribute('aria-label', T.film); v.setAttribute('data-no-mirror', 'true');
    var s1 = el('source'); s1.src = BASE + 'video/athar-os-launch-30s.mp4'; s1.type = 'video/mp4'; var s2 = null; /* v1.4.7: MP4-first launch film; WebM transcode not shipped */
    v.appendChild(s1); fig.appendChild(v);
    fig.appendChild(el('figcaption', 'rs-tag', T.film + ' · 83.5 ' + T.sec + ' · H.264 / VP9'));
    return fig;
  }
  function still(name, alt, cls, lang) {
    var T = UI[lang === 'ar' ? 'ar' : 'en'], t = META && META.timestamps ? META.timestamps[name] : null;
    var fig = el('figure', 'aos-plate rs-still' + (cls ? ' ' + cls : '')); fig.setAttribute('data-still', name);
    var p = el('picture'); var s = el('source'); s.type = 'image/webp'; s.srcset = BASE + 'stills/' + name.replace(/\.png$/, '') + '-960.webp'; p.appendChild(s);
    var i = el('img'); i.src = BASE + 'stills/' + name; i.alt = alt || T.still; i.decoding = 'async'; i.loading = 'eager'; i.width = 1920; i.height = 848; i.setAttribute('data-no-mirror', 'true'); p.appendChild(i); fig.appendChild(p);
    fig.appendChild(el('figcaption', 'aos-tag', T.still + (t !== null && t !== undefined ? ' · ' + T.at + ' ' + t + ' ' + T.sec : '')));
    return fig;
  }
  function filmstrip(lang) {
    var T = UI[lang === 'ar' ? 'ar' : 'en'], names = (META && META.filmstrip) || [];
    var wrap = el('figure', 'rs-filmstrip'); wrap.setAttribute('data-testid', 'rs-filmstrip'); wrap.setAttribute('data-no-mirror', 'true');
    var row = el('div', 'rs-film-row');
    names.forEach(function (n) { var c = el('span', 'rs-film-cell'); var i = el('img'); i.src = BASE + 'stills/' + n.replace(/\.png$/, '') + '-960.webp'; i.alt = T.still + ' ' + (META.timestamps[n] || 0) + ' ' + T.sec; i.width = 240; i.height = 106; i.loading = 'lazy'; i.decoding = 'async'; i.setAttribute('data-full', BASE + 'stills/' + n); c.appendChild(i); c.appendChild(el('span', 'rs-film-t', (META.timestamps[n] || 0) + ' ' + T.sec)); row.appendChild(c); });
    wrap.appendChild(row); wrap.appendChild(el('figcaption', 'aos-tag', T.filmstrip)); return wrap;
  }
  /* play videos only while their slide is the active one; pause otherwise (class observer on the stage, independent of the host hooks) */
  function syncVideos() {
    document.querySelectorAll('main.stage section.slide').forEach(function (sec) {
      var active = sec.classList.contains('is-active') && !(sec.getAttribute('aria-hidden') === 'true');
      sec.querySelectorAll('.rs-video video').forEach(function (v) { if (active) { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } } else if (!v.paused) v.pause(); });
    });
  }
  var pending = false; function schedule() { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; syncVideos(); }); }
  var root = document.getElementById('root'); if (root) new MutationObserver(schedule).observe(root, { subtree: true, attributes: true, attributeFilter: ['class', 'aria-hidden'], childList: true });
  if ('IntersectionObserver' in window) { /* belt and braces for hosts that scroll slides instead of clipping them */ var io = new IntersectionObserver(function () { schedule(); }, { threshold: 0.25 }); var seen = new WeakSet(); setInterval(function () { document.querySelectorAll('.rs-video video').forEach(function (v) { if (!seen.has(v)) { seen.add(v); io.observe(v); } }); }, 1500); }
  window.AtharTourReal = { version: '1.4.7', make: make, frame: frame, video: video, still: still, filmstrip: filmstrip, screens: SCREENS, available: AVAILABLE, ready: function (cb) { cb(META); } };
})();
