// Isolated fault injection on real authorized application assets. No fake successful audio.
// The final recovery must use the original HTMLMediaElement.play and an advancing media clock.
(() => {
  const RUN = __RUN_CONFIG__;
  const E = window.__atharEvidence = { version: 1, mode: 'authorized', classification: 'isolated-failure-on-real-app; recovery uses native media', startUTC: new Date().toISOString(), checks: [], actions: [] };
  const q = s => document.querySelector(s), sleep = ms => new Promise(r => setTimeout(r, ms));
  const record = (id, ok, detail = {}) => E.checks.push({ id, ok: !!ok, detail, utc: new Date().toISOString() });
  const wait = async test => { const until = Date.now() + 15000; while (Date.now() < until) { if (test()) return true; await sleep(100); } return false; };
  const audio = () => window.__atharGuide?.audio;
  const status = () => q('[data-testid="guide-bar"]')?.dataset.status;
  (async () => {
    const play = HTMLMediaElement.prototype.play, fetchOriginal = window.fetch;
    const speech = window.speechSynthesis?.speak; let fallbacks = 0, failures = 0;
    try {
      record('exact-viewport', innerWidth === RUN.viewport.width && innerHeight === RUN.viewport.height);
      if (window.speechSynthesis) window.speechSynthesis.speak = () => { fallbacks++; };
      if (RUN.fault === 'autoplay') HTMLMediaElement.prototype.play = function () { failures++; return Promise.reject(new DOMException('Intentional playback-denied test', 'NotAllowedError')); };
      else window.fetch = function (url, ...args) {
        const path = new URL(typeof url === 'string' ? url : url.url, location.origin).pathname;
        if (path.startsWith('/guide-audio/') || path.startsWith('/api/guide-audio/')) { failures++; return Promise.reject(new TypeError('Intentional narration transport test')); }
        return fetchOriginal.call(this, url, ...args);
      };
      q('[data-testid="guide-toggle"]').click();
      record('failure-shown-not-silenced', await wait(() => status() === 'error') && failures > 0 && !!q('[data-testid="guide-retry"]'));
      const step = q('[data-testid="guide-bar"]').dataset.step, time = audio()?.currentTime || 0;
      await sleep(900);
      record('failed-audio-does-not-advance', status() === 'error' && q('[data-testid="guide-bar"]').dataset.step === step && (!audio() || audio().paused && Math.abs(audio().currentTime - time) < .1));
      HTMLMediaElement.prototype.play = play; window.fetch = fetchOriginal;
      q('[data-testid="guide-retry"]').click();
      const recovered = await wait(() => status() === 'speaking' && audio() && !audio().paused && audio().currentTime > 0);
      const start = audio()?.currentTime || 0; await sleep(600);
      record('retry-native-audio-clock-advances', recovered && audio().currentTime > start + .2 && audio().playbackRate === 1);
      record('no-web-speech-substitution', fallbacks === 0);
      const source = q('[data-testid="guide-source"]');
      record('retry-verified-original-source', source?.dataset.verified === 'true' && source?.dataset.source === 'elevenlabs');
      q('[data-testid="guide-playpause"]').click();
    } catch (_) { record('fault-test-execution', false); }
    finally {
      HTMLMediaElement.prototype.play = play; window.fetch = fetchOriginal;
      if (window.speechSynthesis) window.speechSynthesis.speak = speech;
      record('proof-clean-session', !q('.msg') && !q('[data-testid="citation-panel"]'));
      E.endUTC = new Date().toISOString(); E.ok = E.checks.every(c => c.ok);
      window.__atharEvidenceB64 = btoa(unescape(encodeURIComponent(JSON.stringify(E))));
      window.__atharTransport = (i, n) => JSON.stringify({ chunk: window.__atharEvidenceB64.slice(i*n, (i+1)*n), more: (i+1)*n < window.__atharEvidenceB64.length });
    }
  })();
  window.__atharPoll = async () => { if (!window.__atharEvidenceB64) await sleep(100); return true; };
  return true;
})()
