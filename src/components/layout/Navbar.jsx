import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, User, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import NotificationBell from '@/components/shared/NotificationBell';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

const navLinks = [
  { label: 'Accueil', path: '/' },
  { label: 'Artistes', path: '/artistes' },
  { label: 'Musique', path: '/musique' },
  { label: 'Vidéos', path: '/videos' },
  { label: 'Actualités', path: '/actualites' },
  { label: 'Événements', path: '/evenements' },
  { label: 'Partenaires', path: '/partenaires', highlight: true },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

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

  // Fermer menus au changement de route
  useEffect(() => { setIsOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 py-2">
          <Link to="/" className="flex items-center gap-2">
            <img src={LOGO_URL} alt="KKD Music" className="h-14 md:h-16 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-sm font-medium tracking-wide uppercase transition-colors duration-300 ${
                  link.highlight
                    ? location.pathname === link.path
                      ? 'text-primary bg-primary/10 rounded-lg'
                      : 'text-primary border border-primary/40 rounded-lg hover:bg-primary/10'
                    : location.pathname === link.path
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User area */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell user={user} />
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 hover:border-primary/30 transition-colors text-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={13} className="text-primary" />
                    </div>
                    <span className="font-medium max-w-[100px] truncate">{user.full_name?.split(' ')[0] || user.email}</span>
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-12 w-52 bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-border/30">
                          <p className="font-heading font-bold text-sm truncate">{user.full_name || 'Utilisateur'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        {user.role === 'admin' ? (
                          <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 hover:bg-secondary text-sm transition-colors">
                            <ShieldCheck size={15} className="text-primary" /> Administration
                          </Link>
                        ) : (
                          <Link to="/mon-espace" className="flex items-center gap-2 px-4 py-2.5 hover:bg-secondary text-sm transition-colors">
                            <LayoutDashboard size={15} className="text-primary" /> Mon espace
                          </Link>
                        )}
                        <button
                          onClick={() => base44.auth.logout('/')}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-secondary text-sm transition-colors w-full text-left text-muted-foreground hover:text-foreground border-t border-border/30"
                        >
                          <LogOut size={15} /> Déconnexion
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
              >
                <LogIn size={15} /> Connexion
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-foreground">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium uppercase tracking-wide transition-colors rounded-lg ${
                    link.highlight
                      ? 'text-primary border border-primary/30 hover:bg-primary/10'
                      : location.pathname === link.path
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-border/30">
                {user ? (
                  <>
                    {user.role === 'admin' ? (
                      <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary">
                        <ShieldCheck size={15} /> Administration
                      </Link>
                    ) : (
                      <Link to="/mon-espace" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary">
                        <LayoutDashboard size={15} /> Mon espace
                      </Link>
                    )}
                    <button
                      onClick={() => base44.auth.logout('/')}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground w-full"
                    >
                      <LogOut size={15} /> Déconnexion
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary">
                    <LogIn size={15} /> Connexion
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}