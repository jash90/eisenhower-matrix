import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initPWA } from './lib/pwa';
import App from './App.tsx';
import './index.css';

// Initialize PWA
initPWA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
