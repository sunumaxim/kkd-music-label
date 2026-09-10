// KKD Music — Base44 SDK Client
// Restored to use the real Base44 backend (entities, auth, functions, integrations)
import { createClient } from '@base44/sdk';

const base44 = createClient();

// ── Integration alias: UploadFile → UploadPublicFile ──
// Some app code calls UploadFile; the SDK exposes UploadPublicFile
// Use a Proxy to intercept Core access and add the alias lazily
const _rawIntegrations = base44.integrations;
if (_rawIntegrations && typeof _rawIntegrations === 'object') {
  const _coreCache = new WeakMap();
  base44.integrations = new Proxy(_rawIntegrations, {
    get(target, prop) {
      if (prop === 'Core') {
        const core = target.Core;
        if (!core || typeof core !== 'object') return core;
        if (!_coreCache.has(core)) {
          _coreCache.set(core, new Proxy(core, {
            get(c, cp) {
              if (cp === 'UploadFile' && !c.UploadFile && c.UploadPublicFile) {
                return c.UploadPublicFile;
              }
              return c[cp];
            }
          }));
        }
        return _coreCache.get(core);
      }
      return target[prop];
    }
  });
}

// ── Auth: switchRole — change current user's role (used by PlatformRoleSwitcher) ──
if (!base44.auth.switchRole) {
  base44.auth.switchRole = async (roleKey) => {
    const me = await base44.auth.me();
    if (!me) return null;
    const roleMap = {
      admin: { role: 'admin' },
      label: { role: 'partner' },
      artist: { role: 'partner' },
      fan: { role: 'user' },
    };
    const updates = roleMap[roleKey] || {};
    return base44.auth.updateMe(updates);
  };
}

// ── Users: extend with management methods used by admin pages ──
if (!base44.users.list) {
  base44.users.list = async () => base44.entities.User.list();
}
if (!base44.users.get) {
  base44.users.get = async (idOrEmail) => {
    const list = await base44.entities.User.list();
    return list.find(u => u.id === idOrEmail || u.email?.toLowerCase() === idOrEmail?.toLowerCase()) || null;
  };
}
if (!base44.users.update) {
  base44.users.update = async (id, data) => base44.entities.User.update(id, data);
}
if (!base44.users.delete) {
  base44.users.delete = async (id) => base44.entities.User.delete(id);
}
if (!base44.users.promoteToAdmin) {
  base44.users.promoteToAdmin = async (emailOrId) => {
    const list = await base44.entities.User.list();
    const user = list.find(u => u.id === emailOrId || u.email?.toLowerCase() === emailOrId?.toLowerCase());
    if (!user) return null;
    return base44.entities.User.update(user.id, { role: 'admin' });
  };
}
if (!base44.users.updateRole) {
  base44.users.updateRole = async (emailOrId, newRole) => {
    const list = await base44.entities.User.list();
    const user = list.find(u => u.id === emailOrId || u.email?.toLowerCase() === emailOrId?.toLowerCase());
    if (!user) return null;
    return base44.entities.User.update(user.id, { role: newRole });
  };
}
if (!base44.users.approveArtistAccess) {
  base44.users.approveArtistAccess = async (requestId) => {
    return base44.entities.ArtistAccessRequest.update(requestId, { status: 'approuve' });
  };
}

export { base44 };