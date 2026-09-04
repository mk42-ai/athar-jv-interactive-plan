import React, { useEffect, useRef } from 'react';

// Minimal state indicator: a small gold dot with a soft ring. Listening/speaking scale with
// the live audio level; thinking shows a slow rotating arc. No canvas, no orb.
export default function VoiceIndicator({ state, meterRef, size = 44 }) {
  const ref = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    let raf = 0;
    let smooth = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = ref.current;
      if (!el) return;
      const st = stateRef.current;
      const meter = meterRef?.current;
      let lvl = 0;
      if (meter && (st === 'listening' || st === 'speaking')) lvl = Math.min(1, meter.level() * (st === 'listening' ? 3.2 : 2.4));
      smooth += (lvl - smooth) * (lvl > smooth ? 0.35 : 0.12);
      el.style.setProperty('--lvl', smooth.toFixed(3));
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [meterRef]);
  return (
    <span className={`vi state-${state}`} ref={ref} style={{ '--size': `${size}px` }} data-state={state} aria-hidden="true">
      <span className="vi-ring" />
      <span className="vi-arc" />
      <span className="vi-dot" />
    </span>
  );
}
