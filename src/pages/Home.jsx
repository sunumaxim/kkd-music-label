import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import PageMeta from '@/components/shared/PageMeta';
import HeroSlider from '@/components/home/HeroSlider';
import LatestReleases from '@/components/home/LatestReleases';
import TrendingSongs from '@/components/home/TrendingSongs';
import TopAlbums from '@/components/home/TopAlbums';
import PopularArtists from '@/components/home/PopularArtists';
import LatestVideos from '@/components/home/LatestVideos';
import LatestNews from '@/components/home/LatestNews';
import PartnersCTA from '@/components/home/PartnersCTA';
import usePullToRefresh from '@/hooks/usePullToRefresh';

export default function Home() {
  const queryClient = useQueryClient();

  const { isRefreshing, pullY, containerRef } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries();
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['releases-featured'],
    queryFn: () => base44.entities.Release.list('-created_date', 30),
  });
  const { data: artists = [] } = useQuery({
    queryKey: ['artists'],
    queryFn: () => base44.entities.Artist.list('order', 40),
  });
  const { data: events = [] } = useQuery({
    queryKey: ['events-home'],
    queryFn: () => base44.entities.Event.list('event_date', 12),
  });
  const { data: videos = [] } = useQuery({
    queryKey: ['videos-home'],
    queryFn: () => base44.entities.Video.list('-created_date', 12),
  });
  const { data: news = [] } = useQuery({
    queryKey: ['news-home'],
    queryFn: () => base44.entities.News.list('-created_date', 4),
  });
  return (
    <div ref={containerRef}>
      <PageMeta
        title="KKD Music — Streaming & Distribution Musicale Africaine"
        description="Découvrez les artistes KKD Music, écoutez leurs sorties, regardez leurs clips et suivez les actualités du label."
      />
      {(isRefreshing || pullY > 20) && (
        <div className="md:hidden flex justify-center py-3 text-primary">
          <Loader2
            size={20}
            className={isRefreshing ? 'animate-spin' : ''}
            style={{ transform: `rotate(${(pullY / 80) * 180}deg)` }}
          />
        </div>
      )}

      <HeroSlider releases={releases} videos={videos} events={events.filter((event) => !event.published_status || event.published_status === 'approuve')} news={news} />

      {/* Événements à venir : visibles dès la page d’accueil */}
      {events.some((event) => (!event.published_status || event.published_status === 'approuve') && new Date(event.event_date) >= new Date()) && (
        <section className="px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Sur scène bientôt</p>
              <h2 className="text-2xl md:text-3xl font-extrabold mt-1">Concerts & événements</h2>
              <p className="text-sm text-muted-foreground mt-1">Découvrez les dates, partagez les événements et réservez vos billets.</p>
            </div>
            <a href="/evenements" className="text-sm font-semibold text-primary hover:underline">Toute la billetterie →</a>
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.filter((event) => (!event.published_status || event.published_status === 'approuve') && new Date(event.event_date) >= new Date()).slice(0, 3).map((event) => (
              <a key={event.id} href={`/evenements/${String(event.title || 'evenement').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}--${event.id}`} className="group overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
                <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
                  {event.image_url ? <img src={event.image_url} alt={event.title || 'Événement KKD Music'} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center text-primary font-bold">KKD MUSIC LIVE</div>}
                  <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-bold">{event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'À venir'}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base line-clamp-1">{event.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{[event.location, event.city].filter(Boolean).join(' · ') || 'Lieu à confirmer'}</p>
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <span className="text-sm font-semibold">{Number(event.ticket_price || 0) > 0 ? `${Number(event.ticket_price).toLocaleString('fr-FR')} FCFA` : 'Voir les détails'}</span>
                    <span className="text-sm text-primary font-bold">Billets →</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 1. Nouveautés */}
      <LatestReleases releases={releases} />

      {/* 2. Titres en tendance */}
      <TrendingSongs releases={releases} artists={artists} />

      {/* 3. Albums récents */}
      <TopAlbums releases={releases} />

      {/* 4. Artistes populaires */}
      <PopularArtists artists={artists} />

      {/* Sections essentielles du label */}
      <LatestVideos videos={videos} />
      <LatestNews news={news} />
      <PartnersCTA />
    </div>
  );
}