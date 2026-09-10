import React from 'react';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { Play, Pause, Lock } from 'lucide-react';

/**
 * Bouton de lecture qui envoie une release (single ou album) dans le
 * lecteur global KKD — la lecture persiste entre les pages.
 * En cas de contenu en vente exclusive non acheté, active l'interface de verrouillage.
 */
export default function PlayReleaseButton({ release, startIndex = 0, size = 'md', className = '', hasPurchased = false }) {
  const player = usePlayer();
  const tracks = getReleaseTracks(release, { hasPurchased, includeLocked: true });
  if (!tracks.length) return null;

  const currentKey = player.current?.key;
  const isCurrent = tracks.some((t) => t.key === currentKey);
  const playing = isCurrent && player.isPlaying;

  const isForSale = Boolean(
    (release.is_for_sale || release.access_mode === 'en_vente') &&
    (Number(release.price) > 0 || release.is_for_sale)
  );
  const isLocked = isForSale && !hasPurchased;

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
      className={`rounded-full flex items-center justify-center transition-colors shadow-lg shrink-0 ${
        isLocked
          ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20'
          : 'bg-primary text-primary-foreground hover:bg-primary/80'
      } ${sizeCls} ${className}`}
      aria-label={playing ? 'Pause' : isLocked ? 'Titre en vente - Débloquer' : 'Lecture'}
      title={isLocked ? 'Contenu en vente exclusive — Cliquez pour déverrouiller' : undefined}
    >
      {playing ? (
        <Pause size={iconSize} />
      ) : isLocked ? (
        <Lock size={iconSize - 2} />
      ) : (
        <Play size={iconSize} className="ml-0.5" fill="currentColor" />
      )}
    </button>
  );
}