import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Headphones } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { buildEntitySlug } from '@/lib/slugify';
import PlayReleaseButton from '@/components/player/PlayReleaseButton';
import LikeButton from '@/components/shared/LikeButton';
import { isPlayable } from '@/lib/releaseTracks';

/**
 * "Trending Songs" — Top Charts style Audiomack / Spotify
 * - Numérotation stylisée avec badges Top 1, 2, 3
 * - Filtres par genre en capsules pill
 * - Indication D2C / Prix direct
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
    { key: 'hot', label: '🔥 Top Tendance' },
    { key: 'new', label: '✨ Récents' },
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
    return list.slice(0, 24);
  }, [releases, sub, genreMap]);

  return (
    <section className="py-10 md:py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Classement" title="Top Tendances & Ventes" count={filtered.length} />

        {/* Sous-onglets genre (Spotify / Audiomack Pill Chips) */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setSub(t.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                sub === t.key
                  ? 'bg-primary text-black font-black shadow-md shadow-primary/25 scale-105'
                  : 'bg-[#181d26] text-zinc-300 hover:text-white hover:bg-[#232936] border border-white/[0.06]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grille des Titres (Style Spotify 2 colonnes / Audiomack Chart) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filtered.map((r, i) => {
            const isTop3 = i < 3;
            const rankBadgeColor =
              i === 0
                ? 'bg-amber-400 text-black font-black'
                : i === 1
                ? 'bg-zinc-300 text-black font-black'
                : i === 2
                ? 'bg-amber-600 text-white font-black'
                : 'text-zinc-500 font-bold';

            return (
              <div
                key={r.id}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#141821] hover:bg-[#1c222f] border border-white/[0.06] hover:border-white/[0.15] transition-all group select-none"
              >
                {/* Numéro de classement */}
                <div className="w-6 text-center shrink-0">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-mono rounded-md ${
                      isTop3 ? `${rankBadgeColor} w-5 h-5 shadow-sm` : rankBadgeColor
                    }`}
                  >
                    {i + 1}
                  </span>
                </div>

                {/* Cover avec bouton play overlay */}
                <Link
                  to={`/musique/${buildEntitySlug(r.title, r.id)}`}
                  className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow"
                >
                  {r.cover_url ? (
                    <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={14} className="text-zinc-500" />
                    </div>
                  )}
                  {r.is_for_sale && (
                    <span className="absolute bottom-0 inset-x-0 bg-amber-500/90 text-black text-[8px] font-black text-center py-0.2 uppercase">
                      D2C
                    </span>
                  )}
                </Link>

                {/* Métadonnées */}
                <Link
                  to={`/musique/${buildEntitySlug(r.title, r.id)}`}
                  className="flex-1 min-w-0"
                >
                  <p className="font-bold text-sm text-white truncate group-hover:text-primary transition-colors">
                    {r.title}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{r.artist_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                      <Headphones size={10} className="text-primary" />
                      {(r.plays_count || 0).toLocaleString('fr-FR')}
                    </span>
                    {r.is_for_sale && Number(r.price) > 0 && (
                      <span className="text-[10px] font-bold text-amber-400">
                        {Number(r.price).toLocaleString('fr-FR')} F
                      </span>
                    )}
                  </div>
                </Link>

                {/* Bouton de lecture rapide */}
                <div className="shrink-0 flex items-center gap-1">
                  {isPlayable(r) ? (
                    <PlayReleaseButton release={r} size="sm" />
                  ) : (
                    <Link
                      to={`/musique/${buildEntitySlug(r.title, r.id)}`}
                      className="w-8 h-8 rounded-full bg-primary/20 hover:bg-primary text-primary hover:text-black flex items-center justify-center transition-all"
                    >
                      <Play size={13} fill="currentColor" className="ml-0.5" />
                    </Link>
                  )}
                  <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="shrink-0">
                    <LikeButton targetType="release" targetId={r.id} title={r.title} artistName={r.artist_name} coverUrl={r.cover_url} size={16} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
