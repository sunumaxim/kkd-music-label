import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// ── Détecte la plateforme depuis une URL ──
function detectPlatform(url) {
  const u = String(url || '').toLowerCase();
  if (u.includes('open.spotify.com')) return 'spotify';
  if (u.includes('music.apple.com') || u.includes('itunes.apple.com')) return 'apple_music';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('audiomack.com')) return 'audiomack';
  if (u.includes('deezer.com')) return 'deezer';
  if (u.includes('soundcloud.com')) return 'soundcloud';
  return null;
}

// ── Spotify : token + API ──
async function spotifyToken() {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Spotify auth échoué');
  const { access_token } = await res.json();
  return access_token;
}

async function extractSpotify(url) {
  const token = await spotifyToken();
  // /track/{id}, /album/{id}, /artist/{id}
  const match = url.match(/\/(track|album|artist)\/([a-zA-Z0-9]+)/);
  if (!match) throw new Error('URL Spotify non reconnue');
  const [, kind, id] = match;
  const res = await fetch(`https://api.spotify.com/v1/${kind}s/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify API ${res.status}`);
  const data = await res.json();
  if (kind === 'track') {
    return {
      platform: 'spotify',
      type: 'track',
      title: data.name || '',
      artist_name: data.artists?.[0]?.name || '',
      cover_url: data.album?.images?.[0]?.url || '',
      description: `Titre extrait de l'album ${data.album?.name || ''}`.trim(),
      spotify_url: data.external_urls?.spotify || url,
    };
  }
  if (kind === 'album') {
    const tracks = (data.tracks?.items || []).map((t, i) => ({
      title: t.name || `Piste ${i + 1}`,
      spotify_url: t.external_urls?.spotify || '',
      duration_ms: t.duration_ms || 0,
    }));
    return {
      platform: 'spotify',
      type: 'album',
      title: data.name || '',
      artist_name: data.artists?.[0]?.name || '',
      cover_url: data.images?.[0]?.url || '',
      description: `Album · ${data.total_tracks || 0} pistes · ${data.release_date || ''}`,
      spotify_url: data.external_urls?.spotify || url,
      tracks,
    };
  }
  // artist
  return {
    platform: 'spotify',
    type: 'artist',
    title: data.name || '',
    artist_name: data.name || '',
    cover_url: data.images?.[0]?.url || '',
    description: `${data.followers?.total || 0} abonnés · ${(data.genres || []).join(', ')}`,
    spotify_url: data.external_urls?.spotify || url,
  };
}

// ── YouTube : oEmbed ──
async function extractYouTube(url) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`YouTube oEmbed ${res.status}`);
  const data = await res.json();
  const videoId = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/)?.[1] || '';
  return {
    platform: 'youtube',
    type: 'video',
    title: data.title || '',
    artist_name: data.author_name || '',
    cover_url: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : data.thumbnail_url || '',
    description: `Vidéo YouTube · ${data.author_name || ''}`,
    youtube_url: url,
  };
}

// ── Deezer : API ──
async function extractDeezer(url) {
  // /track/{id}, /album/{id}, /artist/{id}
  const match = url.match(/\/(track|album|artist)\/(\d+)/);
  if (!match) throw new Error('URL Deezer non reconnue');
  const [, kind, id] = match;
  const res = await fetch(`https://api.deezer.com/${kind}/${id}`);
  if (!res.ok) throw new Error(`Deezer API ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Deezer error');
  if (kind === 'track') {
    return {
      platform: 'deezer',
      type: 'track',
      title: data.title || '',
      artist_name: data.artist?.name || '',
      cover_url: data.album?.cover_xl || data.album?.cover || '',
      description: `Titre · ${data.album?.title || ''}`,
      deezer_url: url,
    };
  }
  if (kind === 'album') {
    const tracks = (data.tracks?.data || []).map((t) => ({
      title: t.title || '',
      deezer_url: `https://www.deezer.com/track/${t.id}`,
      duration_ms: (t.duration || 0) * 1000,
    }));
    return {
      platform: 'deezer',
      type: 'album',
      title: data.title || '',
      artist_name: data.artist?.name || '',
      cover_url: data.cover_xl || data.cover || '',
      description: `Album · ${data.nb_tracks || 0} pistes · ${data.release_date || ''}`,
      deezer_url: url,
      tracks,
    };
  }
  return {
    platform: 'deezer',
    type: 'artist',
    title: data.name || '',
    artist_name: data.name || '',
    cover_url: data.picture_xl || data.picture || '',
    description: `${data.nb_fan || 0} fans`,
    deezer_url: url,
  };
}

// ── Audiomack : API ──
async function extractAudiomack(url) {
  // /{artist}/{song|album|playlist}/{slug}
  const match = url.match(/audiomack\.com\/([^/]+)\/(song|album|playlist)\/([^?/]+)/);
  if (!match) throw new Error('URL Audiomack non reconnue');
  const [, artistSlug, kind, itemSlug] = match;
  const endpoint = kind === 'song' ? 'song' : kind === 'album' ? 'album' : 'playlist';
  const res = await fetch(`https://api.audiomack.com/v1/${endpoint}/${artistSlug}/${itemSlug}`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Audiomack API ${res.status}`);
  const data = await res.json();
  const item = data.results || data;
  return {
    platform: 'audiomack',
    type: kind === 'song' ? 'track' : kind,
    title: item.title || item.name || '',
    artist_name: item.artist?.name || artistSlug,
    cover_url: item.image_src || item.image || '',
    description: `${kind === 'song' ? 'Titre' : kind === 'album' ? 'Album' : 'Playlist'} · Audiomack`,
    audiomack_url: url,
  };
}

// ── SoundCloud : oEmbed ──
async function extractSoundCloud(url) {
  const res = await fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`SoundCloud oEmbed ${res.status}`);
  const data = await res.json();
  return {
    platform: 'soundcloud',
    type: 'track',
    title: data.title || '',
    artist_name: data.author_name || '',
    cover_url: data.thumbnail_url || '',
    description: `SoundCloud · ${data.author_name || ''}`,
    soundcloud_url: url,
  };
}

// ── Apple Music : iTunes API ──
async function extractAppleMusic(url) {
  // Extract ID from URL
  const match = url.match(/(?:id=|\/)(\d{9,})/);
  if (!match) throw new Error('URL Apple Music non reconnue');
  const id = match[1];
  const kind = url.includes('/album/') ? 'album' : url.includes('/artist/') ? 'artist' : 'song';
  const res = await fetch(`https://itunes.apple.com/lookup?id=${id}`);
  if (!res.ok) throw new Error(`iTunes API ${res.status}`);
  const data = await res.json();
  const item = data.results?.[0];
  if (!item) throw new Error('Apple Music : élément introuvable');
  return {
    platform: 'apple_music',
    type: kind === 'album' ? 'album' : kind === 'artist' ? 'artist' : 'track',
    title: item.trackName || item.collectionName || item.artistName || '',
    artist_name: item.artistName || '',
    cover_url: item.artworkUrl100?.replace('100x100', '600x600') || '',
    description: kind === 'album' ? `Album · ${item.trackCount || 0} pistes` : `Titre · Apple Music`,
    apple_music_url: url,
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { url } = body;
    if (!url) return Response.json({ error: 'URL manquante' }, { status: 400 });

    const platform = detectPlatform(url);
    if (!platform) return Response.json({ error: 'Plateforme non supportée. Utilisez Spotify, YouTube, Apple Music, Deezer, Audiomack ou SoundCloud.' }, { status: 400 });

    let metadata;
    try {
      if (platform === 'spotify') metadata = await extractSpotify(url);
      else if (platform === 'youtube') metadata = await extractYouTube(url);
      else if (platform === 'deezer') metadata = await extractDeezer(url);
      else if (platform === 'audiomack') metadata = await extractAudiomack(url);
      else if (platform === 'soundcloud') metadata = await extractSoundCloud(url);
      else if (platform === 'apple_music') metadata = await extractAppleMusic(url);
    } catch (err) {
      return Response.json({ error: `Extraction échouée : ${err.message}`, platform }, { status: 422 });
    }

    // Vérifier le dédoublonnage : chercher une sortie existante avec ce lien
    const existing = await base44.asServiceRole.entities.Release.filter({ [`${platform}_url`]: url });
    if (existing.length > 0) {
      metadata.duplicate_release_id = existing[0].id;
      metadata.duplicate_warning = `Une sortie "${existing[0].title}" existe déjà avec ce lien.`;
    }

    return Response.json({ success: true, ...metadata });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}