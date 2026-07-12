import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SectionHeader({ label, title, to, count }) {
  return (
    <div className="flex items-end justify-between mb-6 md:mb-10">
      <div className="min-w-0">
        <span className="text-xs font-mono text-primary tracking-widest uppercase">{label}</span>
        <div className="flex items-baseline gap-3 mt-1.5">
          <h2 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight truncate">{title}</h2>
          {typeof count === 'number' && (
            <span className="hidden md:inline text-sm text-muted-foreground font-mono">{count}</span>
          )}
        </div>
      </div>
      {to && (
        <Link
          to={to}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors shrink-0 ml-4 group"
        >
          <span className="hidden sm:inline">Voir tout</span>
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}