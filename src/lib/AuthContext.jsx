import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { localDb } from '@/api/localStore';
import { firebaseAuthService } from '@/lib/firebase';
import { queryClientInstance } from '@/lib/query-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState(null);

  // Détermination stricte du rôle administrateur
  const isAdmin = useMemo(() => {
    if (!user || !user.email) return false;
    const cleanEmail = user.email.toLowerCase().trim();
    return cleanEmail === 'storesmaxim@gmail.com' || cleanEmail === 'admin@kkdmusic.com' || user.role === 'admin';
  }, [user]);

  useEffect(() => {
    // Écoute de l'état d'authentification Firebase en temps réel avec persistance garantie
    const unsubscribeFirebase = firebaseAuthService.subscribeAuthState(async (fbUser) => {
      try {
        if (fbUser && fbUser.email) {
          setUser(fbUser);
          setIsAuthenticated(true);
          localDb.setCurrentUser(fbUser);
          setAuthError(null);
        } else {
          // Si Firebase confirme qu'aucun utilisateur n'est connecté, purger l'état
          setUser(null);
          setIsAuthenticated(false);
          localDb.clearAuthSession();
        }
      } catch (err) {
        console.error('[AuthContext] Auth state processing error:', err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    // Écoute des mises à jour spécifiques du compte utilisateur
    const handleUserUpdate = (e) => {
      const updated = e?.detail !== undefined ? e.detail : localDb.getCurrentUser();
      if (updated && updated.email) {
        setUser(updated);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    window.addEventListener('kkd:user_updated', handleUserUpdate);

    return () => {
      if (typeof unsubscribeFirebase === 'function') unsubscribeFirebase();
      window.removeEventListener('kkd:user_updated', handleUserUpdate);
    };
  }, []);

  const checkUserAuth = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      if (currentUser && currentUser.email) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.warn('[AuthContext] checkUserAuth notice:', error?.message || error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      if (isInitial) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    }
  }, []);

  // Déconnexion complète et nettoyage approfondi
  const logout = useCallback(async (shouldRedirect = true, redirectPath = '/login') => {
    try {
      // 1. Déconnexion Firebase Auth
      await firebaseAuthService.logout();
    } catch (e) {
      console.warn('[AuthContext] Firebase logout error:', e);
    }

    try {
      // 2. Déconnexion client d'API
      await base44.auth.logout();
    } catch (e) {
      console.warn('[AuthContext] API client logout error:', e);
    }

    // 3. Purge du cache React Query en mémoire
    try {
      queryClientInstance.clear();
    } catch (e) {
      console.warn('[AuthContext] QueryClient clear warning:', e);
    }

    // 4. Nettoyage complet du stockage local et de session
    localDb.clearAuthSession();

    // 5. Réinitialisation de l'état React
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);

    // 6. Notification globale
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kkd:user_updated', { detail: null }));
      window.dispatchEvent(new CustomEvent('kkd:auth_logout'));
    }

    // 7. Redirection sécurisée
    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = redirectPath;
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

