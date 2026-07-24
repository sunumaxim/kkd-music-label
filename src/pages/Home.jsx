import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import HeroSlider from '@/components/home/HeroSlider';
import RecentlyPlayed from '@/components/home/RecentlyPlayed';
import TrendingSongs from '@/components/home/TrendingSongs';
import TopAlbums from '@/components/home/TopAlbums';
import UpcomingEvents from '@/components/home/UpcomingEvents';
import LatestVideos from '@/components/home/LatestVideos';
import TrendingArtists from '@/components/home/TrendingArtists';
import LatestNews from '@/components/home/LatestNews';
import PartnersCTA from '@/components/home/PartnersCTA';
import StudioCarousel from '@/components/home/StudioCarousel';
import SponsoredShelf from '@/components/home/SponsoredShelf';
import usePullToRefresh from '@/hooks/usePullToRefresh';

export default function Home() {
  const [tab, setTab] = useState('foryou');
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
  const { data: videos = [] } = useQuery({
    queryKey: ['videos-home'],
    queryFn: () => base44.entities.Video.list('-created_date', 12),
  });
  const { data: news = [] } = useQuery({
    queryKey: ['news-home'],
    queryFn: () => base44.entities.News.list('-created_date', 4),
  });
  const { data: events = [] } = useQuery({
    queryKey: ['events-home'],
    queryFn: () => base44.entities.Event.list('event_date', 6),
  });

  const tabs = [
    { key: 'foryou', label: 'Pour Toi' },
    { key: 'trending', label: 'Tendance' },
  ];

  return (
    <div ref={containerRef}>
      {(isRefreshing || pullY > 20) && (
        <div className="md:hidden flex justify-center py-3 text-primary">
          <Loader2
            size={20}
            className={isRefreshing ? 'animate-spin' : ''}
            style={{ transform: `rotate(${(pullY / 80) * 180}deg)` }}
          />
        </div>
      )}

      <HeroSlider releases={releases} videos={videos} events={events} news={news} />

      {/* Onglets du feed */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        <div className="inline-flex p-1 rounded-full bg-secondary/60 border border-border/50">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                tab === t.key
                  ? 'bg-foreground text-background shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <SponsoredShelf />

      {tab === 'foryou' ? (
        <>
          <RecentlyPlayed />
          <TopAlbums releases={releases} />
          <TrendingSongs releases={releases} artists={artists} />
          <UpcomingEvents events={events} />
          <LatestVideos videos={videos} />
          <TrendingArtists artists={artists} />
          <LatestNews news={news} />
          <StudioCarousel />
          <PartnersCTA />
        </>
      ) : (
        <>
          <TrendingSongs releases={releases} artists={artists} />
          <TopAlbums releases={releases} />
          <TrendingArtists artists={artists} />
          <UpcomingEvents events={events} />
          <LatestVideos videos={videos} />
          <PartnersCTA />
        </>
      )}
    </div>
  );
}