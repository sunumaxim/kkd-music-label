import React from 'react';
import { LOGO_MAIN } from '@/lib/logos';

export default function BrandLogo({ className = '', height = 26, alt = 'KKDmusic' }) {
  return (
    <img
      src={LOGO_MAIN}
      alt={alt}
      height={height}
      style={{ height, width: 'auto' }}
      className={className}
      draggable={false}
    />
  );
}