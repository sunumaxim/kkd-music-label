import React from 'react';
import { usePlayer } from '@/lib/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume2, X } from 'lucide-react';

function fmt(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function NowPlayingBar() {
  const player = usePlayer();
  const { current, isPlaying, currentTime, duration, repeatMode, shuffle, volume } = player;
  if (!current) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 md:left-60 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/40 shadow-2xl select-none">
      {/* Ligne de progression (mobile) */}
      <div className="md:hidden h-0.5 bg-secondary/60 cursor-pointer"
        onClick={(e) => { if (duration > 0) { const r = e.currentTarget.getBoundingClientRect(); player.seek(((e.clientX - r.left) / r.width) * duration); } }}
      >
        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center gap-3 px-3 py-2 md:py-2.5 md:px-4">
        {/* Infos piste */}
        <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-56">
          {current.cover_url ? (
            <img src={current.cover_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 text-primary">♪</div>
          )}
          <div className="min-w-0">
            <p className="font-heading font-bold text-sm truncate">{current.title}</p>
            <p className="text-xs text-muted-foreground truncate">{current.artist_name || 'KKD Music'}</p>
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex items-center justify-center gap-1 md:gap-2 shrink-0 md:flex-1">
          <button onClick={player.prev} className="hidden md:inline-flex p-2 text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack size={18} />
          </button>
          <button
            onClick={player.togglePlay}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors shrink-0"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button onClick={player.next} className="inline-flex p-2 text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward size={18} />
          </button>

          {/* Barre de progression (desktop) */}
          <div className="hidden md:flex items-center gap-2 ml-4 flex-1 max-w-md">
            <span className="text-[10px] font-mono text-muted-foreground w-9 text-right">{fmt(currentTime)}</span>
            <input
              type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
              onChange={(e) => player.seek(parseFloat(e.target.value))}
              className="flex-1 accent-primary h-1"
            />
            <span className="text-[10px] font-mono text-muted-foreground w-9">{fmt(duration)}</span>
          </div>
        </div>

        {/* Droite — répétition / aléatoire / volume (desktop) */}
        <div className="hidden md:flex items-center gap-1 w-56 justify-end">
          <button
            onClick={() => player.setShuffle(!shuffle)}
            className={`p-2 rounded-md hover:bg-secondary transition-colors ${shuffle ? 'text-primary' : 'text-muted-foreground'}`}
            title="Aléatoire"
          >
            <Shuffle size={16} />
          </button>
          <button
            onClick={() => player.setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
            className={`p-2 rounded-md hover:bg-secondary transition-colors ${repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground'}`}
            title={repeatMode === 'one' ? 'Répéter le titre' : repeatMode === 'all' ? 'Tout répéter' : 'Répéter'}
          >
            {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
          <div className="flex items-center gap-1.5 ml-2">
            <Volume2 size={16} className="text-muted-foreground" />
            <input
              type="range" min={0} max={1} step={0.01} value={volume}
              onChange={(e) => player.setVolume(parseFloat(e.target.value))}
              className="w-20 accent-primary h-1"
            />
          </div>
        </div>

        {/* Stop (mobile) */}
        <button onClick={player.stop} className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}