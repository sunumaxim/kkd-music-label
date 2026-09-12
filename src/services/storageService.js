/**
 * storageService — Abstraction du stockage de fichiers KKD Music.
 *
 * Couche d'abstraction pour l'upload, la lecture et la signature de fichiers
 * (audio, images, vidéos). L'UI importe ce service, jamais `base44.integrations.Core`
 * directement.
 *
 * Implémentation actuelle : Base44 Storage (UploadPublicFile / UploadPrivateFile /
 * CreateFileSignedUrl).
 *
 * Migration Firebase : remplacer le corps des méthodes par Firebase Storage :
 *   - uploadPublic → firebase.storage().ref().put() + getDownloadURL()
 *   - uploadPrivate → firebase.storage().ref('private/').put()
 *   - getSignedUrl  → getDownloadURL() (ou URL signée via Cloud Functions)
 */

import { base44 } from '@/api/base44Client';

export const storageService = {
  /**
   * Upload un fichier public (pochette, photo artiste, audio gratuit).
   * @returns {Promise<string>} URL publique permanente.
   */
  async uploadPublic(file) {
    const res = await base44.integrations.Core.UploadPublicFile({ file });
    return res.file_url;
  },

  /**
   * Upload un fichier privé (audio/vidéo vendu). Retourne un file_uri (non lisible
   * sans URL signée). Le fichier n'est jamais exposé publiquement.
   * @returns {Promise<string>} file_uri privé.
   */
  async uploadPrivate(file) {
    const res = await base44.integrations.Core.UploadPrivateFile({ file });
    return res.file_uri;
  },

  /**
   * Génère une URL signée temporaire pour un fichier privé (accès post-achat).
   * @param {string} fileUri — URI privé retourné par uploadPrivate.
   * @param {number} expiresIn — Durée de validité en secondes (défaut 300 = 5 min).
   * @returns {Promise<string>} URL signée temporaire.
   */
  async getSignedUrl(fileUri, expiresIn = 300) {
    const res = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: expiresIn,
    });
    return res.signed_url;
  },

  /**
   * Résout une URL jouable depuis une valeur de champ (URL publique ou file_uri privé).
   * Si l'URL est publique (http), la renvoie directement.
   * Si c'est un file_uri privé, génère une URL signée temporaire.
   * @returns {Promise<string|null>}
   */
  async resolvePlayableUrl(fileUrlOrUri) {
    if (!fileUrlOrUri) return null;
    if (fileUrlOrUri.startsWith('http')) return fileUrlOrUri;
    try {
      return await this.getSignedUrl(fileUrlOrUri);
    } catch {
      return null;
    }
  },

  /**
   * Indique si une valeur est une URL publique directement lisible.
   */
  isPublicUrl(value) {
    return Boolean(value) && String(value).startsWith('http');
  },

  /**
   * Indique si une valeur est un file_uri privé (nécessite signature).
   */
  isPrivateUri(value) {
    return Boolean(value) && !String(value).startsWith('http');
  },
};

export default storageService;