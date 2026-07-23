import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import HeroSlider from '@/components/home/HeroSlider';
import LatestReleases from '@/components/home/LatestReleases';
import TrendingArtists from '@/components/home/TrendingArtists';
import NewArtists from '@/components/home/NewArtists';
import LatestVideos from '@/components/home/LatestVideos';
import UpcomingEvents from '@/components/home/UpcomingEvents';
import LatestNews from '@/components/home/LatestNews';
import PartnersCTA from '@/components/home/PartnersCTA';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const queryClient = useQueryClient();

  const { isRefreshing, pullY, containerRef } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries();
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['releases-featured'],
    queryFn: () => base44.entities.Release.list('-created_date', 20),
  });

  const { data: artists = [] } = useQuery({
    queryKey: ['artists'],
    queryFn: () => base44.entities.Artist.list('order', 30),
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
          <Loader2 size={20} className={isRefreshing ? 'animate-spin' : ''} style={{ transform: `rotate(${(pullY / 80) * 180}deg)` }} />
        </div>
      )}

      <HeroSlider releases={releases} videos={videos} events={events} news={news} />

      <LatestReleases releases={releases} />
      <LatestVideos videos={videos} />
      <TrendingArtists artists={artists} />
      <NewArtists artists={artists} />
      <UpcomingEvents events={events} />
      <LatestNews news={news} />
      <PartnersCTA />
    </div>
  );
}