// KKD Music — Client API Layer
// Mode autonome complet & persistant pour le Label, les Artistes et l'Administration
import { localDb, createEntityProxy, PRESET_USERS } from './localStore';
import { invokeLocalFunction } from './localFunctions';

// Proxy dynamically instantiating entity handlers
const entitiesProxy = new Proxy({}, {
  get: (_target, prop) => {
    return createEntityProxy(String(prop));
  }
});

export const base44 = {
  entities: entitiesProxy,
  asServiceRole: {
    entities: entitiesProxy
  },
  auth: {
    me: async () => {
      return localDb.getCurrentUser();
    },
    isAuthenticated: async () => {
      return Boolean(localDb.getCurrentUser());
    },
    loginViaEmailPassword: async (email, _password) => {
      const normalized = (email || '').toLowerCase().trim();
      let user = localDb.getUserByEmail(normalized);
      if (!user) {
        const isSuperAdmin = normalized === 'admin@kkdmusic.com' || normalized === 'storesmaxim@gmail.com';
        user = {
          id: `usr_${Date.now()}`,
          email: normalized,
          full_name: normalized.split('@')[0],
          role: isSuperAdmin ? 'admin' : 'user',
          account_type: isSuperAdmin ? 'admin' : 'user',
          avatar_url: `https://images.unsplash.com/photo-${isSuperAdmin ? '1534528741775-53994a69daeb' : '1535713875002-d1d0cf377fde'}?auto=format&fit=crop&w=200&q=80`,
          created_date: new Date().toISOString()
        };
        localDb.upsertUser(user);
      }
      localDb.setCurrentUser(user);
      return user;
    },
    loginWithProvider: async (_provider, redirect = '/') => {
      const user = localDb.getCurrentUser() || PRESET_USERS.fan;
      localDb.setCurrentUser(user);
      if (typeof window !== 'undefined' && redirect) {
        window.location.href = redirect;
      }
      return user;
    },
    register: async ({ email, full_name, role = 'user' }) => {
      const normalized = (email || '').toLowerCase().trim();
      let user = localDb.getUserByEmail(normalized);
      if (!user) {
        const isSuperAdmin = normalized === 'admin@kkdmusic.com' || normalized === 'storesmaxim@gmail.com';
        user = {
          id: `usr_${Date.now()}`,
          email: normalized,
          full_name: full_name || normalized.split('@')[0],
          role: isSuperAdmin ? 'admin' : (role === 'partner' ? 'partner' : 'user'),
          account_type: isSuperAdmin ? 'admin' : (role === 'partner' ? 'artist' : 'user'),
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          created_date: new Date().toISOString()
        };
        localDb.upsertUser(user);
      }
      localDb.setCurrentUser(user);
      return { success: true, user };
    },
    verifyOtp: async ({ email }) => {
      const user = localDb.getCurrentUser() || {
        id: `usr_${Date.now()}`,
        email: email || 'user@kkdmusic.com',
        role: 'user',
        full_name: 'Utilisateur KKD'
      };
      localDb.setCurrentUser(user);
      return { access_token: 'kkd_local_token_' + Date.now(), user };
    },
    resendOtp: async () => ({ success: true }),
    resetPasswordRequest: async () => ({ success: true }),
    resetPassword: async () => ({ success: true }),
    setToken: (token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('base44_token', token);
      }
    },
    logout: async (redirect) => {
      localDb.setCurrentUser(null);
      if (typeof window !== 'undefined' && redirect && typeof redirect === 'string' && redirect.startsWith('/')) {
        window.location.href = redirect;
      }
    },
    updateMe: async (updates) => {
      const current = localDb.getCurrentUser() || {};
      const updated = { ...current, ...updates };
      localDb.setCurrentUser(updated);
      return updated;
    },
    switchRole: (roleKey) => {
      return localDb.switchRole(roleKey);
    },
    redirectToLogin: (url) => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login?from=' + encodeURIComponent(url || '/');
      }
    }
  },
  users: {
    list: async () => {
      return localDb.listUsers();
    },
    get: async (idOrEmail) => {
      return localDb.getUserByEmail(idOrEmail) || localDb.listUsers().find(u => u.id === idOrEmail) || null;
    },
    update: async (id, data) => {
      return localDb.upsertUser({ id, ...data });
    },
    delete: async (id) => {
      return localDb.deleteUser(id);
    },
    inviteUser: async (email, role = 'user') => {
      const normalized = (email || '').toLowerCase().trim();
      let user = localDb.getUserByEmail(normalized);
      if (!user) {
        user = {
          id: `usr_${Date.now()}`,
          email: normalized,
          full_name: normalized.split('@')[0],
          role: role || 'user',
          account_type: role === 'admin' ? 'admin' : (role === 'partner' ? 'artist' : 'user'),
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          created_date: new Date().toISOString(),
        };
        localDb.upsertUser(user);
      } else if (role && user.role !== role) {
        user = localDb.upsertUser({ ...user, role, account_type: role === 'admin' ? 'admin' : (role === 'partner' ? 'artist' : 'user') });
      }
      return { success: true, user };
    },
    promoteToAdmin: async (emailOrId) => {
      const all = localDb.listUsers();
      const user = all.find(u => u.id === emailOrId || (u.email && u.email.toLowerCase() === emailOrId?.toLowerCase()));
      if (!user) return null;
      const updated = localDb.upsertUser({
        ...user,
        role: 'admin',
        account_type: 'admin',
        description: 'Super Administrateur KKD Music — Accès total global',
      });
      return updated;
    },
    updateRole: async (emailOrId, newRole, accountType = null) => {
      const all = localDb.listUsers();
      const user = all.find(u => u.id === emailOrId || (u.email && u.email.toLowerCase() === emailOrId?.toLowerCase()));
      if (!user) return null;
      const updated = localDb.upsertUser({
        ...user,
        role: newRole,
        account_type: accountType || (newRole === 'admin' ? 'admin' : newRole === 'partner' ? 'artist' : 'user'),
      });
      return updated;
    },
    approveArtistAccess: async (requestId) => {
      const req = await localDb.get('ArtistAccessRequest', requestId);
      if (!req) throw new Error('Demande introuvable');
      
      // Update request status
      await localDb.update('ArtistAccessRequest', requestId, {
        status: 'approuve',
        approved_at: new Date().toISOString(),
      });

      // Target user
      const userEmail = (req.user_email || '').toLowerCase().trim();
      let user = localDb.getUserByEmail(userEmail);
      if (!user) {
        user = {
          id: req.user_id || `usr_${Date.now()}`,
          email: userEmail,
          full_name: req.artist_name || userEmail.split('@')[0],
          created_date: new Date().toISOString(),
        };
      }

      // Check or create artist in Artist table
      let artistId = req.artist_id;
      if (!artistId && req.artist_name) {
        const existingArtists = await localDb.filter('Artist', { name: req.artist_name });
        if (existingArtists.length > 0) {
          artistId = existingArtists[0].id;
        } else {
          const newArtist = await localDb.create('Artist', {
            name: req.artist_name,
            bio: req.message || 'Artiste Vérifié KKD Music',
            genre: req.genre || 'Afrobeats / Mbalax',
            is_verified: true,
            photo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
          });
          artistId = newArtist.id;
        }
      }

      // Upgrade user to Partner
      const accountType = req.request_type || 'artist';
      const updatedUser = localDb.upsertUser({
        ...user,
        role: 'partner',
        account_type: accountType,
        artist_name: req.artist_name || user.full_name,
        artist_id: artistId,
        payout_phone: req.payout_phone || req.wave_number || user.payout_phone,
      });

      // Ensure active invite exists
      const existingInvites = await localDb.filter('ArtistInvite', { email: userEmail });
      if (existingInvites.length === 0) {
        await localDb.create('ArtistInvite', {
          email: userEmail,
          artist_id: artistId,
          artist_name: req.artist_name || user.full_name,
          invite_type: accountType === 'label' ? 'label_partenaire' : 'artiste_kkd',
          status: 'actif',
          is_verified: true,
          created_date: new Date().toISOString(),
        });
      } else {
        await localDb.update('ArtistInvite', existingInvites[0].id, {
          status: 'actif',
          artist_id: artistId || existingInvites[0].artist_id,
          artist_name: req.artist_name || existingInvites[0].artist_name,
          is_verified: true,
        });
      }

      return { request: req, user: updatedUser };
    }
  },
  functions: {
    invoke: async (name, payload) => {
      return invokeLocalFunction(name, payload);
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        if (!file) return { file_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' };
        if (typeof file === 'string') return { file_url: file };
        try {
          const url = URL.createObjectURL(file);
          return { file_url: url, url };
        } catch {
          return { file_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' };
        }
      },
      UploadPrivateFile: async ({ file }) => {
        if (!file) return { file_uri: 'kkd_private_audio_master.wav' };
        try {
          const url = URL.createObjectURL(file);
          return { file_uri: url, signed_url: url };
        } catch {
          return { file_uri: 'kkd_private_audio_master.wav' };
        }
      },
      CreateFileSignedUrl: async ({ file_uri }) => {
        return { signed_url: file_uri || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' };
      },
      InvokeLLM: async ({ prompt }) => {
        return {
          response: `KKD Music Éditorial : ${prompt ? prompt.slice(0, 100) : 'Analyse musicale de pointe pour les artistes indépendants africains.'}`
        };
      }
    }
  }
};
