import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Home, Compass, Library, ListMusic, Video, Users, CalendarDays,
  Newspaper, Handshake, Ticket, ScanLine, LayoutDashboard, ShieldCheck, Music2,
} from 'lucide-react';

const mainNav = [
  { label: 'Accueil', path: '/', icon: Home },
  { label: 'Musique', path: '/musique', icon: Music2 },
  { label: 'Explorer', path: '/explorer', icon: Compass },
  { label: 'Bibliothèque', path: '/mes-achats', icon: Library },
  { label: 'Playlists', path: '/playlists', icon: ListMusic },
];

const browseNav = [
  { label: 'Vidéos', path: '/videos', icon: Video },
  { label: 'Artistes', path: '/artistes', icon: Users },
  { label: 'Événements', path: '/evenements', icon: CalendarDays },
  { label: 'Actualités', path: '/actualites', icon: Newspaper },
  { label: 'Partenaires', path: '/partenaires', icon: Handshake },
];

const libraryNav = [
  { label: 'Mes billets', path: '/mes-billets', icon: Ticket },
  { label: "Contrôle d'accès", path: '/controle-acces', icon: ScanLine },
];

function NavLink({ item, active }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.4 : 2} /> {item.label}
    </Link>
  );
}

export default function PublicSidebar() {
  const location = useLocation();
  const isActive = (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  const { data: user } = useQuery({
    queryKey: ['sidebar-user'],
    queryFn: async () => {
      const auth = await base44.auth.isAuthenticated();
      if (!auth) return null;
      return base44.auth.me();
    },
    retry: false,
    staleTime: 60_000,
  });

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-border/20 z-40">
      <div className="px-5 py-5">
        <Link to="/">
          <img src="https://media.base44.com/images/public/695179b6b73caf48a00876c1/d0c46d8b9_generated_acb63943.png" alt="KKDmusic" height={28} style={{ height: 28, width: 'auto' }} draggable={false} />
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {mainNav.map((l) => (
          <NavLink key={l.path} item={l} active={isActive(l.path)} />
        ))}

        <div className="pt-3 mt-3 border-t border-border/20">
          <p className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Parcourir</p>
          {browseNav.map((l) => (
            <NavLink key={l.path} item={l} active={isActive(l.path)} />
          ))}
        </div>

        <div className="pt-3 mt-3 border-t border-border/20">
          <p className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Bibliothèque</p>
          {libraryNav.map((l) => (
            <NavLink key={l.path} item={l} active={isActive(l.path)} />
          ))}
        </div>

        {user && (
          <div className="pt-3 mt-3 border-t border-border/20">
            <p className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Espaces</p>
            {user.role !== 'admin' && (
              <Link
                to="/mon-espace"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/mon-espace') ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <LayoutDashboard size={18} /> Mon espace
              </Link>
            )}
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin') ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <ShieldCheck size={18} /> Administration
              </Link>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}