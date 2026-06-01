import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Sync .dark class with system color-scheme preference
const syncDark = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', prefersDark);
};
syncDark();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncDark);

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)