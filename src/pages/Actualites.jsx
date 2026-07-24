import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { Loader2, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const CATEGORY_LABELS = {
  communique: 'Communiqué',
  nouveaute: 'Nouveauté',
  article: 'Article',
  info_artiste: 'Info Artiste',
};

export default function Actualites() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { isRefreshing, pullY, containerRef } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries({ queryKey: ['news'] });
  });

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => base44.entities.News.filter({ is_published: true }, '-publish_date', 100),
  });

  const categories = ['all', ...Object.keys(CATEGORY_LABELS).filter(k => news.some(n => n.category === k))];

  const filtered = news.filter(n => {
    const matchCat = activeCategory === 'all' || n.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      n.title?.toLowerCase().includes(q) ||
      n.excerpt?.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q) ||
      n.tags?.some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div ref={containerRef} className="min-h-screen pb-24">
      {(isRefreshing || pullY > 20) && (
        <div className="md:hidden flex justify-center pb-2 pt-4 text-primary">
          <Loader2 size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-16 md:pt-24 pb-8 max-w-7xl mx-auto">
        <span className="text-xs font-mono text-primary tracking-widest uppercase">KKD Music</span>
        <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight mt-2 mb-8">
          Actualités
        </h1>

        {/* Search bar */}
        <div className="relative mb-5 max-w-lg">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par titre, artiste, tag..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-mono uppercase tracking-wider px-4 py-2 rounded-full border transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {cat === 'all' ? 'Tout' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 max-w-7xl mx-auto space-y-4">
          <div className="aspect-[21/9] rounded-2xl bg-card animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => <div key={i} className="aspect-[4/3] rounded-xl bg-card animate-pulse" />)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-20">{searchQuery ? `Aucun résultat pour "${searchQuery}".` : 'Aucune actualité pour le moment.'}</p>
      ) : (
        <div className="px-4 max-w-7xl mx-auto space-y-8">

          {/* Featured article */}
          {featured && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Link to={`/actualites/${featured.id}`} className="group block">
                <div className="relative aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden bg-card">
                  {featured.image_url ? (
                    <img
                      src={featured.image_url}
                      alt={featured.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary to-black" />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                    <div className="flex items-center gap-3 mb-3">
                      {featured.category && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white bg-primary px-3 py-1 rounded-full">
                          {CATEGORY_LABELS[featured.category]}
                        </span>
                      )}
                      {featured.publish_date && (
                        <span className="text-[10px] font-mono text-white/60">
                          {format(new Date(featured.publish_date), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-2xl md:text-4xl font-extrabold text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="text-white/70 mt-2 text-sm line-clamp-2 max-w-2xl hidden md:block">{featured.excerpt}</p>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Grid of remaining articles */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/actualites/${item.id}`} className="group block h-full">
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
                      {item.category && (
                        <span className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-wider text-white bg-primary/90 px-2 py-1 rounded-full">
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      )}
                    </div>
                    {item.publish_date && (
                      <p className="text-[10px] font-mono text-muted-foreground mb-1">
                        {format(new Date(item.publish_date), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    )}
                    <h3 className="font-heading font-bold text-base group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{item.excerpt}</p>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}