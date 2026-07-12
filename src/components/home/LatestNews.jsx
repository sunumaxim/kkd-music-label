import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SectionHeader from './SectionHeader';

const CATEGORY_LABELS = { communique: 'Communiqué', nouveaute: 'Nouveauté', article: 'Article', info_artiste: 'Info Artiste' };

export default function LatestNews({ news }) {
  if (!news || news.length === 0) return null;
  const items = news.slice(0, 4);
  const [lead, ...rest] = items;

  return (
    <section className="py-12 md:py-20 px-4 md:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Newsroom" title="Blog & Actualités" to="/actualites" count={items.length} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {lead && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              className="lg:col-span-2 lg:row-span-2"
            >
              <Link to={`/actualites/${lead.id}`} className="group block h-full">
                <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full rounded-2xl overflow-hidden bg-card mb-4">
                  {lead.image_url ? (
                    <img src={lead.image_url} alt={lead.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                      <span className="font-display text-4xl font-bold text-primary/30">KKD</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    {lead.category && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-black/40 backdrop-blur px-2 py-0.5 rounded">
                        {CATEGORY_LABELS[lead.category] || lead.category.replace('_', ' ')}
                      </span>
                    )}
                    <h3 className="font-heading font-bold text-lg md:text-2xl text-white mt-2 group-hover:text-primary transition-colors line-clamp-2">{lead.title}</h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
          {rest.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: Math.min(i * 0.06, 0.3) }}
            >
              <Link to={`/actualites/${item.id}`} className="group flex gap-4">
                <div className="shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-card">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/15 to-secondary flex items-center justify-center">
                      <span className="font-display text-xl font-bold text-primary/30">KKD</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.category && (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-primary">
                        {CATEGORY_LABELS[item.category] || item.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{item.title}</h3>
                  {item.publish_date && (
                    <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                      {format(new Date(item.publish_date), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}