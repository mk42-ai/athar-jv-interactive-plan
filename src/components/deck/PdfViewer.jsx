import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { resolveDeckSource } from '../../lib/deckSource.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const ZOOM_STEPS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 2.5, 3, 4];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const I = {
  prev: <path d="M15 6l-6 6 6 6" />,
  next: <path d="M9 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  fit: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  full: <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" />,
  exit: <path d="M9 3v6H3M15 3v6h6M3 15h6v6M21 15h-6v6" />,
  open: <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
};
const Icon = ({ name }) => <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{I[name]}</svg>;

// PDF.js's source order is authoritative. Never sort columns or substitute plan/narration text.
// hasEOL and source-coordinate paragraph gaps delimit text; every emitted word is from getTextContent.
export function sourceParagraphs(items) {
  const paragraphs = [];
  let line = '';
  let previous = null;
  const flush = () => { if (line.trim()) paragraphs.push(line.trim()); line = ''; };
  for (const item of items) {
    if (typeof item.str !== 'string') continue;
    if (previous && item.transform && previous.transform) {
      const lineGap = Math.abs(item.transform[5] - previous.transform[5]);
      if (lineGap > Math.max(item.height || 0, previous.height || 0, 1) * 1.4) flush();
      const xGap = item.transform[4] - (previous.transform[4] + (previous.width || 0));
      if (line && item.str && !/\s$/.test(line) && !/^\s/.test(item.str) && (xGap > 0.5 || lineGap > 1)) line += ' ';
    }
    line += item.str;
    if (item.hasEOL) flush();
    previous = item;
  }
  flush();
  return paragraphs;
}

/** Exact local PDF, fit-page by default; both observed dimensions drive rendering. */
export default function PdfViewer({ src, title, onPageChange, requestedPage, overlay, toolbarExtra, onUserNavigate, footer }) {
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const renderTaskRef = useRef(null);
  const renderVersionRef = useRef(0);
  const dragRef = useRef(null);
  const textCacheRef = useRef(new Map());
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState('page');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [thumbs, setThumbs] = useState([]);
  const [rendering, setRendering] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [aspect, setAspect] = useState(16 / 9);
  const [source, setSource] = useState(null);
  const [textOpen, setTextOpen] = useState(false);
  const [textState, setTextState] = useState({ page: 0, status: 'idle', paragraphs: [] });
  const [textRetry, setTextRetry] = useState(0);
  const [loadRetry, setLoadRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let task = null;
    setStatus('loading');
    setError(null);
    textCacheRef.current.clear();
    resolveDeckSource(src).then(({ data, source: from }) => {
      if (cancelled) return null;
      setSource(from);
      task = pdfjsLib.getDocument({ data, cMapPacked: true });
      return task.promise;
    }).then(async (pdf) => {
      if (!pdf || cancelled) return;
      pdfRef.current = pdf;
      setNumPages(pdf.numPages);
      setStatus('ready');
      // Retain the original thumbnails and exact PDF source resolution/fallback.
      const out = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        if (cancelled) return;
        const p = await pdf.getPage(i);
        const base = p.getViewport({ scale: 1 });
        const vp = p.getViewport({ scale: 220 / base.width });
        const c = document.createElement('canvas');
        c.width = Math.round(vp.width);
        c.height = Math.round(vp.height);
        await p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        out.push(c.toDataURL('image/png'));
      }
      if (!cancelled) setThumbs(out);
    }).catch((e) => {
      if (cancelled) return;
      setError(e?.message || String(e));
      setStatus('error');
    });
    return () => {
      cancelled = true;
      renderVersionRef.current++;
      renderTaskRef.current?.cancel?.();
      pdfRef.current = null;
      task?.destroy?.();
    };
  }, [src, loadRetry]);

  useLayoutEffect(() => {
    const holder = scrollRef.current;
    const root = rootRef.current;
    if (!holder || !root) return;
    let frame = 0;
    let disposed = false;
    let observedRail = null;
    // offsetTop follows layout, not scrolling or the tab's entrance transform.
    // A viewport rect alone feeds scrolling back into height and makes the page grow.
    const layoutTop = (el) => {
      let top = 0;
      for (let node = el; node; node = node.offsetParent) {
        top += node.offsetTop;
        if (node.offsetParent) top += node.offsetParent.clientTop;
      }
      return top;
    };
    const measure = () => {
      frame = 0;
      if (disposed || !holder.offsetWidth || !root.getClientRects().length) return;
      const rail = root.querySelector('.guide-dock-row');
      if (rail !== observedRail) {
        if (observedRail) ro.unobserve(observedRail);
        if (rail) ro.observe(rail);
        observedRail = rail;
      }
      const viewportHeight = Math.min(window.innerHeight, window.visualViewport?.height || window.innerHeight);
      const top = layoutTop(holder);
      // Reserve ONLY the collapsed controls, never the entire footer/root height.
      // In a short window, extra wrapped rail rows, full captions, the view note,
      // thumbnails and Read text can scroll below an intact slide instead.
      const shortWindow = viewportHeight <= 540;
      const railHeight = rail ? rail.offsetHeight + (root.querySelector('.guide-dock-progress')?.offsetHeight || 0) + 1 : 0;
      const reservedRailHeight = shortWindow ? Math.min(48, railHeight) : railHeight;
      const height = Math.floor(Math.min(holder.offsetWidth / aspect, Math.max(180, viewportHeight - top - reservedRailHeight)));
      const heightValue = `${height}px`;
      if (root.style.getPropertyValue('--pdf-holder-height') !== heightValue) {
        root.style.setProperty('--pdf-holder-height', heightValue);
      }
      // Read BOTH final inner dimensions (including any zoom scrollbars). The
      // equality guard and frame-scheduled writes keep ResizeObserver convergent.
      const next = { width: holder.clientWidth, height: holder.clientHeight };
      setSize((old) => old.width === next.width && old.height === next.height ? old : next);
    };
    const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(measure); };
    const ro = new ResizeObserver(schedule);
    // Observe actual header/toolbar wrapping, not an assumed header pixel count.
    const deck = root.closest('.deck');
    const workspace = root.closest('.athar-workspace');
    [holder, root, root.querySelector('.pdfv-toolbar'), deck?.querySelector('.deck-head'), workspace?.querySelector(':scope > .top')]
      .filter(Boolean).forEach((el) => ro.observe(el));
    // The guide rail mounts/unmounts without changing the toolbar or holder width.
    // Do not observe attributes: canvas render/progress updates need no remeasure.
    const mutations = new MutationObserver(schedule);
    mutations.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    document.fonts?.ready.then(schedule);
    measure();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
    };
  }, [aspect, fullscreen]);

  useEffect(() => {
    if (status !== 'ready' || !size.width || !size.height) return;
    const version = ++renderVersionRef.current;
    let cancelled = false;
    const current = () => !cancelled && version === renderVersionRef.current;
    (async () => {
      const pdf = pdfRef.current;
      const canvas = canvasRef.current;
      const holder = scrollRef.current;
      if (!pdf || !canvas || !holder) return;
      const prior = renderTaskRef.current;
      prior?.cancel?.();
      // Cancellation is asynchronous: never reuse a canvas until the previous render settles.
      await prior?.promise?.catch(() => {});
      if (!current()) return;
      setRendering(true);
      try {
        const p = await pdf.getPage(page);
        if (!current()) return;
        const base = p.getViewport({ scale: 1 });
        setAspect(base.width / base.height);
        const pageStyle = getComputedStyle(holder.querySelector('.pdfv-page'));
        const padX = parseFloat(pageStyle.paddingLeft) + parseFloat(pageStyle.paddingRight);
        const padY = parseFloat(pageStyle.paddingTop) + parseFloat(pageStyle.paddingBottom);
        const availW = Math.max(1, holder.clientWidth - padX - 2);
        const availH = Math.max(1, holder.clientHeight - padY - 2);
        const fitW = availW / base.width;
        const fitP = Math.min(fitW, availH / base.height);
        const scale = (fitMode === 'page' ? fitP : fitW) * zoom;
        const vp = p.getViewport({ scale });
        const dpr = Math.min(3, window.devicePixelRatio || 1);
        canvas.width = Math.floor(vp.width * dpr);
        canvas.height = Math.floor(vp.height * dpr);
        canvas.style.width = `${Math.floor(vp.width)}px`;
        canvas.style.height = `${Math.floor(vp.height)}px`;
        const task = p.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
        renderTaskRef.current = task;
        await task.promise;
        if (!current()) return;
        canvas.dataset.page = String(page);
        canvas.dataset.scale = scale.toFixed(3);
        onPageChange?.(page);
      } catch (e) {
        if (current() && e?.name !== 'RenderingCancelledException') {
          setError(e?.message || 'The slide could not render.');
          setStatus('error');
        }
      } finally { if (current()) setRendering(false); }
    })();
    return () => { cancelled = true; renderTaskRef.current?.cancel?.(); };
  }, [status, page, zoom, fitMode, size.width, size.height, onPageChange]);

  useEffect(() => {
    if (!textOpen || status !== 'ready') return;
    let alive = true;
    setTextState({ page, status: 'loading', paragraphs: [] });
    (async () => {
      let paragraphs = textCacheRef.current.get(page);
      if (!paragraphs) {
        const p = await pdfRef.current.getPage(page);
        const content = await p.getTextContent();
        paragraphs = sourceParagraphs(content.items);
        textCacheRef.current.set(page, paragraphs);
      }
      if (alive) setTextState({ page, status: 'ready', paragraphs });
    })().catch(() => { if (alive) setTextState({ page, status: 'error', paragraphs: [] }); });
    return () => { alive = false; };
  }, [textOpen, page, status, textRetry]);

  const go = (p) => {
    const n = clamp(p ?? page, 1, numPages || 1);
    setPage(n);
    if (n !== page) onUserNavigate?.(n);
  };
  useEffect(() => {
    if (requestedPage?.n) setPage(clamp(requestedPage.n, 1, numPages || requestedPage.n));
  }, [requestedPage?.n, requestedPage?.t, numPages]);
  const zoomBy = useCallback((dir) => setZoom((z) => {
    if (dir > 0) return ZOOM_STEPS.find((s) => s > z + 0.001) || 4;
    return [...ZOOM_STEPS].reverse().find((s) => s < z - 0.001) || 0.5;
  }), []);
  const fit = (mode = 'page') => { setFitMode(mode); setZoom(1); };
  const readableZoom = () => {
    setFitMode('width');
    setZoom(clamp(1440 / Math.max(1, (scrollRef.current?.clientWidth || 960) - 18), 1.5, 4));
    scrollRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, left: 0 }); }, [page, fitMode, zoom]);
  const toggleFullscreen = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    if (root.requestFullscreen && document.fullscreenEnabled) {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen().catch(() => setFullscreen((f) => !f));
    } else setFullscreen((f) => !f);
  }, []);
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('viewer-fullscreen', fullscreen);
    fit('page');
    const onKey = (e) => {
      if (e.key === 'Escape' && fullscreen && !document.fullscreenElement) { e.stopPropagation(); setFullscreen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('viewer-fullscreen'); };
  }, [fullscreen]);

  const onKeyDown = (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.target?.closest?.('button, a, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"])')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') go(page + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(page - 1);
    else if (e.key === '+' || e.key === '=') zoomBy(1);
    else if (e.key === '-' || e.key === '_') zoomBy(-1);
    else if (e.key === '0') fit('page');
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    else if (e.key === 'Home') go(1);
    else if (e.key === 'End') go(numPages);
    else return;
    e.preventDefault();
  };
  useEffect(() => {
    const el = scrollRef.current;
    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1 : -1);
    };
    el?.addEventListener('wheel', onWheel, { passive: false });
    return () => el?.removeEventListener('wheel', onWheel);
  }, [zoomBy]);
  const onPointerDown = (e) => {
    const el = scrollRef.current;
    if (!el || e.button !== 0 || e.pointerType !== 'mouse' || (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight)) return;
    dragRef.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
    el.setPointerCapture?.(e.pointerId);
    el.classList.add('dragging');
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    scrollRef.current.scrollLeft = d.sl - (e.clientX - d.x);
    scrollRef.current.scrollTop = d.st - (e.clientY - d.y);
  };
  const endDrag = () => { dragRef.current = null; scrollRef.current?.classList.remove('dragging'); };
  const mode = zoom !== 1 ? 'zoom' : fitMode;

  return (
    <div className={`pdfv ${fullscreen ? 'is-fullscreen' : ''}`} ref={rootRef} style={{ '--pdf-aspect-ratio': aspect }} data-testid="pdf-viewer" data-status={status} data-source={source || ''} data-fit-mode={mode}>
      <div className="pdfv-toolbar" role="toolbar" aria-label="Presentation controls">
        <div className="tb-group pdfv-nav">
          <button className="tb-btn" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Previous page"><Icon name="prev" /></button>
          <span className="tb-counter" aria-live="polite" data-testid="pdf-page-counter">Page {page} <span className="muted">of {numPages || '–'}</span></span>
          <button className="tb-btn" onClick={() => go(page + 1)} disabled={!numPages || page >= numPages} aria-label="Next page"><Icon name="next" /></button>
        </div>
        <div className="tb-group pdfv-view-actions">
          <button className={`tb-btn ${mode === 'page' ? 'on' : ''}`} onClick={() => fit('page')} aria-label="Fit entire page" aria-pressed={mode === 'page'} data-testid="pdf-fit-page"><Icon name="fit" /><span>Fit page</span></button>
          <button className={`tb-btn ${mode === 'zoom' ? 'on' : ''}`} onClick={readableZoom} aria-label="Readable zoom — enlarge and pan the slide" data-testid="pdf-readable-zoom">Readable zoom</button>
          <button className={`tb-btn ${textOpen ? 'on' : ''}`} onClick={() => setTextOpen((v) => !v)} aria-expanded={textOpen} aria-controls="pdf-readable-text" data-testid="pdf-text-toggle">Read text</button>
        </div>
        <div className="tb-group pdfv-utility-actions">
          {toolbarExtra}
          <button className="tb-btn accent" onClick={toggleFullscreen} aria-pressed={fullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} data-testid="fullscreen-toggle"><Icon name={fullscreen ? 'exit' : 'full'} /><span className="tb-label">{fullscreen ? 'Exit' : 'Fullscreen'}</span></button>
          <details className="pdfv-tools">
            <summary aria-label="More presentation controls">More</summary>
            <div className="pdfv-tools-items">
              <button className="tb-btn" onClick={() => zoomBy(-1)} aria-label="Zoom out" disabled={zoom <= ZOOM_STEPS[0]}><Icon name="minus" /></button>
              <button className="tb-zoom" onClick={() => fit('page')} aria-label="Reset zoom to fit page" data-testid="pdf-zoom">{Math.round(zoom * 100)}%</button>
              <button className="tb-btn" onClick={() => zoomBy(1)} aria-label="Zoom in" disabled={zoom >= 4}><Icon name="plus" /></button>
              <button className="tb-btn" onClick={() => fit('width')} aria-label="Fit page width">Fit width</button>
              <a className="tb-btn" href={src} download aria-label="Download the PDF" title="Download PDF"><Icon name="download" /></a>
              <a className="tb-btn" href={src} target="_blank" rel="noreferrer" aria-label="Open the PDF in a new tab" title="Open in new tab"><Icon name="open" /></a>
            </div>
          </details>
        </div>
      </div>
      <div className={`pdfv-scroll ${status}`} ref={scrollRef} tabIndex={0} role="region" aria-describedby="pdf-view-limitations" aria-busy={status === 'loading' || rendering} aria-label={`${title || 'Presentation'} — page ${page} of ${numPages || '?'}. Arrow keys change page, plus and minus zoom, zero fits the page, F for fullscreen.`} onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onDoubleClick={() => zoom === 1 ? readableZoom() : fit('page')}>
        {(status === 'loading' || rendering) && <div className="pdfv-progress" aria-hidden="true" />}
        {status === 'error' ? <div className="pdfv-error" role="alert"><p>The presentation could not be rendered ({error}).</p><button className="btn" onClick={() => setLoadRetry((n) => n + 1)}>Retry presentation</button><a className="btn" href={src} target="_blank" rel="noreferrer">Open the PDF directly</a></div> : <div className="pdfv-page" data-page={page}><div className={`pdfv-canvas-wrap parallax-${page % 2 ? 'a' : 'b'}`}><canvas ref={canvasRef} data-testid="pdf-canvas" aria-label={`Rendered page ${page}. Use Read text for the exact slide text.`} />{overlay}</div></div>}
      </div>
      {footer}
      <div className="pdfv-view-note" id="pdf-view-limitations" aria-live="polite">{mode === 'page' ? 'Whole slide fitted, not all small print readable. Dense original text may be too small at this scale: use Readable zoom or Read text (16 px).' : 'Enlarged view · drag or scroll to pan. Small print may still need Read text (16 px). Fit page restores the whole slide.'}</div>
      {textOpen && <section id="pdf-readable-text" className="pdfv-readable" aria-label={`Exact extracted text for slide ${page}`} data-testid="pdf-readable-text">
        <header><h2>Slide {page} · readable text</h2><button className="tb-btn" onClick={() => setTextOpen(false)} aria-label="Close readable text">Close</button></header>
        <p className="pdfv-readable-note">Extracted directly from this PDF, in source order. No summary or added content. Complex columns may read differently from the visual slide.</p>
        {(textState.status === 'loading' || textState.page !== page) && <p role="status">Extracting this slide’s text…</p>}
        {textState.page === page && textState.status === 'error' && <p role="alert">Text extraction was unavailable. <button className="btn" onClick={() => setTextRetry((n) => n + 1)}>Retry text extraction</button></p>}
        {textState.page === page && textState.status === 'ready' && <div className="pdfv-source-text" data-testid="pdf-source-text">{textState.paragraphs.length ? textState.paragraphs.map((text, i) => <p key={`${page}-${i}`} dir="auto">{text}</p>) : <p>No extractable text is present on this PDF page. Use Readable zoom to inspect the original.</p>}</div>}
      </section>}
      {numPages > 1 && <div className="pdfv-thumbs" role="group" aria-label="Pages">{Array.from({ length: numPages }, (_, i) => <button key={i} className={`thumb ${page === i + 1 ? 'active' : ''}`} onClick={() => go(i + 1)} aria-pressed={page === i + 1} aria-label={`Go to page ${i + 1}`} data-testid={`pdf-thumb-${i + 1}`}>{thumbs[i] ? <img src={thumbs[i]} alt="" aria-hidden="true" /> : <span className="thumb-ph" />}<span className="thumb-n">{String(i + 1).padStart(2, '0')}</span></button>)}</div>}
    </div>
  );
}
