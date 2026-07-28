import React from 'react';
import { usePlayer } from '@/lib/PlayerContext';
import { ListMusic, Trash2, Play, Pause, X, Eraser } from 'lucide-react';

/**
 * Vue « File d'attente » intégrée à la bibliothèque (style Mon Lecteur).
 * Affiche la piste en cours + les pistes à suivre, avec gestion complète :
 * lecture immédiate, retrait, vider la file.
 */
export default function QueueLibrary() {
  const player = usePlayer();
  const { queue, currentIndex, current, isPlaying } = player;

  if (!queue.length || !current) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ListMusic size={28} className="text-primary/40" />
        </div>
        <p className="font-heading font-bold mb-1">File d'attente vide</p>
        <p className="text-sm text-muted-foreground">
          Ajoutez des titres depuis une fiche sortie ou un album avec le bouton <span className="text-primary">+</span> (à la suite) ou <span className="text-primary">⋮</span> (file d'attente).
        </p>
      </div>
    );
  }

  const upcoming = queue.map((t, i) => ({ ...t, _i: i })).filter((t) => t._i !== currentIndex);

  const clearAll = () => {
    upcoming.forEach((t) => player.removeFromQueue(t._i));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListMusic size={18} className="text-primary" />
          <h2 className="font-display font-extrabold text-xl">File d'attente</h2>
          <span className="text-xs text-muted-foreground">{queue.length} titre{queue.length !== 1 ? 's' : ''}</span>
        </div>
        {upcoming.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-full border border-border/40 hover:border-destructive/40"
          >
            <Eraser size={14} /> Vider la file
          </button>
        )}
      </div>

      {/* Piste en cours */}
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">En cours</p>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
          {current.cover_url ? (
            <img src={current.cover_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">♪</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-heading font-bold text-sm truncate">{current.title}</p>
            <p className="text-xs text-muted-foreground truncate">{current.artist_name || 'KKD Music'}</p>
          </div>
          <button
            onClick={player.togglePlay}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-lg"
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} className="ml-0.5" fill="currentColor" />}
          </button>
        </div>
      </div>

      {/* À suivre */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          À suivre · {upcoming.length}
        </p>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 text-center py-8">Aucune piste à suivre.</p>
        ) : (
          <div className="divide-y divide-border/30">
            {upcoming.map((t, i) => (
              <div
                key={t.key || t._i}
                className="group flex items-center gap-3 py-2.5 cursor-pointer hover:bg-secondary/40 rounded-lg px-2 -mx-2 transition-colors"
                onClick={() => player.playAt(t._i)}
              >
                <span className="text-xs font-mono text-muted-foreground/60 w-4 text-center shrink-0">{i + 1}</span>
                {t.cover_url ? (
                  <img src={t.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">♪</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.artist_name || 'KKD Music'}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); player.removeFromQueue(t._i); }}
                  className="p-1.5 rounded-md text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Retirer de la file"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}