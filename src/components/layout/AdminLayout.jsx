import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Users, Music, Video, Newspaper, CalendarDays,
  LayoutDashboard, Inbox, UserPlus, LogOut, ArrowLeft,
  Menu, X, ChevronRight, UploadCloud, Mail, Share2, Heart
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

const navGroups = [
  {
    label: null,
    links: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Contenu',
    links: [
      { label: 'Artistes', path: '/admin/artistes', icon: Users },
      { label: 'Sorties', path: '/admin/sorties', icon: Music },
      { label: 'Vidéos', path: '/admin/videos', icon: Video },
      { label: 'Actualités', path: '/admin/actualites', icon: Newspaper },
      { label: 'Événements', path: '/admin/evenements', icon: CalendarDays },
    ]
  },
  {
    label: 'Partenaires',
    links: [
      { label: 'Demandes', path: '/admin/demandes', icon: Inbox },
      { label: 'Publications', path: '/admin/publications', icon: UploadCloud },
      { label: 'Mailing', path: '/admin/mailing', icon: Mail },
      { label: 'Artistes & Labels', path: '/admin/invitations', icon: UserPlus },
      { label: 'Réseaux Sociaux', path: '/admin/social', icon: Share2 },
    ]
  },
  {
    label: 'Communauté',
    links: [
      { label: 'Espace Fans', path: '/admin/fans', icon: Heart },
    ]
  },
];

// Bottom nav — 5 most important items for mobile
const bottomNavItems = [
  { label: 'Accueil', path: '/admin', icon: LayoutDashboard },
  { label: 'Artistes', path: '/admin/artistes', icon: Users },
  { label: 'Sorties', path: '/admin/sorties', icon: Music },
  { label: 'Demandes', path: '/admin/demandes', icon: Inbox },
  { label: 'Plus', path: null, icon: Menu }, // triggers drawer
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border/20 bg-card/40 backdrop-blur-sm shrink-0">
        <div className="p-5 border-b border-border/20">
          <img src={LOGO_URL} alt="KKD Music" className="h-9 w-auto" />
          <span className="mt-1.5 inline-block text-[10px] font-mono text-muted-foreground/50 tracking-widest uppercase">Admin</span>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi} className="mb-2">
              {group.label && (
                <p className="px-5 py-1 text-[10px] font-mono text-muted-foreground/40 tracking-widest uppercase">{group.label}</p>
              )}
              {group.links.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-border/20 space-y-3">
          <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={13} /> Voir le site
          </Link>
          {user && (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{user.full_name || user.email}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
              <button onClick={() => logout()} className="ml-2 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative ml-auto w-72 bg-background border-l border-border/20 flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border/20">
              <img src={LOGO_URL} alt="KKD Music" className="h-8 w-auto" />
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 py-4 overflow-y-auto">
              {navGroups.map((group, gi) => (
                <div key={gi} className="mb-2">
                  {group.label && (
                    <p className="px-5 py-1 text-[10px] font-mono text-muted-foreground/40 tracking-widest uppercase">{group.label}</p>
                  )}
                  {group.links.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.path);
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center gap-3 mx-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="flex-1">{link.label}</span>
                        {active && <ChevronRight size={14} />}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            <div className="p-4 border-t border-border/20 space-y-3">
              <Link to="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Voir le site
              </Link>
              {user && (
                <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button onClick={() => logout()} className="ml-2 p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <LogOut size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top header */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border/20 bg-background/90 backdrop-blur-md">
          <img src={LOGO_URL} alt="KKD Music" className="h-7 w-auto" />
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl bg-secondary text-foreground"
          >
            <Menu size={18} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* ── Mobile Bottom Navigation ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/20 flex items-stretch safe-area-inset-bottom">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.path ? isActive(item.path) : false;
            if (item.path === null) {
              return (
                <button
                  key="more"
                  onClick={() => setDrawerOpen(true)}
                  className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-muted-foreground"
                >
                  <Icon size={22} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {active && (
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
                <Icon size={22} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}