import React, { useEffect, useState } from 'react';
import { LOGO_MAIN } from '@/lib/logos';

const SPLASH_KEY = 'kkd_splash_seen';

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
      className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer"
      onClick={dismiss}
      style={{ background: '#fff', transition: 'opacity 0.2s ease' }}
    >
      <img
        src={LOGO_MAIN}
        alt="KKD Music"
        style={{ height: 56, width: 'auto' }}
      />
    </div>
  );
}