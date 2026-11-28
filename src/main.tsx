import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { ThemeService } from './services/theme';
import { appUpdateService } from './services/appUpdateService';

// Apply active theme to DOM immediately on boot
ThemeService.applyToDOM();

// Register service worker safely with instant update detection
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        appUpdateService.markUpdateAvailable('sw');
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          appUpdateService.setRegistration(registration);
          if (registration.waiting) {
            appUpdateService.markUpdateAvailable('sw');
          }
          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                appUpdateService.markUpdateAvailable('sw');
              }
            });
          });
        }
      },
      onRegisterError(error) {
        console.warn('PWA service worker registration note:', error?.message || error);
      },
    });
    appUpdateService.setUpdateSW(updateSW);
  } catch {
    // Non-blocking in sandboxed environments
  }
}

// Start frequent version.json & SW update polling immediately
appUpdateService.startAutoPolling();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
