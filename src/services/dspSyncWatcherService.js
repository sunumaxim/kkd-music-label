import { base44 } from '@/api/base44Client';
import { artistSyncService, cleanArtistName, extractFeaturing } from './artistSyncService';

/**
 * Service de Veille Informationnelle & Synchronisation DSP (Spotify, Deezer, etc.)
 * 
 * Assure :
 * 1. La détection et l'actualisation automatique de la photo de profil dès que l'artiste
 *    la modifie sur Spotify, Deezer ou ses distributeurs.
 * 2. La détection et l'intégration automatique des nouveaux singles et sorties publiés
 *    sur Spotify, Deezer ou d'autres comptes, visibles immédiatement sur son profil NIA.
 * 3. Le respect absolu des règles de certification : les artistes en featuring découverts
 *    lors de ces sorties ne sont JAMAIS automatiquement certifiés, et leur photo de profil
 *    officielle exacte est importée (et non la pochette du morceau).
 */

const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes de veille entre chaque vérification automatique par artiste

class DspSyncWatcherService {
  /**
   * Vérifie si l'artiste est dans la période de cooldown pour la veille automatique
   */
  isCoolingDown(artistId) {
    if (!artistId) return false;
    try {
      const last = localStorage.getItem(`kkd_dsp_watch_${artistId}`);
      if (!last) return false;
      const elapsed = Date.now() - parseInt(last, 10);
      return elapsed < COOLDOWN_MS;
    } catch {
      return false;
    }
  }

  /**
   * Enregistre l'horodatage de la dernière vérification de veille
   */
  markWatched(artistId) {
    if (!artistId) return;
    try {
      localStorage.setItem(`kkd_dsp_watch_${artistId}`, Date.now().toString());
    } catch {
      // noop
    }
  }

  /**
   * Récupère le profil officiel le plus récent de l'artiste depuis Deezer & Spotify
   */
  async fetchLatestDSPProfile(artist) {
    const name = cleanArtistName(artist?.name || '');
    if (!name) return null;

    let deezerData = null;
    let spotifyPhoto = null;
    let deezerPhoto = null;
    let deezerId = null;
    let directDeezerUrl = null;

    // 1. Interroger Deezer Artist Search API
    try {
      const dRes = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=5`);
      if (dRes.ok) {
        const dJson = await dRes.json();
        const artists = dJson.data || [];
        const match = artists.find(a => cleanArtistName(a.name).toLowerCase() === name.toLowerCase()) || artists[0];
        if (match) {
          deezerData = match;
          deezerId = match.id;
          deezerPhoto = match.picture_xl || match.picture_big || match.picture_medium || match.picture;
          directDeezerUrl = match.link || `https://www.deezer.com/artist/${match.id}`;
        }
      }
    } catch (err) {
      console.warn('[dspSyncWatcher] Erreur Deezer profile search:', err);
    }

    // 2. Si l'artiste a un lien Spotify direct d'artiste, interroger Spotify oEmbed
    if (artist?.spotify_url && artist.spotify_url.includes('spotify.com/artist/')) {
      try {
        const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(artist.spotify_url)}`;
        const spRes = await fetch(oembedUrl);
        if (spRes.ok) {
          const spJson = await spRes.json();
          if (spJson.thumbnail_url) {
            spotifyPhoto = spJson.thumbnail_url;
          }
        }
      } catch (err) {
        console.warn('[dspSyncWatcher] Erreur Spotify oEmbed profile:', err);
      }
    }

    // 3. Si aucune photo encore trouvée, tenter via Base44 backend function
    if (!deezerPhoto && !spotifyPhoto) {
      try {
        const bRes = await base44.functions.invoke('searchArtistOnPlatforms', {
          action: 'search',
          query: name,
        });
        const dList = bRes.data?.deezer || [];
        const match = dList.find(d => cleanArtistName(d.name || '').toLowerCase() === name.toLowerCase()) || dList[0];
        if (match?.image && !match.image.includes('placeholder')) {
          deezerPhoto = match.image;
        }
      } catch {}
    }

    const bestPhoto = spotifyPhoto || deezerPhoto || '';

    return {
      name,
      deezerId,
      deezerPhoto,
      spotifyPhoto,
      bestPhoto,
      directDeezerUrl,
      rawDeezer: deezerData,
    };
  }

  /**
   * Surveille et met à jour automatiquement la photo de profil si elle a été modifiée
   * sur Spotify, Deezer ou tout autre distributeur
   */
  async checkAndSyncProfile(artist, dspProfile) {
    if (!artist || !artist.id) return { updated: false, newPhoto: null };

    const candidatePhoto = dspProfile?.bestPhoto;
    if (!candidatePhoto) return { updated: false, newPhoto: null };

    // Comparer avec la photo actuelle
    const currentPhoto = artist.photo_url || '';
    const hasPhotoChanged = candidatePhoto !== currentPhoto && !candidatePhoto.includes('default') && candidatePhoto.length > 10;

    const updates = {};
    if (hasPhotoChanged) {
      updates.photo_url = candidatePhoto;
      updates.dsp_last_photo_sync = new Date().toISOString();
    }

    // Mettre à jour l'URL Deezer directe si l'artiste n'en a pas ou avait un lien de recherche
    if (dspProfile?.directDeezerUrl && (!artist.deezer_url || artist.deezer_url.includes('/search/'))) {
      updates.deezer_url = dspProfile.directDeezerUrl;
    }

    if (Object.keys(updates).length > 0) {
      try {
        await base44.entities.Artist.update(artist.id, updates);
        return {
          updated: true,
          photoUpdated: Boolean(updates.photo_url),
          newPhoto: updates.photo_url || null,
          updates,
        };
      } catch (err) {
        console.warn('[dspSyncWatcher] Impossible de mettre à jour le profil:', err);
      }
    }

    return { updated: false, newPhoto: null };
  }

  /**
   * Surveille et synchronise automatiquement les nouveaux singles et sorties
   * publiés sur Spotify, Deezer ou autres comptes distributeurs.
   */
  async checkAndSyncNewReleases(artist, dspProfile) {
    if (!artist || !artist.id) return { newReleasesCount: 0, addedReleases: [] };

    const artistName = cleanArtistName(artist.name);
    const deezerId = dspProfile?.deezerId || null;

    // 1. Récupérer les sorties existantes de l'artiste chez nous
    let existingReleases = [];
    try {
      existingReleases = await base44.entities.Release.list();
    } catch {
      existingReleases = [];
    }

    // Filtrer par artiste
    const artistExisting = existingReleases.filter(r => {
      const matchMain = cleanArtistName(r.artist_name || '').toLowerCase() === artistName.toLowerCase();
      const matchId = r.artist_id && r.artist_id === artist.id;
      return matchMain || matchId;
    });

    // 2. Récupérer les sorties DSP récentes (Deezer + iTunes)
    const dspReleases = [];

    // A. Via Deezer Albums / Singles API
    if (deezerId) {
      try {
        const albRes = await fetch(`https://api.deezer.com/artist/${deezerId}/albums?limit=50`);
        if (albRes.ok) {
          const albJson = await albRes.json();
          for (const item of (albJson.data || [])) {
            dspReleases.push({
              title: item.title,
              release_date: item.release_date || '',
              cover_url: item.cover_xl || item.cover_big || item.cover_medium || item.cover,
              deezer_url: item.link || `https://www.deezer.com/album/${item.id}`,
              spotify_url: `https://open.spotify.com/search/${encodeURIComponent(`${artistName} ${item.title}`)}`,
              release_type: item.record_type === 'single' ? 'single' : item.record_type === 'ep' ? 'ep' : 'album',
              record_label: item.label || artist.record_label || 'Distribution Digitale',
            });
          }
        }
      } catch (err) {
        console.warn('[dspSyncWatcher] Erreur Deezer albums fetch:', err);
      }
    }

    // B. Recherche Deezer complémentaire
    try {
      const sRes = await fetch(`https://api.deezer.com/search/album?q=artist:"${encodeURIComponent(artistName)}"&limit=25`);
      if (sRes.ok) {
        const sJson = await sRes.json();
        for (const item of (sJson.data || [])) {
          dspReleases.push({
            title: item.title,
            release_date: item.release_date || '',
            cover_url: item.cover_xl || item.cover_big || item.cover_medium,
            deezer_url: item.link || (item.id ? `https://www.deezer.com/album/${item.id}` : ''),
            spotify_url: `https://open.spotify.com/search/${encodeURIComponent(`${artistName} ${item.title}`)}`,
            release_type: item.record_type === 'single' ? 'single' : 'album',
            record_label: item.label || 'Distribution Digitale',
          });
        }
      }
    } catch {}

    // C. Compléter avec iTunes (pour singles très récents)
    try {
      const itRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=30`);
      if (itRes.ok) {
        const itJson = await itRes.json();
        for (const track of (itJson.results || [])) {
          if (cleanArtistName(track.artistName).toLowerCase().includes(artistName.toLowerCase())) {
            dspReleases.push({
              title: track.trackName,
              release_date: track.releaseDate ? track.releaseDate.slice(0, 10) : '',
              cover_url: (track.artworkUrl100 || '').replace('100x100bb.jpg', '1000x1000bb.jpg'),
              apple_music_url: track.trackViewUrl || track.collectionViewUrl || '',
              spotify_url: `https://open.spotify.com/search/${encodeURIComponent(`${artistName} ${track.trackName}`)}`,
              audio_preview_url: track.previewUrl || '',
              release_type: 'single',
              record_label: track.collectionCensoredName || 'Distribution Digitale',
            });
          }
        }
      }
    } catch {}

    // 3. Dédupliquer les morceaux DSP entre eux
    const uniqueDspCandidates = [];
    const seenCandidateKeys = new Set();

    for (const item of dspReleases) {
      if (!item.title) continue;
      const parsed = extractFeaturing(item.title, artistName);
      const key = parsed.cleanTitle.toLowerCase().trim();
      if (!key || seenCandidateKeys.has(key)) continue;
      seenCandidateKeys.add(key);
      uniqueDspCandidates.push({
        ...item,
        fullTitle: parsed.fullTitle,
        cleanTitle: parsed.cleanTitle,
        featuring: parsed.featuring,
      });
    }

    // 4. Détecter les sorties qui n'existent PAS encore dans notre base
    const newlyDetected = [];

    for (const candidate of uniqueDspCandidates) {
      const dupCheck = artistSyncService.checkDuplicateRelease(candidate, existingReleases);
      if (dupCheck.isDuplicate) {
        // Le morceau existe déjà, mais peut-être qu'il n'avait pas le lien Deezer/Spotify
        if (dupCheck.existingRelease && (candidate.deezer_url || candidate.spotify_url || candidate.audio_preview_url)) {
          const enrichments = {};
          if (!dupCheck.existingRelease.deezer_url && candidate.deezer_url) enrichments.deezer_url = candidate.deezer_url;
          if (!dupCheck.existingRelease.spotify_url && candidate.spotify_url) enrichments.spotify_url = candidate.spotify_url;
          if (!dupCheck.existingRelease.preview_url && candidate.audio_preview_url) {
            enrichments.preview_url = candidate.audio_preview_url;
            enrichments.audio_url = candidate.audio_preview_url;
          }
          if (Object.keys(enrichments).length > 0) {
            try {
              await base44.entities.Release.update(dupCheck.existingRelease.id, enrichments);
            } catch {}
          }
        }
        continue;
      }

      // C'est une NOUVELLE sortie publiée sur Spotify/Deezer !
      newlyDetected.push(candidate);
    }

    // 5. Intégrer les nouvelles sorties avec le traitement strict des featurings :
    // - Les artistes en featuring ne seront JAMAIS automatiquement certifiés
    // - La photo de profil exacte de chaque artiste en featuring est importée
    const createdReleases = [];

    for (const item of newlyDetected) {
      try {
        // Synchronisation des artistes et featurings
        const featSync = await artistSyncService.syncArtistsForRelease({
          artistName,
          artistId: artist.id,
          featuringString: item.featuring || '',
          coverUrl: item.cover_url || '',
          genre: artist.genre || '',
          isMainArtistVerified: Boolean(artist.is_verified),
        });

        const newReleasePayload = {
          title: item.fullTitle || item.title,
          clean_title: item.cleanTitle || item.title,
          artist_name: artistName,
          artist_id: artist.id,
          featuring: item.featuring || featSync.featuringArtistString || '',
          featuring_artist_id: featSync.primaryFeaturingArtistId || '',
          release_type: item.release_type || 'single',
          cover_url: item.cover_url || artist.photo_url || '',
          release_date: item.release_date || new Date().toISOString().slice(0, 10),
          audio_url: item.audio_preview_url || '',
          preview_url: item.audio_preview_url || '',
          spotify_url: item.spotify_url || `https://open.spotify.com/search/${encodeURIComponent(`${artistName} ${item.title}`)}`,
          deezer_url: item.deezer_url || '',
          apple_music_url: item.apple_music_url || '',
          record_label: item.record_label || 'Distribution Digitale',
          status: 'published',
          source: 'dsp_watcher_auto',
          created_date: new Date().toISOString(),
        };

        const created = await base44.entities.Release.create(newReleasePayload);
        createdReleases.push(created);
        // Mettre à jour la liste locale pour les vérifications subséquentes
        existingReleases.push(created);
      } catch (err) {
        console.warn(`[dspSyncWatcher] Erreur création release automatique pour ${item.title}:`, err);
      }
    }

    return {
      newReleasesCount: createdReleases.length,
      addedReleases: createdReleases,
    };
  }

  /**
   * Déclenche la veille complète pour un artiste :
   * 1. Détection de mise à jour de photo de profil (Spotify, Deezer, etc.)
   * 2. Détection et ajout des nouveaux singles/sorties DSP
   * 3. Respect strict de la non-certification des featurings
   * 
   * @param {Object} artist - L'entité artiste
   * @param {Object} options - { force: boolean } pour contourner le cooldown
   */
  async runDspWatch(artist, options = {}) {
    if (!artist || !artist.id) {
      return { checked: false, reason: 'invalid_artist' };
    }

    const { force = false } = options;

    if (!force && this.isCoolingDown(artist.id)) {
      return {
        checked: false,
        cooldown: true,
        message: 'Veille active : profil déjà synchronisé récemment.',
      };
    }

    try {
      // 1. Récupérer le profil DSP le plus récent
      const dspProfile = await this.fetchLatestDSPProfile(artist);

      // 2. Synchroniser la photo de profil si modifiée sur Spotify/Deezer/distributeurs
      const profileResult = await this.checkAndSyncProfile(artist, dspProfile);

      // 3. Détecter et importer les nouveaux singles/albums publiés
      const releasesResult = await this.checkAndSyncNewReleases(artist, dspProfile);

      // Enregistrer l'horodatage de veille
      this.markWatched(artist.id);

      return {
        checked: true,
        artistId: artist.id,
        artistName: artist.name,
        profileUpdated: profileResult.updated,
        photoUpdated: profileResult.photoUpdated,
        newPhoto: profileResult.newPhoto,
        newReleasesCount: releasesResult.newReleasesCount,
        addedReleases: releasesResult.addedReleases,
        timestamp: new Date().toISOString(),
        message: releasesResult.newReleasesCount > 0
          ? `${releasesResult.newReleasesCount} nouveau(x) single(s) synchronisé(s) depuis Spotify & Deezer !`
          : profileResult.photoUpdated
          ? 'Photo de profil mise à jour depuis Spotify & Deezer !'
          : 'Profil et catalogue à jour avec Spotify & Deezer.',
      };
    } catch (err) {
      console.warn('[dspSyncWatcher] Erreur globale lors de la veille DSP:', err);
      return {
        checked: false,
        error: err.message,
      };
    }
  }
}

export const dspSyncWatcherService = new DspSyncWatcherService();
