import React, { useMemo } from 'react';

/**
 * Badge de certification officiel KKD Music.
 * Rosette à 12 pétales, dégradé rouge→noir, motif d'égaliseur en arrière-plan,
 * coche blanche centrée, bordure métallique argentée + halo doux.
 * Unique à KKD Music — lisible à 16, 24 et 32 px.
 */

// Construit le tracé d'une rosette scallopée (pétales) à partir de rayons int/ext.
function rosettePath(cx, cy, R, r, petals) {
  let d = '';
  for (let i = 0; i < petals; i++) {
    const a0 = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 0.5) / petals) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / petals) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    if (i === 0) d += `M${x0.toFixed(2)} ${y0.toFixed(2)} `;
    d += `Q${x1.toFixed(2)} ${y1.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)} `;
  }
  return d + 'Z';
}

export default function VerifiedBadge({ size = 18, showLabel = false, className = '' }) {
  const body = useMemo(() => rosettePath(16, 16, 14.6, 11.6, 12), []);
  const border = useMemo(() => rosettePath(16, 16, 15.4, 11.6, 12), []);
  const glowOpacity = size < 20 ? 0.22 : 0.45;

  return (
    <span
      className={`inline-flex items-center gap-1 align-middle ${className}`}
      title="Artiste certifié KKD Music"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', flexShrink: 0 }}
        aria-label="Artiste certifié KKD Music"
        role="img"
      >
        <defs>
          <linearGradient id="kkd-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E11D2E" />
            <stop offset="52%" stopColor="#B31524" />
            <stop offset="100%" stopColor="#0D0D0D" />
          </linearGradient>
          <linearGradient id="kkd-silver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="42%" stopColor="#C7CAD0" />
            <stop offset="70%" stopColor="#8E9197" />
            <stop offset="100%" stopColor="#F2F2F5" />
          </linearGradient>
          <linearGradient id="kkd-check" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EDEFF2" />
          </linearGradient>
          <filter id="kkd-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Halo rouge doux */}
        <path d={body} fill="#E11D2E" opacity={glowOpacity} filter="blur(2px)" />

        {/* Corps de la rosette */}
        <path d={body} fill="url(#kkd-grad)" />

        {/* Motif musical : égaliseur subtil en arrière-plan */}
        <g opacity="0.28" fill="#0D0D0D">
          <rect x="12.4" y="13.2" width="1.5" height="5.6" rx="0.75" />
          <rect x="15.25" y="11" width="1.5" height="8.6" rx="0.75" />
          <rect x="18.1" y="13.8" width="1.5" height="5" rx="0.75" />
        </g>

        {/* Coche blanche */}
        <path
          d="M10.6 16.4 L14.2 20 L21.6 11.8"
          stroke="url(#kkd-check)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ filter: 'drop-shadow(0 0.6px 0.4px rgba(0,0,0,0.55))' }}
        />

        {/* Bordure métallique */}
        <path d={border} fill="none" stroke="url(#kkd-silver)" strokeWidth="1.1" />
      </svg>

      {showLabel && (
        <span className="text-[11px] font-bold uppercase tracking-wide text-primary">
          Vérifié
        </span>
      )}
    </span>
  );
}