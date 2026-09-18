/**
 * analyticsService — Abstraction des statistiques KKD Music.
 *
 * Centralise le tracking d'événements custom et l'incrémentation des compteurs
 * de lecture. L'UI importe ce service, jamais `base44.analytics` directement.
 *
 * Implémentation actuelle : Base44 SDK (analytics.track, functions.incrementPlay).
 * Migration Firebase : remplacer par Firebase Analytics (logEvent) +
 * Cloud Functions pour incrementPlay (Firestore increment).
 */

import { base44 } from '@/api/base44Client';

export const analyticsService = {
  /**
   * Track un evenement analytics custom.
   * @param {string} eventName - Nom indicatif (ex: "user_purchase_complete").
   * @param {Record<string, any>} [properties] - Proprietes optionnelles
   */
  track(eventName, properties) {
    return base44.analytics.track({ eventName, properties });
  },

  /**
   * Incrémente le compteur d'écoutes d'un contenu (release ou video).
   */
  async incrementPlay(itemId) {
    return base44.functions.invoke('incrementPlay', { item_id: itemId });
  },

  // Événements sémantiques prédéfinis
  trackPlay(itemId, itemType) {
    return this.track('content_play', { item_id: itemId, item_type: itemType });
  },

  trackPurchase(itemId, itemType, amount) {
    return this.track('purchase_complete', {
      item_id: itemId,
      item_type: itemType,
      amount: Number(amount) || 0,
    });
  },

  trackFollow(artistId) {
    return this.track('artist_follow', { artist_id: artistId });
  },

  trackSearch(query, resultCount) {
    return this.track('search', { query, result_count: resultCount });
  },
};

export default analyticsService;