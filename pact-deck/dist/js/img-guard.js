/* Athar Open Agentic Pact deck — v1.4.7 (2026-09-29) image guard.
   Runs first in <head>. (1) Hardens every <img> that appears (static or inserted at runtime by the modules / lightbox): decoding=async,
   loading=lazy when off-slide/off-screen, width/height from the natural size when missing, alt from data-alt-en/data-alt-ar when missing.
   (2) Any <img> that fails to load (capture-phase error, or already broken when the guard starts) is first RETRIED — a <picture>
   drops its <source> candidates so the browser falls back to the <img src> format, then one cache-busted reload of the original URL
   heals transient network failures (net::ERR_FAILED / reset) — and only then swapped to the branded fallback SVG
   and marked data-img-fallback="1" + data-img-original="<url>", so no broken-image glyph can ever appear; <picture> sources are dropped
   first so the fallback is not overridden. (3) <video poster> and CSS background-image URLs are HEAD-probed once each; failures get a
   fallback poster / an Ivory background-colour layer (data-bg-fallback="1"). Everything is try/catch-guarded and never throws. */
(function () {
  'use strict';
  var FALLBACK = '/assets/img/fallback-athar.svg';
  var G = { version: 'v1.7.2', fallbackSrc: FALLBACK, failed: [], retries: [], warnings: [], probed: {}, count: function () { return G.failed.length; }, harden: harden, observe: observe, sweep: sweep };
  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function record(url, kind, el) { try { G.failed.push({ url: url, kind: kind, at: new Date().toISOString(), tag: el && el.tagName }); document.dispatchEvent(new CustomEvent('athar:img-fallback', { detail: { url: url, kind: kind } })); } catch (e) {} }
  /* v1.4.7 (independent-verification pass): self-heal before falling back. attempt 0 → a <picture> drops its <source> candidates
     (the browser re-selects and loads the <img src> format); attempt ≤ 1 → one cache-busted reload of the original URL after 350 ms
     (a transient net::ERR_FAILED on the live sandbox was observed on 2026-09-29); attempt ≥ 2 → branded fallback. */
  function retry(img, why) {
    try {
      if (!img || img.getAttribute('data-img-fallback')) return false;
      var n = parseInt(img.getAttribute('data-img-retry') || '0', 10);
      var cur = img.currentSrc || img.getAttribute('src') || '';
      if (!cur || /^(data:|blob:)/.test(cur) || cur.indexOf(FALLBACK) !== -1) return false;
      var pic = img.parentElement && img.parentElement.tagName === 'PICTURE' ? img.parentElement : null;
      if (!img.getAttribute('data-img-original-src')) img.setAttribute('data-img-original-src', img.getAttribute('src') || cur);
      G.retries.push({ url: cur, why: why, attempt: n + 1, at: new Date().toISOString() });
      if (n === 0 && pic && pic.querySelector('source')) {
        img.setAttribute('data-img-retry', '1'); img.setAttribute('data-img-retry-why', why);
        Array.prototype.slice.call(pic.querySelectorAll('source')).forEach(function (s) { s.remove(); });
        var src = img.getAttribute('src'); if (src) { img.removeAttribute('src'); img.setAttribute('src', src); }
        return true;
      }
      if (n <= 1) {
        img.setAttribute('data-img-retry', '2'); img.setAttribute('data-img-retry-why', why);
        var orig = img.getAttribute('data-img-original-src') || cur;
        window.setTimeout(function () { try { var u = new URL(orig, location.href); u.searchParams.set('imgretry', String(Date.now())); img.removeAttribute('srcset'); img.src = u.href; } catch (e) { img.src = orig; } }, 350);
        return true;
      }
      return false;
    } catch (e) { return false; }
  }
  function swap(img, why) {
    try {
      if (!img || img.getAttribute('data-img-fallback')) { if (img && img.getAttribute('data-img-fallback') === '1' && (img.currentSrc || img.src).indexOf(FALLBACK) !== -1) img.setAttribute('data-img-fallback', '2'); return; }
      var orig = img.currentSrc || img.getAttribute('src') || '';
      var pic = img.parentElement && img.parentElement.tagName === 'PICTURE' ? img.parentElement : null;
      if (pic) Array.prototype.slice.call(pic.querySelectorAll('source')).forEach(function (s) { s.remove(); });
      img.removeAttribute('srcset'); img.removeAttribute('sizes');
      img.setAttribute('data-img-fallback', '1'); img.setAttribute('data-img-original', orig); img.classList.add('img-fallback');
      if (!img.getAttribute('alt')) img.setAttribute('alt', lang() === 'ar' ? 'الصورة غير متاحة' : 'Image unavailable');
      img.src = FALLBACK; record(orig, why || 'img-error', img);
    } catch (e) {}
  }
  function offscreen(img) {
    try {
      var sec = img.closest('section'); if (sec && sec.classList.contains('is-before')) return true; if (sec && sec.classList.contains('is-after')) return true;
      var r = img.getBoundingClientRect(); if (r.width === 0 && r.height === 0) return false; return r.top > (window.innerHeight || 1080) * 1.2;
    } catch (e) { return false; }
  }
  function hardenImg(img) {
    try {
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
      if (!img.hasAttribute('loading') && !img.hasAttribute('fetchpriority') && offscreen(img)) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
        if (img.complete && img.naturalWidth > 0) { if (!img.hasAttribute('width')) img.setAttribute('width', img.naturalWidth); if (!img.hasAttribute('height')) img.setAttribute('height', img.naturalHeight); }
        else img.addEventListener('load', function onl() { img.removeEventListener('load', onl); try { if (img.naturalWidth > 0) { if (!img.hasAttribute('width')) img.setAttribute('width', img.naturalWidth); if (!img.hasAttribute('height')) img.setAttribute('height', img.naturalHeight); } } catch (e) {} });
      }
      if (!img.hasAttribute('alt')) {
        var L = lang(), a = img.getAttribute('data-alt-' + L) || (img.closest('[data-img-alt]') && img.closest('[data-img-alt]').getAttribute('data-alt-' + L));
        if (a) img.setAttribute('alt', a);
        else if (img.closest('[aria-hidden="true"]')) { img.setAttribute('alt', ''); img.setAttribute('role', 'presentation'); }
        else { img.setAttribute('alt', ''); G.warnings.push('img without alt: ' + (img.currentSrc || img.src)); }
      }
      if (img.complete && img.naturalWidth === 0 && (img.currentSrc || img.getAttribute('src')) && !img.getAttribute('data-img-retry')) { if (!retry(img, 'already-broken')) swap(img, 'already-broken'); }
    } catch (e) {}
  }
  function probe(url, cb) {
    /* v1.4.7: probe with an Image() load rather than a HEAD fetch — a HEAD response carries no body and DevTools/CDP tooling logs it as
       net::ERR_ABORTED even though it succeeded, which pollutes "zero failed requests" gates. The Image() request is a normal GET that the
       page needs anyway (poster / background) and lands in the HTTP cache. Non-image URLs and cross-origin URLs are treated as OK. */
    try {
      if (!url || /^(data:|blob:)/.test(url)) return cb(true);
      var u = new URL(url, location.href); if (u.origin !== location.origin) return cb(true);
      if (!/\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(u.pathname)) return cb(true);
      var key = u.pathname; if (G.probed[key] !== undefined) { if (typeof G.probed[key] === 'boolean') return cb(G.probed[key]); G.probed[key].push(cb); return; }
      G.probed[key] = [cb];
      var done = false, im = new Image(), t = setTimeout(function () { finish(true); }, 15000);
      function finish(ok) { if (done) return; done = true; clearTimeout(t); var cbs = G.probed[key]; G.probed[key] = ok; (cbs || []).forEach(function (f) { try { f(ok); } catch (e) {} }); }
      im.onload = function () { finish(im.naturalWidth > 0); }; im.onerror = function () { finish(false); }; im.decoding = 'async'; im.src = u.href;
    } catch (e) { cb(true); }
  }
  function hardenVideo(v) {
    try {
      if (v.getAttribute('data-poster-checked')) return; v.setAttribute('data-poster-checked', '1');
      var poster = v.getAttribute('poster'); if (!poster) return;
      probe(poster, function (ok) { if (!ok) { v.setAttribute('data-poster-original', poster); v.setAttribute('poster', FALLBACK); v.setAttribute('data-img-fallback', '1'); record(poster, 'video-poster', v); } });
    } catch (e) {}
  }
  var BG_SEEN = typeof WeakSet === 'function' ? new WeakSet() : null;
  function hardenBg(el) {
    try {
      if (BG_SEEN && BG_SEEN.has(el)) return; if (BG_SEEN) BG_SEEN.add(el);
      var bg = getComputedStyle(el).backgroundImage; if (!bg || bg === 'none') return;
      var m = /url\((['"]?)([^'")]+)\1\)/.exec(bg); if (!m) return;
      probe(m[2], function (ok) { if (!ok) { if (!el.style.backgroundColor) el.style.backgroundColor = '#F2EEE5'; el.setAttribute('data-bg-fallback', '1'); record(m[2], 'css-background', el); } });
    } catch (e) {}
  }
  function harden(root) {
    try {
      root = root || document;
      var imgs = root.querySelectorAll ? root.querySelectorAll('img') : []; Array.prototype.forEach.call(imgs, hardenImg);
      if (root.tagName === 'IMG') hardenImg(root);
      var vids = root.querySelectorAll ? root.querySelectorAll('video[poster]') : []; Array.prototype.forEach.call(vids, hardenVideo);
      if (root.tagName === 'VIDEO') hardenVideo(root);
    } catch (e) {}
  }
  function sweep() { try { harden(document); Array.prototype.forEach.call(document.querySelectorAll('[style*="url("], .slide-bg, .pv-aside, .pattern-band, .aos-plate'), hardenBg); } catch (e) {} }
  /* capture-phase error listener: fires for every <img> / <source> failure, including ones inside dialogs, popovers and the lightbox */
  window.addEventListener('error', function (e) {
    try {
      var t = e.target; if (!t || !t.tagName) return;
      if (t.tagName === 'IMG') { if (!retry(t, 'img-error')) swap(t, 'img-error'); }
      else if (t.tagName === 'SOURCE' && t.parentElement && t.parentElement.tagName === 'PICTURE') { var im = t.parentElement.querySelector('img'); if (im && im.complete && im.naturalWidth === 0) { if (!retry(im, 'picture-source-error')) swap(im, 'picture-source-error'); } }
    } catch (err) {}
  }, true);
  function observe() {
    try {
      if (!('MutationObserver' in window) || G._mo) return;
      G._mo = new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          if (m.type === 'attributes') { if (m.target.tagName === 'IMG') { if (m.attributeName === 'src' || m.attributeName === 'srcset') { if (m.target.getAttribute('data-img-fallback') && (m.target.getAttribute('src') || '').indexOf(FALLBACK) === -1) { m.target.removeAttribute('data-img-fallback'); m.target.classList.remove('img-fallback'); } hardenImg(m.target); } } else if (m.target.tagName === 'VIDEO' && m.attributeName === 'poster') { m.target.removeAttribute('data-poster-checked'); hardenVideo(m.target); } return; }
          Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) harden(n); });
        });
      });
      G._mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'poster'] });
    } catch (e) {}
  }
  observe();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sweep); else sweep();
  window.addEventListener('load', function () { sweep(); setTimeout(sweep, 1500); });
  window.AtharImgGuard = G;
})();
