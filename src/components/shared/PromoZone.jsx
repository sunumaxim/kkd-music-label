import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ExternalLink, Megaphone } from 'lucide-react';

/**
 * Zone de promotion dynamique — bannières sponsors contrôlées par l'admin.
 * Affiche des bannières image (cliquables vers un lien externe) ou un site
 * embarqué en iframe (« afficher à travers le lien » / habillage).
 */
export default function PromoZone({ placement = 'top_banner' }) {
  const { data: promos = [] } = useQuery({
    queryKey: ['promo-banners', placement],
    queryFn: () => base44.entities.PromoBanner.list('order'),
    staleTime: 60000,
  });

  const active = useMemo(() => {
    const now = new Date();
    return promos
      .filter((p) => p.is_active && p.type === 'banner' && (p.placement || 'top_banner') === placement)
      .filter((p) => {
        const start = p.start_date ? new Date(p.start_date) : null;
        const end = p.end_date ? new Date(p.end_date) : null;
        return (!start || start <= now) && (!end || end >= now);
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [promos, placement]);

  if (!active.length) return null;

  return (
    <div className="px-4 md:px-8 pt-4 max-w-7xl mx-auto w-full">
      <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {active.map((p) => (
          <div
            key={p.id}
            className="relative shrink-0 w-[86vw] sm:w-[520px] h-28 sm:h-32 rounded-2xl overflow-hidden bg-card border border-border/40"
          >
            {p.embed_url ? (
              <iframe
                src={p.embed_url}
                title={p.title}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                loading="lazy"
              />
            ) : p.image_url ? (
              <a
                href={p.link_url || '#'}
                target={p.link_url ? '_blank' : undefined}
                rel="noreferrer"
                className="block w-full h-full"
              >
                <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
              </a>
            ) : (
              <a
                href={p.link_url || '#'}
                target={p.link_url ? '_blank' : undefined}
                rel="noreferrer"
                className="flex w-full h-full items-center gap-3 p-4 bg-gradient-to-r from-primary/15 to-transparent"
              >
                <Megaphone size={28} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-heading font-bold text-sm truncate">{p.title}</p>
                  {p.text && <p className="text-xs text-muted-foreground truncate">{p.text}</p>}
                </div>
                <ExternalLink size={14} className="text-muted-foreground ml-auto shrink-0" />
              </a>
            )}
            <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full">
              {p.sponsor_name ? `Sponsorisé · ${p.sponsor_name}` : 'KKD Music'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}