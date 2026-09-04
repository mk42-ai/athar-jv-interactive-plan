// Microphone capture, WAV conversion, level metering and gapless playback.

export function classifyMicError(err) {
  const name = err?.name || '';
  if (!window.isSecureContext) return { code: 'insecure', message: 'Microphone access needs a secure (HTTPS) page.' };
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError')
    return { code: 'denied', message: 'Microphone access was blocked. Allow the microphone for this site in your browser settings (the lock icon in the address bar), then reload.' };
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return { code: 'no-device', message: 'No microphone was found on this device.' };
  if (name === 'NotReadableError' || name === 'TrackStartError') return { code: 'busy', message: 'The microphone is in use by another application.' };
  return { code: 'unknown', message: err?.message || 'Could not start the microphone.' };
}

export function micSupported() {
  return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

export async function getMicStream() {
  if (!micSupported()) {
    const e = new Error('MediaRecorder / getUserMedia is not supported in this browser.');
    e.name = 'NotSupportedError';
    throw e;
  }
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    video: false,
  });
}

let sharedCtx = null;
export function getAudioContext() {
  if (!sharedCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    sharedCtx = new Ctx();
  }
  if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

export function pickMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const c of candidates) if (window.MediaRecorder?.isTypeSupported?.(c)) return c;
  return '';
}

export class Recorder {
  constructor(stream) {
    this.stream = stream;
    this.chunks = [];
    const mimeType = pickMimeType();
    this.rec = mimeType ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 48000 }) : new MediaRecorder(stream);
    this.rec.ondataavailable = (e) => {
      if (e.data && e.data.size) this.chunks.push(e.data);
    };
    this.startedAt = 0;
  }
  start() {
    this.chunks = [];
    this.startedAt = performance.now();
    this.rec.start(250);
  }
  get durationMs() {
    return this.startedAt ? performance.now() - this.startedAt : 0;
  }
  stop() {
    return new Promise((resolve) => {
      if (this.rec.state === 'inactive') return resolve(new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' }));
      this.rec.onstop = () => resolve(new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' }));
      try {
        this.rec.stop();
      } catch {
        resolve(new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' }));
      }
    });
  }
}

// Decode whatever MediaRecorder produced and re-encode as 16 kHz mono 16-bit PCM WAV —
// the most portable input for speech-to-text. Falls back to the raw blob if decoding fails.
export async function toWav16k(blob) {
  try {
    const ctx = getAudioContext();
    const decoded = await ctx.decodeAudioData((await blob.arrayBuffer()).slice(0));
    const ch = decoded.numberOfChannels;
    const len = decoded.length;
    const mono = new Float32Array(len);
    for (let c = 0; c < ch; c++) {
      const d = decoded.getChannelData(c);
      for (let i = 0; i < len; i++) mono[i] += d[i] / ch;
    }
    const target = 16000;
    const ratio = decoded.sampleRate / target;
    const outLen = Math.max(1, Math.floor(len / ratio));
    const out = new Float32Array(outLen);
    let sumSq = 0;
    let peak = 0;
    for (let i = 0; i < outLen; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.min(len, Math.floor((i + 1) * ratio));
      let s = 0;
      let n = 0;
      for (let j = start; j < end; j++) {
        s += mono[j];
        n++;
      }
      const v = n ? s / n : 0;
      out[i] = v;
      sumSq += v * v;
      if (Math.abs(v) > peak) peak = Math.abs(v);
    }
    const rms = Math.sqrt(sumSq / outLen);
    const buffer = new ArrayBuffer(44 + outLen * 2);
    const view = new DataView(buffer);
    const writeStr = (o, s) => {
      for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + outLen * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, target, true);
    view.setUint32(28, target * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, outLen * 2, true);
    let off = 44;
    for (let i = 0; i < outLen; i++, off += 2) {
      const s = Math.max(-1, Math.min(1, out[i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return { blob: new Blob([buffer], { type: 'audio/wav' }), durationSec: outLen / target, rms, peak, converted: true };
  } catch (e) {
    return { blob, durationSec: null, rms: null, peak: null, converted: false, error: e?.message };
  }
}

// Level meter over any AudioNode source (mic stream or playback element).
export class LevelMeter {
  constructor(ctx, sourceNode) {
    this.ctx = ctx;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.6;
    sourceNode.connect(this.analyser);
    this.time = new Uint8Array(this.analyser.fftSize);
    this.freq = new Uint8Array(this.analyser.frequencyBinCount);
  }
  level() {
    this.analyser.getByteTimeDomainData(this.time);
    let sum = 0;
    for (let i = 0; i < this.time.length; i++) {
      const v = (this.time[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / this.time.length); // 0..1 RMS
  }
  spectrum() {
    this.analyser.getByteFrequencyData(this.freq);
    return this.freq;
  }
}

// Single <audio> element + analyser; plays queued same-origin clips back-to-back.
export class Player {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';
    this.queue = [];
    this.playing = false;
    this.meter = null;
    this.onStart = null;
    this.onEnd = null; // called when the queue drains
    this.onError = null;
    this.audio.addEventListener('ended', () => this._next());
    this.audio.addEventListener('error', () => {
      this.onError?.(new Error('Audio playback failed'));
      this._next();
    });
  }
  attach(ctx) {
    if (this.meter || !ctx) return;
    try {
      const src = ctx.createMediaElementSource(this.audio);
      this.meter = new LevelMeter(ctx, src);
      this.meter.analyser.connect(ctx.destination);
    } catch {
      this.meter = null;
    }
  }
  enqueue(url) {
    this.queue.push(url);
    if (!this.playing) this._next();
  }
  _next() {
    const url = this.queue.shift();
    if (!url) {
      if (this.playing) {
        this.playing = false;
        this.onEnd?.();
      }
      return;
    }
    const wasPlaying = this.playing;
    this.playing = true;
    this.audio.src = url;
    const p = this.audio.play();
    if (p?.catch) {
      p.then(() => {
        if (!wasPlaying) this.onStart?.();
      }).catch((e) => {
        this.playing = false;
        this.pendingUrl = url;
        this.onError?.(Object.assign(new Error(e?.name === 'NotAllowedError' ? 'Autoplay was blocked — tap "Play response".' : e?.message || 'Playback failed'), { name: e?.name, url }));
      });
    } else if (!wasPlaying) this.onStart?.();
  }
  // Retry after an autoplay block.
  resume() {
    if (this.pendingUrl) {
      const url = this.pendingUrl;
      this.pendingUrl = null;
      this.queue.unshift(url);
    }
    if (!this.playing) this._next();
  }
  interrupt() {
    this.queue = [];
    this.pendingUrl = null;
    const was = this.playing;
    this.playing = false;
    try {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    } catch {}
    return was;
  }
  get isPlaying() {
    return this.playing;
  }
}
