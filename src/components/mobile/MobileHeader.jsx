import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * MobileHeader — shown on deep child screens (ArtistDetail, NewsDetail).
 * Provides a native-style back button and a page title.
 * Only visible on mobile (md:hidden).
 */
export default function MobileHeader({ title, backPath }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className="md:hidden sticky top-0 z-40 flex items-center gap-2 bg-background/90 backdrop-blur-xl border-b border-border/30 px-2 h-14 select-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <button
        onClick={handleBack}
        className="flex items-center gap-0.5 text-primary font-medium text-sm px-2 py-2 rounded-lg active:bg-primary/10 transition-colors"
      >
        <ChevronLeft size={22} strokeWidth={2.5} />
        <span>Retour</span>
      </button>
      {title && (
        <h1 className="flex-1 text-center font-heading font-bold text-sm truncate pr-16">
          {title}
        </h1>
      )}
    </div>
  );
}