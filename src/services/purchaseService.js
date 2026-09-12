/**
 * purchaseService — Abstraction des achats et de l'accès au contenu KKD Music.
 *
 * Regroupe la récupération des achats utilisateur, la création d'un achat,
 * le rachat (redeem) post-paiement, et les vérifications d'accès (paywall).
 * Délègue la logique de contrôle d'accès à accessControlService.
 *
 * Implémentation actuelle : Base44 SDK (entities.Purchase, functions.getMyPurchases,
 * functions.redeemPurchase) + accessControlService.
 * Migration Firebase : remplacer par Firestore (collection `purchases`) +
 * Cloud Functions pour la vérification de paiement.
 */

import { base44 } from '@/api/base44Client';
import { accessControlService } from './accessControlService';

export const purchaseService = {
  /**
   * Récupère tous les achats validés de l'utilisateur courant.
   * Sur une app publique sans login, retourne [] silencieusement.
   * @returns {Promise<Array>}
   */
  async getMyPurchases() {
    try {
      const res = await base44.functions.invoke('getMyPurchases', {});
      return res.data?.purchases || res.purchases || [];
    } catch {
      return [];
    }
  },

  /**
   * Récupère l'accès d'un utilisateur pour un item donné (release ou video).
   * @returns {Promise<Object|null>}
   */
  async getAccessForItem(itemId) {
    const purchases = await this.getMyPurchases();
    if (!itemId) return null;
    return purchases.find((p) => p.item_id === itemId) || null;
  },

  /**
   * Crée un enregistrement d'achat (après confirmation de paiement côté backend).
   */
  async createPurchase(data) {
    return base44.entities.Purchase.create(data);
  },

  /**
   * Rachaète un contenu post-paiement Stripe (redeem via backend).
   */
  async redeemPurchase(params) {
    return base44.functions.invoke('redeemPurchase', params);
  },

  // ── Contrôle d'accès (délégation) ─────────────────────────
  getTrackAccessStatus(track, options = {}) {
    return accessControlService.getTrackAccessStatus(track, options);
  },

  canPlayTrack(track, options = {}) {
    return accessControlService.canPlayTrack(track, options);
  },

  async unlockTrack(track, options = {}) {
    return accessControlService.unlockTrack(track, options);
  },
};

export default purchaseService;