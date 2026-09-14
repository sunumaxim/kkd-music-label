// KKD Music — Magasin de données local résilient (Local Storage & Cache)
// Assure la continuité de service en cas de panne réseau ou d'indisponibilité du backend Base44/Firebase

const USER_STORAGE_KEY = 'kkd_current_user_v1';
const DB_STORAGE_KEY = 'kkd_local_db_v1';

// Utilisateur par défaut de secours si aucun utilisateur n'est connecté
const DEFAULT_FALLBACK_USER = {
  id: 'usr_kkd_admin_default',
  email: 'storesmaxim@gmail.com',
  full_name: 'SunuMaxim KKD Music',
  role: 'admin',
  account_type: 'label_admin',
  artist_name: 'KKD Music Label',
  verified: true,
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Administrateur principal du label panafricain KKD Music.',
  created_at: new Date().toISOString(),
};

// Données d'exemple pré-remplies pour garantir un affichage immédiat même en cas d'erreur réseau Base44
const INITIAL_RELEASES = [
  {
    id: 'rel_1',
    title: 'Dakar Night Groove',
    artist_name: 'Amadou & The Band',
    artist_id: 'art_1',
    release_type: 'album',
    genre: 'Afrobeats',
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    audio_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    price: 3500,
    currency: 'XOF',
    description: 'Une fusion envoûtante de rythmes traditionnels sénégalais et d’afro-fusion moderne.',
    play_count: 14200,
    created_date: '2025-01-15T12:00:00Z',
    is_premium: false,
    tracklist: [
      { title: 'Dakar Night Groove', duration: '3:45', audio_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
      { title: 'Teranga Soul', duration: '4:12', audio_url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' }
    ]
  },
  {
    id: 'rel_2',
    title: 'Lagos Vibrations',
    artist_name: 'Kemi Beats',
    artist_id: 'art_2',
    release_type: 'single',
    genre: 'Afro-fusion',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    audio_url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
    price: 1500,
    currency: 'XOF',
    description: 'Banger afro-house prêt pour les clubs et les challenges viraux TikTok.',
    play_count: 28500,
    created_date: '2025-02-01T10:00:00Z',
    is_premium: true,
    tracklist: [
      { title: 'Lagos Vibrations', duration: '3:18', audio_url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' }
    ]
  },
  {
    id: 'rel_3',
    title: 'Abidjan Coupé Étoile',
    artist_name: 'DJ Rodrigue',
    artist_id: 'art_3',
    release_type: 'single',
    genre: 'Coupé Décalé',
    cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    audio_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=tropical-house-110041.mp3',
    price: 2000,
    currency: 'XOF',
    description: 'Rythme endiablé pour faire danser toute l’Afrique de l’Ouest.',
    play_count: 19800,
    created_date: '2025-02-14T08:30:00Z',
    is_premium: false,
    tracklist: [
      { title: 'Abidjan Coupé Étoile', duration: '3:30', audio_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3' }
    ]
  }
];

class LocalDatabase {
  constructor() {
    this._initStorage();
  }

  _initStorage() {
    try {
      if (typeof window === 'undefined') return;
      if (!localStorage.getItem(DB_STORAGE_KEY)) {
        const initial = {
          releases: INITIAL_RELEASES,
          artists: [
            { id: 'art_1', name: 'Amadou & The Band', country: 'Sénégal', verified: true, tiktok_username: 'amadou_band' },
            { id: 'art_2', name: 'Kemi Beats', country: 'Nigeria', verified: true, tiktok_username: 'kemibeats' },
            { id: 'art_3', name: 'DJ Rodrigue', country: 'Côte d’Ivoire', verified: true, tiktok_username: 'djrodrigue_ci' }
          ],
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

  _write(data) {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
      this.broadcastUpdate();
    } catch (e) {
      console.warn('[LocalDb] Write warning:', e);
    }
  }

  broadcastUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kkd:db_updated'));
    }
  }

  getCurrentUser() {
    try {
      if (typeof window === 'undefined') return DEFAULT_FALLBACK_USER;
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) {
        // Enregistrer l'utilisateur admin par défaut pour que l'app soit directement accessible
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(DEFAULT_FALLBACK_USER));
        return DEFAULT_FALLBACK_USER;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_FALLBACK_USER;
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
      this.broadcastUpdate();
    } catch (e) {
      console.warn('[LocalDb] setCurrentUser warning:', e);
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
    const data = this._read();
    data[name] = items;
    this._write(data);
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
