import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download } from 'lucide-react';

const KKD_LOGO = 'https://media.base44.com/images/public/695179b6b73caf48a00876c1/d0c46d8b9_generated_acb63943.png';

export default function VideoWithAudio({ videoUrl, audioUrl, excerptStart = 0, excerptDuration = 6 }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const stop = () => {
    const v = videoRef.current, a = audioRef.current;
    if (v) v.pause();
    if (a) a.pause();
    setPlaying(false);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const toggle = () => {
    if (playing) { stop(); return; }
    const v = videoRef.current, a = audioRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = true;
    v.play().catch(() => {});
    if (a && audioUrl) {
      a.currentTime = excerptStart || 0;
      a.play().catch(() => {});
    }
    setPlaying(true);
    timerRef.current = setTimeout(stop, (excerptDuration || 6) * 1000);
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black">
        <video ref={videoRef} src={videoUrl} loop muted playsInline className="w-full" />
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
      <a href={videoUrl} download className="inline-flex items-center gap-2 text-xs text-primary hover:underline">
        <Download size={14} /> Télécharger la vidéo
      </a>
    </div>
  );
}