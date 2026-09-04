import React, { useEffect, useRef } from 'react';

export default function Transcript({ turns, onReplay, onRetry }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  return (
    <div className="transcript" ref={ref} role="log" aria-live="polite" aria-label="Live transcript" data-testid="voice-transcript">
      {turns.length === 0 && (
        <p className="transcript-empty muted">Your words and the spoken replies appear here.</p>
      )}
      {turns.map((t) => (
        <div key={t.id} className={`turn ${t.role} ${t.status || ''}`}>
          {t.role === 'system' ? (
            <div className="turn-system">
              <span className="dot" aria-hidden="true" /> {t.text}
              {t.meta?.executionId && <code className="mono">{t.meta.executionId}</code>}
              {t.meta?.status && <span className={`pill tiny ${t.meta.status === 'success' ? 'ok' : t.meta.status === 'failed' ? 'bad' : ''}`}>{t.meta.status}</span>}
            </div>
          ) : t.role === 'error' ? (
            <div className="turn-error" role="alert">
              <span>{t.text}</span>
              {t.retry && onRetry && (
                <button className="btn small" onClick={() => onRetry(t)}>Retry</button>
              )}
            </div>
          ) : (
            <>
              <div className="turn-role">{t.role === 'user' ? 'You' : 'Assistant'}<span className="turn-time">{t.time}</span></div>
              <div className="turn-text">
                {t.text || (t.status === 'streaming' ? <span className="muted">…</span> : '')}
                {t.status === 'streaming' && <span className="caret" aria-hidden="true" />}
              </div>
              {t.role === 'assistant' && t.audio?.length > 0 && t.status === 'done' && (
                <button className="btn ghost tiny" onClick={() => onReplay?.(t)} aria-label="Replay spoken answer">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg> Replay
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
