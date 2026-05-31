import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function FeaturedArtists({ artists }) {
  if (!artists || artists.length === 0) return null;

  return (
    <section className="py-20 md:py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-mono text-primary tracking-widest uppercase">Le Roster</span>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight mt-2">
              Nos Artistes
            </h2>
          </div>
          <Link to="/artistes" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {artists.slice(0, 8).map((artist, i) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
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
                      <span className="font-display text-4xl font-bold text-primary/30">
                        {artist.name?.[0]}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="font-heading font-bold text-sm md:text-base tracking-wide group-hover:text-primary transition-colors">
                  {artist.name}
                </h3>
                {artist.genre && (
                  <p className="text-xs text-muted-foreground mt-0.5">{artist.genre}</p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}