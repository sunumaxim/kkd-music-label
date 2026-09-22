/**
 * paymentService — Abstraction des paiements KKD Music.
 *
 * Centralise la création de sessions de paiement (Stripe, Square, Wave),
 * la vérification des paiements, et le calcul de la répartition
 * (commission plateforme vs revenu artiste).
 *
 * Implémentation actuelle : fonctions backend Base44 (createCheckoutSession,
 * createSquareCheckout, validateTicketPayment, verifySquarePayment) + lien Wave.
 *
 * Migration Firebase : remplacer les appels de fonctions par Firebase Cloud Functions
 * (stripe.checkout.sessions.create côté serveur). La logique de split reste ici.
 */

import { base44 } from '@/api/base44Client';
import { WAVE_PAY_LINK, WAVE_MERCHANT } from '@/lib/wave';
import { platformConfigService } from './platformConfigService';

export const paymentService = {
  // ── Stripe ──────────────────────────────────────────────
  /**
   * Crée une session de paiement Stripe Checkout.
   * @param {{ itemType: string, itemId: string, amount: number, userEmail?: string, itemTitle?: string, artistName?: string }} params
   * @returns {Promise<{ url: string, session_id: string }>}
   */
  async createCheckoutSession(params) {
    return base44.functions.invoke('createCheckoutSession', params);
  },

  // ── Square ──────────────────────────────────────────────
  async createSquareCheckout(params) {
    return base44.functions.invoke('createSquareCheckout', params);
  },

  async verifySquarePayment(params) {
    return base44.functions.invoke('verifySquarePayment', params);
  },

  // ── Wave (lien de paiement manuel) ───────────────────────
  getWavePayLink() {
    return WAVE_PAY_LINK;
  },

  getWaveMerchant() {
    return WAVE_MERCHANT;
  },

  // ── Billetterie ──────────────────────────────────────────
  async validateTicketPayment(params) {
    return base44.functions.invoke('validateTicketPayment', params);
  },

  // ── Répartition financière ──────────────────────────────
  /**
   * Calcule la répartition d'un paiement brut en commission plateforme + revenu artiste.
   * Délègue au platformConfigService pour le taux de commission.
   * @param {number} grossAmount — Montant brut (FCFA, entier).
   * @returns {{ grossAmount, platformFee, artistRevenue, commissionRate }}
   */
  computeSplit(grossAmount) {
    return platformConfigService.computeSplit(grossAmount);
  },

  /**
   * Vérifie côté backend qu'un paiement a bien été effectué.
   * NE JAMAIS faire confiance à une variable frontend seule.
   */
  async verifyPayment(provider, transactionId) {
    if (provider === 'square') {
      return this.verifySquarePayment({ order_id: transactionId });
    }
    // Stripe : la vérification se fait via webhook (stripeWebhook)
    // Wave : validation manuelle admin (validateTicketPayment)
    return { verified: false, reason: 'manual_verification_required' };
  },
};

export default paymentService;