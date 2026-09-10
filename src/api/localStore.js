// KKD Music — Autonomous Local Database & Base44 Adapter
// Permet un fonctionnement complet, réactif et persistant sans dépendance serveur Base44 pour le moment.

const STORAGE_KEY = 'kkd_music_local_db_v2';
const AUTH_KEY = 'kkd_music_current_user_v2';

// ── SEED DATA COMPLET & RÉALISTE ──
// ── DONNÉES SYSTÈME MINIMALES (uniquement comptes admin pour la gestion plateforme) ──
const SEED_DATA = {
  User: [
    {
      id: 'usr_admin_01',
      email: 'admin@kkdmusic.com',
      full_name: 'Abdoulaye Sylla',
      role: 'admin',
      account_type: 'admin',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      description: 'Super Administrateur Principal KKD Music — Accès total à la plateforme',
      created_date: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'usr_admin_owner',
      email: 'storesmaxim@gmail.com',
      full_name: 'Propriétaire / Super Admin',
      role: 'admin',
      account_type: 'admin',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      description: 'Super Administrateur KKD Music — Accès total global',
      created_date: '2026-01-01T00:00:00.000Z'
    }
  ]
};

// ── IDs DES ANCIENNES DONNÉES DE TEST À PURGER DU LOCALSTORAGE ──
const SEED_DATA_IDS = new Set([
  'art_sidy_diop', 'art_wally_seck', 'art_viviane', 'art_dip', 'art_didi_b', 'art_fatoumata',
  'rel_amour_verite', 'rel_dakar_renaissance', 'rel_sunu_gaal', 'rel_lelu_ep', 'rel_mojo_trone',
  'ev_kkd_fest_2026', 'ev_sidy_live_cices',
  'tkt_demo_01',
  'purch_sidy_01', 'purch_wally_02',
  'wave_pay_01',
  'lic_sync_01',
  'pub_sidy_new',
  'aar_sidy', 'aar_label',
  'inv_sidy', 'inv_label_sidy', 'inv_label_wally',
  'vid_sidy_01', 'vid_wally_02',
  'news_01', 'news_02',
  'req_distrib_01',
  'std_01',
  'ply_afro_hits',
  'usr_label_01', 'usr_artist_01', 'usr_fan_01',
]);

// ── COMPTE ADMIN PRÉCONFIGURÉ (accès plateforme uniquement) ──
export const PRESET_USERS = {
  admin: {
    id: 'usr_admin_01',
    email: 'admin@kkdmusic.com',
    full_name: 'Abdoulaye Sylla (Super Admin)',
    role: 'admin',
    account_type: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    description: 'Administrateur Principal KKD Music — Gestion globale de la plateforme, validation et finances.'
  }
};

class LocalStorageEngine {
  constructor() {
    this.subscribers = new Set();
    this.initDb();
  }

  initDb() {
    if (typeof window === 'undefined') return;
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    } else {
      try {
        const db = JSON.parse(existing);
        let changed = false;

        // Purge old test/seed data records (preserve real user data)
        for (const [entityName, records] of Object.entries(db)) {
          if (Array.isArray(records)) {
            const filtered = records.filter(r => !SEED_DATA_IDS.has(r.id));
            if (filtered.length !== records.length) {
              db[entityName] = filtered;
              changed = true;
            }
          }
        }

        // Ensure admin users exist
        if (!db.User || !Array.isArray(db.User) || db.User.length === 0) {
          db.User = JSON.parse(JSON.stringify(SEED_DATA.User));
          changed = true;
        } else {
          const hasOwner = db.User.some(u => u.email?.toLowerCase() === 'storesmaxim@gmail.com');
          if (!hasOwner) {
            db.User.push(JSON.parse(JSON.stringify(SEED_DATA.User.find(u => u.id === 'usr_admin_owner'))));
            changed = true;
          }
          const hasAdmin = db.User.some(u => u.email?.toLowerCase() === 'admin@kkdmusic.com');
          if (!hasAdmin) {
            db.User.push(JSON.parse(JSON.stringify(SEED_DATA.User.find(u => u.id === 'usr_admin_01'))));
            changed = true;
          }
        }

        if (changed) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        }
      } catch (e) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      }
    }
    // Set default user if none
    const curUser = localStorage.getItem(AUTH_KEY);
    if (!curUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(PRESET_USERS.admin));
    }
  }

  getDb() {
    if (typeof window === 'undefined') return JSON.parse(JSON.stringify(SEED_DATA));
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : JSON.parse(JSON.stringify(SEED_DATA));
    } catch {
      return JSON.parse(JSON.stringify(SEED_DATA));
    }
  }

  saveDb(db) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      this.notify();
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  subscribe(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  notify() {
    for (const sub of this.subscribers) {
      try { sub(); } catch (_) {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kkd:db_updated'));
    }
  }

  // ── ENTITY OPERATIONS ──
  getTable(entityName) {
    const db = this.getDb();
    if (!db[entityName]) {
      db[entityName] = [];
      this.saveDb(db);
    }
    return db[entityName] || [];
  }

  sortItems(items, sort) {
    if (!sort) return items;
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    return [...items].sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return desc ? valB - valA : valA - valB;
      }
      return desc ? String(valB).localeCompare(String(valA)) : String(valA).localeCompare(String(valB));
    });
  }

  async list(entityName, sort, limit) {
    let items = this.getTable(entityName);
    if (sort) items = this.sortItems(items, sort);
    if (limit && limit > 0) items = items.slice(0, limit);
    return JSON.parse(JSON.stringify(items));
  }

  async filter(entityName, query = {}, sort, limit) {
    let items = this.getTable(entityName);
    items = items.filter(item => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val) return false;
      }
      return true;
    });
    if (sort) items = this.sortItems(items, sort);
    if (limit && limit > 0) items = items.slice(0, limit);
    return JSON.parse(JSON.stringify(items));
  }

  async get(entityName, id) {
    const items = this.getTable(entityName);
    const item = items.find(i => i.id === id);
    if (!item) throw new Error(`${entityName} with id ${id} not found`);
    return JSON.parse(JSON.stringify(item));
  }

  async create(entityName, data) {
    const db = this.getDb();
    if (!db[entityName]) db[entityName] = [];
    const newId = data.id || `${entityName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newItem = {
      ...data,
      id: newId,
      created_date: data.created_date || new Date().toISOString()
    };
    db[entityName].unshift(newItem);
    this.saveDb(db);
    return JSON.parse(JSON.stringify(newItem));
  }

  async update(entityName, id, updates) {
    const db = this.getDb();
    if (!db[entityName]) db[entityName] = [];
    const idx = db[entityName].findIndex(i => i.id === id);
    if (idx === -1) {
      // If not found, create it
      return this.create(entityName, { ...updates, id });
    }
    db[entityName][idx] = { ...db[entityName][idx], ...updates, updated_date: new Date().toISOString() };
    this.saveDb(db);
    return JSON.parse(JSON.stringify(db[entityName][idx]));
  }

  async delete(entityName, id) {
    const db = this.getDb();
    if (!db[entityName]) return true;
    db[entityName] = db[entityName].filter(i => i.id !== id);
    this.saveDb(db);
    return true;
  }

  async bulkCreate(entityName, items) {
    const created = [];
    for (const item of items) {
      created.push(await this.create(entityName, item));
    }
    return created;
  }

  async bulkUpdate(entityName, items) {
    const updated = [];
    for (const item of items) {
      if (item.id) updated.push(await this.update(entityName, item.id, item));
    }
    return updated;
  }

  async deleteMany(entityName, query = {}) {
    const db = this.getDb();
    if (!db[entityName]) return true;
    db[entityName] = db[entityName].filter(item => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] === val) return false;
      }
      return true;
    });
    this.saveDb(db);
    return true;
  }

  // ── AUTHENTICATION & USERS ──
  getCurrentUser() {
    if (typeof window === 'undefined') return PRESET_USERS.admin;
    try {
      const data = localStorage.getItem(AUTH_KEY);
      return data ? JSON.parse(data) : PRESET_USERS.admin;
    } catch {
      return PRESET_USERS.admin;
    }
  }

  setCurrentUser(user) {
    if (typeof window === 'undefined') return;
    if (!user) {
      localStorage.removeItem(AUTH_KEY);
    } else {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      // Also update/sync with User table
      try {
        const db = this.getDb();
        if (!db.User) db.User = [];
        const idx = db.User.findIndex(u => u.id === user.id || (u.email && u.email.toLowerCase() === user.email?.toLowerCase()));
        if (idx >= 0) {
          db.User[idx] = { ...db.User[idx], ...user };
        } else {
          db.User.push(user);
        }
        this.saveDb(db);
      } catch (e) {
        console.error('Failed to sync user into User table', e);
      }
    }
    this.notify();
  }

  getUserByEmail(email) {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    const db = this.getDb();
    if (!db.User) return null;
    return db.User.find(u => u.email && u.email.toLowerCase().trim() === normalized) || null;
  }

  upsertUser(userData) {
    if (!userData || !userData.email) return null;
    const normalized = userData.email.toLowerCase().trim();
    const db = this.getDb();
    if (!db.User) db.User = [];
    const idx = db.User.findIndex(u => (u.email && u.email.toLowerCase().trim() === normalized) || (userData.id && u.id === userData.id));
    let savedUser;
    if (idx >= 0) {
      db.User[idx] = { ...db.User[idx], ...userData };
      savedUser = db.User[idx];
    } else {
      savedUser = {
        id: userData.id || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        created_date: new Date().toISOString(),
        ...userData,
      };
      db.User.push(savedUser);
    }
    this.saveDb(db);
    // If current logged-in user is this user, update active session
    const current = this.getCurrentUser();
    if (current && current.email && current.email.toLowerCase().trim() === normalized) {
      this.setCurrentUser({ ...current, ...savedUser });
    }
    return savedUser;
  }

  listUsers() {
    const db = this.getDb();
    return db.User || [];
  }

  deleteUser(id) {
    const db = this.getDb();
    if (!db.User) return true;
    db.User = db.User.filter(u => u.id !== id && u.email !== id);
    this.saveDb(db);
    return true;
  }

  switchRole(roleKey) {
    const current = this.getCurrentUser();
    if (!current) return PRESET_USERS.admin;

    const roleMap = {
      admin: { role: 'admin', account_type: 'admin' },
      label: { role: 'partner', account_type: 'label' },
      artist: { role: 'partner', account_type: 'artist' },
      fan: { role: 'user', account_type: 'user' },
    };

    const updates = roleMap[roleKey] || roleMap.admin;
    const updated = { ...current, ...updates };
    this.setCurrentUser(updated);
    return updated;
  }
}

export const localDb = new LocalStorageEngine();

// Helper to create an entity API proxy
export function createEntityProxy(entityName) {
  return {
    list: (sort, limit) => localDb.list(entityName, sort, limit),
    filter: (query, sort, limit) => localDb.filter(entityName, query, sort, limit),
    get: (id) => localDb.get(entityName, id),
    create: (data) => localDb.create(entityName, data),
    update: (id, data) => localDb.update(entityName, id, data),
    delete: (id) => localDb.delete(entityName, id),
    bulkCreate: (items) => localDb.bulkCreate(entityName, items),
    bulkUpdate: (items) => localDb.bulkUpdate(entityName, items),
    deleteMany: (query) => localDb.deleteMany(entityName, query),
    subscribe: (cb) => localDb.subscribe(cb),
  };
}