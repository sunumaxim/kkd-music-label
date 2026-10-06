const LINK_FIELDS = [
  'spotify_url', 'youtube_url', 'apple_music_url', 'audiomack_url',
  'deezer_url', 'soundcloud_url', 'instagram_url', 'tiktok_url',
  'facebook_url', 'website_url', 'wikipedia_url',
];

function isValidUrl(u) {
  if (!u || typeof u !== 'string') return false;
  const s = u.trim();
  return /^https?:\/\/[^\s]+$/.test(s);
}

/**
 * Recherche sur le web les profils OFFICIELS et vérifiés d'un artiste
 * via LLM, et met à jour les champs de liens de l'entité Artist.
 * Ne sauvegarde QUE les liens valides et vérifiés — jamais de faux comptes.
 */
export async function collectLinksForArtist(db, artist) {
  const res = await db.integrations.Core.InvokeLLM({
    prompt:
      `Recherche sur le web les profils OFFICIELS et vérifiés de l'artiste "${artist.name}"` +
      ` (${artist.genre || 'musique'}${artist.nationality ? ', ' + artist.nationality : ''}).\n` +
      ` Trouve UNIQUEMENT les comptes officiels de l'artiste lui-même — JAMAIS les comptes de fans,` +
      ` faux comptes, homonymes, ou pages communautaires non officielles.\n` +
      ` Priorité absolue : plateformes de streaming musical (Spotify, YouTube, Apple Music, Audiomack,` +
      ` Deezer, SoundCloud) — ce sont les plus vérifiables.\n` +
      ` Puis réseaux sociaux (Instagram, TikTok, Facebook), puis site web officiel et Wikipedia.\n` +
      ` Critères de vérification : compte vérifié (badge bleu), grand nombre d'abonnés/écoutes,` +
      ` cohérence du nom avec l'artiste, lien avec un label ou distributeur connu.\n` +
      ` Pour chaque plateforme, renvoie l'URL COMPLÈTE du profil officiel, ou une chaîne vide` +
      ` si introuvable, incertain, ou si tu doutes de son authenticité.\n` +
      ` Mieux vaut ne rien renvoyer qu'un mauvais lien. Réponds en français.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        spotify_url: { type: 'string' },
        youtube_url: { type: 'string' },
        apple_music_url: { type: 'string' },
        audiomack_url: { type: 'string' },
        deezer_url: { type: 'string' },
        soundcloud_url: { type: 'string' },
        instagram_url: { type: 'string' },
        tiktok_url: { type: 'string' },
        facebook_url: { type: 'string' },
        website_url: { type: 'string' },
        wikipedia_url: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  });

  const patch = {};
  for (const f of LINK_FIELDS) {
    const url = (res[f] || '').trim();
    if (isValidUrl(url) && url !== artist[f]) patch[f] = url;
  }

  if (Object.keys(patch).length > 0) {
    await db.entities.Artist.update(artist.id, patch);
  }

  return {
    found_links: patch,
    summary: res.summary || '',
    updated_count: Object.keys(patch).length,
  };
}