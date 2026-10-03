/* Athar Open Agentic Pact deck — v1.5.2 (2026-09-30): slide 38 tabs completed (evidence links, brand banner, 16:9 inset, tightened timeline), slide 36 status tooltip fixed and keyframe filmstrip removed, milestone labels wrap to two lines.
   v1.4.0 (2026-09-27) section 08 "Athar OS — an agentic harness that empowers nations".
   Runtime module in the v1.2.x lineage (React/TS sources are 0-byte after the platform restore, so the built deck is
   extended at runtime). Registers FIVE virtual slides with the virtual-slide host in /js/impact-tiers.js (loaded after
   this file): window.AtharOS.slides = [S1 Overview + layered harness diagram, S2 Product tour (four lazy-loaded tabs
   under /js/tour/), S3 Roadmap timeline, S4 Deploy anywhere / own it, S5 Nations empowered]. The host renders them as
   slides 34–38 (Closing becomes 39 of 39), adds the rail entries 07 Impact & funding / 08 Athar OS, the Esc-overview
   tiles and the deep links #/27/new-7 … new-11. Fully bilingual (EN/AR, RTL through logical properties; images carry
   data-no-mirror). Every figure quoted here comes from earlier slides of this deck (six pillars, community model, three
   impact tiers paper) or the World Bank WDI tags already on slide 29; roadmap items without a deck source are
   labelled "target". Plates are text-free concept renders tagged "Concept render"; plates 1 and 5 carry the OFFICIAL
   Athar logo composited programmatically (dist/assets/plates/credits.json). */
(function () {
  'use strict';
  var VERSION = 'v1.5.9';
  var PLEDGE_HASH = '#/19'; /* 04 Pledge & signing — first slide of the chapter */

  /* ---------- helpers ---------- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function img(src, alt, cls) { var i = el('img', cls); i.src = src; i.alt = alt || ''; i.decoding = 'async'; i.loading = 'lazy'; i.setAttribute('data-no-mirror', 'true'); return i; }
  function svgEl(name, attrs) { var e = document.createElementNS('http://www.w3.org/2000/svg', name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  var STILL_MAP = { 'plate2-ai-pc-container': 'kf-0673.png', 'plate6-kenya-maize': 'kf-1682.png', 'plate5-composited': 'kf-1178.png' }; /* v1.4.1: extracted product-film stills replace the v1.4.0 concept-render plates */
  function plate(base, alt, tag, cls, thumb) {
    var R = window.AtharTourReal, L = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    if (R) {
      if (base === 'plate1-composited' || base === 'plate3-builders-canvas') { var vf = R.video(cls, L); vf.setAttribute('data-plate', base); return vf; }
      if (STILL_MAP[base]) { var sf = R.still(STILL_MAP[base], alt, cls, L); sf.setAttribute('data-plate', base); return sf; }
    }
    var f = el('figure', 'aos-plate' + (cls ? ' ' + cls : '')); f.setAttribute('data-plate', base);
    var p = el('picture'); var i = img('/assets/tour/video/athar-os-launch-30s-poster.jpg', alt); i.width = 1920; i.height = 1080; p.appendChild(i); f.appendChild(p);
    f.appendChild(el('figcaption', 'aos-tag', tag)); return f;
  }
  function btn(cls, text, attrs) { var b = el('button', cls, text); b.type = 'button'; if (attrs) for (var k in attrs) b.setAttribute(k, attrs[k]); return b; }
  function reduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function roving(list, onMove, orient) {
    /* arrow-key navigation among a list of buttons (roving tabindex; Home/End supported; RTL-aware) */
    list.forEach(function (b, i) { b.setAttribute('tabindex', i === 0 ? '0' : '-1'); b.setAttribute('data-keys', 'own'); });
    list.forEach(function (b, i) {
      b.addEventListener('keydown', function (ev) {
        var rtl = document.documentElement.dir === 'rtl', k = ev.key, j = -1;
        var next = orient === 'v' ? 'ArrowDown' : (rtl ? 'ArrowLeft' : 'ArrowRight'), prev = orient === 'v' ? 'ArrowUp' : (rtl ? 'ArrowRight' : 'ArrowLeft');
        if (k === ' ' || k === 'Spacebar' || k === 'Enter') { ev.preventDefault(); ev.stopPropagation(); b.click(); return; }
        if (k === next) j = (i + 1) % list.length; else if (k === prev) j = (i - 1 + list.length) % list.length; else if (k === 'Home') j = 0; else if (k === 'End') j = list.length - 1; else return;
        ev.preventDefault(); ev.stopPropagation();
        list.forEach(function (x, m) { x.setAttribute('tabindex', m === j ? '0' : '-1'); }); list[j].focus(); if (onMove) onMove(j);
      });
    });
  }
  function jumpLink(hash, text, lang) { var a = el('a', 'aos-jump', text); a.href = hash; a.setAttribute('data-deck-jump', hash); a.setAttribute('aria-label', (lang === 'ar' ? 'انتقل إلى ' : 'Go to ') + text); return a; }
  /* deep-link to a virtual slide: hash #/27/new-k is handled by the host */

  /* ---------- strings ---------- */
  var S = {
    en: {
      chapter: '08', kicker: 'Athar OS', tag: 'Concept render', tagCaps: 'CONCEPT RENDER', target: 'target', done: 'done', inprogress: 'in progress',
      s1: { title: 'Athar OS — an agentic harness that empowers nations', sub: 'One harness: nations, institutions, builders, agents, skills, plugins, licences and sovereign compute — governed by the pact.',
        heroAlt: 'National digital-government operations room running Athar OS — concept render with the official Athar monogram composited on the wall',
        diagramLabel: 'Layered harness — select a layer to expand it', where: 'Where in the deck', hint: 'Enter / Space to expand · ↑↓ to move between layers',
        layers: [
          { k: 'nation', t: 'Nation', s: 'A country signs the pact and hosts a national chapter', b: ['Country chapters bring the pact to life locally: a host institution, a country lead, an academy lead and a safeguarding focal point.', 'Outcomes are measured against a baseline by an independent evaluator, reported quarterly.', 'The asset is transferred to a national entity after 5–7 years; young local operators are trained and certified to run it.'], j: '#/07', jt: 'Slide 7 · Country chapters' },
          { k: 'institutions', t: 'Institutions', s: 'Ministries, schools, clinics and NGOs deploy through an accountable owner', b: ['Institution-led: every deployment has a named sponsor and an accountable owner.', 'Open where possible, governed where necessary — institutional data, private workspaces and audit logs stay controlled.', 'Three ways to deploy: software-only on the institution’s infrastructure, self-hosted in its cloud, or cloud-hosted by AIREV.'], j: '#/15', jt: 'Slide 15 · Open where possible, governed where necessary' },
          { k: 'builders', t: 'Community builders', s: 'An open community that learns, builds, validates and publishes', b: ['The builder journey: learn → prototype → evaluate → validate → deploy → publish.', 'Weekly office hours, quarterly challenges, monthly showcases and the annual summit.', 'Academy pathways certify practitioners, builders, administrators and trainers.'], j: '#/11', jt: 'Slide 11 · The builder journey and the agent marketplace' },
          { k: 'agents', t: 'Agents', s: 'Validated agents with a named maintainer and a stated intended use', b: ['Every published agent has a named maintainer, version history and a stated intended use.', 'Agents disclose data sources, tools, model dependencies and known limitations.', 'High-risk agents need institutional approval and extra testing before deployment.'], j: '#/11', jt: 'Slide 11 · Agent marketplace rules' },
          { k: 'skills', t: 'Skills', s: 'Reusable capabilities, built once and shared', b: ['A skill packages a capability so any validated agent can load and reuse it.', 'Skills pass through the same journey: prototype, evaluate, validate.', 'No-code pathways for practitioners; pro-code pathways for developers.'], j: '#/14', jt: 'Slide 14 · Reusable skills' },
          { k: 'plugins', t: 'Plugins', s: 'The connective tissue: one shared plugin standard', b: ['Agents reach tools, connectors, data sources and services only through plugins.', 'Every plugin is published, versioned and discoverable, with a disclosed intended use, owner and languages.', 'Plugins travel across models — switching providers never means rebuilding an institution’s toolset.'], j: '#/13', jt: 'Slide 13 · Plugins are the connective tissue' },
          { k: 'licences', t: 'Universal API licences', s: 'Procured and managed by Athar for the whole community', b: ['Athar procures and manages the API licences and keys the community needs; members call them from their agents.', 'Seat pools are named, time-bound and cannot transfer outside the programme.', 'The major API builders are on slide 17; the seat ladder lives in the appendix.'], j: '#/17', jt: 'Slide 17 · Universal API licences managed by Athar' },
          { k: 'compute', t: 'Sovereign compute', s: 'Data, models, agents, control plane and keys run where the nation decides', b: ['Option A/B/C: institution infrastructure, institution cloud, or AIREV-managed — same harness, different custody.', 'Data residency, key custody, audit logs and open-book costs are contract terms, not features.', 'Kenya: a Kenyan-owned modular node; certified local operators; transfer after 5–7 years.'], j: '#/27/new-2', jt: 'Slide 29 · Sovereign data-centre nodes' }
        ] },
      s2: { title: 'Product tour — the harness at work', sub: 'The actual Athar screens from Athar_Package.zip and Athar_Wireframes_and_Screens_v1 — Overview, Marketplace, Playground (empty, conversation) and Agent Flow Builder — at native 1440×900, light and dark, English and Arabic.',
        tabs: [{ k: 'overview', t: 'Overview' }, { k: 'marketplace', t: 'Marketplace' }, { k: 'playground-empty', t: 'Playground — empty' }, { k: 'playground-conversation', t: 'Playground — conversation' }, { k: 'flow', t: 'Agent Flow Builder' }],
        heroAlt: 'Community builders composing an agent flow on a touch canvas — concept render', langToggle: 'العربية', langToggleAria: 'Switch the tour to Arabic', themeLight: 'Light', themeDark: 'Dark', themeAria: 'Toggle light / dark theme', loading: 'Loading…', tourNote: 'Real product screens — Athar_Package.zip (05 Web & Product/UI_Screens, 2880×1800) and Athar_Wireframes_and_Screens_v1.pdf (27 September 2026); numbered hotspots carry the pack’s own captions. Nothing on this slide is a mockup.' },
      s3: { title: 'Roadmap — Now, Next, Later', sub: 'Five tracks from the pact, the community model and the three impact tiers; items without a deck source are marked “target”.',
        periods: [{ k: 'now', t: 'Now', s: 'Q4 2026' }, { k: 'next', t: 'Next', s: '2027' }, { k: 'later', t: 'Later', s: '2028' }],
        tracks: [{ k: 'platform', t: 'Platform' }, { k: 'community', t: 'Community & skills' }, { k: 'plugins', t: 'Plugins & universal APIs' }, { k: 'sovereign', t: 'Sovereign deployment' }, { k: 'impact', t: 'Impact & evaluation' }],
        all: 'All tracks', filterLabel: 'Filter by track', detailEmpty: 'Select a milestone to see what, why, source and status.', what: 'What', why: 'Why', source: 'Source', status: 'Status',
        status: { done: 'done', progress: 'in progress', target: 'target' },
        milestones: [
          { id: 'p1', track: 'platform', period: 'now', t: 'Skills pipeline: prototype → evaluate → validate', what: 'Skills pass through the same builder journey as agents.', why: 'A capability built once is reusable by every validated agent.', src: 'Slide 14 · Six pillars', j: '#/14', st: 'progress' },
          { id: 'p2', track: 'platform', period: 'now', t: 'Plugin standard v1 — published, versioned, discoverable', what: 'One shared plugin standard for tools, connectors, data sources and services.', why: 'Agents reach the outside world only through plugins.', src: 'Slide 13 · Six pillars', j: '#/13', st: 'progress' },
          { id: 'p3', track: 'platform', period: 'next', t: 'Cross-model plugin portability', what: 'Any model can call any other model’s plugins through the shared standard.', why: 'No institution is locked to one provider.', src: 'Slide 16 · Six pillars', j: '#/16', st: 'target' },
          { id: 'p4', track: 'platform', period: 'next', t: 'Playground + Agent Flow Builder GA', what: 'The four product screens of the tour become generally available.', why: 'Builders compose multi-agent flows on a canvas.', src: 'Wireframes v1 (27 Sep 2026)', j: '#/27/new-8', st: 'target' },
          { id: 'p5', track: 'platform', period: 'later', t: 'Athar OS for national nodes', what: 'The full harness packaged for sovereign compute.', why: 'One harness from a laptop to a national node.', src: 'target', j: '#/27/new-10', st: 'target' },
          { id: 'c1', track: 'community', period: 'now', t: 'Wave 1 chapters + Foundations pathway', what: 'UAE base plus two countries; Agentic AI Foundations published.', why: 'Local ownership within a shared model.', src: 'Slides 7 and 27 · Community model', j: '#/07', st: 'progress' },
          { id: 'c2', track: 'community', period: 'now', t: 'Founding cohort · weekly builder office hours', what: 'Days 31–60: open the founding cohort; start office hours and webinars.', why: 'Builders get weekly technical help.', src: 'Slide 27 · Roadmap', j: '#/27', st: 'progress' },
          { id: 'c3', track: 'community', period: 'next', t: '10,000 learners · 2,500 certified · 100 facilitators', what: 'Year-one Academy targets.', why: 'Interest becomes certified, applied capability.', src: 'Slide 18 · Six pillars', j: '#/18', st: 'target' },
          { id: 'c4', track: 'community', period: 'next', t: 'Ten chapters · Global Summit · annual report', what: 'Months 10–12 of the implementation roadmap.', why: 'Review outcomes, recognise builders, set the agenda.', src: 'Slide 27 · Roadmap', j: '#/27', st: 'target' },
          { id: 'c5', track: 'community', period: 'later', t: 'One Million Lebanese AI Experts — 18,000 in daily use', what: 'Access tier flagship: 1M citizens certified in generative AI.', why: 'Certificates issued, daily active users, ministry workflows live.', src: 'Slide 29 · Three impact tiers ($10M)', j: '#/27/new-2', st: 'target' },
          { id: 'a1', track: 'plugins', period: 'now', t: 'Universal API licences managed by Athar', what: 'Athar procures and manages the API licences and keys the community needs.', why: 'Members call them from their agents; nobody negotiates alone.', src: 'Slide 17 · Six pillars', j: '#/17', st: 'progress' },
          { id: 'a2', track: 'plugins', period: 'next', t: 'Marketplace review · revenue share for specialist agents', what: 'Validated agents published with a named maintainer; paid specialist agents may share revenue.', why: 'Public-good agents stay free; unsafe agents are suspended.', src: 'Slide 11 · Community model', j: '#/11', st: 'target' },
          { id: 'a3', track: 'plugins', period: 'later', t: 'Open plugin registry across institutions, countries and models', what: 'The same plugin standard everywhere.', why: 'Build once. Run everywhere.', src: 'Slide 13 · Six pillars', j: '#/13', st: 'target' },
          { id: 's1', track: 'sovereign', period: 'now', t: '30-day, 32-seat pilots · Option A/B/C', what: 'An institution proves value before a full licence; deploys software-only, self-hosted or cloud-hosted.', why: 'Sovereignty is a deployment choice, not a trade-off.', src: 'Slide 17 · appendix', j: '#/17', st: 'progress' },
          { id: 's2', track: 'sovereign', period: 'next', t: 'India: 100 government schools · 10,000 AI PCs', what: 'On-device AI tutoring in Hindi and the state language; teacher training; 8-person in-country team ($13.7M).', why: 'Ownership tier — the UAE–India CEPA gains an AI chapter.', src: 'Slide 29 · Three impact tiers', j: '#/27/new-2', st: 'target' },
          { id: 's3', track: 'sovereign', period: 'later', t: 'Kenya: Kenyan-owned sovereign node · transfer after 5–7 years', what: 'A modular data centre on sovereign compute (~$33M); Swahili voice advice for farmers; clinics and schools on the same node.', why: 'Legacy tier — the asset stays.', src: 'Slide 29 · Three impact tiers', j: '#/27/new-2', st: 'target' },
          { id: 'i0', track: 'impact', period: 'now', t: 'Pact proposal (24 Sep) · impact-tiers paper (27 Sep 2026)', what: 'The community proposal and the funding paper this deck draws on.', why: 'Every figure on slides 28–33 has a page reference.', src: 'Slide 28 · Outcomes are the product', j: '#/27/new-1', st: 'done' },
          { id: 'i1', track: 'impact', period: 'now', t: 'Gating items: licence field · open-book fees · independent evaluator', what: 'Extend Athar’s licence field; open-book fee policy with unspent funds returned; name an independent evaluator.', why: 'What foundation funding requires before it flows.', src: 'Slide 31 · Foundation-funding gating items', j: '#/27/new-4', st: 'progress' },
          { id: 'i2', track: 'impact', period: 'next', t: 'Quarterly outcome reports · first outcome & trust report', what: 'Baselines, telemetry, case studies and quarterly reporting.', why: 'Success is time saved, quality and reach — not agent counts.', src: 'Slides 27 and 30', j: '#/27/new-3', st: 'target' },
          { id: 'i3', track: 'impact', period: 'later', t: 'Learning gains, farmer income and asset transfer reported', what: 'Outcome metrics per tier against a baseline by an independent evaluator.', why: 'Impact that stays.', src: 'Slide 30 · What we deliver, measurably', j: '#/27/new-3', st: 'target' }
        ] },
      s4: { title: 'Deploy anywhere, own it', sub: 'Three ways to run the same harness — the difference is custody, not capability.',
        options: [{ k: 'A', t: 'A · Software-only (BYOH)', s: 'The institution hosts Athar on its own infrastructure.' }, { k: 'B', t: 'B · Self-hosted (BYOC)', s: 'Athar-managed software running in the institution’s cloud.' }, { k: 'C', t: 'C · Cloud-hosted', s: 'Fully managed end-to-end by AIREV.' }],
        cols: ['Institution', 'Institution cloud', 'AIREV'], layers: ['Data', 'Models', 'Agents', 'Control plane', 'Keys'], diagramLabel: 'What runs where',
        controlsTitle: 'Sovereignty controls', controls: ['Data residency — data stays in the country and the tenancy the institution chooses', 'Key custody — the institution holds the keys; Athar operates, it does not own', 'Audit logs — every agent action is logged and inspectable by the owner', 'Open-book costs — fees disclosed line by line, unspent funds returned'],
        stepperTitle: 'Ownership-transfer path (5–7 years)', steps: [{ t: 'Deploy', s: 'Node or fleet goes live under a named institutional owner.' }, { t: 'Train local operators', s: 'Young local operators learn to run it — in-country team from day one.' }, { t: 'Certify', s: 'Operators certified through the Academy pathways (Administrator, Trainer).' }, { t: 'Transfer asset to national entity', s: 'Ownership passes to a national entity after 5–7 years.' }],
        pilot: 'Start small: a 30-day, 32-seat pilot lets an institution prove value before signing a full licence.', plateAlt: 'Appliance AI PC beside a modular sovereign compute container — concept render', plate6Alt: 'Kenyan maize field with an edge mast and a distant sovereign node — concept render', custody: 'custody' },
      s5: { title: 'Nations empowered', sub: 'Three countries, three tiers — select a country to see its flagship, baseline and phase.',
        countries: [
          { k: 'lb', t: 'Lebanon', tier: 'Access', tierK: 'access', flagship: 'One Million Lebanese AI Experts', delivered: '1M citizens certified in generative AI; 18,000 in daily professional use in ministries, schools, clinics and small businesses.', outcomes: 'certificates issued · daily active users · ministry workflows live', wdi: ['population 5.85M (2025)', 'internet users 80.6% (2024)'], phase: 'now', amount: '$10M', links: [{ t: 'WAM · 25 Sep 2026 — One Million Lebanese AI Experts launched', u: 'https://www.wam.ae/en/article/17fxhet-abdullah-bin-zayed-meets-lebanese-new-york-%E2%80%98one' }, { t: 'The National · 25 Sep 2026', u: 'https://www.thenationalnews.com/news/mena/2026/09/25/uae-and-lebanon-launch-ai-training-initiative/' }], plate: 'plate4-lebanon', plateAlt: 'Lebanese ministry team working with Athar agents — concept render' },
          { k: 'in', t: 'India', tier: 'Ownership', tierK: 'ownership', flagship: 'The UAE–India CEPA gains an AI chapter', delivered: 'On-device AI tutoring in 100 government schools in Hindi and the state language; 10,000 AI PCs; teacher training; 8-person in-country team.', outcomes: 'learning gains vs baseline · teacher time saved · device uptime', wdi: ['primary enrolment 111.0% gross (2025)', 'secondary enrolment 79.6% gross (2025)', 'internet users 70.0% (2025)'], phase: 'next', amount: '$13.7M', links: [{ t: 'PIB India · 5 Aug 2026 — AI and digital education in government schools', u: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2295050&lang=1&reg=6' }, { t: 'WAM · 14 Feb 2024 — UAE–India digital-economy MoU', u: 'https://www.wam.ae/en/article/b1ns93x-uae-india-sign-mou-accelerate-growth-digital' }], plate: 'plate4-india', plateAlt: 'Indian government-school classroom with appliance AI PCs — concept render' },
          { k: 'ke', t: 'Kenya', tier: 'Legacy', tierK: 'legacy', flagship: 'A sovereign AI node that feeds farmers', delivered: 'A Kenyan-owned AIREV modular data centre on sovereign compute; Swahili voice advice for smallholder farmers; clinics and schools on the same node.', outcomes: 'farmers served · yield and income change · local operators certified · asset transferred', wdi: ['agriculture 45.8% of employment (2025)', 'agriculture 23.2% of GDP (2025)', 'internet users 35.0% (2024)'], phase: 'later', amount: '~$33M', links: [{ t: 'WAM · 29 Mar 2024 — UAE–Kenya investment memorandum', u: 'https://www.wam.ae/en/article/b2dzbq3-uae-kenya-sign-investment-memorandum-advance' }, { t: 'Kenya ICT Ministry · 12 Sep 2025 — East Africa’s largest data centre', u: 'https://ict.go.ke/node/797' }], plate: 'plate6-kenya-maize', plateAlt: 'Kenyan maize field, edge mast and a distant sovereign node — concept render' }
        ],
        tierLabel: 'Tier', flagshipLabel: 'Flagship', deliveredLabel: 'What is delivered', outcomesLabel: 'Outcomes measured', baselineLabel: 'World Bank WDI baseline', wdiSrc: 'Source: World Bank WDI (2026-07-13)', evidenceLabel: 'Evidence', bannerTag: 'CONCEPT RENDER', conceptTab: 'PRODUCT CONCEPT', bannerAlt: 'AI-generated concept render of an Athar service hall: a man in a wheelchair is helped at a reception desk beside a navy ATHAR self-service kiosk, a mother and her young son look at a tablet showing an Arabic medical-appointment screen, and two colleagues sit at a meeting table in the background', bannerAltLb: 'AI-generated concept render for the UAE–Lebanon partnership: a dusk Gulf skyline with the UAE flag on the left and the Lebanese coast with offshore rocks and the Lebanese flag on the right, joined by a luminous arc behind the ATHAR logo. The text reads “1M ATHAR USERS” and “UAE × LEBANON” — an illustrative target, not an achieved figure. Eight people of different ages, including a wheelchair user and a man with a white cane, gather along the bottom.', phaseLabel: 'Roadmap phase', phases: [{ k: 'now', t: 'Now · Q4 2026' }, { k: 'next', t: 'Next · 2027' }, { k: 'later', t: 'Later · 2028' }], cta: 'Join the pact', ctaAria: 'Join the pact — go to Pledge & signing (slide 19)', srcNote: 'Figures: Athar — Agentic AI for All: Three Impact Tiers for Foundation Funding (27 Sep 2026), illustrative targets (p. 3).' }
    },
    ar: {
      chapter: '08', kicker: 'أثر OS', tag: 'تصوّر مفاهيمي', tagCaps: 'تصوّر مفاهيمي · CONCEPT RENDER', target: 'هدف', done: 'منجز', inprogress: 'قيد التنفيذ',
      s1: { title: 'أثر OS — منظومة وكيلة تُمكِّن الأمم', sub: 'منظومة واحدة: الأمم والمؤسسات والبناة والوكلاء والمهارات والإضافات والتراخيص والحوسبة السيادية — تحكمها أحكام الميثاق.',
        heroAlt: 'غرفة عمليات حكومية رقمية وطنية تعمل بأثر OS — تصوّر مفاهيمي مع شعار أثر الرسمي مركّبًا على الجدار',
        diagramLabel: 'منظومة الطبقات — اختر طبقة لتوسيعها', where: 'موقعها في العرض', hint: 'Enter / مسافة للتوسيع · ↑↓ للتنقل بين الطبقات',
        layers: [
          { k: 'nation', t: 'الأمة', s: 'توقّع الدولة الميثاق وتستضيف فصلًا وطنيًا', b: ['الفصول القُطرية تجسّد الميثاق محليًا: مؤسسة مضيفة، وقائد قُطري، وقائد أكاديمية، ومنسّق حماية.', 'تُقاس النتائج مقابل بيانات أساس عبر مقيّم مستقل، وتُرفع التقارير ربع سنويًا.', 'يُنقل الأصل إلى جهة وطنية بعد 5–7 سنوات؛ ويُدرَّب مشغّلون محليون شباب ويُعتمدون لتشغيله.'], j: '#/07', jt: 'الشريحة 7 · الفصول القُطرية' },
          { k: 'institutions', t: 'المؤسسات', s: 'الوزارات والمدارس والعيادات والمنظمات تنشر عبر مالك خاضع للمساءلة', b: ['بقيادة المؤسسات: لكل نشر راعٍ مسمّى ومالك خاضع للمساءلة.', 'مفتوح حيثما أمكن، محكوم حيثما يلزم — تبقى بيانات المؤسسات ومساحات العمل الخاصة وسجلات التدقيق محكومة.', 'ثلاث طرق للنشر: برمجيات فقط على بنية المؤسسة، أو استضافة ذاتية في سحابتها، أو استضافة سحابية تديرها AIREV.'], j: '#/15', jt: 'الشريحة 15 · مفتوح حيثما أمكن، محكوم حيثما يلزم' },
          { k: 'builders', t: 'بناة المجتمع', s: 'مجتمع مفتوح يتعلّم ويبني ويتحقق وينشر', b: ['مسار البناء: تعلّم ← نموذج أولي ← تقييم ← تحقّق ← نشر ← إصدار عام.', 'ساعات دعم أسبوعية وتحديات ربع سنوية وعروض شهرية والقمة السنوية.', 'مسارات الأكاديمية تعتمد الممارسين والبنّائين والمسؤولين والمدربين.'], j: '#/11', jt: 'الشريحة 11 · مسار البناء وسوق العوامل' },
          { k: 'agents', t: 'الوكلاء', s: 'وكلاء مُتحقق منهم لكلٍّ منهم مسؤول صيانة مسمّى واستخدام معلن', b: ['لكل عامل منشور مسؤول صيانة مسمّى وسجل إصدارات وبيان استخدام واضح.', 'تفصح العوامل عن مصادر بياناتها وأدواتها واعتمادها على النماذج وحدودها.', 'العوامل عالية الخطورة تحتاج موافقة مؤسسية واختبارًا إضافيًا قبل النشر.'], j: '#/11', jt: 'الشريحة 11 · قواعد سوق العوامل' },
          { k: 'skills', t: 'المهارات', s: 'قدرات قابلة لإعادة الاستخدام تُبنى مرة واحدة وتُشارك', b: ['تحزم المهارة قدرة معينة ليحمّلها أي عامل مُتحقق منه ويعيد استخدامها.', 'تمر المهارات بالمسار ذاته: نموذج أولي، ثم تقييم، ثم تحقّق.', 'مسارات بلا برمجة للممارسين؛ ومسارات برمجية متقدمة للمطورين.'], j: '#/14', jt: 'الشريحة 14 · مهارات قابلة لإعادة الاستخدام' },
          { k: 'plugins', t: 'الإضافات', s: 'النسيج الرابط: معيار إضافات موحّد', b: ['لا يصل العامل إلى الأدوات والموصلات والبيانات والخدمات إلا عبر الإضافات.', 'كل إضافة منشورة ومرقَّمة بإصدار ويمكن اكتشافها، مع استخدام معلن ومالك مسمّى ولغات مدعومة.', 'تنتقل الإضافات بين النماذج — تغيير المزوّد لا يعني إعادة بناء أدوات المؤسسة.'], j: '#/13', jt: 'الشريحة 13 · الإضافات هي النسيج الرابط' },
          { k: 'licences', t: 'تراخيص الواجهات الشاملة', s: 'يشتريها أثر ويديرها لصالح المجتمع كله', b: ['يشتري أثر تراخيص ومفاتيح واجهات البرمجة التي يحتاجها المجتمع ويديرها؛ ويستدعيها الأعضاء من وكلائهم.', 'مجمعات المقاعد مسمّاة ومحددة زمنيًا ولا يمكن نقلها خارج البرنامج.', 'كبار بناة الواجهات في الشريحة 17؛ وسلّم المقاعد في الملحق.'], j: '#/17', jt: 'الشريحة 17 · تراخيص واجهات برمجية شاملة يديرها أثر' },
          { k: 'compute', t: 'الحوسبة السيادية', s: 'البيانات والنماذج والوكلاء ومستوى التحكم والمفاتيح تعمل حيث تقرر الدولة', b: ['الخيارات أ/ب/ج: بنية المؤسسة، أو سحابة المؤسسة، أو إدارة AIREV — المنظومة نفسها باختلاف الحيازة.', 'إقامة البيانات وحيازة المفاتيح وسجلات التدقيق والتكاليف المفتوحة بنود تعاقدية لا مزايا.', 'كينيا: عقدة معيارية مملوكة كينيًا؛ مشغّلون محليون معتمدون؛ نقل بعد 5–7 سنوات.'], j: '#/27/new-2', jt: 'الشريحة 29 · عقد مراكز البيانات السيادية' }
        ] },
      s2: { title: 'جولة في المنتج — المنظومة أثناء العمل', sub: 'شاشات أثر الفعلية من Athar_Package.zip وAthar_Wireframes_and_Screens_v1 — النظرة العامة، السوق، الملعب (فارغ، محادثة) ومنشئ تدفقات الوكلاء — بدقة 1440×900 الأصلية، فاتحة وداكنة، بالعربية والإنجليزية.',
        tabs: [{ k: 'overview', t: 'النظرة العامة' }, { k: 'marketplace', t: 'السوق' }, { k: 'playground-empty', t: 'الملعب — فارغ' }, { k: 'playground-conversation', t: 'الملعب — محادثة' }, { k: 'flow', t: 'منشئ تدفقات الوكلاء' }],
        heroAlt: 'بناة المجتمع يؤلّفون تدفق وكيل على لوحة لمس — تصوّر مفاهيمي', langToggle: 'English', langToggleAria: 'تبديل الجولة إلى الإنجليزية', themeLight: 'فاتح', themeDark: 'داكن', themeAria: 'تبديل السمة الفاتحة / الداكنة', loading: 'جارٍ التحميل…', tourNote: 'شاشات المنتج الحقيقية — Athar_Package.zip (05 Web & Product/UI_Screens، 2880×1800) وAthar_Wireframes_and_Screens_v1.pdf (27 سبتمبر 2026)؛ تحمل النقاط المرقّمة تعليقات الحزمة نفسها. لا شيء في هذه الشريحة نموذج تجريبي.' },
      s3: { title: 'خارطة الطريق — الآن، التالي، لاحقًا', sub: 'خمسة مسارات من الميثاق ونموذج المجتمع وفئات الأثر الثلاث؛ البنود بلا مصدر في العرض موسومة «هدف».',
        periods: [{ k: 'now', t: 'الآن', s: 'الربع الرابع 2026' }, { k: 'next', t: 'التالي', s: '2027' }, { k: 'later', t: 'لاحقًا', s: '2028' }],
        tracks: [{ k: 'platform', t: 'المنصة' }, { k: 'community', t: 'المجتمع والمهارات' }, { k: 'plugins', t: 'الإضافات والواجهات الشاملة' }, { k: 'sovereign', t: 'النشر السيادي' }, { k: 'impact', t: 'الأثر والتقييم' }],
        all: 'كل المسارات', filterLabel: 'تصفية حسب المسار', detailEmpty: 'اختر معلمًا لعرض ماذا ولماذا والمصدر والحالة.', what: 'ماذا', why: 'لماذا', source: 'المصدر', status: 'الحالة',
        status: { done: 'منجز', progress: 'قيد التنفيذ', target: 'هدف' },
        milestones: [
          { id: 'p1', track: 'platform', period: 'now', t: 'خط المهارات: نموذج أولي ← تقييم ← تحقّق', what: 'تمر المهارات بمسار البناء ذاته الذي يمر به الوكلاء.', why: 'القدرة التي تُبنى مرة واحدة يعيد استخدامها كل عامل مُتحقق منه.', src: 'الشريحة 14 · الركائز الست', j: '#/14', st: 'progress' },
          { id: 'p2', track: 'platform', period: 'now', t: 'معيار الإضافات v1 — منشور ومرقَّم وقابل للاكتشاف', what: 'معيار إضافات موحّد للأدوات والموصلات ومصادر البيانات والخدمات.', why: 'لا يصل العامل إلى العالم الخارجي إلا عبر الإضافات.', src: 'الشريحة 13 · الركائز الست', j: '#/13', st: 'progress' },
          { id: 'p3', track: 'platform', period: 'next', t: 'انتقال الإضافات بين النماذج', what: 'يمكن لأي نموذج استدعاء إضافات نموذج آخر عبر المعيار المشترك.', why: 'لا مؤسسة مقيَّدة بمزوّد واحد.', src: 'الشريحة 16 · الركائز الست', j: '#/16', st: 'target' },
          { id: 'p4', track: 'platform', period: 'next', t: 'إتاحة الملعب ومنشئ تدفقات الوكلاء عامًا', what: 'تصبح شاشات المنتج الأربع في الجولة متاحة عامًا.', why: 'يؤلّف البناة تدفقات متعددة الوكلاء على لوحة.', src: 'المخططات v1 (27 سبتمبر 2026)', j: '#/27/new-8', st: 'target' },
          { id: 'p5', track: 'platform', period: 'later', t: 'أثر OS للعقد الوطنية', what: 'المنظومة الكاملة محزومة للحوسبة السيادية.', why: 'منظومة واحدة من الحاسوب المحمول إلى العقدة الوطنية.', src: 'هدف', j: '#/27/new-10', st: 'target' },
          { id: 'c1', track: 'community', period: 'now', t: 'فصول الموجة الأولى + مسار الأساسيات', what: 'الإمارات كقاعدة مع دولتين؛ نشر أساسيات الذكاء الوكيلي.', why: 'ملكية محلية ضمن نموذج مشترك.', src: 'الشريحتان 7 و27 · نموذج المجتمع', j: '#/07', st: 'progress' },
          { id: 'c2', track: 'community', period: 'now', t: 'الدفعة المؤسِّسة · ساعات دعم أسبوعية للبنّائين', what: 'الأيام 31–60: فتح الدفعة المؤسِّسة وبدء ساعات الدعم والندوات.', why: 'يحصل البناة على دعم تقني أسبوعي.', src: 'الشريحة 27 · خارطة الطريق', j: '#/27', st: 'progress' },
          { id: 'c3', track: 'community', period: 'next', t: '10,000 متعلم · 2,500 شهادة · 100 ميسّر', what: 'أهداف الأكاديمية للسنة الأولى.', why: 'يتحوّل الاهتمام إلى قدرة معتمَدة تطبيقيًا.', src: 'الشريحة 18 · الركائز الست', j: '#/18', st: 'target' },
          { id: 'c4', track: 'community', period: 'next', t: 'عشرة فصول · القمة العالمية · التقرير السنوي', what: 'الأشهر 10–12 من خارطة طريق التنفيذ.', why: 'مراجعة النتائج وتكريم البنّائين وتحديد الأجندة.', src: 'الشريحة 27 · خارطة الطريق', j: '#/27', st: 'target' },
          { id: 'c5', track: 'community', period: 'later', t: 'مليون خبير لبناني في الذكاء الاصطناعي — 18,000 في الاستخدام اليومي', what: 'البرنامج الرائد لفئة الوصول: مليون مواطن معتمَد في الذكاء الاصطناعي التوليدي.', why: 'الشهادات الصادرة والمستخدمون النشطون يوميًا وسير العمل الوزاري المُفعَّل.', src: 'الشريحة 29 · فئات الأثر الثلاث (10 ملايين دولار)', j: '#/27/new-2', st: 'target' },
          { id: 'a1', track: 'plugins', period: 'now', t: 'تراخيص واجهات شاملة يديرها أثر', what: 'يشتري أثر تراخيص ومفاتيح الواجهات التي يحتاجها المجتمع ويديرها.', why: 'يستدعيها الأعضاء من وكلائهم؛ لا أحد يتفاوض وحده.', src: 'الشريحة 17 · الركائز الست', j: '#/17', st: 'progress' },
          { id: 'a2', track: 'plugins', period: 'next', t: 'مراجعة السوق · مقاسمة العوائد للعوامل المتخصصة', what: 'عوامل مُتحقق منها تُنشر مع مسؤول صيانة مسمّى؛ قد تُقاسَم عوائد العوامل المتخصصة المدفوعة.', why: 'تبقى عوامل الصالح العام مجانية؛ وتُعلَّق العوامل غير الآمنة.', src: 'الشريحة 11 · نموذج المجتمع', j: '#/11', st: 'target' },
          { id: 'a3', track: 'plugins', period: 'later', t: 'سجل إضافات مفتوح عبر المؤسسات والدول والنماذج', what: 'معيار الإضافات ذاته في كل مكان.', why: 'ابنِ مرة واحدة. شغّل في كل مكان.', src: 'الشريحة 13 · الركائز الست', j: '#/13', st: 'target' },
          { id: 's1', track: 'sovereign', period: 'now', t: 'تجارب 30 يومًا و32 مقعدًا · الخيارات أ/ب/ج', what: 'تثبت المؤسسة القيمة قبل الترخيص الكامل؛ وتنشر برمجيات فقط أو باستضافة ذاتية أو سحابية.', why: 'السيادة خيار نشر لا تنازل.', src: 'الشريحة 17 · الملحق', j: '#/17', st: 'progress' },
          { id: 's2', track: 'sovereign', period: 'next', t: 'الهند: 100 مدرسة حكومية · 10,000 حاسوب ذكاء اصطناعي', what: 'تعليم بالذكاء الاصطناعي على الجهاز بالهندية ولغة الولاية؛ تدريب المعلمين؛ فريق محلي من 8 أشخاص (13.7 مليون دولار).', why: 'فئة التملّك — تكتسب اتفاقية الشراكة الإماراتية–الهندية فصلًا للذكاء الاصطناعي.', src: 'الشريحة 29 · فئات الأثر الثلاث', j: '#/27/new-2', st: 'target' },
          { id: 's3', track: 'sovereign', period: 'later', t: 'كينيا: عقدة سيادية مملوكة كينيًا · النقل بعد 5–7 سنوات', what: 'مركز بيانات معياري على حوسبة سيادية (~33 مليون دولار)؛ إرشاد صوتي بالسواحلية للمزارعين؛ العيادات والمدارس على العقدة نفسها.', why: 'فئة الإرث — يبقى الأصل.', src: 'الشريحة 29 · فئات الأثر الثلاث', j: '#/27/new-2', st: 'target' },
          { id: 'i0', track: 'impact', period: 'now', t: 'مقترح الميثاق (24 سبتمبر) · ورقة فئات الأثر (27 سبتمبر 2026)', what: 'المقترح المجتمعي وورقة التمويل اللذان يستند إليهما هذا العرض.', why: 'لكل رقم في الشرائح 28–33 مرجع صفحة.', src: 'الشريحة 28 · النتائج هي المنتج', j: '#/27/new-1', st: 'done' },
          { id: 'i1', track: 'impact', period: 'now', t: 'بنود التمكين: مجال الترخيص · رسوم مفتوحة · مقيّم مستقل', what: 'توسيع مجال ترخيص أثر؛ سياسة رسوم مفتوحة الدفاتر مع إعادة الأموال غير المنفقة؛ تسمية مقيّم مستقل.', why: 'ما يشترطه تمويل المؤسسات قبل أن يتدفق.', src: 'الشريحة 31 · بنود تمكين تمويل المؤسسات', j: '#/27/new-4', st: 'progress' },
          { id: 'i2', track: 'impact', period: 'next', t: 'تقارير نتائج ربع سنوية · أول تقرير نتائج وثقة', what: 'بيانات أساس وقياس مستمر ودراسات حالة وتقارير ربع سنوية.', why: 'النجاح هو الوقت الموفَّر والجودة والأثر — لا عدد العوامل.', src: 'الشريحتان 27 و30', j: '#/27/new-3', st: 'target' },
          { id: 'i3', track: 'impact', period: 'later', t: 'الإبلاغ عن مكاسب التعلّم ودخل المزارعين ونقل الأصل', what: 'مقاييس النتائج لكل فئة مقابل بيانات أساس عبر مقيّم مستقل.', why: 'أثر يبقى.', src: 'الشريحة 30 · ما نقدّمه بشكل قابل للقياس', j: '#/27/new-3', st: 'target' }
        ] },
      s4: { title: 'انشر في أي مكان، وامتلكه', sub: 'ثلاث طرق لتشغيل المنظومة نفسها — الفرق في الحيازة لا في القدرة.',
        options: [{ k: 'A', t: 'أ · برمجيات فقط (BYOH)', s: 'تستضيف المؤسسة أثر على بنيتها التحتية الخاصة.' }, { k: 'B', t: 'ب · استضافة ذاتية (BYOC)', s: 'برمجيات يديرها أثر تعمل في سحابة المؤسسة.' }, { k: 'C', t: 'ج · استضافة سحابية', s: 'إدارة كاملة من طرف إلى طرف من AIREV.' }],
        cols: ['المؤسسة', 'سحابة المؤسسة', 'AIREV'], layers: ['البيانات', 'النماذج', 'الوكلاء', 'مستوى التحكم', 'المفاتيح'], diagramLabel: 'ما الذي يعمل وأين',
        controlsTitle: 'ضوابط السيادة', controls: ['إقامة البيانات — تبقى البيانات في الدولة وفي الحيّز الذي تختاره المؤسسة', 'حيازة المفاتيح — المؤسسة تحتفظ بالمفاتيح؛ أثر يشغّل ولا يملك', 'سجلات التدقيق — كل إجراء لوكيل مسجَّل وقابل للفحص من المالك', 'تكاليف مفتوحة الدفاتر — رسوم معلنة بندًا بندًا وإعادة الأموال غير المنفقة'],
        stepperTitle: 'مسار نقل الملكية (5–7 سنوات)', steps: [{ t: 'النشر', s: 'تعمل العقدة أو الأسطول تحت مالك مؤسسي مسمّى.' }, { t: 'تدريب المشغّلين المحليين', s: 'يتعلّم مشغّلون محليون شباب تشغيلها — فريق محلي منذ اليوم الأول.' }, { t: 'الاعتماد', s: 'يُعتمد المشغّلون عبر مسارات الأكاديمية (مسؤول، مدرّب).' }, { t: 'نقل الأصل إلى جهة وطنية', s: 'تنتقل الملكية إلى جهة وطنية بعد 5–7 سنوات.' }],
        pilot: 'ابدأ صغيرًا: تجربة لمدة 30 يومًا و32 مقعدًا تتيح للمؤسسة إثبات القيمة قبل توقيع ترخيص كامل.', plateAlt: 'حاسوب ذكاء اصطناعي بجانب حاوية حوسبة سيادية معيارية — تصوّر مفاهيمي', plate6Alt: 'حقل ذرة كيني مع سارية طرفية وعقدة سيادية بعيدة — تصوّر مفاهيمي', custody: 'الحيازة' },
      s5: { title: 'أمم مُمكَّنة', sub: 'ثلاث دول وثلاث فئات — اختر دولة لعرض برنامجها الرائد وبيانات أساسها ومرحلتها.',
        countries: [
          { k: 'lb', t: 'لبنان', tier: 'الوصول', tierK: 'access', flagship: 'مليون خبير لبناني في الذكاء الاصطناعي', delivered: 'مليون مواطن معتمَد في الذكاء الاصطناعي التوليدي؛ 18,000 في الاستخدام المهني اليومي في الوزارات والمدارس والعيادات والشركات الصغيرة.', outcomes: 'الشهادات الصادرة · المستخدمون النشطون يوميًا · سير العمل الوزاري المُفعَّل', wdi: ['السكان 5.85 مليون (2025)', 'مستخدمو الإنترنت 80.6٪ (2024)'], phase: 'now', amount: '10 ملايين دولار', links: [{ t: 'وام · 25 سبتمبر 2026 — إطلاق مبادرة مليون خبير لبناني', u: 'https://www.wam.ae/en/article/17fxhet-abdullah-bin-zayed-meets-lebanese-new-york-%E2%80%98one' }, { t: 'ذا ناشيونال · 25 سبتمبر 2026', u: 'https://www.thenationalnews.com/news/mena/2026/09/25/uae-and-lebanon-launch-ai-training-initiative/' }], plate: 'plate4-lebanon', plateAlt: 'فريق وزاري لبناني يعمل مع وكلاء أثر — تصوّر مفاهيمي' },
          { k: 'in', t: 'الهند', tier: 'التملّك', tierK: 'ownership', flagship: 'اتفاقية الشراكة الإماراتية–الهندية تكتسب فصلًا للذكاء الاصطناعي', delivered: 'تعليم بالذكاء الاصطناعي على الجهاز في 100 مدرسة حكومية بالهندية ولغة الولاية؛ 10,000 حاسوب ذكاء اصطناعي؛ تدريب المعلمين؛ فريق محلي من 8 أشخاص.', outcomes: 'مكاسب التعلّم مقابل الأساس · وقت المعلم الموفَّر · جاهزية الأجهزة', wdi: ['الالتحاق الابتدائي 111.0٪ إجمالي (2025)', 'الالتحاق الثانوي 79.6٪ إجمالي (2025)', 'مستخدمو الإنترنت 70.0٪ (2025)'], phase: 'next', amount: '13.7 مليون دولار', links: [{ t: 'مكتب الإعلام الهندي · 5 أغسطس 2026 — الذكاء الاصطناعي والتعليم الرقمي في المدارس الحكومية', u: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2295050&lang=1&reg=6' }, { t: 'وام · 14 فبراير 2024 — مذكرة تفاهم الاقتصاد الرقمي بين الإمارات والهند', u: 'https://www.wam.ae/en/article/b1ns93x-uae-india-sign-mou-accelerate-growth-digital' }], plate: 'plate4-india', plateAlt: 'فصل دراسي في مدرسة حكومية هندية مع حواسيب ذكاء اصطناعي — تصوّر مفاهيمي' },
          { k: 'ke', t: 'كينيا', tier: 'الإرث', tierK: 'legacy', flagship: 'عقدة ذكاء اصطناعي سيادية تُطعم المزارعين', delivered: 'مركز بيانات معياري من AIREV مملوك كينيًا على حوسبة سيادية؛ إرشاد صوتي بالسواحلية لصغار المزارعين؛ العيادات والمدارس على العقدة نفسها.', outcomes: 'المزارعون المخدومون · تغيّر الغلّة والدخل · المشغّلون المحليون المعتمدون · نقل الأصل', wdi: ['الزراعة 45.8٪ من العمالة (2025)', 'الزراعة 23.2٪ من الناتج المحلي الإجمالي (2025)', 'مستخدمو الإنترنت 35.0٪ (2024)'], phase: 'later', amount: '~33 مليون دولار', links: [{ t: 'وام · 29 مارس 2024 — مذكرة استثمار بين الإمارات وكينيا', u: 'https://www.wam.ae/en/article/b2dzbq3-uae-kenya-sign-investment-memorandum-advance' }, { t: 'وزارة تقنية المعلومات الكينية · 12 سبتمبر 2025 — أكبر مركز بيانات في شرق أفريقيا', u: 'https://ict.go.ke/node/797' }], plate: 'plate6-kenya-maize', plateAlt: 'حقل ذرة كيني وسارية طرفية وعقدة سيادية بعيدة — تصوّر مفاهيمي' }
        ],
        tierLabel: 'الفئة', flagshipLabel: 'البرنامج الرائد', deliveredLabel: 'ما الذي يُقدَّم', outcomesLabel: 'النتائج المقيسة', baselineLabel: 'أساس البنك الدولي (WDI)', wdiSrc: 'المصدر: مؤشرات التنمية العالمية للبنك الدولي (2026-07-13)', evidenceLabel: 'الأدلة', bannerTag: 'تصوّر مفاهيمي', conceptTab: 'مفهوم المنتج', bannerAlt: 'تصوّر مفاهيمي مولَّد بالذكاء الاصطناعي لقاعة خدمات أثر: رجل على كرسي متحرك يتلقى المساعدة عند مكتب الاستقبال بجوار كشك أثر الأزرق الداكن للخدمة الذاتية، وأم مع ابنها الصغير تنظران إلى جهاز لوحي تظهر عليه شاشة موعد طبي بالعربية، وزميلان يجلسان إلى طاولة اجتماعات في الخلفية', bannerAltLb: 'تصوّر مفاهيمي مولَّد بالذكاء الاصطناعي للشراكة بين الإمارات ولبنان: أفق مدينة خليجية عند الغروب يتقدّمه علم الإمارات على اليسار، وساحل لبناني تظهر قبالته صخور بحرية يتقدّمه العلم اللبناني على اليمين، يربط بينهما قوس مضيء خلف شعار أثر. يظهر النص «1M ATHAR USERS» و«UAE × LEBANON» — وهو هدف استرشادي وليس رقماً محقَّقاً. وفي الأسفل يتجمّع ثمانية أشخاص من أعمار مختلفة، بينهم مستخدم كرسي متحرك ورجل يحمل عصا بيضاء.', phaseLabel: 'مرحلة خارطة الطريق', phases: [{ k: 'now', t: 'الآن · الربع الرابع 2026' }, { k: 'next', t: 'التالي · 2027' }, { k: 'later', t: 'لاحقًا · 2028' }], cta: 'انضم إلى الميثاق', ctaAria: 'انضم إلى الميثاق — الانتقال إلى التعهد والتوقيع (الشريحة 19)', srcNote: 'الأرقام: أثر — الذكاء الاصطناعي الوكيلي للجميع: ثلاث فئات أثر لتمويل المؤسسات (27 سبتمبر 2026)، أهداف توضيحية (ص 3).' }
    }
  };

  /* ================= S1 · Overview + layered harness ================= */
  function renderS1(lang, api) {
    var d = S[lang], s = d.s1, body = api.head(d.chapter, d.kicker, 'automation', s.title, s.sub); body.classList.add('aos-body--s1');
    var hero = plate('plate1-composited', s.heroAlt, d.tag, 'aos-hero'); hero.setAttribute('data-testid', 'aos-hero'); body.appendChild(hero);
    var wrap = el('div', 'aos-harness'); wrap.setAttribute('data-testid', 'harness-diagram');
    var stack = el('div', 'aos-layers'); stack.setAttribute('role', 'group'); stack.setAttribute('aria-label', s.diagramLabel);
    var panel = el('div', 'aos-layer-detail'); panel.setAttribute('aria-live', 'polite'); panel.setAttribute('data-testid', 'harness-detail');
    var buttons = [], current = -1;
    function renderDetail(i) {
      panel.innerHTML = '';
      var L = s.layers[i];
      var h = el('div', 'aos-detail-head'); h.appendChild(el('span', 'aos-detail-n', String(i + 1))); h.appendChild(el('h3', 'aos-detail-title', L.t)); panel.appendChild(h);
      panel.appendChild(el('p', 'aos-detail-sub', L.s));
      var ul = el('ul', 'bullets aos-detail-list'); L.b.forEach(function (b) { ul.appendChild(el('li', null, b)); }); panel.appendChild(ul);
      var w = el('p', 'aos-detail-where'); w.appendChild(el('span', 'aos-where-label', s.where + ': ')); w.appendChild(jumpLink(L.j, L.jt, lang)); panel.appendChild(w);
    }
    function setOpen(i) {
      current = i;
      buttons.forEach(function (b, j) { var on = j === i; b.setAttribute('aria-expanded', on ? 'true' : 'false'); b.classList.toggle('is-open', on); });
      renderDetail(i);
    }
    s.layers.forEach(function (L, i) {
      var b = btn('aos-layer', null, { 'aria-expanded': 'false', 'aria-controls': 'aos-layer-detail', 'data-layer': L.k });
      b.style.setProperty('--depth', String(i));
      b.appendChild(el('span', 'aos-layer-n', String(i + 1))); b.appendChild(el('span', 'aos-layer-t', L.t));
      var chev = el('span', 'aos-layer-chev'); chev.setAttribute('aria-hidden', 'true'); chev.textContent = '›'; b.appendChild(chev);
      b.addEventListener('click', function () { setOpen(i); });
      buttons.push(b); stack.appendChild(b);
    });
    panel.id = 'aos-layer-detail';
    roving(buttons, function (j) { setOpen(j); }, 'v');
    wrap.appendChild(stack); wrap.appendChild(panel); body.appendChild(wrap);
    body.appendChild(el('p', 'aos-hint muted small', s.hint));
    setOpen(0);
    return body;
  }

  /* ================= S2 · Product tour (tabs lazy-loaded from /js/tour/<tab>.js) ================= */
  var TOUR_LOADED = {};
  function loadTab(k, cb) {
    if (window.AtharTour && window.AtharTour[k]) return cb(null, window.AtharTour[k]);
    if (TOUR_LOADED[k]) { TOUR_LOADED[k].push(cb); return; }
    TOUR_LOADED[k] = [cb];
    var sc = document.createElement('script'); sc.src = '/js/tour/' + k + '.js'; sc.async = true;
    sc.onload = function () { var mod = window.AtharTour && window.AtharTour[k]; (TOUR_LOADED[k] || []).forEach(function (f) { f(mod ? null : new Error('tour module missing: ' + k), mod); }); TOUR_LOADED[k] = null; };
    sc.onerror = function () { (TOUR_LOADED[k] || []).forEach(function (f) { f(new Error('tour module failed: ' + k)); }); TOUR_LOADED[k] = null; };
    document.head.appendChild(sc);
  }
  function renderS2(lang, api) {
    var d = S[lang], s = d.s2, body = api.head(d.chapter, d.kicker, 'agents', s.title, s.sub); body.classList.add('aos-body--s2');
    var state = { tab: 'overview', lang: lang, theme: 'light', mounted: null, active: null };
    var strip = el('div', 'aos-tabstrip'); strip.setAttribute('data-testid', 'tour-tabstrip');
    var thumb = plate('plate3-builders-canvas', s.heroAlt, d.tag, 'aos-tab-hero', true); strip.appendChild(thumb);
    var tl = el('div', 'aos-tabs'); tl.setAttribute('role', 'tablist'); tl.setAttribute('aria-label', s.title);
    var tabs = s.tabs.map(function (t) { var b = btn('aos-tab', t.t, { role: 'tab', 'aria-selected': 'false', 'data-tab': t.k, id: 'aos-tab-' + t.k, 'aria-controls': 'aos-tabpanel' }); tl.appendChild(b); return b; });
    strip.appendChild(tl);
    var ctl = el('div', 'aos-tour-ctl');
    var langB = btn('aos-ctl aos-ctl--lang', s.langToggle, { 'aria-label': s.langToggleAria, 'data-testid': 'tour-lang' });
    var themeB = btn('aos-ctl aos-ctl--theme', s.themeDark, { 'aria-label': s.themeAria, 'aria-pressed': 'false', 'data-testid': 'tour-theme' });
    ctl.appendChild(langB); ctl.appendChild(themeB); strip.appendChild(ctl);
    body.appendChild(strip);
    var app = el('div', 'aos-app'); app.id = 'aos-tabpanel'; app.setAttribute('role', 'tabpanel'); app.setAttribute('data-testid', 'tour-app'); app.setAttribute('data-keys', 'own'); app.setAttribute('data-theme', 'light'); app.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr'); app.setAttribute('lang', lang);
    body.appendChild(app);
    body.appendChild(el('p', 'aos-note muted small', s.tourNote));
    function ctx() { return { lang: state.lang, theme: state.theme, el: el, img: img, svgEl: svgEl, reduced: reduced, roving: roving, btn: btn }; }
    function mount() {
      if (state.mounted && state.mounted.destroy) { try { state.mounted.destroy(); } catch (e) {} }
      state.mounted = null; app.innerHTML = ''; app.setAttribute('data-tab', state.tab); app.setAttribute('dir', state.lang === 'ar' ? 'rtl' : 'ltr'); app.setAttribute('lang', state.lang);
      var ph = el('div', 'aos-app-loading', s.loading); app.appendChild(ph);
      var want = state.tab;
      loadTab(want, function (err, mod) {
        if (want !== state.tab) return;
        app.innerHTML = '';
        if (err || !mod) { app.appendChild(el('p', 'aos-app-error', String(err && err.message || 'unavailable'))); return; }
        state.mounted = mod.mount(app, ctx());
        if (state.mounted && state.mounted.setActive) state.mounted.setActive(!!state.active);
      });
    }
    function select(k) { state.tab = k; tabs.forEach(function (b) { var on = b.getAttribute('data-tab') === k; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.classList.toggle('is-on', on); b.setAttribute('tabindex', on ? '0' : '-1'); }); mount(); }
    tabs.forEach(function (b) { b.addEventListener('click', function () { select(b.getAttribute('data-tab')); }); });
    roving(tabs, function (j) { select(tabs[j].getAttribute('data-tab')); }, 'h');
    langB.addEventListener('click', function () { state.lang = state.lang === 'ar' ? 'en' : 'ar'; langB.textContent = state.lang === 'ar' ? 'English' : 'العربية'; mount(); });
    themeB.addEventListener('click', function () { state.theme = state.theme === 'light' ? 'dark' : 'light'; app.setAttribute('data-theme', state.theme); themeB.setAttribute('aria-pressed', state.theme === 'dark' ? 'true' : 'false'); themeB.textContent = state.theme === 'dark' ? s.themeLight : s.themeDark; if (state.mounted && state.mounted.setTheme) state.mounted.setTheme(state.theme); });
    tabs.forEach(function (b) { b.setAttribute('aria-selected', 'false'); }); tabs[0].setAttribute('aria-selected', 'true'); tabs[0].classList.add('is-on');
    /* lazy: the first tab's module is fetched when the slide is first shown (onShow), not at page load */
    body.__aos = { onShow: function (active) { state.active = active; if (active && !state.mounted && !app.getAttribute('data-tab')) select(state.tab); else if (state.mounted && state.mounted.setActive) state.mounted.setActive(active); } };
    return body;
  }

  /* ================= S3 · Roadmap timeline ================= */
  function renderS3(lang, api) {
    var d = S[lang], s = d.s3, body = api.head(d.chapter, d.kicker, 'tasks', s.title, s.sub); body.classList.add('aos-body--s3');
    var filters = el('div', 'aos-filters'); filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', s.filterLabel); filters.setAttribute('data-testid', 'roadmap-filters');
    var fbtns = [];
    [{ k: 'all', t: s.all }].concat(s.tracks).forEach(function (t) { var b = btn('aos-chip aos-filter', t.t, { 'aria-pressed': t.k === 'all' ? 'true' : 'false', 'data-track': t.k }); filters.appendChild(b); fbtns.push(b); });
    body.appendChild(filters);
    var grid = el('div', 'aos-timeline'); grid.setAttribute('role', 'table'); grid.setAttribute('aria-label', s.title); grid.setAttribute('data-testid', 'roadmap-timeline');
    var hdr = el('div', 'aos-tl-row aos-tl-head'); hdr.setAttribute('role', 'row'); var corner = el('div', 'aos-tl-cell aos-tl-corner'); corner.setAttribute('role', 'columnheader'); hdr.appendChild(corner);
    s.periods.forEach(function (p) { var c = el('div', 'aos-tl-cell aos-tl-period aos-tl-period--' + p.k); c.setAttribute('role', 'columnheader'); c.appendChild(el('span', 'aos-period-t', p.t)); c.appendChild(el('span', 'aos-period-s', p.s)); hdr.appendChild(c); });
    grid.appendChild(hdr);
    var detail = el('div', 'aos-ms-detail'); detail.setAttribute('aria-live', 'polite'); detail.setAttribute('data-testid', 'roadmap-detail'); detail.appendChild(el('p', 'aos-ms-empty muted', s.detailEmpty));
    var chips = [], selected = null;
    function showDetail(m) {
      selected = m.id; chips.forEach(function (c) { c.classList.toggle('is-on', c.getAttribute('data-id') === m.id); c.setAttribute('aria-pressed', c.getAttribute('data-id') === m.id ? 'true' : 'false'); });
      detail.innerHTML = '';
      var h = el('div', 'aos-ms-head'); h.appendChild(el('span', 'aos-status aos-status--' + m.st, s.status[m.st])); h.appendChild(el('h3', 'aos-ms-title', m.t)); detail.appendChild(h);
      var dl = el('dl', 'aos-ms-dl');
      [[s.what, m.what], [s.why, m.why]].forEach(function (p) { dl.appendChild(el('dt', null, p[0])); dl.appendChild(el('dd', null, p[1])); });
      dl.appendChild(el('dt', null, s.source)); var dd = el('dd'); if (m.src === 'target' || m.src === 'هدف') dd.textContent = s.status.target; else dd.appendChild(jumpLink(m.j, m.src, lang)); dl.appendChild(dd);
      var stLbl = lang === 'ar' ? 'الحالة' : 'Status', stVal = String(s.status[m.st] || ''); stVal = stVal.charAt(0).toUpperCase() + stVal.slice(1); /* v1.5.2: 'Status: In progress' (was '[object Object] in progress') */
      dl.appendChild(el('dt', null, stLbl)); dl.appendChild(el('dd', null, stVal));
      detail.appendChild(dl);
    }
    s.tracks.forEach(function (t) {
      var row = el('div', 'aos-tl-row'); row.setAttribute('role', 'row'); row.setAttribute('data-track', t.k);
      var th = el('div', 'aos-tl-cell aos-tl-track'); th.setAttribute('role', 'rowheader'); th.textContent = t.t; row.appendChild(th);
      s.periods.forEach(function (p) {
        var c = el('div', 'aos-tl-cell'); c.setAttribute('role', 'cell');
        s.milestones.filter(function (m) { return m.track === t.k && m.period === p.k; }).forEach(function (m) {
          var b = btn('aos-chip aos-ms aos-ms--' + m.st, null, { 'data-id': m.id, 'data-track': m.track, 'data-status': m.st, 'aria-pressed': 'false' });
          var dot = el('span', 'aos-ms-dot'); dot.setAttribute('aria-hidden', 'true'); b.appendChild(dot); b.appendChild(el('span', 'aos-ms-t', m.t));
          if (m.st === 'target') b.appendChild(el('span', 'aos-ms-tag', s.status.target));
          b.addEventListener('click', function () { showDetail(m); });
          chips.push(b); c.appendChild(b);
        });
        row.appendChild(c);
      });
      grid.appendChild(row);
    });
    roving(chips, function (j) { var id = chips[j].getAttribute('data-id'); showDetail(s.milestones.filter(function (m) { return m.id === id; })[0]); }, 'h');
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-track'); fbtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); x.classList.toggle('is-on', x === b); });
        Array.prototype.forEach.call(grid.querySelectorAll('.aos-tl-row[data-track]'), function (r) { r.classList.toggle('is-dim', k !== 'all' && r.getAttribute('data-track') !== k); r.setAttribute('aria-hidden', k !== 'all' && r.getAttribute('data-track') !== k ? 'true' : 'false'); });
      });
    });
    fbtns[0].classList.add('is-on');
    var two = el('div', 'aos-tl-wrap'); two.appendChild(grid); two.appendChild(detail); body.appendChild(two);
    var legend = el('p', 'aos-legend muted small'); [['done', s.status.done], ['progress', s.status.progress], ['target', s.status.target]].forEach(function (p) { var sp = el('span', 'aos-legend-item'); var dt = el('span', 'aos-ms-dot aos-ms-dot--' + p[0]); dt.setAttribute('aria-hidden', 'true'); sp.appendChild(dt); sp.appendChild(document.createTextNode(p[1])); legend.appendChild(sp); }); body.appendChild(legend);
    showDetail(s.milestones[0]);
    /* v1.5.2: the product-film keyframe filmstrip was removed from the roadmap slide — the film stays on its own tour slide (35). */
    return body;
  }

  /* ================= S4 · Deploy anywhere, own it ================= */
  var PLACEMENT = { A: [0, 0, 0, 0, 0], B: [1, 1, 1, 2, 1], C: [2, 2, 2, 2, 0] }; /* layer → column: 0 institution, 1 institution cloud, 2 AIREV; keys stay institution-held in C */
  function renderS4(lang, api) {
    var d = S[lang], s = d.s4, body = api.head(d.chapter, d.kicker, 'data-privacy', s.title, s.sub); body.classList.add('aos-body--s4');
    var top = el('div', 'aos-deploy-top');
    var seg = el('div', 'aos-seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', s.diagramLabel); seg.setAttribute('data-testid', 'deploy-options');
    var segB = s.options.map(function (o) { var b = btn('aos-seg-btn', null, { 'data-option': o.k, 'aria-pressed': 'false' }); b.appendChild(el('span', 'aos-seg-t', o.t)); b.appendChild(el('span', 'aos-seg-s', o.s)); seg.appendChild(b); return b; });
    top.appendChild(seg);
    var diagram = el('div', 'aos-where'); diagram.setAttribute('data-testid', 'deploy-diagram'); diagram.setAttribute('aria-live', 'polite');
    var dh = el('div', 'aos-where-head'); dh.appendChild(el('span', 'aos-where-lbl', s.diagramLabel)); s.cols.forEach(function (c) { dh.appendChild(el('span', 'aos-where-col', c)); }); diagram.appendChild(dh);
    var tokens = [];
    s.layers.forEach(function (L, i) {
      var row = el('div', 'aos-where-row'); row.appendChild(el('span', 'aos-where-lbl', L));
      var lane = el('div', 'aos-lane'); for (var c = 0; c < 3; c++) { var slot = el('span', 'aos-slot'); slot.setAttribute('aria-hidden', 'true'); lane.appendChild(slot); }
      var tok = el('span', 'aos-token', L); tok.setAttribute('data-layer', String(i)); lane.appendChild(tok); tokens.push(tok);
      row.appendChild(lane); diagram.appendChild(row);
    });
    var live = el('p', 'visually-hidden'); diagram.appendChild(live);
    function apply(k) {
      segB.forEach(function (b) { var on = b.getAttribute('data-option') === k; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('is-on', on); });
      diagram.setAttribute('data-option', k);
      PLACEMENT[k].forEach(function (col, i) { tokens[i].setAttribute('data-col', String(col)); tokens[i].style.setProperty('--col', String(col)); });
      live.textContent = s.options.filter(function (o) { return o.k === k; })[0].t + ' — ' + s.layers.map(function (L, i) { return L + ': ' + s.cols[PLACEMENT[k][i]]; }).join(', ');
    }
    segB.forEach(function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-option')); }); });
    roving(segB, function (j) { apply(segB[j].getAttribute('data-option')); }, 'h');
    top.appendChild(diagram);
    body.appendChild(top);
    var bottom = el('div', 'aos-deploy-bottom');
    var ctlBox = el('div', 'aos-box aos-controls'); ctlBox.appendChild(el('h3', 'aos-box-title', s.controlsTitle));
    var ul = el('ul', 'aos-checklist'); s.controls.forEach(function (c) { var li = el('li'); var ck = el('span', 'aos-check'); ck.setAttribute('aria-hidden', 'true'); ck.textContent = '✓'; li.appendChild(ck); li.appendChild(el('span', null, c)); ul.appendChild(li); }); ctlBox.appendChild(ul);
    bottom.appendChild(ctlBox);
    var stepBox = el('div', 'aos-box aos-stepper-box'); stepBox.appendChild(el('h3', 'aos-box-title', s.stepperTitle));
    var stepper = el('ol', 'aos-stepper'); stepper.setAttribute('data-testid', 'transfer-stepper');
    var stepDesc = el('p', 'aos-step-desc'); stepDesc.setAttribute('aria-live', 'polite');
    var stepB = s.steps.map(function (st, i) { var li = el('li', 'aos-step'); var b = btn('aos-step-btn', null, { 'data-step': String(i + 1), 'aria-pressed': 'false' }); b.appendChild(el('span', 'aos-step-n', String(i + 1))); b.appendChild(el('span', 'aos-step-t', st.t)); li.appendChild(b); stepper.appendChild(li); return b; });
    function setStep(i) { stepB.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); b.classList.toggle('is-on', j === i); b.parentNode.classList.toggle('is-done', j < i); }); stepDesc.textContent = s.steps[i].s; }
    stepB.forEach(function (b, i) { b.addEventListener('click', function () { setStep(i); }); });
    roving(stepB, function (j) { setStep(j); }, 'h');
    stepBox.appendChild(stepper); stepBox.appendChild(stepDesc);
    stepBox.appendChild(el('p', 'aos-pilot', s.pilot));
    bottom.appendChild(stepBox);
    var vis = el('div', 'aos-deploy-vis'); vis.appendChild(plate('plate2-ai-pc-container', s.plateAlt, d.tag, 'aos-plate--s4', true)); vis.appendChild(plate('plate6-kenya-maize', s.plate6Alt, d.tag, 'aos-plate--s4 aos-plate--s4b', true)); bottom.appendChild(vis);
    body.appendChild(bottom);
    apply('A'); setStep(0);
    return body;
  }

  /* ================= S5 · Nations empowered ================= */
  function renderS5(lang, api) {
    var d = S[lang], s = d.s5, body = api.head(d.chapter, d.kicker, 'impact', s.title, s.sub); body.classList.add('aos-body--s5');
    var sel = el('div', 'aos-seg aos-countries'); sel.setAttribute('role', 'tablist'); sel.setAttribute('aria-label', s.title); sel.setAttribute('data-testid', 'country-selector');
    var TB = { access: 't1', ownership: 't2', legacy: 't3' }, ci = 0;
    var cb = s.countries.map(function (c) { ci++; var b = btn('aos-seg-btn aos-country aos-country--' + (c.tierK === 'access' ? 'acc' : c.tierK === 'ownership' ? 'own' : 'leg'), null, { 'data-country': c.k, 'aria-pressed': 'false', role: 'tab', 'aria-selected': 'false', 'aria-controls': 'aos-nation-panel', id: 'aos-tab-' + c.k, 'data-cue': 's38-c' + (ci + 1) }); b.appendChild(el('span', 'aos-seg-t', c.t)); var bd = el('span', 'aos-seg-s aos-tier-badge aos-tier-badge--' + (TB[c.tierK] || 't1'), c.tier); bd.setAttribute('data-testid', 'tier-badge'); b.appendChild(bd); sel.appendChild(b); return b; }); /* v1.5.3: a real tablist with tier badges */
    body.appendChild(sel);
    var panel = el('div', 'aos-nation'); panel.id = 'aos-nation-panel'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-live', 'polite'); panel.setAttribute('data-testid', 'nation-panel');
    body.appendChild(panel);
    var cta = api.link ? el('a', 'cta aos-cta', s.cta) : el('a', 'cta aos-cta', s.cta); cta.href = PLEDGE_HASH; cta.setAttribute('data-testid', 'join-pact-cta'); cta.setAttribute('aria-label', s.ctaAria); cta.setAttribute('data-deck-jump', PLEDGE_HASH);
    var foot = el('div', 'aos-nation-foot'); foot.appendChild(el('p', 'muted small aos-src', s.srcNote)); foot.appendChild(cta); body.appendChild(foot);
    function show(k) {
      cb.forEach(function (b) { var on = b.getAttribute('data-country') === k; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; b.classList.toggle('is-on', on); if (on) panel.setAttribute('aria-labelledby', b.id); });
      var c = s.countries.filter(function (x) { return x.k === k; })[0];
      panel.innerHTML = ''; panel.setAttribute('data-country', k); panel.setAttribute('data-tier', c.tierK);
      var left = el('div', 'aos-nation-copy');
      var kr = el('div', 'aos-nation-kick'); kr.appendChild(el('span', 'it-chip aos-tier aos-tier--' + c.tierK, c.tier)); kr.appendChild(el('span', 'aos-amount', c.amount)); left.appendChild(kr);
      left.appendChild(el('h3', 'aos-nation-title', c.t + ' — ' + c.flagship));
      var dl = el('dl', 'aos-nation-dl');
      [[s.deliveredLabel, c.delivered], [s.outcomesLabel, c.outcomes]].forEach(function (p) { dl.appendChild(el('dt', null, p[0])); dl.appendChild(el('dd', null, p[1])); });
      left.appendChild(dl);
      var wb = el('div', 'aos-wdi'); wb.appendChild(el('span', 'it-wblabel', s.baselineLabel)); c.wdi.forEach(function (t) { wb.appendChild(el('span', 'it-wbtag', t)); }); wb.appendChild(el('span', 'aos-wdi-src', s.wdiSrc)); left.appendChild(wb);
      if (c.links && c.links.length) { /* v1.5.2: 1–2 verified evidence links per country */
        var ev = el('div', 'aos-evidence'); ev.setAttribute('data-testid', 'evidence-links'); ev.appendChild(el('span', 'it-wblabel aos-evidence-lbl', s.evidenceLabel || 'Evidence'));
        c.links.forEach(function (l) { var a = el('a', 'aos-evidence-link', l.t); a.href = l.u; a.target = '_blank'; a.rel = 'noopener noreferrer'; ev.appendChild(a); });
        left.appendChild(ev);
      }
      var LBN = c.k === 'lb'; /* v1.5.8: Lebanon shows the 'UAE × LEBANON · 1M ATHAR USERS' render (GPT Image 2.5, 3:2 shown whole, official ATHAR logo composited over the scene); India and Kenya keep the v1.5.7 generic concept image */
      var bn = el('figure', 'aos-nation-concept'); bn.setAttribute('data-testid', 'nation-concept'); bn.setAttribute('data-no-mirror', 'true'); bn.setAttribute('data-v157', 'product-concept'); bn.setAttribute('data-concept', LBN ? 'lebanon-v158' : 'generic-v157'); bn.style.setProperty('--aos-ar', LBN ? '3 / 2' : '16 / 10'); /* v1.5.7: ONE full concept image per panel (GPT Image 2.5, 1x/2x webp + jpg) replaces the v1.5.5 3-panel strip AND the per-country product-film still */
      var ct = el('span', 'aos-tag aos-concept-tab', s.conceptTab || ''); ct.setAttribute('data-testid', 'concept-tab'); bn.appendChild(ct);
      var bp = el('picture'); var bs = el('source'); bs.type = 'image/webp';
      bs.srcset = LBN ? '/assets/plates/plate5-lebanon-v158-1x.webp' + ' 1x, ' + '/assets/plates/plate5-lebanon-v158-2x.webp' + ' 2x' : '/assets/plates/plate5-concept-v157-1x.webp' + ' 1x, ' + '/assets/plates/plate5-concept-v157-2x.webp' + ' 2x'; bp.appendChild(bs);
      var bi = img(LBN ? '/assets/plates/plate5-lebanon-v158-1x.jpg' : '/assets/plates/plate5-concept-v157-1x.jpg', (LBN ? s.bannerAltLb : s.bannerAlt) || s.bannerTag || '');
      bi.srcset = LBN ? '/assets/plates/plate5-lebanon-v158-1x.jpg' + ' 1x, ' + '/assets/plates/plate5-lebanon-v158-2x.jpg' + ' 2x' : '/assets/plates/plate5-concept-v157-1x.jpg' + ' 1x, ' + '/assets/plates/plate5-concept-v157-2x.jpg' + ' 2x';
      bi.width = 1536; bi.height = LBN ? 1024 : 960; bi.loading = 'eager'; bi.setAttribute('data-no-mirror', 'true'); bp.appendChild(bi); bn.appendChild(bp);
      var hr5 = el('span', 'aos-strip-rule'); hr5.setAttribute('data-testid', 'strip-hairline'); hr5.setAttribute('aria-hidden', 'true'); bn.appendChild(hr5); /* 1 px Legacy Gold hairline closes the image (kept from v1.5.5) */
      bn.appendChild(el('figcaption', 'aos-tag aos-tag--below', s.bannerTag || ''));
      var mini = el('div', 'aos-mini'); mini.setAttribute('data-testid', 'mini-timeline'); mini.appendChild(el('span', 'aos-mini-lbl', s.phaseLabel));
      var track = el('ol', 'aos-mini-track'); s.phases.forEach(function (p) { var li = el('li', 'aos-mini-ph' + (p.k === c.phase ? ' is-on' : '')); li.setAttribute('data-phase', p.k); if (p.k === c.phase) li.setAttribute('aria-current', 'step'); li.appendChild(el('span', 'aos-mini-dot')); li.appendChild(el('span', 'aos-mini-t', p.t)); track.appendChild(li); }); mini.appendChild(track); left.appendChild(mini); /* v1.5.3 QA: the roadmap phase closes the copy column */
      panel.appendChild(left);
      var side = el('div', 'aos-nation-side'); side.setAttribute('data-testid', 'nation-side'); /* v1.5.3: film still + tier banner in the right column */
      side.appendChild(bn); panel.appendChild(side); /* v1.5.7: the per-country product-film stills (p20/p50/p80) are retired with the 'PRODUCT FILM STILL · AT 16.7 S' tag */
    }
    cb.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-country')); }); });
    roving(cb, function (j) { show(cb[j].getAttribute('data-country')); }, 'h');
    show('lb');
    return body;
  }


  /* ---------- shared app chrome for the tour tabs (sidebar + top bar from the wireframes) ---------- */
  var CHROME = {
    en: { brand: 'ATHAR', newSession: 'New Session', search: 'Search', nav: [['marketplace', 'Go to Marketplace'], ['overview', 'Overview'], ['agents', 'My Agents'], ['playground', 'Playground'], ['artifacts', 'Artifacts'], ['flow', 'Agent Flow Builder'], ['tools', 'Tools & Deployment'], ['insights', 'Insights & Help']], foot: [['prompts', 'My Prompts'], ['settings', 'Settings'], ['advanced', 'Advanced Features']], titles: { overview: 'Overview', marketplace: 'Marketplace', playground: 'Playground', flow: 'Agent Flow Builder' } },
    ar: { brand: 'أثر', newSession: 'جلسة جديدة', search: 'بحث', nav: [['marketplace', 'إلى السوق'], ['overview', 'النظرة العامة'], ['agents', 'وكلائي'], ['playground', 'الملعب'], ['artifacts', 'المخرجات'], ['flow', 'منشئ تدفقات الوكلاء'], ['tools', 'الأدوات والنشر'], ['insights', 'الرؤى والمساعدة']], foot: [['prompts', 'موجّهاتي'], ['settings', 'الإعدادات'], ['advanced', 'ميزات متقدمة']], titles: { overview: 'النظرة العامة', marketplace: 'السوق', playground: 'الملعب', flow: 'منشئ تدفقات الوكلاء' } }
  };
  var ICON = { marketplace: 'M3 9h18l-1.5 10h-15z M8 9V6a4 4 0 0 1 8 0v3', overview: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z', agents: 'M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z M4 21a8 8 0 0 1 16 0', playground: 'M5 4l14 8-14 8z', artifacts: 'M6 3h9l4 4v14H6z M15 3v4h4', flow: 'M5 6h4v4H5z M15 14h4v4h-4z M9 8h3a3 3 0 0 1 3 3v3', tools: 'M14 6a4 4 0 0 0 4 4l-8 8-3-3 8-8z M4 20l3-3', insights: 'M12 3a9 9 0 1 0 9 9 M12 7v5l3 3', prompts: 'M4 5h16v10H8l-4 4z', settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4 12h2 M18 12h2 M12 4v2 M12 18v2', advanced: 'M12 3l2.5 6 6.5.5-5 4.3 1.6 6.4L12 16.8 6.4 20.2 8 13.8 3 9.5l6.5-.5z' };
  function icon(k) { var s = svgEl('svg', { viewBox: '0 0 24 24', width: '16', height: '16', 'aria-hidden': 'true', focusable: 'false' }); s.appendChild(svgEl('path', { d: ICON[k] || ICON.overview, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })); return s; }
  function appChrome(ctx, active) {
    var c = CHROME[ctx.lang], root = el('div', 'aos-shell'); root.setAttribute('data-active', active);
    var side = el('nav', 'aos-side'); side.setAttribute('aria-label', c.brand);
    var brand = el('div', 'aos-side-brand'); var bl = img('/brand/athar-mark-only-arabic.png', ''); bl.className = 'aos-side-logo'; brand.appendChild(bl); brand.appendChild(el('span', 'aos-side-brandname', c.brand)); side.appendChild(brand);
    var ns = btn('aos-side-new', c.newSession); ns.tabIndex = -1; side.appendChild(ns);
    var ul = el('ul', 'aos-side-list');
    c.nav.forEach(function (n) { var li = el('li', 'aos-side-item' + (n[0] === active ? ' is-on' : '')); li.appendChild(icon(n[0])); li.appendChild(el('span', null, n[1])); if (n[0] === active) li.setAttribute('aria-current', 'page'); ul.appendChild(li); });
    side.appendChild(ul);
    var uf = el('ul', 'aos-side-list aos-side-list--foot'); c.foot.forEach(function (n) { var li = el('li', 'aos-side-item'); li.appendChild(icon(n[0])); li.appendChild(el('span', null, n[1])); uf.appendChild(li); }); side.appendChild(uf);
    root.appendChild(side);
    var pane = el('div', 'aos-pane');
    var top = el('header', 'aos-top'); top.appendChild(el('h4', 'aos-top-title', c.titles[active] || ''));
    var sr = el('div', 'aos-top-search'); sr.appendChild(el('span', 'aos-top-search-ico', '⌕')); sr.appendChild(el('span', 'aos-top-search-t', c.search)); top.appendChild(sr);
    var av = el('span', 'aos-avatar', ctx.lang === 'ar' ? 'م' : 'M'); av.setAttribute('aria-hidden', 'true'); top.appendChild(av);
    pane.appendChild(top);
    var main = el('div', 'aos-main'); pane.appendChild(main); root.appendChild(pane);
    return { root: root, main: main, side: side };
  }
  window.AtharTour = window.AtharTour || {}; window.AtharTour._chrome = appChrome; window.AtharTour._icon = icon;

  /* ---------- registry ---------- */
  var slides = [
    { id: 'aos-overview', title: { en: S.en.s1.title, ar: S.ar.s1.title }, render: renderS1 },
    { id: 'aos-tour', title: { en: S.en.s2.title, ar: S.ar.s2.title }, render: renderS2, onShow: function (sec, active) { var b = sec.querySelector(':scope > .s-body'); if (b && b.__aos) b.__aos.onShow(active); } },
    { id: 'aos-roadmap', title: { en: S.en.s3.title, ar: S.ar.s3.title }, render: renderS3 },
    { id: 'aos-deploy', title: { en: S.en.s4.title, ar: S.ar.s4.title }, render: renderS4 },
    { id: 'aos-nations', title: { en: S.en.s5.title, ar: S.ar.s5.title }, render: renderS5 }
  ];
  /* keys owned by the widgets (tour app, layer stack, chips, steppers, flow nodes): after the target handlers have run,
     stop Space / arrows / Page / Home / End at document level so the bundle's window-level slide router never sees them */
  document.addEventListener('keydown', function (ev) {
    var t = ev.target; if (!(t && t.closest && t.closest('[data-keys="own"]'))) return;
    var k = ev.key; if (k === ' ' || k === 'Spacebar' || k === 'PageDown' || k === 'PageUp' || k === 'Home' || k === 'End' || /^Arrow/.test(k)) ev.stopPropagation();
  });
  /* in-deck jumps: hash links to real slides are handled by the React router; virtual deep links by the host */
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[data-deck-jump]') : null; if (!a) return;
    ev.preventDefault(); var h = a.getAttribute('data-deck-jump');
    var m = /^#\/27\/new-(\d+)$/.exec(h);
    if (m && window.AtharImpactTiers) { if (window.location.hash.indexOf('#/27') !== 0) { window.history.replaceState(null, '', '#/27'); window.dispatchEvent(new HashChangeEvent('hashchange')); } window.setTimeout(function () { window.AtharImpactTiers.go(parseInt(m[1], 10)); }, 0); return; }
    if (window.AtharImpactTiers) window.AtharImpactTiers.exit();
    window.location.hash = h; window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, true);
  window.AtharOS = { version: VERSION, slides: slides, strings: S };
})();
