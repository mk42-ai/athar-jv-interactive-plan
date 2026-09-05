import React, { useEffect, useRef, useState } from 'react';
import { GUIDE_STEPS } from '../../lib/guide.js';

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
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7v.1" /></>,
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
 * Slim docked player — the last row of the viewer grid, BELOW the slide (never an overlay).
 * Left to right: previous / play-pause / next · current-section indicator · Transcript · Info · exit.
 * A 2 px gold progress line runs along its top edge. Technical voice/model details live in the
 * information menu; the full transcript expands in flow underneath. No change to the playback engine.
 */
export function GuideBar({ guide, page = 1, visible = true }) {
  const { active, playing, status, source, sourceLabel, clip, error, step, idx, total } = guide;
  const [expanded, setExpanded] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const infoToggleRef = useRef(null);
  const infoMenuRef = useRef(null);
  const onDisclosureKeyDown = (e) => {
    if (!infoOpen || e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    e.stopPropagation();
    setInfoOpen(false);
    infoToggleRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (!infoOpen) return;
    // A light-dismiss menu: clicking outside or focusing elsewhere closes it (never traps focus).
    const onPointer = (e) => {
      if (infoMenuRef.current?.contains(e.target) || infoToggleRef.current?.contains(e.target)) return;
      setInfoOpen(false);
    };
    document.addEventListener('pointerdown', onPointer, true);
    return () => document.removeEventListener('pointerdown', onPointer, true);
  }, [infoOpen]);
  useEffect(() => {
    if (!active || !visible) return;
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (e.target?.closest?.('button, a, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="tab"], [role="combobox"]')) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); guide.playPause(); }
      else if (e.key === 'n' || e.key === ']') { e.preventDefault(); guide.skip(); }
      else if (e.key === 'p' || e.key === '[') { e.preventDefault(); guide.back(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, visible, guide]);
  useEffect(() => {
    if (!active) return;
    document.body.dataset.guiding = 'true';
    return () => { delete document.body.dataset.guiding; };
  }, [active]);
  const ended = status === 'ended';
  const current = active ? idx + 1 : 0;
  const statusText = !active ? 'Ready when you are' : ended ? 'Tour complete' : status === 'error' ? error?.message || 'Narration failed' : status === 'loading' ? 'Preparing voice…' : status === 'paused' ? 'Paused' : status === 'breathing' ? 'Next moment…' : 'Narrating';
  const statusShort = !active ? 'Ready' : ended ? 'Complete' : status === 'error' ? 'Needs retry' : status === 'loading' ? 'Preparing' : status === 'paused' ? 'Paused' : status === 'breathing' ? 'Next…' : 'Narrating';
  // Position-based progress: the bar reflects the moment being narrated (1/21 ≈ 5%), full when the tour ends.
  const progress = total ? (active ? (ended ? total : idx + 1) / total : 0) : 0;
  const voiceDetail = sourceLabel || SOURCE_LABEL[source] || source || null;
  return (
    <div className={`guide-dock ${status === 'error' ? 'has-error' : ''} ${expanded ? 'expanded' : ''} ${active ? 'is-active' : 'is-idle'}`} onKeyDown={onDisclosureKeyDown} role="region" aria-label="Guide Mode player" data-testid="guide-bar" data-docked="true" data-active={active} data-status={status} data-step={active ? step?.id : undefined} data-slide={active ? step?.slide : page}>
      <div className="guide-dock-progress" role="progressbar" aria-label="Narration progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={active ? (ended ? total : current) : 0} aria-valuetext={active ? (ended ? 'Tour complete' : `Moment ${current} of ${total}`) : 'Not started'}><i style={{ width: `${progress * 100}%` }} /></div>
      <div className="guide-dock-row">
        <div className="guide-transport" role="group" aria-label="Narration transport">
          <button className="guide-btn" onClick={guide.back} disabled={!active || idx === 0} aria-label="Previous moment" title="Previous moment ([)" data-testid="guide-back"><Icon name="prev" size={15} /></button>
          <button className="guide-btn primary" onClick={() => active ? guide.playPause() : guide.toggle(page)} aria-label={!active ? 'Start guided walkthrough' : ended ? 'Replay from start' : playing ? 'Pause narration' : 'Play narration'} title={!active ? 'Start guided walkthrough (Space)' : playing ? 'Pause (Space)' : 'Play (Space)'} data-testid="guide-playpause" data-playing={playing}><Icon name={ended || status === 'error' ? 'replay' : playing ? 'pause' : 'play'} size={17} /></button>
          <button className="guide-btn" onClick={guide.skip} disabled={!active} aria-label="Skip to next moment" title="Next moment (])" data-testid="guide-skip"><Icon name="next" size={15} /></button>
        </div>
        <div className="guide-section" aria-live="polite">
          <span className="guide-pos" data-testid="guide-position">
            {active ? <><b className="guide-pos-count">{current}<span aria-hidden="true">/</span>{total}</b><span className="guide-pos-sep" aria-hidden="true">·</span>Slide {step?.slide}</> : <>{total} narrated moments<span className="guide-pos-sep" aria-hidden="true">·</span>Guided walkthrough</>}
            <span className={`guide-state ${status === 'error' ? 'error' : ''} ${playing && active ? 'live' : ''}`} data-testid="guide-state">{playing && active && status !== 'error' && <i className="guide-pulse" aria-hidden="true" />}{statusShort}</span>
          </span>
          <p className="guide-caption" data-testid="guide-caption" title={active && step ? `${step.label}. ${step.text}` : undefined}>{active && step ? <><b>{step.label}.</b> {step.text}</> : 'Listen to the plan, at your pace. Controls stay below the slide.'}</p>
        </div>
        <button className="guide-expand" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls="guide-caption-full" aria-label={expanded ? 'Collapse full transcript' : 'Show full transcript'} data-testid="guide-expand"><span>Transcript</span><Icon name={expanded ? 'up' : 'down'} size={14} /></button>
        <div className="guide-info-anchor">
          <button ref={infoToggleRef} className="guide-info-toggle" onClick={() => setInfoOpen((v) => !v)} aria-expanded={infoOpen} aria-haspopup="dialog" aria-controls="guide-information" aria-label="Narration information" title="Narration information" data-testid="guide-info"><Icon name="info" /></button>
          <div ref={infoMenuRef} className="guide-information" id="guide-information" hidden={!infoOpen} role="dialog" aria-label="Narration information" data-testid="guide-information">
            <h3>Narration</h3>
            <dl>
              <div><dt>Playback</dt><dd data-testid="guide-info-playback">{statusText}</dd></div>
              <div><dt>Position</dt><dd>{active ? `Moment ${current} of ${total} · slide ${step?.slide}` : `${total} moments across the deck`}</dd></div>
              <div><dt>Voice</dt><dd><span className="guide-src" data-testid="guide-source" data-source={source || ''} data-clip-source={clip?.source || ''} data-clip-file={clip?.file || ''} data-clip-sha={clip?.sha256 || ''} data-verified={clip?.verified === true ? 'true' : clip?.verified === false ? 'false' : ''}>{voiceDetail || 'Shown once playback starts'}</span></dd></div>
              {(clip?.model || clip?.modelId) && <div><dt>Model</dt><dd>{clip.model || clip.modelId}</dd></div>}
              {clip?.verified != null && <div><dt>Integrity</dt><dd>{clip.verified ? 'Clip SHA-256 verified before playback' : 'Clip integrity not verified'}</dd></div>}
              <div><dt>Shortcuts</dt><dd><kbd>Space</kbd> play / pause · <kbd>[</kbd> previous · <kbd>]</kbd> next. Not while typing.</dd></div>
            </dl>
            <p className="guide-keyboard-note">Pre-recorded, integrity-checked narration only — no live synthesis. Playback problems show a Retry here and in the player.</p>
          </div>
        </div>
        {active && <button className="guide-x" onClick={guide.stop} aria-label="Exit Guide Mode" title="Exit Guide Mode" data-testid="guide-exit"><Icon name="close" size={13} /></button>}
      </div>
      <div className={`guide-status ${status === 'error' ? 'error' : ''}`} data-testid="guide-status" role={status === 'error' ? 'alert' : 'status'} aria-live="polite" hidden={status !== 'error'}>{status === 'error' && <><span>{statusText}</span><button className="guide-retry" onClick={guide.retry} data-testid="guide-retry">Retry</button></>}</div>
      <section id="guide-caption-full" className="guide-caption-full" data-testid="guide-caption-full" hidden={!expanded} aria-label="Full guided walkthrough transcript"><h3>Transcript <span>{total} moments · {statusText}</span></h3><ol className="guide-transcript">{GUIDE_STEPS.map((moment, index) => <li key={moment.id} aria-current={active && step?.id === moment.id ? 'step' : undefined}><button type="button" className="guide-transcript-jump" onClick={() => active ? guide.goto(index) : guide.startAt(index)} aria-label={`Play moment ${index + 1}: ${moment.label}`}><span className="guide-transcript-meta">{index + 1} / {total} · Slide {moment.slide}</span><p><b>{moment.label}.</b> {moment.text}</p></button></li>)}</ol></section>
    </div>
  );
}
