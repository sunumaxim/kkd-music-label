import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicSidebar from './PublicSidebar';
import PublicTopbar from './PublicTopbar';
import Footer from './Footer';
import MobileBottomTabs from '@/components/mobile/MobileBottomTabs';
import NowPlayingBar from '@/components/player/NowPlayingBar';
import PromoZone from '@/components/shared/PromoZone';
import AudioAnnouncement from '@/components/shared/AudioAnnouncement';
import { PlayerProvider, usePlayer } from '@/lib/PlayerContext';

function PublicLayoutInner() {
  const { current } = usePlayer();

  return (
    <div className="min-h-screen bg-background">
      <PublicSidebar />
      <PublicTopbar />
      <main className={`pt-16 md:pl-64 ${current ? 'pb-36 md:pb-24' : 'pb-16 md:pb-0'}`}>
        <PromoZone placement="top_banner" />
        <Outlet />
      </main>
      <div className={`hidden md:block md:pl-64 ${current ? 'md:pb-24' : ''}`}>
        <Footer />
      </div>
      <AudioAnnouncement />
      <NowPlayingBar />
      <MobileBottomTabs />
    </div>
  );
}

export default function PublicLayout() {
  return (
    <PlayerProvider>
      <PublicLayoutInner />
    </PlayerProvider>
  );
}