/* Athar Open Agentic Pact deck — v1.5.5 (2026-10-01) — section 09 "Executive Team" / «الفريق التنفيذي».
   Appended AFTER the current final slide (#s-closing, slide 39) as seven runtime slides 40–46, deep links #/28/exec-1 … #/28/exec-7
   (also #slide-40 … #slide-46 via the index.html alias). One intro slide + six profiles, each set as a letter on Manuscript paper
   (#F7F3EA, procedural fibre texture), Athar Ink #0F1E2C text, ONE Legacy Gold #B8975A hairline rule, a signature line, IBM Plex
   Serif (Latin headings) · IBM Plex Sans (body/UI) · IBM Plex Sans Arabic (Arabic), Arabic-first bilingual name lockups, full RTL
   (dir=rtl, lang=ar) in Arabic. Portraits ONLY where a canonical official image is verified (Dr Thani — supplied official headshot,
   cross-checked against 4 independent published photographs; Fahad Al Ameri — official UAE National Experts Program page); every
   other profile carries a monogram seal. No AI likenesses. Every statement below is sourced (sources printed on each letter).
   'Ary' = H.E. Saif Sultan Al Aryani, Advisor at the Presidential Court — a distinct person from H.E. Fahad Al Ameri (not merged).
   Lorenzo: no verifiable surname/role in workspace or session data — nothing invented; confirmation requested from Athar.
   Navigation mirrors dist/js/impact-tiers.js: the bundle's last slide (real 28) stays mounted underneath (hidden by body.it-virtual),
   next/prev/keys are intercepted in the capture phase (this file loads BEFORE impact-tiers.js), the bundle's disabled "next" chevron
   is re-enabled on slide 39, footer counter "n of 46", rail entry 09, Esc-overview tiles 40–46, language re-render. */
(function () {
  'use strict';
  var VERSION = 'v1.5.5';
  var REAL_LAST = 28, CLOSING_N = 39;
  var FILM = { mp4: '/assets/exec/video/athar-origins-of-impact-ep01-muhammed-khalid-720p.mp4', poster: '/assets/exec/video/athar-origins-of-impact-ep01-poster.jpg',
    vttEn: '/assets/exec/video/athar-origins-of-impact-ep01.en.vtt', vttAr: '/assets/exec/video/athar-origins-of-impact-ep01.ar.vtt', inPt: 0, outPt: 39.4, w: 1280, h: 720 };
  var LOGO = '/assets/exec/athar-logo-master-1200.png';
  var S = {
    gn: 'https://gulfnews.com/uae/government/uae-president-appoints-saif-al-aryani-as-advisor-at-presidential-court-1.1673240213399',
    ey: 'https://www.emaratalyoum.com/local-section/other/2023-01-09-1.1706450',
    nepEn: 'https://uaenep.ae/en/participant/fahad-al-ameri', nepAr: 'https://uaenep.ae/ar/participant/fahad-al-ameri',
    acf: 'https://www.theafricaceoforum.com/forum-2026/en/intervenant/h-e-dr-thani-bin-ahmed-al-zeyoudi/',
    salt: 'https://www.salt.org/speakers/h-e-dr-thani-bin-ahmed-al-zeyoudi',
    gnQc: 'https://gulfnews.com/business/corporate-news/airev-and-qualcomm-to-advance-autonomous-ai-across-enterprise-and-government-environments-1.500639938',
    ta: 'https://techafricanews.com/2026/07/22/airev-partners-with-redington-to-expand-uae-built-agentic-ai-across-gcc-and-africa/',
    n42: 'https://www.42network.org/blog/whos-behind-42-muhammed-khaled-founder-ceo-of-airev/',
    tn: 'https://www.thenationalnews.com/future/technology/2024/09/30/core42-airev-generative-ai/',
    gnIntel: 'https://gulfnews.com/business/corporate-news/intel-and-airev-partner-to-propel-ai-innovation-across-middle-east-and-globally-1.500306686',
    gpu: 'https://thegpu.ai/p/issue-42-building-real-world-ai-deployment-layer-airev',
    meai: 'https://www.middleeastainews.com/p/venturewave-invests-in-airev'
  };
  var P = [
    { id: 'al-zeyoudi', seal: ['T', 'ث'], portrait: { src: '/assets/exec/portraits/thani-al-zeyoudi-official.jpg', w: 417, h: 626,
        credit: { en: 'Official headshot · identity cross-checked against four independent published photographs', ar: 'صورة رسمية · طُوبقت الهوية مع أربع صور منشورة مستقلة' } },
      name: { en: 'H.E. Dr Thani bin Ahmed Al Zeyoudi', ar: 'معالي الدكتور ثاني بن أحمد الزيودي' },
      role: { en: 'UAE Minister of Foreign Trade · Chairman of AIREV', ar: 'وزير التجارة الخارجية في دولة الإمارات · رئيس مجلس إدارة AIREV' },
      body: {
        en: ['H.E. Dr Thani bin Ahmed Al Zeyoudi was appointed the UAE’s Minister of State for Foreign Trade in July 2020, and has served as Minister of Foreign Trade since June 2025.',
             'He leads the UAE’s programme of Comprehensive Economic Partnership Agreements (CEPAs) — the first concluded with India in May 2022 — and chaired the 13th WTO Ministerial Conference (MC13) in Abu Dhabi in February 2024.',
             'He is Chairman of AIREV, the Abu Dhabi company behind the OnDemand platform.'],
        ar: ['عُيّن معالي الدكتور ثاني بن أحمد الزيودي وزيرَ دولة للتجارة الخارجية في دولة الإمارات في يوليو 2020، ويشغل منصب وزير التجارة الخارجية منذ يونيو 2025.',
             'يقود برنامج اتفاقيات الشراكة الاقتصادية الشاملة (CEPA) لدولة الإمارات — وقد أُبرمت أولاها مع الهند في مايو 2022 — وترأس المؤتمر الوزاري الثالث عشر لمنظمة التجارة العالمية (MC13) في أبوظبي في فبراير 2024.',
             'وهو رئيس مجلس إدارة AIREV، الشركة التي تتخذ من أبوظبي مقراً والتي تقف وراء منصة OnDemand.'] },
      src: [['The Africa CEO Forum 2026 — speaker profile', S.acf], ['SALT — speaker profile', S.salt], ['Gulf News, 13 Aug 2026', S.gnQc], ['TechAfrica News, 22 Jul 2026', S.ta]] },
    { id: 'al-ameri', seal: ['F', 'ف'], portrait: { src: '/assets/exec/portraits/fahad-al-ameri-uaenep.jpg', w: 376, h: 316,
        credit: { en: 'Official portrait · UAE National Experts Program (uaenep.ae)', ar: 'صورة رسمية · برنامج خبراء الإمارات (uaenep.ae)' } },
      name: { en: 'H.E. Fahad Al Ameri', ar: 'سعادة فهد محمد العامري' },
      role: { en: 'Executive Director, Development and Humanitarian Affairs — UAE Presidential Court', ar: 'المدير التنفيذي، شؤون التنمية والعمل الإنساني — ديوان الرئاسة في دولة الإمارات' },
      body: {
        en: ['As Executive Director of Development and Humanitarian Affairs at the Presidential Court, H.E. Fahad Al Ameri is among the leaders shaping the UAE’s global humanitarian and development agenda.',
             'He played a defining role in creating Erth Zayed Philanthropies, the UAE International Aid Agency and the International Humanitarian and Philanthropic Council (IHPC), where he serves as General Secretary; he is also a Board Member of the Zayed Charitable and Humanitarian Foundation.',
             'He previously held senior positions in the Abu Dhabi Crown Prince Court, the Department of Transport and the General Secretariat of the Executive Council.'],
        ar: ['بصفته المدير التنفيذي للشؤون التنموية والإنسانية في ديوان الرئاسة، يُعدّ سعادة فهد العامري من القيادات التي تسهم في صياغة وتوجيه أجندة دولة الإمارات في مجالي التنمية والعمل الإنساني.',
             'أدّى دوراً محورياً في تأسيس مؤسسة إرث زايد الإنسانية ووكالة الإمارات للمساعدات الدولية ومجلس الشؤون الإنسانية والدولية، ويشغل منصب مقرِّر المجلس، كما أنه عضو مجلس أمناء مؤسسة زايد بن سلطان آل نهيان للأعمال الخيرية والإنسانية.',
             'وشغل قبل منصبه الحالي مناصب قيادية في ديوان ولي عهد أبوظبي ودائرة النقل والأمانة العامة للمجلس التنفيذي.'] },
      src: [['UAE National Experts Program — profile (EN)', S.nepEn], ['برنامج خبراء الإمارات — الملف (AR)', S.nepAr]] },
    { id: 'al-aryani', seal: ['S', 'س'],
      name: { en: 'H.E. Saif Sultan Al Aryani', ar: 'معالي سيف سلطان العرياني' },
      role: { en: 'Advisor at the UAE Presidential Court, with the rank of Minister', ar: 'مستشار في ديوان الرئاسة بدرجة وزير' },
      body: {
        en: ['On 9 January 2023, President His Highness Sheikh Mohamed bin Zayed Al Nahyan issued a Federal Decree appointing H.E. Saif Sultan Al Aryani as Advisor at the Presidential Court, with the rank of Minister.',
             'The decree took effect on the date of issuance and was published in the Official Gazette.'],
        ar: ['في 9 يناير 2023، أصدر صاحب السمو الشيخ محمد بن زايد آل نهيان، رئيس الدولة، مرسوماً اتحادياً بتعيين معالي سيف سلطان العرياني مستشاراً في ديوان الرئاسة بدرجة وزير.',
             'ويُعمل بالمرسوم من تاريخ صدوره، ويُنشر في الجريدة الرسمية.'] },
      src: [['Gulf News (WAM), 9 Jan 2023', S.gn], ['الإمارات اليوم، 9 يناير 2023', S.ey]] },
    { id: 'khalid', seal: ['M', 'م'], film: true,
      name: { en: 'Muhammed Khalid', ar: 'محمد خالد' },
      role: { en: 'Founder & CEO, AIREV · Creator of OnDemand', ar: 'المؤسس والرئيس التنفيذي لشركة AIREV · مبتكر منصة OnDemand' },
      body: {
        en: ['Muhammed Khalid is the founder and CEO of AIREV, the Abu Dhabi-based AI company behind School Hack and OnDemand — platforms used by millions worldwide.',
             'AIREV, which he co-founded in September 2023, launched OnDemand in July 2024 with backing from Core42, a unit of G42, and has since signed partnerships with Intel (October 2025) and Qualcomm (August 2026) and an agreement with Redington (July 2026).',
             'His impact story — from his first five years in Sierra Leone to building in the UAE — plays alongside this letter.'],
        ar: ['محمد خالد هو المؤسس والرئيس التنفيذي لشركة AIREV، شركة الذكاء الاصطناعي التي تتخذ من أبوظبي مقراً والتي تقف وراء منصتي School Hack وOnDemand اللتين يستخدمهما الملايين حول العالم.',
             'شارك في تأسيس AIREV في سبتمبر 2023، وأطلقت الشركة منصة OnDemand في يوليو 2024 بدعم من Core42 التابعة لمجموعة G42، ثم وقّعت شراكات مع Intel (أكتوبر 2025) وQualcomm (أغسطس 2026) واتفاقية مع Redington (يوليو 2026).',
             'وتُعرض قصة أثره — من سنواته الخمس الأولى في سيراليون إلى البناء في الإمارات — إلى جانب هذه الرسالة.'] },
      src: [['42 Network, 2026', S.n42], ['The National, 30 Sep 2024', S.tn], ['Middle East AI News, 15 Apr 2025', S.meai], ['Gulf News, 14 Oct 2025', S.gnIntel], ['Gulf News, 13 Aug 2026', S.gnQc], ['TechAfrica News, 22 Jul 2026', S.ta]] },
    { id: 'unwalla', seal: ['K', 'ك'],
      name: { en: 'Kayaan Unwalla', ar: 'كايان أونوالا' },
      role: { en: 'Co-founder & Chief Strategy Officer, AIREV', ar: 'شريك مؤسس ورئيس الاستراتيجية في AIREV' },
      body: {
        en: ['Kayaan Unwalla is a co-founder of AIREV and its Chief Strategy Officer, leading strategy, market expansion and ecosystem partnerships for the OnDemand platform.',
             'He co-founded AIREV in September 2023 with Muhammed Khalid and Dr Youssef Youssef — the team that created School Hack.',
             'In April 2025, Ireland’s VentureWave Capital invested in AIREV as part of its Series A round, to support the global growth of OnDemand.'],
        ar: ['كايان أونوالا شريك مؤسس في AIREV ورئيس الاستراتيجية فيها، ويقود الاستراتيجية والتوسع في الأسواق وشراكات المنظومة لمنصة OnDemand.',
             'شارك في تأسيس AIREV في سبتمبر 2023 مع محمد خالد والدكتور يوسف يوسف — الفريق الذي طوّر منصة School Hack.',
             'وفي أبريل 2025، استثمرت شركة VentureWave Capital الأيرلندية في AIREV ضمن جولة التمويل من الفئة A، لدعم النمو العالمي لمنصة OnDemand.'] },
      src: [['The GPU, Issue #42', S.gpu], ['The National, 30 Sep 2024', S.tn], ['Middle East AI News, 15 Apr 2025', S.meai]] },
    { id: 'lorenzo', seal: ['L', 'ل'], pending: true,
      name: { en: 'Lorenzo', ar: 'لورينزو' },
      role: { en: 'Athar Executive Team · surname and role awaiting confirmation', ar: 'الفريق التنفيذي لأثر · بانتظار تأكيد اسم العائلة والمنصب' },
      body: {
        en: ['Lorenzo is a member of the Athar Executive Team.',
             'His surname and role have not yet been confirmed from a verifiable source, so this letter states nothing further until Athar confirms them.'],
        ar: ['لورينزو عضو في الفريق التنفيذي لأثر.',
             'لم يُؤكَّد اسم عائلته ومنصبه بعد من مصدر يمكن التحقق منه، لذا لا تتضمن هذه الرسالة أي تفاصيل إضافية إلى حين تأكيدها من فريق أثر.'] },
      src: [['Athar Executive Team roster (supplied by Athar, 1 Oct 2026)', null]] }
  ];
  var T = {
    en: { chapter: '09', kicker: '09 · Executive Team', title: 'Executive Team', titleAr: 'الفريق التنفيذي', letterOf: 'Letter {i} of {t}', introducing: 'Introducing',
      lede: 'Six letters of introduction — one for each member of the Executive Team carrying the Athar Pact forward. Every statement is sourced; portraits appear only where a canonical image from an official source is verified, and a monogram seal stands in everywhere else.',
      sign: 'Athar Executive Team', sources: 'Sources', seal: 'Monogram seal — no verified official portrait', counter: function (n, t) { return 'Slide ' + n + ' of ' + t; },
      film: 'Athar — Origins of Impact, Episode 01: Muhammed Khalid (40 s)', filmNote: 'Poster: the episode’s end card · Captions: English (burned in, plus WebVTT) · Arabic (WebVTT) · plays 0:00–0:39.4 · the narrated guide pauses while the film plays and resumes after it.',
      filmAria: 'Impact story film: Athar — Origins of Impact, Episode 01, Muhammed Khalid', railTitle: 'Executive Team', pendingNote: 'Confirmation requested' },
    ar: { chapter: '09', kicker: '09 · الفريق التنفيذي', title: 'الفريق التنفيذي', titleAr: 'الفريق التنفيذي', letterOf: 'الرسالة {i} من {t}', introducing: 'نقدّم إليكم',
      lede: 'ست رسائل تعريف — رسالة لكل عضو في الفريق التنفيذي الذي يمضي بميثاق أثر قُدُماً. كل معلومة موثّقة بمصدر، ولا تظهر الصور الشخصية إلا حيث تم التحقق من صورة معتمدة من مصدر رسمي، ويحلّ محلها ختم بالحرف الأول في ما عدا ذلك.',
      sign: 'الفريق التنفيذي لأثر', sources: 'المصادر', seal: 'ختم بالحرف الأول — لا تتوفر صورة رسمية موثّقة', counter: function (n, t) { return 'الشريحة ' + n + ' من ' + t; },
      film: 'أثر — أصول الأثر، الحلقة 01: محمد خالد (40 ثانية)', filmNote: 'صورة الغلاف: البطاقة الختامية للحلقة · الترجمة: الإنجليزية (مدمجة في الفيديو ومسار WebVTT) · العربية (WebVTT) · يُعرض من 0:00 إلى 0:39.4 · يتوقف الدليل الصوتي أثناء عرض الفيلم ويستأنف بعده.',
      filmAria: 'فيلم قصة الأثر: أثر — أصول الأثر، الحلقة 01، محمد خالد', railTitle: 'الفريق التنفيذي', pendingNote: 'طُلب التأكيد' }
  };
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

  function sealSvg(p, l) {
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120'); svg.setAttribute('class', 'ex-seal-svg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', T[l].seal);
    function c(r, cls) { var e = document.createElementNS(ns, 'circle'); e.setAttribute('cx', '60'); e.setAttribute('cy', '60'); e.setAttribute('r', String(r)); e.setAttribute('class', cls); svg.appendChild(e); }
    c(57, 'ex-seal-ring'); c(50, 'ex-seal-ring ex-seal-ring--in');
    var t1 = document.createElementNS(ns, 'text'); t1.setAttribute('x', '60'); t1.setAttribute('y', '58'); t1.setAttribute('class', 'ex-seal-ar'); t1.setAttribute('text-anchor', 'middle'); t1.textContent = p.seal[1]; svg.appendChild(t1);
    var t2 = document.createElementNS(ns, 'text'); t2.setAttribute('x', '60'); t2.setAttribute('y', '88'); t2.setAttribute('class', 'ex-seal-lat'); t2.setAttribute('text-anchor', 'middle'); t2.textContent = p.seal[0]; svg.appendChild(t2);
    return svg;
  }
  function lockup(nameObj, l) { /* Arabic-first bilingual name lockup: Arabic line always first; the deck language carries the <h2> */
    var w = el('div', 'ex-lockup');
    if (l === 'ar') { var h = el('h2', 'ex-lock-ar ex-lock-title', nameObj.ar); h.setAttribute('lang', 'ar'); h.setAttribute('dir', 'rtl'); var p = el('p', 'ex-lock-en', nameObj.en); p.setAttribute('lang', 'en'); p.setAttribute('dir', 'ltr'); w.appendChild(h); w.appendChild(p); }
    else { var pa = el('p', 'ex-lock-ar', nameObj.ar); pa.setAttribute('lang', 'ar'); pa.setAttribute('dir', 'rtl'); var h2 = el('h2', 'ex-lock-en ex-lock-title', nameObj.en); h2.setAttribute('lang', 'en'); h2.setAttribute('dir', 'ltr'); w.appendChild(pa); w.appendChild(h2); }
    return w;
  }
  function header(l, sub) {
    var h = el('header', 's-head');
    var ic = el('span', 'pv-icon'); ic.setAttribute('aria-hidden', 'true'); var im = el('img'); im.src = '/brand/icons/pack/community.png'; im.width = 256; im.height = 256; im.alt = ''; im.decoding = 'async'; ic.appendChild(im); h.appendChild(ic);
    h.appendChild(el('span', 'chapter-n', T[l].chapter));
    var hd = el('div'); hd.appendChild(el('div', 's-kicker', sub ? T[l].kicker + ' · ' + sub : T[l].kicker)); var h2 = el('h2', null, T[l].title); hd.appendChild(h2); h.appendChild(hd);
    return h;
  }
  function letterhead(l, i) {
    var lh = el('div', 'ex-letterhead');
    var lg = el('img', 'ex-letterhead-logo'); lg.src = LOGO; lg.width = 1200; lg.height = 241; lg.alt = l === 'ar' ? 'أثر | Athar' : 'Athar | أثر'; lg.setAttribute('data-no-mirror', 'true'); lh.appendChild(lg);
    lh.appendChild(el('span', 'ex-letterhead-meta', i ? fill(T[l].letterOf, i) : T[l].title));
    return lh;
  }
  function sources(p, l) {
    var f = el('footer', 'ex-sources'); f.appendChild(el('span', 'ex-sources-lbl', T[l].sources + ': '));
    p.src.forEach(function (s, j) {
      if (j) f.appendChild(document.createTextNode(' · '));
      if (s[1]) { var a = el('a', 'ex-src', s[0]); a.href = s[1]; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('lang', /[\u0600-\u06FF]/.test(s[0]) ? 'ar' : 'en'); f.appendChild(a); }
      else f.appendChild(el('span', 'ex-src', s[0]));
    });
    return f;
  }
  function filmEl(l) {
    var fig = el('figure', 'ex-film'); fig.setAttribute('data-testid', 'exec-film'); fig.setAttribute('data-provenance', 'athar-origins-of-impact-ep01-muhammed-khalid_1080p_subtitled.mp4 (uploaded 2026-10-01T08:14:32Z — latest version in the session file directory)');
    var v = el('video', 'ex-film-video'); v.setAttribute('controls', ''); v.setAttribute('playsinline', ''); v.setAttribute('preload', 'metadata'); v.setAttribute('data-narration-pause', 'true');
    v.setAttribute('data-in', String(FILM.inPt)); v.setAttribute('data-out', String(FILM.outPt)); v.setAttribute('data-testid', 'exec-film-video'); v.setAttribute('aria-label', T[l].filmAria);
    v.poster = FILM.poster; v.width = FILM.w; v.height = FILM.h; v.setAttribute('data-no-mirror', 'true');
    var so = el('source'); so.src = FILM.mp4 + '#t=' + FILM.inPt + ',' + FILM.outPt; so.type = 'video/mp4'; v.appendChild(so);
    [['en', 'English', FILM.vttEn], ['ar', 'العربية', FILM.vttAr]].forEach(function (t) { var tr = el('track'); tr.kind = 'captions'; tr.srclang = t[0]; tr.label = t[1]; tr.src = t[2]; if (l === 'ar' && t[0] === 'ar') tr.default = true; v.appendChild(tr); });
    function capMode() { try { for (var i = 0; i < v.textTracks.length; i++) { var tt = v.textTracks[i]; tt.mode = (lang() === 'ar' && tt.language === 'ar') ? 'showing' : 'disabled'; } } catch (e) {} }
    v.addEventListener('loadedmetadata', capMode);
    v.addEventListener('play', function () { if (v.currentTime < FILM.inPt || v.currentTime >= FILM.outPt - 0.05) { try { v.currentTime = FILM.inPt; } catch (e) {} } });
    v.addEventListener('timeupdate', function () { if (!v.paused && v.currentTime >= FILM.outPt) { v.pause(); try { v.currentTime = FILM.outPt; } catch (e) {} v.setAttribute('data-ended-at-out', 'true'); v.dispatchEvent(new Event('ended')); } });
    fig.appendChild(v);
    var cap = el('figcaption', 'ex-film-cap'); cap.appendChild(el('span', 'ex-film-title', T[l].film)); cap.appendChild(el('span', 'ex-film-note', T[l].filmNote)); fig.appendChild(cap);
    return fig;
  }
  function renderIntro(l) {
    var body = el('div', 's-body ex-body ex-body--intro'); var rule = el('span', 'trace-rule'); rule.setAttribute('aria-hidden', 'true'); body.appendChild(rule);
    body.appendChild(header(l));
    var art = el('article', 'ex-letter ex-letter--intro'); art.setAttribute('lang', l); art.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr'); art.setAttribute('data-testid', 'exec-intro');
    art.appendChild(letterhead(l, 0));
    var lk = lockup({ en: T.en.title, ar: T.ar.title }, l); lk.classList.add('ex-lockup--section'); var lt = lk.querySelector('h2'); if (lt) { var pp = el('p', lt.className, lt.textContent); pp.setAttribute('lang', lt.getAttribute('lang')); pp.setAttribute('dir', lt.getAttribute('dir')); lt.replaceWith(pp); } art.appendChild(lk);
    art.appendChild(el('p', 'ex-lede', T[l].lede));
    var ol = el('ol', 'ex-index'); ol.setAttribute('data-testid', 'exec-index');
    P.forEach(function (p, i) { var li = el('li', 'ex-index-item'); var b = el('button', 'ex-index-btn'); b.type = 'button'; b.setAttribute('data-exec-go', String(i + 2)); b.appendChild(el('span', 'ex-index-n', String(CLOSING_N + i + 2))); var nm = el('span', 'ex-index-name', p.name[l]); b.appendChild(nm); b.appendChild(el('span', 'ex-index-role', p.role[l])); b.addEventListener('click', function () { enter(i + 2); }); li.appendChild(b); ol.appendChild(li); });
    art.appendChild(ol);
    var hr = el('hr', 'ex-rule'); hr.setAttribute('aria-hidden', 'true'); art.appendChild(hr);
    body.appendChild(art);
    return body;
  }
  function renderProfile(p, i, l) {
    var body = el('div', 's-body ex-body' + (p.film ? ' ex-body--film' : '')); var rule = el('span', 'trace-rule'); rule.setAttribute('aria-hidden', 'true'); body.appendChild(rule);
    body.appendChild(header(l, fill(T[l].letterOf, i)));
    var grid = el('div', 'ex-grid' + (p.film ? ' ex-grid--film' : ''));
    var art = el('article', 'ex-letter'); art.setAttribute('lang', l); art.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr'); art.setAttribute('data-testid', 'exec-letter-' + p.id); art.setAttribute('aria-labelledby', 'ex-name-' + p.id + '-' + l);
    if (p.pending) art.setAttribute('data-pending', 'identity-confirmation-requested');
    art.appendChild(letterhead(l, i));
    var top = el('div', 'ex-top');
    var who = el('div', 'ex-who'); who.appendChild(el('p', 'ex-salute', T[l].introducing));
    var lk = lockup(p.name, l); var title = lk.querySelector('h2'); if (title) title.id = 'ex-name-' + p.id + '-' + l; who.appendChild(lk);
    who.appendChild(el('p', 'ex-role', p.role[l])); top.appendChild(who);
    if (p.portrait) {
      var pf = el('figure', 'ex-portrait'); pf.setAttribute('data-testid', 'exec-portrait-' + p.id);
      var im = el('img'); im.src = p.portrait.src; im.width = p.portrait.w; im.height = p.portrait.h; im.alt = p.name[l]; im.decoding = 'async'; im.loading = 'eager'; im.setAttribute('data-no-mirror', 'true'); pf.appendChild(im);
      pf.appendChild(el('figcaption', 'ex-portrait-cap', p.portrait.credit[l])); top.appendChild(pf);
    } else {
      var sf = el('figure', 'ex-seal'); sf.setAttribute('data-testid', 'exec-seal-' + p.id); sf.appendChild(sealSvg(p, l)); sf.appendChild(el('figcaption', 'ex-seal-cap', T[l].seal)); top.appendChild(sf);
    }
    art.appendChild(top);
    var tx = el('div', 'ex-text'); p.body[l].forEach(function (s) { tx.appendChild(el('p', null, s)); }); art.appendChild(tx);
    var hr = el('hr', 'ex-rule'); hr.setAttribute('aria-hidden', 'true'); art.appendChild(hr);
    var sg = el('div', 'ex-sign'); sg.appendChild(el('span', 'ex-sign-line')); var sn = el('span', 'ex-sign-name', p.name[l]); sg.appendChild(sn); sg.appendChild(el('span', 'ex-sign-role', T[l].sign + (p.pending ? ' · ' + T[l].pendingNote : ''))); art.appendChild(sg);
    art.appendChild(sources(p, l));
    grid.appendChild(art);
    if (p.film) grid.appendChild(filmEl(l));
    body.appendChild(grid);
    return body;
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
