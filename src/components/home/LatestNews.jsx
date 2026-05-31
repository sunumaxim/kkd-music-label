import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function LatestNews({ news }) {
  if (!news || news.length === 0) return null;

  return (
    <section className="py-20 md:py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-mono text-primary tracking-widest uppercase">News</span>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight mt-2">
              Actualités
            </h2>
          </div>
          <Link to="/actualites" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.slice(0, 3).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/actualites/${item.id}`} className="group block">
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-card mb-4">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                      <span className="font-display text-3xl font-bold text-primary/30">KKD</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {item.category && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary">
                      {item.category.replace('_', ' ')}
                    </span>
                  )}
                  {item.publish_date && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {format(new Date(item.publish_date), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-bold text-base group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h3>
                {item.excerpt && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.excerpt}</p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}