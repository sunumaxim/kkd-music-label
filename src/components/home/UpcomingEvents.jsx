import React from 'react';
import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';
import EventCard from '@/components/brand/EventCard';

export default function UpcomingEvents({ events }) {
  if (!events || events.length === 0) return null;
  const items = events.slice(0, 6);

  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Agenda" title="Événements" to="/evenements" count={items.length} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: Math.min(i * 0.06, 0.3) }}
            >
              <EventCard event={e} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}