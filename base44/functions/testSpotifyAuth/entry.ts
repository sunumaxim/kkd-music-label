import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({ error: 'Secrets manquants', clientId: !!clientId, clientSecret: !!clientSecret });
    }

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: 'grant_type=client_credentials',
    });

    const rawBody = await res.text();
    let body;
    try { body = JSON.parse(rawBody); } catch { body = rawBody; }
    if (typeof body === 'string') return Response.json({ error: 'Auth Spotify échouée', status: res.status, raw: body });

    if (!res.ok) {
      return Response.json({ error: 'Auth Spotify échouée', status: res.status, body });
    }

    const token = body.access_token;

    // Test avec un artiste connu
    // Test partner API
    const albumsRes = await fetch('https://api.spotify.com/v1/artists/2YZyLoL8N0Wb9xBt1NhZWg/albums?limit=5&market=FR', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const albumsRaw = await albumsRes.text();
    let albumsBody;
    try { albumsBody = JSON.parse(albumsRaw); } catch { albumsBody = albumsRaw; }

    // Test the partner/internal endpoint
    const partnerRes = await fetch('https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistDiscographyAll&variables=%7B%22uri%22%3A%22spotify%3Aartist%3A2YZyLoL8N0Wb9xBt1NhZWg%22%2C%22offset%22%3A0%2C%22limit%22%3A20%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22b2e27d93c279938ebd2e37ccd2cfcc86f8caaab4a61d0d0c3d71fd2c6d76d5c3%22%7D%7D', {
      headers: { Authorization: `Bearer ${token}`, 'app-platform': 'WebPlayer' }
    });

    return Response.json({ 
      auth_ok: true, 
      token_type: body.token_type,
      albums_status: albumsRes.status,
      albums_error: typeof albumsBody === 'object' ? albumsBody?.error : albumsBody?.slice(0, 100),
      albums_count: albumsBody?.total,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});