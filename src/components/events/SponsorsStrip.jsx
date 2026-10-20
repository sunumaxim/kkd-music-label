import React from 'react';
import { safeHttpUrl } from '@/lib/maps';

const LABELS = { principal: 'Partenaire principal', sponsor: 'Avec le soutien de', media: 'Partenaires médias' };
const SIZE = { principal: 'h-20 w-44', sponsor: 'h-14 w-32', media: 'h-12 w-28' };

/** Affichage public des sponsors (liens sécurisés, ouverture dans un nouvel onglet). dark = fond sombre. */
export default function SponsorsStrip({ sponsors, dark = false, className = '' }) {
  const list = (Array.isArray(sponsors) ? sponsors : []).filter((s) => s?.logo_url || s?.name);
  if (!list.length) return null;
  const groups = ['principal', 'sponsor', 'media'].map((t) => [t, list.filter((s) => (s.tier || 'sponsor') === t)]).filter(([, g]) => g.length);
  return (
    <div className={`space-y-6 ${className}`}>
      {groups.map(([tier, items]) => (
        <div key={tier} className="text-center">
          <p className={`text-[11px] uppercase tracking-[.3em] font-semibold mb-3 ${dark ? 'text-[#e8b84a]' : 'text-muted-foreground'}`}>{LABELS[tier]}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {items.map((s, i) => {
              const href = safeHttpUrl(s.link_url);
              const inner = s.logo_url
                ? <img src={s.logo_url} alt={s.name || 'Sponsor'} loading="lazy" className="max-h-full max-w-full object-contain" />
                : <span className="text-sm font-bold text-neutral-800 px-2">{s.name}</span>;
              const cls = `${SIZE[tier]} bg-white rounded-xl border border-black/5 shadow-sm flex items-center justify-center p-2 transition-transform ${href ? 'hover:-translate-y-0.5' : ''}`;
              return href
                ? <a key={i} href={href} target="_blank" rel="noopener noreferrer sponsored" className={cls} title={s.name}>{inner}</a>
                : <div key={i} className={cls} title={s.name}>{inner}</div>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
