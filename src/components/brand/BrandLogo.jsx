import React, { useState } from 'react';
import { OFFICIAL_LOGO_LOCAL, OFFICIAL_LOGO_URL } from '@/lib/brand';

/**
 * Composant de Logo Officiel KKD Music
 * Affiche le logo officiel officiel de la marque issu de Base44,
 * avec basculement automatique sur le cache local en cas de problème réseau.
 */
export default function BrandLogo({
  className = "h-10 w-auto",
  showSubtext = false,
  subtextClass = "text-[9px] text-muted-foreground uppercase font-bold tracking-widest",
}) {
  const [src, setSrc] = useState(OFFICIAL_LOGO_LOCAL);

  const handleError = () => {
    if (src === OFFICIAL_LOGO_LOCAL) {
      setSrc(OFFICIAL_LOGO_URL);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <img
        src={src}
        alt="KKD Music"
        onError={handleError}
        className={`${className} object-contain shrink-0 transition-transform duration-200 hover:scale-105`}
      />
      {showSubtext && (
        <div className="flex flex-col">
          <span className="font-display text-base font-black tracking-tight text-foreground leading-none">
            KKD<span className="text-primary">MUSIC</span>
          </span>
          <span className={subtextClass}>
            D2C Streaming & Store
          </span>
        </div>
      )}
    </div>
  );
}