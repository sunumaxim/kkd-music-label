/**
 * artistService — Abstraction des artistes KKD Music.
 *
 * Regroupe le CRUD des Artist, la résolution par slug, les abonnements (follows),
 * les demandes d'accès artiste, et le top tracks. L'UI importe ce service, jamais
 * `base44.entities.Artist` directement.
 *
 * Implémentation actuelle : Base44 SDK (entities.Artist, entities.ArtistFollow,
 * entities.ArtistAccessRequest).
 * Migration Firebase : remplacer par Firestore (collections `artists`, `follows`).
 */

import { base44 } from '@/api/base44Client';
import { resolveEntityBySlug } from '@/lib/resolveEntity';

export const artistService = {
  // ── CRUD Artiste ─────────────────────────────────────────
  async listArtists(sort = 'order', limit = 50) {
    return base44.entities.Artist.list(sort, limit);
  },

  async getArtist(id) {
    return base44.entities.Artist.get(id);
  },

  async createArtist(data) {
    return base44.entities.Artist.create(data);
  },

  async updateArtist(id, data) {
    return base44.entities.Artist.update(id, data);
  },

  async deleteArtist(id) {
    return base44.entities.Artist.delete(id);
  },

  async filterArtists(query, sort = 'order', limit = 50) {
    return base44.entities.Artist.filter(query, sort, limit);
  },

  async resolveArtistBySlug(slugParam) {
    return resolveEntityBySlug('Artist', slugParam, 'name');
  },

  // ── Abonnements (Follows) ────────────────────────────────
  async followArtist(artistId, artistName, user) {
    return base44.entities.ArtistFollow.create({
      user_email: user?.email || '',
      user_id: user?.id || '',
      artist_id: artistId,
      artist_name: artistName,
    });
  },

  async unfollowArtist(followId) {
    return base44.entities.ArtistFollow.delete(followId);
  },

  async getMyFollows(userEmail) {
    return base44.entities.ArtistFollow.filter({ user_email: userEmail });
  },

  async isFollowing(userEmail, artistId) {
    const follows = await this.getMyFollows(userEmail);
    return follows.some((f) => f.artist_id === artistId);
  },

  // ── Demandes d'accès artiste ─────────────────────────────
  async requestAccess(artistId, artistName, user, message) {
    return base44.entities.ArtistAccessRequest.create({
      user_email: user?.email || '',
      user_id: user?.id || '',
      artist_id: artistId,
      artist_name: artistName,
      message,
    });
  },

  // ── Top tracks ───────────────────────────────────────────
  async getTopTracks(artistId) {
    return base44.functions.invoke('getArtistTopTracks', { artist_id: artistId });
  },

  // ── Invitations / contrats ───────────────────────────────
  async listInvites(userEmail) {
    return base44.entities.ArtistInvite.filter({ email: userEmail });
  },
};

export default artistService;