import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ListMusic } from 'lucide-react';
import SectionHeader from './SectionHeader';
import CarouselRow from './CarouselRow';

/**
 * "Playlists" — étagère des playlists de l'utilisateur connecté (communautaires).
 * Masquée si l'utilisateur n'est pas connecté ou n'a aucune playlist.
 */
export default function PlaylistsShelf() {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 60_000,
  });

  const { data: playlists = [] } = useQuery({
    queryKey: ['my-playlists-home'],
    queryFn: () => base44.entities.Playlist.list('-updated_date', 20),
    enabled: !!me,
  });

  if (!me || playlists.length === 0) return null;

  return (
    <section className="py-10 md:py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Bibliothèque" title="Playlists" to="/playlists" count={playlists.length} />
        <CarouselRow>
          {playlists.map((p) => (
            <Link key={p.id} to="/playlists" className="snap-start shrink-0 w-40 md:w-48 group block">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary mb-3 shadow-lg shadow-black/20 flex items-center justify-center">
                {p.cover_url ? (
                  <img src={p.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <ListMusic size={36} className="text-primary/30" />
                )}
              </div>
              <h3 className="font-heading font-bold text-sm truncate group-hover:text-primary transition-colors">{p.title}</h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {(p.items || []).length} titre{(p.items || []).length !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </CarouselRow>
      </div>
    </section>
  );
}