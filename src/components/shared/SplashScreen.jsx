import React, { useEffect, useState } from 'react';

const SPLASH_KEY = 'kkd_splash_seen';
const LOGO_URL = 'https://media.base44.com/images/public/695179b6b73caf48a00876c1/d0c46d8b9_generated_acb63943.png';

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(() => {
    try { return !sessionStorage.getItem(SPLASH_KEY); } catch { return true; }
  });

  useEffect(() => {
    if (!visible) { onDone?.(); return; }
    const timer = setTimeout(() => dismiss(), 500);
    return () => clearTimeout(timer);
  }, [visible]);

  const dismiss = () => {
    try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch {}
    setVisible(false);
    onDone?.();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-background flex items-center justify-center cursor-pointer"
      onClick={dismiss}
      style={{ transition: 'opacity 0.2s ease' }}
    >
      <img
        src={LOGO_URL}
        alt="KKD Music"
        style={{ height: 48, width: 'auto' }}
      />
    </div>
  );
}