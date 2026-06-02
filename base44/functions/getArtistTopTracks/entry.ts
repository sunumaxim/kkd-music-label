import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Obtenir un token Spotify Client Credentials
async function getSpotifyToken() {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  const creds = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify auth failed: ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

// Extraire l'ID Spotify depuis une URL
function extractSpotifyId(url, type) {
  if (!url) return null;
  const match = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(?:embed\/)?artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch {}
    const { spotify_url, artist_name } = body;

    if (!spotify_url) {
      return Response.json({ tracks: [], error: 'Pas de lien Spotify fourni.' });
    }

    const artistId = extractSpotifyId(spotify_url, 'artist');
    if (!artistId) {
      return Response.json({ tracks: [], error: 'Impossible d\'extraire l\'ID Spotify artiste.' });
    }

    let token;
    try { token = await getSpotifyToken(); } catch(e) {
      return Response.json({ tracks: [], error: e.message });
    }

    // Récupère les top tracks (marché FR)
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=FR`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      const text = await res.text();
      return Response.json({ tracks: [], error: `Spotify API: ${text}` });
    }
    const data = await res.json();

    if (!data.tracks) {
      return Response.json({ tracks: [], error: data.error?.message || 'Erreur Spotify.' });
    }

    const tracks = data.tracks.slice(0, 8).map((t) => ({
      id: t.id,
      name: t.name,
      album: t.album?.name,
      album_image: t.album?.images?.[0]?.url,
      duration_ms: t.duration_ms,
      popularity: t.popularity,
      preview_url: t.preview_url,
      spotify_url: t.external_urls?.spotify,
      spotify_embed_url: `https://open.spotify.com/embed/track/${t.id}?utm_source=generator&theme=0`,
    }));

    return Response.json({ tracks });
  } catch (error) {
    return Response.json({ tracks: [], error: error.message }, { status: 500 });
  }
});