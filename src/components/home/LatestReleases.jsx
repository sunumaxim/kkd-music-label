import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Music as MusicIcon } from 'lucide-react';
import SectionHeader from './SectionHeader';
import CarouselRow from './CarouselRow';
import { slugify } from '@/lib/slugify';
import PlayReleaseButton from '@/components/player/PlayReleaseButton';
import { isPlayable } from '@/lib/releaseTracks';

const TYPE_LABELS = { single: 'Single', album: 'Album', ep: 'EP', projet_special: 'Projet' };

export default function LatestReleases({ releases }) {
  if (!releases || releases.length === 0) return null;
  const items = releases.slice(0, 16);

  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Nouveautés" title="Dernières Sorties" to="/musique" count={items.length} />
        <CarouselRow>
          {items.map((r, i) => {
            const slug = `${slugify(r.title)}--${r.id}`;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="snap-start shrink-0 w-40 md:w-48"
              >
                <Link to={`/musique/${slug}`} className="group block">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-card mb-3 shadow-lg shadow-black/20">
                    {r.cover_url ? (
                      <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary">
                        <MusicIcon size={36} className="text-primary/25" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isPlayable(r) ? (
                        <PlayReleaseButton release={r} size="md" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl">
                          <Play size={18} className="text-white ml-0.5" fill="white" />
                        </div>
                      )}
                    </div>
                    {r.release_type && (
                      <span className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-wider bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[r.release_type] || r.release_type}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm leading-snug truncate group-hover:text-primary transition-colors">{r.title}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{r.artist_name}</p>
                </Link>
              </motion.div>
            );
          })}
        </CarouselRow>
      </div>
    </section>
  );
}