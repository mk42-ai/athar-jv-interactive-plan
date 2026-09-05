import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './documents.css';
// Opening the document workspace never depends on a password or optional .env file.
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
