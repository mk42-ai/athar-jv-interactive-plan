import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

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
const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {I[name]}
  </svg>
);

/**
 * PDF.js viewer for the exact presentation PDF (served locally from /deck/…).
 * Crisp: renders at devicePixelRatio × zoom. Fit-width by default; zoom steps; page nav;
 * keyboard (← → + − 0 F); fullscreen (API with CSS fallback); thumbnails.
 */
export default function PdfViewer({ src, title, onPageChange, requestedPage, overlay, toolbarExtra, onUserNavigate }) {
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1); // multiplier on top of fit-width
  const [fitMode, setFitMode] = useState('width'); // 'width' | 'page'
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [thumbs, setThumbs] = useState([]);
  const [rendering, setRendering] = useState(false);
  const [containerW, setContainerW] = useState(0);
  const dragRef = useRef(null);

  // ---- load document ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    const task = pdfjsLib.getDocument({ url: src, cMapPacked: true });
    task.promise
      .then(async (pdf) => {
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setStatus('ready');
        // thumbnails (small, cheap)
        const out = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const p = await pdf.getPage(i);
          const vp = p.getViewport({ scale: 1 });
          const scale = 220 / vp.width;
          const v2 = p.getViewport({ scale });
          const c = document.createElement('canvas');
          c.width = Math.round(v2.width);
          c.height = Math.round(v2.height);
          await p.render({ canvasContext: c.getContext('2d'), viewport: v2 }).promise;
          out.push(c.toDataURL('image/png'));
        }
        if (!cancelled) setThumbs(out);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || String(e));
        setStatus('error');
      });
    return () => {
      cancelled = true;
      task.destroy?.();
    };
  }, [src]);

  // ---- track container width --------------------------------------------------------------
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, [fullscreen]);

  // ---- render current page --------------------------------------------------------------
  const render = useCallback(async () => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const holder = scrollRef.current;
    if (!pdf || !canvas || !holder || !containerW) return;
    renderTaskRef.current?.cancel?.();
    setRendering(true);
    try {
      const p = await pdf.getPage(page);
      const base = p.getViewport({ scale: 1 });
      const pad = 32;
      const availW = Math.max(120, holder.clientWidth - pad);
      const availH = Math.max(120, holder.clientHeight - pad);
      const fitW = availW / base.width;
      const fitP = Math.min(fitW, availH / base.height);
      const scale = (fitMode === 'page' ? fitP : fitW) * zoom;
      const vp = p.getViewport({ scale });
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      canvas.width = Math.floor(vp.width * dpr);
      canvas.height = Math.floor(vp.height * dpr);
      canvas.style.width = `${Math.floor(vp.width)}px`;
      canvas.style.height = `${Math.floor(vp.height)}px`;
      const ctx = canvas.getContext('2d', { alpha: false });
      const task = p.render({ canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
      renderTaskRef.current = task;
      await task.promise;
      canvas.dataset.page = String(page);
      canvas.dataset.scale = scale.toFixed(3);
      onPageChange?.(page);
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') console.warn('pdf render', e);
    } finally {
      setRendering(false);
    }
  }, [page, zoom, fitMode, containerW, onPageChange]);

  useEffect(() => {
    if (status === 'ready') render();
  }, [status, render]);

  // ---- controls ---------------------------------------------------------------------------
  const go = (p) => {
    const n = clamp(p ?? page, 1, numPages || 1);
    setPage(n);
    if (n !== page) onUserNavigate?.(n);
  };
  // Guide Mode (or any parent) can drive the page: { n, t } — t changes force re-application.
  useEffect(() => {
    if (requestedPage?.n) setPage(clamp(requestedPage.n, 1, numPages || requestedPage.n));
  }, [requestedPage?.n, requestedPage?.t, numPages]);
  const zoomBy = (dir) => {
    setZoom((z) => {
      const idx = ZOOM_STEPS.findIndex((s) => s >= z - 1e-6);
      const next = dir > 0 ? ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, (idx < 0 ? 3 : idx) + 1)] : ZOOM_STEPS[Math.max(0, (idx < 0 ? 3 : idx) - 1)];
      return next;
    });
  };
  const fit = (mode) => {
    setFitMode(mode);
    setZoom(1);
  };
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
    if (fullscreen) fit('page');
    else fit('width');
    const onKey = (e) => e.key === 'Escape' && fullscreen && !document.fullscreenElement && setFullscreen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('viewer-fullscreen');
    };
  }, [fullscreen]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') go(page + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(page - 1);
    else if (e.key === '+' || e.key === '=') zoomBy(1);
    else if (e.key === '-' || e.key === '_') zoomBy(-1);
    else if (e.key === '0') fit('width');
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    else if (e.key === 'Home') go(1);
    else if (e.key === 'End') go(numPages);
    else return;
    e.preventDefault();
  };
  // ctrl/cmd + wheel zooms; plain wheel scrolls the page area
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  // drag to pan when the page overflows
  const onPointerDown = (e) => {
    const el = scrollRef.current;
    if (!el || e.button !== 0) return;
    if (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight) return;
    dragRef.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
    el.classList.add('dragging');
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    const el = scrollRef.current;
    if (!d || !el) return;
    el.scrollLeft = d.sl - (e.clientX - d.x);
    el.scrollTop = d.st - (e.clientY - d.y);
  };
  const endDrag = () => {
    dragRef.current = null;
    scrollRef.current?.classList.remove('dragging');
  };

  const pct = Math.round(zoom * 100);

  return (
    <div className={`pdfv ${fullscreen ? 'is-fullscreen' : ''}`} ref={rootRef} data-testid="pdf-viewer" data-status={status}>
      <div className="pdfv-toolbar" role="toolbar" aria-label="Presentation controls">
        <div className="tb-group">
          <button className="tb-btn" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Previous page"><Icon name="prev" /></button>
          <span className="tb-counter" aria-live="polite" data-testid="pdf-page-counter">Page {page} <span className="muted">of {numPages || '–'}</span></span>
          <button className="tb-btn" onClick={() => go(page + 1)} disabled={!numPages || page >= numPages} aria-label="Next page"><Icon name="next" /></button>
        </div>
        <div className="tb-group">
          <button className="tb-btn" onClick={() => zoomBy(-1)} aria-label="Zoom out" disabled={zoom <= ZOOM_STEPS[0]}><Icon name="minus" /></button>
          <button className="tb-zoom" onClick={() => fit('width')} aria-label="Reset zoom to fit width" data-testid="pdf-zoom">{pct}%</button>
          <button className="tb-btn" onClick={() => zoomBy(1)} aria-label="Zoom in" disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}><Icon name="plus" /></button>
          <button className={`tb-btn ${fitMode === 'page' && zoom === 1 ? 'on' : ''}`} onClick={() => fit(fitMode === 'page' ? 'width' : 'page')} aria-label="Toggle fit page / fit width" aria-pressed={fitMode === 'page'}><Icon name="fit" /></button>
        </div>
        <div className="tb-group">
          <a className="tb-btn" href={src} download aria-label="Download the PDF" title="Download PDF"><Icon name="download" /></a>
          <a className="tb-btn" href={src} target="_blank" rel="noreferrer" aria-label="Open the PDF in a new tab" title="Open in new tab"><Icon name="open" /></a>
          {toolbarExtra}
          <button className="tb-btn accent" onClick={toggleFullscreen} aria-pressed={fullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} data-testid="fullscreen-toggle">
            <Icon name={fullscreen ? 'exit' : 'full'} /><span className="tb-label">{fullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      <div
        className={`pdfv-scroll ${status}`}
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label={`${title || 'Presentation'} — page ${page} of ${numPages || '?'}. Arrow keys change page, plus and minus zoom, F for fullscreen.`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onDoubleClick={() => (zoom === 1 ? setZoom(2) : fit(fitMode))}
      >
        {(status === 'loading' || rendering) && <div className="pdfv-progress" aria-hidden="true" />}
        {status === 'error' ? (
          <div className="pdfv-error" role="alert">
            <p>The presentation could not be rendered in the browser ({error}).</p>
            <a className="btn" href={src} target="_blank" rel="noreferrer">Open the PDF directly</a>
          </div>
        ) : (
          <div className="pdfv-page">
            <div className="pdfv-canvas-wrap">
              <canvas ref={canvasRef} data-testid="pdf-canvas" aria-label={`Rendered page ${page}`} />
              {overlay}
            </div>
          </div>
        )}
      </div>

      {numPages > 1 && (
        <div className="pdfv-thumbs" role="group" aria-label="Pages">
          {Array.from({ length: numPages }, (_, i) => (
            <button key={i} className={`thumb ${page === i + 1 ? 'active' : ''}`} onClick={() => go(i + 1)} aria-pressed={page === i + 1} aria-label={`Go to page ${i + 1}`} data-testid={`pdf-thumb-${i + 1}`}>
              {thumbs[i] ? <img src={thumbs[i]} alt="" aria-hidden="true" /> : <span className="thumb-ph" />}
              <span className="thumb-n">{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
