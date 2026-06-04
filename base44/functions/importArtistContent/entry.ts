import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── EXTRACT SPOTIFY ARTIST ID ──
function extractSpotifyArtistId(url) {
  const match = url.match(/spotify\.com\/(?:intl-[a-z]+\/)?artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// ── SPOTIFY: Scrape artist page to get discography (no API key needed) ──
async function scrapeSpotifyArtist(spotifyUrl) {
  const artistId = extractSpotifyArtistId(spotifyUrl);
  if (!artistId) throw new Error('URL Spotify invalide');

  // Use Spotify's open embed endpoint which returns JSON metadata
  const embedRes = await fetch(`https://open.spotify.com/artist/${artistId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    }
  });
  if (!embedRes.ok) throw new Error(`Spotify inaccessible (${embedRes.status})`);

  const html = await embedRes.text();

  // Extract artist name from page
  const nameMatch = html.match(/"name":"([^"]+)","uri":"spotify:artist:/);
  const artistName = nameMatch ? nameMatch[1] : null;

  // Extract __NEXT_DATA__ or Relay store JSON embedded in the page
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!nextDataMatch) throw new Error('Structure Spotify modifiée, impossible d\'extraire les données');

  const nextData = JSON.parse(nextDataMatch[1]);

  // Navigate the data structure to find releases
  const releases = [];

  // Try to find releases in various locations in the Spotify page data
  const str = JSON.stringify(nextData);

  // Extract album objects: {"name":"...","release_date":"...","album_type":"...","images":[{"url":"..."}],"external_urls":{"spotify":"..."}}
  const albumRegex = /"name":"([^"]+)","release_date":"([^"]+)","album_type":"(album|single|compilation|ep)"[\s\S]*?"images":\[[\s\S]*?"url":"([^"]+)"[\s\S]*?"spotify":"(https:\/\/open\.spotify\.com\/album\/[^"]+)"/g;
  const seen = new Set();
  let m;
  while ((m = albumRegex.exec(str)) !== null) {
    const title = m[1];
    if (seen.has(title)) continue;
    seen.add(title);
    const rawType = m[3];
    const releaseType = rawType === 'album' ? 'album' : rawType === 'single' ? 'single' : 'ep';
    releases.push({
      title,
      release_date: m[2],
      release_type: releaseType,
      cover_url: m[4],
      spotify_url: m[5],
    });
  }

  return { artistId, artistName, releases };
}

// ── EXTRACT YOUTUBE CHANNEL INFO ──
function extractYouTubeChannel(url) {
  if (!url) return null;
  const channelMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelMatch) return { type: 'id', value: channelMatch[1] };
  const handleMatch = url.match(/youtube\.com\/@([^/?&\s]+)/);
  if (handleMatch) return { type: 'handle', value: handleMatch[1] };
  const userMatch = url.match(/youtube\.com\/user\/([^/?&\s]+)/);
  if (userMatch) return { type: 'user', value: userMatch[1] };
  const cMatch = url.match(/youtube\.com\/c\/([^/?&\s]+)/);
  if (cMatch) return { type: 'custom', value: cMatch[1] };
  return null;
}

// ── YOUTUBE: RSS feed from exact channel (no API key) ──
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

    const patterns = [
      /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
      /"externalChannelId":"(UC[a-zA-Z0-9_-]{22})"/,
      /channel\/(UC[a-zA-Z0-9_-]{22})/,
      /"browseId":"(UC[a-zA-Z0-9_-]{22})"/,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m) { channelId = m[1]; break; }
    }
  }

  if (!channelId) throw new Error("Impossible de trouver l'ID de la chaîne. Essayez avec youtube.com/channel/UCxxx");

  // RSS gives exactly the videos from THIS channel
  const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KKDMusicBot/1.0)' }
  });
  if (!rssRes.ok) throw new Error(`Impossible de charger les vidéos de la chaîne (${rssRes.status})`);

  const rssText = await rssRes.text();
  const videos = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(rssText)) !== null) {
    const entry = match[1];
    const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
    const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
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
      publish_date: publishedMatch ? publishedMatch[1].split('T')[0] : '',
      video_type,
    });
  }

  // Channel name = first <title> in RSS (before entries)
  const channelTitleMatch = rssText.match(/<title>([\s\S]*?)<\/title>/);
  const channelName = channelTitleMatch ? channelTitleMatch[1].trim() : channel.value;

  return { channelName, channelId, videos };
}

// ── MAIN HANDLER ──
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const { action, spotify_url, youtube_url, artist_id, artist_name } = await req.json();

    // ── IMPORT SPOTIFY ──
    if (action === 'import_spotify') {
      if (!spotify_url) return Response.json({ error: 'URL Spotify manquante' }, { status: 400 });

      const { artistId, artistName, releases } = await scrapeSpotifyArtist(spotify_url);

      if (releases.length === 0) {
        return Response.json({
          error: 'Aucune sortie trouvée. Vérifiez que le lien est bien un profil artiste Spotify (ex: open.spotify.com/artist/xxxx)'
        }, { status: 404 });
      }

      const finalName = artist_name || artistName || 'Artiste inconnu';

      if (artist_id) {
        await base44.asServiceRole.entities.Artist.update(artist_id, { spotify_url });
      }

      // Deduplicate
      const existing = await base44.asServiceRole.entities.Release.filter({ artist_name: finalName });
      const existingTitles = new Set(existing.map(r => r.title?.toLowerCase()).filter(Boolean));
      const toCreate = releases.filter(r => !existingTitles.has(r.title?.toLowerCase()));

      let created = 0;
      for (const release of toCreate) {
        await base44.asServiceRole.entities.Release.create({
          ...release,
          artist_name: finalName,
          is_featured: false,
        });
        created++;
      }

      return Response.json({
        success: true,
        total: releases.length,
        created,
        skipped: releases.length - created,
        artist_name: finalName,
        releases,
      });
    }

    // ── IMPORT YOUTUBE ──
    if (action === 'import_youtube') {
      if (!youtube_url) return Response.json({ error: 'URL YouTube manquante' }, { status: 400 });

      const { channelName, channelId, videos } = await fetchYouTubeVideos(youtube_url);

      if (videos.length === 0) {
        return Response.json({ error: 'Aucune vidéo trouvée sur cette chaîne.' }, { status: 404 });
      }

      const nameToUse = artist_name || channelName;

      // Deduplicate by exact YouTube URL
      const existing = await base44.asServiceRole.entities.Video.filter({ artist_name: nameToUse });
      const existingUrls = new Set(existing.map(v => v.youtube_url).filter(Boolean));
      const toCreate = videos.filter(v => !existingUrls.has(v.youtube_url));

      let created = 0;
      for (const video of toCreate) {
        await base44.asServiceRole.entities.Video.create({
          ...video,
          artist_name: nameToUse,
          is_featured: false,
        });
        created++;
      }

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

    return Response.json({ error: 'Action non reconnue' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});