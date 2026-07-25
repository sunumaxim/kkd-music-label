/**
 * Convertit une Release en pistes lisibles par le lecteur global KKD.
 * - Gratuit : piste(s) complète(s) (audio_file_url ou tracks[]).
 * - Payant : aucune piste (l'écoute se fait via l'extrait 30s / achat).
 */
export function getReleaseTracks(release) {
  // Une sortie n'est réellement "payante" que si elle est en vente ET avec un prix > 0.
  // Sinon (ex. is_for_sale=true mais price=0), on la traite comme gratuite et écoutable.
  if (!release || (release.is_for_sale && Number(release.price) > 0)) return [];
  const base = {
    artist_name: release.artist_name,
    cover_url: release.cover_url,
    item_type: 'release',
    item_id: release.id,
  };
  if (Array.isArray(release.tracks) && release.tracks.length) {
    return release.tracks
      .filter((t) => t && t.audio_file_url)
      .map((t, i) => ({
        ...base,
        key: `${release.id}-${i}`,
        title: t.title || release.title,
        audio_url: t.audio_file_url,
      }));
  }
  if (release.audio_file_url) {
    return [{ ...base, key: release.id, title: release.title, audio_url: release.audio_file_url }];
  }
  return [];
}

export function isPlayable(release) {
  return getReleaseTracks(release).length > 0;
}