import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';
import CarouselRow from './CarouselRow';
import { slugify } from '@/lib/slugify';

export default function TrendingArtists({ artists }) {
  if (!artists || artists.length === 0) return null;
  // Trending = featured first, then by order
  const items = [...artists].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)).slice(0, 12);

  return (
    <section className="py-12 md:py-20 px-4 md:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Le Roster" title="Artistes en Tendance" to="/artistes" count={items.length} />
        <CarouselRow>
          {items.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="snap-start shrink-0 w-32 md:w-40"
            >
              <Link to={`/artistes/${a.slug || slugify(a.name)}`} className="group flex flex-col items-center text-center">
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                  {a.photo_url ? (
                    <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary">
                      <span className="font-display text-3xl font-bold text-primary/40">{a.name?.[0]}</span>
                    </div>
                  )}
                </div>
                <h3 className="font-heading font-bold text-sm md:text-base group-hover:text-primary transition-colors truncate w-full">{a.name}</h3>
                {a.genre && <p className="text-xs text-muted-foreground truncate w-full">{a.genre}</p>}
              </Link>
            </motion.div>
          ))}
        </CarouselRow>
      </div>
    </section>
  );
}