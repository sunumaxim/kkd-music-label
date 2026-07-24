import React from 'react';
import { BadgeCheck } from 'lucide-react';

/**
 * Badge bleu « Vérifié » — artiste certifié par KKD Music.
 */
export default function VerifiedBadge({ size = 18, showLabel = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 align-middle ${className}`}
      title="Artiste vérifié KKD Music"
    >
      <BadgeCheck
        size={size}
        className="text-blue-500 shrink-0"
        fill="currentColor"
        strokeWidth={1.5}
        style={{ filter: 'drop-shadow(0 1px 2px rgba(59,130,246,0.45))' }}
      />
      {showLabel && (
        <span className="text-[11px] font-bold uppercase tracking-wide text-blue-500">
          Vérifié
        </span>
      )}
    </span>
  );
}