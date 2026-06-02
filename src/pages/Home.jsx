import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import HeroBanner from '../components/home/HeroBanner';
import FeaturedArtists from '../components/home/FeaturedArtists';
import LatestVideos from '../components/home/LatestVideos';
import LatestNews from '../components/home/LatestNews';
import UpcomingEvents from '../components/home/UpcomingEvents';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const queryClient = useQueryClient();

  const { isRefreshing, pullY, containerRef } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries();
  });

  const { data: releases } = useQuery({
    queryKey: ['releases-featured'],
    queryFn: () => base44.entities.Release.list('-created_date', 10),
    initialData: [],
  });

  const { data: artists } = useQuery({
    queryKey: ['artists'],
    queryFn: () => base44.entities.Artist.list('order', 20),
    initialData: [],
  });

  const { data: videos } = useQuery({
    queryKey: ['videos'],
    queryFn: () => base44.entities.Video.list('-created_date', 6),
    initialData: [],
  });

  const { data: news } = useQuery({
    queryKey: ['news'],
    queryFn: () => base44.entities.News.list('-created_date', 3),
    initialData: [],
  });

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('event_date', 5),
    initialData: [],
  });

  const featuredRelease = releases.find(r => r.is_featured) || releases[0];
  const latestVideo = videos[0];

  return (
    <div ref={containerRef}>
      {(isRefreshing || pullY > 20) && (
        <div className="md:hidden flex justify-center py-3 text-primary">
          <Loader2 size={20} className={isRefreshing ? 'animate-spin' : ''} style={{ transform: `rotate(${(pullY / 80) * 180}deg)` }} />
        </div>
      )}
      <HeroBanner featuredRelease={featuredRelease} latestVideo={latestVideo} />
      <FeaturedArtists artists={artists} />
      <LatestVideos videos={videos} />
      <LatestNews news={news} />
      <UpcomingEvents events={events} />
    </div>
  );
}