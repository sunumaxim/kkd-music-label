import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Search, ChevronLeft, ChevronRight, Upload,
  LogOut, LayoutDashboard, X, ShieldCheck, Settings
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import NotificationBell from '@/components/shared/NotificationBell';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import BrandLogo from '@/components/brand/BrandLogo';

const QUICK_FILTERS = [
  { label: 'Tout', path: '/musique' },
  { label: 'Morceaux', path: '/musique' },
  { label: 'Artistes', path: '/artistes' },
  { label: 'Clips', path: '/videos' },
];

export default function PublicTopbar() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
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
      className="fixed top-0 left-0 md:left-64 right-0 z-40 h-16 min-w-0 bg-card/90 backdrop-blur-xl border-b border-border flex items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-6 select-none shadow-sm"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* ── Gauche : Historique Spotify (< et >) + Mobile Logo ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile Brand Logo Officiel */}
        <Link to="/" className="md:hidden flex items-center shrink-0 mr-1">
          <BrandLogo className="h-8 w-auto" showSubtext={false} />
        </Link>

        {/* History Nav Arrows (Spotify Desktop Style) */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => window.history.back()}
            title="Page précédente"
            className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => window.history.forward()}
            title="Page suivante"
            className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ── Centre : Search Pill Bar (Spotify / Audiomack style) ── */}
      <div className="flex-1 min-w-0 max-w-xl mx-auto flex items-center gap-2">
        <form onSubmit={submit} className="relative flex-1 min-w-0 hidden sm:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un artiste, un titre ou un clip…"
            className="w-full pl-10 pr-9 py-2 rounded-full bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </form>

        <button type="button" onClick={() => navigate("/recherche")} aria-label="Ouvrir la recherche" className="sm:hidden w-9 h-9 shrink-0 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground">
          <Search size={17} />
        </button>

        {/* Quick Category Chips (Desktop) */}
        <div className="hidden xl:flex items-center gap-1">
          {QUICK_FILTERS.slice(0, 3).map((f) => (
            <Link
              key={f.label}
              to={f.path}
              className={`text-xs px-2.5 py-1.5 rounded-full font-medium transition-colors ${
                location.pathname === f.path
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Droite : Actions Vente & Profil ── */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {/* Action Button Publier / Soumettre ma musique */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('kkd:publish'))}
          className="inline-flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 rounded-full bg-primary text-white text-xs sm:text-sm font-bold hover:brightness-110 shadow-md shadow-primary/20 transition-all active:scale-95 shrink-0" aria-label="Soumettre ou publier une musique" title="Soumettre ma musique"
        >
          <Upload size={14} />
          <span className="hidden sm:inline">Soumettre ma musique</span>
        </button>

        {user ? (
          <>
            <NotificationBell user={user} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full bg-secondary border border-border p-1 sm:pr-3 hover:border-primary/50 transition-all">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-rose-500 flex items-center justify-center text-white text-xs font-black shadow-sm">
                    {initial}
                  </div>
                  <span className="font-semibold text-xs text-foreground max-w-[100px] truncate hidden sm:block">
                    {user.full_name?.split(' ')[0] || user.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-popover border-border text-popover-foreground shadow-xl">
                <DropdownMenuLabel className="space-y-1">
                  <p className="text-sm font-bold text-foreground truncate">{user.full_name || 'Utilisateur'}</p>
                  <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
                  <div className="pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                      {user.role === 'admin' ? 'Super Admin' : user.partner_type === 'label' ? 'Label KKD' : user.artist_id ? 'Artiste Vérifié' : 'Compte Fan'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild>
                  <Link to="/mon-espace" className="flex items-center gap-2 cursor-pointer hover:bg-secondary">
                    <LayoutDashboard size={15} /> Tableau de Bord Artiste / Label
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/parametres" className="flex items-center gap-2 cursor-pointer hover:bg-secondary text-primary font-medium">
                    <Settings size={15} /> Paramètres & Sécurité du Compte
                  </Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-purple-700 hover:bg-purple-50 font-semibold">
                      <ShieldCheck size={15} /> Panneau Super Administration
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600 focus:text-red-700 hover:bg-red-50 cursor-pointer">
                  <LogOut size={15} /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs sm:text-sm font-semibold transition-colors shrink-0"
          >
            Connexion
          </Link>
        )}
      </div>
    </header>
  );
}
