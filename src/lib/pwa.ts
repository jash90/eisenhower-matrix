import { registerSW } from 'virtual:pwa-register';

// Add custom PWA update handling
export function initPWA() {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (confirm('New content available. Reload?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}