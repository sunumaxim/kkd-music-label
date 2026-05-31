import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, Music, Video, Newspaper, CalendarDays, LayoutDashboard, ArrowLeft, Inbox, UserPlus, Building2 } from 'lucide-react';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

const sidebarLinks = [
  { label: 'Tableau de bord', path: '/admin', icon: LayoutDashboard },
  { divider: true, label: 'CONTENU' },
  { label: 'Artistes', path: '/admin/artistes', icon: Users },
  { label: 'Sorties musicales', path: '/admin/sorties', icon: Music },
  { label: 'Vidéos', path: '/admin/videos', icon: Video },
  { label: 'Actualités', path: '/admin/actualites', icon: Newspaper },
  { label: 'Événements', path: '/admin/evenements', icon: CalendarDays },
  { divider: true, label: 'PARTENAIRES' },
  { label: 'Demandes', path: '/admin/demandes', icon: Inbox },
  { label: 'Artistes & Labels', path: '/admin/invitations', icon: UserPlus },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/30 bg-card/50">
        <div className="p-6 border-b border-border/30">
          <img src={LOGO_URL} alt="KKD Music" className="h-10 w-auto" />
          <p className="text-xs text-muted-foreground mt-1 font-mono">Administration</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link, i) => {
            if (link.divider) {
              return (
                <div key={i} className="pt-4 pb-1 px-3">
                  <p className="text-[10px] font-mono text-muted-foreground/50 tracking-widest uppercase">{link.label}</p>
                </div>
              );
            }
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border/30">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={14} /> Voir le site
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border/30 bg-card/50">
          <img src={LOGO_URL} alt="KKD Music" className="h-8 w-auto" />
          <Link to="/" className="text-xs text-muted-foreground">Voir le site</Link>
        </header>
        
        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto border-b border-border/30 bg-card/30 px-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon size={14} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}