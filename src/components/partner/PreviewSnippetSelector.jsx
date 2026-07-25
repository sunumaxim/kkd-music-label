import React, { useState, useEffect, useRef } from 'react';
import { Scissors, Play, Pause, Loader2 } from 'lucide-react';
import { usePlayableUrl } from '@/hooks/usePlayableUrl';

/**
 * PreviewSnippetSelector — lets the artist drag to choose the 30s
 * preview excerpt that listeners can hear for free before buying.
 * Gère les fichiers privés (vendus) via URL signée.
 */
export default function PreviewSnippetSelector({ fileUrl, value = 0, onChange }) {
  const { url: playableUrl, loading } = usePlayableUrl(fileUrl);
  const audioRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playableUrl) { setDuration(0); return; }
    const a = new Audio(playableUrl);
    a.preload = 'metadata';
    a.onloadedmetadata = () => setDuration(a.duration || 0);
    audioRef.current = a;
    return () => { a.pause(); };
  }, [playableUrl]);

  const PREVIEW = 30;
  const maxStart = Math.max(0, Math.floor(duration - PREVIEW));
  const start = Math.min(value || 0, maxStart);

  const playSnippet = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); return; }
    a.currentTime = start;
    a.play().catch(() => {});
    setPlaying(true);
    const stopAt = () => {
      if (a.currentTime >= start + PREVIEW) { a.pause(); setPlaying(false); a.removeEventListener('timeupdate', stopAt); }
    };
    a.addEventListener('timeupdate', stopAt);
  };

  if (!fileUrl) return null;

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Scissors size={14} className="text-primary" />
        <p className="font-heading font-bold text-sm">Extrait d'écoute (30s)</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Glissez pour choisir la partie que les auditeurs pourront écouter gratuitement avant d'acheter.
      </p>
      {loading ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Chargement du fichier…</p>
      ) : duration > 0 ? (
        <>
          <input
            type="range"
            min={0}
            max={maxStart}
            value={start}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>Début : {fmt(start)}</span>
            <span>Fin : {fmt(start + PREVIEW)}</span>
          </div>
          <button type="button" onClick={playSnippet} className="text-xs flex items-center gap-1.5 text-primary hover:underline">
            {playing ? <Pause size={12} /> : <Play size={12} />}
            {playing ? 'Lecture en cours…' : 'Écouter cet extrait'}
          </button>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Impossible de charger la durée du fichier.</p>
      )}
    </div>
  );
}