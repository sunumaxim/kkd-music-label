import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

import { LOGO_MAIN as KKD_LOGO } from '@/lib/logos';

export default function VideoWithAudio({ clips, audioUrl, excerptStart = 0, excerptDuration = 30 }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);
  const clipIndexRef = useRef(0);
  const clipsArr = Array.isArray(clips) && clips.length > 0 ? clips : [];

  const stop = () => {
    const v = videoRef.current, a = audioRef.current;
    if (v) v.pause();
    if (a) a.pause();
    setPlaying(false);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const playClip = (index) => {
    const v = videoRef.current;
    if (!v || !clipsArr[index]) return;
    v.src = clipsArr[index];
    v.muted = true;
    v.play().catch(() => {});
  };

  const toggle = () => {
    if (playing) { stop(); return; }
    if (!clipsArr.length) return;
    clipIndexRef.current = 0;
    playClip(0);
    const a = audioRef.current;
    if (a && audioUrl) {
      a.currentTime = excerptStart || 0;
      a.play().catch(() => {});
    }
    setPlaying(true);
    timerRef.current = setTimeout(stop, (excerptDuration || 30) * 1000);
  };

  const onClipEnded = () => {
    clipIndexRef.current = (clipIndexRef.current + 1) % clipsArr.length;
    playClip(clipIndexRef.current);
  };

  useEffect(() => () => stop(), []);

  if (!clipsArr.length) return null;

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black">
        <video ref={videoRef} muted playsInline onEnded={onClipEnded} className="w-full" />
        {/* Filigrane logo KKD */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm rounded-md px-2 py-1 pointer-events-none">
          <img src={KKD_LOGO} alt="" className="w-4 h-4 rounded-sm object-cover" />
          <span className="text-[10px] font-heading font-bold tracking-wide text-white">KKD Music</span>
        </div>
        {/* Bouton lecture / pause synchronisé */}
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
          aria-label={playing ? 'Pause' : 'Lecture'}
        >
          {playing
            ? <Pause size={42} className="text-white drop-shadow-lg" />
            : <Play size={42} className="text-white drop-shadow-lg" />}
        </button>
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />}
    </div>
  );
}