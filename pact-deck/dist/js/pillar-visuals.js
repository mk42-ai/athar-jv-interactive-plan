/* Athar Open Agentic Pact deck — v1.5.2 (2026-09-30): plugins hub diagram rebuilt (8 px grid, two-line label, symmetric spokes, centred dashed drop, 2 px teal strokes); v1.2.1 (2026-09-24) pillar visual system.
   Runtime enhancement (the React sources are 0-byte after the platform restore, so the built deck is
   extended at runtime, like the v1.2.0 partner strip). Adds to the six "Six pillars" slides:
     • a pack icon in the pillar header (brand/icons/pack/*.png — cut from the Athar Brand Asset Pack v3
       iconography sheet, luminance-keyed to primary navy; no redrawing),
     • a native inline-SVG motif in a right-hand column (split layout; mirrored geometry under dir=rtl),
     • a khatam pattern band under the motif.
   Palette: brand/brand-tokens.json only (navy #062739, Gulf Blue #1E3A5F, Falaj Teal #0E8A7D,
   Legacy Gold #B8975A, Stone #D9D4C7, Manuscript #F7F3EA, White). No gradients, no gloss, no text effects.
   Copy on the slides is untouched (verbatim). Labels inside the motif are EN only and are hidden in the AR
   locale (no Arabic text is invented); the numeric markers 1–4 tie each band to the slide's bullets. */
(function () {
  'use strict';
  var C = { navy: '#062739', gulf: '#1E3A5F', teal: '#0E8A7D', gold: '#B8975A', stone: '#D9D4C7', manuscript: '#F7F3EA', white: '#FFFFFF', graphite: '#2B3238', sand: '#E8D9B5' };
  var CONF = {
    's-pillar-plugins':           { icon: 'automation',          motif: 'plugins',    mode: 'split' },
    's-pillar-skills':            { icon: 'tasks',               motif: 'skills',     mode: 'split' },
    's-pillar-open-ecosystem':    { icon: 'data-privacy',        motif: null,         mode: 'band'  },
    's-pillar-cross-model':       { icon: 'agents',              motif: null,         mode: 'band'  },
    's-pillar-universal-licence': { icon: 'government-services', motif: null,         mode: 'band'  },
    's-pillar-upskilling':        { icon: 'education',           motif: 'upskilling', mode: 'split' }
  };
  var W = 560;
  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function rtl() { return document.documentElement.dir === 'rtl'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ---------- primitives (all x-coordinates pass through X() so the geometry mirrors in RTL) ---------- */
  function mk(r) {
    var m = r ? -1 : 1;
    var X = function (x) { return r ? W - x : x; };
    var anchor = function (a) { return !r ? a : (a === 'start' ? 'end' : a === 'end' ? 'start' : a); };
    var o = { X: X, m: m };
    o.line = function (x1, y1, x2, y2, col, w, dash) {
      return '<line x1="' + X(x1) + '" y1="' + y1 + '" x2="' + X(x2) + '" y2="' + y2 + '" stroke="' + (col || C.gulf) + '" stroke-width="' + (w || 1.6) + '" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
    };
    o.curve = function (x1, y1, x2, y2, col, w) { /* horizontal S-curve */
      var cx = (x1 + x2) / 2;
      return '<path d="M' + X(x1) + ' ' + y1 + ' C' + X(cx) + ' ' + y1 + ' ' + X(cx) + ' ' + y2 + ' ' + X(x2) + ' ' + y2 + '" fill="none" stroke="' + (col || C.teal) + '" stroke-width="' + (w || 1.6) + '" stroke-linecap="round"/>';
    };
    o.arrowhead = function (x, y, dir, col, w) { /* dir: 1 = pointing to +x (mirrored automatically), 'down' */
      var sw = w || 1.6;
      if (dir === 'down') return '<path d="M' + (X(x) - 5) + ' ' + (y - 7) + ' L' + X(x) + ' ' + y + ' L' + (X(x) + 5) + ' ' + (y - 7) + '" fill="none" stroke="' + (col || C.gulf) + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"/>';
      var d = dir * m;
      return '<path d="M' + (X(x) - 7 * d) + ' ' + (y - 5) + ' L' + X(x) + ' ' + y + ' L' + (X(x) - 7 * d) + ' ' + (y + 5) + '" fill="none" stroke="' + (col || C.gulf) + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"/>';
    };
    o.rect = function (x, y, w, h, rad, fill, stroke, sw) {
      return '<rect x="' + (r ? X(x) - w : x) + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rad == null ? 10 : rad) + '" fill="' + (fill || C.white) + '" stroke="' + (stroke || C.stone) + '" stroke-width="' + (sw == null ? 1.2 : sw) + '"/>';
    };
    o.circle = function (cx, cy, rr, fill, stroke, sw) {
      return '<circle cx="' + X(cx) + '" cy="' + cy + '" r="' + rr + '" fill="' + (fill || C.white) + '" stroke="' + (stroke || C.gulf) + '" stroke-width="' + (sw == null ? 1.6 : sw) + '"/>';
    };
    o.text = function (x, y, s, opt) {
      opt = opt || {};
      var a = anchor(opt.anchor || 'start');
      return '<text class="pv-label' + (opt.cls ? ' ' + opt.cls : '') + '" x="' + X(x) + '" y="' + y + '" text-anchor="' + a + '" font-size="' + (opt.size || 12.5) + '" font-weight="' + (opt.weight || 500) + '" fill="' + (opt.fill || C.navy) + '"' + (opt.caps ? ' letter-spacing=".08em" style="text-transform:uppercase"' : '') + '>' + esc(s) + '</text>';
    };
    o.marker = function (x, y, n) { /* numeric marker tying a band to bullet n */
      return '<g class="pv-marker"><circle cx="' + X(x) + '" cy="' + y + '" r="11" fill="' + C.white + '" stroke="' + C.gold + '" stroke-width="1.6"/><text x="' + X(x) + '" y="' + (y + 4) + '" text-anchor="middle" font-size="11.5" font-weight="700" fill="' + C.navy + '">' + n + '</text></g>';
    };
    /* glyphs: 24-unit outline icons in the pack sheet’s style (stroke ≈ 4 % of the box, round joins) */
    var G = {
      agent: '<rect x="4" y="7" width="16" height="12" rx="3"/><circle cx="9.5" cy="13" r="1.4" fill="currentColor" stroke="none"/><circle cx="14.5" cy="13" r="1.4" fill="currentColor" stroke="none"/><path d="M12 7V4M9 4h6"/>',
      plug: '<path d="M8 3v5M16 3v5M6 8h12v4a6 6 0 0 1-12 0z"/><path d="M12 18v3"/>',
      tools: '<path d="M14.5 4.5a4 4 0 0 0-5 5L4 15l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2-2z"/>',
      connectors: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
      data: '<ellipse cx="12" cy="6.5" rx="7" ry="2.8"/><path d="M5 6.5v11c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-11"/><path d="M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8"/>',
      services: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
      publish: '<path d="M12 16V5M7.5 9.5 12 5l4.5 4.5"/><path d="M4 16v3h16v-3"/>',
      version: '<path d="M4 12.5V5h7.5L20 13.5 12.5 21z"/><circle cx="8.5" cy="9.5" r="1.4" fill="currentColor" stroke="none"/>',
      discover: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
      owner: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
      use: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
      languages: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16"/>',
      institution: '<path d="M3 10l9-5 9 5"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
      country: '<path d="M4 20V5l5 2 6-2 5 2v15l-5-2-6 2z"/><path d="M9 7v13M15 5v13"/>',
      model: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="12" cy="13" r="2.4"/><path d="M12 7v3.6M10.3 14.8 6.4 17.5M13.7 14.8l3.9 2.7"/>',
      package: '<path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
      prototype: '<path d="M4 20 15 9l3 3L7 23H4z"/><path d="M13 7l4-4 4 4-4 4"/>',
      evaluate: '<path d="M9 3h6M10 3v6L4.5 19a1.8 1.8 0 0 0 1.6 2.6h11.8a1.8 1.8 0 0 0 1.6-2.6L14 9V3"/><path d="M7.5 15h9"/>',
      validate: '<circle cx="12" cy="12" r="8"/><path d="m8 12.5 2.8 2.8L16 9.5"/>',
      nocode: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><path d="M16.5 13.5v6M13.5 16.5h6"/>',
      procode: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
      pathway: '<path d="M5 19c4-9 10-9 14-14"/><circle cx="5" cy="19" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="5" r="1.6" fill="currentColor" stroke="none"/>',
      certificate: '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M7 10h6M7 13.5h4"/><circle cx="16.5" cy="13" r="2.2"/><path d="M15.5 15v5l1-1 1 1v-5"/>',
      renew: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4.5h-4.5"/>',
      learners: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.6"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0M13 18.5a4.5 4.5 0 0 1 8.5 0"/>',
      captions: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 12h4M13 12h4M7 15.5h10"/>'
    };
    o.glyph = function (name, cx, cy, size, col) {
      var s = (size || 22) / 24;
      return '<g transform="translate(' + X(cx) + ' ' + cy + ') scale(' + (s * m) + ' ' + s + ') translate(-12 -12)" fill="none" stroke="' + (col || C.navy) + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" color="' + (col || C.navy) + '">' + (G[name] || '') + '</g>';
    };
    o.node = function (name, cx, cy, rr, col) { return o.circle(cx, cy, rr || 18, C.white, col || C.gulf, 1.4) + o.glyph(name, cx, cy, (rr || 18) * 1.15, col || C.navy); };
    return o;
  }

  /* ---------- motifs ---------- */
  function plugins(r) {
    /* v1.5.2 rebuild — 8 px grid, hub node 176×96 with the label on two lines (≥12 px inner padding), plug icon
       centred, inbound arrow at the box's vertical centre, four spokes from ONE origin with symmetric handles and
       equal 48 px spacing, dashed drop centred under the node; every diagram stroke 2 px Falaj Teal, dash 4 4. */
    var p = mk(r), s = '';
    var HX = 192, HY = 64, HW = 176, HH = 96, HC = HX + HW / 2, HM = HY + HH / 2; /* hub box + centre (280, 112) */
    var dash = '4 4', sw = 2;
    /* band 1 — agent → one shared plugin standard → tools / connectors / data sources / services */
    s += p.marker(22, HM, 1);
    s += p.circle(84, HM, 26, C.white, C.gulf, 2) + p.glyph('agent', 84, HM, 30, C.navy);
    s += p.text(84, HM + 44, 'agent', { anchor: 'middle' });
    s += p.line(112, HM, HX - 10, HM, C.gulf, sw) + p.arrowhead(HX - 1, HM, 1, C.gulf, sw);
    s += p.rect(HX, HY, HW, HH, 14, C.white, C.navy, sw);
    s += p.glyph('plug', HC, HY + 26, 30, C.navy);
    s += p.text(HC, HY + 60, 'one shared', { anchor: 'middle', size: 12.5, weight: 600 });
    s += p.text(HC, HY + 76, 'plugin standard', { anchor: 'middle', size: 12.5, weight: 600 });
    var right = [['tools', 'tools', HM - 72], ['connectors', 'connectors', HM - 24], ['data', 'data sources', HM + 24], ['services', 'services', HM + 72]];
    right.forEach(function (n) {
      s += p.curve(HX + HW, HM, 424, n[2], C.teal, sw);
      s += p.circle(446, n[2], 17, C.white, C.teal, 2) + p.glyph(n[0], 446, n[2], 19.5, C.teal);
      s += p.text(470, n[2] + 4, n[1], { size: 12 });
    });
    /* band 2 — published, versioned, discoverable inside the marketplace */
    s += p.line(HC, HY + HH, HC, 226, C.teal, sw, dash) + p.arrowhead(HC, 228, 'down', C.teal, sw);
    s += p.marker(22, 268, 2);
    s += p.rect(HC - 138, 236, 276, 66, 14, C.manuscript, C.stone, 1.2);
    s += p.text(HC - 126, 230, 'marketplace', { size: 10.5, weight: 700, caps: true, fill: C.gulf });
    [['publish', 'publish', HC - 86], ['version', 'version', HC], ['discover', 'discover', HC + 86]].forEach(function (n) {
      s += p.rect(n[2] - 38, 248, 76, 42, 21, C.white, C.stone, 1.2);
      s += p.glyph(n[0], n[2] - 18, 269, 18, C.navy);
      s += p.text(n[2] - 6, 273, n[1], { size: 11 });
    });
    /* band 3 — disclosed intended use, named owner, supported languages */
    s += p.line(HC, 302, HC, 336, C.teal, sw, dash) + p.arrowhead(HC, 338, 'down', C.teal, sw);
    s += p.marker(22, 398, 3);
    s += p.rect(HC - 138, 346, 276, 106, 14, C.white, C.navy, 1.4);
    s += p.text(HC - 122, 366, 'plugin', { size: 10.5, weight: 700, caps: true, fill: C.gulf });
    s += p.line(HC - 122, 372, HC + 122, 372, C.gold, 1.2);
    [['owner', 'a named owner', 388], ['use', 'a disclosed intended use', 413], ['languages', 'supported languages', 438]].forEach(function (n) {
      s += p.glyph(n[0], HC - 116, n[2] - 4, 18, C.teal);
      s += p.text(HC - 98, n[2], n[1], { size: 11.5 });
    });
    /* band 4 — the same standard across institutions, countries and models (concentric arcs) */
    s += p.marker(22, 536, 4);
    var cx = HC, cy = 596;
    [[112, 'institutions', 'institution'], [80, 'countries', 'country'], [48, 'models', 'model']].forEach(function (a, i) {
      var rr = a[0];
      s += '<path d="M' + p.X(cx - rr) + ' ' + cy + ' A' + rr + ' ' + rr + ' 0 0 1 ' + p.X(cx + rr) + ' ' + cy + '" fill="none" stroke="' + [C.gulf, C.teal, C.gold][i] + '" stroke-width="2"/>';
      s += p.text(cx, cy - rr - 6, a[1], { anchor: 'middle', size: 11.5, weight: 600 });
      s += p.glyph(a[2], cx + rr, cy - 2, 16, C.navy);
    });
    s += p.glyph('plug', cx, cy - 14, 22, C.navy);
    return wrap(s, 612);
  }

  function skills(r) {
    var p = mk(r), s = '';
    /* band 1 — a skill packages a capability; any validated agent loads and reuses it */
    s += p.marker(22, 96, 1);
    s += p.rect(58, 56, 120, 80, 14, C.white, C.navy, 1.6);
    s += p.glyph('package', 118, 86, 34, C.navy);
    s += p.text(118, 122, 'skill', { anchor: 'middle', size: 11.5, weight: 600 });
    [[52, 'agent'], [96, 'agent'], [140, 'agent']].forEach(function (n) {
      s += p.curve(178, 96, 300, n[0], C.teal, 1.6);
      s += p.node('agent', 322, n[0], 17, C.teal);
    });
    s += p.text(350, 100, 'any validated agent', { size: 12 });
    s += p.text(350, 118, 'can load and reuse it', { size: 12 });
    /* band 2 — the same builder journey: prototype, evaluate, validate */
    s += p.marker(22, 226, 2);
    s += p.line(70, 226, 500, 226, C.stone, 1.6);
    [['prototype', 'prototype', 120], ['evaluate', 'evaluate', 272], ['validate', 'validate', 424]].forEach(function (n, i) {
      s += p.node(n[0], n[2], 226, 22, [C.gulf, C.teal, C.gold][i]);
      s += p.text(n[2], 268, n[1], { anchor: 'middle', size: 12 });
      if (i < 2) s += p.arrowhead(n[2] + 76, 226, 1, C.stone);
    });
    /* band 3 — no-code and pro-code pathways both publish deeper skills */
    s += p.marker(22, 368, 3);
    s += p.rect(58, 320, 168, 52, 26, C.manuscript, C.stone, 1.2);
    s += p.glyph('nocode', 84, 346, 20, C.navy);
    s += p.text(104, 350, 'no-code pathways', { size: 11.5 });
    s += p.marker(22, 428, 4);
    s += p.rect(58, 392, 168, 52, 26, C.manuscript, C.stone, 1.2);
    s += p.glyph('procode', 84, 418, 20, C.navy);
    s += p.text(104, 422, 'pro-code pathways', { size: 11.5 });
    s += p.curve(226, 346, 330, 382, C.teal, 1.6) + p.curve(226, 418, 330, 382, C.teal, 1.6);
    s += p.node('publish', 352, 382, 22, C.gulf);
    s += p.text(382, 378, 'build, test', { size: 12 });
    s += p.text(382, 396, 'and publish', { size: 12 });
    return wrap(s, 470);
  }

  function upskilling(r) {
    var p = mk(r), s = '';
    /* band 1 — six role-based Academy pathways → certified, applied capability */
    s += p.marker(22, 86, 1);
    for (var i = 0; i < 6; i++) {
      var x = 70 + i * 40;
      s += p.node('pathway', x, 62 + (i % 2) * 40, 15, i % 2 ? C.teal : C.gulf);
      s += p.curve(x + 15, 62 + (i % 2) * 40, 330, 86, C.stone, 1.2);
    }
    s += p.text(70, 138, 'six role-based Academy pathways', { size: 11.5 });
    s += p.node('certificate', 352, 86, 24, C.gold);
    s += p.text(384, 82, 'certified, applied', { size: 12 });
    s += p.text(384, 100, 'capability', { size: 12 });
    /* band 2 — certificates renew every two years through learning or verified practice */
    s += p.marker(22, 206, 2);
    s += p.node('renew', 120, 206, 24, C.gulf);
    s += p.text(120, 250, 'renew', { anchor: 'middle', size: 12 });
    s += p.curve(144, 206, 250, 180, C.teal, 1.6) + p.curve(144, 206, 250, 232, C.teal, 1.6);
    s += p.node('learners', 272, 180, 17, C.teal);
    s += p.text(296, 184, 'learning', { size: 11.5 });
    s += p.node('validate', 272, 232, 17, C.teal);
    s += p.text(296, 236, 'verified practice', { size: 11.5 });
    /* band 3 — year-one targets (values verbatim from the slide copy) */
    s += p.marker(22, 318, 3);
    var bars = [['10,000 learners', 10000], ['2,500 certified', 2500], ['100 trained facilitators', 100]];
    bars.forEach(function (b, i) {
      var y = 300 + i * 34, w = Math.max(6, 300 * Math.sqrt(b[1] / 10000));
      s += p.rect(70, y, 300, 14, 7, C.manuscript, C.stone, 1);
      s += p.rect(70, y, w, 14, 7, [C.gulf, C.teal, C.gold][i], [C.gulf, C.teal, C.gold][i], 0);
      s += p.text(380, y + 12, b[0], { size: 11.5 });
    });
    s += p.text(70, 296 - 10, 'year-one targets', { size: 10.5, weight: 700, caps: true, fill: C.gulf });
    /* band 4 — Arabic and English at launch, low-bandwidth delivery; band 5 — captions, transcripts, screen readers */
    s += p.marker(22, 442, 4);
    s += p.node('languages', 84, 442, 22, C.gulf);
    s += p.text(116, 438, 'Arabic and English', { size: 12 });
    s += p.text(116, 456, 'low-bandwidth delivery', { size: 12 });
    s += p.marker(292, 442, 5);
    s += p.node('captions', 354, 442, 22, C.teal);
    s += p.text(386, 438, 'captions, transcripts,', { size: 12 });
    s += p.text(386, 456, 'screen readers', { size: 12 });
    return wrap(s, 500);
  }

  function wrap(inner, h) {
    return '<svg class="pv-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + h + '" width="' + W + '" height="' + h + '" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" style="max-block-size:100%" role="img" aria-hidden="true" focusable="false" font-family="IBM Plex Sans, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif">' + inner + '</svg>';
  }
  var MOTIFS = { plugins: plugins, skills: skills, upskilling: upskilling };

  /* v1.5.2: slide-13 intro paragraph matches the bullet-list width; aside never clips at 1280×720 */
  (function () {
    if (document.getElementById('pv-v152')) return;
    var st = document.createElement('style'); st.id = 'pv-v152';
    st.textContent = '#s-pillar-plugins p.sub{max-inline-size:min(80ch,768px)}' +
      '.slide.pv-mode-split>.s-body>.pv-aside{overflow:visible}' +
      '.pv-aside .pv-svg{max-block-size:min(52vh,560px);overflow:visible}' +
      '@media (max-height:760px){.pv-aside .pv-svg{max-block-size:46vh}}';
    (document.head || document.documentElement).appendChild(st);
  })();


  /* ---------- injection ---------- */
  var lastKey = null;
  function build(sec, conf) {
    var head = sec.querySelector('.s-head');
    if (head && !head.querySelector(':scope > .pv-icon')) {
      var ic = document.createElement('span');
      ic.className = 'pv-icon';
      ic.setAttribute('aria-hidden', 'true');
      var img = document.createElement('img');
      img.src = '/brand/icons/pack/' + conf.icon + '.png';
      img.width = 256; img.height = 256; img.alt = ''; img.decoding = 'async'; img.loading = 'eager';
      img.setAttribute('data-pack-icon', conf.icon);
      ic.appendChild(img);
      head.insertBefore(ic, head.firstChild);
    }
    sec.classList.add('has-pillar-visual', 'pv-mode-' + conf.mode);
    if (!conf.motif) return;
    var body = sec.querySelector(':scope > .s-body');
    if (!body) return;
    var aside = body.querySelector(':scope > .pv-aside');
    var key = conf.motif + ':' + (rtl() ? 'rtl' : 'ltr');
    if (aside && aside.getAttribute('data-key') === key) return;
    if (!aside) {
      aside = document.createElement('aside');
      aside.className = 'pv-aside';
      aside.setAttribute('aria-hidden', 'true');
      aside.setAttribute('data-testid', 'pillar-visual');
      body.appendChild(aside);
    }
    var n = Array.prototype.filter.call(body.children, function (k) { return !k.classList.contains('trace-rule') && !k.classList.contains('pv-aside'); }).length;
    aside.style.gridRow = '1 / span ' + Math.max(1, n);
    aside.setAttribute('data-key', key);
    aside.setAttribute('data-motif', conf.motif);
    aside.setAttribute('data-dir', rtl() ? 'rtl' : 'ltr');
    aside.innerHTML = MOTIFS[conf.motif](rtl()) + '<div class="pv-band" aria-hidden="true"></div>';
  }
  function inject() {
    Object.keys(CONF).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) build(sec, CONF[id]);
    });
  }
  var root = document.getElementById('root'), pending = false;
  function schedule() {
    if (pending) return; pending = true;
    window.requestAnimationFrame(function () { pending = false; try { inject(); } catch (e) { /* never break the deck */ } });
  }
  if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
  window.addEventListener('load', schedule);
  schedule();
})();
