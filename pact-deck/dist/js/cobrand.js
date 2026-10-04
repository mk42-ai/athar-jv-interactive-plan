/* Athar Open Agentic Pact deck — v1.5.2 (2026-09-30) co-branding module (runtime, bundle untouched).
   • Official AIREV logo everywhere the parent tier is shown — the file is the unaltered SVG downloaded from
     https://www.airev.ae/assets/AIREV-logo-ca9cd9ef.svg (light-grey wordmark + purple accent, drawn for dark grounds).
     On light grounds the same file is rendered through a CSS luminance filter (no redraw, no retype). The black
     stacked lockup from the same site (darkLogo-4c945542.svg) ships alongside as /brand/partners-official/airev-logo-official-black.svg.
   • Co-branding hierarchy (Brand Guidelines FINAL v3, Figure 8.8): ODA · AIREV parent tier row ABOVE the Athar lead
     lock-up on the title slide (1) and the closing slide (39); in the slide-4 partner block; and in the footer of EVERY
     slide beside "ODA × AIREV" (light variant on dark footers, dark variant on light). Clear space ≥ logo x-height.
   • Slide 4: the duplicated partner-logo row above INTERNAL REVIEW ONLY is removed (the footer keeps the marks), the four
     outcome cards are equalised and carry an outcome-evidence line so the block fills the slide.
   Idempotent, re-runs on language / slide changes, never mirrors a logo. */
(function () {
  'use strict';
  var VERSION = 'v1.7.2';
  var AIREV = '/brand/partners-official/airev-logo-official.svg';           /* 137×43 official wordmark (dark-ground variant) */
  var ODA = '/partners/review/oda__athar_partner_oda_logo_bw_v1.png';        /* 3980×1222 ODA mark already in the deck */
  var TXT = {
    en: { oda: 'Office of Development Affairs (ODA)', airev: 'AIREV', tier: 'ODA × AIREV — parent tier', evidence: 'Evidence',
          ev: ['a certificate issued and a portfolio agent', 'an agent validated and published in the marketplace', 'a named, accountable deployment live inside an institution', 'baseline and outcome evidence: time saved, better service or wider reach'] },
    ar: { oda: 'مكتب شؤون التنمية (ODA)', airev: 'AIREV', tier: 'ODA × AIREV — مستوى الشراكة الأم', evidence: 'الدليل',
          ev: ['شهادة صادرة ووكيل في ملف الأعمال', 'وكيل مُتحقَّق منه ومنشور في السوق', 'نشر مُسمّى وخاضع للمساءلة داخل مؤسسة', 'دليل الأساس والنتيجة: وقت موفَّر أو خدمة أفضل أو وصول أوسع'] }
  };
  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function lum(rgb) { var m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,\/]+([\d.]+))?/.exec(rgb || ''); if (!m) return null; if (m[4] !== undefined && parseFloat(m[4]) === 0) return null; var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(+m[1]) + 0.7152 * f(+m[2]) + 0.0722 * f(+m[3]); }
  function isDark(node) { /* walk up until a painted background is found */
    var n = node; while (n && n !== document.documentElement) { var L = lum(getComputedStyle(n).backgroundColor); if (L !== null) return L < 0.35; n = n.parentElement; }
    return false;
  }
  function tierRow(size, dark) { /* ODA × AIREV parent tier — clear space = padding ≥ x-height (0.55 × logo height) */
    var t = TXT[lang()], row = el('div', 'v152-tier v152-tier--' + size + (dark ? ' v152-tier--dark' : ' v152-tier--light'));
    row.setAttribute('data-v152', 'parent-tier'); row.setAttribute('data-no-mirror', 'true'); row.setAttribute('role', 'group'); row.setAttribute('aria-label', t.tier);
    var o = el('img', 'v152-oda'); o.src = ODA; o.alt = t.oda; o.width = 3980; o.height = 1222; o.decoding = 'async'; o.setAttribute('data-no-mirror', 'true');
    var x = el('span', 'v152-x', '×'); x.setAttribute('aria-hidden', 'true');
    var a = el('img', 'v152-airev'); a.src = AIREV; a.alt = t.airev; a.width = 137; a.height = 43; a.decoding = 'async'; a.setAttribute('data-no-mirror', 'true'); a.setAttribute('data-official-source', 'brand/partners-official/credits.json#airev');
    row.appendChild(o); row.appendChild(x); row.appendChild(a); return row;
  }
  function ensureTier(container, before, size, key) {
    if (!container) return;
    var ex = container.querySelector(':scope > .v152-tier[data-key="' + key + '"]');
    var dark = isDark(container), l = lang();
    if (ex && ex.getAttribute('data-lang') === l && (ex.classList.contains('v152-tier--dark') === dark)) return;
    if (ex) ex.remove();
    var row = tierRow(size, dark); row.setAttribute('data-key', key); row.setAttribute('data-lang', l);
    container.insertBefore(row, before || container.firstChild);
  }
  /* ---- footer: official AIREV logo beside "ODA × AIREV" on every slide ---- */
  function footer() {
    var f = document.querySelector('footer.pagefooter'); if (!f) return;
    var left = f.querySelector(':scope > .footer-left'); if (!left) return;
    var dark = isDark(f), l = lang(), ex = left.querySelector(':scope > .v152-cobrand');
    if (ex && ex.getAttribute('data-lang') === l && (ex.classList.contains('v152-tier--dark') === dark)) return;
    if (ex) ex.remove();
    var row = tierRow('footer', dark); row.classList.add('v152-cobrand'); row.setAttribute('data-lang', l); row.setAttribute('data-testid', 'footer-cobrand');
    left.appendChild(row);
  }
  /* ---- title slide 1 + closing 39: parent tier ABOVE the Athar lead lock-up; official AIREV in the partner rows ---- */
  function cover() {
    var cov = document.getElementById('s-cover');
    if (cov) {
      var stage = cov.querySelector('#logo-stage, .logo-stage');
      if (stage && stage.parentElement) {
        var host = stage.parentElement;
        if (!host.classList.contains('v152-stage-host')) host.classList.add('v152-stage-host');
        ensureTier(host, stage, 'lead', 'cover');
      }
      swapPmarks(cov.querySelector('.cover-partners'));
    }
    var clo = document.getElementById('s-closing');
    if (clo) {
      var lk = clo.querySelector('.closing-lockup');
      if (lk && lk.parentElement) { lk.parentElement.classList.add('v152-stage-host'); ensureTier(lk.parentElement, lk, 'lead', 'closing'); }
      swapPmarks(clo.querySelector('.closing-partners'));
    }
  }
  function swapPmarks(row) { /* the raster airev-mark.png (118×40) → official SVG; ODA + AIREV + OnDemand pmarks all hidden here: lock-up = Athar mark + ATHAR wordmark only, the parent tier above carries ODA × AIREV (Brand Guidelines Fig. 8.8) */
    if (!row || row.getAttribute('data-v152') === 'done') return;
    var a = row.querySelector('.pmark--airev img'); if (a && a.src.indexOf('airev-logo-official') === -1) { a.src = AIREV; a.width = 137; a.height = 43; a.alt = 'AIREV'; a.classList.add('v152-airev-inline'); a.setAttribute('data-official-source', 'brand/partners-official/credits.json#airev'); }
    var od = row.querySelector('.pmark--oda'), ai = row.querySelector('.pmark--airev'), ode = row.querySelector('.pmark--ondemand');
    if (od) od.classList.add('v152-hidden-dup'); if (ai) ai.classList.add('v152-hidden-dup'); if (ode) ode.classList.add('v152-hidden-dup');
    row.setAttribute('data-v152', 'done');
  }
  /* ---- slide 4: partner block hierarchy + one marks row + equal cards with an evidence line ---- */
  function slide4() {
    var s4 = document.getElementById('s-four-outcomes'); if (!s4) return;
    var strip = s4.querySelector('.athar-partner-strip');
    if (strip) {
      var box = strip.querySelector('.aps-athar-box');
      ensureTier(strip, box, 'block', 's4');
      var marks = strip.querySelector('.aps-marks'), div = strip.querySelector('.aps-divider');
      if (marks) marks.classList.add('v152-hidden-dup'); if (div) div.classList.add('v152-hidden-dup');
      strip.classList.add('v152-strip');
    }
    var cards = s4.querySelector('.cards'); if (!cards) return;
    var l = lang(), t = TXT[l];
    if (cards.getAttribute('data-v152-lang') !== l) {
      Array.prototype.forEach.call(cards.querySelectorAll(':scope > .card'), function (c, i) {
        var old = c.querySelector(':scope > .v152-evidence'); if (old) old.remove();
        var p = el('p', 'v152-evidence'); p.appendChild(el('strong', null, t.evidence + ': ')); p.appendChild(document.createTextNode(t.ev[i] || t.ev[t.ev.length - 1])); c.appendChild(p);
      });
      cards.setAttribute('data-v152-lang', l); cards.classList.add('v152-cards');
    }
  }
  function swapAllAirev() { /* v1.5.3: every remaining raster AIREV tile (slides 21/22/24 partner rows, any .pmark--airev) → the official airev.ae wordmark */
    document.querySelectorAll('img[src*="partners/airev-mark.png"], .pmark--airev img').forEach(function (a) { if (a.src.indexOf('airev-logo-official') !== -1) return; a.src = AIREV; a.width = 137; a.height = 43; a.alt = 'AIREV'; a.classList.add('v153-airev-official'); a.setAttribute('data-official-source', 'brand/partners-official/credits.json#airev'); });
  }
  function run() { try { footer(); cover(); slide4(); swapAllAirev(); } catch (e) { /* never break the deck */ } }
  var pending = false;
  function schedule() { if (pending) return; pending = true; window.requestAnimationFrame(function () { pending = false; run(); }); }
  var root = document.getElementById('root');
  if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
  window.addEventListener('hashchange', schedule); window.addEventListener('load', schedule); schedule();
  window.AtharCobrand = { version: VERSION, refresh: run, airev: AIREV, oda: ODA };
})();
