import React from 'react';
import { createRoot } from 'react-dom/client';
import { initializePresentation } from './lib/presentationState.js';
import './styles.css';

const root = createRoot(document.getElementById('root'));
function status(message, { retry = false } = {}) {
  root.render(<main role="main" aria-label="Athar JV presentation"><p role="status">{message}</p>
    {retry && <button type="button" onClick={() => window.location.reload()}>Retry</button>}
  </main>);
}
async function bootstrap() {
  status('Loading the presentation…');
  try {
    // Public workspace: the presentation payload is served to every visitor — no sign-in step exists.
    const response = await fetch('/api/presentation', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) return status('The presentation is unavailable. Please retry.', { retry: true });
    initializePresentation(await response.json());
    // App and its business-data consumers MUST NOT evaluate before the presentation data exists.
    const { default: App } = await import('./App.jsx');
    root.render(<React.StrictMode><App /></React.StrictMode>);
  } catch {
    status('The presentation could not be loaded. Please retry.', { retry: true });
  }
}
bootstrap();
