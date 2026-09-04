import React, { useEffect } from 'react';

const I = {
  play: <path d="M7 5v14l12-7z" fill="currentColor" stroke="none" />,
  pause: <path d="M8 5v14M16 5v14" strokeWidth="2.4" />,
  next: <path d="M6 5v14l9-7zM18 5v14" />,
  prev: <path d="M18 5v14L9 12zM6 5v14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  replay: <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5" />,
};
const Icon = ({ name, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {I[name]}
  </svg>
);

const SOURCE_LABEL = { elevenlabs: 'ElevenLabs voice', ondemand: 'On Demand voice', browser: 'Browser voice · en-US', timed: 'Silent · timed' };

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
          {i === 0 && <span className="guide-tag">{step.label}</span>}
        </div>
      ))}
    </div>
  );
}

/** Floating control bar: play/pause, back/skip, caption, voice source, progress. */
export function GuideBar({ guide }) {
  const { active, playing, status, source, sourceLabel, step, idx, total } = guide;
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); guide.playPause(); }
      else if (e.key === 'n' || e.key === ']') { e.preventDefault(); guide.skip(); }
      else if (e.key === 'p' || e.key === '[') { e.preventDefault(); guide.back(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, guide]);
  if (!active || !step) return null;
  const ended = status === 'ended';
  return (
    <div className="guide-bar" role="region" aria-label="Guide Mode" data-testid="guide-bar" data-status={status} data-step={step.id} data-slide={step.slide}>
      <div className="guide-bar-head">
        <span className="guide-live"><i className={status === 'speaking' ? 'pulse' : ''} /> Guide Mode</span>
        <span className="guide-pos" data-testid="guide-position">Slide {step.slide} · moment {step.stepInSlide}/{step.stepsInSlide} · {idx + 1}/{total}</span>
        {source && <span className="guide-src" data-testid="guide-source" data-source={source}>{sourceLabel || SOURCE_LABEL[source] || source}</span>}
        <button className="guide-x" onClick={guide.stop} aria-label="Exit Guide Mode" data-testid="guide-exit"><Icon name="close" size={14} /></button>
      </div>
      <p className="guide-caption" aria-live="polite" data-testid="guide-caption"><b>{step.label}.</b> {step.text}</p>
      <div className="guide-controls">
        <button className="guide-btn" onClick={guide.back} disabled={idx === 0} aria-label="Previous moment" data-testid="guide-back"><Icon name="prev" /></button>
        <button className="guide-btn main" onClick={guide.playPause} aria-label={ended ? 'Replay from start' : playing ? 'Pause narration' : 'Play narration'} data-testid="guide-playpause" data-playing={playing}>
          <Icon name={ended ? 'replay' : playing ? 'pause' : 'play'} size={18} />
        </button>
        <button className="guide-btn" onClick={guide.skip} aria-label="Skip to next moment" data-testid="guide-skip"><Icon name="next" /></button>
        <span className="guide-status" data-testid="guide-status">{ended ? 'Tour complete' : status === 'loading' ? 'Preparing voice…' : status === 'paused' ? 'Paused' : 'Narrating'}</span>
        <div className="guide-progress" aria-hidden="true"><i style={{ width: `${((idx + (ended ? 1 : 0)) / total) * 100}%` }} /></div>
      </div>
    </div>
  );
}
