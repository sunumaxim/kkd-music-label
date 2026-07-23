import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Music, Video, Users, CalendarDays, Newspaper, Handshake, ShoppingBag } from 'lucide-react';

const nav = [
  { label: 'Accueil', path: '/', icon: Home },
  { label: 'Musique', path: '/musique', icon: Music },
  { label: 'Vidéos', path: '/videos', icon: Video },
  { label: 'Artistes', path: '/artistes', icon: Users },
  { label: 'Événements', path: '/evenements', icon: CalendarDays },
  { label: 'Actualités', path: '/actualites', icon: Newspaper },
  { label: 'Partenaires', path: '/partenaires', icon: Handshake },
];

export default function PublicSidebar() {
  const location = useLocation();
  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-border/20 z-40">
      <div className="px-5 py-5">
        <Link to="/" className="font-display font-extrabold text-xl tracking-tight leading-none">
          KKD<span className="text-primary">MUSIC</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {nav.map((l) => {
          const Icon = l.icon;
          const active = isActive(l.path);
          return (
            <Link
              key={l.path}
              to={l.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 2} /> {l.label}
            </Link>
          );
        })}
        <div className="pt-3 mt-3 border-t border-border/20">
          <p className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Bibliothèque</p>
          <Link
            to="/mes-achats"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/mes-achats') ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <ShoppingBag size={18} /> Mes achats
          </Link>
        </div>
      </nav>
    </aside>
  );
}