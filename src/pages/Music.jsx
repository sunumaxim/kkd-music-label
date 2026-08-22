import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { Loader2, Music as MusicIcon, Search, X } from 'lucide-react';
import PageMeta from '@/components/shared/PageMeta';
import MusicCard from '@/components/music/MusicCard';

const TYPES = [
  { value: 'all', label: 'Tout' },
  { value: 'single', label: 'Singles' },
  { value: 'album', label: 'Albums' },
  { value: 'ep', label: 'EP' },
  { value: 'projet_special', label: 'Projets' },
];

export default function Music() {
  const [activeType, setActiveType] = useState('all');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { isRefreshing, pullY, containerRef } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries({ queryKey: ['releases'] });
  });

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['releases'],
    queryFn: () => base44.entities.Release.list('-release_date', 200),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Filtrage par type + recherche texte
  let filtered = releases;
  if (activeType !== 'all') filtered = filtered.filter((r) => r.release_type === activeType);
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.artist_name?.toLowerCase().includes(q)
    );
  }

  const featured = filtered.filter((r) => r.is_featured);
  const rest = filtered.filter((r) => !r.is_featured);
  const ordered = [...featured, ...rest];

  return (
    <div ref={containerRef} className="min-h-screen px-4 py-16 md:py-24">
      <PageMeta title="Musique — KKD Music" description="Explorez tout le catalogue musical KKD Music — singles, albums, EPs." />

      {(isRefreshing || pullY > 20) && (
        <div className="md:hidden flex justify-center pb-2 -mt-12 text-primary">
          <Loader2 size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Catalogue</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-2">Musique</h1>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un titre, un artiste…"
            className="w-full pl-10 pr-10 py-3 rounded-full bg-card border border-border/50 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Effacer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtres par type */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeType === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Compteur */}
        {!isLoading && (
          <p className="text-muted-foreground text-sm mb-4">
            <span className="text-foreground font-medium">{ordered.length}</span> sortie{ordered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grille */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-secondary rounded-xl mb-2.5" />
                <div className="h-4 bg-secondary rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : ordered.length === 0 ? (
          <div className="text-center py-20">
            <MusicIcon size={40} className="text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search ? 'Aucun résultat pour votre recherche.' : 'Aucune sortie disponible.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-primary text-sm mt-2 hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {ordered.map((release) => (
              <MusicCard key={release.id} release={release} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}