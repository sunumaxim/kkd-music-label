import React from 'react';
import { LOGO_MAIN } from '@/lib/logos';

/**
 * Affiche le logo officiel KKD Music dans un conteneur sombre arrondi.
 * Les logos officiels ont un fond noir : ce conteneur fait fondre
 * le fond du logo dans un badge sombre élégant sur n'importe quelle surface.
 */
export default function BrandLogo({
  className = '',
  height = 26,
  alt = 'KKDmusic',
  logo = LOGO_MAIN,
  radius = 8,
}) {
  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{ background: '#000', borderRadius: radius }}
    >
      <img
        src={logo}
        alt={alt}
        height={height}
        style={{ height, width: 'auto', display: 'block' }}
        draggable={false}
      />
    </div>
  );
}