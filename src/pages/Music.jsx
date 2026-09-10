import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import {
  Loader2, Music as MusicIcon, Search, X, Play, Pause, LayoutGrid, List,
  Lock, ShoppingBag, Sparkles, Disc, Check
} from 'lucide-react';
import PageMeta from '@/components/shared/PageMeta';
import MusicCard from '@/components/music/MusicCard';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { useMyPurchases } from '@/hooks/useMyPurchases';

const FILTERS = [
  { value: 'all', label: 'Tout le Catalogue' },
  { value: 'free', label: '🎧 Gratuit (Streaming Libre)' },
  { value: 'paid', label: '💎 En Vente Exclusive' },
  { value: 'single', label: 'Singles' },
  { value: 'album', label: 'Albums & EPs' },
];

export default function Music() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const queryClient = useQueryClient();
  const player = usePlayer();
  const myPurchases = useMyPurchases();

  const { isRefreshing, pullY, containerRef } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries({ queryKey: ['releases'] });
  });

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['releases'],
    queryFn: () => base44.entities.Release.list('-release_date', 200),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Filtrage par catégorie / gratuit / payant + recherche texte
  let filtered = releases;

  if (activeFilter === 'free') {
    filtered = filtered.filter((r) => !r.is_for_sale || Number(r.price) <= 0);
  } else if (activeFilter === 'paid') {
    filtered = filtered.filter((r) => r.is_for_sale && Number(r.price) > 0);
  } else if (activeFilter === 'single') {
    filtered = filtered.filter((r) => r.release_type === 'single');
  } else if (activeFilter === 'album') {
    filtered = filtered.filter((r) => r.release_type === 'album' || r.release_type === 'ep');
  }

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.artist_name?.toLowerCase().includes(q)
    );
  }

  const freeReleases = releases.filter((r) => !r.is_for_sale || Number(r.price) <= 0);
  const paidReleases = releases.filter((r) => r.is_for_sale && Number(r.price) > 0);

  // Collecte de toutes les pistes gratuites pour la lecture Spotify en continu
  const allFreeTracks = freeReleases.flatMap((r) => getReleaseTracks(r));

  const handlePlayAllFree = () => {
    if (allFreeTracks.length > 0) {
      player.playQueue(allFreeTracks, 0);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0f1115] text-white px-4 py-12 md:py-20">
      <PageMeta
        title="Catalogue Musical Spotify-Grade — KKD Music"
        description="Écoutez la musique gratuite en streaming illimité style Spotify, ou soutenez vos artistes en achetant leurs titres exclusifs."
      />

      {(isRefreshing || pullY > 20) && (
        <div className="md:hidden flex justify-center pb-2 -mt-8 text-primary">
          <Loader2 size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Spotify-style Header Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950/50 via-[#131722] to-black border border-white/[0.08] p-6 sm:p-10 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1ed760]/10 border border-[#1ed760]/30 text-[#1ed760] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Streaming Libre & Boutique D2C
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-white">
              Catalogue Musical
            </h1>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              Profitez d'un lecteur complet style Spotify pour écouter gratuitement les titres en accès libre.
              Pour les œuvres exclusives mises en vente, achetez votre licence via Wave ou Orange Money pour soutenir
              directement les créateurs.
            </p>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handlePlayAllFree}
                disabled={allFreeTracks.length === 0}
                className="h-12 px-6 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] active:scale-95 text-black font-extrabold text-sm flex items-center gap-2.5 shadow-xl transition-all shadow-[#1ed760]/20"
              >
                <Play size={18} fill="currentColor" />
                <span>Écouter le Catalogue Gratuit</span>
              </button>

              <Link
                to="/devenir-artiste"
                className="h-12 px-6 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 active:scale-95 text-white font-bold text-sm flex items-center gap-2 transition-all"
              >
                <Disc size={18} className="text-primary" />
                <span>Publier ma Musique</span>
              </Link>
            </div>
          </div>

          {/* Decorative stats */}
          <div className="mt-8 pt-6 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-zinc-400 font-mono">Streaming Gratuit</p>
              <p className="text-lg sm:text-xl font-black text-[#1ed760]">{freeReleases.length} titres libres</p>
            </div>
            <div>
              <p className="text-zinc-400 font-mono">En Vente Exclusive</p>
              <p className="text-lg sm:text-xl font-black text-amber-400">{paidReleases.length} œuvres D2C</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-zinc-400 font-mono">Qualité Audio</p>
              <p className="text-lg sm:text-xl font-black text-white">Master 24-Bit / 44.1kHz</p>
            </div>
          </div>
        </div>

        {/* Controls Bar: Search, Filters & View Toggle */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un morceau, un artiste, un genre…"
                className="w-full pl-11 pr-10 py-3 rounded-full bg-[#181818] border border-white/[0.1] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#1ed760] transition-colors shadow-inner"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  aria-label="Effacer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-full border border-white/[0.08] self-start md:self-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Affichage en Grille Spotify"
              >
                <LayoutGrid size={17} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'list'
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Affichage en Liste Spotify"
              >
                <List size={17} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeFilter === f.value
                    ? 'bg-white text-black shadow-md'
                    : 'bg-[#181818] text-zinc-300 hover:text-white hover:bg-white/10 border border-white/[0.06]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse bg-[#141414] rounded-2xl p-3 space-y-3">
                <div className="aspect-square bg-zinc-800 rounded-xl" />
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-[#141414] border border-white/[0.05] p-8">
            <MusicIcon size={48} className="text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Aucune sortie trouvée</h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-4">
              {search
                ? `Aucun morceau ne correspond à "${search}".`
                : "Aucune musique n'est disponible dans cette catégorie pour le moment."}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs font-bold text-[#1ed760] hover:underline"
              >
                Réinitialiser la recherche
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View: Spotify Cards */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((release) => (
              <MusicCard key={release.id} release={release} />
            ))}
          </div>
        ) : (
          /* List View: Spotify Table / Tracklist */
          <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-mono uppercase text-zinc-400 border-b border-white/[0.06]">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6 sm:col-span-5">Titre & Artiste</div>
              <div className="hidden sm:block sm:col-span-3">Format / Genre</div>
              <div className="col-span-5 sm:col-span-3 text-right pr-2">Accès & Action</div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {filtered.map((release, idx) => {
                const isPaid = Boolean(release.is_for_sale && Number(release.price) > 0);
                const hasPurchased = Boolean(myPurchases.some((p) => p.item_id === release.id));
                const tracks = getReleaseTracks(release, { hasPurchased });
                const isPlayable = tracks.length > 0;
                const isCurrent = player.current?.item_id === release.id;
                const isPlaying = isCurrent && player.isPlaying;

                return (
                  <div
                    key={release.id}
                    className={`grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-white/[0.05] transition-colors group ${
                      isCurrent ? 'bg-white/[0.04]' : ''
                    }`}
                  >
                    {/* Index or Play Button */}
                    <div className="col-span-1 text-center flex items-center justify-center">
                      {isPlayable ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            if (isCurrent) player.togglePlay();
                            else player.playQueue(tracks, 0);
                          }}
                          className="w-7 h-7 rounded-full bg-[#1ed760] text-black flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 hover:brightness-110"
                        >
                          {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                        </button>
                      ) : (
                        <Lock size={14} className="text-amber-400 group-hover:hidden" />
                      )}
                      <span className={`text-xs text-zinc-400 font-mono ${isPlayable ? 'group-hover:hidden' : ''}`}>
                        {idx + 1}
                      </span>
                    </div>

                    {/* Title, Artist, Cover */}
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 shadow">
                        {release.cover_url ? (
                          <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Disc size={18} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/musique/${release.slug || release.id}`}
                          className={`text-sm font-bold truncate block hover:underline ${
                            isCurrent ? 'text-[#1ed760]' : 'text-white'
                          }`}
                        >
                          {release.title}
                        </Link>
                        <p className="text-xs text-zinc-400 truncate">{release.artist_name}</p>
                      </div>
                    </div>

                    {/* Format / Genre */}
                    <div className="hidden sm:block sm:col-span-3 text-xs text-zinc-400 truncate">
                      <span className="capitalize">{release.release_type || 'Single'}</span>
                      {release.genre && <span> • {release.genre}</span>}
                    </div>

                    {/* Access & Action */}
                    <div className="col-span-5 sm:col-span-3 flex items-center justify-end gap-2 pr-2">
                      {hasPurchased ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <Check size={12} strokeWidth={3} /> Acheté
                        </span>
                      ) : isPaid ? (
                        <Link
                          to={`/musique/${release.slug || release.id}`}
                          className="h-8 px-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <ShoppingBag size={13} />
                          <span>{Number(release.price).toLocaleString('fr-FR')} F</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => isPlayable && player.playQueue(tracks, 0)}
                          className="h-8 px-3 rounded-full bg-[#1ed760]/20 hover:bg-[#1ed760] text-[#1ed760] hover:text-black font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                        >
                          <Sparkles size={12} />
                          <span>Gratuit</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
