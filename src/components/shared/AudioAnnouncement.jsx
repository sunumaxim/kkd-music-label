import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Volume2, Play, Pause, X } from 'lucide-react';

/**
 * Annonce audio automatisée KKD Music.
 * Lit l'annonce active (type 'audio') une fois par session, après la première
 * interaction utilisateur (contourne le blocage d'autoplay des navigateurs).
 */
export default function AudioAnnouncement() {
  const { data: promos = [] } = useQuery({
    queryKey: ['promo-banners-audio'],
    queryFn: () => base44.entities.PromoBanner.list('order'),
    staleTime: 60000,
  });

  const active = useMemo(() => {
    const now = new Date();
    return promos
      .filter((p) => p.is_active && p.type === 'audio' && p.audio_url)
      .filter((p) => {
        const start = p.start_date ? new Date(p.start_date) : null;
        const end = p.end_date ? new Date(p.end_date) : null;
        return (!start || start <= now) && (!end || end >= now);
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [promos]);

  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const announcement = active[0];

  useEffect(() => {
    if (!announcement) return;
    let played = false;
    try { played = sessionStorage.getItem('kkd_audio_announce_played') === '1'; } catch {}
    if (played) return;

    const onGesture = () => {
      if (played) return;
      const el = audioRef.current;
      if (el) {
        el.play().then(() => setPlaying(true)).catch(() => {});
        try { sessionStorage.setItem('kkd_audio_announce_played', '1'); } catch {}
        played = true;
        document.removeEventListener('pointerdown', onGesture);
      }
    };
    document.addEventListener('pointerdown', onGesture);
    return () => document.removeEventListener('pointerdown', onGesture);
  }, [announcement]);

  if (!announcement || dismissed) return null;

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-28 z-40 w-[92vw] max-w-md">
      <div className="flex items-center gap-3 bg-card/95 backdrop-blur-xl border border-primary/30 rounded-full pl-2 pr-3 py-2 shadow-lg shadow-black/30">
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"
          aria-label={playing ? 'Pause' : 'Lecture'}
        >
          {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Volume2 size={15} className="text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-mono uppercase tracking-wider text-primary/70 leading-none">Annonce KKD</p>
            <p className="text-xs font-bold truncate leading-tight mt-0.5">{announcement.title}</p>
          </div>
        </div>
        <button
          onClick={() => { audioRef.current?.pause(); setDismissed(true); }}
          className="w-7 h-7 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground shrink-0"
          aria-label="Fermer"
        >
          <X size={14} />
        </button>
      </div>
      <audio ref={audioRef} src={announcement.audio_url} onEnded={() => setPlaying(false)} />
    </div>
  );
}