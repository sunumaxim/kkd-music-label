import { base44 } from '@/api/base44Client';
import { localDb } from '@/api/localStore';
import { cleanArtistName } from './artistSyncService';

/**
 * Service de vérification du statut certifié d'un artiste.
 * Vérifie si un artiste possède officiellement le statut de certification dans la base de données.
 */

/**
 * Vérifie de manière synchrone si un objet artiste possède un statut certifié valide.
 * 
 * @param {Object|null|undefined} artist L'objet représentant l'artiste
 * @returns {boolean} true si l'artiste est explicitement certifié, false sinon
 */
export function isArtistCertified(artist) {
  if (!artist || typeof artist !== 'object') {
    return false;
  }

  // Vérification stricte des drapeaux de certification possibles dans le modèle
  return Boolean(
    artist.is_verified === true ||
    artist.is_certified === true ||
    artist.certified === true ||
    artist.verified === true ||
    artist.status === 'certified' ||
    artist.status === 'verified' ||
    artist.certification_status === 'verified' ||
    artist.certification_status === 'certified'
  );
}

/**
 * Vérifie dans la base de données (Base44 / Firestore / LocalDb) si un artiste est certifié.
 * 
 * @param {string|Object} artistOrIdOrName - ID, nom, slug ou objet artiste
 * @returns {Promise<boolean>} Résout à true si l'artiste est certifié dans la base de données, false sinon
 */
export async function checkArtistCertifiedInDb(artistOrIdOrName) {
  if (!artistOrIdOrName) return false;

  try {
    let artistId = null;
    let artistName = null;

    if (typeof artistOrIdOrName === 'object') {
      artistId = artistOrIdOrName.id || artistOrIdOrName._id;
      artistName = artistOrIdOrName.name;

      // Si l'objet transmis a déjà le drapeau vérifié explicitement et provient d'une requête fraîche
      if (isArtistCertified(artistOrIdOrName)) {
        return true;
      }
    } else if (typeof artistOrIdOrName === 'string') {
      const trimmed = artistOrIdOrName.trim();
      // Si c'est un identifiant (commence par 'art_' ou UUID/alphanumérique sans espace)
      if (trimmed.startsWith('art_') || (!trimmed.includes(' ') && trimmed.length >= 16)) {
        artistId = trimmed;
      } else {
        artistName = trimmed;
      }
    }

    // 1. Recherche par ID dans la base de données
    if (artistId) {
      try {
        const results = await base44.entities.Artist.filter({ id: artistId });
        if (results && results.length > 0) {
          return isArtistCertified(results[0]);
        }
      } catch (err) {
        console.warn('[checkArtistCertifiedInDb] Erreur requête par ID:', err?.message || err);
      }
    }

    // 2. Recherche par nom dans la base de données
    if (artistName) {
      const clean = cleanArtistName(artistName);
      try {
        const results = await base44.entities.Artist.filter({ name: clean });
        if (results && results.length > 0) {
          return isArtistCertified(results[0]);
        }
      } catch (err) {
        console.warn('[checkArtistCertifiedInDb] Erreur requête par nom direct:', err?.message || err);
      }

      // Recherche insensible à la casse dans la liste
      try {
        const allArtists = await base44.entities.Artist.list(undefined, 200);
        const matched = allArtists.find(a => 
          cleanArtistName(a.name || '').toLowerCase() === clean.toLowerCase() ||
          (a.slug && a.slug.toLowerCase() === clean.toLowerCase())
        );
        if (matched) {
          return isArtistCertified(matched);
        }
      } catch (err) {
        console.warn('[checkArtistCertifiedInDb] Erreur scan liste artistes:', err?.message || err);
      }
    }

    // 3. Fallback sur le stockage local résilient
    if (typeof localDb !== 'undefined' && localDb.getCollection) {
      const localArtists = localDb.getCollection('artists') || [];
      const localMatch = localArtists.find(a => {
        if (artistId && (a.id === artistId || a._id === artistId)) return true;
        if (artistName) {
          const c = cleanArtistName(artistName).toLowerCase();
          return cleanArtistName(a.name || '').toLowerCase() === c;
        }
        return false;
      });
      if (localMatch) {
        return isArtistCertified(localMatch);
      }
    }

    return false;
  } catch (error) {
    console.error('[checkArtistCertifiedInDb] Erreur inattendue:', error);
    return false;
  }
}

export default {
  isArtistCertified,
  checkArtistCertifiedInDb,
};
