import React from 'react';
import { Link } from 'react-router-dom';

export default function SectionHeader({ label, title, to, count }) {
  return (
    <div className="flex items-end justify-between mb-6 md:mb-10">
      <div className="min-w-0">
        <span className="text-xs text-primary tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>{label}</span>
        <div className="flex items-baseline gap-3 mt-1.5">
          <h2 className="text-2xl md:text-4xl uppercase truncate">{title}</h2>
          {typeof count === 'number' && (
            <span className="hidden md:inline text-sm text-muted-foreground">{count}</span>
          )}
        </div>
      </div>
      {to && (
        <Link to={to} className="kkd-link shrink-0 ml-4">
          Voir tout →
        </Link>
      )}
    </div>
  );
}