import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_KEY = 'kkd_splash_seen';
const LOGO_URL = 'https://media.base44.com/images/public/695179b6b73caf48a00876c1/d0c46d8b9_generated_acb63943.png';

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(() => {
    try { return !sessionStorage.getItem(SPLASH_KEY); } catch { return true; }
  });

  useEffect(() => {
    if (!visible) { onDone?.(); return; }
    const timer = setTimeout(() => dismiss(), 1400);
    return () => clearTimeout(timer);
  }, [visible]);

  const dismiss = () => {
    try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch {}
    setVisible(false);
    setTimeout(() => onDone?.(), 350);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9999] bg-background flex items-center justify-center cursor-pointer"
          onClick={dismiss}
        >
          <motion.img
            src={LOGO_URL}
            alt="KKD Music"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ height: 56, width: 'auto' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}