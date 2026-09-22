import { base44 } from '@/api/base44Client';

// Local storage session key for instant optimistic purchase resolution
const SESSION_UNLOCKED_TRACKS_KEY = 'kkd_unlocked_tracks_v1';

function getSessionUnlockedIds() {
  try {
    const raw = localStorage.getItem(SESSION_UNLOCKED_TRACKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addSessionUnlockedId(id) {
  if (!id) return;
  try {
    const current = getSessionUnlockedIds();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(SESSION_UNLOCKED_TRACKS_KEY, JSON.stringify(current));
    }
  } catch {
    /* noop */
  }
}

/**
 * Service centralisé de Contrôle d'Accès KKD Music
 * Vérifie l'état de chaque piste ('Gratuit' vs 'En vente') avant lecture.
 */
export const accessControlService = {
  /**
   * Analyse et détermine le statut d'accès exhaustif d'une piste ou d'un élément audio.
   *
   * @param {Object} track - Objet piste ou release
   * @param {Object} options - { purchases: Array, user: Object, isAdmin: boolean }
   * @returns {Object} { accessMode, isForSale, isFree, isPurchased, canPlay, isLocked, price, reason }
   */
  getTrackAccessStatus(track, options = {}) {
    if (!track) {
      return {
        accessMode: 'gratuit',
        statusLabel: 'Gratuit',
        isForSale: false,
        isFree: true,
        isPurchased: false,
        canPlay: false,
        isLocked: false,
        price: 0,
        reason: 'invalid_track',
      };
    }

    const { purchases = [], user = null, isAdmin = false } = options;

    // 1. Évaluation de l'état : 'Gratuit' vs 'En vente'
    const isExplicitlyForSale = Boolean(
      track.is_for_sale === true ||
      track.access_mode === 'en_vente' ||
      track.access_control === 'paid_only' ||
      track.is_free === false
    );

    // Vérifie si un prix est fixé supérieur à 0
    const rawPrice = Number(track.price);
    const hasPrice = !isNaN(rawPrice) && rawPrice > 0;

    // La piste est considérée 'En vente' si elle est marquée en vente OU si elle a un prix > 0
    const isForSale = isExplicitlyForSale || (hasPrice && track.is_free !== true);
    const price = isForSale ? (hasPrice ? rawPrice : 500) : 0;
    const isFree = !isForSale;
    const accessMode = isForSale ? 'en_vente' : 'gratuit';

    // 2. Si la piste est 'Gratuit', accès autorisé immédiatement
    if (isFree) {
      return {
        accessMode: 'gratuit',
        statusLabel: 'Gratuit',
        isForSale: false,
        isFree: true,
        isPurchased: false,
        canPlay: true,
        isLocked: false,
        price: 0,
        reason: 'free_public',
        trackId: track.id || track.key || track.item_id,
        title: track.title || 'Titre inconnu',
        artistName: track.artist_name || 'Artiste KKD',
        coverUrl: track.cover_url,
        audioUrl: track.audio_url || track.audio_file_url,
      };
    }

    // 3. Piste 'En vente' : Vérification des droits d'accès
    // A. Bipasse administrateur vérifié
    const isUserAdmin = isAdmin || user?.role === 'admin' || user?.email?.toLowerCase() === 'storesmaxim@gmail.com' || user?.email?.toLowerCase() === 'admin@kkdmusic.com';
    if (isUserAdmin) {
      return {
        accessMode: 'en_vente',
        statusLabel: 'En vente (Admin)',
        isForSale: true,
        isFree: false,
        isPurchased: true,
        canPlay: true,
        isLocked: false,
        price,
        reason: 'admin_bypass',
        trackId: track.id || track.key || track.item_id,
        title: track.title,
        artistName: track.artist_name,
        coverUrl: track.cover_url,
        audioUrl: track.audio_url || track.audio_file_url,
      };
    }

    // B. Déjà marquée comme achetée sur la piste
    if (track.is_purchased === true) {
      return {
        accessMode: 'en_vente',
        statusLabel: 'Acheté',
        isForSale: true,
        isFree: false,
        isPurchased: true,
        canPlay: true,
        isLocked: false,
        price,
        reason: 'already_purchased',
        trackId: track.id || track.key || track.item_id,
        title: track.title,
        artistName: track.artist_name,
        coverUrl: track.cover_url,
        audioUrl: track.audio_url || track.audio_file_url,
      };
    }

    // C. Vérification dans le stockage de session local
    const trackId = track.id || track.item_id || track.key;
    const sessionUnlocked = getSessionUnlockedIds();
    if (trackId && sessionUnlocked.includes(trackId)) {
      return {
        accessMode: 'en_vente',
        statusLabel: 'Acheté',
        isForSale: true,
        isFree: false,
        isPurchased: true,
        canPlay: true,
        isLocked: false,
        price,
        reason: 'session_unlocked',
        trackId,
        title: track.title,
        artistName: track.artist_name,
        coverUrl: track.cover_url,
        audioUrl: track.audio_url || track.audio_file_url,
      };
    }

    // D. Vérification dans la liste des achats utilisateur fournis
    if (Array.isArray(purchases) && purchases.length > 0) {
      const isBought = purchases.some((p) => {
        if (!p) return false;
        if (track.id && (p.item_id === track.id || p.id === track.id)) return true;
        if (track.item_id && p.item_id === track.item_id) return true;
        if (track.key && p.item_id === track.key) return true;
        if (track.release_id && p.item_id === track.release_id) return true;
        // Correspondance par titre et artiste si les identifiants ne sont pas renseignés
        if (p.item_title && track.title && p.item_title.trim().toLowerCase() === track.title.trim().toLowerCase()) {
          return true;
        }
        return false;
      });

      if (isBought) {
        return {
          accessMode: 'en_vente',
          statusLabel: 'Acheté',
          isForSale: true,
          isFree: false,
          isPurchased: true,
          canPlay: true,
          isLocked: false,
          price,
          reason: 'purchase_verified',
          trackId,
          title: track.title,
          artistName: track.artist_name,
          coverUrl: track.cover_url,
          audioUrl: track.audio_url || track.audio_file_url,
        };
      }
    }

    // E. STRICTEMENT IMPOSSIBLE D'ÉCOUTER : Titre en vente non acheté
    return {
      accessMode: 'en_vente',
      statusLabel: 'En vente',
      isForSale: true,
      isFree: false,
      isPurchased: false,
      canPlay: false,
      isLocked: true,
      price,
      reason: 'locked_paywall',
      trackId,
      title: track.title || 'Titre exclusif',
      artistName: track.artist_name || 'Artiste KKD',
      coverUrl: track.cover_url,
      audioUrl: track.audio_url || track.audio_file_url,
    };
  },

  /**
   * Vérification booléenne rapide de jouabilité
   */
  canPlayTrack(track, options = {}) {
    const status = this.getTrackAccessStatus(track, options);
    return status.canPlay;
  },

  /**
   * Déverrouillage d'une piste via achat direct (Wave, OM, Carte)
   */
  async unlockTrack(track, { paymentMethod = 'wave', userEmail = null, queryClient = null } = {}) {
    if (!track) throw new Error('Aucune piste spécifiée pour le déverrouillage.');

    const targetId = track.item_id || track.id || track.key || `trk_${Date.now()}`;
    const price = Number(track.price) || 500;
    const email = userEmail || 'client@kkdmusic.com';

    // 1. Enregistrer dans la table Purchase
    await base44.entities.Purchase.create({
      user_email: email,
      item_type: track.item_type || 'release',
      item_id: targetId,
      item_title: track.title || 'Titre KKD Music',
      artist_name: track.artist_name || 'Artiste KKD',
      amount: price,
      currency: 'XOF',
      status: 'paid',
      payment_method: paymentMethod,
      description: `Achat D2C direct via ${paymentMethod.toUpperCase()} — Titre débloqué instantanément`,
      created_date: new Date().toISOString(),
    });

    // 2. Si c'est une release liée, incrémenter les statistiques de ventes
    if (track.item_id) {
      try {
        const release = await base44.entities.Release.get(track.item_id);
        if (release) {
          await base44.entities.Release.update(track.item_id, {
            sales_count: (release.sales_count || 0) + 1,
          });
        }
      } catch {
        /* noop */
      }
    }

    // 3. Marquer comme déverrouillé dans la session locale
    addSessionUnlockedId(targetId);
    if (track.id) addSessionUnlockedId(track.id);
    if (track.key) addSessionUnlockedId(track.key);

    // 4. Invalider les requêtes React Query
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['my-access'] });
      queryClient.invalidateQueries({ queryKey: ['release'] });
      queryClient.invalidateQueries({ queryKey: ['releases'] });
    }

    // 5. Retourner la piste déverrouillée
    return {
      ...track,
      is_for_sale: true,
      is_purchased: true,
      is_locked: false,
    };
  },
};

export default accessControlService;
