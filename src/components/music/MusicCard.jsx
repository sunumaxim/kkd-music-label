import React from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { Play, Pause, Music, Lock } from 'lucide-react';
import { slugify } from '@/lib/slugify';

/**
 * Carte musicale style Spotify / Audiomack.
 * - Pochette carrée, bouton lecture intégré au lecteur global KKD
 * - Indicateur "en cours de lecture" animé
 * - Badge prix (FCFA) si contenu payant
 * - Lien vers la page de détail (sauf sur le bouton play)
 */
export default function MusicCard({ release }) {
  const player = usePlayer();
  const tracks = getReleaseTracks(release);
  const playable = tracks.length > 0;
  const paid = release.is_for_sale && Number(release.price) > 0;
  const slug = release.slug || slugify(release.title);

  const currentKey = player.current?.key;
  const isCurrent = tracks.some((t) => t.key === currentKey);
  const playing = isCurrent && player.isPlaying;

  const handlePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrent) { player.togglePlay(); return; }
    player.playQueue(tracks, 0);
  };

  return (
    <Link to={`/musique/${slug}`} className="group block">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary mb-2.5">
        {release.cover_url ? (
          <img
            src={release.cover_url}
            alt={release.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary">
            <Music size={32} className="text-muted-foreground/30" />
          </div>
        )}

        {/* Badge prix (FCFA) */}
        {paid && (
          <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
            {Number(release.price).toLocaleString('fr-FR')} F
          </span>
        )}

        {/* Badge Nouveau */}
        {release.is_featured && !paid && (
          <span className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
            Nouveau
          </span>
        )}

        {/* Indicateur lecture en cours */}
        {playing && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full px-2 py-1.5 flex items-end gap-0.5 h-7">
            <span className="w-0.5 bg-primary-foreground rounded-full kkd-eq-bar" style={{ height: '50%' }} />
            <span className="w-0.5 bg-primary-foreground rounded-full kkd-eq-bar" style={{ height: '80%', animationDelay: '0.2s' }} />
            <span className="w-0.5 bg-primary-foreground rounded-full kkd-eq-bar" style={{ height: '60%', animationDelay: '0.4s' }} />
          </div>
        )}

        {/* Bouton lecture — visible sur mobile, hover sur desktop */}
        {playable && (
          <button
            onClick={handlePlay}
            className={`absolute bottom-2 right-2 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl transition-all hover:scale-110 ${
              isCurrent ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0'
            }`}
            aria-label={playing ? 'Pause' : 'Lecture'}
          >
            {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
        )}

        {/* Cadenas si payant (pas de lecture gratuite) */}
        {paid && !playable && (
          <div className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-foreground/80 text-background flex items-center justify-center shadow-xl">
            <Lock size={16} />
          </div>
        )}
      </div>

      <p className={`font-heading font-bold text-sm truncate ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
        {release.title}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {release.artist_name}{release.release_date ? ` · ${release.release_date.slice(0, 4)}` : ''}
      </p>
    </Link>
  );
}