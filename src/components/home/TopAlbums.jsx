import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Disc3, Play } from 'lucide-react';
import SectionHeader from './SectionHeader';
import CarouselRow from './CarouselRow';
import { buildEntitySlug } from '@/lib/slugify';
import PlayReleaseButton from '@/components/player/PlayReleaseButton';
import { isPlayable } from '@/lib/releaseTracks';

/**
 * "Meilleurs albums" — carousel horizontal des sorties de type album / EP / projet spécial.
 */
export default function TopAlbums({ releases = [] }) {
  const albums = releases
    .filter((r) => ['album', 'ep', 'projet_special'].includes(r.release_type))
    .slice(0, 16);
  if (!albums.length) return null;

  const typeLabel = (t) => (t === 'ep' ? 'EP' : t === 'projet_special' ? 'Projet spécial' : 'Album');

  return (
    <section className="py-10 md:py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Catalogue" title="Meilleurs albums" count={albums.length} />
        <CarouselRow>
          {albums.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="snap-start shrink-0 w-44 md:w-52"
            >
              <Link to={`/musique/${buildEntitySlug(r.title, r.id)}`} className="group block">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-card mb-3 shadow-lg shadow-black/20">
                  {r.cover_url ? (
                    <img
                      src={r.cover_url}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 size={36} className="text-primary/25" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isPlayable(r) ? (
                      <PlayReleaseButton release={r} size="md" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
                        <Play size={18} className="text-primary-foreground ml-1" fill="currentColor" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="font-heading font-bold text-sm truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {typeLabel(r.release_type)}
                  {r.release_date ? ` • ${new Date(r.release_date).getFullYear()}` : ''}
                </p>
              </Link>
            </motion.div>
          ))}
        </CarouselRow>
      </div>
    </section>
  );
}