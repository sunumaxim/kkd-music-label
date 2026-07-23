import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, LogIn, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import NotificationBell from '@/components/shared/NotificationBell';

export default function PublicTopbar() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

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
            <NotificationBell user={user} />
            <Link
              to={user.role === 'admin' ? '/admin' : '/mon-espace'}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-border/50 text-sm hover:border-primary/30 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={13} className="text-primary" />
              </div>
              <span className="font-medium max-w-[100px] truncate hidden sm:block">
                {user.full_name?.split(' ')[0] || user.email}
              </span>
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary/80 transition-colors"
          >
            <LogIn size={15} /> <span className="hidden sm:block">Connexion</span>
          </Link>
        )}
      </div>
    </header>
  );
}