/* Athar Open Agentic Pact deck — v1.5.2 (2026-09-30): slide 30 photo shown uncropped (object-fit contain), 'In the news' rebuilt as a non-scrolling 4×2 grid of the eight re-verified items, tier cards equal-height; slide 29 tier columns top-aligned.
   v1.4.0 (2026-09-27) "Outcomes are the product" section + virtual-slide host.
   v1.4.0 (edit in place): WP1 slide-30 news cards are whole-card anchors to verified article URLs (↗ glyph, hover/focus,
   RTL-mirrored; register proof/news-link-register-v1.4.0.json); WP2 slide-29 OWNERSHIP band rebuilt below the tier cards
   (pill + balanced headline, one wide Plate-5 concept-render banner with the official Athar logo composited into the wall
   nameplate, tier-progression row, two-line footnote on a cream backing); WP3 this module now hosts the slides registered by
   window.AtharOS (section 08 "Athar OS", dist/js/athar-os.js): TOTAL 39, deep links #/27/new-1 … new-11, rail entries
   07 Impact & funding / 08 Athar OS, Esc-overview tiles 28–38 (closing renumbered 39).
   v1.3.3 (edit in place): slide 29 heroes = photoreal concept renders with the OFFICIAL Athar logo composited
   programmatically (dist/assets/impact/v133/, provenance in credits.json), tags 'Concept render' / «تصوّر مفاهيمي»;
   slide 30 news cards carry the publisher / technology-partner mark instead of an article photo (dist/assets/news/marks/),
   + Qualcomm (WAM 2026-08-13) and Middle East AI News cards, Dragonwing added to the trademark footnote; programme
   acronym removed from the tier copy.
   Runtime enhancement in the v1.2.x lineage (React/TS sources are 0-byte after the platform restore, so the
   built deck is extended at runtime, like the v1.2.0 partner strip and the v1.2.1 pillar visuals).
   Adds six slides AFTER slide 27 (Roadmap, the last content slide) and BEFORE slide 28 (Closing):
     28 Outcomes are the product · 29 Three impact tiers, one delivery model · 30 What we deliver, measurably
     31 How the community sustains itself · 32 Delivered with · 33 Join the Pact   → Closing becomes 34 of 34.
   v1.3.2 changes (edit in place, bundle untouched):
     • slide 29: three equal product-led columns (Licences · Appliance AI PCs & desktops · Sovereign data-centre
       nodes) — product visual on top, "What is delivered", "Outcomes measured", an impact band with World Bank
       WDI tags (2026-07-13), a technology-partner marks row (Intel · Qualcomm, reference only) under column 2,
       a full-width OWNERSHIP call-out band with the handover / asset-transfer / farmer-impact visuals, the
       escalation bullet, the WDI + paper source line and the Intel/Qualcomm trademark footnote; UAE-as-origin
       header visual kept (never mirrored); fits 1366×768 without overflow.
     • slide 30: "What every agreement carries" in its own band under the three cards; new 4-column
       "In the news" / «في الأخبار» strip — 12 cards (Lebanon · India · Kenya · Technology partners), each a
       target=_blank rel=noopener link with a 16:9 hero thumbnail (local WebP + JPG), publisher favicon,
       headline, date, tag pill (Direct announcement / Related coverage) and tier chip; RTL-mirrored.
     • slide 32: the two non-foundation funder cards stay removed; Gates Foundation, The Rockefeller Foundation, Patrick J.
       McGovern Foundation and Mastercard Foundation in ONE identical tile treatment; INTERNAL REVIEW ONLY
       disclaimer in its own full-width band below the funders row.
   Every figure comes from "Athar — Agentic AI for All: Three Impact Tiers for Foundation Funding" (27 Sep 2026,
   15 pp.; page references in data-src attributes); World Bank WDI baselines as tagged. Palette from
   brand/brand-tokens.json only. RTL mirrors through logical properties; images/logos are never mirrored.
   Navigation: intercepts next/prev between real slide 27 and real slide 28, rewrites the footer counter to n of 34
   and exposes the deep links #/27/new-1 … #/27/new-6. */
(function () {
  'use strict';
  var VERSION = 'v1.5.4';
  var EXT = (window.AtharOS && window.AtharOS.slides) || []; /* v1.4.0: slides registered by dist/js/athar-os.js (loaded first) */
  var REAL_TOTAL = 28, ANCHOR = 27, N_IT = 6, N = N_IT + EXT.length, TOTAL = REAL_TOTAL + N;
  var SRC = 'Athar — Agentic AI for All: Three Impact Tiers for Foundation Funding (27 Sep 2026)';
  var initialHash = window.location.hash;

  var MARKS = { /* candidate marks (dist/partners/review) — provenance: BRAND_USAGE_NOTES.md § 12–14, brand/download-manifest.json */
    oda:     { src: '/partners/review/oda__athar_partner_oda_logo_bw_v1.png', w: 3980, h: 1222, name: 'ODA', nameAr: 'مكتب الشؤون التنموية (ODA)' },
    undp:    { src: '/partners/review/undp__undp-logo-blue.svg', w: 60, h: 122, name: 'UNDP', nameAr: 'برنامج الأمم المتحدة الإنمائي' },
    unicef:  { src: '/partners/review/unicef__English-Inverse_39.png.webp', w: 1159, h: 150, name: 'UNICEF', nameAr: 'اليونيسف', dark: true },
    ifrc:    { src: '/partners/review/ifrc__Logo-Horizontal-RGB-300ppi.png', w: 3509, h: 1585, name: 'IFRC', nameAr: 'الاتحاد الدولي لجمعيات الصليب الأحمر والهلال الأحمر' },
    wfp:     { src: '/partners/review/wfp__wfp-logo-standard-blue-en.svg', w: 132, h: 58, name: 'WFP', nameAr: 'برنامج الأغذية العالمي' },
    unhcr:   { src: '/partners/review/unhcr__logo.svg', w: 175, h: 43, name: 'UNHCR', nameAr: 'المفوضية السامية للأمم المتحدة لشؤون اللاجئين' },
    discord: { src: '/partners/review/discord__Discord-Logo-Blurple.svg', w: 635, h: 96, name: 'Discord', nameAr: 'ديسكورد' },
    uae:     { src: '/partners/review/uae__u-ae-home_logo.svg', w: 2733, h: 1050, name: 'United Arab Emirates', nameAr: 'دولة الإمارات العربية المتحدة' },
    /* funders — official marks from the organisations' own domains (v1.3.2; brand/download-manifest.json → v1_3_2.funder_marks) */
    gates:       { src: '/partners/review/gates-foundation__gf-primary-weathered-slate-logo_4by1-ratio-fixed.svg', w: 800, h: 200, name: 'Gates Foundation', nameAr: 'مؤسسة غيتس' },
    rockefeller: { src: '/partners/review/rockefeller-foundation__RF_logo_screen_green.png', w: 1600, h: 591, name: 'The Rockefeller Foundation', nameAr: 'مؤسسة روكفلر' },
    mcgovern:    { src: '/partners/review/mcgovern-foundation__mf-logo.svg', w: 267, h: 69, name: 'Patrick J. McGovern Foundation', nameAr: 'مؤسسة باتريك ج. ماكغفرن' },
    mastercard:  { name: 'Mastercard Foundation', nameAr: 'مؤسسة ماستركارد' } /* v1.4.7: Full-Colour PNG unrecoverable and no standalone official file obtainable (mastercardfdn.org serves only an inline 20-year-anniversary lockup; Wikimedia 404) — rendered as the typographic tile, never redrawn */
  };
  var WALL = [
    { group: 'actors', mark: 'oda' }, { group: 'actors', mark: 'uae' }, { group: 'actors', mark: 'undp' }, { group: 'actors', mark: 'unicef' },
    { group: 'actors', mark: 'ifrc' }, { group: 'actors', mark: 'wfp' }, { group: 'actors', mark: 'unhcr' }, { group: 'actors', mark: 'discord' },
    { group: 'funders', mark: 'gates', src: 'p. 4–5', sub: 'Co-funder — education (India) and farmer layer (Kenya)', subAr: 'ممول مشارك — التعليم (الهند) وطبقة المزارعين (كينيا)' },
    { group: 'funders', mark: 'rockefeller', src: 'p. 4–5', sub: 'Farmer layer, Legacy', subAr: 'طبقة المزارعين — الإرث' },
    { group: 'funders', mark: 'mcgovern', src: 'p. 4–5', sub: 'Candidate co-funder, Access', subAr: 'ممول مشارك مرشّح — الوصول' },
    { group: 'funders', mark: 'mastercard', src: 'p. 4–5', sub: 'Youth operators and builders, Legacy', subAr: 'المشغّلون والبناة الشباب — الإرث' }
  ];

  var NEWS = [ /* v1.5.2: ONLY the eight items re-verified on 2026-09-30 (canonical URLs); unverified items dropped */
    {"id": "lb-wam", "tier": "lebanon", "tag": "direct", "date": "2026-09-25", "dateAr": "2026-09-25", "publisher": "WAM (Emirates News Agency)", "publisherAr": "وام (وكالة أنباء الإمارات)", "headline": "Abdullah bin Zayed meets Lebanese PM in New York; ‘One Million Lebanese AI Experts’ initiative launched under Government Experience Exchange Programme", "headlineAr": "عبدالله بن زايد يلتقي رئيس وزراء لبنان في نيويورك؛ إطلاق مبادرة «مليون خبير لبناني في الذكاء الاصطناعي»", "url": "https://www.wam.ae/en/article/17fxhet-abdullah-bin-zayed-meets-lebanese-new-york-%E2%80%98one", "mark": "publisher-wam.png", "markKind": "publisher", "markName": "WAM", "markDark": false, "verified": "2026-09-30"},
    {"id": "lb-national", "tier": "lebanon", "tag": "related", "date": "2026-09-25", "dateAr": "2026-09-25", "publisher": "The National", "publisherAr": "ذا ناشيونال", "headline": "UAE and Lebanon launch AI training initiative", "headlineAr": "الإمارات ولبنان تطلقان مبادرة للتدريب على الذكاء الاصطناعي", "url": "https://www.thenationalnews.com/news/mena/2026/09/25/uae-and-lebanon-launch-ai-training-initiative/", "mark": "publisher-the-national.png", "markKind": "publisher", "markName": "The National", "markDark": false, "verified": "2026-09-30"},
    {"id": "in-wam-mou", "tier": "india", "tag": "direct", "date": "2024-02-14", "dateAr": "2024-02-14", "publisher": "WAM (Emirates News Agency)", "publisherAr": "وام (وكالة أنباء الإمارات)", "headline": "UAE, India sign MoU to accelerate growth of digital economy", "headlineAr": "الإمارات والهند توقّعان مذكرة تفاهم لتسريع نمو الاقتصاد الرقمي", "url": "https://www.wam.ae/en/article/b1ns93x-uae-india-sign-mou-accelerate-growth-digital", "mark": "publisher-wam.png", "markKind": "publisher", "markName": "WAM", "markDark": false, "verified": "2026-09-30"},
    {"id": "in-pib", "tier": "india", "tag": "direct", "date": "2026-08-05", "dateAr": "2026-08-05", "publisher": "Press Information Bureau (India)", "publisherAr": "مكتب الإعلام الصحفي (الهند)", "headline": "Artificial Intelligence (AI) and Digital Education in Government Schools", "headlineAr": "الذكاء الاصطناعي والتعليم الرقمي في المدارس الحكومية", "url": "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2295050&lang=1&reg=6", "mark": "publisher-pib.png", "markKind": "publisher", "markName": "PIB India", "markDark": false, "verified": "2026-09-30"},
    {"id": "ke-wam-mou", "tier": "kenya", "tag": "direct", "date": "2024-03-29", "dateAr": "2024-03-29", "publisher": "WAM (Emirates News Agency)", "publisherAr": "وام (وكالة أنباء الإمارات)", "headline": "UAE, Kenya sign Investment Memorandum to advance digital infrastructure, AI initiatives", "headlineAr": "الإمارات وكينيا توقّعان مذكرة استثمار لتطوير البنية التحتية الرقمية ومبادرات الذكاء الاصطناعي (مراكز بيانات حتى 1,000 ميغاواط)", "url": "https://www.wam.ae/en/article/b2dzbq3-uae-kenya-sign-investment-memorandum-advance", "mark": "publisher-wam.png", "markKind": "publisher", "markName": "WAM", "markDark": false, "verified": "2026-09-30"},
    {"id": "ke-ict", "tier": "kenya", "tag": "related", "date": "2025-09-12", "dateAr": "2025-09-12", "publisher": "Kenya Ministry of ICT & Digital Economy", "publisherAr": "وزارة تقنية المعلومات والاقتصاد الرقمي في كينيا", "headline": "Kenya’s Digital Future Brightens as Construction of East Africa’s Largest Data Centre Starts", "headlineAr": "مستقبل كينيا الرقمي يزداد إشراقًا مع بدء إنشاء أكبر مركز بيانات في شرق أفريقيا", "url": "https://ict.go.ke/node/797", "mark": "publisher-kenya-ict.png", "markKind": "publisher", "markName": "Kenya ICT", "markDark": false, "verified": "2026-09-30"},
    {"id": "tp-intel-dec25", "tier": "tech", "tag": "direct", "date": "2025-12-18", "dateAr": "2025-12-18", "publisher": "Gulf News", "publisherAr": "غلف نيوز", "headline": "AIREV and Intel partner to launch AI agents that run entirely on your PC", "headlineAr": "AIREV وIntel تتشاركان لإطلاق وكلاء ذكاء اصطناعي يعملون بالكامل على حاسوبك", "url": "https://gulfnews.com/business/corporate-news/airev-and-intel-partner-to-launch-ai-agents-that-run-entirely-on-your-pc-1.500383475", "mark": "publisher-gulf-news-wordmark.svg", "markKind": "publisher", "markName": "Gulf News", "markDark": false, "verified": "2026-09-30"},
    {"id": "tp-intel-oct25", "tier": "tech", "tag": "direct", "date": "2025-10-14", "dateAr": "2025-10-14", "publisher": "Gulf News", "publisherAr": "غلف نيوز", "headline": "Intel and AIREV partner to Propel AI innovation across Middle East and globally", "headlineAr": "Intel وAIREV تتشاركان لدفع ابتكار الذكاء الاصطناعي في الشرق الأوسط وعالميًا", "url": "https://gulfnews.com/business/corporate-news/intel-and-airev-partner-to-propel-ai-innovation-across-middle-east-and-globally-1.500306686", "mark": "publisher-gulf-news-wordmark.svg", "markKind": "publisher", "markName": "Gulf News", "markDark": false, "verified": "2026-09-30"}
  ];
  var TIER_IMG = {
    "t1-licences": {"dir": "impact/v133", "base": "t1-licences", "ext": "png", "pos": "50% 45%", "official": true, "credit": "Athar Brand Asset Pack v3 — 04_Imagery/athar_imagery_illustration_scene1_government_v2.jpg (official brand imagery, cover-cropped 1200×800, v1.4.7)"},
    "t2-ai-pc-composited": {"dir": "impact/v133", "base": "t2-ai-pc-composited", "ext": "png", "pos": "50% 42%", "official": true, "credit": "Athar Brand Asset Pack v3 — 04_Imagery/athar_imagery_illustration_scene2_sme_v2.jpg (official brand imagery, cover-cropped 1200×800, v1.4.7; the v1.3.3 concept render was unrecoverable)"},
    "t3-data-centre-composited": {"dir": "impact/v133", "base": "t3-data-centre-composited", "ext": "png", "pos": "50% 50%", "official": true, "credit": "Athar Brand Asset Pack v3 — 04_Imagery/athar_imagery_keyvisual_dark_v2.jpg (official brand key visual, cover-cropped 1200×800, v1.4.7; the v1.3.3 concept render was unrecoverable)"},
    "logo-intel": {"dir": "tiers", "file": "logo-intel.png", "credit": "Intel logo — Intel Newsroom press hub logo pack (2021-Intel-logos.zip → Intel-logo-nobox.png); reference only, no endorsement implied"},
    "logo-qualcomm": {"dir": "tiers", "file": "logo-qualcomm.svg", "credit": "Snapdragon X Elite Platform badge — Qualcomm press kit (Snapdragon Summit 2026, Day 1), www.qualcomm.com; reference only, no endorsement implied"}};
  var L = {
    en: {
      chapter: '07', kicker: 'Impact & funding', srcNote: 'Source: ' + SRC + ' — figures are the paper’s illustrative targets (p. 3).',
      counter: function (n, t) { return 'Slide ' + n + ' of ' + t; },
      ui: { render: 'Concept render', renderTag: 'CONCEPT RENDER', imagery: 'Official brand imagery', photoNote: 'Verified by the source: 1,000,000 citizens (The National, 25 Sep 2026). The 18,000-experts figure remains the paper’s illustrative target.', openSource: 'Open the source article (The National)', opensNew: '(opens in new tab)', flaggedNote: 'Publisher origin unreachable from the build host at check time (HTTP 0); canonical article URL kept.', wbShort: 'Source: World Bank WDI (2026-07-13)', tm2: 'Intel, Intel Core, Qualcomm, Dragonwing and Snapdragon are trademarks of their respective owners; partner marks shown for reference only, no endorsement implied.', delivered: 'What is delivered', outcomes: 'Outcomes measured', partnersLabel: 'Technology-partner marks — reference only, no endorsement implied', news: 'In the news', direct: 'Direct announcement', related: 'Related coverage', pending: 'official mark pending verification', agreement: 'What every agreement carries', wbSource: 'Source: World Bank WDI (2026-07-13)', tm: 'Intel, the Intel logo, and Intel Core are trademarks of Intel Corporation or its subsidiaries. Qualcomm, Dragonwing and Snapdragon are trademarks or registered trademarks of Qualcomm Incorporated. Publisher and partner marks are trademarks of their respective owners — shown for reference only, no endorsement implied.', reviewBadge: 'INTERNAL REVIEW ONLY', reviewText: ' — candidate partner marks pending written verification from each organisation; not for external distribution. Mastercard Foundation: guideline compliance and Foundation approval pending. The Rockefeller Foundation: prior written approval pending. Patrick J. McGovern Foundation: no public brand guideline located — approval pending. Source: Athar — Agentic AI for All: Three Impact Tiers for Foundation Funding (27 Sep 2026); figures are the paper’s illustrative targets (p. 3).' },
      slides: [
        { id: 'it-outcomes', icon: 'impact', title: 'Outcomes are the product',
          sub: 'The Pact turns agreements into capacity, livelihoods and leadership — impact that stays.',
          bullets: [
            ['Every programme is defined as a result: people certified, learning gains, farmer income, sovereign capacity left behind.', 'p. 1'],
            ['The instruments already exist — 38 CEPAs, the One Million Lebanese AI Experts programme under the UAE’s government-to-government capability programme, and the $1B AI for Development initiative for Africa.', 'p. 1'],
            ['A funder sponsors a named programme for a defined population, with guaranteed service and independently measured results; the funder owns the mission and the headline.', 'p. 5'],
            ['Athar — أثر — is the trace that remains after the work is done. Leave a trace that lasts.', 'Athar Brand Guidelines v2 § 1.3 / § 4.4']
          ],
          note: 'The next slides carry only figures from the Athar funding paper (Sep 2026); they are illustrative targets, not commitments.' },
        { id: 'it-tiers', icon: 'community', title: 'Three impact tiers, one delivery model',
          sub: 'Access → Ownership → Legacy: a funder can enter at any tier and climb.',
          tiers: [
            { key: 't1', kicker: 'Tier 1', name: 'Licences', chip: 'Access', place: 'Lebanon · Access', amount: '$10M', flagship: 'Flagship: One Million Lebanese AI Experts',
              visual: 't1-licences', visualAlt: 'Tier 1 — licences: government-service scene from the official Athar brand imagery (Brand Asset Pack v3)',
              delivered: '1M citizens certified in generative AI; 18,000 in daily professional use in ministries, schools, clinics and small businesses.',
              outcomes: 'certificates issued · daily active users · ministry workflows live',
              wb: { country: 'Lebanon', tags: ['population 5.85M (2025)', 'internet users 80.6% (2024)'] }, src: 'p. 1, 3–5' },
            { key: 't2', kicker: 'Tier 2', name: 'Appliance AI PCs & desktops', chip: 'Ownership', place: 'India · Ownership', amount: '$13.7M', flagship: 'Flagship: the UAE–India CEPA gains an AI chapter',
              visual: 't2-ai-pc-composited', visualAlt: 'Tier 2 — appliance AI PCs and desktops: small-business scene from the official Athar brand imagery (Brand Asset Pack v3)',
              delivered: 'on-device AI tutoring in 100 government schools in Hindi and the state language; 10,000 AI PCs; teacher training; 8-person in-country team.',
              partners: [{ key: 'intel', logo: 'logo-intel', name: 'Intel', alt: 'Intel logo — technology-partner mark, reference only' }, { key: 'qualcomm', logo: 'logo-qualcomm', name: 'Qualcomm', alt: 'Qualcomm Snapdragon X Elite badge — technology-partner mark, reference only' }],
              outcomes: 'learning gains vs baseline · teacher time saved · device uptime',
              wb: { country: 'India', tags: ['primary enrolment 111.0% gross (2025)', 'secondary enrolment 79.6% gross (2025)', 'internet users 70.0% (2025)'] }, src: 'p. 1, 4–5' },
            { key: 't3', kicker: 'Tier 3', name: 'Sovereign data-centre nodes', chip: 'Legacy', place: 'Kenya · Legacy', amount: '~$33M', flagship: 'Flagship: a sovereign AI node that feeds farmers',
              visual: 't3-data-centre-composited', visualAlt: 'Tier 3 — sovereign data-centre nodes: dark key visual from the official Athar brand imagery (Brand Asset Pack v3)',
              delivered: 'a Kenyan-owned AIREV modular data centre on sovereign compute; Swahili voice advice for smallholder farmers; clinics and schools on the same node.',
              outcomes: 'farmers served · yield and income change · local operators certified · asset transferred',
              wb: { country: 'Kenya', tags: ['agriculture 45.8% of employment (2025)', 'agriculture 23.2% of GDP (2025)', 'internet users 35.0% (2024)'] }, src: 'p. 1, 4–5' }
          ],
          ownership: { label: 'Ownership', lead: 'Ownership:', text: 'the asset is transferred to a national entity after 5–7 years; young local operators are trained and certified to run it.', src: 'p. 4, 9',
            /* v1.4.7: dead visuals[] removed (never rendered since the v1.4.0 OWNERSHIP-band rebuild; its own-*.png files never shipped) */ },
          bullets: [['A Tier 1 seat programme becomes the evidence base for Tier 2 devices; a cluster of Tier 2 deployments creates the demand for a Tier 3 national node.', 'p. 6']] },
        { id: 'it-metrics', icon: 'impact', title: 'What we deliver, measurably',
          sub: 'Outcome metrics per tier — each reported against a baseline by an independent evaluator.',
          cards: [
            { icon: '/brand/icons/pack/impact.png', tier: 'Access · Lebanon', items: ['1,000,000 citizens certified in generative AI', '18,000 experts in daily use across ministries, schools, clinics and small businesses', 'Quarterly reporting against the one-million target'], src: 'p. 1, 3', photo: { jpg: '/assets/img/lebanon-one-million-ai-experts-20260925.jpg', webp: '/assets/img/lebanon-one-million-ai-experts-20260925.webp', w: 1600, h: 1067, alt: 'Sheikh Abdullah bin Zayed and Lebanese Prime Minister Nawaf Salam at the launch of the “One Million Lebanese AI Experts” initiative, UNGA, New York, 25 September 2026', caption: 'Photo: UAE–Lebanon “One Million Lebanese AI Experts” launch, UNGA New York, 25 Sep 2026 — The National / The Gulf Observer', href: 'https://www.thenationalnews.com/news/mena/2026/09/25/uae-and-lebanon-launch-ai-training-initiative/' } },
            { icon: '/brand/icons/pack/education.png', tier: 'Ownership · India', items: ['100 government schools with on-device AI tutoring', '10,000 AI PCs, teacher training, an 8-person in-country team', 'Learning gains reported against a baseline by an independent evaluator'], src: 'p. 4' },
            { icon: '/assets/growth-impact-ByIEEdLi.png', tier: 'Legacy · Kenya', items: ['One Kenyan-owned sovereign AI node serving farmers first', 'Swahili voice advice on crops, pests, weather and prices; clinics and schools on the same node', 'Young Kenyans trained to operate it; ownership transferred after 5–7 years'], src: 'p. 4–5' }
          ],
          agreement: 'named cohorts and activation targets · baseline and independent evaluation · quarterly outcome reports · open-book costs with unspent funds returned · country chapters and trained local operators.', agreementSrc: 'p. 5',
          newsGroups: [{ tier: 'lebanon', title: 'Lebanon · Access', chip: 'Lebanon' }, { tier: 'india', title: 'India · Ownership', chip: 'India' }, { tier: 'kenya', title: 'Kenya · Legacy', chip: 'Kenya' }, { tier: 'tech', title: 'Technology partners', chip: 'Partnership' }] },
        { id: 'it-sustain', icon: 'trust-safety', title: 'How the community sustains itself',
          sub: 'Tiered, funder-matched delivery — sustainable and equitable by design.',
          bullets: [
            ['Participation first: sponsored seats are named, time-bound and measurable — the Community Plan model, extended up the ownership ladder.', 'p. 5–6'],
            ['Funder-matched tiers: Access anchored by the UAE through its government-to-government capability programme, with the McGovern Foundation as candidate co-funder; Ownership co-funded by the Gates Foundation alongside public education partners in India; Legacy with AI for Development, the Rockefeller Foundation, the Gates Foundation and the Mastercard Foundation.', 'p. 5'],
            ['Open reporting: baseline, independent evaluation ring-fenced at ~3 %, quarterly outcome reports, tranches released on milestones.', 'p. 5, 7, 9'],
            ['Local operators trained, jobs created: in-country teams, young operators trained under the programme, build-operate-transfer — assets pass to a national entity.', 'p. 4, 9'],
            ['What the UAE gains: CEPAs deepen from goods into digital services, the UAE’s government-to-government capability programme gets a national-scale flagship, UAE-built AI infrastructure is exported and food corridors strengthen.', 'p. 1, 5']
          ] },
        { id: 'it-partners', icon: 'community', title: 'Delivered with',
          sub: 'The actors of the Pact and the funders named in the Athar funding paper.',
          wall: true, groups: { actors: 'Pact actors', funders: 'Funders named in the paper (pp. 3–5)' },
          /* v1.5.2 close-out (2026-09-30): executive photo restored — real binary fetched from the Gulf News article (1200×900 JPEG, sha256 266202941418cfa9b7dfa8c2d23e3d662305e3bfeaafff36251ea9e42608e690), ONE caption + ONE source line, alt text as alt only */
          execPhoto: { id: 'redington-signing-20260722', jpg: '/assets/img/redington-signing-gulfnews-20260722.jpg', webp: '/assets/img/redington-signing-gulfnews-20260722-900.webp', w: 1200, h: 900,
            kicker: 'Technology partners — in the news', headline: 'Redington to distribute UAE-built AIREV OnDemand agentic AI platform across MEA',
            alt: 'Muhammad Khalid, AIREV founder, and Sayantan Dev, President of MEA at Redington, signing the distribution agreement in the presence of Dr Thani Al Zeyoudi',
            caption: 'Muhammad Khalid (F-L), AIREV founder, and Sayantan Dev (F-R), President of MEA at Redington, sign the agreement, in the presence of Dr Thani Al Zeyoudi (B-C), UAE Minister of Foreign Trade and Chairman of AIREV.',
            source: 'Source: Gulf News, 22 July 2026', opensNew: '(opens in new tab)', url: 'https://gulfnews.com/business/corporate-news/redington-to-distribute-uae-built-airev-ondemand-agentic-ai-platform-across-mea-1.500616526' } },
        { id: 'it-join', icon: 'community', title: 'Join the Pact',
          sub: 'Bring a programme, a cohort or a country chapter.',
          bullets: [
            ['Sponsor an outcome, not a product: name the population, the result and the evaluator.', 'p. 5'],
            ['Start at any tier; the evidence from one tier opens the next.', 'p. 6'],
            ['Everything is reported in the open — baseline, quarterly outcomes, costs.', 'p. 5']
          ],
          endorse: { ar: 'أثٌر يبقى', en: 'Impact that stays.' } }
      ]
    },
    ar: {
      chapter: '07', kicker: 'الأثر والتمويل', srcNote: 'المصدر: ورقة أثر — الذكاء الاصطناعي الوكيلي للجميع: ثلاث فئات أثر لتمويل المؤسسات (27 سبتمبر 2026) — الأرقام أهداف استرشادية (ص 3).',
      counter: function (n, t) { return 'الشريحة ' + n + ' من ' + t; },
      ui: { render: 'تصوّر مفاهيمي', renderTag: 'تصوّر مفاهيمي · CONCEPT RENDER', imagery: 'صورة رسمية من هوية أثر', photoNote: 'مؤكَّد من المصدر: 1,000,000 مواطن (ذا ناشيونال، 25 سبتمبر 2026). ويبقى رقم 18,000 خبير هدفًا استرشاديًا في الورقة.', openSource: 'افتح المقال المصدر (ذا ناشيونال)', opensNew: '(يفتح في تبويب جديد)', flaggedNote: 'تعذّر الوصول إلى خادم الناشر من مضيف البناء وقت الفحص (HTTP 0)؛ أُبقي رابط المقال الأصلي.', wbShort: 'المصدر: مؤشرات التنمية العالمية للبنك الدولي (2026-07-13)', tm2: 'Intel وIntel Core وQualcomm وDragonwing وSnapdragon علامات تجارية لمالكيها؛ تُعرض علامات الشركاء للإشارة فقط ولا تعني أي تأييد.', delivered: 'ما يُنجَز', outcomes: 'النتائج المقيسة', partnersLabel: 'علامات شركاء التقنية — للإشارة فقط، ولا تعني أي تأييد', news: 'في الأخبار', direct: 'إعلان رسمي', related: 'تغطية ذات صلة', pending: 'العلامة الرسمية بانتظار التحقق', agreement: 'ما تحمله كل اتفاقية', wbSource: 'المصدر: مؤشرات التنمية العالمية للبنك الدولي (2026-07-13)', tm: 'Intel وشعار Intel وIntel Core علامات تجارية لشركة Intel Corporation أو شركاتها التابعة. Qualcomm وDragonwing وSnapdragon علامات تجارية أو مسجّلة لشركة Qualcomm Incorporated. علامات الناشرين والشركاء علامات تجارية لمالكيها — تُعرض للإشارة فقط ولا تعني أي تأييد.', reviewBadge: 'للمراجعة الداخلية فقط · INTERNAL REVIEW ONLY', reviewText: ' — علامات الشركاء المرشّحين بانتظار تحقق خطي من كل جهة؛ ليست للتوزيع الخارجي. مؤسسة ماستركارد: الالتزام بدليل الهوية وموافقة المؤسسة قيد الانتظار. مؤسسة روكفلر: الموافقة الخطية المسبقة قيد الانتظار. مؤسسة باتريك ج. ماكغفرن: لم يُعثر على دليل هوية عام — الموافقة قيد الانتظار. المصدر: أثر — الذكاء الاصطناعي الوكيلي للجميع: ثلاث فئات أثر لتمويل المؤسسات (27 سبتمبر 2026)؛ الأرقام أهداف استرشادية من الورقة (ص 3).' },
      slides: [
        { id: 'it-outcomes', icon: 'impact', title: 'النتائج هي المنتج',
          sub: 'يحوّل الميثاق الاتفاقيات إلى قدرات وسبل عيش وقيادة — أثرٌ يبقى.',
          bullets: [
            ['يُعرَّف كل برنامج بنتيجته: أشخاص معتمدون، ومكاسب تعلّم، ودخل للمزارعين، وقدرة سيادية تبقى بعد انتهاء البرنامج.', 'ص 1'],
            ['الأدوات موجودة أصلًا: 38 اتفاقية شراكة اقتصادية شاملة، وبرنامج «مليون خبير لبناني في الذكاء الاصطناعي» ضمن برنامج تبادل الخبرات الحكومية، ومبادرة «الذكاء الاصطناعي من أجل التنمية» بقيمة مليار دولار لأفريقيا.', 'ص 1'],
            ['يرعى المموّل برنامجًا مسمّى لفئة محددة من المستفيدين، بخدمة مضمونة ونتائج تقيسها جهة مستقلة؛ والمموّل هو صاحب الرسالة والعنوان.', 'ص 5'],
            ['أثر هو ما يبقى بعد إنجاز العمل. اترك أثًرا يدوم.', 'دليل هوية أثر v2 § 1.3 / § 4.4']
          ],
          note: 'الشرائح التالية لا تحمل إلا أرقامًا وردت في ورقة تمويل أثر (سبتمبر 2026)؛ وهي أهداف استرشادية لا التزامات.' },
        { id: 'it-tiers', icon: 'community', title: 'ثلاث فئات أثر، نموذج تنفيذ واحد',
          sub: 'الوصول ← التملّك ← الإرث: يمكن للممول أن يبدأ من أي فئة ثم يرتقي.',
          tiers: [
            { key: 't1', kicker: 'الفئة 1', name: 'التراخيص', chip: 'الوصول', place: 'لبنان · الوصول', amount: '10 ملايين دولار', flagship: 'البرنامج الرائد: مليون خبير لبناني في الذكاء الاصطناعي',
              visual: 't1-licences', visualAlt: 'الفئة 1 — التراخيص: مشهد خدمة حكومية من صور هوية أثر الرسمية (حزمة أصول العلامة v3)',
              delivered: 'اعتماد مليون مواطن في الذكاء الاصطناعي التوليدي؛ 18,000 في الاستخدام المهني اليومي في الوزارات والمدارس والعيادات والأعمال الصغيرة.',
              outcomes: 'الشهادات الصادرة · المستخدمون النشطون يوميًا · مسارات العمل الحكومية المفعّلة',
              wb: { country: 'لبنان', tags: ['السكان 5.85 مليون (2025)', 'مستخدمو الإنترنت 80.6٪ (2024)'] }, src: 'ص 1، 3–5' },
            { key: 't2', kicker: 'الفئة 2', name: 'أجهزة الذكاء الاصطناعي: حواسيب AI PC ومكتبية', chip: 'التملّك', place: 'الهند · التملّك', amount: '13.7 مليون دولار', flagship: 'البرنامج الرائد: فصل للذكاء الاصطناعي في اتفاقية الشراكة الاقتصادية الشاملة بين الإمارات والهند',
              visual: 't2-ai-pc-composited', visualAlt: 'الفئة 2 — حواسيب الذكاء الاصطناعي وأجهزة سطح المكتب: مشهد أعمال صغيرة من صور هوية أثر الرسمية (حزمة أصول العلامة v3)',
              delivered: 'تدريس بالذكاء الاصطناعي على الجهاز في 100 مدرسة حكومية بالهندية ولغة الولاية؛ 10,000 حاسوب ذكاء اصطناعي؛ تدريب المعلمين؛ فريق من 8 أشخاص داخل البلد.',
              partners: [{ key: 'intel', logo: 'logo-intel', name: 'Intel', alt: 'شعار Intel — علامة شريك تقني، للإشارة فقط' }, { key: 'qualcomm', logo: 'logo-qualcomm', name: 'Qualcomm', alt: 'شارة Qualcomm Snapdragon X Elite — علامة شريك تقني، للإشارة فقط' }],
              outcomes: 'مكاسب التعلّم مقارنة بخط الأساس · وقت المعلم الموفَّر · جاهزية الأجهزة',
              wb: { country: 'الهند', tags: ['الالتحاق الابتدائي 111.0٪ إجمالي (2025)', 'الالتحاق الثانوي 79.6٪ إجمالي (2025)', 'مستخدمو الإنترنت 70.0٪ (2025)'] }, src: 'ص 1، 4–5' },
            { key: 't3', kicker: 'الفئة 3', name: 'عُقد مراكز البيانات السيادية', chip: 'الإرث', place: 'كينيا · الإرث', amount: '~33 مليون دولار', flagship: 'البرنامج الرائد: عقدة ذكاء اصطناعي سيادية تخدم المزارعين',
              visual: 't3-data-centre-composited', visualAlt: 'الفئة 3 — عقد مراكز البيانات السيادية: صورة رئيسية داكنة من صور هوية أثر الرسمية (حزمة أصول العلامة v3)',
              delivered: 'مركز بيانات معياري من AIREV مملوك كينيًا على حوسبة سيادية؛ إرشاد صوتي بالسواحلية لصغار المزارعين؛ العيادات والمدارس على العقدة نفسها.',
              outcomes: 'المزارعون المخدومون · تغيّر الغلّة والدخل · المشغّلون المحليون المعتمدون · نقل الأصل',
              wb: { country: 'كينيا', tags: ['الزراعة 45.8٪ من العمالة (2025)', 'الزراعة 23.2٪ من الناتج المحلي الإجمالي (2025)', 'مستخدمو الإنترنت 35.0٪ (2024)'] }, src: 'ص 1، 4–5' }
          ],
          ownership: { label: 'التملّك', lead: 'التملّك:', text: 'يُنقل الأصل إلى جهة وطنية بعد 5–7 سنوات؛ ويُدرَّب مشغّلون محليون شباب ويُعتمدون لتشغيله.', src: 'ص 4، 9',
            /* v1.4.7: dead visuals[] removed (never rendered since the v1.4.0 OWNERSHIP-band rebuild; its own-*.png files never shipped) */ },
          bullets: [['برنامج مقاعد في الفئة الأولى يصبح قاعدة الأدلة لأجهزة الفئة الثانية؛ ومجموعة من نشرات الفئة الثانية تخلق الطلب على عقدة وطنية من الفئة الثالثة.', 'ص 6']] },
        { id: 'it-metrics', icon: 'impact', title: 'ما ننجزه، بالقياس',
          sub: 'مؤشرات النتائج لكل فئة — يُبلَّغ عنها مقارنة بخط أساس عبر مقيّم مستقل.',
          cards: [
            { icon: '/brand/icons/pack/impact.png', tier: 'الوصول · لبنان', items: ['1,000,000 مواطن معتمد في الذكاء الاصطناعي التوليدي', '18,000 خبير في الاستخدام اليومي عبر الوزارات والمدارس والعيادات والأعمال الصغيرة', 'تقارير فصلية مقارنة بهدف المليون'], src: 'ص 1، 3', photo: { jpg: '/assets/img/lebanon-one-million-ai-experts-20260925.jpg', webp: '/assets/img/lebanon-one-million-ai-experts-20260925.webp', w: 1600, h: 1067, alt: 'الشيخ عبدالله بن زايد ورئيس الوزراء اللبناني نواف سلام خلال إطلاق مبادرة «مليون خبير لبناني في الذكاء الاصطناعي»، الجمعية العامة للأمم المتحدة، نيويورك، 25 سبتمبر 2026', caption: 'الصورة: إطلاق مبادرة «مليون خبير لبناني في الذكاء الاصطناعي» بين الإمارات ولبنان، الجمعية العامة للأمم المتحدة – نيويورك، 25 سبتمبر 2026 — ذا ناشيونال / ذا غلف أوبزرفر', href: 'https://www.thenationalnews.com/news/mena/2026/09/25/uae-and-lebanon-launch-ai-training-initiative/' } },
            { icon: '/brand/icons/pack/education.png', tier: 'التملّك · الهند', items: ['100 مدرسة حكومية بتدريس بالذكاء الاصطناعي على الجهاز', '10,000 حاسوب ذكاء اصطناعي، وتدريب المعلمين، وفريق من 8 أشخاص داخل البلد', 'مكاسب التعلّم مقارنة بخط أساس عبر مقيّم مستقل'], src: 'ص 4' },
            { icon: '/assets/growth-impact-ByIEEdLi.png', tier: 'الإرث · كينيا', items: ['عقدة ذكاء اصطناعي سيادية واحدة مملوكة كينيًا تخدم المزارعين أولًا', 'إرشاد صوتي بالسواحلية عن المحاصيل والآفات والطقس والأسعار؛ العيادات والمدارس على العقدة نفسها', 'شباب كينيون يُدرَّبون على تشغيلها؛ وتنتقل الملكية بعد 5–7 سنوات'], src: 'ص 4–5' }
          ],
          agreement: 'فئات مستفيدين مسمّاة وأهداف تفعيل · خط أساس وتقييم مستقل · تقارير نتائج فصلية · تكاليف مفتوحة الدفاتر مع إعادة الأموال غير المنفقة · فصول قُطرية ومشغّلون محليون مدرَّبون.', agreementSrc: 'ص 5',
          newsGroups: [{ tier: 'lebanon', title: 'الوصول · لبنان', chip: 'لبنان' }, { tier: 'india', title: 'التملّك · الهند', chip: 'الهند' }, { tier: 'kenya', title: 'الإرث · كينيا', chip: 'كينيا' }, { tier: 'tech', title: 'شركاء التقنية', chip: 'شراكة' }] },
        { id: 'it-sustain', icon: 'trust-safety', title: 'كيف يستدام المجتمع',
          sub: 'تنفيذ متدرّج مطابق للممولين — مستدام وعادل بحكم التصميم.',
          bullets: [
            ['المشاركة أولًا: المقاعد المرعية مسمّاة ومحددة المدة وقابلة للقياس — نموذج خطة المجتمع ممتدًا صعودًا في سلّم التملّك.', 'ص 5–6'],
            ['فئات مطابقة للممولين: الوصول ترسيه الإمارات عبر برنامجها لتبادل الخبرات الحكومية، مع مؤسسة ماكغفرن ممولًا مشاركًا مرشّحًا؛ التملّك بتمويل مشترك من مؤسسة غيتس إلى جانب شركاء التعليم العام في الهند؛ الإرث مع «الذكاء الاصطناعي من أجل التنمية» ومؤسسة روكفلر ومؤسسة غيتس ومؤسسة ماستركارد.', 'ص 5'],
            ['تقارير مفتوحة: خط أساس، وتقييم مستقل مخصص له نحو 3٪، وتقارير نتائج فصلية، ودفعات تُصرف عند بلوغ المعالم.', 'ص 5، 7، 9'],
            ['مشغّلون محليون مدرَّبون ووظائف تُستحدث: فرق داخل البلد، وشباب يُدرَّبون ضمن البرنامج، ونموذج بناء–تشغيل–نقل تؤول به الأصول إلى جهة وطنية.', 'ص 4، 9'],
            ['ما تكسبه الإمارات: تتعمّق اتفاقيات الشراكة من السلع إلى الخدمات الرقمية، ويحصل برنامج تبادل الخبرات الحكومية الإماراتي على برنامج رائد بحجم وطني، وتُصدَّر بنية تحتية للذكاء الاصطناعي مبنية في الإمارات، وتتعزز ممرات الغذاء.', 'ص 1، 5']
          ] },
        { id: 'it-partners', icon: 'community', title: 'نُنجز مع',
          sub: 'الجهات الفاعلة في الميثاق والممولون المذكورون في ورقة تمويل أثر.',
          wall: true, groups: { actors: 'الجهات الفاعلة في الميثاق', funders: 'ممولون مذكورون في الورقة (ص 3–5)' },
          execPhoto: { id: 'redington-signing-20260722', jpg: '/assets/img/redington-signing-gulfnews-20260722.jpg', webp: '/assets/img/redington-signing-gulfnews-20260722-900.webp', w: 1200, h: 900,
            kicker: 'شركاء التقنية — في الأخبار', headline: 'Redington توزّع منصة AIREV OnDemand للذكاء الاصطناعي الوكيلي المبنية في الإمارات عبر الشرق الأوسط وأفريقيا',
            alt: 'محمد خالد، مؤسس AIREV، وسايانتان ديف، رئيس منطقة الشرق الأوسط وأفريقيا في Redington، يوقّعان اتفاقية التوزيع بحضور الدكتور ثاني الزيودي',
            caption: 'محمد خالد (يسار الصف الأمامي)، مؤسس AIREV، وسايانتان ديف (يمين الصف الأمامي)، رئيس منطقة الشرق الأوسط وأفريقيا في Redington، يوقّعان الاتفاقية بحضور الدكتور ثاني الزيودي (وسط الصف الخلفي)، وزير دولة للتجارة الخارجية ورئيس مجلس إدارة AIREV.',
            source: 'المصدر: غلف نيوز، 22 يوليو 2026', opensNew: '(يفتح في تبويب جديد)', url: 'https://gulfnews.com/business/corporate-news/redington-to-distribute-uae-built-airev-ondemand-agentic-ai-platform-across-mea-1.500616526' } },
        { id: 'it-join', icon: 'community', title: 'انضمّ إلى الميثاق',
          sub: 'أحضر برنامجًا أو فئة مستفيدين أو فصلًا قُطريًا.',
          bullets: [
            ['ارعَ نتيجةً لا منتجًا: سمِّ الفئة المستفيدة والنتيجة والمقيّم.', 'ص 5'],
            ['ابدأ من أي فئة؛ فالأدلة من فئة تفتح الفئة التالية.', 'ص 6'],
            ['كل شيء يُبلَّغ عنه في العلن — خط الأساس، والنتائج الفصلية، والتكاليف.', 'ص 5']
          ],
          endorse: { ar: 'أثٌر يبقى', en: 'Impact that stays.' } }
      ]
    }
  };

  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function img(src, alt, cls) { var i = el('img', cls); i.src = src; i.alt = alt || ''; i.decoding = 'async'; i.loading = 'eager'; i.setAttribute('data-no-mirror', 'true'); return i; }
  function tierImg(key) { var m = TIER_IMG[key]; return m ? '/assets/tiers/' + m.file : ''; }
  function link(href, text, cls) { var a = el('a', cls, text); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }
  /* <picture> with a WebP source and a JPG fallback — both stored locally under /assets/<dir>/ */
  function pic(dir, base, alt, cls, title, ext, pos) {
    var p = el('picture', cls); var s = el('source'); s.type = 'image/webp'; s.srcset = '/assets/' + dir + '/' + base + '.webp'; p.appendChild(s);
    var i = img('/assets/' + dir + '/' + base + '.' + (ext || 'jpg'), alt); if (title) i.title = title; if (pos) i.style.objectPosition = pos; p.appendChild(i); return p;
  }
  function tierPic(key, alt) { var m = TIER_IMG[key] || {}; if (m.base) return pic(m.dir, m.base, alt, null, m.credit, m.ext, m.pos); var i = img(tierImg(key), alt); if (m.credit) i.title = m.credit; return i; }

  /* ---------- rendering (same markup as the bundle's slide template) ---------- */
  function head(def, dict) {
    var h = el('header', 's-head');
    var ic = el('span', 'pv-icon'); ic.setAttribute('aria-hidden', 'true');
    var im = el('img'); im.src = '/brand/icons/pack/' + def.icon + '.png'; im.width = 256; im.height = 256; im.alt = ''; im.decoding = 'async'; im.setAttribute('data-pack-icon', def.icon); ic.appendChild(im); h.appendChild(ic);
    h.appendChild(el('span', 'chapter-n', dict.chapter));
    var hd = el('div'); hd.appendChild(el('div', 's-kicker', dict.kicker)); hd.appendChild(el('h2', null, def.title)); h.appendChild(hd);
    return h;
  }
  function capFig(cls, key, alt, ui) {
    var f = el('figure', cls); f.setAttribute('data-img', key); f.appendChild(tierPic(key, alt)); var tm = TIER_IMG[key] || {}; f.appendChild(el('figcaption', 'it-vis-cap', tm.official ? (ui.imagery || ui.render) : ui.render)); return f;
  }
  function renderTiers(def, dict) {
    var ui = dict.ui, isAr = lang() === 'ar';
    var mapWrap = el('figure', 'it-hero-map it-hero-map--empty'); mapWrap.setAttribute('aria-hidden', 'true'); /* v1.4.5/v1.4.7: map-uae-arcs.jpg was never shipped — decorative figure kept empty (CSS ground only), no <img> */
    var grid = el('div', 'it-tiers grow'); grid.setAttribute('data-testid', 'tier-columns');
    def.tiers.forEach(function (t) {
      var col = el('article', 'it-tier it-tier--' + t.key); col.setAttribute('data-src', t.src); col.setAttribute('data-tier', t.key);
      col.appendChild(capFig('it-product', t.visual, t.visualAlt, ui));
      var top = el('div', 'it-tier-top');
      var kr = el('div', 'it-tier-kickrow'); kr.appendChild(el('span', 's-kicker it-tier-kicker', t.kicker)); kr.appendChild(el('span', 'it-chip', t.chip)); top.appendChild(kr);
      top.appendChild(el('h3', 'it-tier-name', t.name));
      var fl = el('p', 'it-tier-flag'); fl.appendChild(el('span', null, t.place)); fl.appendChild(el('strong', 'it-amount', t.amount)); top.appendChild(fl);
      if (t.flagship) top.appendChild(el('p', 'it-tier-flagship', t.flagship));
      col.appendChild(top);
      var dl = el('p', 'it-delivered'); dl.appendChild(el('strong', null, ui.delivered + ': ')); dl.appendChild(document.createTextNode(t.delivered)); col.appendChild(dl);
      if (t.partners) {
        var pr = el('div', 'it-partners'); pr.setAttribute('data-testid', 'technology-partner-marks'); pr.appendChild(el('div', 's-kicker it-partners-label', ui.partnersLabel));
        var row = el('div', 'it-partner-row');
        t.partners.forEach(function (p) {
          if (p.logo && TIER_IMG[p.logo]) { var lg = el('span', 'it-partner-logo'); lg.setAttribute('data-mark', p.key); lg.appendChild(img(tierImg(p.logo), p.alt)); row.appendChild(lg); }
          else { var wd = el('span', 'it-partner-word'); wd.setAttribute('data-mark', p.key); wd.textContent = p.name; row.appendChild(wd); }
        });
        pr.appendChild(row); col.appendChild(pr);
      }
      var band = el('div', 'it-impact'); band.setAttribute('data-testid', 'impact-band');
      var oc = el('p', 'it-outcomes'); oc.appendChild(el('strong', null, ui.outcomes + ': ')); oc.appendChild(document.createTextNode(t.outcomes)); band.appendChild(oc);
      var wr = el('div', 'it-wbrow'); wr.appendChild(el('span', 'it-wblabel', t.wb.country));
      t.wb.tags.forEach(function (g) { wr.appendChild(el('span', 'it-wbtag', g)); });
      band.appendChild(wr);
      col.appendChild(band);
      grid.appendChild(col);
    });
    /* v1.4.0 WP2 — everything above this line is unchanged; the band below the tier cards is rebuilt */
    var own = el('div', 'it-ownband it-ownband--v140'); own.setAttribute('data-testid', 'ownership-callout'); own.setAttribute('data-src', def.ownership.src);
    var copy = el('div', 'it-ownband-copy');
    copy.appendChild(el('span', 'it-ownband-label', def.ownership.label));
    var ot = el('p', 'it-ownband-text'); ot.appendChild(el('strong', null, def.ownership.lead + ' ')); ot.appendChild(document.createTextNode(def.ownership.text)); copy.appendChild(ot);
    own.appendChild(copy);
    var bn = el('figure', 'it-own-banner'); bn.setAttribute('data-img', 'plate5-composited'); bn.setAttribute('data-testid', 'ownership-banner');
    var bp = el('picture'); var bs = el('source'); bs.type = 'image/webp'; bs.srcset = '/assets/plates/plate5-banner.webp'; bp.appendChild(bs); bp.setAttribute('data-provenance', 'Athar Brand Asset Pack v3 04_Imagery/athar_imagery_inclusive_triptych_v2.jpg (v1.4.7)');
    var bi = img('/assets/plates/plate5-banner.png', isAr ? 'تسليم الملكية — شريط عريض من صور هوية أثر الرسمية (اللوحة الثلاثية الشاملة، حزمة أصول العلامة v3)' : 'Ownership handover — wide band from the official Athar brand imagery (inclusive triptych, Brand Asset Pack v3)'); bi.loading = 'lazy'; bi.title = 'Concept render — Plate 5 (ownership handover); official Athar horizontal logo composited into the blank wall nameplate (perspective warp, multiply blend); credits in dist/assets/plates/credits.json'; bp.appendChild(bi); bn.appendChild(bp);
    bn.appendChild(el('figcaption', 'it-vis-cap it-vis-cap--band', ui.renderTag));
    own.appendChild(bn);
    return [mapWrap, grid, own];
  }
  function newsCard(n, ui, tierLabel) {
    var isAr = lang() === 'ar';
    var head = isAr && n.headlineAr ? n.headlineAr : n.headline, pub = isAr && n.publisherAr ? n.publisherAr : n.publisher;
    var a = link(n.url, '', 'it-news news-card'); a.setAttribute('data-news-id', n.id); a.setAttribute('data-tier', n.tier); a.setAttribute('aria-label', pub + ' — ' + head + ' ' + ui.opensNew); a.title = pub + ' · ' + n.date;
    if (n.flagged) { a.setAttribute('data-flagged', 'true'); a.title = a.title + ' — ' + ui.flaggedNote; }
    if (n.alternate) a.setAttribute('data-alternate', n.alternate);
    var ext = el('span', 'it-news-ext'); ext.setAttribute('aria-hidden', 'true'); ext.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" focusable="false"><path d="M6 3h7v7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 3 4 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'; a.appendChild(ext);
    var th = el('span', 'it-news-mark it-news-mark--' + n.markKind + (n.markDark ? ' it-news-mark--dark' : '')); th.setAttribute('data-mark', n.mark || 'typographic');
    if (n.mark) { th.appendChild(img('/assets/news/marks/' + n.mark, n.markName + ' — mark shown for reference only')); } else { var tw = el('span', 'it-news-markword', n.markName); tw.setAttribute('lang', 'en'); th.appendChild(tw); }
    a.appendChild(th);
    var body = el('span', 'it-news-body');
    var pr = el('span', 'it-news-pub'); pr.appendChild(el('span', 'it-news-pubname', pub)); pr.appendChild(el('span', 'it-news-date', isAr && n.dateAr ? n.dateAr : n.date)); body.appendChild(pr);
    body.appendChild(el('span', 'it-news-head', head));
    var foot = el('span', 'it-news-foot');
    foot.appendChild(el('span', 'it-tag it-tag--' + (n.tag === 'direct' ? 'direct' : 'related'), n.tag === 'direct' ? ui.direct : ui.related));
    foot.appendChild(el('span', 'it-tierchip', tierLabel));
    body.appendChild(foot);
    a.appendChild(body); return a;
  }
  function renderBody(def, dict) {
    var ui = dict.ui, isAr = lang() === 'ar';
    var body = el('div', 's-body');
    var rule = el('span', 'trace-rule'); rule.setAttribute('aria-hidden', 'true'); body.appendChild(rule);
    body.appendChild(head(def, dict));
    if (def.sub) body.appendChild(el('p', 'sub', def.sub));
    if (def.tiers) { var parts = renderTiers(def, dict); body.classList.add('it-body--tiers'); body.appendChild(parts[0]); body.appendChild(parts[1]); body.appendChild(parts[2]); }
    if (def.cards) {
      var cards = el('div', 'it-cards');
      def.cards.forEach(function (c) {
        var card;
        if (c.photo) { /* v1.4.7: the whole card is one link to the canonical source (keyboard-focusable, visible focus ring) */
          card = el('a', 'it-card it-card--link'); card.href = c.photo.href; card.target = '_blank'; card.rel = 'noopener noreferrer'; card.setAttribute('data-testid', 'it-card-lebanon');
          card.setAttribute('aria-label', c.tier + ' — ' + ui.openSource + ' ' + ui.opensNew);
        } else { card = el('div', 'it-card'); }
        card.setAttribute('data-src', c.src);
        var ci = el('span', 'it-card-icon'); ci.setAttribute('aria-hidden', 'true'); var cim = el('img'); cim.src = c.icon; cim.alt = ''; cim.width = 256; cim.height = 256; cim.decoding = 'async'; ci.appendChild(cim); card.appendChild(ci);
        card.appendChild(el('h3', null, c.tier));
        if (c.photo) {
          var fig = el('figure', 'it-card-photo'); fig.setAttribute('data-provenance', c.photo.href);
          var pic = el('picture'); var ws = el('source'); ws.type = 'image/webp'; ws.srcset = c.photo.webp; pic.appendChild(ws);
          var pi = el('img'); pi.src = c.photo.jpg; pi.alt = c.photo.alt; pi.width = c.photo.w; pi.height = c.photo.h; pi.decoding = 'async'; pi.loading = 'lazy'; pi.setAttribute('data-no-mirror', 'true'); pic.appendChild(pi); fig.appendChild(pic);
          fig.appendChild(el('figcaption', 'it-card-photo-cap', c.photo.caption)); card.appendChild(fig);
        }
        var ul = el('ul', 'bullets it-card-list'); c.items.forEach(function (s) { ul.appendChild(el('li', null, s)); }); card.appendChild(ul);
        if (c.photo) { var nt = el('p', 'it-card-note', ui.photoNote); card.appendChild(nt); }
        cards.appendChild(card);
      });
      body.appendChild(cards);
      if (def.agreement) { var ag = el('p', 'it-band it-agreement'); ag.setAttribute('data-testid', 'agreement-band'); ag.setAttribute('data-src', def.agreementSrc); ag.appendChild(el('strong', null, ui.agreement + ': ')); ag.appendChild(document.createTextNode(def.agreement)); body.appendChild(ag); }
      var strip = el('div', 'it-newsstrip'); strip.setAttribute('data-testid', 'news-strip');
      strip.appendChild(el('div', 's-kicker it-news-label', ui.news));
      var cols = el('div', 'it-news-cols it-news-grid'); cols.setAttribute('data-v152', 'grid-4x2'); /* v1.5.2: non-scrolling 4 × 2 grid, no per-tier columns */
      var chips = {}; def.newsGroups.forEach(function (g) { chips[g.tier] = g.chip; });
      NEWS.slice(0, 8).forEach(function (n) { cols.appendChild(newsCard(n, ui, chips[n.tier] || n.tier)); });
      strip.appendChild(cols); body.appendChild(strip);
    }
    if (def.wall) {
      var wall = el('div', 'it-wall'); wall.setAttribute('data-testid', 'delivered-with-wall'); wall.setAttribute('data-review', 'internal-only');
      ['actors', 'funders'].forEach(function (g) {
        var grp = el('div', 'it-wall-group it-wall-group--' + g);
        grp.appendChild(el('div', 's-kicker it-wall-label', def.groups[g]));
        var row = el('div', 'it-wall-row it-wall-row--' + g); row.setAttribute('data-testid', g + '-row');
        WALL.filter(function (w) { return w.group === g; }).forEach(function (w) {
          var m = MARKS[w.mark];
          var tile = el('figure', 'tile it-tile ' + (m.src ? 'tile--img' : 'tile--text')); tile.setAttribute('data-actor', w.mark);
          if (m.src) {
            if (m.dark) tile.classList.add('it-tile--dark');
            var sp = el('span', 'pmark pmark--img pmark--' + w.mark + ' pmark--md');
            var mi = el('img'); mi.src = m.src; if (m.w) { mi.width = m.w; mi.height = m.h; } mi.loading = 'eager'; mi.decoding = 'async'; mi.setAttribute('data-review', 'internal-only'); mi.setAttribute('data-no-mirror', 'true');
            mi.alt = isAr ? m.nameAr + ' — علامة معروضة للمراجعة الداخلية فقط' : m.name + ' — mark shown for internal review only, not authorised for external use';
            sp.appendChild(mi); tile.appendChild(sp);
            tile.appendChild(el('figcaption', 'it-tile-cap', isAr ? m.nameAr : m.name));
          } else {
            var tx = el('span', 'pmark pmark--text pmark--md it-wordmark'); tx.setAttribute('lang', lang());
            tx.appendChild(el('span', 'pmark-name', isAr ? m.nameAr : m.name));
            tx.appendChild(el('span', 'pmark-full it-pending', ui.pending));
            tile.appendChild(tx);
            tile.appendChild(el('figcaption', 'it-tile-cap', isAr ? m.nameAr : m.name));
          }
          if (w.sub) tile.appendChild(el('figcaption', 'it-tile-sub', isAr ? w.subAr : w.sub));
          if (w.src) tile.setAttribute('data-src', w.src);
          row.appendChild(tile);
        });
        grp.appendChild(row); wall.appendChild(grp);
      });
      body.appendChild(wall);
      if (def.execPhoto) { /* v1.5.2 close-out: Redington signing photograph — one <img> (alt only), one caption, one source line */
        var ep = def.execPhoto; var efig = el('figure', 'it-exec'); efig.setAttribute('data-testid', 'exec-photo-' + ep.id); efig.setAttribute('data-v152', 'exec-photo'); efig.setAttribute('data-provenance', ep.url);
        var epic = el('picture'); var ews = el('source'); ews.type = 'image/webp'; ews.srcset = ep.webp; epic.appendChild(ews);
        var eim = el('img'); eim.src = ep.jpg; eim.alt = ep.alt; eim.width = ep.w; eim.height = ep.h; eim.decoding = 'async'; eim.loading = 'eager'; eim.setAttribute('data-no-mirror', 'true'); epic.appendChild(eim);
        var eph = el('div', 'it-exec-photo'); eph.appendChild(epic); efig.appendChild(eph);
        var efc = el('figcaption', 'it-exec-text'); efc.appendChild(el('div', 's-kicker it-exec-kicker', ep.kicker));
        var ehl = el('a', 'it-exec-headline', ep.headline); ehl.href = ep.url; ehl.target = '_blank'; ehl.rel = 'noopener noreferrer'; efc.appendChild(ehl);
        efc.appendChild(el('p', 'it-exec-cap', ep.caption));
        var esrc = el('p', 'it-exec-src muted small'); var esa = el('a', 'it-exec-srclink', ep.source + ' ↗'); esa.href = ep.url; esa.target = '_blank'; esa.rel = 'noopener noreferrer'; esa.setAttribute('aria-label', ep.source + ' ' + ep.opensNew); esrc.appendChild(esa); efc.appendChild(esrc);
        efig.appendChild(efc); body.appendChild(efig);
      }
      var band = el('div', 'it-band it-reviewband'); band.setAttribute('data-testid', 'review-band');
      var rv = el('p', 'it-review'); rv.appendChild(el('span', 'it-review-badge', ui.reviewBadge)); rv.appendChild(document.createTextNode(ui.reviewText)); band.appendChild(rv);
      body.appendChild(band);
    }
    if (def.bullets && def.tiers) { /* v1.4.0 WP2: the tier-progression bullet as its own full-width gold-dot row */
      def.bullets.forEach(function (b) { var row = el('p', 'it-progress-row'); row.setAttribute('data-testid', 'tier-progression'); row.setAttribute('data-src', b[1]); var dot = el('span', 'it-dot'); dot.setAttribute('aria-hidden', 'true'); row.appendChild(dot); row.appendChild(el('span', 'it-progress-text', b[0])); body.appendChild(row); });
    } else if (def.bullets) {
      var ul2 = el('ul', 'bullets'); def.bullets.forEach(function (b) { var li = el('li', null, b[0]); li.setAttribute('data-src', b[1]); ul2.appendChild(li); }); body.appendChild(ul2);
    }
    if (def.endorse) {
      var en = el('p', 'it-endorse'); en.setAttribute('data-testid', 'endorsement-line');
      var a = el('span', 'it-endorse-ar', def.endorse.ar); a.setAttribute('lang', 'ar'); a.setAttribute('dir', 'rtl');
      var b2 = el('span', 'it-endorse-en', def.endorse.en); b2.setAttribute('lang', 'en');
      en.appendChild(a); en.appendChild(el('span', 'it-endorse-sep', '·')); en.appendChild(b2);
      body.appendChild(en);
    }
    if (!def.wall) {
      if (def.tiers) { /* v1.4.0 WP2: two tidy lines on a solid cream backing */
        var fn = el('div', 'it-footnotes it-footnotes--backed'); fn.setAttribute('data-testid', 'tier-footnotes');
        fn.appendChild(el('p', 'muted small it-footnote', ui.wbShort + ' · ' + SRC + (isAr ? '؛ الأرقام أهداف توضيحية من الورقة (ص 3).' : '; figures are the paper’s illustrative targets (p. 3).')));
        fn.appendChild(el('p', 'muted small it-footnote', ui.tm2));
        body.appendChild(fn);
      } else if (def.cards) {
        var fn2 = el('div', 'it-footnotes'); fn2.setAttribute('data-testid', 'news-footnotes');
        fn2.appendChild(el('p', 'muted small it-footnote', dict.srcNote));
        fn2.appendChild(el('p', 'muted small it-footnote', ui.tm));
        body.appendChild(fn2);
      } else {
        body.appendChild(el('p', 'muted small', def.note ? def.note + ' ' + dict.srcNote : dict.srcNote));
      }
    }
    return body;
  }

  var sections = [];
  function ensureSections() {
    var closing = document.getElementById('s-closing');
    if (!closing || !closing.parentNode) return false;
    if (sections.length) return true;
    var dict = L[lang()];
    dict.slides.forEach(function (def, i) {
      var sec = el('section', 'slide text is-after it-slide it-slide--' + def.id);
      sec.id = 's-' + def.id; sec.setAttribute('data-n', String(ANCHOR + i + 1)); sec.setAttribute('data-it-index', String(i + 1)); sec.setAttribute('aria-hidden', 'true'); sec.setAttribute('aria-label', def.title);
      var bg = el('div', 'slide-bg slide-bg--pattern'); bg.setAttribute('aria-hidden', 'true'); bg.appendChild(el('div', 'pattern-band')); sec.appendChild(bg);
      sec.appendChild(renderBody(def, dict));
      closing.parentNode.insertBefore(sec, closing);
      sections.push(sec);
    });
    EXT.forEach(function (ext, j) { /* v1.4.0: slides registered by athar-os.js */
      var i = N_IT + j;
      var sec = el('section', 'slide text is-after it-slide aos-slide aos-slide--' + ext.id);
      sec.id = 's-' + ext.id; sec.setAttribute('data-n', String(ANCHOR + i + 1)); sec.setAttribute('data-it-index', String(i + 1)); sec.setAttribute('aria-hidden', 'true'); sec.setAttribute('aria-label', ext.title[lang()]);
      var bg = el('div', 'slide-bg slide-bg--pattern'); bg.setAttribute('aria-hidden', 'true'); bg.appendChild(el('div', 'pattern-band')); sec.appendChild(bg);
      try { sec.appendChild(ext.render(lang(), API)); } catch (e) { sec.appendChild(el('div', 's-body', ext.title[lang()])); }
      closing.parentNode.insertBefore(sec, closing);
      sections.push(sec);
    });
    return true;
  }
  /* ---------- v1.4.0: helper API handed to extension slides ---------- */
  var API = { el: el, img: img, lang: lang, link: link, enter: function (k) { enter(k); }, exit: function () { exit(); }, anchor: ANCHOR, total: function () { return TOTAL; }, nIt: N_IT,
    head: function (num, kicker, icon, title, sub) {
      var body = el('div', 's-body'); var rule = el('span', 'trace-rule'); rule.setAttribute('aria-hidden', 'true'); body.appendChild(rule);
      body.appendChild(head({ icon: icon || 'automation', title: title }, { chapter: num, kicker: kicker }));
      if (sub) body.appendChild(el('p', 'sub', sub));
      return body;
    },
    isActive: function (sec) { return sec.classList.contains('is-active'); } };
  /* ---------- v1.4.0: rail entries (07 Impact & funding · 08 Athar OS) + Esc-overview tiles ---------- */
  var RAIL = { en: [{ n: '07', title: 'Impact & funding', k: 1 }, { n: '08', title: 'Athar OS', k: N_IT + 1 }], ar: [{ n: '07', title: 'الأثر والتمويل', k: 1 }, { n: '08', title: 'أثر OS', k: N_IT + 1 }] };
  function syncRail() {
    var ol = document.querySelector('nav.rail ol'); if (!ol) return;
    var l = lang(), items = RAIL[l];
    if (!EXT.length) items = items.slice(0, 1);
    var mine = ol.querySelectorAll('li[data-virtual-chapter]');
    if (mine.length !== items.length || (mine[0] && mine[0].getAttribute('data-lang') !== l)) {
      Array.prototype.forEach.call(mine, function (li) { li.remove(); });
      items.forEach(function (it) {
        var li = el('li'); li.setAttribute('data-virtual-chapter', it.n); li.setAttribute('data-lang', l);
        var a = el('a'); a.href = '#/' + ANCHOR + '/new-' + it.k; a.setAttribute('data-chapter', it.n === '07' ? 'impact' : 'atharos');
        a.addEventListener('click', function (ev) { ev.preventDefault(); if (realN() !== ANCHOR) { setHash('#/' + ANCHOR); window.dispatchEvent(new HashChangeEvent('hashchange')); window.setTimeout(function () { enter(it.k); }, 0); } else { enter(it.k); } });
        a.appendChild(el('span', 'rail-n', it.n)); a.appendChild(el('span', null, it.title)); li.appendChild(a); ol.appendChild(li);
      });
    }
    var cur = v ? (v <= N_IT ? '07' : '08') : null;
    Array.prototype.forEach.call(ol.children, function (li) {
      var mineN = li.getAttribute('data-virtual-chapter');
      if (mineN) li.classList.toggle('is-current', mineN === cur);
      else if (cur) li.classList.remove('is-current');
    });
  }
  function syncOverview() {
    var grid = document.querySelector('.overview .overview-grid'); if (!grid) return;
    var cards = grid.querySelectorAll('button.ov-card:not([data-virtual])'); if (cards.length !== REAL_TOTAL) return;
    var closingCard = cards[REAL_TOTAL - 1], l = lang();
    var cn = closingCard.querySelector('.ov-n'); if (cn && cn.textContent !== String(TOTAL)) cn.textContent = String(TOTAL);
    var mine = grid.querySelectorAll('button.ov-card[data-virtual]');
    if (mine.length !== N || (mine[0] && mine[0].getAttribute('data-lang') !== l)) {
      Array.prototype.forEach.call(mine, function (b) { b.remove(); });
      var titles = L[l].slides.map(function (s) { return s.title; }).concat(EXT.map(function (e) { return e.title[l]; }));
      titles.forEach(function (t, i) {
        var b = el('button', 'ov-card'); b.type = 'button'; b.setAttribute('data-virtual', String(i + 1)); b.setAttribute('data-lang', l);
        b.appendChild(el('span', 'ov-n', String(ANCHOR + i + 1))); b.appendChild(document.createTextNode(t));
        b.addEventListener('click', function () {
          var close = document.querySelector('.overview button.ctl-btn'); if (close) close.click();
          if (realN() !== ANCHOR) { setHash('#/' + ANCHOR); window.dispatchEvent(new HashChangeEvent('hashchange')); }
          window.setTimeout(function () { enter(i + 1); }, 0);
        });
        grid.insertBefore(b, closingCard);
      });
    }
    Array.prototype.forEach.call(grid.querySelectorAll('button.ov-card[data-virtual]'), function (b) { b.classList.toggle('on', parseInt(b.getAttribute('data-virtual'), 10) === v); });
    if (v) Array.prototype.forEach.call(grid.querySelectorAll('button.ov-card:not([data-virtual])'), function (b) { b.classList.remove('on'); });
  }
  function relabel() {
    var dict = L[lang()];
    sections.forEach(function (sec, i) {
      var old = sec.querySelector(':scope > .s-body'); if (old) old.remove();
      if (i < N_IT) { sec.setAttribute('aria-label', dict.slides[i].title); sec.appendChild(renderBody(dict.slides[i], dict)); }
      else { var ext = EXT[i - N_IT]; sec.setAttribute('aria-label', ext.title[lang()]); try { sec.appendChild(ext.render(lang(), API)); } catch (e) { sec.appendChild(el('div', 's-body', ext.title[lang()])); } }
    });
    /* v1.4.7: a language switch re-renders every extension slide body, which drops their mounted state (e.g. the slide-35 product tour) —
       re-fire onShow for the slide currently on stage so it mounts again; before this an AR deep link into slide 35 (bundle boots in EN,
       then switches to AR) left the tour panel empty until the user changed tabs */
    if (v) sections.forEach(function (sec, i) { var ext = EXT[i - N_IT]; if (ext && ext.onShow) { try { ext.onShow(sec, i + 1 === v, lang()); } catch (e) {} } });
    updateCounter();
  }

  /* ---------- state ---------- */
  var v = 0;
  function realN() { var a = document.querySelector('#root section.slide.is-active:not(.it-slide)'); return a ? parseInt(a.getAttribute('data-n'), 10) : 0; }
  function setHash(h) { if (window.location.hash !== h) window.history.replaceState(null, '', h); }
  function show(k) {
    v = k;
    document.body.classList.toggle('it-virtual', k > 0);
    sections.forEach(function (sec, i) {
      var idx = i + 1, cls = idx === k ? 'is-active' : idx < k || k === 0 && realN() > ANCHOR ? 'is-before' : 'is-after';
      sec.classList.remove('is-active', 'is-before', 'is-after'); sec.classList.add(cls);
      sec.setAttribute('aria-hidden', idx === k ? 'false' : 'true');
    });
    if (k > 0) setHash('#/' + ANCHOR + '/new-' + k);
    updateCounter();
    sections.forEach(function (sec, i) { var ext = EXT[i - N_IT]; if (ext && ext.onShow) { try { ext.onShow(sec, i + 1 === k, lang()); } catch (e) {} } });
    syncRail(); syncOverview();
  }
  function enter(k) { if (!ensureSections()) return; show(Math.max(1, Math.min(N, k))); }
  function exit() { if (v) show(0); }
  function updateCounter() {
    var c = document.querySelector('footer.pagefooter .counter'); if (!c) return;
    var r = realN(), n = v ? ANCHOR + v : (r >= REAL_TOTAL ? TOTAL : r);
    if (!n) return;
    var txt = L[lang()].counter(n, TOTAL);
    if (c.textContent !== txt) c.textContent = txt;
    var dv = document.querySelector('footer.pagefooter .deck-version'); if (dv && dv.textContent !== VERSION) dv.textContent = VERSION;
  }

  /* ---------- navigation interception ---------- */
  function goNext(ev) { var r = realN(); if (v) { if (v < N) { enter(v + 1); stop(ev); } else { exit(); } return; } if (r === ANCHOR) { enter(1); stop(ev); } }
  function goPrev(ev) { var r = realN(); if (v) { if (v > 1) { enter(v - 1); } else { exit(); } stop(ev); return; } if (r === REAL_TOTAL) { stop(ev); setHash('#/' + ANCHOR); window.dispatchEvent(new HashChangeEvent('hashchange')); window.setTimeout(function () { enter(N); }, 0); } }
  function stop(ev) { if (ev) { ev.preventDefault(); ev.stopImmediatePropagation(); ev.stopPropagation(); } }
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('button.arrow') : null; if (!t) return;
    if (t.classList.contains('next')) goNext(ev); else if (t.classList.contains('prev')) goPrev(ev);
  }, true);
  window.addEventListener('keydown', function (ev) {
    var tg = ev.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
    if (tg && tg.closest && tg.closest('[data-keys="own"]')) return; /* v1.4.0: widgets that own their keys (tour app, layer stack, chips, steppers) — athar-os.js stops these keys at document level so the bundle router never sees them */
    if (document.querySelector('.overview')) return;
    var rtl = document.documentElement.dir === 'rtl';
    var k = ev.key, next = k === (rtl ? 'ArrowLeft' : 'ArrowRight') || k === 'PageDown' || k === ' ' || k === 'Spacebar',
        prev = k === (rtl ? 'ArrowRight' : 'ArrowLeft') || k === 'PageUp' || k === 'Backspace';
    if (next) goNext(ev); else if (prev) goPrev(ev); else if (k === 'Home' || k === 'End') exit(); /* v1.4.0: Escape no longer leaves the virtual slide — the React overview opens over it and the current tile is highlighted by syncOverview() */
  }, true);
  window.addEventListener('hashchange', function () {
    var h = window.location.hash;
    if (v && !/^#\/27(\/new-\d+)?$/.test(h)) exit();
    var m = /^#\/27\/new-(\d+)$/.exec(h); if (m && parseInt(m[1], 10) !== v) enter(parseInt(m[1], 10));
  });

  /* ---------- observers ---------- */
  var root = document.getElementById('root'), pending = false, lastLang = null;
  function tick() {
    pending = false;
    var l = lang();
    if (!ensureSections()) return;
    tryDeep();
    if (v && window.location.hash === '#/' + ANCHOR) setHash('#/' + ANCHOR + '/new-' + v); /* v1.4.7: the bundle's boot-time hash normalisation can land after enter(); keep the deep link shareable */
    if (lastLang !== null && lastLang !== l) relabel();
    lastLang = l;
    var rn = realN(); if (v && rn && rn !== ANCHOR) exit(); /* v1.4.7: only a DIFFERENT real slide leaves the virtual section; rn === 0 is the bundle re-rendering its slide list (language switch) and must not eject the visitor */
    updateCounter(); syncRail(); syncOverview();
  }
  function schedule() { if (pending) return; pending = true; window.requestAnimationFrame(function () { try { tick(); } catch (e) { /* keep the deck alive */ } }); }
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
  var m0 = /^#\/27\/new-(\d+)$/.exec(initialHash);
  /* v1.4.7: deep links into the runtime slides used to be abandoned after 200 × 25 ms = 5 s — on a slow connection the bundle had not yet
     rendered slide 27 by then and the visitor was left on slide 27 (the 2026-09-29 live verification hit this twice). The pending deep link
     now survives for up to 60 s and is also retried from every DOM/lang tick, but is dropped the moment the hash changes. */
  var pendingDeep = m0 ? parseInt(m0[1], 10) : 0;
  var deepStable = 0;
  function tryDeep() {
    if (!pendingDeep) return;
    var h = window.location.hash;
    if (h !== initialHash && h !== '#/' + ANCHOR && h !== '#/' + String(ANCHOR).padStart(2, '0')) { pendingDeep = 0; return; } /* the bundle itself normalises the hash to #/27 while booting — only a navigation elsewhere cancels the deep link */
    if (v === pendingDeep) { if (++deepStable > 4) pendingDeep = 0; return; } /* shown and stable across several ticks → done; a transient exit() during the bundle's language re-render re-enters below */
    deepStable = 0;
    if (ensureSections() && realN() === ANCHOR) enter(pendingDeep);
  }
  if (m0) { var tries = 0, iv = window.setInterval(function () { tries++; tryDeep(); if (!pendingDeep || tries > 2400) window.clearInterval(iv); }, 25); }
  schedule();
  window.AtharImpactTiers = { version: VERSION, total: TOTAL, extCount: EXT.length, current: function () { return v ? ANCHOR + v : realN() === REAL_TOTAL ? TOTAL : realN(); }, go: enter, exit: exit, virtualIndex: function () { return v; } };
})();
