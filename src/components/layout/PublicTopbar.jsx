import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, LogIn, User, Upload, Library, ListMusic, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import NotificationBell from '@/components/shared/NotificationBell';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function PublicTopbar() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['navbar-user'],
    queryFn: async () => {
      const auth = await base44.auth.isAuthenticated();
      if (!auth) return null;
      return base44.auth.me();
    },
    retry: false,
    staleTime: 60000,
  });

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/recherche?q=${encodeURIComponent(q.trim())}`);
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    qc.clear();
    window.location.href = '/';
  };

  const initial = (user?.full_name?.[0] || user?.email?.[0] || '?').toUpperCase();

  return (
    <header
      className="fixed top-0 left-0 md:left-60 right-0 z-50 h-16 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center gap-3 px-3 sm:px-4"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <Link to="/" className="md:hidden font-display font-extrabold text-lg leading-none shrink-0">
        KKD<span className="text-primary">MUSIC</span>
      </Link>

      <form onSubmit={submit} className="flex-1 max-w-xl relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher musique, artistes, vidéos…"
          className="w-full pl-9 pr-4 py-2 rounded-full bg-secondary border border-border/40 text-sm focus:outline-none focus:border-primary/50"
        />
      </form>

      <div className="flex items-center gap-2 ml-auto">
        {user ? (
          <>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('kkd:publish'))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Upload size={15} /> Publier
            </button>
            <NotificationBell user={user} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border/50 p-0.5 sm:pr-2 hover:border-primary/30 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                    {initial}
                  </div>
                  <span className="font-medium text-sm max-w-[110px] truncate hidden sm:block">
                    {user.full_name?.split(' ')[0] || user.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/mon-espace" className="flex items-center gap-2"><LayoutDashboard size={15} /> Mon espace</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/mes-achats" className="flex items-center gap-2"><Library size={15} /> Bibliothèque</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/playlists" className="flex items-center gap-2"><ListMusic size={15} /> Mes playlists</Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2"><Settings size={15} /> Administration</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive focus:text-destructive">
                  <LogOut size={15} /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-border/50 hover:border-primary/40 transition-colors"
            >
              <User size={15} /> Devenir artiste
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary/80 transition-colors"
            >
              <LogIn size={15} /> <span className="hidden sm:block">Connexion</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}