import React, { useEffect, useId, useRef, useState } from 'react';

/** Review access is a passphrase POST that sets a server-owned HttpOnly session. */
export default function AccessGate({ access, onUnlock, onRetry, context = 'chat', active = true }) {
  const id = useId();
  const inputRef = useRef(null);
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (!active) { setPassphrase(''); setError(''); } }, [active]);
  useEffect(() => {
    if (!active || access?.loading || access?.error) return;
    inputRef.current?.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 1100px)').matches) inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [active, access?.loading, access?.error, access?.configured]);
  const submit = async (event) => {
    event.preventDefault();
    if (!active || busy || !passphrase.trim()) return;
    setBusy(true);
    setError('');
    try { await onUnlock(passphrase); }
    catch { setError('Access could not be unlocked. Check your review access code and try again.'); }
    finally { setPassphrase(''); setBusy(false); }
  };
  if (access?.loading) return <div className="access-gate" role="status">Checking review access…</div>;
  if (access?.error) return <div className="access-gate" role="alert"><p>{access.error}</p><button className="btn" onClick={onRetry}>Retry access check</button></div>;
  if (access?.configured === false) return <div className="access-gate"><h3>Review access is not ready</h3><p>The app owner needs to configure review access on the server. The presentation and Guide Mode remain available.</p><button className="btn" onClick={onRetry}>Check again</button></div>;
  return (
    <form className="access-gate" onSubmit={submit} aria-labelledby={`${id}-title`} data-testid="access-gate" aria-busy={busy}>
      <h3 id={`${id}-title`}>Private review access</h3>
      <p>{context === 'voice' ? 'Sign in to speak with the plan companion.' : 'Sign in to ask questions across the original documents and inspect cited evidence.'} The presentation and its narrated guide stay available without signing in.</p>
      <label htmlFor={`${id}-passphrase`}>Review access code</label>
      <input ref={inputRef} id={`${id}-passphrase`} name="passphrase" type="password" autoComplete="current-password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} disabled={busy} required aria-describedby={`${id}-note${error ? ` ${id}-error` : ''}`} data-testid="review-access-code" />
      <p id={`${id}-note`}>Use the app review code shared by the owner, not a provider API key. It is not saved locally or put in the URL.</p>
      {error && <p className="access-error" role="alert" id={`${id}-error`}>{error}</p>}
      <button className="btn accent" type="submit" disabled={busy || !passphrase.trim()} data-testid="review-access-submit">{busy ? 'Unlocking…' : 'Unlock companion'}</button>
    </form>
  );
}
