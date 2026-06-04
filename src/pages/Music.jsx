import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { Loader2, Music as MusicIcon, Play, ChevronRight, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { EmbeddedPlayer } from '../components/shared/UniversalPlayer';
import PageMeta from '@/components/shared/PageMeta';
import { slugify } from '@/lib/slugify';

const TYPES = [
  { value: 'all', label: 'Tout' },
  { value: 'single', label: 'Singles' },
  { value: 'album', label: 'Albums' },
  { value: 'ep', label: 'EP' },
  { value: 'projet_special', label: 'Projets' },
];

const TYPE_COLORS = {
  single: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  album: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  ep: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  projet_special: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const TYPE_LABELS = {
  single: 'Single',
  album: 'Album',
  ep: 'EP',
  projet_special: 'Projet',
};

// ── Carte individuelle ──
function ReleaseCard({ release }) {
  const [playerOpen, setPlayerOpen] = useState(false);
  const streamUrl = release.spotify_url || release.deezer_url || release.audiomack_url || release.apple_music_url || release.youtube_url;
  const slug = `${slugify(release.title)}--${release.id}`;

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 transition-all group flex flex-col">
      {/* Cover */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {release.cover_url ? (
          <img
            src={release.cover_url}
            alt={release.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary">
            <MusicIcon size={48} className="text-primary/20" />
          </div>
        )}
        {/* Play overlay */}
        {streamUrl && (
          <button
            onClick={() => setPlayerOpen(v => !v)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl">
              {playerOpen
                ? <X size={20} className="text-white" />
                : <Play size={20} className="text-white ml-1" fill="white" />
              }
            </div>
          </button>
        )}
        {/* Type badge */}
        {release.release_type && (
          <span className={`absolute top-2 left-2 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${TYPE_COLORS[release.release_type] || 'text-muted-foreground bg-secondary/80 border-border/40'}`}>
            {TYPE_LABELS[release.release_type] || release.release_type}
          </span>
        )}
        {release.is_featured && (
          <span className="absolute top-2 right-2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full">⭐</span>
        )}
      </div>

      {/* Infos */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div>
          <h3 className="font-heading font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{release.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {release.artist_name}{release.release_date ? ` · ${release.release_date.slice(0, 4)}` : ''}
          </p>
        </div>

        {/* Embedded player (toggle) */}
        <AnimatePresence>
          {playerOpen && streamUrl && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden rounded-xl"
            >
              <EmbeddedPlayer url={streamUrl} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer actions */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          {streamUrl && (
            <button
              onClick={() => setPlayerOpen(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                playerOpen
                  ? 'bg-secondary text-muted-foreground border-border/50'
                  : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
              }`}
            >
              {playerOpen ? <X size={11} /> : <Play size={11} fill="currentColor" />}
              {playerOpen ? 'Fermer' : 'Écouter'}
            </button>
          )}
          <Link
            to={`/musique/${slug}`}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Détails <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ──
export default function Music() {
  const [activeType, setActiveType] = useState('all');
  const [artistFilter, setArtistFilter] = useState('all');
  const queryClient = useQueryClient();
  const { isRefreshing, pullY, containerRef } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries({ queryKey: ['releases'] });
  });

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['releases'],
    queryFn: () => base44.entities.Release.list('-release_date', 200),
  });

  // Artistes disponibles
  const artists = ['all', ...new Set(releases.map(r => r.artist_name).filter(Boolean))];

  // Filtrage
  let filtered = releases;
  if (activeType !== 'all') filtered = filtered.filter(r => r.release_type === activeType);
  if (artistFilter !== 'all') filtered = filtered.filter(r => r.artist_name === artistFilter);

  const featured = filtered.filter(r => r.is_featured);
  const rest = filtered.filter(r => !r.is_featured);
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
        <div className="mb-8">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Catalogue</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-2">Musique</h1>
          {!isLoading && (
            <p className="text-muted-foreground mt-2 text-sm">
              <span className="text-foreground font-medium">{ordered.length}</span> sortie{ordered.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Filtres par type */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeType === type.value
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              {type.label}
              {type.value !== 'all' && releases.filter(r => r.release_type === type.value).length > 0 && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {releases.filter(r => r.release_type === type.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filtre par artiste */}
        {artists.length > 2 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {artists.map(a => (
              <button
                key={a}
                onClick={() => setArtistFilter(a)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  artistFilter === a
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border/50 text-muted-foreground hover:border-border'
                }`}
              >
                {a === 'all' ? 'Tous les artistes' : a}
              </button>
            ))}
          </div>
        )}

        {/* Grille */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-secondary" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : ordered.length === 0 ? (
          <div className="text-center py-20">
            <MusicIcon size={40} className="text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune sortie disponible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ordered.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}