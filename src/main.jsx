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

// Service worker PWA — installation sur l'écran d'accueil + lecture hors-connexion
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}