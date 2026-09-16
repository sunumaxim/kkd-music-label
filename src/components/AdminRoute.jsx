import React from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ShieldAlert, LogOut, Loader2, Home, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, user, isAdmin, logout } = useAuth();
  const location = useLocation();

  // 1. Session Firebase en cours de résolution
  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background text-foreground z-50 p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Vérification des accès administrateur KKD Music...
          </p>
        </div>
      </div>
    );
  }

  // 2. Non authentifié : redirection vers la connexion avec mémorisation de l'URL cible
  if (!isAuthenticated || !user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }

  // 3. Authentifié mais NON ADMINISTRATEUR : blocage strict avec écran explicite
  if (!isAdmin && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-destructive/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto ring-8 ring-destructive/5">
            <ShieldAlert size={36} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
              <Lock size={12} /> Zone Sécurisée Direction
            </div>
            <h1 className="text-2xl font-display font-extrabold text-foreground">
              Accès Administrateur Refusé
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le tableau de bord administratif est strictement réservé à la direction et aux gestionnaires habilités de KKD Music.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/60 border border-border/60 text-left text-xs space-y-1.5">
            <div className="text-muted-foreground">Compte connecté :</div>
            <div className="font-semibold text-foreground truncate">{user.email}</div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                Statut : {user.role === 'artist' ? 'Artiste' : (user.account_type || 'Membre')}
              </span>
              <span className="text-[11px] text-destructive font-medium">
                Privilèges insuffisants
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full h-10 border-border gap-2 font-medium">
                <Home size={15} /> Accueil
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={() => logout(true, `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`)}
              className="flex-1 h-10 gap-2 font-medium"
            >
              <LogOut size={15} /> Changer de compte
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authentifié ET Administrateur vérifié
  return <Outlet />;
}