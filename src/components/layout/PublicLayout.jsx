import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PublicSidebar from './PublicSidebar';
import PublicTopbar from './PublicTopbar';
import Footer from './Footer';
import MobileBottomTabs from '@/components/mobile/MobileBottomTabs';
import PageTransition from './PageTransition';
import NowPlayingBar from '@/components/player/NowPlayingBar';
import { PlayerProvider, usePlayer } from '@/lib/PlayerContext';

function PublicLayoutInner() {
  const location = useLocation();
  const { current } = usePlayer();

  return (
    <div className="min-h-screen bg-background">
      <PublicSidebar />
      <PublicTopbar />
      <main className={`pt-16 md:pl-60 ${current ? 'pb-36 md:pb-24' : 'pb-16 md:pb-0'}`}>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <div className={`hidden md:block md:pl-60 ${current ? 'md:pb-24' : ''}`}>
        <Footer />
      </div>
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