import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { localDb } from '@/api/localStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    // Initialisation au montage : active l'indicateur de chargement uniquement ici
    checkUserAuth(true);

    // Écoute uniquement les mises à jour spécifiques du compte utilisateur
    const handleUserUpdate = () => {
      checkUserAuth(false);
    };
    window.addEventListener('kkd:user_updated', handleUserUpdate);

    return () => {
      window.removeEventListener('kkd:user_updated', handleUserUpdate);
    };
  }, []);

  const checkUserAuth = async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoadingAuth(true);
      }
      const currentUser = await base44.auth.me();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        const localUser = localDb.getCurrentUser();
        if (localUser) {
          setUser(localUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.warn('User auth check fallback:', error?.message || error);
      const localUser = localDb.getCurrentUser();
      if (localUser) {
        setUser(localUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      if (isInitial) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    localDb.setCurrentUser(null);
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
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

