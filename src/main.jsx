import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// KKD Music — Thème Blanc Immaculé par défaut
document.documentElement.classList.remove('dark');
document.documentElement.setAttribute('data-theme', 'light');

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Service worker PWA — installation sur l'écran d'accueil + lecture hors-connexion.
// On vérifie systématiquement les nouvelles versions publiées et on recharge
// automatiquement l'appli (ou l'appli installée) dès qu'une mise à jour existe.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      const hadController = !!navigator.serviceWorker.controller;
      let reloading = false;

      // Une nouvelle version vient de prendre la main → on l'affiche immédiatement.
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || reloading) return;
        reloading = true;
        window.location.reload();
      });

      const checkForUpdate = () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      };
      registration.update().catch(() => {});
      document.addEventListener('visibilitychange', checkForUpdate);
      window.addEventListener('focus', checkForUpdate);
    } catch {
      /* pas de service worker disponible : l'appli fonctionne normalement */
    }
  });
}