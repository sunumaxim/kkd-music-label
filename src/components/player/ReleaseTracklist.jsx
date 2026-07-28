import React from 'react';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { Play, Pause, Plus, ListEnd } from 'lucide-react';

/**
 * Liste des pistes d'un album avec lecture individuelle dans le lecteur global.
 */
export default function ReleaseTracklist({ release }) {
  const player = usePlayer();
  const tracks = getReleaseTracks(release);
  if (!tracks.length) return null;

  return (
    <div className="divide-y divide-border/30 -mx-1">
      {tracks.map((t, i) => {
        const isCurrent = player.current?.key === t.key;
        const playing = isCurrent && player.isPlaying;
        return (
          <div key={t.key} className="flex items-center gap-3 py-2.5 px-1 group">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (isCurrent) player.togglePlay();
                else player.playQueue(tracks, i);
              }}
              className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground flex items-center justify-center shrink-0 transition-colors"
              aria-label={playing ? 'Pause' : 'Lecture'}
            >
              {playing ? <Pause size={13} /> : <Play size={13} className="ml-0.5" fill="currentColor" />}
            </button>
            <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{i + 1}</span>
            <p className={`flex-1 min-w-0 truncate text-sm ${isCurrent ? 'text-primary font-medium' : 'text-foreground'}`}>
              {t.title}
            </p>
            <button
              onClick={(e) => { e.preventDefault(); player.playNext(t); }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
              title="Lire à la suite"
              aria-label="Lire à la suite"
            >
              <Plus size={15} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); player.addToQueue(t); }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
              title="Ajouter à la file d'attente"
              aria-label="Ajouter à la file d'attente"
            >
              <ListEnd size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}