import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { ThemeService } from './services/theme';

// Apply active theme to DOM immediately on boot
ThemeService.applyToDOM();

// Register service worker immediately for offline & PWA capability
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
