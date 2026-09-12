/**
 * platformConfigService — Configuration centralisée de la plateforme KKD Music.
 *
 * Source unique de vérité pour le taux de commission, la devise, le nom de plateforme,
 * et les paramètres globaux. Aucune page/composant ne doit coder le pourcentage de
 * commission en dur — tout le monde importe ce service.
 *
 * Aujourd'hui : constantes + surcharge localStorage (démo/admin).
 * Demain (Firebase) : lecture depuis une collection Firestore `platformSettings`.
 */

const DEFAULT_COMMISSION_RATE = 0.10; // 10%
const DEFAULT_CURRENCY = 'XOF'; // Franc CFA
const DEFAULT_PLATFORM_NAME = 'KKD Music';
const STORAGE_KEY = 'kkd_platform_config_v1';

function readLocalOverride() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalOverride(partial) {
  try {
    const current = readLocalOverride();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...partial }));
  } catch {
    /* noop */
  }
}

export const platformConfigService = {
  /**
   * Taux de commission de la plateforme (0–1).
   * Ex: 0.10 = 10% prélevé par la plateforme.
   */
  getCommissionRate() {
    const override = readLocalOverride();
    if (typeof override.commissionRate === 'number') return override.commissionRate;
    return DEFAULT_COMMISSION_RATE;
  },

  setCommissionRate(rate) {
    const clamped = Math.min(1, Math.max(0, Number(rate) || 0));
    writeLocalOverride({ commissionRate: clamped });
    return clamped;
  },

  getCurrency() {
    const override = readLocalOverride();
    return override.currency || DEFAULT_CURRENCY;
  },

  getPlatformName() {
    return DEFAULT_PLATFORM_NAME;
  },

  isMaintenanceMode() {
    const override = readLocalOverride();
    return Boolean(override.maintenanceMode);
  },

  setMaintenanceMode(enabled) {
    writeLocalOverride({ maintenanceMode: Boolean(enabled) });
  },

  /**
   * Calcule la répartition d'un paiement brut en commission plateforme + revenu net artiste.
   * @param {number} grossAmount — Montant brut en plus petite unité de devise (FCFA = entier)
   * @returns {{ grossAmount, platformFee, artistRevenue, commissionRate }}
   */
  computeSplit(grossAmount) {
    const amount = Math.max(0, Number(grossAmount) || 0);
    const rate = this.getCommissionRate();
    const platformFee = Math.round(amount * rate);
    const artistRevenue = amount - platformFee;
    return { grossAmount: amount, platformFee, artistRevenue, commissionRate: rate };
  },

  /** Récupère tous les paramètres en un seul appel (pour dashboards). */
  getAll() {
    return {
      commissionRate: this.getCommissionRate(),
      currency: this.getCurrency(),
      platformName: this.getPlatformName(),
      maintenanceMode: this.isMaintenanceMode(),
    };
  },
};

export default platformConfigService;