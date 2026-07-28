import React from 'react';
import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';
import CarouselRow from './CarouselRow';
import ReleaseCard from '@/components/brand/ReleaseCard';
import { isPlayable } from '@/lib/releaseTracks';

export default function LatestReleases({ releases }) {
  if (!releases || releases.length === 0) return null;
  const items = releases.slice(0, 16);

  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Nouveautés" title="Dernières Sorties" to="/musique" count={items.length} />
        <CarouselRow>
          {items.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="snap-start shrink-0 w-44 md:w-52"
            >
              <ReleaseCard release={r} playable={isPlayable(r)} />
            </motion.div>
          ))}
        </CarouselRow>
      </div>
    </section>
  );
}