import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import HeroSlider from '@/components/home/HeroSlider';
import LatestReleases from '@/components/home/LatestReleases';
import TrendingSongs from '@/components/home/TrendingSongs';
import TopAlbums from '@/components/home/TopAlbums';
import PopularArtists from '@/components/home/PopularArtists';
import PlaylistsShelf from '@/components/home/PlaylistsShelf';
import RecentlyPlayed from '@/components/home/RecentlyPlayed';
import UpcomingEvents from '@/components/home/UpcomingEvents';
import LatestVideos from '@/components/home/LatestVideos';
import LatestNews from '@/components/home/LatestNews';
import StudioCarousel from '@/components/home/StudioCarousel';
import PartnersCTA from '@/components/home/PartnersCTA';
import SponsoredShelf from '@/components/home/SponsoredShelf';
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

      <SponsoredShelf />

      {/* 1. Nouveautés */}
      <LatestReleases releases={releases} />

      {/* 2. Titres en tendance */}
      <TrendingSongs releases={releases} artists={artists} />

      {/* 3. Albums récents */}
      <TopAlbums releases={releases} />

      {/* 4. Artistes populaires */}
      <PopularArtists artists={artists} />

      {/* 5. Playlists */}
      <PlaylistsShelf />

      {/* 6. Recommandé pour toi */}
      <RecentlyPlayed />

      {/* Sections marque */}
      <UpcomingEvents events={events} />
      <LatestVideos videos={videos} />
      <LatestNews news={news} />
      <StudioCarousel />
      <PartnersCTA />
    </div>
  );
}