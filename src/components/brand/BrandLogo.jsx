import React from 'react';

const LOGO_URL = 'https://media.base44.com/images/public/695179b6b73caf48a00876c1/d0c46d8b9_generated_acb63943.png';

export default function BrandLogo({ className = '', height = 26, alt = 'KKDmusic' }) {
  return (
    <img
      src={LOGO_URL}
      alt={alt}
      height={height}
      style={{ height, width: 'auto' }}
      className={className}
      draggable={false}
    />
  );
}