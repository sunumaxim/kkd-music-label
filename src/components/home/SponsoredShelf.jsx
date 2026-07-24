import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Play } from 'lucide-react';
import { buildEntitySlug } from '@/lib/slugify';

/**
 * "Mis en avant" — carousel des placements sponsorisés actifs
 * (validés par l'admin, paiement reçu, période en cours).
 */
export default function SponsoredShelf() {
  const { data: placements = [] } = useQuery({
    queryKey: ['sponsored-active'],
    queryFn: () => base44.entities.SponsoredPlacement.filter({ status: 'actif' }, '-end_date', 20),
  });

  const active = useMemo(() => {
    const today = new Date();
    return placements.filter((p) => p.end_date && new Date(p.end_date) >= today);
  }, [placements]);

  if (!active.length) return null;

  return (
    <section className="py-6 md:py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-primary" />
          <h2 className="font-heading font-bold text-lg">Mis en avant</h2>
          <span className="text-[10px] font-mono uppercase text-muted-foreground/50 ml-1">Sponsorisé</span>
        </div>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {active.map((p) => {
            const to = p.release_id
              ? `/musique/${buildEntitySlug(p.release_title, p.release_id)}`
              : p.streaming_link || '#';
            const inner = (
              <div className="snap-start shrink-0 w-64 md:w-80 group">
                <div className="relative h-32 md:h-40 rounded-2xl overflow-hidden bg-card">
                  {p.cover_url ? (
                    <img
                      src={p.cover_url}
                      alt={p.release_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                      <Play size={28} className="text-primary/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <span className="absolute top-2 left-2 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Sponsorisé
                  </span>
                  <div className="absolute bottom-0 p-3">
                    <p className="font-heading font-bold text-sm text-white truncate">{p.release_title}</p>
                    {p.artist_name && <p className="text-xs text-white/70 truncate">{p.artist_name}</p>}
                  </div>
                </div>
              </div>
            );
            return p.release_id ? (
              <Link key={p.id} to={to}>{inner}</Link>
            ) : (
              <a key={p.id} href={to} target="_blank" rel="noreferrer">{inner}</a>
            );
          })}
        </div>
      </div>
    </section>
  );
}