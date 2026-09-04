import React, { useEffect, useRef, useState } from 'react';
import VoiceIndicator from './VoiceIndicator.jsx';
import Transcript from './Transcript.jsx';
import { voiceTurn, voiceTextTurn } from '../../lib/api.js';
import { Recorder, LevelMeter, Player, classifyMicError, getAudioContext, getMicStream, micSupported, toWav16k } from '../../lib/audio.js';

const STATE_COPY = {
  idle: { title: 'Ready', sub: 'Press the microphone and ask about the plan' },
  requesting: { title: 'Requesting microphone', sub: 'Allow access when your browser asks' },
  listening: { title: 'Listening', sub: 'Pause to send, or press again' },
  processing: { title: 'Transcribing', sub: 'On Demand speech-to-text' },
  thinking: { title: 'Thinking', sub: 'Workflow triggered · grounding the answer' },
  speaking: { title: 'Speaking', sub: 'Talk or press to interrupt' },
  error: { title: 'Something went wrong', sub: 'Press the microphone to try again' },
  denied: { title: 'Microphone unavailable', sub: 'Type your question below instead' },
  unsupported: { title: 'Voice capture not supported here', sub: 'Type your question below instead' },
};

const STEPS = [
  { key: 'mic', label: 'Mic' },
  { key: 'stt', label: 'Speech → text' },
  { key: 'avm', label: 'AVM workflow' },
  { key: 'chat', label: 'Grounded answer' },
  { key: 'tts', label: 'Text → speech' },
  { key: 'play', label: 'Playback' },
];

let idc = 0;
const uid = () => `${Date.now().toString(36)}-${idc++}`;
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function VoiceWidget({ open, onClose, ensureSession, session, configured, health, initialQuestion = null }) {
  const [state, setState] = useState(() => (micSupported() && window.isSecureContext ? 'idle' : 'unsupported'));
  const [turns, setTurns] = useState([]);
  const [handsFree, setHandsFree] = useState(true);
  const [bargeIn, setBargeIn] = useState(true);
  const [steps, setSteps] = useState({});
  const [micError, setMicError] = useState(null);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  // Refs shared with long-lived loops/callbacks (always read the latest values).
  const stateRef = useRef(state);
  stateRef.current = state;
  const micStreamRef = useRef(null);
  const micMeterRef = useRef(null);
  const meterRef = useRef(null); // what the orb visualises right now
  const recorderRef = useRef(null);
  const playerRef = useRef(null);
  const abortRef = useRef(null);
  const vadRef = useRef({});
  const streamDoneRef = useRef(true);
  const currentTurnRef = useRef(null);
  const lastBlobRef = useRef(null);
  const handsFreeRef = useRef(handsFree);
  handsFreeRef.current = handsFree;
  const bargeRef = useRef(bargeIn);
  bargeRef.current = bargeIn;
  const actionsRef = useRef({});

  const go = (s) => {
    stateRef.current = s;
    setState(s);
  };
  const addTurn = (t) => {
    const turn = { id: uid(), time: now(), ...t };
    setTurns((prev) => [...prev, turn]);
    return turn.id;
  };
  const patchTurn = (id, fn) => setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...fn(t) } : t)));
  const step = (k, v) => setSteps((prev) => ({ ...prev, [k]: v }));
  const resetSteps = () => setSteps({ mic: { state: 'done' } });

  if (!playerRef.current) playerRef.current = new Player();

  // ---- microphone -------------------------------------------------------------
  async function ensureMic() {
    const live = micStreamRef.current?.getTracks?.().some((t) => t.readyState === 'live');
    if (live) return micStreamRef.current;
    const stream = await getMicStream();
    micStreamRef.current = stream;
    const ctx = getAudioContext();
    const src = ctx.createMediaStreamSource(stream);
    micMeterRef.current = new LevelMeter(ctx, src);
    playerRef.current.attach(ctx);
    stream.getTracks().forEach((t) => (t.onended = () => (micStreamRef.current = null)));
    setMicError(null);
    return stream;
  }

  function releaseMic() {
    micStreamRef.current?.getTracks?.().forEach((t) => t.stop());
    micStreamRef.current = null;
    micMeterRef.current = null;
  }

  async function startListening(auto = false) {
    if (configured === false) return;
    try {
      go('requesting');
      step('mic', { state: 'active' });
      const stream = await ensureMic();
      const rec = new Recorder(stream);
      recorderRef.current = rec;
      rec.start();
      vadRef.current = { startedAt: performance.now(), speech: false, lastVoice: 0, floor: null, samples: [], auto };
      meterRef.current = micMeterRef.current;
      setPlaybackBlocked(false);
      step('mic', { state: 'done' });
      go('listening');
    } catch (e) {
      const info = classifyMicError(e);
      setMicError(info);
      step('mic', { state: 'error' });
      addTurn({ role: 'error', text: info.message });
      go('denied');
    }
  }

  async function stopListening() {
    const rec = recorderRef.current;
    if (!rec) return;
    recorderRef.current = null;
    go('processing');
    const raw = await rec.stop();
    meterRef.current = null;
    await processAudio(raw);
  }

  function cancelListening() {
    const rec = recorderRef.current;
    recorderRef.current = null;
    rec?.stop().catch?.(() => {});
    meterRef.current = null;
    go('idle');
  }

  function afterSpeaking() {
    if (!streamDoneRef.current) return; // more clips may still arrive
    if (handsFreeRef.current && micStreamRef.current) startListening(true);
    else go('idle');
  }

  function interrupt() {
    const p = playerRef.current;
    const wasPlaying = p.interrupt();
    abortRef.current?.abort();
    streamDoneRef.current = true;
    if (currentTurnRef.current) patchTurn(currentTurnRef.current, (t) => ({ status: 'done', interrupted: true }));
    if (wasPlaying) addTurn({ role: 'system', text: 'Interrupted — listening again.' });
  }

  // ---- turn pipeline ------------------------------------------------------------
  function handleEvent(ev, ctx) {
    switch (ev.type) {
      case 'stage':
        if (ev.stage === 'transcribing') {
          step('stt', { state: 'active' });
          go('processing');
        } else if (ev.stage === 'thinking') {
          step('chat', { state: 'active' });
          step('avm', { state: 'active' });
          go('thinking');
        }
        break;
      case 'transcript':
        step('stt', { state: ctx.kind === 'text' ? 'skipped' : 'done', ms: ev.ms });
        if (!ctx.userTurnId) ctx.userTurnId = addTurn({ role: 'user', text: ev.text });
        else patchTurn(ctx.userTurnId, () => ({ text: ev.text }));
        break;
      case 'delta':
        if (!ctx.botId) {
          ctx.botId = addTurn({ role: 'assistant', text: '', status: 'streaming', audio: [] });
          currentTurnRef.current = ctx.botId;
        }
        patchTurn(ctx.botId, (t) => ({ text: t.text + ev.text }));
        break;
      case 'answer':
        step('chat', { state: 'done', ms: ev.ms });
        if (!ctx.botId) {
          ctx.botId = addTurn({ role: 'assistant', text: ev.text, status: 'done', audio: [] });
          currentTurnRef.current = ctx.botId;
        } else patchTurn(ctx.botId, () => ({ text: ev.text, status: 'done' }));
        break;
      case 'avm':
        step('avm', { state: ev.executionId ? 'done' : 'error', ms: ev.ms });
        ctx.avmTurnId = addTurn({
          role: 'system',
          text: `Advanced Voice Mode workflow ${ev.workflowId} executed · execution`,
          meta: { executionId: ev.executionId, status: 'executing' },
        });
        break;
      case 'avm-status':
        if (ctx.avmTurnId) patchTurn(ctx.avmTurnId, (t) => ({ meta: { ...t.meta, status: ev.status } }));
        break;
      case 'avm-error':
        step('avm', { state: 'error' });
        addTurn({ role: 'system', text: `Advanced Voice Mode workflow could not be triggered (${ev.status}): ${ev.message}` });
        break;
      case 'audio':
        step('tts', { state: 'done', ms: ev.ms });
        if (ctx.botId) patchTurn(ctx.botId, (t) => ({ audio: [...(t.audio || []), ev.url] }));
        ctx.audioCount = (ctx.audioCount || 0) + 1;
        playerRef.current.enqueue(ev.url);
        break;
      case 'tts-error':
        step('tts', { state: 'error' });
        addTurn({ role: 'system', text: `Text-to-speech failed for one sentence (${ev.message}); the text is shown above.` });
        break;
      case 'warning':
        addTurn({ role: 'system', text: `Warning: ${ev.message}` });
        break;
      case 'error': {
        const stage = ev.stage || 'turn';
        step(stage === 'stt' ? 'stt' : 'chat', { state: 'error' });
        const retryable = !(stage === 'stt' && ev.code === 'empty_transcript') && ev.code !== 'not_configured';
        addTurn({ role: 'error', text: ev.message || 'Request failed', retry: retryable ? ctx.kind : null, code: ev.code });
        if (ctx.botId) patchTurn(ctx.botId, (t) => ({ status: t.text ? 'done' : 'error' }));
        ctx.failed = true;
        break;
      }
      default:
        break;
    }
  }

  async function runTurn(kind, fn) {
    const ac = new AbortController();
    abortRef.current = ac;
    streamDoneRef.current = false;
    setBusy(true);
    const ctx = { kind, audioCount: 0 };
    try {
      const s = await ensureSession();
      await fn({ sessionId: s.sessionId, externalUserId: s.externalUserId, signal: ac.signal, onEvent: (ev) => handleEvent(ev, ctx) });
    } catch (e) {
      if (e.name !== 'AbortError') {
        addTurn({ role: 'error', text: e.message || 'Network error', retry: kind });
        ctx.failed = true;
      }
    } finally {
      streamDoneRef.current = true;
      setBusy(false);
      if (abortRef.current === ac) abortRef.current = null;
      if (ctx.botId) patchTurn(ctx.botId, (t) => ({ status: t.status === 'streaming' ? 'done' : t.status }));
      const p = playerRef.current;
      if (ac.signal.aborted) {
        // cancelled by the user (interrupt / cancel) — state already handled
      } else if (ctx.failed) {
        if (stateRef.current !== 'speaking') {
          go('error');
          setTimeout(() => stateRef.current === 'error' && go('idle'), 2500);
        }
      } else if (!p.isPlaying && !p.pendingUrl) {
        if (!ctx.audioCount) go('idle');
        else afterSpeaking();
      }
    }
  }

  async function processAudio(rawBlob) {
    resetSteps();
    const wav = await toWav16k(rawBlob);
    lastBlobRef.current = wav.blob;
    if (wav.converted && (wav.durationSec < 0.35 || wav.rms < 0.0035)) {
      addTurn({
        role: 'system',
        text: wav.durationSec < 0.35 ? 'That was too short — hold on a moment longer.' : 'I could not hear any speech in that recording. Try again a little closer to the microphone.',
      });
      go('idle');
      return;
    }
    await runTurn('audio', (opts) => voiceTurn({ ...opts, blob: wav.blob }));
  }

  async function sendTyped(text) {
    const q = (text ?? typed).trim();
    if (!q || busy) return;
    setTyped('');
    resetSteps();
    step('stt', { state: 'skipped' });
    playerRef.current.attach(getAudioContext());
    await runTurn('text', (opts) => voiceTextTurn({ ...opts, text: q }));
  }

  function onOrb() {
    const s = stateRef.current;
    if (configured === false) return;
    if (s === 'idle' || s === 'error' || s === 'denied') startListening(false);
    else if (s === 'listening') stopListening();
    else if (s === 'processing' || s === 'thinking') {
      abortRef.current?.abort();
      go('idle');
    } else if (s === 'speaking') {
      interrupt();
      startListening(false);
    }
  }

  function retry(turn) {
    if (turn.retry === 'audio' && lastBlobRef.current) {
      resetSteps();
      runTurn('audio', (opts) => voiceTurn({ ...opts, blob: lastBlobRef.current }));
    } else if (turn.retry === 'text') {
      const lastUser = [...turns].reverse().find((t) => t.role === 'user');
      if (lastUser) sendTyped(lastUser.text);
    }
  }

  function replay(turn) {
    playerRef.current.attach(getAudioContext());
    playerRef.current.interrupt();
    streamDoneRef.current = true;
    for (const u of turn.audio) playerRef.current.enqueue(u);
  }

  actionsRef.current = { startListening, stopListening, cancelListening, interrupt, afterSpeaking };

  // Player callbacks always call the latest actions.
  useEffect(() => {
    const p = playerRef.current;
    p.onStart = () => {
      meterRef.current = p.meter;
      step('play', { state: 'active' });
      go('speaking');
    };
    p.onEnd = () => {
      step('play', { state: 'done' });
      if (stateRef.current === 'speaking') actionsRef.current.afterSpeaking();
    };
    p.onError = (e) => {
      if (e?.name === 'NotAllowedError' || /Autoplay/i.test(e?.message || '')) {
        setPlaybackBlocked(true);
        addTurn({ role: 'error', text: 'Autoplay was blocked by the browser. Tap "Play response" to hear the answer.' });
      } else {
        addTurn({ role: 'error', text: `Playback failed: ${e?.message || 'unknown error'}. The answer text is shown in the transcript.` });
      }
      step('play', { state: 'error' });
      // Whatever stage we were in, the turn is over from the user's point of view.
      if (['speaking', 'thinking', 'processing'].includes(stateRef.current)) go('idle');
    };
  });

  // ---- VAD (auto-stop on silence) + barge-in loop ----------------------------------
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const meter = micMeterRef.current;
      if (!meter) return;
      const lvl = meter.level();
      const st = stateRef.current;
      const v = vadRef.current;
      const t = performance.now();
      if (st === 'listening' && v.startedAt) {
        const elapsed = t - v.startedAt;
        if (elapsed < 350) {
          v.samples.push(lvl);
          return;
        }
        if (v.floor == null) {
          const s = [...v.samples].sort((a, b) => a - b);
          v.floor = s.length ? s[Math.floor(s.length * 0.5)] : 0.01;
          v.threshold = clamp(v.floor * 3 + 0.012, 0.025, 0.12);
        }
        if (lvl > v.threshold) {
          v.speech = true;
          v.lastVoice = t;
        }
        if (v.speech && t - v.lastVoice > 1100) actionsRef.current.stopListening();
        else if (!v.speech && v.auto && elapsed > 8000) actionsRef.current.cancelListening();
        else if (elapsed > 25000) actionsRef.current.stopListening();
      } else if (st === 'speaking' && bargeRef.current) {
        const thr = clamp((v.floor ?? 0.01) * 6 + 0.06, 0.09, 0.22);
        if (lvl > thr) {
          v.bargeSince = v.bargeSince || t;
          if (t - v.bargeSince > 220) {
            v.bargeSince = 0;
            actionsRef.current.interrupt();
            actionsRef.current.startListening(false);
          }
        } else v.bargeSince = 0;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Release everything when leaving the tab / unmounting.
  useEffect(() => {
    if (open) return;
    abortRef.current?.abort();
    playerRef.current?.interrupt();
    recorderRef.current?.stop().catch?.(() => {});
    recorderRef.current = null;
    releaseMic();
    if (stateRef.current !== 'unsupported') go('idle');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => releaseMic(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep link (#voice?q=…): speak the answer to a question on load, once the proxy reports it is configured.
  const initialDoneRef = useRef(false);
  useEffect(() => {
    if (!initialQuestion || initialDoneRef.current || !open || configured !== true) return;
    initialDoneRef.current = true;
    sendTyped(initialQuestion);
  }, [initialQuestion, open, configured]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = STATE_COPY[state] || STATE_COPY.idle;
  const disabled = configured === false || state === 'unsupported';
  const micLabel = state === 'listening' ? 'Send now' : state === 'speaking' ? 'Interrupt' : state === 'processing' || state === 'thinking' ? 'Cancel' : 'Speak';
  const MicIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {state === 'listening' ? <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" /> : state === 'processing' || state === 'thinking' ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3" />}
    </svg>
  );

  return (
    <section className={`widget voice-widget ${open ? 'open' : ''}`} id="voice-widget" role="dialog" aria-modal="false" aria-labelledby="voice-widget-title" aria-hidden={!open} data-testid="voice-widget">
      <header className="widget-head">
        <div>
          <h2 id="voice-widget-title">Advanced Voice Mode</h2>
          <p className="widget-sub">Workflow {health?.avmWorkflowId ? health.avmWorkflowId.slice(0, 8) + '…' : '—'}{session?.sessionId ? ` · session ${session.sessionId.slice(-6)}` : ''}</p>
        </div>
        <div className="widget-actions">
          <button className="icon-btn" onClick={() => setTurns([])} aria-label="Clear transcript" title="Clear transcript" disabled={!turns.length}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
          </button>
          <button className="icon-btn" onClick={onClose} aria-label="Close voice mode" data-testid="voice-close">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </header>

      <div className="voice-state" aria-live="polite" data-state={state}>
        <VoiceIndicator state={state} meterRef={meterRef} />
        <div className="voice-state-text">
          <b data-testid="voice-state-title">{copy.title}</b>
          <span>{copy.sub}</span>
        </div>
        <button type="button" className={`mic-btn ${state === 'listening' ? 'is-live' : ''}`} onClick={onOrb} disabled={disabled} aria-label={micLabel} title={micLabel} data-testid="mic-button">
          <MicIcon />
        </button>
      </div>

      <ol className="pipeline" aria-label="Voice pipeline">
        {STEPS.map((s) => {
          const st = steps[s.key]?.state || 'idle';
          return (
            <li key={s.key} className={`pipe ${st}`} title={steps[s.key]?.ms != null ? `${(steps[s.key].ms / 1000).toFixed(1)} s` : undefined}>
              <span className="pipe-dot" aria-hidden="true" /><span className="pipe-label">{s.label}</span>
            </li>
          );
        })}
      </ol>

      {(state === 'denied' || state === 'unsupported' || micError) && (
        <div className="fallback" role="status">
          <strong>{micError?.message || STATE_COPY[state].title}</strong>
          <p>{state === 'unsupported' ? 'This browser does not expose MediaRecorder/getUserMedia (or the page is not HTTPS).' : 'Once access is allowed, press the microphone again. You can type a question meanwhile — it still runs the workflow and speaks the answer.'}</p>
        </div>
      )}

      <Transcript turns={turns} onReplay={replay} onRetry={retry} />

      {playbackBlocked && (
        <button className="btn small accent play-btn" onClick={() => { setPlaybackBlocked(false); playerRef.current.attach(getAudioContext()); playerRef.current.resume(); }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg> Play response
        </button>
      )}

      <form className="voice-typed" onSubmit={(e) => { e.preventDefault(); sendTyped(); }}>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={configured === false ? 'Voice unavailable — server key missing' : 'Or type a question to hear the answer…'}
          disabled={configured === false || busy}
          aria-label="Type a question for voice mode"
        />
        <button type="submit" className="btn small" disabled={configured === false || busy || !typed.trim()}>Speak</button>
      </form>

      <div className="voice-toggles">
        <label className="switch"><input type="checkbox" checked={handsFree} onChange={(e) => setHandsFree(e.target.checked)} /><span>Hands-free</span></label>
        <label className="switch"><input type="checkbox" checked={bargeIn} onChange={(e) => setBargeIn(e.target.checked)} /><span>Voice interrupt</span></label>
      </div>
    </section>
  );
}
