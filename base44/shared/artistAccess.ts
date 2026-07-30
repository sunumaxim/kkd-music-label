/**
 * Vérifie si un utilisateur est lié à un artiste (via ArtistInvite ou ArtistAccessRequest).
 * Utilisé par les backend functions pour autoriser les artistes à gérer leurs événements.
 */
export async function isUserLinkedToArtist(base44, artistId, userEmail) {
  if (!artistId || !userEmail) return false;

  const invites = await base44.asServiceRole.entities.ArtistInvite.filter({ artist_id: artistId });
  const hasInvite = invites.some(
    (i) => i.email === userEmail && (i.status === 'actif' || i.status === 'invite')
  );
  if (hasInvite) return true;

  const requests = await base44.asServiceRole.entities.ArtistAccessRequest.filter({ artist_id: artistId });
  const hasAccess = requests.some(
    (r) => r.user_email === userEmail && r.status === 'approuve'
  );
  return hasAccess;
}

/**
 * Vérifie si un utilisateur est autorisé à gérer un événement :
 * admin, organisateur, contrôleur, ou artiste lié à l'événement.
 */
export async function isUserAuthorizedForEvent(base44, event, user) {
  if (!event || !user) return false;
  if (user.role === 'admin') return true;
  if (event.organizer_email === user.email) return true;
  if (Array.isArray(event.managers) && event.managers.includes(user.email)) return true;
  if (event.artist_id) {
    return await isUserLinkedToArtist(base44, event.artist_id, user.email);
  }
  return false;
}