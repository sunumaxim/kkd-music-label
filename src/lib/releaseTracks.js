/**
 * Détermine le statut d'accès d'une piste ou d'une release :
 * - 'gratuit' : accessible en streaming libre pour tous les utilisateurs.
 * - 'en_vente' : accessible uniquement après achat validé (Wave / Orange Money).
 */
export function getTrackAccessInfo(track, release = {}) {
  // 1. Vérification explicite au niveau de la piste
  if (track && typeof track.is_for_sale === 'boolean') {
    return {
      is_for_sale: track.is_for_sale,
      access_mode: track.is_for_sale ? 'en_vente' : 'gratuit',
      is_free: !track.is_for_sale,
      price: track.is_for_sale ? Number(track.price || release.price || 0) : 0,
    };
  }

  if (track && track.access_mode) {
    const isSale = track.access_mode === 'en_vente';
    return {
      is_for_sale: isSale,
      access_mode: isSale ? 'en_vente' : 'gratuit',
      is_free: !isSale,
      price: isSale ? Number(track.price || release.price || 0) : 0,
    };
  }

  if (track && typeof track.is_free === 'boolean') {
    return {
      is_for_sale: !track.is_free,
      access_mode: track.is_free ? 'gratuit' : 'en_vente',
      is_free: track.is_free,
      price: !track.is_free ? Number(track.price || release.price || 0) : 0,
    };
  }

  // 2. Repli sur le statut global de la release
  const isReleasePaid = Boolean(
    (release.is_for_sale || release.access_mode === 'en_vente') &&
    (Number(release.price) > 0 || release.is_for_sale)
  );

  return {
    is_for_sale: isReleasePaid,
    access_mode: isReleasePaid ? 'en_vente' : 'gratuit',
    is_free: !isReleasePaid,
    price: isReleasePaid ? Number(release.price || 0) : 0,
  };
}

/**
 * Convertit une Release en pistes lisibles par le lecteur global KKD.
 * - Gratuit : piste(s) complète(s) écoutables directement comme sur Spotify.
 * - En Vente : STRICTEMENT IMPOSSIBLE d'écouter sans achat (piste bloquée sauf si acheté).
 */
export function getReleaseTracks(release, options = {}) {
  if (!release) return [];
  const hasPurchased = Boolean(options.hasPurchased || options.hasAccess);
  const includeLocked = Boolean(options.includeLocked);

  const base = {
    artist_name: release.artist_name,
    cover_url: release.cover_url,
    item_type: 'release',
    item_id: release.id,
  };

  if (Array.isArray(release.tracks) && release.tracks.length) {
    return release.tracks
      .filter((t) => t && (t.audio_file_url || t.file_url || t.url))
      .filter((t) => {
        if (includeLocked) return true;
        const access = getTrackAccessInfo(t, release);
        // Sécurité : si la piste est en vente et non achetée, exclue du flux standard
        if (access.is_for_sale && !hasPurchased) return false;
        return true;
      })
      .map((t, i) => {
        const access = getTrackAccessInfo(t, release);
        const isLocked = access.is_for_sale && !hasPurchased;
        return {
          ...base,
          key: `${release.id}-${i}`,
          title: t.title || release.title,
          audio_url: t.audio_file_url || t.file_url || t.url,
          duration: t.duration,
          is_for_sale: access.is_for_sale,
          access_mode: access.access_mode,
          is_free: access.is_free,
          price: access.price,
          is_purchased: access.is_for_sale && hasPurchased,
          is_locked: isLocked,
        };
      });
  }

  if (release.audio_file_url) {
    const access = getTrackAccessInfo(null, release);
    const isLocked = access.is_for_sale && !hasPurchased;
    if (!includeLocked && isLocked) return [];

    return [
      {
        ...base,
        key: release.id,
        title: release.title,
        audio_url: release.audio_file_url,
        is_for_sale: access.is_for_sale,
        access_mode: access.access_mode,
        is_free: access.is_free,
        price: access.price,
        is_purchased: access.is_for_sale && hasPurchased,
        is_locked: isLocked,
      },
    ];
  }

  return [];
}

export function getAllReleaseTracks(release, options = {}) {
  return getReleaseTracks(release, { ...options, includeLocked: true });
}

export function isPlayable(release, options = {}) {
  return getReleaseTracks(release, options).length > 0;
}