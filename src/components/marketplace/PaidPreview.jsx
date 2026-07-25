import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, Pause, Lock } from 'lucide-react';

/**
 * PaidPreview — plays a 30s free excerpt of a paid track.
 * The full file stays protected (private) and is only unlocked after purchase.
 */
export default function PaidPreview({ protectedFileUri, audioUrl, previewStart = 0, duration = 30 }) {
  const [url, setUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const source = audioUrl || protectedFileUri;
      if (!source) { if (active) setLoading(false); return; }
      try {
        if (source.startsWith('http')) {
          if (active) setUrl(source);
        } else {
          const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: source });
          if (active) setUrl(res.signed_url);
        }
      } catch {
        /* noop */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [protectedFileUri, audioUrl]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); return; }
    a.currentTime = previewStart;
    a.play().catch(() => {});
    setPlaying(true);
  };

  const onTime = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.currentTime >= previewStart + duration) { a.pause(); setPlaying(false); setProgress(100); return; }
    setProgress(Math.min(100, ((a.currentTime - previewStart) / duration) * 100));
  };

  if (!protectedFileUri && !audioUrl) return null;

  return (
    <div className="bg-card border border-primary/20 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-mono uppercase tracking-widest text-primary">Extrait gratuit (30s)</p>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock size={10} /> Achat requis pour le titre complet
        </span>
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement de l'extrait…</p>
      ) : url ? (
        <div className="flex items-center gap-4">
          <button onClick={toggle} className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shrink-0 hover:bg-primary/80 transition-colors">
            {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          </button>
          <div className="flex-1">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">Aperçu de 30 secondes</p>
          </div>
          <audio ref={audioRef} src={url} onTimeUpdate={onTime} onEnded={() => setPlaying(false)} preload="metadata" className="hidden" />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Extrait indisponible pour le moment.</p>
      )}
    </div>
  );
}