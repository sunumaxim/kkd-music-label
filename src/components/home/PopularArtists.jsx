import React from 'react';
import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';
import CarouselRow from './CarouselRow';
import ArtistCard from '@/components/brand/ArtistCard';

export default function PopularArtists({ artists }) {
  if (!artists || artists.length === 0) return null;
  const items = [...artists]
    .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
    .slice(0, 12);

  return (
    <section className="py-12 md:py-20 px-4 md:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Le Roster" title="Artistes populaires" to="/artistes" count={items.length} />
        <CarouselRow>
          {items.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="snap-start shrink-0 w-44 md:w-52"
            >
              <ArtistCard artist={a} />
            </motion.div>
          ))}
        </CarouselRow>
      </div>
    </section>
  );
}