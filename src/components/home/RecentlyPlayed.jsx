import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music as MusicIcon } from 'lucide-react';
import SectionHeader from './SectionHeader';
import CarouselRow from './CarouselRow';
import { useListeningHistory } from '@/hooks/useListeningHistory';
import { buildEntitySlug } from '@/lib/slugify';

/**
 * "Écoutés récemment" — étagère alimentée par l'historique local du lecteur global.
 */
export default function RecentlyPlayed() {
  const history = useListeningHistory();
  if (!history.length) return null;

  const items = history.slice(0, 16);

  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Reprendre" title="Écoutés récemment" count={items.length} />
        <CarouselRow>
          {items.map((h, i) => {
            const to =
              h.item_type === 'video' && h.item_id
                ? `/videos/${h.item_id}`
                : h.item_id
                  ? `/musique/${buildEntitySlug(h.title, h.item_id)}`
                  : null;
            const inner = (
              <>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-card mb-3 shadow-lg shadow-black/20">
                  {h.cover_url ? (
                    <img
                      src={h.cover_url}
                      alt={h.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary">
                      <MusicIcon size={36} className="text-primary/25" />
                    </div>
                  )}
                </div>
                <h3 className="font-heading font-bold text-sm leading-snug truncate">{h.title}</h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{h.artist_name}</p>
              </>
            );
            const cls = `snap-start shrink-0 w-40 md:w-48 ${to ? 'group block' : 'block'}`;
            const content = to ? (
              <Link to={to} className={cls}>
                {inner}
              </Link>
            ) : (
              <div className={cls}>{inner}</div>
            );
            return (
              <motion.div
                key={h.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                {content}
              </motion.div>
            );
          })}
        </CarouselRow>
      </div>
    </section>
  );
}