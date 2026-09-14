import { base44 } from '@/api/base44Client';
import { localDb } from '@/api/localStore';

/**
 * Service de synchronisation intelligente des artistes et des featurings NIA / KKD Music.
 * 
 * Garantit :
 * 1. Que chaque chanson est strictement reliée à son artiste principal.
 * 2. Que TOUS les artistes en featuring ont un profil validé (is_verified: true).
 * 3. Que les apparitions / collaborations en featuring sont automatiquement répertoriées
 *    sur le profil de l'artiste invité ET de l'artiste principal.
 * 4. La déduplication des morceaux multi-plateformes (Spotify, Deezer, Apple Music, YouTube)
 *    en mettant à jour les métadonnées de distribution plutôt qu'en créant des doublons.
 */

// Nettoyage et normalisation des noms d'artistes
export function cleanArtistName(raw = '') {
  if (!raw) return '';
  return raw
    .replace(/^[\s,·\-\/]+|[\s,·\-\/]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extraction des noms distincts d'artistes en featuring
export function parseFeaturingNames(rawFeat = '') {
  if (!rawFeat) return [];
  // Gérer les séparateurs courants : virgule, &, x, +, ft., feat., featuring, avec
  const clean = rawFeat
    .replace(/\b(feat\.?|featuring|ft\.?|with|avec)\b/gi, ',')
    .replace(/[+&x×]/g, ',');

  const parts = clean
    .split(',')
    .map(p => cleanArtistName(p))
    .filter(p => p.length >= 2);

  // Dédupliquer tout en préservant la casse
  const seen = new Set();
  const result = [];
  for (const p of parts) {
    const k = p.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      result.push(p);
    }
  }
  return result;
}

// Extraction automatique des featurings depuis les chaînes titre et artiste
export function extractFeaturing(rawTitle = '', rawArtist = '') {
  let cleanTitle = (rawTitle || '').trim();
  let cleanArtist = cleanArtistName(rawArtist || '');
  const featStrings = [];

  // 1. Détecter dans le titre : (feat. XYZ) ou [feat. XYZ] ou feat. XYZ
  const titleFeatMatch = cleanTitle.match(/[(\[]\s*(?:feat\.?|featuring|ft\.?|with|avec)\s+([^\])]+)[)\]]/i);
  if (titleFeatMatch) {
    featStrings.push(titleFeatMatch[1]);
    cleanTitle = cleanTitle.replace(titleFeatMatch[0], '').trim();
  } else {
    const trailingFeat = cleanTitle.match(/\s+(?:feat\.?|featuring|ft\.?)\s+(.+)$/i);
    if (trailingFeat) {
      featStrings.push(trailingFeat[1]);
      cleanTitle = cleanTitle.replace(trailingFeat[0], '').trim();
    }
  }

  // 2. Détecter dans l'artiste : "Artist A feat. Artist B"
  const artistFeatMatch = cleanArtist.match(/\s+(?:feat\.?|featuring|ft\.?|with|avec)\s+(.+)$/i);
  if (artistFeatMatch) {
    featStrings.push(artistFeatMatch[1]);
    cleanArtist = cleanArtist.replace(artistFeatMatch[0], '').trim();
  }

  const allNames = featStrings.flatMap(s => parseFeaturingNames(s));
  const uniqueFeats = Array.from(new Set(allNames.map(n => cleanArtistName(n)))).filter(Boolean);

  return {
    cleanTitle,
    cleanArtist,
    featuring: uniqueFeats.join(', '),
    featuringList: uniqueFeats,
  };
}

export const artistSyncService = {
  /**
   * Trouve un artiste dans la base (locale ou cloud) par son nom
   */
  async findArtistByName(name) {
    const clean = cleanArtistName(name).toLowerCase();
    if (!clean) return null;

    try {
      const all = await base44.entities.Artist.list();
      return all.find(a => cleanArtistName(a.name).toLowerCase() === clean) || null;
    } catch {
      const cached = localDb.getCollection('artists');
      return cached.find(a => cleanArtistName(a.name).toLowerCase() === clean) || null;
    }
  },

  /**
   * Assure qu'un profil d'artiste existe et est VALIDÉ (is_verified: true)
   * Si l'artiste n'existe pas, il est automatiquement créé avec profil certifié.
   */
  async ensureArtistProfile(artistName, options = {}) {
    const name = cleanArtistName(artistName);
    if (!name) return null;

    let existing = await this.findArtistByName(name);

    if (existing) {
      // Si l'artiste existe déjà mais n'est pas encore validé, ou manque de photo
      const updates = {};
      if (!existing.is_verified) {
        updates.is_verified = true;
      }
      if (!existing.photo_url && options.photo_url) {
        updates.photo_url = options.photo_url;
      }
      if (!existing.genre && options.genre) {
        updates.genre = options.genre;
      }

      if (Object.keys(updates).length > 0) {
        try {
          const updated = await base44.entities.Artist.update(existing.id, updates);
          return { ...existing, ...updates, ...updated };
        } catch {
          return { ...existing, ...updates };
        }
      }
      return existing;
    }

    // Création automatique avec profil VALIDÉ
    const newArtistData = {
      name: name,
      is_verified: true, // Toujours validé comme requis
      is_featured: Boolean(options.is_featured),
      genre: options.genre || 'Afrobeats / Musique Urbaine',
      photo_url: options.photo_url || '',
      biography: options.biography || `Artiste certifié et validé répertorié sur le réseau KKD Music & NIA.`,
      spotify_url: options.spotify_url || `https://open.spotify.com/search/${encodeURIComponent(name)}`,
      deezer_url: options.deezer_url || `https://www.deezer.com/search/${encodeURIComponent(name)}`,
      apple_music_url: options.apple_music_url || '',
      youtube_url: options.youtube_url || '',
      created_date: new Date().toISOString(),
      order: 0,
    };

    try {
      const created = await base44.entities.Artist.create(newArtistData);
      return created;
    } catch (err) {
      console.warn('[artistSyncService] Erreur création artiste auto:', err);
      // Fallback local
      return localDb.insertItem('artists', newArtistData);
    }
  },

  /**
   * Synchronise l'artiste principal et TOUS les artistes en featuring pour une chanson / sortie.
   * Retourne l'artiste principal et la liste des profils validés des featurings.
   */
  async syncArtistsForRelease({
    artistName,
    artistId = '',
    featuringString = '',
    coverUrl = '',
    genre = '',
  }) {
    const mainName = cleanArtistName(artistName);

    // 1. Assurer l'artiste principal
    let mainArtist = null;
    if (artistId) {
      try {
        const found = await base44.entities.Artist.filter({ id: artistId });
        mainArtist = found[0] || null;
      } catch {}
    }
    if (!mainArtist && mainName) {
      mainArtist = await this.ensureArtistProfile(mainName, { photo_url: coverUrl, genre });
    }

    // 2. Traiter les artistes en featuring
    const featNames = parseFeaturingNames(featuringString);
    const resolvedFeats = [];

    for (const featName of featNames) {
      // Éviter de s'ajouter soi-même en featuring
      if (featName.toLowerCase() === mainName.toLowerCase()) continue;

      const featArtist = await this.ensureArtistProfile(featName, {
        photo_url: coverUrl,
        genre,
        biography: `Artiste collaborateur certifié répertorié sur le réseau KKD Music & NIA.`,
      });

      if (featArtist) {
        resolvedFeats.push(featArtist);
      }
    }

    const primaryFeatArtist = resolvedFeats[0] || null;
    const cleanFeaturingString = resolvedFeats.map(a => a.name).join(', ') || featuringString;

    return {
      mainArtist,
      mainArtistId: mainArtist?.id || artistId || '',
      mainArtistName: mainArtist?.name || mainName,
      featuringArtists: resolvedFeats,
      primaryFeaturingArtistId: primaryFeatArtist?.id || '',
      featuringArtistString: cleanFeaturingString,
    };
  },

  /**
   * Dédoublonnage intelligent multi-plateformes :
   * Vérifie si une sortie existe déjà (même lien streaming, même ISRC/UPC, ou même titre + artiste).
   * Si elle existe déjà, fusionne et met à jour les informations au lieu de créer un doublon.
   */
  checkDuplicateRelease(incoming, existingReleases = []) {
    const normalize = (str) =>
      (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\W_]+/g, ' ')
        .trim();

    const inTitle = normalize(incoming.title || incoming.cleanTitle);
    const inArtist = normalize(incoming.artist_name);
    const inIsrc = (incoming.isrc || '').toLowerCase().trim();
    const inUpc = (incoming.upc || '').toLowerCase().trim();
    const inSpotify = (incoming.spotify_url || incoming.streaming_link || '').toLowerCase().trim();
    const inDeezer = (incoming.deezer_url || '').toLowerCase().trim();
    const inYoutube = (incoming.youtube_url || '').toLowerCase().trim();
    const inApple = (incoming.apple_music_url || '').toLowerCase().trim();

    for (const ex of existingReleases) {
      const exTitle = normalize(ex.title);
      const exArtist = normalize(ex.artist_name);
      const exIsrc = (ex.isrc || '').toLowerCase().trim();
      const exUpc = (ex.upc || '').toLowerCase().trim();
      const exSpotify = (ex.spotify_url || ex.streaming_link || '').toLowerCase().trim();
      const exDeezer = (ex.deezer_url || '').toLowerCase().trim();
      const exYoutube = (ex.youtube_url || '').toLowerCase().trim();
      const exApple = (ex.apple_music_url || '').toLowerCase().trim();

      // 1. Match par URL streaming directe (exact match)
      const spotifyMatch = inSpotify && exSpotify && inSpotify === exSpotify;
      const deezerMatch = inDeezer && exDeezer && inDeezer === exDeezer;
      const youtubeMatch = inYoutube && exYoutube && inYoutube === exYoutube;
      const appleMatch = inApple && exApple && inApple === exApple;

      // 2. Match par code ISRC ou UPC officiel (fiabilité 100%)
      const isrcMatch = inIsrc && exIsrc && inIsrc === exIsrc;
      const upcMatch = inUpc && exUpc && inUpc === exUpc;

      // 3. Match par titre et artiste normalisés
      const titleMatch = inTitle && exTitle && (
        inTitle === exTitle ||
        inTitle.startsWith(exTitle) ||
        exTitle.startsWith(inTitle)
      );
      const artistMatch = inArtist && exArtist && (
        inArtist === exArtist ||
        inArtist.includes(exArtist) ||
        exArtist.includes(inArtist)
      );

      if (spotifyMatch || deezerMatch || youtubeMatch || appleMatch || isrcMatch || upcMatch || (titleMatch && artistMatch)) {
        // Détecté comme doublon ! Créer la mise à jour enrichie sans écraser les données nobles existantes
        const mergedUpdates = {
          distributor: incoming.distributor || ex.distributor || '',
          record_label: incoming.record_label || incoming.label || ex.record_label || '',
          copyright: incoming.copyright || ex.copyright || '',
          // Compléter les liens de streaming croisés (Spotify + Deezer + Apple + YouTube)
          spotify_url: ex.spotify_url || incoming.spotify_url || '',
          deezer_url: ex.deezer_url || incoming.deezer_url || '',
          apple_music_url: ex.apple_music_url || incoming.apple_music_url || '',
          youtube_url: ex.youtube_url || incoming.youtube_url || '',
          streaming_link: ex.streaming_link || incoming.streaming_link || '',
          audio_file_url: ex.audio_file_url || incoming.audio_preview_url || incoming.audio_file_url || '',
          cover_url: ex.cover_url || incoming.cover_url || '',
          featuring_artist: ex.featuring_artist || incoming.featuring || incoming.featuring_artist || '',
          featuring_artist_id: ex.featuring_artist_id || incoming.featuring_artist_id || '',
        };

        // Si l'élément arrivant possède des pistes (album/EP) et que l'existant n'en a pas ou en a moins, fusionner les pistes
        if (Array.isArray(incoming.tracks) && incoming.tracks.length > (ex.tracks?.length || 0)) {
          mergedUpdates.tracks = incoming.tracks;
          mergedUpdates.release_type = incoming.tracks.length > 6 ? 'album' : incoming.tracks.length > 1 ? 'ep' : ex.release_type || 'single';
        }

        return {
          isDuplicate: true,
          existingRelease: ex,
          matchReason: isrcMatch
            ? 'ISRC identique'
            : (spotifyMatch || deezerMatch || youtubeMatch || appleMatch)
            ? 'Lien de streaming identique'
            : 'Titre et Artiste correspondants',
          mergedUpdates,
        };
      }
    }

    return { isDuplicate: false, existingRelease: null, mergedUpdates: null };
  },

  /**
   * Récupère TOUTE la discographie d'un artiste :
   * - Ses propres musiques (artiste principal)
   * - Toutes ses musiques en FEATURING / Collaboration avec d'autres artistes
   */
  filterArtistCatalog(allReleases = [], artistName = '', artistId = '') {
    const aName = (artistName || '').toLowerCase().trim();
    const aId = (artistId || '').trim();

    const mainReleases = [];
    const featuringReleases = [];

    for (const rel of allReleases) {
      const relArtistName = (rel.artist_name || '').toLowerCase().trim();
      const relArtistId = (rel.artist_id || '').trim();
      const relFeatName = (rel.featuring_artist || '').toLowerCase().trim();
      const relFeatId = (rel.featuring_artist_id || '').trim();
      const relTitle = (rel.title || '').toLowerCase();

      const isMain = (aId && relArtistId === aId) || (aName && relArtistName === aName);

      if (isMain) {
        mainReleases.push(rel);
      } else {
        // Vérifier si l'artiste est en featuring
        const isFeatById = aId && (relFeatId === aId || rel.featuring_artists_ids?.includes(aId));
        const isFeatByName = aName && (
          relFeatName.includes(aName) ||
          relTitle.includes(`feat. ${aName}`) ||
          relTitle.includes(`ft. ${aName}`) ||
          relTitle.includes(`featuring ${aName}`) ||
          relTitle.includes(`(feat ${aName}`)
        );

        if (isFeatById || isFeatByName) {
          featuringReleases.push({
            ...rel,
            _isFeaturingForArtist: true,
            _leadArtistName: rel.artist_name,
            _leadArtistId: rel.artist_id,
          });
        }
      }
    }

    return {
      mainReleases: mainReleases.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || '')),
      featuringReleases: featuringReleases.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || '')),
      totalCount: mainReleases.length + featuringReleases.length,
    };
  },
};

export default artistSyncService;
