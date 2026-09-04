// Guide Mode script — one narrated "moment" per key element of the exact 2-slide deck (v3 (1)(2)).
// Highlight boxes are fractions of the slide (x, y, w, h in 0..1), measured from the PPTX shape
// geometry (12192000 × 6858000 EMU) so they sit on the rendered PDF page at any zoom.
// Narration is written for a soft-spoken, unhurried presenter voice.

const box = (x, y, w, h) => ({ x, y, w, h });

// Slide 1 — gate columns (G1…G6) start at x ≈ 0.0478 and repeat every 0.1525 of the slide width.
const gateCol = (i) => box(0.0478 + i * 0.1525, 0.418, 0.146, 0.148);
// Slide 1 — KPI tiles: six tiles from x ≈ 0.0573, every 0.1543.
const tile = (i) => box(0.0553 + i * 0.1543, 0.232, 0.124, 0.118);
// Slide 2 — gate rows: first row at y ≈ 0.284, repeating every 0.0987.
const row = (i) => box(0.0505, 0.279 + i * 0.0987, 0.908, 0.088);

export const GUIDE_SCRIPT = [
  {
    n: 1,
    title: 'Athar JV — Executive Summary',
    steps: [
      {
        id: 's1-open',
        label: 'Executive summary',
        kind: 'moment',
        boxes: [box(0.0438, 0.062, 0.9125, 0.15)],
        text:
          'Welcome. Let me walk you through the Athar joint venture executive summary. Athar is a fifty-fifty joint venture between ODA and AIREV: sovereign agentic AI for the UAE Presidential Court development ecosystem, taking us from a signed MoU to the first anchor cohort live in six months.',
      },
      {
        id: 's1-kpis',
        label: 'Headline numbers',
        kind: 'milestone',
        boxes: [tile(0), tile(1), tile(2)],
        text:
          'First, the headline numbers. Roughly five hundred anchor seats in the UAE-only base case, across five UAE anchors, all contracted by Gate four. Each seat is priced at one thousand dirhams per month, about two hundred and seventy-two US dollars.',
      },
      {
        id: 's1-kpis-2',
        label: 'Growth & value',
        kind: 'milestone',
        boxes: [tile(3), tile(4), tile(5)],
        text:
          'Products grow from eight at go-live to twenty by the end of year one. Revenue builds from fifteen point seven eight million dirhams in year one to forty point zero four million in year three. And the whole journey is governed by six gates, from October twenty twenty-six to March twenty twenty-seven.',
      },
      {
        id: 's1-g1',
        label: 'Gate 1 · 8–10 Oct 2026',
        kind: 'gate',
        boxes: [gateCol(0)],
        text:
          'Now the six gates. Gate one is the MoU signing window, the eighth to the tenth of October twenty twenty-six. Once the MoU is signed, the build work is authorised.',
      },
      {
        id: 's1-g2',
        label: 'Gate 2 · 20 Nov 2026',
        kind: 'gate',
        boxes: [gateCol(1)],
        text: 'Gate two, on the twentieth of November: the sovereign platform is certified ready, and the venture is formally incorporated.',
      },
      {
        id: 's1-g3',
        label: 'Gate 3 · 25 Dec 2026',
        kind: 'gate',
        boxes: [gateCol(2)],
        text: 'Gate three, the twenty-fifth of December: ODA goes live, with one hundred users and eight owner-approved products.',
      },
      {
        id: 's1-g4',
        label: 'Gate 4 · 29 Jan 2027',
        kind: 'gate',
        boxes: [gateCol(3)],
        text: 'Gate four, the twenty-ninth of January twenty twenty-seven: all five UAE anchors are contracted, for around five hundred seats.',
      },
      {
        id: 's1-g5',
        label: 'Gate 5 · 19 Feb 2027',
        kind: 'gate',
        boxes: [gateCol(4)],
        text: 'Gate five, the nineteenth of February, is launch. The first cohort is live, and subscription billing starts.',
      },
      {
        id: 's1-g6',
        label: 'Gate 6 · 26 Mar 2027',
        kind: 'gate',
        boxes: [gateCol(5)],
        text: 'And gate six, the twenty-sixth of March: the month-six review, and the decision on an owned compute cluster.',
      },
      {
        id: 's1-anchors',
        label: 'Anchors · UAE-only base case',
        kind: 'moment',
        boxes: [box(0.052, 0.585, 0.30, 0.225)],
        text:
          'The anchors. ODA with one hundred seats, ADFD one hundred, the UAE Aid Agency one hundred and forty, Erth Zayed ninety, and the Emirates Red Crescent seventy. That is our five hundred seats, all contracted by Gate four. International seats are upside, not in the base case.',
      },
      {
        id: 's1-commercials',
        label: 'Commercials · model base case',
        kind: 'milestone',
        boxes: [box(0.382, 0.585, 0.262, 0.232)],
        text:
          'The commercials, from the consolidated financial model, version thirteen. Committed capital of twenty point four million dirhams, ten point two million per partner. ODA net present value at three and a half percent is sixty point two million; AIREV, at ten percent, thirty point one million. Revenue runs fifteen point seven eight, to twenty-seven point two seven, to forty point zero four million. Billing begins at Gate five.',
      },
      {
        id: 's1-delivery',
        label: 'Delivery & cadence',
        kind: 'moment',
        boxes: [box(0.674, 0.585, 0.28, 0.245)],
        text:
          'Delivery and cadence. Three ODA product owners with five AIREV engineers, an Abu Dhabi headquarters and a Dalberg programme office. Weekly delivery, fortnightly steering, the first board on the twenty-seventh of November, and evidence packs at months four and six.',
      },
      {
        id: 's1-product',
        label: 'Product & compliance',
        kind: 'moment',
        boxes: [box(0.052, 0.84, 0.895, 0.08)],
        text:
          'Finally, product and compliance. Thirty-six products across twelve departments, sixteen hardened first; roughly twelve hundred and seventy-five agents; SOC two type two, ISO twenty-seven thousand and one, zero trust, UAE data residency and sovereign compute. Let us turn to the roadmap.',
      },
    ],
  },
  {
    n: 2,
    title: 'Implementation Roadmap — Six Gates',
    steps: [
      {
        id: 's2-open',
        label: 'Roadmap · W1 = 5 Oct 2026',
        kind: 'moment',
        boxes: [box(0.0438, 0.062, 0.9125, 0.11)],
        text:
          'This is the implementation roadmap: October twenty twenty-six to March twenty twenty-seven. Week one is the MoU signing week, starting Monday the fifth of October, and fifty-three activities roll up into six gate-level phases.',
      },
      {
        id: 's2-g1',
        label: 'G1 · MoU signing window',
        kind: 'gate',
        boxes: [row(0)],
        text: 'Gate one, the MoU signing window: four activities, Thursday the eighth to Saturday the tenth of October. The MoU is signed by ODA and AIREV, and build work is authorised.',
      },
      {
        id: 's2-g2',
        label: 'G2 · Sign & formalise',
        kind: 'gate',
        boxes: [row(1)],
        text: 'Gate two, sign and formalise: twelve activities over seven weeks, closing Friday the twentieth of November, with the sovereign platform certified ready and the venture incorporated.',
      },
      {
        id: 's2-g3',
        label: 'G3 · Build & harden',
        kind: 'gate',
        boxes: [row(2)],
        text: 'Gate three, build and harden: fourteen activities over five weeks to Friday the twenty-fifth of December. ODA goes live with one hundred users and eight owner-approved products.',
      },
      {
        id: 's2-g4',
        label: 'G4 · Contract & onboard',
        kind: 'gate',
        boxes: [row(3)],
        text: 'Gate four, contract and onboard: seven activities over five weeks to Friday the twenty-ninth of January. All five UAE anchors are contracted, for around five hundred seats.',
      },
      {
        id: 's2-g5',
        label: 'G5 · Launch & scale',
        kind: 'gate',
        boxes: [row(4)],
        text: 'Gate five, launch and scale: six activities in three weeks to Friday the nineteenth of February. Launch, first cohort live, and subscription billing starts.',
      },
      {
        id: 's2-g6',
        label: 'G6 · Evaluate & decide',
        kind: 'gate',
        boxes: [row(5)],
        text: 'And gate six, evaluate and decide: ten activities over five weeks to Friday the twenty-sixth of March. The month-six review, and the owned-compute-cluster decision.',
      },
      {
        id: 's2-close',
        label: 'End of guided tour',
        kind: 'milestone',
        boxes: [box(0.06, 0.885, 0.85, 0.04)],
        text:
          'That completes the guided tour: six gates, fifty-three activities, from MoU signature to a live, billing anchor cohort in six months. Feel free to explore any month on the timeline, or ask the plan a question. Thank you.',
      },
    ],
  },
];

export const GUIDE_STEPS = GUIDE_SCRIPT.flatMap((s) =>
  s.steps.map((st, i) => ({ ...st, slide: s.n, slideTitle: s.title, stepInSlide: i + 1, stepsInSlide: s.steps.length })),
);
export const GUIDE_TOTAL = GUIDE_STEPS.length;
export const firstStepOfSlide = (n) => GUIDE_STEPS.findIndex((s) => s.slide === n);
