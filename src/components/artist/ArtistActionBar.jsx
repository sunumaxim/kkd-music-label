import React from 'react';
import { Play, Pause, Shuffle, MoreHorizontal } from 'lucide-react';
import FollowButton from './FollowButton';

/**
 * Barre d'actions du profil artiste (style Spotify) :
 * avatar + pill « Suivre/Abonné » + menu + lecture aléatoire + gros bouton Play.
 */
export default function ArtistActionBar({ artist, onPlay, onShuffle, isPlaying, canPlay, onMore }) {
  return (
    <div className="flex items-center gap-3 py-4">
      {artist.photo_url && (
        <img
          src={artist.photo_url}
          alt={artist.name}
          className="w-12 h-12 rounded-full object-cover border border-border/40 shrink-0"
        />
      )}
      <FollowButton artistId={artist.id} artistName={artist.name} variant="pill" />

      <button
        onClick={onMore}
        className="ml-auto p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Plus d'options"
      >
        <MoreHorizontal size={22} />
      </button>

      <button
        onClick={onShuffle}
        className="p-2 text-primary hover:text-primary/80 transition-colors"
        aria-label="Lecture aléatoire"
      >
        <Shuffle size={20} />
      </button>

      <button
        onClick={onPlay}
        disabled={!canPlay}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform disabled:opacity-40 disabled:hover:scale-100 shrink-0"
        aria-label={isPlaying ? 'Pause' : 'Lecture'}
      >
        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
      </button>
    </div>
  );
}