import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';
import CarouselRow from './CarouselRow';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import FollowButton from '@/components/artist/FollowButton';

/**
 * "Artistes populaires" — cartes artistes avec photo, nom, badge vérifié,
 * genre, compteur d'abonnés et bouton S'abonner.
 */
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
              className="snap-start shrink-0 w-40 md:w-48"
            >
              <Link to={`/artistes/${a.id}`} className="group block bg-card/60 border border-border/30 rounded-2xl p-4 hover:border-primary/40 transition-all">
                <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                  {a.photo_url ? (
                    <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary">
                      <span className="font-display text-3xl font-bold text-primary/40">{a.name?.[0]}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-sm truncate group-hover:text-primary transition-colors">{a.name}</h3>
                  {a.is_verified && <VerifiedBadge size={15} />}
                </div>
                {a.genre && <p className="text-xs text-muted-foreground truncate mt-0.5">{a.genre}</p>}
                <div onClick={(e) => e.preventDefault()} className="mt-3">
                  <FollowButton artistId={a.id} artistName={a.name} variant="card" />
                </div>
              </Link>
            </motion.div>
          ))}
        </CarouselRow>
      </div>
    </section>
  );
}