import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Home, Compass, Search, Music2, Users, Video, CalendarDays,
  Library, ListMusic, Ticket, ShieldCheck, Heart,
  Plus, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

function EqualizerIcon() {
  return (
    <div className="flex items-end gap-0.5 h-4 w-4">
      <span className="w-1 bg-primary rounded-full kkd-eq-bar" style={{ height: '70%', animationDelay: '0s' }} />
      <span className="w-1 bg-primary rounded-full kkd-eq-bar" style={{ height: '100%', animationDelay: '0.2s' }} />
      <span className="w-1 bg-primary rounded-full kkd-eq-bar" style={{ height: '45%', animationDelay: '0.4s' }} />
    </div>
  );
}

export default function PublicSidebar() {
  const location = useLocation();
  const [libFilter, setLibFilter] = useState('all'); // all | purchases | playlists | tickets
  const [likedCount, setLikedCount] = useState(0);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem('kkd_liked_tracks') || '[]');
      setLikedCount(list.length);
    } catch {
      setLikedCount(0);
    }
  }, []);

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

  const { data: purchases = [] } = useQuery({
    queryKey: ['sidebar-purchases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const res = await base44.functions.invoke('getMyPurchases', { user_email: user.email });
      return res.data?.purchases || [];
    },
    enabled: !!user?.email,
    staleTime: 30_000,
  });

  const roleBadge = () => {
    if (!user) return null;
    if (user.role === 'admin') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">Super Admin</span>;
    if (user.partner_type === 'label') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">Label</span>;
    if (user.partner_type === 'artist' || user.artist_id) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Artiste</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">Fan</span>;
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-40 select-none shadow-sm">
      {/* ── Brand Logo Header (Spotify Style) ── */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-border/50">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-rose-500 flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <EqualizerIcon />
          </div>
          <div>
            <span className="font-display text-lg font-black tracking-tight text-foreground flex items-center gap-1">
              KKD<span className="text-primary">MUSIC</span>
            </span>
            <span className="block text-[9px] text-muted-foreground uppercase font-bold tracking-widest -mt-1">
              D2C Streaming & Store
            </span>
          </div>
        </Link>
      </div>

      {/* ── Top Navigation Pane (Accueil, Explorer, Recherche) ── */}
      <div className="px-3 py-2 space-y-1">
        <Link
          to="/"
          className={`flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isActive('/') && location.pathname === '/'
              ? 'bg-primary/10 text-primary font-bold shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Home size={20} className={isActive('/') && location.pathname === '/' ? 'text-primary' : ''} />
          <span>Accueil</span>
        </Link>

        <Link
          to="/explorer"
          className={`flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isActive('/explorer')
              ? 'bg-primary/10 text-primary font-bold shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Compass size={20} className={isActive('/explorer') ? 'text-primary' : ''} />
          <span>Explorer & Tendances</span>
        </Link>

        <Link
          to="/recherche"
          className={`flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isActive('/recherche')
              ? 'bg-primary/10 text-primary font-bold shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Search size={20} className={isActive('/recherche') ? 'text-primary' : ''} />
          <span>Recherche</span>
        </Link>
      </div>

      <div className="mx-3 my-1 border-t border-border" />

      {/* ── Scrollable Center Pane ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 no-scrollbar">
        {/* Catégories Principales */}
        <div>
          <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Découvrir</p>
          <div className="space-y-0.5">
            <Link
              to="/musique"
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/musique') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Music2 size={18} className={isActive('/musique') ? 'text-primary' : ''} />
                <span>Musique & Singles</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 font-mono font-bold border border-amber-500/30">D2C</span>
            </Link>

            <Link
              to="/artistes"
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/artistes') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Users size={18} className={isActive('/artistes') ? 'text-primary' : ''} />
              <span>Artistes Indépendants</span>
            </Link>

            <Link
              to="/videos"
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/videos') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Video size={18} className={isActive('/videos') ? 'text-primary' : ''} />
              <span>Clips & Live Sessions</span>
            </Link>

            <Link
              to="/evenements"
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/evenements') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <CalendarDays size={18} className={isActive('/evenements') ? 'text-primary' : ''} />
              <span>Concerts & Billetterie</span>
            </Link>
          </div>
        </div>

        {/* ── Spotify "Votre Bibliothèque" Module ── */}
        <div className="bg-secondary/60 border border-border rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <Link to="/mes-achats" className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-primary transition-colors">
              <Library size={16} className="text-primary" />
              <span>Votre Bibliothèque</span>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title="Créer ou publier"
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                >
                  <Plus size={15} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-popover border-border text-popover-foreground shadow-xl">
                <DropdownMenuItem
                  onClick={() => window.dispatchEvent(new CustomEvent('kkd:publish-song'))}
                  className="cursor-pointer text-xs font-semibold py-2 hover:bg-secondary"
                >
                  <Music2 size={14} className="mr-2 text-primary" /> Publier un titre / Single
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.dispatchEvent(new CustomEvent('kkd:publish-video'))}
                  className="cursor-pointer text-xs font-semibold py-2 hover:bg-secondary"
                >
                  <Video size={14} className="mr-2 text-purple-600" /> Publier un clip vidéo
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.dispatchEvent(new CustomEvent('kkd:publish-event'))}
                  className="cursor-pointer text-xs font-semibold py-2 hover:bg-secondary"
                >
                  <CalendarDays size={14} className="mr-2 text-amber-600" /> Créer un concert / Festival
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold py-2 hover:bg-secondary">
                  <Link to="/playlists">
                    <ListMusic size={14} className="mr-2 text-muted-foreground" /> Créer une playlist
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Library Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setLibFilter('all')}
              className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all ${
                libFilter === 'all' ? 'bg-foreground text-background font-bold' : 'bg-background border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Tout
            </button>
            <button
              onClick={() => setLibFilter('liked')}
              className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all ${
                libFilter === 'liked' ? 'bg-foreground text-background font-bold' : 'bg-background border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Likés ({likedCount})
            </button>
            <button
              onClick={() => setLibFilter('purchases')}
              className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all ${
                libFilter === 'purchases' ? 'bg-foreground text-background font-bold' : 'bg-background border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Achats ({purchases.length})
            </button>
            <button
              onClick={() => setLibFilter('playlists')}
              className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all ${
                libFilter === 'playlists' ? 'bg-foreground text-background font-bold' : 'bg-background border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Playlists
            </button>
          </div>

          {/* Library Quick Links (Spotify Signature Layout) */}
          <div className="space-y-1">
            {/* Spotify Signature "Titres Likés" card */}
            {(libFilter === 'all' || libFilter === 'liked') && (
              <Link
                to="/musique"
                className="flex items-center gap-2.5 p-2 rounded-xl bg-purple-50 hover:bg-purple-100/70 border border-purple-200/60 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Heart size={14} className="text-white fill-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-purple-950 truncate">Titres likés</p>
                  <p className="text-[10px] text-purple-600 font-mono">Playlist • {likedCount} titre{likedCount > 1 ? 's' : ''}</p>
                </div>
              </Link>
            )}
            {(libFilter === 'all' || libFilter === 'purchases') && (
              <Link
                to="/mes-achats"
                className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                  isActive('/mes-achats') ? 'bg-primary/10 border border-primary/25' : 'hover:bg-background'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-rose-700 flex items-center justify-center shrink-0 shadow-sm">
                    <Music2 size={14} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">Titres Achetés & Masters</p>
                    <p className="text-[10px] text-muted-foreground">{purchases.length} titre{purchases.length > 1 ? 's' : ''} débloqué{purchases.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <CheckCircle2 size={14} className="text-primary shrink-0" />
              </Link>
            )}

            {(libFilter === 'all' || libFilter === 'playlists') && (
              <Link
                to="/playlists"
                className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                  isActive('/playlists') ? 'bg-primary/10' : 'hover:bg-background'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-foreground">
                  <ListMusic size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">Mes Playlists</p>
                  <p className="text-[10px] text-muted-foreground">Coups de cœur KKD</p>
                </div>
              </Link>
            )}

            {libFilter === 'all' && (
              <Link
                to="/mes-billets"
                className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                  isActive('/mes-billets') ? 'bg-primary/10' : 'hover:bg-background'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 text-amber-600 border border-amber-500/25">
                  <Ticket size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">Mes Billets de Concert</p>
                  <p className="text-[10px] text-muted-foreground">Accès QR code & scanner</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* ── Espace Partenaires & Créateurs (Audiomack Creators) ── */}
        <div className="bg-gradient-to-br from-primary/5 via-secondary/40 to-background border border-primary/20 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles size={13} /> Espace Créateurs
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              90% Net
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            Vendez votre musique directement par Wave & Orange Money et gérez vos concerts & billetterie.
          </p>
          <div className="pt-1 flex flex-col gap-1.5">
            {user?.role === 'partner' || user?.role === 'admin' ? (
              <Link
                to="/mon-espace"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-background hover:bg-secondary border border-border text-xs font-bold text-foreground transition-colors"
              >
                <span>Tableau de Bord Partenaire</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </Link>
            ) : (
              <Link
                to="/devenir-artiste"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-xs font-bold text-primary transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>Devenir Artiste / Demander un Rôle</span>
                </div>
                <ChevronRight size={14} />
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100/70 border border-purple-200 text-xs font-bold text-purple-900 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-purple-600" />
                  <span>Panneau Super Admin</span>
                </div>
                <ChevronRight size={14} className="text-purple-600" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── User Profile Docked Footer ── */}
      <div className="p-3 border-t border-border bg-card">
        {user ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-amber-500 flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-sm">
                {(user.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user.full_name || user.email}</p>
                <div className="mt-0.5">{roleBadge()}</div>
              </div>
            </div>
            <Link
              to="/mon-espace"
              title="Paramètres"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
            >
              <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              to="/login"
              className="w-full h-9 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 shadow-md shadow-primary/20"
            >
              Se connecter
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
