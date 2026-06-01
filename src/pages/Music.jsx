import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmbeddedPlayer, detectPlatform } from '../components/shared/UniversalPlayer';

const TYPES = [
  { value: 'all', label: 'Tout' },
  { value: 'single', label: 'Singles' },
  { value: 'album', label: 'Albums' },
  { value: 'ep', label: 'EP' },
  { value: 'projet_special', label: 'Projets' },
];

export default function Music() {
  const [activeType, setActiveType] = useState('all');
  const queryClient = useQueryClient();
  const { isRefreshing, pullY, containerRef } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries({ queryKey: ['releases'] });
  });

  const { data: releases, isLoading } = useQuery({
    queryKey: ['releases'],
    queryFn: () => base44.entities.Release.list('-release_date', 100),
    initialData: [],
  });

  const filtered = activeType === 'all' ? releases : releases.filter(r => r.release_type === activeType);

  return (
    <div ref={containerRef} className="min-h-screen px-4 py-16 md:py-24">
      {(isRefreshing || pullY > 20) && (
        <div className="md:hidden flex justify-center pb-2 -mt-12 text-primary">
          <Loader2 size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Catalogue</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-2">
            Musique
          </h1>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-12">
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

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square rounded-xl bg-card animate-pulse" />
                <div className="h-4 bg-card rounded animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">Aucune sortie disponible.</p>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto md:max-w-none md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
            {filtered.map((release, i) => {
              const streamUrl = release.spotify_url || release.apple_music_url || release.audiomack_url || release.youtube_url;
              return (
                <motion.div
                  key={release.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border/50 rounded-xl overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 p-3">
                    {release.cover_url ? (
                      <img src={release.cover_url} alt={release.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center shrink-0">
                        <span className="font-display text-2xl text-primary/30">♪</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {release.release_type?.replace('_', ' ') || 'single'}
                      </span>
                      <h3 className="font-heading font-bold text-sm truncate">{release.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{release.artist_name}</p>
                    </div>
                  </div>
                  {/* Embed direct */}
                  {streamUrl && <EmbeddedPlayer url={streamUrl} />}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}