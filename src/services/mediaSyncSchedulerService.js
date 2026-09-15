/**
 * Service de synchronisation automatique et programmée à 14h des Clips et des Chansons (KKD Music / NIA)
 * - Associe et lie chaque chanson à son clip vidéo correspondant (lien bidirectionnel strict)
 * - Exécute la synchronisation quotidienne programmée à 14h00
 * - Algorithme de correspondance sémantique (titre nettoyé, artiste, URL YouTube officielle)
 * - Conception sobre et performante : sans surcharge visuelle ni requêtes superflues
 */
import { base44 } from '@/api/base44Client';

/**
 * Nettoie le titre d'une vidéo ou d'une chanson pour la comparaison
 */
export function sanitizeMediaTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .replace(/\(.*?\)|\[.*?\]/g, '') // supprime le contenu entre parenthèses / crochets
    .replace(/clip\s*officiel|official\s*(?:music\s*)?video|music\s*video|visualizer|audio\s*officiel|lyric\s*video|version\s*officielle/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ') // supprime la ponctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Nettoie le nom de l'artiste pour la comparaison
 */
export function sanitizeArtistName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/feat\..*|ft\..*/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

class MediaSyncSchedulerService {
  constructor() {
    this.timerId = null;
    this.isSyncing = false;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event) {
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch (err) {
        console.error('[MediaSyncScheduler] Listener error:', err);
      }
    });
  }

  /**
   * Compare deux médias pour savoir s'ils correspondent
   */
  isMatch(song, video) {
    if (!song || !video) return false;

    // 1. Déjà explicitement liés
    if (song.linked_video_id && song.linked_video_id === video.id) return true;
    if (video.linked_release_id && video.linked_release_id === song.id) return true;

    // 2. URL YouTube identique
    const songYt = (song.youtube_url || '').toLowerCase().trim();
    const vidYt = (video.youtube_url || '').toLowerCase().trim();
    if (songYt && vidYt && songYt === vidYt) {
      return true;
    }

    // 3. Même artiste + correspondance de titre
    const songArtist = sanitizeArtistName(song.artist_name);
    const vidArtist = sanitizeArtistName(video.artist_name);

    const artistMatches =
      (songArtist && vidArtist && (songArtist === vidArtist || songArtist.includes(vidArtist) || vidArtist.includes(songArtist))) ||
      !songArtist || !vidArtist;

    if (!artistMatches) return false;

    const cleanSongTitle = sanitizeMediaTitle(song.title);
    const cleanVidTitle = sanitizeMediaTitle(video.title);

    if (!cleanSongTitle || !cleanVidTitle) return false;

    if (cleanSongTitle === cleanVidTitle) return true;
    if (cleanSongTitle.length >= 4 && cleanVidTitle.includes(cleanSongTitle)) return true;
    if (cleanVidTitle.length >= 4 && cleanSongTitle.includes(cleanVidTitle)) return true;

    return false;
  }

  /**
   * Synchronise l'ensemble des clips et des chansons du catalogue
   */
  async syncClipsAndSongs(options = {}) {
    if (this.isSyncing) return { success: false, message: 'Synchronisation déjà en cours' };
    this.isSyncing = true;
    this.notify({ type: 'sync_start' });

    try {
      const [releases, videos] = await Promise.all([
        base44.entities.Release.list('-created_date', 300),
        base44.entities.Video.list('-created_date', 300),
      ]);

      let linkedCount = 0;
      const updates = [];

      for (const video of videos) {
        // Trouver la chanson correspondante
        const matchedRelease = releases.find((r) => this.isMatch(r, video));

        if (matchedRelease) {
          let videoUpdated = false;
          let releaseUpdated = false;

          // Si le clip n'est pas encore lié à cette release
          if (video.linked_release_id !== matchedRelease.id) {
            video.linked_release_id = matchedRelease.id;
            updates.push(
              base44.entities.Video.update(video.id, {
                linked_release_id: matchedRelease.id,
              }).catch((e) => console.warn('[MediaSync] Erreur mise à jour clip:', e))
            );
            videoUpdated = true;
          }

          // Si la release n'est pas encore liée à ce clip
          if (matchedRelease.linked_video_id !== video.id) {
            matchedRelease.linked_video_id = video.id;
            updates.push(
              base44.entities.Release.update(matchedRelease.id, {
                linked_video_id: video.id,
              }).catch((e) => console.warn('[MediaSync] Erreur mise à jour release:', e))
            );
            releaseUpdated = true;
          }

          if (videoUpdated || releaseUpdated) {
            linkedCount++;
          }
        }
      }

      await Promise.allSettled(updates);

      const timestamp = new Date().toISOString();
      const todayStr = new Date().toISOString().slice(0, 10);
      try {
        localStorage.setItem('nia_last_media_sync_at', timestamp);
        if (options.is14h) {
          localStorage.setItem('nia_last_14h_media_sync_day', todayStr);
        }
      } catch (e) {}

      const result = {
        success: true,
        linkedCount,
        totalReleases: releases.length,
        totalVideos: videos.length,
        syncedAt: timestamp,
        message:
          linkedCount > 0
            ? `${linkedCount} clip(s) et chanson(s) synchronisés avec succès.`
            : 'Tous les clips et chansons correspondants sont déjà synchronisés.',
      };

      this.notify({ type: 'sync_complete', result });
      return result;
    } catch (err) {
      console.error('[MediaSyncScheduler] Échec de la synchronisation:', err);
      const errResult = { success: false, error: err.message };
      this.notify({ type: 'sync_error', result: errResult });
      return errResult;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Démarre la programmation quotidienne à 14h00
   */
  init14hScheduler() {
    if (this.timerId) clearTimeout(this.timerId);

    const checkAndSchedule = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = now.toISOString().slice(0, 10);
      const last14hDay = localStorage.getItem('nia_last_14h_media_sync_day');

      // Si nous sommes à 14h ou plus et que la synchro de 14h n'a pas encore tourné aujourd'hui
      if (currentHour >= 14 && last14hDay !== todayStr) {
        console.log('[MediaSyncScheduler] Exécution de la synchronisation de 14h des clips et chansons...');
        this.syncClipsAndSongs({ is14h: true });
      }

      // Calcul du délai jusqu'au prochain 14h00
      const next14h = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0, 0);
      if (now.getTime() >= next14h.getTime()) {
        // Déjà passé 14h aujourd'hui, programmer pour demain 14h
        next14h.setDate(next14h.getDate() + 1);
      }

      const msUntilNext14h = next14h.getTime() - now.getTime();
      console.log(`[MediaSyncScheduler] Prochaine synchro de 14h dans ${Math.round(msUntilNext14h / 60000)} minutes.`);

      this.timerId = setTimeout(() => {
        this.syncClipsAndSongs({ is14h: true });
        // Reprogrammer pour le jour suivant
        checkAndSchedule();
      }, msUntilNext14h);
    };

    checkAndSchedule();
  }
}

export const mediaSyncSchedulerService = new MediaSyncSchedulerService();
