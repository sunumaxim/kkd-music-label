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

      <HeroSlider releases={releases} videos={videos} events={[]} news={news} />

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