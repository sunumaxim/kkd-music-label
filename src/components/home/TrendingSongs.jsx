import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Headphones } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { buildEntitySlug } from '@/lib/slugify';

/**
 * "Trending Songs" — liste des sorties tendance avec sous-onglets genre.
 * Hot = popularité (écoutes + likes), Nouveau = récent, puis genres déduits des artistes.
 */
export default function TrendingSongs({ releases = [], artists = [] }) {
  const [sub, setSub] = useState('hot');

  const genreMap = useMemo(
    () => new Map(artists.map((a) => [a.name, a.genre]).filter(([, g]) => g)),
    [artists]
  );

  const genres = useMemo(() => {
    const set = new Set();
    releases.forEach((r) => {
      const g = genreMap.get(r.artist_name);
      if (g) set.add(g);
    });
    return [...set].slice(0, 6);
  }, [releases, genreMap]);

  const tabs = [
    { key: 'hot', label: 'Hot' },
    { key: 'new', label: 'Nouveau' },
    ...genres.map((g) => ({ key: g, label: g })),
  ];

  const filtered = useMemo(() => {
    let list = [...releases];
    if (sub === 'hot') {
      list.sort(
        (a, b) =>
          (b.plays_count || 0) + (b.likes_count || 0) - ((a.plays_count || 0) + (a.likes_count || 0)) ||
          (b.created_date || '').localeCompare(a.created_date || '')
      );
    } else if (sub === 'new') {
      list.sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
    } else {
      list = list
        .filter((r) => genreMap.get(r.artist_name) === sub)
        .sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0));
    }
    return list.slice(0, 25);
  }, [releases, sub, genreMap]);

  return (
    <section className="py-10 md:py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Tendances" title="Trending Songs" count={filtered.length} />

        {/* Sous-onglets genre */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setSub(t.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                sub === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="grid sm:grid-cols-2 gap-1.5 md:gap-2">
          {filtered.map((r, i) => (
            <Link
              key={r.id}
              to={`/musique/${buildEntitySlug(r.title, r.id)}`}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60 transition-colors group"
            >
              <span className="w-6 text-center text-sm font-mono text-muted-foreground/60 shrink-0">
                {i + 1}
              </span>
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                {r.cover_url ? (
                  <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={14} className="text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm truncate group-hover:text-primary transition-colors">
                  {r.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{r.artist_name}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                <Headphones size={12} className="text-primary/70" />
                {(r.plays_count || 0).toLocaleString('fr-FR')}
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Play size={13} fill="currentColor" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}