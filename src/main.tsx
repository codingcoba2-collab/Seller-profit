import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { ThemeService } from './services/theme';

// Apply active theme to DOM immediately on boot
ThemeService.applyToDOM();

// Register service worker safely for offline & PWA capability
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({
      immediate: true,
      onRegisterError(error) {
        console.warn('PWA service worker registration note:', error?.message || error);
      },
    });
  } catch {
    // Non-blocking in sandboxed environments
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
