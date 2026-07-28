import React from 'react';
import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';
import CarouselRow from './CarouselRow';
import VideoCard from '@/components/brand/VideoCard';

export default function LatestVideos({ videos }) {
  if (!videos || videos.length === 0) return null;
  const items = videos.slice(0, 10);

  return (
    <section className="py-12 md:py-20 px-4 md:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Visuels" title="Clips Récents" to="/videos" count={items.length} />
        <CarouselRow>
          {items.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="snap-start shrink-0 w-72 md:w-96"
            >
              <VideoCard video={v} />
            </motion.div>
          ))}
        </CarouselRow>
      </div>
    </section>
  );
}