import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_VIDEO = "https://media.base44.com/videos/public/6a1cbc29f199c6e829efde07/488529452_video1.mp4";
const SPLASH_KEY = 'kkd_splash_seen';

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(() => {
    // Show only once per session
    try { return !sessionStorage.getItem(SPLASH_KEY); } catch { return true; }
  });
  const videoRef = useRef(null);

  useEffect(() => {
    if (!visible) { onDone?.(); return; }
    // Auto-dismiss after 4s max
    const timer = setTimeout(() => dismiss(), 4000);
    return () => clearTimeout(timer);
  }, [visible]);

  const dismiss = () => {
    try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch {}
    setVisible(false);
    setTimeout(() => onDone?.(), 600);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-pointer"
          onClick={dismiss}
        >
          <video
            ref={videoRef}
            src={SPLASH_VIDEO}
            autoPlay
            muted
            playsInline
            onEnded={dismiss}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

          {/* Centered logo */}
          <div className="relative z-10 text-center flex flex-col items-center">
            <motion.img
              src="https://media.base44.com/images/public/695179b6b73caf48a00876c1/d0c46d8b9_generated_acb63943.png"
              alt="KKDmusic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              style={{ height: 72, width: 'auto' }}
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-white/55 text-xs uppercase tracking-widest mt-4"
            >
              La scène ouest-africaine, en direct de chez vous.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="text-white/40 text-[10px] uppercase tracking-widest mt-2"
            >
              Touchez pour continuer
            </motion.p>
          </div>

          {/* Skip button */}
          <button
            onClick={dismiss}
            className="absolute bottom-10 right-6 text-white/40 hover:text-white/80 text-xs font-mono uppercase tracking-widest transition-colors"
          >
            Passer →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}