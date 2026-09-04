import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GUIDE_STEPS, firstStepOfSlide } from '../../lib/guide.js';
import { createNarrator } from '../../lib/narrator.js';

const BREATH_MS = 750; // pause between narrated moments

/**
 * Guide Mode engine: narrates GUIDE_STEPS in order, drives the slide (onSlide), auto-advances when
 * narration completes, and exposes toggle / play / pause / skip. status: idle | loading | speaking | paused | ended
 */
export function useGuide({ onSlide }) {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState('idle');
  const [source, setSource] = useState(null);
  const [sourceLabel, setSourceLabel] = useState('');
  const [run, setRun] = useState(0); // bump to (re)start the current step
  const narrator = useMemo(() => createNarrator(), []);
  const runRef = useRef(0);
  const idxRef = useRef(0); // always-current index so rapid skip/back clicks compose correctly
  idxRef.current = idx;
  const onSlideRef = useRef(onSlide);
  onSlideRef.current = onSlide;

  const step = active ? GUIDE_STEPS[idx] : null;

  useEffect(
    () =>
      narrator.subscribe((ev) => {
        if (ev.type !== 'start') return;
        setSource(ev.source);
        setSourceLabel(ev.label || '');
      }),
    [narrator],
  );
  useEffect(() => () => narrator.stop(), [narrator]);

  // Drive the slide to the step being narrated.
  useEffect(() => {
    if (step) onSlideRef.current?.(step.slide);
  }, [step?.slide, active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Narrate the current step; when it completes, advance (or end).
  useEffect(() => {
    if (!active) return;
    const my = ++runRef.current;
    setStatus('loading');
    narrator.prefetch(GUIDE_STEPS[idx + 1]?.text);
    let cancelled = false;
    (async () => {
      const completed = await narrator.speak(GUIDE_STEPS[idx].text);
      if (cancelled || my !== runRef.current) return;
      if (!completed) return; // stopped / skipped — the caller already moved on
      // A short breath between moments so the tour feels spoken, not machine-gunned.
      await new Promise((r) => setTimeout(r, BREATH_MS));
      if (cancelled || my !== runRef.current) return;
      if (idx + 1 < GUIDE_STEPS.length) setIdx(idx + 1);
      else {
        setPlaying(false);
        setStatus('ended');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, idx, run, narrator]);

  useEffect(() => {
    const off = narrator.subscribe((ev) => {
      if (ev.type === 'start') setStatus((s) => (s === 'paused' ? s : 'speaking'));
    });
    return off;
  }, [narrator]);

  // Pause / resume act on the live narration without restarting the step.
  useEffect(() => {
    if (!active) return;
    if (playing) {
      narrator.resume();
      setStatus((s) => (s === 'paused' ? 'speaking' : s));
    } else {
      narrator.pause();
      setStatus((s) => (s === 'ended' ? s : 'paused'));
    }
  }, [playing, active, narrator]);

  const start = useCallback((fromSlide = 1) => {
    const i = Math.max(0, firstStepOfSlide(fromSlide));
    setIdx(i);
    setPlaying(true);
    setActive(true);
    setRun((r) => r + 1);
  }, []);
  const stop = useCallback(() => {
    runRef.current++;
    narrator.stop();
    setActive(false);
    setPlaying(false);
    setStatus('idle');
  }, [narrator]);
  const toggle = useCallback((fromSlide) => (active ? stop() : start(fromSlide)), [active, start, stop]);
  const goto = useCallback(
    (i) => {
      const n = Math.max(0, Math.min(GUIDE_STEPS.length - 1, i));
      runRef.current++;
      narrator.stop();
      idxRef.current = n;
      setIdx(n);
      setPlaying(true);
      setRun((r) => r + 1);
    },
    [narrator],
  );
  const skip = useCallback(() => (idxRef.current + 1 < GUIDE_STEPS.length ? goto(idxRef.current + 1) : stop()), [goto, stop]);
  const back = useCallback(() => goto(idxRef.current - 1), [goto]);
  const playPause = useCallback(() => {
    if (status === 'ended') return goto(0);
    setPlaying((p) => !p);
  }, [status, goto]);
  // Manual slide navigation while guiding → jump to that slide's first moment.
  const syncSlide = useCallback(
    (n) => {
      if (!active) return;
      const cur = GUIDE_STEPS[idxRef.current];
      if (cur && cur.slide !== n) {
        const i = firstStepOfSlide(n);
        if (i >= 0) goto(i);
      }
    },
    [active, goto],
  );

  return { active, playing, status, source, sourceLabel, idx, step, total: GUIDE_STEPS.length, start, stop, toggle, skip, back, playPause, goto, syncSlide };
}
