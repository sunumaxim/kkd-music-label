import React from 'react';

/**
 * Horizontal scroll carousel with snap, hidden scrollbar and edge fades.
 * Native scroll = performant, no JS state needed.
 */
export default function CarouselRow({ children, className = '' }) {
  return (
    <div className={`relative -mx-4 md:-mx-8 ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-4 md:w-10 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 md:w-10 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory px-4 md:px-8 pb-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] scroll-px-4 md:scroll-px-8">
        {children}
      </div>
    </div>
  );
}