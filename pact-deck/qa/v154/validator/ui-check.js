(() => {
  const vw = innerWidth, vh = innerHeight, bad = [];
  const R = (el) => el.getBoundingClientRect();
  const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
  if (document.documentElement.scrollWidth > vw + 1) bad.push('h-overflow ' + document.documentElement.scrollWidth + '>' + vw);
  const virt = document.body.classList.contains('it-virtual');
  const sec = virt ? document.querySelector('#root section.it-slide.is-active') : document.querySelector('#root section.slide.is-active:not(.it-slide)');
  if (!sec) bad.push('no active slide');
  document.querySelectorAll('img').forEach((i) => { if (i.offsetParent && i.complete && i.naturalWidth === 0) bad.push('broken-img ' + String(i.getAttribute('src') || '').slice(-48)); });
  if (sec) sec.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,figcaption,button,a,.it-chip,.it-wbtag,.aos-seg-t').forEach((e) => {
    if (!e.offsetParent || !(e.textContent || '').trim() || e.closest('.visually-hidden, .sr-only, [class*="visually-hidden"]')) return; const cs = getComputedStyle(e); if (cs.clip && cs.clip !== 'auto') return;
    const cx = /(hidden|clip)/.test(cs.overflowX) || cs.textOverflow === 'ellipsis', cy = /(hidden|clip)/.test(cs.overflowY);
    if ((cx && e.scrollWidth > e.clientWidth + 2) || (cy && e.scrollHeight > e.clientHeight + 2)) bad.push('clipped ' + e.tagName + '.' + String(e.className || '').slice(0, 28) + ' "' + e.textContent.trim().slice(0, 28) + '"');
  });
  const bar = document.getElementById('athar-narration');
  if (!bar) bad.push('no guide bar'); else {
    const b = R(bar); if (b.bottom > vh + 1 || b.top < 0 || b.height < 40) bad.push('guide bar outside viewport ' + Math.round(b.top) + '-' + Math.round(b.bottom));
    const ctl = [...document.querySelectorAll('footer.pagefooter, button.arrow, .dots, nav.rail, .rail-hint, .topctl, .ctl-btn, .lang-toggle, .intro-replay')]
      .filter((x) => { const cs = getComputedStyle(x); const r = R(x); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; });
    ctl.forEach((c) => { if (hit(b, R(c))) bad.push('guide bar overlaps ' + c.tagName + '.' + String(c.className || '').slice(0, 30)); });
    bar.querySelectorAll('button').forEach((x) => { const r = R(x); if (r.width && (r.width < 43.5 || r.height < 43.5) && getComputedStyle(x).display !== 'none') bad.push('bar target < 44px ' + (x.getAttribute('data-testid') || '')); });
    const st = document.querySelector('.stage'); if (st && sec) { const s = R(st); if (s.bottom > b.top + 1) bad.push('stage under bar ' + Math.round(s.bottom) + '>' + Math.round(b.top)); }
  }
  if (bad.length) console.error('UI-CHECK ' + bad.join(' | '));
  return bad.length === 0;
})()
