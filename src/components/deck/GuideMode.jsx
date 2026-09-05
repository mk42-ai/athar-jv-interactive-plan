import React, { useEffect, useRef, useState } from 'react';

const I = {
  play: <path d="M7 5v14l12-7z" fill="currentColor" stroke="none" />,
  pause: <path d="M8 5v14M16 5v14" strokeWidth="2.4" />,
  next: <path d="M6 5v14l9-7zM18 5v14" />,
  prev: <path d="M18 5v14L9 12zM6 5v14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  replay: <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5" />,
  down: <path d="M6 9l6 6 6-6" />,
  up: <path d="M6 15l6-6 6 6" />,
};
const Icon = ({ name, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {I[name]}
  </svg>
);

const SOURCE_LABEL = { elevenlabs: 'ElevenLabs voice', live: 'Live voice (proxy)' };

/** Toggle pill shown in the viewer toolbar. */
export function GuideToggle({ guide, page }) {
  return (
    <button
      className={`tb-btn guide-toggle ${guide.active ? 'on' : ''}`}
      onClick={() => guide.toggle(page)}
      aria-pressed={guide.active}
      aria-label={guide.active ? 'Exit Guide Mode' : 'Start Guide Mode — AI-narrated walkthrough'}
      title={guide.active ? 'Exit Guide Mode' : 'Guide Mode — AI-narrated walkthrough'}
      data-testid="guide-toggle"
    >
      <Icon name="spark" /><span className="tb-label">{guide.active ? 'Guiding' : 'Guide me'}</span>
    </button>
  );
}

/** Highlight overlay drawn over the rendered page (boxes are slide fractions). */
export function GuideOverlay({ guide }) {
  const step = guide.step;
  if (!guide.active || !step) return null;
  const spotlight = step.boxes.length === 1;
  return (
    <div className={`guide-overlay ${spotlight ? 'spot' : 'multi'} kind-${step.kind}`} data-testid="guide-overlay" data-step={step.id} aria-hidden="true">
      {step.boxes.map((b, i) => (
        <div key={`${step.id}-${i}`} className="guide-hl" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}>
        </div>
      ))}
    </div>
  );
}

/**
 * Docked player — a slim bar that lives BELOW the slide (a grid row of the viewer, never an overlay), so the
 * whole slide stays visible while narrating. It remains in document flow on every screen. Keeps every
 * control and test hook of the previous bar: back / play-pause / skip, status, provider badge, exit, retry.
 */
export function GuideBar({ guide }) {
  const { active, playing, status, source, sourceLabel, clip, error, step, idx, total } = guide;
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (e.target?.closest?.('button, a, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="tab"], [role="combobox"]')) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); guide.playPause(); }
      else if (e.key === 'n' || e.key === ']') { e.preventDefault(); guide.skip(); }
      else if (e.key === 'p' || e.key === '[') { e.preventDefault(); guide.back(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, guide]);
  // Preserve the existing guide-state hook, but reserve no fixed dock space.
  useEffect(() => {
    if (!active) return;
    document.body.dataset.guiding = 'true';
    return () => { delete document.body.dataset.guiding; };
  }, [active]);
  useEffect(() => setExpanded(false), [step?.id]); // a new moment always starts collapsed
  if (!active || !step) return null;
  const ended = status === 'ended';
  const statusText = ended ? 'Tour complete' : status === 'error' ? error?.message || 'Narration failed' : status === 'loading' ? 'Preparing voice…' : status === 'paused' ? 'Paused' : status === 'breathing' ? 'Next moment…' : 'Narrating';
  return (
    <div
      ref={rootRef}
      className={`guide-dock ${status === 'error' ? 'has-error' : ''} ${expanded ? 'expanded' : ''}`}
      role="region"
      aria-label="Guide Mode player"
      data-testid="guide-bar"
      data-docked="true"
      data-status={status}
      data-step={step.id}
      data-slide={step.slide}
    >
      <div className="guide-dock-progress" aria-hidden="true"><i style={{ width: `${((idx + (ended ? 1 : 0)) / total) * 100}%` }} /></div>
      <div className="guide-dock-row">
        <span className="guide-live" title="Guide Mode"><i className={status === 'speaking' ? 'pulse' : ''} /><span className="guide-live-label">Guide</span></span>
        <span className="guide-pos" data-testid="guide-position" title={`Slide ${step.slide} · moment ${step.stepInSlide} of ${step.stepsInSlide}`}>{idx + 1}/{total} · S{step.slide}</span>
        <div className="guide-transport">
          <button className="guide-btn" onClick={guide.back} disabled={idx === 0} aria-label="Previous moment" data-testid="guide-back"><Icon name="prev" size={15} /></button>
          <button className="guide-btn primary" onClick={guide.playPause} aria-label={ended ? 'Replay from start' : playing ? 'Pause narration' : 'Play narration'} data-testid="guide-playpause" data-playing={playing}>
            <Icon name={ended || status === 'error' ? 'replay' : playing ? 'pause' : 'play'} size={17} />
          </button>
          <button className="guide-btn" onClick={guide.skip} aria-label="Skip to next moment" data-testid="guide-skip"><Icon name="next" size={15} /></button>
        </div>
        <div className="guide-cap-wrap">
          <p className="guide-caption" aria-live="polite" data-testid="guide-caption" title={`${step.label}. ${step.text}`}><b>{step.label}.</b> {step.text}</p>
          <button className="guide-expand" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls="guide-caption-full" aria-label={expanded ? 'Collapse narration text' : 'Show full narration text'} data-testid="guide-expand"><Icon name={expanded ? 'up' : 'down'} size={14} /></button>
        </div>
        <span className={`guide-status ${status === 'error' ? 'error' : ''}`} data-testid="guide-status" role={status === 'error' ? 'alert' : undefined}>
          {statusText}
          {status === 'error' && <button className="guide-retry" onClick={guide.retry} data-testid="guide-retry">Retry</button>}
        </span>
        {source && (
          <span className="guide-src" data-testid="guide-source" data-source={source} data-clip-source={clip?.source || ''} data-clip-file={clip?.file || ''} data-clip-sha={clip?.sha256 || ''} data-verified={clip?.verified === true ? 'true' : clip?.verified === false ? 'false' : ''} title={clip ? `${clip.source} · ${clip.file}${clip.sha256 ? ` · sha256 ${clip.sha256.slice(0, 12)}…${clip.verified ? ' verified' : ''}` : ''}` : ''}>
            {sourceLabel || SOURCE_LABEL[source] || source}
          </span>
        )}
        <button className="guide-x" onClick={guide.stop} aria-label="Exit Guide Mode" data-testid="guide-exit"><Icon name="close" size={13} /></button>
      </div>
      {expanded && (
        <div id="guide-caption-full" className="guide-caption-full" data-testid="guide-caption-full">
          <b>{step.label}.</b> {step.text}
        </div>
      )}
    </div>
  );
}
