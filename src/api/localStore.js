// KKD Music — Magasin de données local résilient (Local Storage & Cache)
// Assure la continuité de service en cas de panne réseau ou d'indisponibilité du backend Base44/Firebase

// Clés de stockage local
const USER_STORAGE_KEY = 'kkd_current_user_v1';
// v2 : purge des anciennes données de démonstration stockées dans le navigateur
const DB_STORAGE_KEY = 'kkd_local_db_v2';

// Aucune donnée fictive : le cache local ne conserve que les données réellement servies par le backend.

class LocalDatabase {
  constructor() {
    this._initStorage();
  }

  _initStorage() {
    try {
      if (typeof window === 'undefined') return;
      if (!localStorage.getItem(DB_STORAGE_KEY)) {
        const initial = {
          releases: [],
          artists: [],
          videos: [],
          events: [],
          purchases: [],
          tiktok_accounts: [],
          tiktok_submissions: [],
        };
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(initial));
      }
    } catch (e) {
      console.warn('[LocalDb] Storage init warning:', e);
    }
  }

  _read() {
    try {
      if (typeof window === 'undefined') return {};
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  _write(data, shouldBroadcast = true) {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
      if (shouldBroadcast) {
        this.broadcastUpdate();
      }
    } catch (e) {
      console.warn('[LocalDb] Write warning:', e);
    }
  }

  broadcastUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kkd:db_updated'));
    }
  }

  broadcastUserUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kkd:user_updated'));
    }
  }

  getCurrentUser() {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Nettoyage de sécurité : si un faux admin par défaut a été stocké antérieurement
      if (parsed?.id === 'usr_kkd_admin_default') {
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
      }
      return parsed && parsed.email ? parsed : null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user) {
    try {
      if (typeof window === 'undefined') return;
      if (!user) {
        localStorage.removeItem(USER_STORAGE_KEY);
      } else {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
      this.broadcastUserUpdate();
    } catch (e) {
      console.warn('[LocalDb] setCurrentUser warning:', e);
    }
  }

  clearAuthSession() {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem('kkd_demo_role');
      localStorage.removeItem('kkd_purchase_email');
      localStorage.removeItem('b44_session');
      try {
        sessionStorage.clear();
      } catch {}
      this.broadcastUserUpdate();
    } catch (e) {
      console.warn('[LocalDb] clearAuthSession warning:', e);
    }
  }

  getItem(key) {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    } catch (e) {
      console.warn('[LocalDb] getItem warning:', e);
      return null;
    }
  }

  setItem(key, value) {
    try {
      if (typeof window === 'undefined') return;
      const str = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, str);
      this.broadcastUpdate();
    } catch (e) {
      console.warn('[LocalDb] setItem warning:', e);
    }
  }

  removeItem(key) {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
      this.broadcastUpdate();
    } catch (e) {
      console.warn('[LocalDb] removeItem warning:', e);
    }
  }

  getCollection(name) {
    const data = this._read();
    return Array.isArray(data[name]) ? data[name] : [];
  }

  setCollection(name, items) {
    // Mise en cache différée : elle ne bloque jamais l'affichage de la page.
    try {
      if (typeof window === 'undefined') return;
      if (!this._pendingWrites) {
        this._pendingWrites = new Map();
        setTimeout(() => {
          const pending = this._pendingWrites;
          this._pendingWrites = null;
          if (!pending || !pending.size) return;
          const data = this._read();
          pending.forEach((value, key) => { data[key] = value; });
          this._write(data, false);
        }, 400);
      }
      this._pendingWrites.set(name, items);
    } catch (e) {
      console.warn('[LocalDb] setCollection warning:', e);
    }
  }

  insertItem(collectionName, item) {
    const data = this._read();
    const list = Array.isArray(data[collectionName]) ? [...data[collectionName]] : [];
    const newItem = {
      id: item.id || `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_date: new Date().toISOString(),
      ...item,
    };
    list.unshift(newItem);
    data[collectionName] = list;
    this._write(data);
    return newItem;
  }

  updateItem(collectionName, id, updates) {
    const data = this._read();
    const list = Array.isArray(data[collectionName]) ? [...data[collectionName]] : [];
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates, updated_at: new Date().toISOString() };
      data[collectionName] = list;
      this._write(data);
      return list[index];
    }
    return null;
  }

  deleteItem(collectionName, id) {
    const data = this._read();
    const list = Array.isArray(data[collectionName]) ? [...data[collectionName]] : [];
    const filtered = list.filter(item => item.id !== id);
    data[collectionName] = filtered;
    this._write(data);
    return true;
  }
}

export const localDb = new LocalDatabase();
export default localDb;