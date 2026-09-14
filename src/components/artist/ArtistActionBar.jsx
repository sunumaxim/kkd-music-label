import React from 'react';
import { Play, Pause, Shuffle, MoreHorizontal, Share2, RefreshCw } from 'lucide-react';
import FollowButton from './FollowButton';

/**
 * Barre d'actions du profil artiste (style Spotify standard) :
 * Gros bouton Play (56px) à gauche + Suivre/Abonné + Shuffle + DSP Sync + Partage + Plus.
 */
export default function ArtistActionBar({
  artist,
  onPlay,
  onShuffle,
  isPlaying,
  canPlay,
  onMore,
  onShare,
  onDspSync,
  isDspSyncing = false,
}) {
  return (
    <div className="flex items-center gap-4 py-6 flex-wrap">
      {/* 1. Main 56px Spotify Play Button */}
      <button
        onClick={onPlay}
        disabled={!canPlay}
        className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 shrink-0 cursor-pointer"
        aria-label={isPlaying ? 'Pause' : 'Lecture'}
      >
        {isPlaying ? (
          <Pause size={24} fill="currentColor" />
        ) : (
          <Play size={24} fill="currentColor" className="ml-1" />
        )}
      </button>

      {/* 2. Follow Button */}
      <FollowButton artistId={artist.id} artistName={artist.name} variant="pill" />

      {/* 3. Shuffle Button */}
      <button
        onClick={onShuffle}
        className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        title="Lecture aléatoire"
        aria-label="Lecture aléatoire"
      >
        <Shuffle size={22} />
      </button>

      {/* 4. DSP Sync Watcher Button (Spotify & Deezer) */}
      {onDspSync && (
        <button
          onClick={onDspSync}
          disabled={isDspSyncing}
          className={`p-2.5 rounded-full transition-colors flex items-center gap-1.5 ${
            isDspSyncing
              ? 'text-primary bg-primary/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Veille active : synchroniser photo et nouveaux singles depuis Spotify et Deezer"
          aria-label="Synchroniser depuis Spotify et Deezer"
        >
          <RefreshCw size={20} className={isDspSyncing ? 'animate-spin text-primary' : ''} />
        </button>
      )}

      {/* 5. Share Button */}
      {onShare && (
        <button
          onClick={onShare}
          className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="Partager le profil"
          aria-label="Partager le profil"
        >
          <Share2 size={20} />
        </button>
      )}

      {/* 6. More Options */}
      <button
        onClick={onMore}
        className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors ml-auto sm:ml-0"
        title="Plus d'options"
        aria-label="Plus d'options"
      >
        <MoreHorizontal size={22} />
      </button>
    </div>
  );
}