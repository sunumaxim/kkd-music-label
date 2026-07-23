import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PublicSidebar from './PublicSidebar';
import PublicTopbar from './PublicTopbar';
import Footer from './Footer';
import MobileBottomTabs from '@/components/mobile/MobileBottomTabs';
import PageTransition from './PageTransition';

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <PublicSidebar />
      <PublicTopbar />
      <main className="pt-16 md:pl-60 pb-16 md:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <div className="hidden md:block md:pl-60">
        <Footer />
      </div>
      <MobileBottomTabs />
    </div>
  );
}