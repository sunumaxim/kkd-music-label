import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, ChevronLeft, ChevronRight } from 'lucide-react';
import UniversalPlayer from '@/components/shared/UniversalPlayer';
import { buildEntitySlug } from '@/lib/slugify';

const TYPE_LABELS = {
  single: 'Single',
  album: 'Album',
  ep: 'EP',
  projet_special: 'Projet spécial',
};

const TYPE_COLORS = {
  single: 'bg-blue-500/10 text-blue-400',
  album: 'bg-purple-500/10 text-purple-400',
  ep: 'bg-orange-500/10 text-orange-400',
  projet_special: 'bg-primary/10 text-primary',
};

export default function ArtistReleasesCarousel({ releases = [] }) {
  const scrollRef = useRef(null);
  const [activeType, setActiveType] = useState('all');

  if (!releases.length) return null;

  const types = ['all', ...new Set(releases.map(r => r.release_type).filter(Boolean))];
  const filtered = activeType === 'all' ? releases : releases.filter(r => r.release_type === activeType);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <Music size={18} className="text-primary" /> Discographie
        </h2>
        <div className="flex gap-1">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Filtres */}
      {types.length > 2 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                activeType === t
                  ? 'bg-primary text-white border-primary'
                  : 'border-border/50 text-muted-foreground hover:border-primary/40'
              }`}
            >
              {t === 'all' ? 'Tout' : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
      )}

      {/* Carrousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {filtered.map(r => {
          const streamUrl = r.spotify_url || r.deezer_url || r.audiomack_url || r.apple_music_url || r.youtube_url;
          return (
            <div
              key={r.id}
              className="flex-none w-52 bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/40 transition-all group"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="aspect-square relative overflow-hidden">
                {r.cover_url ? (
                  <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-card to-muted flex items-center justify-center">
                    <Music size={36} className="text-muted-foreground/30" />
                  </div>
                )}
                {r.release_type && (
                  <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[r.release_type] || 'bg-secondary text-foreground'}`}>
                    {TYPE_LABELS[r.release_type] || r.release_type}
                  </span>
                )}
              </div>
              <div className="p-3">
                <Link to={`/musique/${buildEntitySlug(r.title, r.id)}`}>
                  <p className="font-heading font-bold text-sm truncate hover:text-primary transition-colors">{r.title}</p>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{r.release_date?.slice(0, 4) || '—'}</p>
                {streamUrl && (
                  <div className="mt-2">
                    <UniversalPlayer url={streamUrl} label={r.title} className="w-full" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}