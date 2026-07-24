import React from 'react';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { Play, Pause } from 'lucide-react';

/**
 * Bouton de lecture qui envoie une release (single ou album) dans le
 * lecteur global KKD — la lecture persiste entre les pages.
 */
export default function PlayReleaseButton({ release, startIndex = 0, size = 'md', className = '' }) {
  const player = usePlayer();
  const tracks = getReleaseTracks(release);
  if (!tracks.length) return null;

  const currentKey = player.current?.key;
  const isCurrent = tracks.some((t) => t.key === currentKey);
  const playing = isCurrent && player.isPlaying;

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrent) { player.togglePlay(); return; }
    player.playQueue(tracks, Math.min(startIndex, tracks.length - 1));
  };

  const sizeCls = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-14 h-14' }[size];
  const iconSize = { sm: 13, md: 18, lg: 24 }[size];

  return (
    <button
      onClick={onClick}
      className={`rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors shadow-lg shrink-0 ${sizeCls} ${className}`}
      aria-label={playing ? 'Pause' : 'Lecture'}
    >
      {playing ? <Pause size={iconSize} /> : <Play size={iconSize} className="ml-0.5" fill="currentColor" />}
    </button>
  );
}