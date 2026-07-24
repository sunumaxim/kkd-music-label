import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Heart } from 'lucide-react';
import UniversalPlayer from '@/components/shared/UniversalPlayer';
import { buildEntitySlug } from '@/lib/slugify';

const TYPE_LABELS = {
  single: 'Single',
  album: 'Album',
  ep: 'EP',
  projet_special: 'Projet spécial',
};

const TYPE_COLORS = {
  single: 'bg-blue-500/10 text-blue-400',
  album: 'bg-purple-500/10 text-purple-400',
  ep: 'bg-orange-500/10 text-orange-400',
  projet_special: 'bg-primary/10 text-primary',
};

/**
 * Grille verticale de sorties (discographie d'un artiste).
 * Affiche pochette, titre, année, likes et lecteur intégré.
 */
export default function ArtistReleasesGrid({ releases = [] }) {
  if (!releases.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {releases.map((r) => {
        const streamUrl = r.spotify_url || r.deezer_url || r.audiomack_url || r.apple_music_url || r.youtube_url;
        const isPreorder = r.is_for_sale && r.release_date && new Date(r.release_date) > new Date();
        return (
          <div
            key={r.id}
            className="bg-card border border-border/40 rounded-2xl overflow-hidden group hover:border-primary/40 hover:shadow-md transition-all flex flex-col"
          >
            <Link
              to={`/musique/${buildEntitySlug(r.title, r.id)}`}
              className="relative aspect-square overflow-hidden block"
            >
              {r.cover_url ? (
                <img
                  src={r.cover_url}
                  alt={r.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-card to-muted flex items-center justify-center">
                  <Music size={32} className="text-muted-foreground/30" />
                </div>
              )}
              {r.release_type && (
                <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[r.release_type] || 'bg-secondary text-foreground'}`}>
                  {TYPE_LABELS[r.release_type] || r.release_type}
                </span>
              )}
              {r.is_for_sale && (
                <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                  {isPreorder ? 'Précommande' : 'Exclu'}
                </span>
              )}
            </Link>

            <div className="p-2.5 sm:p-3 flex flex-col flex-1 min-w-0">
              <Link to={`/musique/${buildEntitySlug(r.title, r.id)}`}>
                <p className="font-heading font-bold text-xs sm:text-sm truncate group-hover:text-primary transition-colors">
                  {r.title}
                </p>
              </Link>
              <p className="text-[11px] text-muted-foreground mt-0.5">{r.release_date?.slice(0, 4) || '—'}</p>

              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart size={11} className="text-primary/70" /> {r.likes_count || 0}
                </span>
              </div>

              {streamUrl && (
                <div className="mt-2">
                  <UniversalPlayer url={streamUrl} label={r.title} className="w-full" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}