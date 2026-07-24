import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mic, Video, MapPin, Phone, Mail, Instagram, ExternalLink } from 'lucide-react';
import SectionHeader from './SectionHeader';

const typeLabels = {
  studio_enregistrement: "Studio d'enregistrement",
  cameraman: 'Caméraman',
  studio_mixage: 'Studio de mixage',
  autre: 'Prestataire',
};

const typeIcon = {
  studio_enregistrement: Mic,
  cameraman: Video,
  studio_mixage: Mic,
  autre: Mic,
};

function ProviderCard({ p }) {
  const Icon = typeIcon[p.type] || Mic;
  return (
    <div className="shrink-0 w-64 bg-card border border-border/50 rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:border-primary/40 transition-colors">
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-secondary">
        {p.photo_url ? (
          <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon size={40} className="text-primary/40" />
          </div>
        )}
        <span className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-[10px] font-semibold px-2 py-1 rounded-full">
          {typeLabels[p.type] || p.type}
        </span>
      </div>
      <div className="p-4">
        <p className="font-heading font-bold text-sm truncate">{p.name}</p>
        {p.city && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin size={11} /> {p.city}
          </p>
        )}
        {p.description && (
          <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{p.description}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          {p.phone && (
            <a href={`tel:${p.phone}`} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors" title={p.phone}>
              <Phone size={12} />
            </a>
          )}
          {p.email && (
            <a href={`mailto:${p.email}`} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors" title={p.email}>
              <Mail size={12} />
            </a>
          )}
          {p.instagram_url && (
            <a href={p.instagram_url} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors" title="Instagram">
              <Instagram size={12} />
            </a>
          )}
          {p.portfolio_url && (
            <a href={p.portfolio_url} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors" title="Portfolio">
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudioCarousel() {
  const { data: providers = [] } = useQuery({
    queryKey: ['studios-active'],
    queryFn: () => base44.entities.StudioProvider.filter({ is_active: true }, 'order', 24),
  });

  if (providers.length === 0) return null;

  const loop = [...providers, ...providers];

  return (
    <section className="py-10 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-5">
        <div className="flex items-end justify-between">
          <SectionHeader title="Studios & Caméramans" subtitle="Des professionnels disponibles pour vos projets" />
        </div>
      </div>

      <div className="relative overflow-hidden">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex gap-4 animate-marquee w-max py-2">
          {loop.map((p, i) => (
            <ProviderCard key={p.id || i} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}