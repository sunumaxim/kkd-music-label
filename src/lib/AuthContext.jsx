import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { localDb } from '@/api/localStore';
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
    let cancelled = false;

    const initAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (cancelled) return;
        if (isAuth) {
          try {
            const currentUser = await base44.auth.me();
            if (cancelled) return;
            if (currentUser && currentUser.email) {
              setUser(currentUser);
              setIsAuthenticated(true);
              localDb.setCurrentUser(currentUser);
              setAuthError(null);
            } else {
              setUser(null);
              setIsAuthenticated(false);
              localDb.clearAuthSession();
            }
          } catch (err) {
            if (cancelled) return;
            console.warn('[AuthContext] me() notice:', err?.message || err);
            setUser(null);
            setIsAuthenticated(false);
            localDb.clearAuthSession();
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localDb.clearAuthSession();
        }
      } catch (err) {
        if (cancelled) return;
        console.warn('[AuthContext] isAuthenticated() notice:', err?.message || err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (!cancelled) {
          setIsLoadingAuth(false);
          setAuthChecked(true);
        }
      }
    };

    initAuth();

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
      cancelled = true;
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

  // Déconnexion complète
  const logout = useCallback(async (shouldRedirect = true, redirectPath = '/login') => {
    try {
      await base44.auth.logout();
    } catch (e) {
      console.warn('[AuthContext] logout error:', e);
    }

    try {
      queryClientInstance.clear();
    } catch (e) {
      console.warn('[AuthContext] QueryClient clear warning:', e);
    }

    localDb.clearAuthSession();

    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kkd:user_updated', { detail: null }));
      window.dispatchEvent(new CustomEvent('kkd:auth_logout'));
    }

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