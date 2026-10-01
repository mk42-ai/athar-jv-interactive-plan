/* Athar Open Agentic Pact deck — v1.3.3 (2026-09-27) slide 17 "Universal API licences managed by Athar".
   Runtime enhancement in the v1.2.x lineage (React/TS sources are 0-byte after the platform restore, so the
   built deck is extended at runtime, like the v1.2.0 partner strip, the v1.2.1 pillar visuals and the v1.3.x
   impact-tiers section). The bundle's own copy for this slide was reduced in place to title + new subtitle
   (seat-tier pricing table, options bullets and the list-price callout removed — the seat ladder lives in
   docs/appendix-seat-ladder.md only). This module renders, under the subtitle: two labelled groups of API
   tiles (6 "Major API builders" + 4 "Development-niche APIs"), an explainer band, one compact deployment-options
   line and the trademark footnote. EN/AR strings below; RTL mirrors through logical properties; marks are
   never mirrored. Every mark file and its provenance: dist/assets/api/credits.json, BRAND_USAGE_NOTES.md § 15. */
(function () {
  'use strict';
  var VERSION = 'v1.5.4';
  var SEL = 'section.slide#s-pillar-universal-licence';
  var MARKS = {"stripe": {"file": "api-stripe.png", "w": 512, "h": 256}, "fastapi": {"file": "api-fastapi.png", "w": 512, "h": 256}, "google-maps-platform": {"file": "api-google-maps-platform.png", "w": 512, "h": 256}, "hugging-face": {"file": "api-hugging-face.png", "w": 512, "h": 256}, "mpesa-daraja": {"file": "api-mpesa-daraja.png", "w": 512, "h": 256}, "dhis2": {"file": "api-dhis2.png", "w": 512, "h": 256}, "openweather": {"file": "api-openweather.png", "w": 512, "h": 256}};
  var L = {
    en: {
      usedFor: 'Used for', groups: { major: 'Major API builders', niche: 'Development-niche APIs' },
      band: 'Athar procures and manages these API licences and keys centrally — pooled quotas, key vault, usage caps, billing and compliance — and community members call them from their agents.',
      options: 'Deployment options — A · Software-only (BYOH — Bring Your Own Hardware): the institution hosts Athar on its own infrastructure · B · Self-hosted (BYOC — Bring Your Own Cloud): Athar-managed software in the institution’s cloud · C · Cloud-hosted: fully managed end-to-end by AIREV.',
      footnote: 'All product names and logos are trademarks of their respective owners; shown for reference only, no endorsement implied. † Typographic wordmark — no official mark file could be retrieved: Twilio and all related logos are trademarks of Twilio Inc. or its affiliates; Africa’s Talking is a trademark of Africa’s Talking Ltd; OpenAI’s brand page was access-gated in this pass. Weather data provided by OpenWeather. Google Maps Platform icon: Google Brand Features, unaltered.',
      typographic: 'wordmark',
      tiles: [
        { key: 'stripe', group: 'major', name: 'Stripe', owner: 'Stripe, Inc.', used: 'payments for school bookstores, clinics and ministries; usage-based billing' },
        { key: 'fastapi', group: 'major', name: 'FastAPI', owner: 'Sebastián Ramírez · MIT licence', used: 'Python framework for agent back-ends and endpoints' },
        { key: 'openai', group: 'major', name: 'OpenAI API', owner: 'OpenAI', used: 'LLM and model APIs for building agents', typographic: true },
        { key: 'twilio', group: 'major', name: 'Twilio', owner: 'Twilio Inc.', used: 'SMS, voice and OTP for farmers and clinics', typographic: true },
        { key: 'google-maps-platform', group: 'major', name: 'Google Maps Platform', owner: 'Google LLC', used: 'maps and routing for clinics, farmers and school portals; pay-as-you-go' },
        { key: 'hugging-face', group: 'major', name: 'Hugging Face', owner: 'Hugging Face, Inc.', used: 'hosting open models and classifiers for the community' },
        { key: 'mpesa-daraja', group: 'niche', name: 'M-Pesa Daraja API', owner: 'Safaricom PLC', used: 'mobile-money collect and disburse in Kenya' },
        { key: 'africas-talking', group: 'niche', name: 'Africa’s Talking', owner: 'Africa’s Talking Ltd', used: 'SMS, USSD, voice and payments for schools and smallholders; pay-as-you-go', typographic: true },
        { key: 'dhis2', group: 'niche', name: 'DHIS2', owner: 'HISP Centre, University of Oslo · open source', used: 'health and education data dashboards via the DHIS2 APIs' },
        { key: 'openweather', group: 'niche', name: 'OpenWeather', owner: 'OpenWeather Ltd', used: 'weather data for farmers and outbreak prediction; free → enterprise tiers' }
      ]
    },
    ar: {
      usedFor: 'يُستخدم لـ', groups: { major: 'كبار بُناة الواجهات البرمجية', niche: 'واجهات برمجية متخصصة في التنمية' },
      band: 'يشتري أثر تراخيص ومفاتيح هذه الواجهات البرمجية ويديرها مركزيًا — حصص مجمّعة، وخزنة مفاتيح، وسقوف استخدام، وفوترة وامتثال — ويستدعيها أعضاء المجتمع من وكلائهم.',
      options: 'خيارات النشر — A · برمجيات فقط (BYOH — أحضر عتادك الخاص): تستضيف المؤسسة أثر على بنيتها التحتية الخاصة · B · استضافة ذاتية (BYOC — أحضر سحابتك الخاصة): برمجية يديرها أثر على سحابة المؤسسة · C · استضافة سحابية: إدارة كاملة من طرف إلى طرف بواسطة AIREV.',
      footnote: 'جميع أسماء المنتجات وشعاراتها علامات تجارية لمالكيها؛ تُعرض للإشارة فقط ولا تعني أي تأييد. † علامة نصية — تعذّر الحصول على ملف شعار رسمي: Twilio وجميع الشعارات المرتبطة بها علامات تجارية لشركة Twilio Inc. أو الشركات التابعة لها؛ Africa’s Talking علامة تجارية لشركة Africa’s Talking Ltd؛ وصفحة هوية OpenAI كانت مقيّدة الوصول في هذه الجولة. بيانات الطقس مقدَّمة من OpenWeather. أيقونة Google Maps Platform من عناصر علامة Google التجارية دون تعديل.',
      typographic: 'علامة نصية',
      tiles: [
        { key: 'stripe', group: 'major', name: 'Stripe', owner: 'Stripe, Inc.', used: 'المدفوعات لمكتبات المدارس والعيادات والوزارات؛ فوترة حسب الاستخدام' },
        { key: 'fastapi', group: 'major', name: 'FastAPI', owner: 'سيباستيان راميريز · رخصة MIT', used: 'إطار عمل بايثون لخلفيات الوكلاء ونقاط النهاية' },
        { key: 'openai', group: 'major', name: 'OpenAI API', owner: 'OpenAI', used: 'واجهات النماذج اللغوية الكبيرة لبناء الوكلاء', typographic: true },
        { key: 'twilio', group: 'major', name: 'Twilio', owner: 'Twilio Inc.', used: 'الرسائل القصيرة والصوت ورموز التحقق للمزارعين والعيادات', typographic: true },
        { key: 'google-maps-platform', group: 'major', name: 'Google Maps Platform', owner: 'Google LLC', used: 'الخرائط وتخطيط المسارات للعيادات والمزارعين وبوابات المدارس؛ الدفع حسب الاستخدام' },
        { key: 'hugging-face', group: 'major', name: 'Hugging Face', owner: 'Hugging Face, Inc.', used: 'استضافة النماذج المفتوحة والمصنِّفات للمجتمع' },
        { key: 'mpesa-daraja', group: 'niche', name: 'M-Pesa Daraja API', owner: 'Safaricom PLC', used: 'تحصيل وصرف الأموال عبر الهاتف المحمول في كينيا' },
        { key: 'africas-talking', group: 'niche', name: 'Africa’s Talking', owner: 'Africa’s Talking Ltd', used: 'الرسائل القصيرة وUSSD والصوت والمدفوعات للمدارس وصغار المزارعين؛ الدفع حسب الاستخدام', typographic: true },
        { key: 'dhis2', group: 'niche', name: 'DHIS2', owner: 'مركز HISP، جامعة أوسلو · مفتوح المصدر', used: 'لوحات بيانات الصحة والتعليم عبر واجهات DHIS2' },
        { key: 'openweather', group: 'niche', name: 'OpenWeather', owner: 'OpenWeather Ltd', used: 'بيانات الطقس للمزارعين والتنبؤ بتفشي الأمراض؛ فئات من المجانية إلى المؤسسية' }
      ]
    }
  };
  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function tile(t, dict) {
    var d = el('div', 'al-tile' + (t.typographic ? ' al-tile--word' : '')); d.setAttribute('data-api', t.key); d.setAttribute('data-group', t.group);
    var m = el('span', 'al-mark'); var mk = MARKS[t.key];
    if (mk && mk.file && !t.typographic) {
      var i = el('img'); i.src = '/assets/api/' + mk.file; i.alt = t.name + ' — mark shown for reference only'; i.decoding = 'async'; i.loading = 'eager'; i.setAttribute('data-no-mirror', 'true');
      if (mk.w) { i.width = mk.w; i.height = mk.h; } m.appendChild(i); m.classList.add('al-mark--img');
      if (mk.dark) m.classList.add('al-mark--dark');
    } else {
      var wd = el('span', 'al-word', t.name + (t.typographic ? '\u2009†' : '')); wd.setAttribute('lang', 'en'); m.appendChild(wd); m.classList.add('al-mark--word');
    }
    d.appendChild(m);
    var b = el('div', 'al-tile-body');
    b.appendChild(el('strong', 'al-name', t.name));
    b.appendChild(el('span', 'al-owner', t.owner));
    var u = el('p', 'al-used'); u.appendChild(el('strong', null, dict.usedFor + ': ')); u.appendChild(document.createTextNode(t.used)); b.appendChild(u);
    d.appendChild(b); return d;
  }
  function build(dict) {
    var wrap = el('div', 'al-wrap'); wrap.setAttribute('data-testid', 'api-licence-grid'); wrap.setAttribute('data-al-version', VERSION);
    ['major', 'niche'].forEach(function (g) {
      var grp = el('div', 'al-group al-group--' + g); grp.appendChild(el('div', 's-kicker al-group-label', dict.groups[g]));
      var grid = el('div', 'al-grid al-grid--' + g);
      dict.tiles.filter(function (t) { return t.group === g; }).forEach(function (t) { grid.appendChild(tile(t, dict)); });
      grp.appendChild(grid); wrap.appendChild(grp);
    });
    var band = el('p', 'it-band al-band', dict.band); band.setAttribute('data-testid', 'api-licence-band'); wrap.appendChild(band);
    wrap.appendChild(el('p', 'al-options', dict.options));
    wrap.appendChild(el('p', 'muted small al-footnote', dict.footnote));
    return wrap;
  }
  function enhance() {
    var sec = document.querySelector(SEL); if (!sec) return;
    var body = sec.querySelector(':scope > .s-body'); if (!body) return;
    var l = lang();
    sec.classList.add('al-enhanced');
    var old = body.querySelector(':scope > .al-wrap');
    if (old && old.getAttribute('data-al-lang') === l) return;
    if (old) old.remove();
    var wrap = build(L[l]); wrap.setAttribute('data-al-lang', l);
    var anchor = body.querySelector(':scope > .two-col') || body.querySelector(':scope > .sub') || body.querySelector(':scope > .s-head');
    if (anchor && anchor.nextSibling) body.insertBefore(wrap, anchor.nextSibling); else body.appendChild(wrap);
  }
  var pending = false;
  function schedule() { if (pending) return; pending = true; window.requestAnimationFrame(function () { pending = false; try { enhance(); } catch (e) { /* keep the deck alive */ } }); }
  var root = document.getElementById('root');
  if (root) { new MutationObserver(schedule).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); }
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
  schedule();
  window.AtharApiLicences = { version: VERSION, refresh: enhance };
})();
