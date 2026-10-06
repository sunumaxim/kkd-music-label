import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { collectLinksForArtist } from '../../shared/collectLinks.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { artist_id, artist_name } = body;
    if (!artist_id && !artist_name) return Response.json({ error: 'Artiste manquant' }, { status: 400 });

    const db = base44.asServiceRole;

    // Trouve l'artiste
    let artist;
    if (artist_id) {
      artist = await db.entities.Artist.get(artist_id);
    } else {
      const results = await db.entities.Artist.filter({ name: artist_name });
      artist = results[0];
    }
    if (!artist) return Response.json({ error: 'Artiste introuvable' }, { status: 404 });

    const result = await collectLinksForArtist(db, artist);

    return Response.json({
      artist_id: artist.id,
      artist_name: artist.name,
      ...result,
    });
  } catch (error) {
    console.error('[collectArtistLinks] fatal', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}