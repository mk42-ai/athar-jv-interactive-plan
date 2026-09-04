// Guide Mode narrator — soft-spoken American voice with graceful fallback.
//   1. On Demand Services API text_to_speech (server proxy /api/guide/tts, voice "shimmer" — soft US female)
//   2. Browser Web Speech API — a soft US-English voice, slightly slower rate
//   3. Timed silent narration (reading-speed estimate) so auto-advance still works when no audio is possible
// speak(text) resolves when the step has finished (or was skipped); pause/resume/stop act on whatever is playing.

const WEB_VOICE_PREFS = [
  'Samantha', // macOS / iOS — soft US female
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Microsoft Ava Online (Natural) - English (United States)',
  'Google US English',
  'Microsoft Zira',
  'Allison',
  'Ava',
  'Nicky',
];
const WEB_RATE = 0.92; // slightly slower than default
const WEB_PITCH = 1.0;

export function pickWebVoice() {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices() || [];
  if (!voices.length) return null;
  for (const p of WEB_VOICE_PREFS) {
    const v = voices.find((x) => x.name === p) || voices.find((x) => x.name.startsWith(p));
    if (v && /^en[-_]?US/i.test(v.lang || 'en-US')) return v;
  }
  return (
    voices.find((v) => /^en[-_]US/i.test(v.lang) && /female|aria|jenny|ava|zira|allison|samantha|nicky|google us/i.test(v.name)) ||
    voices.find((v) => /^en[-_]US/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    voices[0]
  );
}

const words = (t) => String(t).trim().split(/\s+/).filter(Boolean).length;
export const estimateMs = (t) => Math.max(2200, Math.round((words(t) / 2.55) * 1000)); // ≈150 wpm, soft pace

// Diagnostics for QA / support: window.__atharGuide = { events: [...] } (why a fallback happened, which source played).
const diag = typeof window !== 'undefined' ? (window.__atharGuide = window.__atharGuide || { events: [] }) : { events: [] };
const log = (type, detail) => {
  diag.events.push({ t: Date.now(), type, detail: String(detail ?? '') });
  if (diag.events.length > 200) diag.events.shift();
};

export function createNarrator({ preferApi = true } = {}) {
  const cache = new Map(); // text -> Promise<string|null> (same-origin mp3 URL)
  let apiDown = !preferApi;
  let current = null; // active playback { pause, resume, stop, source }
  let paused = false;
  let listeners = new Set();
  const emit = (ev) => listeners.forEach((l) => l(ev));

  async function fetchClip(text) {
    if (apiDown) return null;
    if (!cache.has(text)) {
      cache.set(
        text,
        (async () => {
          try {
            const r = await fetch('/api/guide/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text }),
            });
            if (r.status === 503) apiDown = true; // key missing — stop asking
            if (!r.ok) {
              log('tts-http', r.status);
              return null;
            }
            const j = await r.json();
            return j?.url || null;
          } catch (e) {
            log('tts-fetch-error', e?.message);
            return null;
          }
        })(),
      );
    }
    return cache.get(text);
  }

  // ---- strategy 1: mp3 clip from the On Demand proxy -----------------------------------
  function playClip(url, text) {
    return new Promise((resolve, reject) => {
      const a = new Audio(url);
      a.preload = 'auto';
      diag.audio = a;
      let settled = false;
      let stallTimer = null;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        clearInterval(stallTimer);
        a.onended = a.onerror = null;
        resolve(ok);
      };
      // Stall guard: if the media clock stops advancing while we are meant to be playing (no audio
      // device, sink lost, muted-tab quirks), keep the tour moving on a timed pace for the remainder.
      let lastT = -1;
      let stuck = 0;
      const startedAt = Date.now();
      const watch = () => {
        if (settled || paused || a.paused) return;
        if (Math.abs(a.currentTime - lastT) < 0.15) stuck++;
        else stuck = 0;
        lastT = a.currentTime;
        if (stuck >= 3) {
          log('audio-stalled', `currentTime=${a.currentTime.toFixed(2)} after ${Date.now() - startedAt}ms`);
          const remaining = Math.max(1500, estimateMs(text) - (Date.now() - startedAt));
          settled = true;
          clearInterval(stallTimer);
          a.onended = a.onerror = null;
          a.pause();
          resolve(playTimed(text, remaining));
        }
      };
      a.onended = () => done(true);
      a.onerror = () => {
        log('audio-error', a.error?.code);
        if (!settled) reject(new Error('audio error'));
      };
      const pb = {
        source: 'ondemand',
        pause: () => a.pause(),
        resume: () => a.play().catch(() => {}),
        stop: () => {
          clearTimeout(startGuard);
          a.pause();
          a.removeAttribute('src');
          a.load();
          done(false);
        },
      };
      current = pb;
      // Start guard: a real browser begins playback within milliseconds; if play() is still pending
      // after 4s (no audio output device / sink never initialises) fall back to timed pacing.
      let began = false;
      const startGuard = setTimeout(() => {
        if (began || settled) return;
        log('audio-start-timeout', 'play() pending > 4s — timed pacing');
        settled = true;
        a.onended = a.onerror = null;
        a.pause();
        resolve(playTimed(text));
      }, 4000);
      a.play()
        .then(() => {
          began = true;
          clearTimeout(startGuard);
          if (settled) return;
          log('play', 'ondemand');
          emit({ type: 'start', source: 'ondemand' });
          if (paused) a.pause();
          stallTimer = setInterval(watch, 1000);
        })
        .catch((e) => {
          clearTimeout(startGuard);
          if (settled) return;
          log('audio-play-rejected', `${e?.name}: ${e?.message}`);
          if (!settled) {
            settled = true;
            reject(e);
          }
        });
    });
  }

  // ---- strategy 2: Web Speech API ------------------------------------------------------
  function playWeb(text) {
    return new Promise((resolve, reject) => {
      if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') return reject(new Error('no speechSynthesis'));
      const voice = pickWebVoice();
      if (!voice) {
        log('web-speech', 'no voices available');
        return reject(new Error('no voices'));
      }
      log('web-speech-voice', `${voice.name} (${voice.lang})`);
      // Chrome cuts long utterances — narrate sentence by sentence.
      const parts = String(text).match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [text];
      let i = 0;
      let stopped = false;
      let started = false;
      let watchdog = null;
      const finish = (ok) => {
        clearTimeout(watchdog);
        resolve(ok);
      };
      const next = () => {
        if (stopped) return;
        if (i >= parts.length) return finish(true);
        const u = new SpeechSynthesisUtterance(parts[i++]);
        u.voice = voice;
        u.lang = voice.lang || 'en-US';
        u.rate = WEB_RATE;
        u.pitch = WEB_PITCH;
        u.volume = 1;
        u.onstart = () => {
          if (!started) {
            started = true;
            emit({ type: 'start', source: 'browser' });
          }
        };
        u.onend = () => next();
        u.onerror = (e) => {
          if (stopped || e.error === 'interrupted' || e.error === 'canceled') return;
          if (!started) reject(new Error(e.error || 'speech error'));
          else finish(true);
        };
        speechSynthesis.speak(u);
      };
      current = {
        source: 'browser',
        pause: () => speechSynthesis.pause(),
        resume: () => speechSynthesis.resume(),
        stop: () => {
          stopped = true;
          speechSynthesis.cancel();
          finish(false);
        },
      };
      speechSynthesis.cancel();
      // If nothing starts speaking within 4s (headless / muted engines), fall through to timed narration.
      watchdog = setTimeout(() => {
        if (!started && !stopped) {
          stopped = true;
          speechSynthesis.cancel();
          reject(new Error('speech did not start'));
        }
      }, 4000);
      next();
      if (paused) speechSynthesis.pause();
    });
  }

  // ---- strategy 3: timed (silent) ------------------------------------------------------
  function playTimed(text, ms) {
    return new Promise((resolve) => {
      let remaining = ms || estimateMs(text);
      let startedAt = Date.now();
      let timer = null;
      const arm = () => {
        startedAt = Date.now();
        timer = setTimeout(() => resolve(true), remaining);
      };
      current = {
        source: 'timed',
        pause: () => {
          if (!timer) return;
          clearTimeout(timer);
          timer = null;
          remaining -= Date.now() - startedAt;
        },
        resume: () => !timer && arm(),
        stop: () => {
          clearTimeout(timer);
          timer = null;
          resolve(false);
        },
      };
      log('play', 'timed');
      emit({ type: 'start', source: 'timed' });
      if (!paused) arm();
    });
  }

  async function speak(text) {
    stop();
    const token = {};
    speak.token = token;
    const url = await fetchClip(text);
    if (speak.token !== token) return false;
    if (url) {
      try {
        return await playClip(url, text);
      } catch {
        if (speak.token !== token) return false;
      }
    }
    try {
      return await playWeb(text);
    } catch {
      if (speak.token !== token) return false;
    }
    return playTimed(text);
  }
  function stop() {
    speak.token = null;
    current?.stop();
    current = null;
  }
  function pause() {
    paused = true;
    current?.pause();
  }
  function resume() {
    paused = false;
    current?.resume();
  }
  function prefetch(text) {
    if (text) fetchClip(text);
  }
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  return { speak, stop, pause, resume, prefetch, subscribe, get source() { return current?.source || null; } };
}
