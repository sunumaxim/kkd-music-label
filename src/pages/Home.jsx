import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import HeroBanner from '../components/home/HeroBanner';
import FeaturedArtists from '../components/home/FeaturedArtists';
import LatestVideos from '../components/home/LatestVideos';
import LatestNews from '../components/home/LatestNews';
import UpcomingEvents from '../components/home/UpcomingEvents';

export default function Home() {
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

  return (
    <div>
      <HeroBanner featuredRelease={featuredRelease} />
      <FeaturedArtists artists={artists} />
      <LatestVideos videos={videos} />
      <LatestNews news={news} />
      <UpcomingEvents events={events} />
    </div>
  );
}