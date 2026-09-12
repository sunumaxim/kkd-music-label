/**
 * authService — Abstraction d'authentification KKD Music.
 *
 * Encapsule toute la logique d'authentification derrière une interface stable.
 * L'UI importe ce service, jamais `base44.auth` directement.
 *
 * Implémentation actuelle : Base44 SDK.
 * Migration Firebase : remplacer le corps des méthodes par Firebase Auth
 * (signInWithEmailAndPassword, onAuthStateChanged, signOut, etc.) sans toucher l'UI.
 */

import { base44 } from '@/api/base44Client';

export const authService = {
  /** Retourne l'utilisateur courant ou lève une erreur si non connecté. */
  async me() {
    return base44.auth.me();
  },

  /** Vrai si un utilisateur est connecté. */
  async isAuthenticated() {
    return base44.auth.isAuthenticated();
  },

  /** Met à jour le profil de l'utilisateur courant (champs personnalisés). */
  async updateMe(data) {
    return base44.auth.updateMe(data);
  },

  /** Déconnexion + redirection optionnelle. */
  logout(redirectUrl) {
    return base44.auth.logout(redirectUrl);
  },

  /** Redirige vers la page de login, puis revient sur nextUrl. */
  redirectToLogin(nextUrl) {
    return base44.auth.redirectToLogin(nextUrl);
  },

  /** Invite un nouvel utilisateur (admin seulement). */
  async inviteUser(email, role = 'user') {
    return base44.users.inviteUser(email, role);
  },

  /** Liste les utilisateurs (admin seulement). */
  async listUsers() {
    return base44.entities.User.list();
  },

  /** Met à jour le rôle d'un utilisateur (admin seulement). */
  async updateUserRole(userId, role) {
    return base44.entities.User.update(userId, { role });
  },
};

export default authService;