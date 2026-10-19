/**
 * tiktokService — Intégration officielle de l'API TikTok pour KKD Music / NIA.
 *
 * Principes clés :
 * 1. Sécurité des clés : Les identifiants API (Client Key & Secret) sont protégés et ne sont jamais affichés en clair dans l'UI.
 * 2. Compte officiel unique : Connexion exclusive avec notre propre compte officiel (Label / Propriétaire).
 * 3. Flux OAuth 2.0 officiel : Login Kit TikTok avec redirection sécurisée (postMessage popup).
 * 4. Gestion des autorisations & permissions (Publication de vidéos, Répertoire TikTok Sounds, Profil).
 * 5. Publication directe (Content Posting API) & Distribution au répertoire officiel TikTok Sounds.
 */

import { localDb } from '@/api/localStore';

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

// Identifiants configurés de manière sécurisée côté application
const TIKTOK_CREDENTIALS = {
  // La Client Key est publique. Le Client Secret ne doit jamais être lu depuis Vite
  // ni inclus dans le bundle navigateur : l'échange OAuth doit se faire côté serveur.
  clientKey: env.VITE_TIKTOK_CLIENT_KEY || '',
  authEndpoint: 'https://www.tiktok.com/v2/auth/authorize/',
  tokenEndpoint: 'https://open.tiktokapis.com/v2/oauth/token/',
  publishEndpoint: 'https://open.tiktokapis.com/v2/post/publish/video/init/',
  scopes: ['user.info.basic', 'video.upload', 'video.publish'],
};

const OFFICIAL_ACCOUNT_KEY = 'tiktok_official_connected_account';

// Structure par défaut si aucun compte n'a encore été lié
const INITIAL_OFFICIAL_ACCOUNT = {
  connected: false,
  id: null,
  username: null,
  display_name: 'Compte TikTok non connecté',
  avatar_url: null,
  account_type: 'label_official',
  verified: false,
  followers_count: 0,
  likes_count: 0,
  permissions: [],
  status: 'disconnected',
};

export const tiktokService = {
  /**
   * Retourne l'état de configuration sécurisé (SANS JAMAIS exposer les clés en clair).
   */
  getSecurityStatus() {
    return {
      isConfigured: false,
      hasClientKey: Boolean(TIKTOK_CREDENTIALS.clientKey),
      hasClientSecret: false,
      authEndpoint: TIKTOK_CREDENTIALS.authEndpoint,
      scopes: TIKTOK_CREDENTIALS.scopes,
      encryption: 'Secret requis côté serveur',
      message: 'La connexion TikTok réelle doit être configurée côté serveur avant activation.',
    };
  },

  /**
   * Retourne l'URL de callback OAuth officielle pour l'environnement actuel.
   */
  getRedirectUri() {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/tiktok/callback`;
    }
    return 'https://ais-pre-lz3xqpnx745xam4y7lmv6t-52650612957.europe-west2.run.app/auth/tiktok/callback';
  },

  /**
   * Construit l'URL d'autorisation officielle TikTok OAuth 2.0 (Login Kit).
   */
  getOAuthUrl() {
    // Ne pas lancer un OAuth qui annoncerait ensuite une connexion fictive.
    // L'échange du code, la validation du state et le stockage des tokens côté serveur
    // doivent être implémentés avant d'activer ce bouton.
    throw new Error('Connexion TikTok temporairement désactivée : l’authentification sécurisée côté serveur doit être configurée.');
  },

  /**
   * Récupère le compte TikTok officiel actuellement connecté.
   */
  getOfficialAccount() {
    try {
      if (typeof localDb?.getItem === 'function') {
        const saved = localDb.getItem(OFFICIAL_ACCOUNT_KEY);
        if (saved?.auth_verified === true && saved?.connected === true) return saved;
        if (typeof localDb?.setItem === 'function') {
          localDb.setItem(OFFICIAL_ACCOUNT_KEY, INITIAL_OFFICIAL_ACCOUNT);
        }
      }
    } catch (e) {
      console.warn('[tiktokService] getOfficialAccount error:', e);
    }
    return INITIAL_OFFICIAL_ACCOUNT;
  },

  /**
   * Connecte ou met à jour notre propre compte TikTok officiel (après OAuth ou saisie du compte réel).
   */
  connectOfficialAccount() {
    throw new Error('Un nom de compte ne suffit pas à autoriser l’API TikTok. Utilisez une connexion OAuth réelle après activation du backend sécurisé.');
  },

  /**
   * Déconnecte notre compte officiel.
   */
  disconnectOfficialAccount() {
    const disconnected = {
      connected: false,
      status: 'disconnected',
      username: null,
      display_name: null,
      permissions: [],
    };
    localDb.setItem(OFFICIAL_ACCOUNT_KEY, disconnected);
    localDb.setCollection('tiktok_accounts', []);
    return disconnected;
  },

  /**
   * Gère le retour de l'autorisation OAuth 2.0 reçue depuis la fenêtre callback.
   */
  handleOAuthSuccess() {
    throw new Error('Le code OAuth TikTok n’a pas été échangé côté serveur. Aucune connexion n’a été enregistrée.');
  },

  /**
   * Teste la validité de la connexion et des autorisations avec TikTok API.
   */
  async testConnection() {
    const account = this.getOfficialAccount();
    if (!account || !account.connected) {
      throw new Error('Aucun compte TikTok n\'est actuellement connecté.');
    }

    throw new Error('Test impossible : aucune connexion TikTok réelle n’est configurée pour le moment.');
  },

  /**
   * Publication directe d'une vidéo vers notre compte TikTok officiel (Content Posting API).
   */
  async publishDirectVideo() {
    throw new Error('Publication TikTok désactivée : aucune requête réelle à l’API n’est encore configurée.');
  },

  /**
   * Récupère l'historique des publications directes TikTok.
   */
  getPublishedPosts() {
    return localDb.getCollection('tiktok_posts');
  },

  /**
   * Transmet un morceau musical au répertoire officiel TikTok Sounds (Commercial Music Library).
   */
  async distributeTrackToTikTokSounds() {
    throw new Error('Distribution TikTok Sounds désactivée : aucune soumission réelle n’est encore connectée au distributeur.');
  },

  /**
   * Récupère la liste de tous les morceaux transmis au répertoire musical TikTok.
   */
  getSoundDistributions() {
    // Ne montrer que les soumissions confirmées par le service réel, jamais des exemples présentés comme approuvés.
    return (localDb.getCollection('tiktok_submissions') || []).filter(item => item?.provider_confirmed === true);
  },

  /**
   * Pour compatibilité avec les composants existants
   */
  connectAccount(data) {
    if (data?.account_type === 'label_official') {
      return this.connectOfficialAccount(data);
    }
    return data;
  },

  getConnectedAccounts() {
    const official = this.getOfficialAccount();
    return official?.connected === true && official?.auth_verified === true ? [official] : [];
  },
};

export default tiktokService;
