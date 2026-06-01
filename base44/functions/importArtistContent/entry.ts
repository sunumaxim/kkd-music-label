import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Extract Spotify artist ID from profile URL
function extractSpotifyArtistId(url) {
  if (!url) return null;
  const m = url.match(/spotify\.com\/(?:intl-[a-z]+\/)?artist\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

// Extract YouTube channel ID or handle from URL
function extractYouTubeChannel(url) {
  if (!url) return null;
  // Handle: /channel/UCxxx or /@handle or /user/name or /c/name
  const channelMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelMatch) return { type: 'id', value: channelMatch[1] };
  const handleMatch = url.match(/youtube\.com\/@([^/?&]+)/);
  if (handleMatch) return { type: 'handle', value: handleMatch[1] };
  const userMatch = url.match(/youtube\.com\/user\/([^/?&]+)/);
  if (userMatch) return { type: 'user', value: userMatch[1] };
  const cMatch = url.match(/youtube\.com\/c\/([^/?&]+)/);
  if (cMatch) return { type: 'custom', value: cMatch[1] };
  return null;
}

// Extract YouTube video ID
function extractYTVideoId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Fetch Spotify data using public oEmbed/search (no API key needed via musicbrainz or public scraping)
// We use Spotify oEmbed for individual tracks, and for artist + discography we use the public Spotify API
async function fetchSpotifyDiscography(spotifyUrl, spotifyToken) {
  const artistId = extractSpotifyArtistId(spotifyUrl);
  if (!artistId) throw new Error('URL Spotify invalide. Exemple : https://open.spotify.com/artist/xxx');

  const headers = { Authorization: `Bearer ${spotifyToken}` };

  // Fetch artist info
  const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, { headers });
  if (!artistRes.ok) throw new Error(`Spotify API error: ${artistRes.status}`);
  const artistData = await artistRes.json();

  // Fetch albums (include singles, albums, compilations)
  const albumsRes = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,ep&market=FR&limit=50`,
    { headers }
  );
  const albumsData = await albumsRes.json();

  return {
    artist: {
      name: artistData.name,
      photo_url: artistData.images?.[0]?.url || '',
      genre: artistData.genres?.[0] || '',
      spotify_url: spotifyUrl,
    },
    releases: (albumsData.items || []).map(album => ({
      title: album.name,
      artist_name: artistData.name,
      cover_url: album.images?.[0]?.url || '',
      release_type: album.album_type === 'album' ? 'album' : album.album_type === 'single' ? 'single' : 'ep',
      release_date: album.release_date,
      spotify_url: album.external_urls?.spotify || '',
    })),
  };
}

// Fetch YouTube channel videos using RSS feed (no API key needed)
async function fetchYouTubeVideos(youtubeUrl) {
  const channel = extractYouTubeChannel(youtubeUrl);
  if (!channel) throw new Error('URL YouTube invalide. Exemple : https://www.youtube.com/@NomDeLaChaîne');

  let channelId = null;

  if (channel.type === 'id') {
    channelId = channel.value;
  } else {
    // For handles/usernames, we need to resolve via the YouTube page
    // Fetch the channel page to find the canonical channel ID
    const pageUrl = channel.type === 'handle'
      ? `https://www.youtube.com/@${channel.value}`
      : channel.type === 'user'
        ? `https://www.youtube.com/user/${channel.value}`
        : `https://www.youtube.com/c/${channel.value}`;

    const pageRes = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KKDMusicBot/1.0)' }
    });
    const html = await pageRes.text();

    // Extract channel ID from HTML
    const idMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
    if (idMatch) {
      channelId = idMatch[1];
    } else {
      // Try another pattern
      const idMatch2 = html.match(/\\"channelId\\":\\"(UC[a-zA-Z0-9_-]+)\\"/);
      if (idMatch2) channelId = idMatch2[1];
    }
  }

  if (!channelId) throw new Error('Impossible de résoudre l\'ID de la chaîne YouTube. Essayez avec l\'URL /channel/UCxxx directement.');

  // Fetch RSS feed
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const rssRes = await fetch(rssUrl);
  if (!rssRes.ok) throw new Error(`Erreur RSS YouTube: ${rssRes.status}`);
  const rssText = await rssRes.text();

  // Parse RSS XML
  const videos = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(rssText)) !== null) {
    const entry = match[1];
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    const thumbnailMatch = entry.match(/url="(https:\/\/i\.ytimg\.com\/vi\/[^"]+)"/);
    const descMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);

    if (titleMatch && videoIdMatch) {
      const videoId = videoIdMatch[1].trim();
      videos.push({
        title: titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: thumbnailMatch ? thumbnailMatch[1] : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publish_date: publishedMatch ? publishedMatch[1].split('T')[0] : '',
        video_type: 'clip_officiel',
        description: descMatch ? descMatch[1].trim().slice(0, 300) : '',
      });
    }
  }

  // Get channel name from RSS
  const channelNameMatch = rssText.match(/<title>(.*?)<\/title>/);
  const channelName = channelNameMatch ? channelNameMatch[1].trim() : channel.value;

  return { channelName, channelId, videos };
}

async function getSpotifyToken() {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const { action, spotify_url, youtube_url, artist_id, artist_name } = await req.json();

    // ── IMPORT SPOTIFY RELEASES ──
    if (action === 'import_spotify') {
      if (!spotify_url) return Response.json({ error: 'URL Spotify manquante' }, { status: 400 });

      const token = await getSpotifyToken();
      if (!token) {
        return Response.json({ error: 'Clés Spotify non configurées. Contactez l\'administrateur.' }, { status: 503 });
      }

      const { artist, releases } = await fetchSpotifyDiscography(spotify_url, token);

      // If artist_id provided, update artist with Spotify data
      if (artist_id) {
        await base44.asServiceRole.entities.Artist.update(artist_id, {
          spotify_url,
          ...(artist.photo_url && !artist.photo_url.includes('undefined') ? { photo_url: artist.photo_url } : {}),
          ...(artist.genre ? { genre: artist.genre } : {}),
        });
      }

      // Import releases into the Release entity, skip duplicates by spotify_url
      const existing = artist_name
        ? await base44.asServiceRole.entities.Release.filter({ artist_name })
        : [];
      const existingSpotifyUrls = new Set(existing.map(r => r.spotify_url).filter(Boolean));

      const toCreate = releases.filter(r => !existingSpotifyUrls.has(r.spotify_url));
      let created = 0;
      for (const release of toCreate) {
        await base44.asServiceRole.entities.Release.create({
          ...release,
          artist_name: artist_name || artist.name,
          is_featured: false,
        });
        created++;
      }

      return Response.json({
        success: true,
        total: releases.length,
        created,
        skipped: releases.length - created,
        artist_name: artist_name || artist.name,
        releases,
      });
    }

    // ── IMPORT YOUTUBE VIDEOS ──
    if (action === 'import_youtube') {
      if (!youtube_url) return Response.json({ error: 'URL YouTube manquante' }, { status: 400 });

      const { channelName, channelId, videos } = await fetchYouTubeVideos(youtube_url);

      // Skip duplicates by youtube_url
      const existing = artist_name
        ? await base44.asServiceRole.entities.Video.filter({ artist_name })
        : [];
      const existingYTUrls = new Set(existing.map(v => v.youtube_url).filter(Boolean));

      const toCreate = videos.filter(v => !existingYTUrls.has(v.youtube_url));
      let created = 0;
      for (const video of toCreate) {
        await base44.asServiceRole.entities.Video.create({
          ...video,
          artist_name: artist_name || channelName,
          is_featured: false,
        });
        created++;
      }

      // Update artist youtube_url if artist_id provided
      if (artist_id) {
        await base44.asServiceRole.entities.Artist.update(artist_id, {
          youtube_url: `https://www.youtube.com/channel/${channelId}`,
        });
      }

      return Response.json({
        success: true,
        total: videos.length,
        created,
        skipped: videos.length - created,
        channel_name: channelName,
        videos,
      });
    }

    // ── PREVIEW (without saving) ──
    if (action === 'preview_spotify') {
      const token = await getSpotifyToken();
      if (!token) return Response.json({ error: 'Clés Spotify non configurées' }, { status: 503 });
      const data = await fetchSpotifyDiscography(spotify_url, token);
      return Response.json({ success: true, ...data });
    }

    if (action === 'preview_youtube') {
      const data = await fetchYouTubeVideos(youtube_url);
      return Response.json({ success: true, ...data });
    }

    return Response.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});