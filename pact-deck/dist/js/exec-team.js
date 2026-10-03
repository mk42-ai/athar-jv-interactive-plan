/* Athar Open Agentic Pact deck — v1.5.7 (2026-10-03; v1.5.6 2026-10-02) — section 09 "Executive Team" / «الفريق التنفيذي».
   Appended AFTER the closing slide (#s-closing, slide 39): S09 intro + three letters = slides 40–43, deep links #/28/exec-1 … #/28/exec-4
   (also #slide-40 … #slide-43). Hand-written-letter style per the Athar Brand Guidelines: Manuscript #F7F3EA ground with the
   ink-on-manuscript texture at 8 % opacity, Athar Ink #0F1E2C text, names in IBM Plex Serif 600, body IBM Plex Sans 16/24 (sentence case),
   Arabic in IBM Plex Sans Arabic at 107 % of the Latin size on the right of a hairline divider (letter-spacing 0), salutation · short
   paragraphs · sign-off, closed by a SHORT Legacy Gold hairline (never full width). No script fonts. The Arabic deck is a full RTL mirror.
   Portraits only where officially sourced (none at present); everyone else has a monogram
   roundel. The official's letter uses published statements only and carries the tag "for clearance by office".
   Hidden, feature-flagged card (FLAGS.pendingCards = false → not rendered, not counted, not narrated): Lorenzo (surname and role unconfirmed).
   v1.5.6: the other pending card (a different Presidential Court official, not Fahad) was removed outright; H.E. Fahad Mohamed Al Ameri's letter is
   published as Letter 2 (not behind the flag). Name LABELS carry no honorific; the letter bodies keep H.E. / معالي / سعادة.
   Navigation mirrors dist/js/impact-tiers.js; this file loads BEFORE impact-tiers.js and narration.js so the deck total is 39 + 4 = 43. v1.5.7: the former Letter 1 was removed (4 → 3 letters); the CEO film is an optional feature (off). */
(function () {
  'use strict';
  var VERSION = 'v1.5.7';
  var FLAGS = { pendingCards: false };
  var REAL_LAST = 28, CLOSING_N = 39;
  /* v1.5.7: the Muhammed Khalid impact-story film is an OPTIONAL feature (pact-deck/features.json → originsFilm, default false). When on, the build copies
     features/origins-film/exec-film.js (+ its assets) into dist/ and injects its <script> BEFORE this file; it defines window.AtharExecFilm = { mp4, poster, vttEn, vttAr, inPt,
     outPt, w, h, bodyExtra, strings }. With the flag off (shipped state) nothing about the film is in dist/ and this module renders the CEO letter without it. */
  var FILM = (typeof window.AtharExecFilm === 'object' && window.AtharExecFilm) || null;
  var LOGO = '/assets/exec/athar-logo-master-1200.png';
  var S = {
    nepEn: 'https://uaenep.ae/en/participant/fahad-al-ameri', nepAr: 'https://uaenep.ae/ar/participant/fahad-al-ameri',
    n42: 'https://www.42network.org/blog/whos-behind-42-muhammed-khaled-founder-ceo-of-airev/',
    tn: 'https://www.thenationalnews.com/future/technology/2024/09/30/core42-airev-generative-ai/',
    gpu: 'https://thegpu.ai/p/issue-42-building-real-world-ai-deployment-layer-airev',
    dwf: 'https://dwfgroup.com/en/news-and-insights/press-releases/2018/6/dwf-middle-east-appoints-head-of-corporate-and-defence-and-security',
    sra: 'https://www.sra.org.uk/consumers/register/person/?sraNumber=430771'
  };
  var SALUTE = { en: 'Dear partners,', ar: 'شركاءنا الأعزاء،' };
  var SIGN = { en: ['With respect,', 'The Athar team'], ar: ['مع خالص التقدير،', 'فريق أثر'] };
  var P = [
    { id: 'al-ameri', mono: ['FA', 'ف ع'], official: true, /* published letter 2 — no portrait exists, so the monogram roundel is used (no generated face) */
      name: { en: 'Fahad Mohamed Al Ameri', ar: 'فهد محمد العامري' }, /* v1.5.6: label without honorific; the letter body keeps H.E. / سعادة */
      role: { en: 'Executive Director, Development and Humanitarian Affairs, UAE Presidential Court', ar: 'المدير التنفيذي، شؤون التنمية والعمل الإنساني، ديوان الرئاسة في دولة الإمارات' },
      body: {
        en: ['H.E. Fahad Mohamed Al Ameri is Executive Director of Development and Humanitarian Affairs at the UAE Presidential Court.',
             'He helped create Erth Zayed Philanthropies, the UAE International Aid Agency and the International Humanitarian and Philanthropic Council (IHPC). He is General Secretary of the IHPC and Managing Director of the Erth Zayed Fund.'],
        ar: ['سعادة فهد محمد العامري هو المدير التنفيذي للشؤون التنموية والإنسانية في ديوان الرئاسة.',
             'أسهم في تأسيس مؤسسة إرث زايد الإنسانية ووكالة الإمارات للمساعدات الدولية ومجلس الشؤون الإنسانية والدولية. وهو مقرِّر المجلس ومدير صندوق إرث زايد الإنساني.'] },
      facts: {
        en: [['Boards', 'Zayed Charitable and Humanitarian Foundation · Clean Rivers · Zoud Foundation for Financial Literacy'],
             ['Career', 'Abu Dhabi Executive Council 2011–14 · Abu Dhabi Executive Office 2014–18 · Department of Transport 2018–20 · President’s Office 2020–22 · Director of Strategic Affairs from 2022'],
             ['Education', 'MSE Mechanical Engineering and BS Bioengineering (summa cum laude), University of Pennsylvania · CFA charterholder · Emirates Experts Program graduate (NEP 2.0)']],
        ar: [['المجالس', 'مجلس أمناء مؤسسة زايد بن سلطان آل نهيان للأعمال الخيرية والإنسانية · مجلس إدارة مؤسسة الأنهار النظيفة (Clean Rivers) · مجلس إدارة مؤسسة زود للثقافة المالية'],
             ['المسيرة', 'المجلس التنفيذي لإمارة أبوظبي 2011–2014 · المكتب التنفيذي لإمارة أبوظبي 2014–2018 · دائرة النقل 2018–2020 · مكتب رئيس الدولة 2020–2022 · مدير الشؤون الاستراتيجية منذ 2022'],
             ['التعليم', 'ماجستير العلوم في الهندسة الميكانيكية وبكالوريوس العلوم في الهندسة الحيوية (بتقدير امتياز مع مرتبة الشرف الأولى) من جامعة بنسلفانيا · محلل مالي معتمد (CFA) · خريج برنامج خبراء الإمارات (النسخة الثانية)']] },
      src: [['UAE National Experts Program (EN)', S.nepEn], ['برنامج خبراء الإمارات (AR)', S.nepAr],
            [{ en: 'Career timeline and programme status as supplied by Athar, 2 Oct 2026', ar: 'الجدول الزمني للمسيرة وحالة البرنامج كما قدّمها فريق أثر، 2 أكتوبر 2026' }, null]] },
    { id: 'khalid', mono: ['MK', 'م خ'], film: !!FILM,
      name: { en: 'Muhammed Khalid', ar: 'محمد خالد' },
      role: { en: 'Founder & CEO, AIREV', ar: 'المؤسس والرئيس التنفيذي لشركة AIREV' },
      body: {
        en: ['Muhammed Khalid is the founder and CEO of AIREV, the Abu Dhabi company behind School Hack and OnDemand.',
             'School Hack, launched in early 2023, has grown to over 4 million users across 140+ countries. OnDemand, AIREV’s agentic AI operating system, is backed by Core42, a G42 company.'],
        ar: ['محمد خالد هو المؤسس والرئيس التنفيذي لشركة AIREV، الشركة التي تتخذ من أبوظبي مقراً والتي تقف وراء منصتي School Hack وOnDemand.',
             'نمت منصة School Hack، التي أُطلقت مطلع عام 2023، إلى أكثر من 4 ملايين مستخدم في أكثر من 140 دولة. أما OnDemand، نظام التشغيل الوكيلي للذكاء الاصطناعي من AIREV، فتدعمه Core42 التابعة لمجموعة G42.'] },
      src: [['42 Network', S.n42], ['The National, 30 Sep 2024', S.tn]] },
    { id: 'unwalla', mono: ['KU', 'ك أ'], /* no headshot supplied — the monogram roundel stays */
      name: { en: 'Kayaan K. Unwalla', ar: 'كايان ك. أونوالا' },
      role: { en: 'Co-founder & Chief Strategy Officer, AIREV', ar: 'شريك مؤسس ورئيس الاستراتيجية، AIREV' },
      body: {
        en: ['Kayaan K. Unwalla is a co-founder of AIREV and its Chief Strategy Officer, leading strategy, market expansion and ecosystem partnerships.',
             'Before AIREV he was a corporate lawyer in the region: Corporate Partner at Norton Rose Fulbright in Dubai, which he joined as Partner in November 2020, and before that Partner and Head of Corporate (Middle East) at DWF Middle East, appointed in June 2018.',
             'Earlier he spent two years in-house with a US government contractor in Afghanistan, the Middle East and Africa.'],
        ar: ['كايان ك. أونوالا شريك مؤسس في AIREV ورئيس الاستراتيجية فيها، ويقود الاستراتيجية والتوسع في الأسواق وشراكات المنظومة.',
             'وقبل AIREV كان محامياً متخصصاً في قانون الشركات في المنطقة: شريكاً في قسم الشركات لدى Norton Rose Fulbright في دبي، وانضم إليها شريكاً في نوفمبر 2020، وقبل ذلك شريكاً ورئيساً لقسم الشركات (الشرق الأوسط) لدى DWF الشرق الأوسط، بتعيينه في يونيو 2018.',
             'وقبل ذلك قضى عامين مستشاراً قانونياً داخلياً لدى متعاقد حكومي أمريكي في أفغانستان والشرق الأوسط وأفريقيا.'] },
      facts: {
        en: [['Earlier roles', 'Head of Defence & Security, DWF Middle East · legal roles at the US Department of Defense, the UK Ministry of Defence and a NATO prime contractor'],
             ['Practice', 'M&A · joint ventures · commercial and transactional agreements · government contracts · cross-border transactions · regulatory advice'],
             ['Sectors', 'Technology · defence, national security and aerospace · manufacturing · life sciences and healthcare · transport'],
             ['AI and technology', 'Mandates including ProtectedBy.AI · publications listed on his Norton Rose Fulbright profile include AI in financial services and the Global Outer Space Guide (UAE)'],
             ['Education', 'LLB (Hons), University of Warwick, 2006 · B.Comm (Hons), University of Bombay, 2003 · LPC, BPP Law School London, 2007'],
             ['Admission', 'Solicitor, England and Wales (SRA no. 430771)'],
             ['Languages', 'English · Hindi · Gujarati']],
        ar: [['أدوار سابقة', 'رئيس قسم الدفاع والأمن في DWF الشرق الأوسط · مناصب قانونية في وزارة الدفاع الأمريكية ووزارة الدفاع البريطانية ولدى متعاقد رئيسي مع حلف الناتو'],
             ['الممارسة', 'الاندماج والاستحواذ · المشاريع المشتركة · الاتفاقيات التجارية والمعاملاتية · العقود الحكومية · المعاملات العابرة للحدود · الاستشارات التنظيمية'],
             ['القطاعات', 'التكنولوجيا · الدفاع والأمن الوطني والطيران والفضاء · التصنيع · علوم الحياة والرعاية الصحية · النقل'],
             ['الذكاء الاصطناعي والتقنية', 'تكليفات تشمل ProtectedBy.AI · ومن المنشورات المدرجة في ملفه لدى Norton Rose Fulbright: الذكاء الاصطناعي في الخدمات المالية، و«Global Outer Space Guide» (الإمارات)'],
             ['التعليم', 'بكالوريوس القانون (مرتبة الشرف)، جامعة وارويك، 2006 · بكالوريوس التجارة (مرتبة الشرف)، جامعة مومباي، 2003 · دورة الممارسة القانونية (LPC)، كلية BPP للقانون في لندن، 2007'],
             ['التسجيل المهني', 'سوليسيتر (Solicitor) في إنجلترا وويلز (رقم SRA: 430771)'],
             ['اللغات', 'الإنجليزية · الهندية · الغوجاراتية']] },
      src: [['The GPU, Issue #42', S.gpu], ['DWF press release, 27 Jun 2018', S.dwf], ['SRA register, no. 430771', S.sra],
            [{ en: 'Norton Rose Fulbright profile and Nov 2020 announcement (links pending)', ar: 'ملف Norton Rose Fulbright وإعلان نوفمبر 2020 (الروابط قيد التأكيد)' }, null],
            [{ en: 'Former roles confirmed by Athar, 1 Oct 2026', ar: 'الأدوار السابقة مؤكَّدة من فريق أثر، 1 أكتوبر 2026' }, null]] }
  ];
  var HIDDEN = [ /* feature-flagged OFF (FLAGS.pendingCards) — never rendered, counted or narrated while off */
    { id: 'lorenzo', mono: ['L', 'ل'], name: { en: 'Lorenzo', ar: 'لورينزو' }, role: { en: 'Surname and role awaiting confirmation', ar: 'بانتظار تأكيد اسم العائلة والمنصب' }, body: { en: [], ar: [] }, src: [] }
  ];
  if (FLAGS.pendingCards) P = P.concat(HIDDEN);
  var T = {
    en: { chapter: '09', kicker: '09 · Executive Team', title: 'Executive Team', letterOf: 'Letter {i} of {t}', clearance: 'For clearance by office', sources: 'Sources', cardTitle: 'At a glance', cardLabel: 'Profile card',
      lede: 'Three letters of introduction to the people leading Athar. Every statement is sourced; the official’s letter uses published statements only.', mono: 'Monogram roundel — no officially sourced portrait',
      counter: function (n, t) { return 'Slide ' + n + ' of ' + t; }, railTitle: 'Executive Team',
       },
    ar: { chapter: '09', kicker: '09 · الفريق التنفيذي', title: 'الفريق التنفيذي', letterOf: 'الرسالة {i} من {t}', clearance: 'للاعتماد من المكتب', sources: 'المصادر', cardTitle: 'نظرة سريعة', cardLabel: 'بطاقة تعريفية',
      lede: 'ثلاث رسائل تعريف بالقيادات التي تقود أثر. كل معلومة موثّقة بمصدر، ورسالة المسؤول تستند إلى تصريحات منشورة فقط.', mono: 'ختم بالحروف الأولى — لا تتوفر صورة من مصدر رسمي',
      counter: function (n, t) { return 'الشريحة ' + n + ' من ' + t; }, railTitle: 'الفريق التنفيذي',
       }
  };
  if (FILM) { /* optional film feature: strings, the extra letter paragraph and the film flag come from window.AtharExecFilm */
    ['en', 'ar'].forEach(function (lg) { var st = (FILM.strings || {})[lg] || {}; T[lg].film = st.title || ''; T[lg].filmNote = st.note || ''; T[lg].filmAria = st.aria || ''; });
    P.forEach(function (p) { if (p.film && FILM.bodyExtra) { p.body.en.push(FILM.bodyExtra.en); p.body.ar.push(FILM.bodyExtra.ar); } });
  }
  var N = P.length + 1, TOTAL = CLOSING_N + N;
  var IDS = ['s-exec-intro'].concat(P.map(function (p) { return 's-exec-' + p.id; }));
  var x = 0, sections = [], lastLang = null, initialHash = window.location.hash;

  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function realN() { var a = document.querySelector('#root section.slide.is-active:not(.it-slide)'); return a ? parseInt(a.getAttribute('data-n'), 10) : 0; }
  function itActive() { try { return !!(window.AtharImpactTiers && window.AtharImpactTiers.virtualIndex() > 0); } catch (e) { return false; } }
  function setHash(h) { if (window.location.hash !== h) window.history.replaceState(null, '', h); }
  function stop(ev) { if (ev) { ev.preventDefault(); ev.stopImmediatePropagation(); ev.stopPropagation(); } }
  function fill(s, i) { return s.replace('{i}', String(i)).replace('{t}', String(P.length)); }
  function langEl(tag, cls, text, lg) { var e = el(tag, cls, text); e.setAttribute('lang', lg); e.setAttribute('dir', lg === 'ar' ? 'rtl' : 'ltr'); return e; }

  function roundel(p, l) { /* monogram roundel — IBM Plex Serif initials + Arabic initials, Ink hairline ring on Manuscript */
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120'); svg.setAttribute('class', 'ex-roundel-svg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', T[l].mono + ' — ' + p.name[l]);
    [[57, 'ex-roundel-ring'], [50, 'ex-roundel-ring ex-roundel-ring--in']].forEach(function (c) { var e = document.createElementNS(ns, 'circle'); e.setAttribute('cx', '60'); e.setAttribute('cy', '60'); e.setAttribute('r', String(c[0])); e.setAttribute('class', c[1]); svg.appendChild(e); });
    var t1 = document.createElementNS(ns, 'text'); t1.setAttribute('x', '60'); t1.setAttribute('y', '62'); t1.setAttribute('class', 'ex-roundel-lat'); t1.setAttribute('text-anchor', 'middle'); t1.textContent = p.mono[0]; svg.appendChild(t1);
    var t2 = document.createElementNS(ns, 'text'); t2.setAttribute('x', '60'); t2.setAttribute('y', '86'); t2.setAttribute('class', 'ex-roundel-ar'); t2.setAttribute('text-anchor', 'middle'); t2.setAttribute('direction', 'rtl'); t2.textContent = p.mono[1]; svg.appendChild(t2);
    var f = el('figure', 'ex-roundel'); f.setAttribute('data-testid', 'exec-roundel-' + p.id); f.appendChild(svg); return f;
  }
  function portrait(p, l) {
    var f = el('figure', 'ex-portrait'); f.setAttribute('data-testid', 'exec-portrait-' + p.id);
    var im = el('img'); im.src = p.portrait.src; im.width = p.portrait.w; im.height = p.portrait.h; im.alt = p.name[l]; im.decoding = 'async'; im.loading = 'eager'; im.setAttribute('data-no-mirror', 'true'); f.appendChild(im);
    f.appendChild(el('figcaption', 'ex-portrait-cap', p.portrait.credit[l])); return f;
  }
  function header(l, sub) {
    var h = el('header', 's-head');
    var ic = el('span', 'pv-icon'); ic.setAttribute('aria-hidden', 'true'); var im = el('img'); im.src = '/brand/icons/pack/community.png'; im.width = 256; im.height = 256; im.alt = ''; im.decoding = 'async'; ic.appendChild(im); h.appendChild(ic);
    h.appendChild(el('span', 'chapter-n', T[l].chapter));
    var hd = el('div'); hd.appendChild(el('div', 's-kicker', sub ? T[l].kicker + ' · ' + sub : T[l].kicker)); hd.appendChild(el('h2', null, T[l].title)); h.appendChild(hd);
    return h;
  }
  function letterhead(l, i, official) {
    var lh = el('div', 'ex-letterhead');
    var lg = el('img', 'ex-letterhead-logo'); lg.src = LOGO; lg.width = 1200; lg.height = 241; lg.alt = l === 'ar' ? 'أثر | Athar' : 'Athar | أثر'; lg.setAttribute('data-no-mirror', 'true'); lh.appendChild(lg);
    var meta = el('span', 'ex-letterhead-meta'); meta.appendChild(el('span', 'ex-letter-n', i ? fill(T[l].letterOf, i) : T[l].title));
    if (official) { var tag = el('span', 'ex-clearance', T[l].clearance); tag.setAttribute('data-testid', 'clearance-tag'); meta.appendChild(tag); }
    lh.appendChild(meta); return lh;
  }
  function column(p, lg) { /* one language column: name · role · salutation · paragraphs · (quote) · sign-off */
    var c = langEl('div', 'ex-col ex-col--' + lg, null, lg); c.setAttribute('data-testid', 'exec-col-' + lg);
    var nm = el('h3', 'ex-name', p.name[lg]); c.appendChild(nm); c.appendChild(el('p', 'ex-role', p.role[lg]));
    c.appendChild(el('p', 'ex-salute', SALUTE[lg]));
    p.body[lg].forEach(function (t) { c.appendChild(el('p', 'ex-p', t)); });
    if (p.quote) { var q = el('blockquote', 'ex-quote'); q.appendChild(el('p', null, p.quote[lg])); q.appendChild(el('cite', null, p.quote.cite[lg])); c.appendChild(q); }
    var so = el('p', 'ex-signoff'); so.appendChild(el('span', null, SIGN[lg][0])); so.appendChild(el('span', 'ex-signoff-name', SIGN[lg][1])); c.appendChild(so);
    return c;
  }
  function sources(p, l) {
    var f = el('footer', 'ex-sources'); f.appendChild(el('span', 'ex-sources-lbl', T[l].sources + ': '));
    p.src.forEach(function (s, j) { if (j) f.appendChild(document.createTextNode(' · ')); var lbl = typeof s[0] === 'string' ? s[0] : s[0][l]; if (s[1]) { var a = el('a', 'ex-src', lbl); a.href = s[1]; a.target = '_blank'; a.rel = 'noopener noreferrer'; f.appendChild(a); } else f.appendChild(el('span', 'ex-src', lbl)); });
    return f;
  }
  function cardEl(p, l) { /* v1.5.6: the profile card beside the letter — the same facts in both languages, the deck language first */
    var card = el('aside', 'ex-card'); card.setAttribute('data-testid', 'exec-card-' + p.id); card.setAttribute('aria-label', T[l].cardLabel + ' — ' + p.name[l]);
    card.appendChild(p.portrait ? portrait(p, l) : roundel(p, l));
    var cols = el('div', 'ex-card-cols');
    ['en', 'ar'].sort(function (a, b) { return a === l ? -1 : b === l ? 1 : 0; }).forEach(function (lg, j) {
      if (j) { var d = el('span', 'ex-divider'); d.setAttribute('aria-hidden', 'true'); cols.appendChild(d); }
      var c = langEl('div', 'ex-card-col ex-card-col--' + lg, null, lg); c.setAttribute('data-testid', 'exec-card-' + lg); c.appendChild(el('p', 'ex-card-title', T[lg].cardTitle));
      var dl = el('dl', 'ex-facts'); p.facts[lg].forEach(function (f) { var row = el('div', 'ex-fact'); row.appendChild(el('dt', null, f[0])); row.appendChild(el('dd', null, f[1])); dl.appendChild(row); });
      c.appendChild(dl); cols.appendChild(c);
    });
    card.appendChild(cols); return card;
  }
  function filmEl(l) {
    var fig = el('figure', 'ex-film'); fig.setAttribute('data-testid', 'exec-film');
    var v = el('video', 'ex-film-video'); v.setAttribute('controls', ''); v.setAttribute('playsinline', ''); v.setAttribute('preload', 'metadata'); v.setAttribute('data-narration-pause', 'true');
    v.setAttribute('data-in', String(FILM.inPt)); v.setAttribute('data-out', String(FILM.outPt)); v.setAttribute('data-poster-time', '15.5'); v.setAttribute('data-testid', 'exec-film-video'); v.setAttribute('aria-label', T[l].filmAria);
    v.poster = FILM.poster; v.width = FILM.w; v.height = FILM.h; v.setAttribute('data-no-mirror', 'true');
    var so = el('source'); so.src = FILM.mp4 + '#t=' + FILM.inPt + ',' + FILM.outPt; so.type = 'video/mp4'; v.appendChild(so);
    [['en', 'English', FILM.vttEn], ['ar', 'العربية', FILM.vttAr]].forEach(function (t) { var tr = el('track'); tr.kind = 'captions'; tr.srclang = t[0]; tr.label = t[1]; tr.src = t[2]; if (l === 'ar' && t[0] === 'ar') tr.default = true; v.appendChild(tr); });
    v.addEventListener('loadedmetadata', function () { try { for (var i = 0; i < v.textTracks.length; i++) { var tt = v.textTracks[i]; tt.mode = (lang() === 'ar' && tt.language === 'ar') ? 'showing' : 'disabled'; } } catch (e) {} });
    v.addEventListener('play', function () { if (v.currentTime < FILM.inPt || v.currentTime >= FILM.outPt - 0.05) { try { v.currentTime = FILM.inPt; } catch (e) {} } });
    v.addEventListener('timeupdate', function () { if (!v.paused && v.currentTime >= FILM.outPt) { v.pause(); try { v.currentTime = FILM.outPt; } catch (e) {} v.setAttribute('data-ended-at-out', 'true'); v.dispatchEvent(new Event('ended')); } });
    fig.appendChild(v);
    var cap = el('figcaption', 'ex-film-cap'); cap.appendChild(el('span', 'ex-film-title', T[l].film)); cap.appendChild(el('span', 'ex-film-note', T[l].filmNote)); fig.appendChild(cap);
    return fig;
  }
  function renderIntro(l) {
    var body = el('div', 's-body ex-body ex-body--intro'); var rule = el('span', 'trace-rule'); rule.setAttribute('aria-hidden', 'true'); body.appendChild(rule);
    body.appendChild(header(l));
    var art = el('article', 'ex-letter ex-letter--intro'); art.setAttribute('data-testid', 'exec-intro'); art.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr'); art.setAttribute('lang', l);
    art.appendChild(letterhead(l, 0, false));
    var cols = el('div', 'ex-cols');
    ['en', 'ar'].sort(function (a, b) { return a === l ? -1 : b === l ? 1 : 0; }).forEach(function (lg, j) {
      if (j) { var d = el('span', 'ex-divider'); d.setAttribute('aria-hidden', 'true'); cols.appendChild(d); }
      var c = langEl('div', 'ex-col ex-col--' + lg, null, lg); c.appendChild(el('p', 'ex-section-title', T[lg].title)); c.appendChild(el('p', 'ex-p', T[lg].lede));
      var ol = el('ol', 'ex-index'); P.forEach(function (p, i) { var li = el('li', 'ex-index-item'); var b = el('button', 'ex-index-btn'); b.type = 'button'; b.setAttribute('data-exec-go', String(i + 2)); b.appendChild(el('span', 'ex-index-n', String(CLOSING_N + i + 2))); b.appendChild(el('span', 'ex-index-name', p.name[lg])); b.appendChild(el('span', 'ex-index-role', p.role[lg])); b.addEventListener('click', function () { enter(i + 2); }); li.appendChild(b); ol.appendChild(li); });
      c.appendChild(ol); cols.appendChild(c);
    });
    art.appendChild(cols); var hr = el('hr', 'ex-rule'); hr.setAttribute('aria-hidden', 'true'); art.appendChild(hr);
    body.appendChild(art); return body;
  }
  function renderProfile(p, i, l) {
    var body = el('div', 's-body ex-body' + (p.film ? ' ex-body--film' : '')); var rule = el('span', 'trace-rule'); rule.setAttribute('aria-hidden', 'true'); body.appendChild(rule);
    body.appendChild(header(l, fill(T[l].letterOf, i)));
    var grid = el('div', 'ex-grid' + (p.film ? ' ex-grid--film' : '') + (p.facts ? ' ex-grid--card' : ''));
    var art = el('article', 'ex-letter'); art.setAttribute('data-testid', 'exec-letter-' + p.id); art.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr'); art.setAttribute('lang', l); art.setAttribute('aria-label', p.name[l]);
    if (p.official) art.setAttribute('data-clearance', 'for clearance by office');
    art.appendChild(letterhead(l, i, !!p.official));
    var top = el('div', 'ex-top'); if (!p.facts) top.appendChild(p.portrait ? portrait(p, l) : roundel(p, l)); /* v1.5.6: card profiles carry their monogram roundel on the card */
    var cols = el('div', 'ex-cols');
    ['en', 'ar'].sort(function (a, b) { return a === l ? -1 : b === l ? 1 : 0; }).forEach(function (lg, j) { if (j) { var d = el('span', 'ex-divider'); d.setAttribute('aria-hidden', 'true'); cols.appendChild(d); } cols.appendChild(column(p, lg)); });
    top.appendChild(cols); art.appendChild(top);
    var hr = el('hr', 'ex-rule'); hr.setAttribute('aria-hidden', 'true'); art.appendChild(hr);
    art.appendChild(sources(p, l));
    grid.appendChild(art); if (p.film) grid.appendChild(filmEl(l)); if (p.facts) grid.appendChild(cardEl(p, l));
    body.appendChild(grid); return body;
  }
  function renderSlide(k, l) { return k === 1 ? renderIntro(l) : renderProfile(P[k - 2], k - 1, l); }
  function titleFor(k, l) { return k === 1 ? T[l].title : T[l].title + ' — ' + P[k - 2].name[l]; }

  function ensure() {
    var closing = document.getElementById('s-closing'); if (!closing || !closing.parentNode) return false;
    if (sections.length && sections[0].isConnected && sections[0].parentNode === closing.parentNode) {
      var after = closing; for (var j = 0; j < sections.length; j++) { if (after.nextSibling !== sections[j]) closing.parentNode.insertBefore(sections[j], after.nextSibling); after = sections[j]; }
      return true;
    }
    sections.forEach(function (s) { if (s.parentNode) s.parentNode.removeChild(s); }); sections = [];
    var l = lang(), anchor = closing;
    for (var k = 1; k <= N; k++) {
      var sec = el('section', 'slide text is-after it-slide ex-slide ex-slide--' + (k === 1 ? 'intro' : P[k - 2].id));
      sec.id = IDS[k - 1]; sec.setAttribute('data-n', String(CLOSING_N + k)); sec.setAttribute('data-slide-id', IDS[k - 1]); sec.setAttribute('data-exec-index', String(k)); sec.setAttribute('aria-hidden', 'true'); sec.setAttribute('aria-label', titleFor(k, l)); sec.setAttribute('data-v155', 'executive-team');
      var bg = el('div', 'slide-bg slide-bg--pattern'); bg.setAttribute('aria-hidden', 'true'); bg.appendChild(el('div', 'pattern-band')); sec.appendChild(bg);
      sec.appendChild(renderSlide(k, l));
      anchor.parentNode.insertBefore(sec, anchor.nextSibling); anchor = sec; sections.push(sec);
    }
    lastLang = l;
    if (x) show(x);
    return true;
  }
  function relabel() {
    var l = lang();
    sections.forEach(function (sec, i) { var old = sec.querySelector(':scope > .s-body'); if (old) { var vids = old.querySelectorAll('video'); for (var q = 0; q < vids.length; q++) { try { vids[q].pause(); } catch (e) {} } old.remove(); } sec.setAttribute('aria-label', titleFor(i + 1, l)); sec.appendChild(renderSlide(i + 1, l)); });
    lastLang = l;
  }
  function pauseFilms(except) { sections.forEach(function (sec) { if (sec === except) return; var vids = sec.querySelectorAll('video'); for (var q = 0; q < vids.length; q++) { if (!vids[q].paused) { try { vids[q].pause(); } catch (e) {} } } }); }
  function show(k) {
    x = k;
    document.body.classList.toggle('ex-virtual', k > 0);
    if (k > 0) document.body.classList.add('it-virtual'); else if (!itActive()) document.body.classList.remove('it-virtual');
    sections.forEach(function (sec, i) { var idx = i + 1, cls = idx === k ? 'is-active' : idx < k ? 'is-before' : 'is-after'; sec.classList.remove('is-active', 'is-before', 'is-after'); sec.classList.add(cls); sec.setAttribute('aria-hidden', idx === k ? 'false' : 'true'); });
    pauseFilms(k ? sections[k - 1] : null);
    if (k > 0) setHash('#/' + REAL_LAST + '/exec-' + k);
    sync();
  }
  function enter(k) { if (!ensure()) return; if (realN() !== REAL_LAST) { goto(k); return; } show(Math.max(1, Math.min(N, k))); }
  function exit(keepHash) { if (!x) return; show(0); if (!keepHash) setHash('#/' + REAL_LAST); }
  function goto(k) {
    if (realN() !== REAL_LAST) { setHash('#/' + REAL_LAST); window.dispatchEvent(new HashChangeEvent('hashchange')); var tries = 0, iv = window.setInterval(function () { tries++; if (realN() === REAL_LAST && ensure()) { window.clearInterval(iv); show(Math.max(1, Math.min(N, k))); } else if (tries > 200) window.clearInterval(iv); }, 25); return; }
    if (ensure()) show(Math.max(1, Math.min(N, k)));
  }

  /* ---------- footer counter · next chevron · rail 09 · Esc-overview tiles ---------- */
  function updateCounter() {
    if (!x) return; var c = document.querySelector('footer.pagefooter .counter'); if (!c) return;
    var txt = T[lang()].counter(CLOSING_N + x, TOTAL); if (c.textContent !== txt) c.textContent = txt;
  }
  function syncArrows() {
    var nx = document.querySelector('button.arrow.next'); if (!nx) return;
    var onLast = realN() === REAL_LAST && !itActive();
    if (onLast && x < N) { if (nx.disabled) { nx.disabled = false; nx.setAttribute('data-exec-enabled', 'true'); } }
    else if (onLast && x === N) { if (!nx.disabled) nx.disabled = true; }
  }
  function syncRail() {
    var ol = document.querySelector('nav.rail ol'); if (!ol) return; var l = lang();
    var li = ol.querySelector('li[data-exec-chapter]');
    if (!li || li.getAttribute('data-lang') !== l || li !== ol.lastElementChild) {
      if (li) li.remove(); li = el('li'); li.setAttribute('data-exec-chapter', '09'); li.setAttribute('data-lang', l);
      var a = el('a'); a.href = '#/' + REAL_LAST + '/exec-1'; a.setAttribute('data-chapter', 'executive-team');
      a.addEventListener('click', function (ev) { ev.preventDefault(); goto(1); });
      a.appendChild(el('span', 'rail-n', '09')); a.appendChild(el('span', null, T[l].railTitle)); li.appendChild(a); ol.appendChild(li);
    }
    li.classList.toggle('is-current', x > 0);
    if (x > 0) Array.prototype.forEach.call(ol.children, function (o) { if (o !== li) o.classList.remove('is-current'); });
  }
  function syncOverview() {
    var grid = document.querySelector('.overview .overview-grid'); if (!grid) return;
    var real = grid.querySelectorAll('button.ov-card:not([data-virtual]):not([data-exec])'); if (real.length !== REAL_LAST) return;
    var closingCard = real[REAL_LAST - 1], l = lang();
    var mine = grid.querySelectorAll('button.ov-card[data-exec]');
    if (mine.length !== N || (mine[0] && mine[0].getAttribute('data-lang') !== l) || (mine[0] && mine[0].previousElementSibling !== closingCard)) {
      Array.prototype.forEach.call(mine, function (b) { b.remove(); });
      var after = closingCard;
      for (var k = 1; k <= N; k++) (function (k) {
        var b = el('button', 'ov-card'); b.type = 'button'; b.setAttribute('data-exec', String(k)); b.setAttribute('data-lang', l);
        b.appendChild(el('span', 'ov-n', String(CLOSING_N + k))); b.appendChild(document.createTextNode(k === 1 ? T[l].title : P[k - 2].name[l]));
        b.addEventListener('click', function () { var close = document.querySelector('.overview button.ctl-btn'); if (close) close.click(); window.setTimeout(function () { goto(k); }, 0); });
        after.parentNode.insertBefore(b, after.nextSibling); after = b;
      })(k);
    }
    Array.prototype.forEach.call(grid.querySelectorAll('button.ov-card[data-exec]'), function (b) { b.classList.toggle('on', parseInt(b.getAttribute('data-exec'), 10) === x); });
    if (x) Array.prototype.forEach.call(grid.querySelectorAll('button.ov-card:not([data-exec])'), function (b) { b.classList.remove('on'); });
  }
  function sync() { updateCounter(); syncArrows(); syncRail(); syncOverview(); }

  /* ---------- navigation interception (capture phase; registered before impact-tiers.js and the bundle) ---------- */
  function isNextKey(k, rtl) { return k === (rtl ? 'ArrowLeft' : 'ArrowRight') || k === 'PageDown' || k === ' ' || k === 'Spacebar'; }
  function isPrevKey(k, rtl) { return k === (rtl ? 'ArrowRight' : 'ArrowLeft') || k === 'PageUp' || k === 'Backspace'; }
  window.addEventListener('keydown', function (ev) {
    var tg = ev.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
    if (tg && tg.closest && tg.closest('[data-keys="own"]')) return;
    if (tg && tg.tagName === 'VIDEO' && (ev.key === ' ' || ev.key === 'Spacebar' || ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) return; /* the film's own controls */
    if (document.querySelector('.overview')) return;
    var rtl = document.documentElement.dir === 'rtl', k = ev.key;
    if (x > 0) {
      if (isNextKey(k, rtl)) { if (x < N) enter(x + 1); stop(ev); }
      else if (isPrevKey(k, rtl)) { if (x > 1) enter(x - 1); else exit(); stop(ev); }
      else if (k === 'Home' || k === 'End') { exit(true); if (k === 'End') stop(ev); }
      return;
    }
    if (isNextKey(k, rtl) && realN() === REAL_LAST && !itActive() && ensure()) { enter(1); stop(ev); }
  }, true);
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('button.arrow') : null; if (!t) return;
    if (t.classList.contains('next')) { if (x > 0) { if (x < N) enter(x + 1); stop(ev); } else if (realN() === REAL_LAST && !itActive() && ensure()) { enter(1); stop(ev); } }
    else if (t.classList.contains('prev')) { if (x > 0) { if (x > 1) enter(x - 1); else exit(); stop(ev); } }
  }, true);
  window.addEventListener('hashchange', function () {
    var m = /^#\/28\/exec-(\d+)$/.exec(window.location.hash);
    if (m) { var k = parseInt(m[1], 10); if (k !== x) goto(k); }
    else if (x > 0) exit(true);
  });

  /* ---------- observers + deep link (#/28/exec-k survives the bundle's boot-time hash normalisation, like #/27/new-k) ---------- */
  var root = document.getElementById('root'), pending = false;
  var m0 = /^#\/28\/exec-(\d+)$/.exec(initialHash), pendingDeep = m0 ? parseInt(m0[1], 10) : 0, deepStable = 0;
  function tryDeep() {
    if (!pendingDeep) return; var h = window.location.hash;
    if (h !== initialHash && h !== '#/' + REAL_LAST) { pendingDeep = 0; return; }
    if (x === pendingDeep) { if (++deepStable > 4) pendingDeep = 0; return; }
    deepStable = 0; if (ensure() && realN() === REAL_LAST) show(Math.max(1, Math.min(N, pendingDeep)));
  }
  function tick() {
    pending = false; if (!ensure()) return; tryDeep();
    var l = lang(); if (lastLang !== null && lastLang !== l) relabel();
    var rn = realN(); if (x && rn && rn !== REAL_LAST) exit(true);
    if (x && window.location.hash === '#/' + REAL_LAST && !pendingDeep) setHash('#/' + REAL_LAST + '/exec-' + x);
    sync();
  }
  function schedule() { if (pending) return; pending = true; window.requestAnimationFrame(function () { try { tick(); } catch (e) { /* keep the deck alive */ } }); }
  if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled'] });
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
  if (m0) { var tries = 0, iv = window.setInterval(function () { tries++; tryDeep(); if (!pendingDeep || tries > 2400) window.clearInterval(iv); }, 25); }
  if (!root) document.addEventListener('DOMContentLoaded', function () { root = document.getElementById('root'); if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled'] }); schedule(); });
  schedule();

  window.AtharExecTeam = { version: VERSION, count: N, first: CLOSING_N + 1, total: TOTAL, ids: IDS.slice(), profiles: P.map(function (p) { return { id: 's-exec-' + p.id, name: p.name, portrait: !!p.portrait, seal: !p.portrait, film: !!p.film, pending: !!p.pending }; }),
    active: function () { return x > 0; }, index: function () { return x; }, current: function () { return x ? CLOSING_N + x : 0; }, go: function (k) { goto(k); }, exit: function () { exit(); } };
})();
