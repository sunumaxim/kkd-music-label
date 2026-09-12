/**
 * Barrel export — Point d'entrée unique pour la couche de services KKD Music.
 *
 * TOUS les composants/pages/hooks doivent importer depuis ici, jamais depuis
 * `@/api/base44Client` directement. C'est le "seam" d'abstraction pour la
 * migration Firebase : remplacer les implémentations dans chaque service ne
 * casse aucun import côté UI.
 *
 *   import { musicService, authService, storageService } from '@/services';
 */

export { authService } from './authService';
export { storageService } from './storageService';
export { paymentService } from './paymentService';
export { musicService } from './musicService';
export { artistService } from './artistService';
export { purchaseService } from './purchaseService';
export { analyticsService } from './analyticsService';
export { platformConfigService } from './platformConfigService';
export { accessControlService } from './accessControlService';