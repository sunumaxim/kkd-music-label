/**
 * musicService — Abstraction des sorties musicales et vidéos KKD Music.
 *
 * Regroupe le CRUD des Releases/Videos, la résolution par slug, les compteurs
 * de lecture, et la gestion des tracklists. L'UI importe ce service, jamais
 * `base44.entities.Release` directement.
 *
 * Implémentation actuelle : Base44 SDK (entities.Release, entities.Video).
 * Migration Firebase : remplacer par Firebase Firestore (collection `releases`,
 * `videos`) + Cloud Functions pour incrementPlay.
 */

import { base44 } from '@/api/base44Client';
import { resolveEntityBySlug } from '@/lib/resolveEntity';
import { buildEntitySlug } from '@/lib/slugify';

export const musicService = {
  // ── Releases ─────────────────────────────────────────────
  async listReleases(sort = '-created_date', limit = 50) {
    return base44.entities.Release.list(sort, limit);
  },

  async getRelease(id) {
    return base44.entities.Release.get(id);
  },

  async createRelease(data) {
    return base44.entities.Release.create(data);
  },

  async updateRelease(id, data) {
    return base44.entities.Release.update(id, data);
  },

  async deleteRelease(id) {
    return base44.entities.Release.delete(id);
  },

  async filterReleases(query, sort = '-created_date', limit = 50) {
    return base44.entities.Release.filter(query, sort, limit);
  },

  async resolveReleaseBySlug(slugParam) {
    return resolveEntityBySlug('Release', slugParam, 'title');
  },

  // ── Videos ──────────────────────────────────────────────
  async listVideos(sort = '-created_date', limit = 50) {
    return base44.entities.Video.list(sort, limit);
  },

  async getVideo(id) {
    return base44.entities.Video.get(id);
  },

  async createVideo(data) {
    return base44.entities.Video.create(data);
  },

  async updateVideo(id, data) {
    return base44.entities.Video.update(id, data);
  },

  async deleteVideo(id) {
    return base44.entities.Video.delete(id);
  },

  async resolveVideoBySlug(slugParam) {
    return resolveEntityBySlug('Video', slugParam, 'title');
  },

  // ── Statistiques ─────────────────────────────────────────
  async incrementPlay(itemId) {
    return base44.functions.invoke('incrementPlay', { item_id: itemId });
  },

  // ── Slugs ────────────────────────────────────────────────
  buildSlug(nameOrTitle) {
    return buildEntitySlug(nameOrTitle);
  },
};

export default musicService;