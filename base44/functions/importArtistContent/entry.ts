import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── EXTRACT IDs FROM URLS ──
function extractSpotifyArtistId(url) {
  const m = url.match(/spotify\.com\/(?:intl-[a-z]+\/)?artist\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

function extractDeezerArtistId(url) {
  const m = url.match(/deezer\.com\/(?:[a-z]+\/)?artist\/([0-9]+)/);
  return m ? m[1] : null;
}

function extractAudiomackArtist(url) {
  const m = url.match(/audiomack\.com\/([^/?#\s]+)/);
  return m ? m[1] : null;
}

function extractYouTubeChannel(url) {
  if (!url) return null;
  const ch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (ch) return { type: 'id', value: ch[1] };
  const handle = url.match(/youtube\.com\/@([^/?&\s]+)/);
  if (handle) return { type: 'handle', value: handle[1] };
  const user = url.match(/youtube\.com\/user\/([^/?&\s]+)/);
  if (user) return { type: 'user', value: user[1] };
  const c = url.match(/youtube\.com\/c\/([^/?&\s]+)/);
  if (c) return { type: 'custom', value: c[1] };
  return null;
}

// ── DEEZER: fully public API, no key needed ──
async function fetchDeezerDiscography(artistId) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
  };

  const infoRes = await fetch(`https://api.deezer.com/artist/${artistId}`, { headers });
  if (!infoRes.ok) throw new Error(`Artiste Deezer introuvable (${infoRes.status})`);
  const info = await infoRes.json();
  if (info.error) throw new Error(`Artiste Deezer introuvable : ${info.error.message || 'ID incorrect'}`);

  const releases = [];
  let url = `https://api.deezer.com/artist/${artistId}/albums?limit=100`;
  while (url) {
    const res = await fetch(url, { headers });
    if (!res.ok) break;
    const data = await res.json();
    if (data.error) break;
    for (const album of (data.data || [])) {
      const rawType = (album.record_type || '').toLowerCase();
      const releaseType = rawType === 'album' ? 'album' : rawType === 'ep' ? 'ep' : 'single';
      releases.push({
        title: album.title,
        cover_url: album.cover_xl || album.cover_big || album.cover || '',
        release_type: releaseType,
        release_date: album.release_date || '',
        deezer_url: `https://www.deezer.com/album/${album.id}`,
      });
    }
    url = data.next || null;
  }

  releases.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
  return { artistName: info.name, releases };
}

// ── SPOTIFY: use the unofficial token endpoint to get discography ──
async function fetchSpotifyDiscography(spotifyUrl) {
  const artistId = extractSpotifyArtistId(spotifyUrl);
  if (!artistId) throw new Error('URL Spotify invalide. Exemple : open.spotify.com/artist/xxxx');

  // Get anonymous Spotify token (no credentials needed)
  const tokenRes = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Cookie': 'sp_dc=; sp_key=;',
    }
  });
  if (!tokenRes.ok) throw new Error('Impossible d\'obtenir un token Spotify anonyme');
  const tokenData = await tokenRes.json();
  const token = tokenData.accessToken;
  if (!token) throw new Error('Token Spotify non disponible');

  // Get artist info
  const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!artistRes.ok) throw new Error(`Artiste Spotify introuvable (${artistRes.status})`);
  const artistInfo = await artistRes.json();

  // Get discography from this exact artist
  const releases = [];
  for (const group of ['album', 'single', 'compilation']) {
    let url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=${group}&limit=50&market=FR`;
    while (url) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) break;
      const data = await res.json();
      for (const item of (data.items || [])) {
        const rawType = (item.album_type || '').toLowerCase();
        const releaseType = rawType === 'album' ? 'album' : rawType === 'single' ? 'single' : 'ep';
        releases.push({
          title: item.name,
          cover_url: item.images?.[0]?.url || '',
          release_type: releaseType,
          release_date: item.release_date || '',
          spotify_url: item.external_urls?.spotify || '',
        });
      }
      url = data.next || null;
    }
  }

  releases.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
  return { artistName: artistInfo.name, releases };
}

// ── AUDIOMACK: scrape public profile ──
async function fetchAudiomackReleases(audiomackUrl) {
  const slug = extractAudiomackArtist(audiomackUrl);
  if (!slug) throw new Error('URL Audiomack invalide. Exemple : audiomack.com/nom-artiste');

  // Use Audiomack's public API
  const res = await fetch(`https://api.audiomack.com/v1/artist/${slug}/music?count=50&page=1`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'application/json',
    }
  });
  if (!res.ok) throw new Error(`Profil Audiomack introuvable pour "${slug}" (${res.status})`);
  const data = await res.json();

  const releases = [];
  for (const item of (data.results || [])) {
    const rawType = (item.object_type || '').toLowerCase();
    const releaseType = rawType === 'album' ? 'album' : rawType === 'playlist' ? 'ep' : 'single';
    releases.push({
      title: item.title || item.name || 'Sans titre',
      cover_url: item.image_src || item.image || '',
      release_type: releaseType,
      release_date: item.released_at ? item.released_at.split('T')[0] : '',
      audiomack_url: item.url_slug ? `https://audiomack.com/${slug}/${rawType}/${item.url_slug}` : '',
    });
  }

  const artistName = data.results?.[0]?.artist?.name || slug;
  return { artistName, releases };
}

// ── YOUTUBE: exact channel RSS (no key needed) ──
async function fetchYouTubeVideos(youtubeUrl) {
  const channel = extractYouTubeChannel(youtubeUrl);
  if (!channel) throw new Error('URL YouTube invalide. Exemple : https://www.youtube.com/@NomDeLaChaine');

  let channelId = null;

  if (channel.type === 'id') {
    channelId = channel.value;
  } else {
    const pageUrl = channel.type === 'handle'
      ? `https://www.youtube.com/@${channel.value}`
      : channel.type === 'user'
        ? `https://www.youtube.com/user/${channel.value}`
        : `https://www.youtube.com/c/${channel.value}`;

    const pageRes = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!pageRes.ok) throw new Error(`Impossible d'accéder à la chaîne YouTube (${pageRes.status})`);
    const html = await pageRes.text();

    for (const p of [
      /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
      /"externalChannelId":"(UC[a-zA-Z0-9_-]{22})"/,
      /channel\/(UC[a-zA-Z0-9_-]{22})/,
      /"browseId":"(UC[a-zA-Z0-9_-]{22})"/,
    ]) {
      const m = html.match(p);
      if (m) { channelId = m[1]; break; }
    }
  }

  if (!channelId) throw new Error("ID de chaîne introuvable. Utilisez le lien youtube.com/channel/UCxxx");

  const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KKDMusicBot/1.0)' }
  });
  if (!rssRes.ok) throw new Error(`Impossible de charger les vidéos (${rssRes.status})`);

  const rssText = await rssRes.text();
  const videos = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let m;

  while ((m = entryRegex.exec(rssText)) !== null) {
    const entry = m[1];
    const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
    const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const pubMatch = entry.match(/<published>(.*?)<\/published>/);
    if (!titleMatch || !videoIdMatch) continue;

    const videoId = videoIdMatch[1].trim();
    const title = titleMatch[1].trim()
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    const t = title.toLowerCase();
    let video_type = 'clip_officiel';
    if (t.includes('teaser') || t.includes('trailer')) video_type = 'teaser';
    else if (t.includes('interview') || t.includes('itw')) video_type = 'interview';
    else if (t.includes('making of') || t.includes('behind')) video_type = 'making_of';

    videos.push({
      title,
      youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      publish_date: pubMatch ? pubMatch[1].split('T')[0] : '',
      video_type,
    });
  }

  const chTitleMatch = rssText.match(/<title>([\s\S]*?)<\/title>/);
  const channelName = chTitleMatch ? chTitleMatch[1].trim() : channel.value;

  return { channelName, channelId, videos };
}

// ── MAIN HANDLER ──
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });

    const { action, spotify_url, deezer_url, audiomack_url, youtube_url, artist_id, artist_name } = await req.json();

    // ── IMPORT SPOTIFY ──
    if (action === 'import_spotify') {
      if (!spotify_url) return Response.json({ error: 'URL Spotify manquante' }, { status: 400 });

      const { artistName, releases } = await fetchSpotifyDiscography(spotify_url);

      if (releases.length === 0) {
        return Response.json({ error: 'Aucune sortie trouvée sur ce profil Spotify.' }, { status: 404 });
      }

      const finalName = artist_name || artistName;

      if (artist_id) {
        await base44.asServiceRole.entities.Artist.update(artist_id, { spotify_url });
      }

      const existing = await base44.asServiceRole.entities.Release.filter({ artist_name: finalName });
      const existingTitles = new Set(existing.map(r => r.title?.toLowerCase()).filter(Boolean));
      const toCreate = releases.filter(r => !existingTitles.has(r.title?.toLowerCase()));

      let created = 0;
      for (const release of toCreate) {
        await base44.asServiceRole.entities.Release.create({ ...release, artist_name: finalName, is_featured: false });
        created++;
      }

      return Response.json({ success: true, total: releases.length, created, skipped: releases.length - created, artist_name: finalName, releases });
    }

    // ── IMPORT DEEZER ──
    if (action === 'import_deezer') {
      if (!deezer_url) return Response.json({ error: 'URL Deezer manquante' }, { status: 400 });

      const artistId = extractDeezerArtistId(deezer_url);
      if (!artistId) return Response.json({ error: 'URL Deezer invalide. Exemple : deezer.com/fr/artist/xxxx' }, { status: 400 });

      const { artistName, releases } = await fetchDeezerDiscography(artistId);

      if (releases.length === 0) {
        return Response.json({ error: 'Aucune sortie trouvée sur ce profil Deezer.' }, { status: 404 });
      }

      const finalName = artist_name || artistName;

      if (artist_id) {
        await base44.asServiceRole.entities.Artist.update(artist_id, { deezer_url });
      }

      const existing = await base44.asServiceRole.entities.Release.filter({ artist_name: finalName });
      const existingTitles = new Set(existing.map(r => r.title?.toLowerCase()).filter(Boolean));
      const toCreate = releases.filter(r => !existingTitles.has(r.title?.toLowerCase()));

      let created = 0;
      for (const release of toCreate) {
        await base44.asServiceRole.entities.Release.create({ ...release, artist_name: finalName, is_featured: false });
        created++;
      }

      return Response.json({ success: true, total: releases.length, created, skipped: releases.length - created, artist_name: finalName, releases });
    }

    // ── IMPORT AUDIOMACK ──
    if (action === 'import_audiomack') {
      if (!audiomack_url) return Response.json({ error: 'URL Audiomack manquante' }, { status: 400 });

      const { artistName, releases } = await fetchAudiomackReleases(audiomack_url);

      if (releases.length === 0) {
        return Response.json({ error: 'Aucune sortie trouvée sur ce profil Audiomack.' }, { status: 404 });
      }

      const finalName = artist_name || artistName;

      if (artist_id) {
        await base44.asServiceRole.entities.Artist.update(artist_id, { audiomack_url });
      }

      const existing = await base44.asServiceRole.entities.Release.filter({ artist_name: finalName });
      const existingTitles = new Set(existing.map(r => r.title?.toLowerCase()).filter(Boolean));
      const toCreate = releases.filter(r => !existingTitles.has(r.title?.toLowerCase()));

      let created = 0;
      for (const release of toCreate) {
        await base44.asServiceRole.entities.Release.create({ ...release, artist_name: finalName, is_featured: false });
        created++;
      }

      return Response.json({ success: true, total: releases.length, created, skipped: releases.length - created, artist_name: finalName, releases });
    }

    // ── IMPORT YOUTUBE ──
    if (action === 'import_youtube') {
      if (!youtube_url) return Response.json({ error: 'URL YouTube manquante' }, { status: 400 });

      const { channelName, channelId, videos } = await fetchYouTubeVideos(youtube_url);

      if (videos.length === 0) {
        return Response.json({ error: 'Aucune vidéo trouvée sur cette chaîne.' }, { status: 404 });
      }

      const nameToUse = artist_name || channelName;

      const existing = await base44.asServiceRole.entities.Video.filter({ artist_name: nameToUse });
      const existingUrls = new Set(existing.map(v => v.youtube_url).filter(Boolean));
      const toCreate = videos.filter(v => !existingUrls.has(v.youtube_url));

      let created = 0;
      for (const video of toCreate) {
        await base44.asServiceRole.entities.Video.create({ ...video, artist_name: nameToUse, is_featured: false });
        created++;
      }

      if (artist_id) {
        await base44.asServiceRole.entities.Artist.update(artist_id, { youtube_url: `https://www.youtube.com/channel/${channelId}` });
      }

      return Response.json({ success: true, total: videos.length, created, skipped: videos.length - created, channel_name: channelName, videos });
    }

    return Response.json({ error: 'Action non reconnue' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});