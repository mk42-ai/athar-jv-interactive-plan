import React from 'react';
import { createRoot } from 'react-dom/client';
import { initializePresentation } from './lib/presentationState.js';
import './styles.css';

const root = createRoot(document.getElementById('root'));
function status(message, { access = false, retry = false } = {}) {
  root.render(<main role="main" aria-label="Private review"><p role="status">{message}</p>
    {access && <a href="/">Sign in to private review</a>}
    {retry && <button type="button" onClick={() => window.location.reload()}>Retry</button>}
  </main>);
}
async function bootstrap() {
  status('Loading private review…');
  try {
    const response = await fetch('/api/presentation', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) return status('Reviewer access is required to open this presentation.', { access: true });
    if (!response.ok) return status('The private presentation is unavailable. Please retry.', { retry: true });
    initializePresentation(await response.json());
    // App and its business-data consumers MUST NOT evaluate before the authorized state exists.
    const { default: App } = await import('./App.jsx');
    root.render(<React.StrictMode><App /></React.StrictMode>);
  } catch {
    status('The private presentation could not be loaded. Please retry.', { retry: true });
  }
}
bootstrap();
