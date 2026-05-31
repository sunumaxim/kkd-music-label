import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Artists() {
  const { data: artists, isLoading } = useQuery({
    queryKey: ['artists'],
    queryFn: () => base44.entities.Artist.list('order', 50),
    initialData: [],
  });

  return (
    <div className="min-h-screen px-4 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Le Roster</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-2">
            Nos Artistes
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl">
            Découvrez les artistes du label KKD Music. Talent, passion et authenticité.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : artists.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">Aucun artiste pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {artists.map((artist, i) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/artistes/${artist.id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-card mb-3">
                    {artist.photo_url ? (
                      <img
                        src={artist.photo_url}
                        alt={artist.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-secondary">
                        <span className="font-display text-5xl font-bold text-primary/20">
                          {artist.name?.[0]}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-heading font-bold text-lg text-white">{artist.name}</h3>
                      {artist.genre && (
                        <p className="text-xs text-white/70 mt-0.5">{artist.genre}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}