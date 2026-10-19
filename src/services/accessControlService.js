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

    // B. Vérification dans la liste des achats récupérée côté serveur
    const trackId = track.id || track.item_id || track.key;
    if (Array.isArray(purchases) && purchases.length > 0) {
      const isBought = purchases.some((p) => {
        if (!p) return false;
        const purchaseItemId = p.item_id;
        return Boolean(purchaseItemId && [track.id, track.item_id, track.key, track.release_id].filter(Boolean).includes(purchaseItemId));
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
  async unlockTrack() {
    // Ne jamais créer un achat payé ou déverrouiller une piste depuis le navigateur.
    // Le déblocage doit venir d'une session de paiement confirmée côté serveur.
    throw new Error('Déblocage refusé : aucune confirmation de paiement côté serveur. Veuillez utiliser le parcours de paiement sécurisé.');
  },
};

export default accessControlService;
