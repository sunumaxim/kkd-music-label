import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { StreamingLinks } from '../components/shared/StreamingEmbed';

const TYPES = [
  { value: 'all', label: 'Tout' },
  { value: 'single', label: 'Singles' },
  { value: 'album', label: 'Albums' },
  { value: 'ep', label: 'EP' },
  { value: 'projet_special', label: 'Projets' },
];

export default function Music() {
  const [activeType, setActiveType] = useState('all');

  const { data: releases, isLoading } = useQuery({
    queryKey: ['releases'],
    queryFn: () => base44.entities.Release.list('-release_date', 100),
    initialData: [],
  });

  const filtered = activeType === 'all' ? releases : releases.filter(r => r.release_type === activeType);

  return (
    <div className="min-h-screen px-4 py-16 md:py-24">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((release, i) => (
              <motion.div
                key={release.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-card mb-3 relative">
                  {release.cover_url ? (
                    <img
                      src={release.cover_url}
                      alt={release.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                      <span className="font-display text-4xl text-primary/30">♪</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-background/80 backdrop-blur-sm text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded text-foreground">
                      {release.release_type?.replace('_', ' ') || 'single'}
                    </span>
                  </div>
                </div>
                <h3 className="font-heading font-bold text-sm truncate">{release.title}</h3>
                <p className="text-xs text-muted-foreground">{release.artist_name}</p>
                {release.release_date && (
                  <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">{release.release_date}</p>
                )}
                <div className="mt-2">
                  <StreamingLinks
                    spotify={release.spotify_url}
                    youtube={release.youtube_url}
                    apple_music={release.apple_music_url}
                    audiomack={release.audiomack_url}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}