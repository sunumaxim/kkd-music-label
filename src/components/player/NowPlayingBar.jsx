import React, { useState, useEffect } from 'react';
import { usePlayer } from '@/lib/PlayerContext';
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle,
  Volume2, VolumeX, X, AlertCircle, Loader2, ListMusic, Heart,
  Info
} from 'lucide-react';
import QueuePanel from '@/components/player/QueuePanel';
import NowPlayingView from '@/components/player/NowPlayingView';
import { useToast } from '@/components/ui/use-toast';

function fmt(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const RATES = [1, 1.25, 1.5, 2];
function nextRate(current) {
  const i = RATES.indexOf(current);
  return i === -1 ? 1.25 : RATES[(i + 1) % RATES.length];
}

export default function NowPlayingBar() {
  const player = usePlayer();
  const { toast } = useToast();
  const [queueOpen, setQueueOpen] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);

  const { current, isPlaying, currentTime, duration, repeatMode, shuffle, volume } = player;

  // Sync like state with localStorage
  useEffect(() => {
    if (!current?.key) return;
    const likedList = JSON.parse(localStorage.getItem('kkd_liked_tracks') || '[]');
    setIsLiked(likedList.includes(current.key || current.title));
  }, [current?.key, current?.title]);

  const toggleLike = () => {
    if (!current) return;
    const key = current.key || current.title;
    let likedList = JSON.parse(localStorage.getItem('kkd_liked_tracks') || '[]');
    if (likedList.includes(key)) {
      likedList = likedList.filter(k => k !== key);
      setIsLiked(false);
      toast({ title: 'Retiré des favoris', description: `"${current.title}" retiré de vos Titres Likés.` });
    } else {
      likedList.push(key);
      setIsLiked(true);
      toast({ title: 'Ajouté aux favoris !', description: `"${current.title}" ajouté à votre bibliothèque.` });
    }
    localStorage.setItem('kkd_liked_tracks', JSON.stringify(likedList));
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      player.setVolume(0);
    } else {
      player.setVolume(prevVolume || 1);
    }
  };

  if (!current) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
      <NowPlayingView open={nowPlayingOpen} onClose={() => setNowPlayingOpen(false)} />

      {/* ── SPOTIFY / AUDIOMACK PERSISTENT BOTTOM PLAYER ── */}
      <div className="fixed bottom-14 md:bottom-0 left-0 md:left-64 right-0 z-40 bg-card/95 backdrop-blur-2xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] select-none">
        {/* Mobile Scrubber Line with Drag/Click */}
        <div
          className="md:hidden h-1 bg-secondary cursor-pointer relative"
          onClick={(e) => {
            if (duration > 0) {
              const r = e.currentTarget.getBoundingClientRect();
              player.seek(((e.clientX - r.left) / r.width) * duration);
            }
          }}
        >
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center justify-between gap-3 px-3 py-2 md:py-3 md:px-5">
          {/* ── Gauche : Cover, Titre, Artiste, Like & Badge Master (Spotify Style) ── */}
          <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-64">
            {current.cover_url ? (
              <img
                src={current.cover_url}
                alt={current.title}
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover shrink-0 shadow-md border border-border"
              />
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-rose-500/20 border border-primary/20 flex items-center justify-center shrink-0 text-primary font-bold">
                ♪
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm text-foreground truncate hover:underline cursor-pointer">
                  {current.title}
                </p>
              </div>
              <p className="text-xs text-muted-foreground truncate hover:text-foreground transition-colors">
                {current.artist_name || 'KKD Music'}
              </p>
              <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono font-bold border border-primary/25">
                  HQ MASTER 320K
                </span>
                {isPlaying && (
                  <span className="flex items-center gap-0.5 text-primary text-[10px]">
                    <span className="w-1 h-2 bg-primary rounded-full kkd-eq-bar" />
                    <span className="w-1 h-3 bg-primary rounded-full kkd-eq-bar" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 h-1.5 bg-primary rounded-full kkd-eq-bar" style={{ animationDelay: '0.4s' }} />
                  </span>
                )}
              </div>
            </div>

            {/* Like Heart Button */}
            <button
              onClick={toggleLike}
              className={`p-1.5 rounded-full hover:scale-110 transition-all shrink-0 ${
                isLiked ? 'text-primary fill-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              title={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* ── Centre : Contrôles de lecture & Timeline Scrubber (Spotify Desktop) ── */}
          <div className="flex flex-col items-center justify-center flex-1 max-w-2xl px-2">
            <div className="flex items-center gap-3 md:gap-5">
              {/* Shuffle */}
              <button
                onClick={() => player.setShuffle(!shuffle)}
                className={`hidden md:inline-flex p-1.5 rounded-full transition-colors relative ${
                  shuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Lecture aléatoire"
              >
                <Shuffle size={16} />
                {shuffle && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
              </button>

              {/* Previous */}
              <button
                onClick={player.prev}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
                title="Titre précédent"
              >
                <SkipBack size={20} />
              </button>

              {/* Play / Pause (Spotify Signature Large Circle) */}
              <button
                onClick={player.error ? player.retry : player.togglePlay}
                className="inline-flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-primary text-white hover:scale-105 hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20 shrink-0"
                title={player.error ? 'Réessayer' : isPlaying ? 'Mettre en pause' : 'Lire'}
              >
                {player.error ? (
                  <AlertCircle size={20} className="text-white" />
                ) : player.isBuffering ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={player.next}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
                title="Titre suivant"
              >
                <SkipForward size={20} />
              </button>

              {/* Repeat */}
              <button
                onClick={() => player.setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
                className={`hidden md:inline-flex p-1.5 rounded-full transition-colors relative ${
                  repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                title={repeatMode === 'one' ? 'Répéter le titre' : repeatMode === 'all' ? 'Tout répéter' : 'Répéter désactivé'}
              >
                {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                {repeatMode !== 'off' && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            </div>

            {/* Desktop Scrubber Timeline */}
            <div className="hidden md:flex items-center gap-2.5 w-full mt-1.5">
              <span className="text-[11px] font-mono text-muted-foreground w-10 text-right">
                {fmt(currentTime)}
              </span>
              <div className="relative flex-1 flex items-center group">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => player.seek(parseFloat(e.target.value))}
                  className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary group-hover:h-1.5 transition-all"
                />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground w-10">
                {fmt(duration)}
              </span>
            </div>
          </div>

          {/* ── Droite : Actions, Vitesse, Volume & File d'attente (Spotify Desktop) ── */}
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0 justify-end md:w-64">
            {/* Speed Rate (1x / 1.25x / 1.5x) */}
            <button
              onClick={() => player.setPlaybackRate(nextRate(player.playbackRate))}
              className="px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-[11px] font-mono font-bold text-foreground transition-colors"
              title="Vitesse de lecture"
            >
              {player.playbackRate}×
            </button>

            {/* Now Playing View Toggle (Spotify Right Drawer) */}
            <button
              onClick={() => setNowPlayingOpen((v) => !v)}
              className={`p-2 rounded-xl transition-colors relative ${
                nowPlayingOpen
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              title="Vue en cours de lecture / Concerts & Crédits"
            >
              <Info size={18} />
              {nowPlayingOpen && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>

            {/* Queue Toggle with badge */}
            <button
              onClick={() => setQueueOpen((v) => !v)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative"
              title="File d'attente de lecture"
            >
              <ListMusic size={18} />
              {player.queue.length > 1 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-extrabold rounded-full px-1.5 py-0.2 shadow">
                  {player.queue.length}
                </span>
              )}
            </button>

            {/* Volume Control (Desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={volume === 0 ? 'Activer le son' : 'Couper le son'}
              >
                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => player.setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary hover:h-1.5 transition-all"
              />
            </div>

            {/* Stop / Close Player */}
            <button
              onClick={player.stop}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Fermer le lecteur"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
