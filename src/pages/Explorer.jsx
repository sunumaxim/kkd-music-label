import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Music as MusicIcon, Play, ChevronRight, Loader2, SlidersHorizontal, X, TrendingUp, Flame, Clock, Disc3, Users } from 'lucide-react';
import PageMeta from '@/components/shared/PageMeta';
import MobileHeader from '@/components/mobile/MobileHeader';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { buildEntitySlug } from '@/lib/slugify';

const SORTS = [
  { value: 'populaire', label: 'Populaire', icon: Flame },
  { value: 'recent', label: 'Récent', icon: Clock },
  { value: 'ancien', label: 'Ancien', icon: Disc3 },
  { value: 'az', label: 'A → Z', icon: TrendingUp },
];

const TYPES = [
  { value: 'all', label: 'Tous types' },
  { value: 'single', label: 'Singles' },
  { value: 'album', label: 'Albums' },
  { value: 'ep', label: 'EP' },
  { value: 'projet_special', label: 'Projets' },
];

const POPULARITY = [
  { value: 'all', label: 'Toute popularité' },
  { value: 'top', label: 'Tendance (10K+)' },
  { value: 'rising', label: 'En vogue (1K+)' },
  { value: 'new', label: 'Nouveaux (<1K)' },
];

function popularityTier(r) {
  const score = (r.plays_count || 0) + (r.likes_count || 0);
  if (score >= 10000) return 'top';
  if (score >= 1000) return 'rising';
  return 'new';
}

function scoreOf(r) {
  return (r.plays_count || 0) + (r.likes_count || 0) * 3;
}

export default function Explorer() {
  const player = usePlayer();
  const [genre, setGenre] = useState('all');
  const [year, setYear] = useState('all');
  const [type, setType] = useState('all');
  const [popularity, setPopularity] = useState('all');
  const [sort, setSort] = useState('populaire');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: releases = [], isLoading: releasesLoading } = useQuery({
    queryKey: ['explorer-releases'],
    queryFn: () => base44.entities.Release.list('-release_date', 300),
  });

  const { data: artists = [] } = useQuery({
    queryKey: ['explorer-artists'],
    queryFn: () => base44.entities.Artist.list('order', 300),
  });

  // Map artist_name -> genre
  const genreByArtist = useMemo(() => {
    const map = {};
    artists.forEach((a) => { if (a.name && a.genre) map[a.name.toLowerCase()] = a.genre; });
    return map;
  }, [artists]);

  const genres = useMemo(() => {
    const set = new Set();
    artists.forEach((a) => a.genre && set.add(a.genre));
    return ['all', ...[...set].sort()];
  }, [artists]);

  const years = useMemo(() => {
    const set = new Set();
    releases.forEach((r) => { if (r.release_date) set.add(r.release_date.slice(0, 4)); });
    return ['all', ...[...set].sort((a, b) => b.localeCompare(a))];
  }, [releases]);

  const filtered = useMemo(() => {
    let out = releases;
    if (genre !== 'all') out = out.filter((r) => (genreByArtist[r.artist_name?.toLowerCase()] || '').toLowerCase() === genre.toLowerCase());
    if (year !== 'all') out = out.filter((r) => r.release_date && r.release_date.slice(0, 4) === year);
    if (type !== 'all') out = out.filter((r) => (r.release_type || 'single') === type);
    if (popularity !== 'all') out = out.filter((r) => popularityTier(r) === popularity);

    const sorted = [...out];
    if (sort === 'populaire') sorted.sort((a, b) => scoreOf(b) - scoreOf(a));
    else if (sort === 'recent') sorted.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
    else if (sort === 'ancien') sorted.sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
    else if (sort === 'az') sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    return sorted;
  }, [releases, genre, year, type, popularity, sort, genreByArtist]);

  // Artistes à découvrir : ceux dont la popularité est faible/moyenne mais présents
  const discoverArtists = useMemo(() => {
    if (genre !== 'all') {
      const matching = artists.filter((a) => a.genre && a.genre.toLowerCase() === genre.toLowerCase());
      return matching.slice(0, 12);
    }
    // artistes avec le moins de sorties mises en avant → "à découvrir"
    return artists.filter((a) => !a.is_featured).slice(0, 12);
  }, [artists, genre]);

  const activeFilterCount = [genre !== 'all', year !== 'all', type !== 'all', popularity !== 'all'].filter(Boolean).length;

  const reset = () => { setGenre('all'); setYear('all'); setType('all'); setPopularity('all'); setSort('populaire'); };

  const playRelease = (r) => {
    const tracks = getReleaseTracks(r);
    if (!tracks.length) return;
    player.playQueue(tracks, 0);
  };

  return (
    <div className="min-h-screen pb-24">
      <PageMeta title="Explorer — KKD Music" description="Parcourez les morceaux par genre, année et popularité. Découvrez de nouveaux artistes." />
      <MobileHeader title="Explorer" backPath="/" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* En-tête */}
        <div className="hidden md:block mb-6">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Découverte</span>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mt-2">Explorer</h1>
          <p className="text-muted-foreground mt-2 text-sm">Filtrez par genre, année et popularité pour trouver de nouveaux artistes.</p>
        </div>

        {/* Barre de tri + bouton filtres mobile */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  sort === s.value ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground border border-border/40'
                }`}
              >
                <s.icon size={13} /> {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-card border border-border/40 shrink-0"
          >
            <SlidersHorizontal size={13} /> Filtres
            {activeFilterCount > 0 && <span className="ml-0.5 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Filtres */}
        <div className={`${filtersOpen ? 'block' : 'hidden'} md:block mb-6`}>
          <FilterRow label="Genre">
            <Pill value={genre} options={genres} onChange={setGenre} allLabel="Tous genres" />
          </FilterRow>
          <FilterRow label="Année">
            <Pill value={year} options={years} onChange={setYear} allLabel="Toutes années" />
          </FilterRow>
          <FilterRow label="Type">
            <Pill value={type} options={TYPES.map((t) => t.value)} labels={Object.fromEntries(TYPES.map((t) => [t.value, t.label]))} onChange={setType} allLabel={TYPES[0].label} />
          </FilterRow>
          <FilterRow label="Popularité">
            <Pill value={popularity} options={POPULARITY.map((p) => p.value)} labels={Object.fromEntries(POPULARITY.map((p) => [p.value, p.label]))} onChange={setPopularity} allLabel={POPULARITY[0].label} />
          </FilterRow>

          {activeFilterCount > 0 && (
            <button onClick={reset} className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <X size={13} /> Réinitialiser les filtres
            </button>
          )}
        </div>

        {/* Compteur */}
        {!releasesLoading && (
          <p className="text-sm text-muted-foreground mb-4">
            <span className="text-foreground font-medium">{filtered.length}</span> morceau{filtered.length !== 1 ? 'x' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grille de résultats */}
        {releasesLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MusicIcon size={40} className="text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun morceau ne correspond à ces filtres.</p>
            {activeFilterCount > 0 && <button onClick={reset} className="mt-3 text-primary text-sm hover:underline">Réinitialiser</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((r) => {
              const tracks = getReleaseTracks(r);
              const slug = buildEntitySlug(r.title, r.id);
              const g = genreByArtist[r.artist_name?.toLowerCase()];
              return (
                <Link key={r.id} to={`/musique/${slug}`} className="group">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary mb-2">
                    {r.cover_url ? (
                      <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><MusicIcon size={32} className="text-muted-foreground/30" /></div>
                    )}
                    {tracks.length > 0 && (
                      <button
                        onClick={(e) => { e.preventDefault(); playRelease(r); }}
                        className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0"
                      >
                        <Play size={16} className="ml-0.5" fill="currentColor" />
                      </button>
                    )}
                    {r.is_featured && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">⭐</span>
                    )}
                  </div>
                  <p className="font-heading font-bold text-sm truncate group-hover:text-primary transition-colors">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.artist_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {g && <span className="text-[10px] text-primary/80 truncate">{g}</span>}
                    <span className="text-[10px] text-muted-foreground/70 ml-auto">{scoreOf(r) >= 1000 ? `${(scoreOf(r) / 1000).toFixed(0)}K` : scoreOf(r)} ▶</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Artistes à découvrir */}
        {discoverArtists.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-primary" />
              <h2 className="font-display font-bold text-xl">Artistes à découvrir</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {discoverArtists.map((a) => (
                <Link key={a.id} to={`/artistes/${buildEntitySlug(a.name, a.id)}`} className="shrink-0 w-28 text-center group">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary mx-auto mb-2">
                    {a.photo_url ? (
                      <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><MusicIcon size={28} className="text-muted-foreground/30" /></div>
                    )}
                  </div>
                  <p className="font-heading font-bold text-xs truncate">{a.name}</p>
                  {a.genre && <p className="text-[10px] text-muted-foreground truncate">{a.genre}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, children }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70 w-20 shrink-0 pt-1.5">{label}</span>
      <div className="flex flex-wrap gap-2 flex-1">{children}</div>
    </div>
  );
}

function Pill({ value, options, onChange, allLabel, labels }) {
  return options.map((opt) => (
    <button
      key={opt}
      onClick={() => onChange(opt)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        value === opt
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      {opt === 'all' ? allLabel : (labels ? labels[opt] : opt)}
    </button>
  ));
}