import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function NewsPage() {
  const { data: news, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => base44.entities.News.list('-created_date', 100),
    initialData: [],
  });

  return (
    <div className="min-h-screen px-4 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">News</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-2">
            Actualités
          </h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[16/10] rounded-xl bg-card animate-pulse" />
                <div className="h-4 bg-card rounded animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">Aucune actualité pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
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
                        <span className="font-display text-3xl font-bold text-primary/20">KKD</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {item.category && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {item.category.replace('_', ' ')}
                      </span>
                    )}
                    {item.publish_date && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {format(new Date(item.publish_date), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{item.excerpt}</p>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}