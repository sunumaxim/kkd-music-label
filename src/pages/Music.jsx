import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { Loader2, Music as MusicIcon, Play, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
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

function ReleaseCard({ release, index }) {
  const streamUrl = release.spotify_url || release.apple_music_url || release.audiomack_url || release.youtube_url;
  const slug = `${slugify(release.title)}--${release.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
    >
      {/* Cover + info header */}
      <div className="flex items-center gap-3 p-4">
        <div className="relative flex-shrink-0">
          {release.cover_url ? (
            <img src={release.cover_url} alt={release.title} className="w-16 h-16 rounded-xl object-cover shadow-md" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
              <MusicIcon size={24} className="text-primary/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${TYPE_COLORS[release.release_type] || 'text-muted-foreground bg-secondary border-border/40'}`}>
            {release.release_type?.replace('_', ' ') || 'single'}
          </span>
          <h3 className="font-heading font-bold text-sm mt-1 truncate group-hover:text-primary transition-colors">{release.title}</h3>
          <p className="text-xs text-muted-foreground truncate">{release.artist_name}{release.release_date ? ` · ${release.release_date.slice(0, 4)}` : ''}</p>
        </div>
        <Link
          to={`/musique/${slug}`}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary hover:bg-primary hover:text-white flex items-center justify-center transition-all"
          title="Voir le détail"
        >
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Embedded player */}
      {streamUrl && <EmbeddedPlayer url={streamUrl} />}

      {/* Footer: likes + detail link */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {(release.likes_count || 0) > 0 && (
            <span className="flex items-center gap-1">❤️ {release.likes_count}</span>
          )}
          {(release.comments?.length || 0) > 0 && (
            <span className="flex items-center gap-1">💬 {release.comments.length}</span>
          )}
        </div>
        <Link
          to={`/musique/${slug}`}
          className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
        >
          <Play size={11} fill="currentColor" /> Écouter & commenter
        </Link>
      </div>
    </motion.div>
  );
}

export default function Music() {
  const [activeType, setActiveType] = useState('all');
  const queryClient = useQueryClient();
  const { isRefreshing, pullY, containerRef } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries({ queryKey: ['releases'] });
  });

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['releases'],
    queryFn: () => base44.entities.Release.list('-release_date', 100),
  });

  const filtered = activeType === 'all' ? releases : releases.filter(r => r.release_type === activeType);

  // Group featured first
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
        <div className="mb-10">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Catalogue</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-2">Musique</h1>
          {!isLoading && (
            <p className="text-muted-foreground mt-2 text-sm">
              <span className="text-foreground font-medium">{filtered.length}</span> sortie{filtered.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-16 h-16 rounded-xl bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-secondary rounded w-1/3" />
                    <div className="h-4 bg-secondary rounded w-3/4" />
                    <div className="h-3 bg-secondary rounded w-1/2" />
                  </div>
                </div>
                <div className="h-24 bg-secondary/50 m-4 rounded-xl" />
              </div>
            ))}
          </div>
        ) : ordered.length === 0 ? (
          <div className="text-center py-20">
            <MusicIcon size={40} className="text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune sortie disponible.</p>
          </div>
        ) : (
          <>
            {featured.length > 0 && activeType === 'all' && (
              <div className="mb-3">
                <p className="text-[10px] font-mono text-primary/70 uppercase tracking-widest mb-4">⭐ Mis en avant</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ordered.map((release, i) => (
                <ReleaseCard key={release.id} release={release} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}