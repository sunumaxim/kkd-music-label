import React from 'react';
import { Award } from 'lucide-react';

/**
 * Badge doré « Label Certifié » — brillant comme de l'or.
 */
export default function GoldLabelBadge({ size = 18, showLabel = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 align-middle ${className}`}
      title="Label certifié KKD Music"
    >
      <Award
        size={size}
        className="shrink-0"
        strokeWidth={1.5}
        style={{
          color: '#facc15',
          fill: 'rgba(250,204,21,0.25)',
          filter: 'drop-shadow(0 1px 3px rgba(250,204,21,0.6))',
        }}
      />
      {showLabel && (
        <span
          className="text-[11px] font-bold uppercase tracking-wide"
          style={{ color: '#facc15', textShadow: '0 1px 2px rgba(250,204,21,0.4)' }}
        >
          Label Certifié
        </span>
      )}
    </span>
  );
}