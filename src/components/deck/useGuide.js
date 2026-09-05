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
  const [clip, setClip] = useState(null); // provenance of the clip currently playing
  const [error, setError] = useState(null);
  const [run, setRun] = useState(0); // bump to (re)start the current step
  const narrator = useMemo(() => createNarrator(), []);
  const runRef = useRef(0);
  const playingRef = useRef(false);
  // The breath owns its remaining active-play time, not a wall-clock timeout.
  const breathRef = useRef(null);
  const cancelBreath = useCallback(() => {
    const breath = breathRef.current;
    if (!breath) return;
    clearTimeout(breath.timer);
    breathRef.current = null;
    breath.resolve(false);
  }, []);
  const pauseBreath = useCallback(() => {
    const breath = breathRef.current;
    if (!breath || breath.started == null) return;
    clearTimeout(breath.timer);
    breath.remaining = Math.max(0, breath.remaining - (performance.now() - breath.started));
    breath.started = null;
  }, []);
  const resumeBreath = useCallback(() => {
    const breath = breathRef.current;
    if (!breath || breath.started != null || !playingRef.current) return;
    breath.started = performance.now();
    breath.timer = setTimeout(() => {
      if (breathRef.current !== breath) return;
      if (!playingRef.current) { pauseBreath(); return; }
      breathRef.current = null;
      breath.resolve(true);
    }, breath.remaining);
  }, [pauseBreath]);
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
        setClip(ev.clip || null);
        setError(null);
      }),
    [narrator],
  );
  useEffect(() => () => { playingRef.current = false; cancelBreath(); narrator.stop(); }, [narrator, cancelBreath]);

  // Drive the slide to the step being narrated.
  useEffect(() => {
    if (step) onSlideRef.current?.(step.slide);
  }, [step?.slide, active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Narrate the current step; when it completes, advance (or end). A failure is surfaced, never hidden:
  // status becomes 'error', playback stops and the tour does NOT auto-advance.
  useEffect(() => {
    if (!active) return;
    const my = ++runRef.current;
    setStatus(playingRef.current ? 'loading' : 'paused');
    setError(null);
    narrator.prefetch(GUIDE_STEPS[idx + 1]);
    let cancelled = false;
    (async () => {
      let completed = false;
      try {
        // A pause during the breath sets narrator's internal paused flag. Clear it
        // only after stopping the completed clip, so resuming cannot replay that clip.
        narrator.stop();
        if (playingRef.current) narrator.resume(); else narrator.pause();
        completed = await narrator.speak(GUIDE_STEPS[idx]);
      } catch (e) {
        if (cancelled || my !== runRef.current) return;
        console.error('[guide-audio] narration failed:', e);
        setError({ message: e?.message || 'Narration failed', step: GUIDE_STEPS[idx].id, blocked: Boolean(e?.blocked) });
        setStatus('error');
        playingRef.current = false;
        setPlaying(false);
        return;
      }
      if (cancelled || my !== runRef.current) return;
      if (!completed) return; // stopped / skipped — the caller already moved on
      // A short breath between moments so the tour feels spoken, not machine-gunned.
      setStatus(playingRef.current ? 'breathing' : 'paused');
      const breathed = await new Promise((resolve) => {
        breathRef.current = { remaining: BREATH_MS, started: null, timer: null, resolve };
        resumeBreath();
      });
      if (!breathed || cancelled || my !== runRef.current || !playingRef.current) return;
      if (idx + 1 < GUIDE_STEPS.length) setIdx(idx + 1);
      else {
        playingRef.current = false;
        setPlaying(false);
        setStatus('ended');
      }
    })();
    return () => {
      cancelled = true;
      cancelBreath();
    };
  }, [active, idx, run, narrator, cancelBreath, resumeBreath]);

  useEffect(() => {
    const off = narrator.subscribe((ev) => {
      if (ev.type === 'start') setStatus(playingRef.current ? 'speaking' : 'paused');
    });
    return off;
  }, [narrator]);

  // Pause / resume act on the live narration without restarting the step.
  useEffect(() => {
    if (!active) return;
    if (playing) {
      if (breathRef.current) {
        resumeBreath();
        setStatus('breathing');
      } else {
        narrator.resume();
        setStatus((s) => (s === 'paused' ? 'speaking' : s));
      }
    } else {
      pauseBreath();
      narrator.pause();
      setStatus((s) => (s === 'ended' || s === 'error' ? s : 'paused'));
    }
  }, [playing, active, narrator, pauseBreath, resumeBreath]);

  const start = useCallback((fromSlide = 1) => {
    narrator.unlock(); // inside the user's click: unlock the audio element for iOS/Safari
    const i = Math.max(0, firstStepOfSlide(fromSlide));
    cancelBreath();
    idxRef.current = i;
    setIdx(i);
    playingRef.current = true;
    setPlaying(true);
    setActive(true);
    setRun((r) => r + 1);
  }, [narrator, cancelBreath]);
  const stop = useCallback(() => {
    runRef.current++;
    playingRef.current = false;
    cancelBreath();
    narrator.stop();
    setActive(false);
    setPlaying(false);
    setStatus('idle');
  }, [narrator, cancelBreath]);
  const toggle = useCallback((fromSlide) => (active ? stop() : start(fromSlide)), [active, start, stop]);
  const goto = useCallback(
    (i) => {
      const n = Math.max(0, Math.min(GUIDE_STEPS.length - 1, i));
      narrator.unlock();
      runRef.current++;
      cancelBreath();
      narrator.stop();
      idxRef.current = n;
      setIdx(n);
      playingRef.current = true;
      setPlaying(true);
      setRun((r) => r + 1);
    },
    [narrator, cancelBreath],
  );
  const skip = useCallback(() => (idxRef.current + 1 < GUIDE_STEPS.length ? goto(idxRef.current + 1) : stop()), [goto, stop]);
  const back = useCallback(() => goto(idxRef.current - 1), [goto]);
  const playPause = useCallback(() => {
    if (status === 'ended') return goto(0);
    if (status === 'error') return goto(idxRef.current); // retry the failed moment (inside the click gesture)
    // Update synchronously: pausing at the timeout boundary cannot advance the guide.
    playingRef.current = !playingRef.current;
    if (!playingRef.current) { pauseBreath(); narrator.pause(); }
    setPlaying(playingRef.current);
  }, [status, goto, pauseBreath, narrator]);
  const retry = useCallback(() => goto(idxRef.current), [goto]);
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

  return { active, playing, status, source, sourceLabel, clip, error, retry, idx, step, total: GUIDE_STEPS.length, start, stop, toggle, skip, back, playPause, goto, syncSlide };
}
