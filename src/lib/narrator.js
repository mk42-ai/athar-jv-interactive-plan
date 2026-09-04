// Guide Mode narrator — plays ONLY verified ElevenLabs clips.
//
// Playback path per moment (logged to window.__atharGuide.sources and the console):
//   1. "prebaked"  — /guide-audio/manifest.json (fetched with cache: 'no-store') → the moment's clip file
//                   (content-hashed name) → bytes fetched → SHA-256 verified against the manifest (and the
//                   manifest's textSha256 verified against the current script text) → played from a blob URL.
//   2. "live"      — POST /api/guide/tts (server-side ElevenLabs; On Demand only if ElevenLabs hard-fails).
//                   Used only when a moment has no pre-baked clip or its integrity check fails.
//   3. ERROR       — anything else surfaces as a visible error in the guide bar. There is deliberately NO
//                   Web Speech (robotic synthetic voice) and NO silent timed fallback any more.
//
// One <audio> element is created and unlocked synchronously inside the user's click (narrator.unlock()) so
// iOS/Safari autoplay rules do not reject the later, asynchronously-fetched clips.

const diag = typeof window !== 'undefined' ? (window.__atharGuide = window.__atharGuide || { events: [], sources: [] }) : { events: [], sources: [] };
diag.sources = diag.sources || [];
const log = (type, detail) => {
  diag.events.push({ t: Date.now(), type, detail: String(detail ?? '') });
  if (diag.events.length > 300) diag.events.shift();
};

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export async function sha256Hex(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  if (!globalThis.crypto?.subtle) return null; // non-secure context: integrity cannot be verified (reported as such)
  return toHex(await crypto.subtle.digest('SHA-256', bytes));
}

// A 1-sample silent WAV used to unlock the audio element inside the click gesture.
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';

export class NarrationError extends Error {
  constructor(message, info = {}) {
    super(message);
    this.name = 'NarrationError';
    Object.assign(this, info);
  }
}

export function createNarrator() {
  let manifestPromise = null;
  const clipCache = new Map(); // moment id -> Promise<clip>
  let current = null; // { pause, resume, stop }
  let paused = false;
  const listeners = new Set();
  const emit = (ev) => listeners.forEach((l) => l(ev));
  let audio = null;

  function element() {
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audio.setAttribute('data-testid', 'guide-audio');
      diag.audio = audio;
    }
    return audio;
  }

  /** Call synchronously from the user's click so the element is allowed to play later (iOS/Safari). */
  function unlock() {
    try {
      const a = element();
      if (a.dataset.unlocked === '1') return;
      a.src = SILENT_WAV;
      const p = a.play();
      a.dataset.unlocked = '1'; // activation happens at the play() call inside the gesture, even if a real clip interrupts this silent one
      if (p?.then) p.then(() => log('audio-unlocked', 'ok')).catch((e) => log('audio-unlock', `${e?.name}: ${e?.message}`));
    } catch (e) {
      log('audio-unlock-error', e?.message);
    }
  }

  async function manifest() {
    if (!manifestPromise) {
      manifestPromise = fetch(`/guide-audio/manifest.json?t=${Date.now()}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .catch((e) => {
          log('manifest-error', e?.message);
          return null;
        });
    }
    return manifestPromise;
  }

  /** Resolve a moment to a verified, playable clip. Throws NarrationError when nothing trustworthy is available. */
  async function resolveClip(step) {
    const m = await manifest();
    const entry = m?.clips?.[step.id];
    const textSha = await sha256Hex(step.text);
    if (entry) {
      if (textSha && entry.textSha256 && entry.textSha256 !== textSha) {
        log('prebaked-stale', `${step.id}: script text changed since the clip was baked`);
      } else {
        const url = `/guide-audio/${entry.file}`;
        const res = await fetch(url, { cache: 'force-cache' });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const type = res.headers.get('content-type') || '';
          const sha = await sha256Hex(buf);
          const verified = sha ? sha === entry.sha256 : null;
          if (verified !== false && buf.byteLength > 1000) {
            const blob = new Blob([buf], { type: type || 'audio/mpeg' });
            return {
              source: 'prebaked',
              provider: m.provider || 'elevenlabs',
              model: entry.model || m.model,
              voice: entry.voice || m.voice,
              voiceId: entry.voiceId || m.voiceId,
              file: entry.file,
              url,
              sha256: sha,
              expectedSha256: entry.sha256,
              verified,
              status: res.status,
              contentType: type,
              bytes: buf.byteLength,
              label: `ElevenLabs · ${entry.voice || m.voice} · ${entry.model || m.model}`,
              objectUrl: URL.createObjectURL(blob),
            };
          }
          log('prebaked-integrity-failed', `${step.id}: got ${sha} expected ${entry.sha256}`);
        } else {
          log('prebaked-http', `${step.id}: ${res.status}`);
        }
      }
    } else {
      log('prebaked-missing', step.id);
    }
    // Live synthesis through the server proxy (ElevenLabs; On Demand only if ElevenLabs hard-fails).
    const r = await fetch('/api/guide/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: step.text, id: step.id }) });
    if (!r.ok) {
      let msg = `HTTP ${r.status}`;
      try {
        const j = await r.json();
        msg = j?.message || j?.error?.message || j?.error || msg;
      } catch {
        /* keep msg */
      }
      throw new NarrationError(`Narration unavailable — ${msg}`, { step: step.id, stage: 'live-tts', status: r.status });
    }
    const j = await r.json();
    if (!j?.url) throw new NarrationError('Narration unavailable — proxy returned no audio', { step: step.id, stage: 'live-tts' });
    return { source: j.source === 'prebaked' ? 'prebaked-proxy' : 'live', provider: j.provider, model: j.model, voice: j.voice, file: j.url.split('/').pop(), url: j.url, verified: null, label: j.label || `${j.provider} · ${j.voice}`, objectUrl: null };
  }

  function getClip(step) {
    if (!clipCache.has(step.id)) {
      clipCache.set(
        step.id,
        resolveClip(step).catch((e) => {
          clipCache.delete(step.id); // allow a retry
          throw e;
        }),
      );
    }
    return clipCache.get(step.id);
  }

  function play(clip, step) {
    return new Promise((resolve, reject) => {
      const a = element();
      let settled = false;
      let started = false;
      const cleanup = () => {
        a.onended = a.onerror = a.onplaying = null;
      };
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(ok);
      };
      a.onended = () => finish(true);
      a.onerror = () => {
        if (settled) return;
        settled = true;
        cleanup();
        const code = a.error?.code;
        log('audio-error', `${step.id}: MediaError ${code}`);
        reject(new NarrationError(`Audio element error (code ${code}) while playing ${clip.file}`, { step: step.id, stage: 'play', clip: clip.file }));
      };
      a.onplaying = () => {
        if (started) return; // resume after pause — not a new source
        started = true;
        const entry = { t: Date.now(), moment: step.id, slide: step.slide, source: clip.source, provider: clip.provider, model: clip.model, voice: clip.voice, file: clip.file, url: clip.url, sha256: clip.sha256, expectedSha256: clip.expectedSha256, verified: clip.verified, httpStatus: clip.status, contentType: clip.contentType, bytes: clip.bytes, duration: a.duration };
        diag.sources.push(entry);
        log('play', `${step.id} ← ${clip.source} ${clip.file}${clip.verified ? ' (sha256 ✓)' : clip.verified === false ? ' (sha256 ✗)' : ''}`);
        console.info(`[guide-audio] ${step.id} → ${clip.provider} / ${clip.model} / ${clip.voice} · ${clip.source} · ${clip.url} · sha256 ${clip.sha256 || 'n/a'}${clip.verified ? ' (verified)' : clip.verified === false ? ' (MISMATCH)' : ''}`);
        emit({ type: 'start', source: clip.source === 'live' ? 'live' : 'elevenlabs', label: clip.label, clip });
      };
      current = {
        pause: () => a.pause(),
        resume: () => a.play().catch((e) => log('resume-rejected', e?.message)),
        stop: () => {
          a.pause();
          finish(false);
        },
      };
      a.src = clip.objectUrl || clip.url;
      const p = a.play();
      if (p?.then) {
        p.catch((e) => {
          if (settled) return;
          settled = true;
          cleanup();
          log('audio-play-rejected', `${step.id}: ${e?.name}: ${e?.message}`);
          reject(new NarrationError(`Playback was blocked by the browser (${e?.name}). Tap play to enable audio.`, { step: step.id, stage: 'play', blocked: true }));
        });
      }
      if (paused) a.pause();
    });
  }

  /** Narrate a step. Resolves true when complete, false when stopped/skipped. Rejects with NarrationError. */
  async function speak(step) {
    stop();
    const token = {};
    speak.token = token;
    const clip = await getClip(step);
    if (speak.token !== token) return false;
    return play(clip, step);
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
  function prefetch(step) {
    if (step) getClip(step).catch(() => {});
  }
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  return { speak, stop, pause, resume, prefetch, unlock, subscribe, manifest };
}
