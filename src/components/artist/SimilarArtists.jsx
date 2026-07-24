import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Sparkles } from 'lucide-react';

/**
 * Recommandations d'artistes similaires (même genre musical).
 */
export default function SimilarArtists({ genre, artistId }) {
  const { data: artists = [] } = useQuery({
    queryKey: ['similar-artists', genre, artistId],
    queryFn: () => base44.entities.Artist.list('order', 40),
    enabled: !!genre,
  });

  const similar = artists
    .filter(
      (a) =>
        a.id !== artistId &&
        a.genre &&
        genre &&
        a.genre.toLowerCase() === genre.toLowerCase()
    )
    .slice(0, 8);

  if (!similar.length) return null;

  return (
    <div>
      <h2 className="font-heading font-bold text-lg flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-primary" /> Artistes similaires
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {similar.map((a) => (
          <Link
            key={a.id}
            to={`/artistes/${a.id}`}
            className="flex-none w-32 sm:w-36 bg-card border border-border/40 rounded-2xl overflow-hidden group hover:border-primary/40 transition-all"
          >
            <div className="aspect-square overflow-hidden">
              {a.photo_url ? (
                <img
                  src={a.photo_url}
                  alt={a.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-card to-muted flex items-center justify-center text-2xl font-display font-extrabold text-primary/30">
                  {a.name?.[0]}
                </div>
              )}
            </div>
            <div className="p-2.5 min-w-0">
              <p className="font-heading font-bold text-xs truncate group-hover:text-primary transition-colors">
                {a.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{a.genre}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}