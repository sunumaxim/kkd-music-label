import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import MobileHeader from '@/components/mobile/MobileHeader';
import { slugify } from '@/lib/slugify';

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-display font-bold text-lg mb-3">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [input, setInput] = useState(q);

  useEffect(() => { setInput(q); }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      const [releases, artists, videos] = await Promise.all([
        base44.entities.Release.list('-created_date', 50),
        base44.entities.Artist.list('order', 50),
        base44.entities.Video.list('-created_date', 50),
      ]);
      const ql = q.toLowerCase();
      return {
        releases: releases.filter((r) => (`${r.title} ${r.artist_name || ''}`).toLowerCase().includes(ql)),
        artists: artists.filter((a) => (`${a.name} ${a.genre || ''}`).toLowerCase().includes(ql)),
        videos: videos.filter((v) => (`${v.title} ${v.artist_name || ''}`).toLowerCase().includes(ql)),
      };
    },
    enabled: !!q,
  });

  const submit = (e) => {
    e.preventDefault();
    if (input.trim()) setParams({ q: input.trim() });
  };

  const empty = data && data.releases.length === 0 && data.artists.length === 0 && data.videos.length === 0;

  return (
    <div className="min-h-screen pb-24">
      <MobileHeader title="Rechercher" backPath="/" />
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-12">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold mb-4 hidden md:block">Rechercher</h1>

        <form onSubmit={submit} className="relative mb-8">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Musique, artiste, vidéo…"
            className="w-full pl-10 pr-4 py-3 rounded-full bg-secondary border border-border/40 text-sm focus:outline-none focus:border-primary/50"
          />
        </form>

        {!q && <p className="text-muted-foreground text-sm">Tapez une recherche pour trouver des sorties, artistes et vidéos.</p>}
        {isLoading && <Loader2 className="animate-spin text-primary" />}
        {empty && <p className="text-muted-foreground text-sm">Aucun résultat pour « {q} ».</p>}

        {data?.artists.length > 0 && (
          <Section title="Artistes">
            {data.artists.map((a) => (
              <Link key={a.id} to={`/artistes/${a.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 transition-colors">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary shrink-0">
                  {a.photo_url && <img src={a.photo_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-bold text-sm truncate">{a.name}</p>
                  {a.genre && <p className="text-xs text-muted-foreground truncate">{a.genre}</p>}
                </div>
              </Link>
            ))}
          </Section>
        )}

        {data?.releases.length > 0 && (
          <Section title="Sorties">
            {data.releases.map((r) => (
              <Link key={r.id} to={`/musique/${slugify(r.title)}--${r.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 transition-colors">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {r.cover_url && <img src={r.cover_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold text-sm truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.artist_name}</p>
                </div>
                {r.is_for_sale && r.price > 0 && (
                  <span className="text-xs font-bold text-primary">{Number(r.price).toFixed(2)} €</span>
                )}
              </Link>
            ))}
          </Section>
        )}

        {data?.videos.length > 0 && (
          <Section title="Vidéos">
            {data.videos.map((v) => (
              <Link key={v.id} to={`/videos/${v.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 transition-colors">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold text-sm truncate">{v.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{v.artist_name}</p>
                </div>
                {v.is_for_sale && v.price > 0 && (
                  <span className="text-xs font-bold text-primary">{Number(v.price).toFixed(2)} €</span>
                )}
              </Link>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}