import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── SEARCH SPOTIFY ──
async function searchSpotify(query) {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

  // Get token
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!tokenRes.ok) throw new Error('Spotify auth échoué');
  const { access_token } = await tokenRes.json();

  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=8&market=FR`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!res.ok) throw new Error(`Spotify search ${res.status}`);
  const data = await res.json();

  return (data.artists?.items || []).map(a => ({
    id: a.id,
    name: a.name,
    image: a.images?.[0]?.url || '',
    followers: a.followers?.total || 0,
    genres: a.genres?.slice(0, 2) || [],
    url: a.external_urls?.spotify || `https://open.spotify.com/artist/${a.id}`,
    platform: 'spotify',
  }));
}

// ── FETCH SPOTIFY DISCOGRAPHY ──
async function fetchSpotifyDiscography(artistId) {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!tokenRes.ok) throw new Error('Spotify auth échoué');
  const { access_token } = await tokenRes.json();

  const releases = [];
  for (const group of ['album', 'single', 'compilation']) {
    let url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=${group}&limit=50&market=FR`;
    while (url) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
      if (!res.ok) break;
      const data = await res.json();
      for (const item of (data.items || [])) {
        const rawType = (item.album_type || '').toLowerCase();
        const releaseType = rawType === 'album' ? 'album' : rawType === 'single' ? 'single' : 'ep';
        releases.push({
          id: item.id,
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
  return releases;
}

// ── SEARCH DEEZER ──
async function searchDeezer(query) {
  const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=8`);
  if (!res.ok) throw new Error(`Deezer search ${res.status}`);
  const data = await res.json();

  return (data.data || []).map(a => ({
    id: String(a.id),
    name: a.name,
    image: a.picture_xl || a.picture_big || a.picture || '',
    followers: a.nb_fan || 0,
    genres: [],
    url: `https://www.deezer.com/artist/${a.id}`,
    platform: 'deezer',
  }));
}

// ── FETCH DEEZER DISCOGRAPHY ──
async function fetchDeezerDiscography(artistId) {
  const releases = [];
  let url = `https://api.deezer.com/artist/${artistId}/albums?limit=100`;
  while (url) {
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    if (data.error) break;
    for (const album of (data.data || [])) {
      const rawType = (album.record_type || '').toLowerCase();
      const releaseType = rawType === 'album' ? 'album' : rawType === 'ep' ? 'ep' : 'single';
      releases.push({
        id: String(album.id),
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
  return releases;
}

// ── SEARCH AUDIOMACK ──
async function searchAudiomack(query) {
  const res = await fetch(`https://api.audiomack.com/v1/search/artists?q=${encodeURIComponent(query)}&count=8`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Audiomack search ${res.status}`);
  const data = await res.json();

  return (data.results || []).map(a => ({
    id: a.url_slug || a.artist_slug,
    name: a.name,
    image: a.image_src || a.image || '',
    followers: a.followers || 0,
    genres: [],
    url: `https://audiomack.com/${a.url_slug || a.artist_slug}`,
    platform: 'audiomack',
    slug: a.url_slug || a.artist_slug,
  }));
}

// ── FETCH AUDIOMACK RELEASES ──
async function fetchAudiomackReleases(slug) {
  const res = await fetch(`https://api.audiomack.com/v1/artist/${slug}/music?count=50&page=1`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Audiomack introuvable (${res.status})`);
  const data = await res.json();

  return (data.results || []).map(item => {
    const rawType = (item.object_type || '').toLowerCase();
    const releaseType = rawType === 'album' ? 'album' : rawType === 'playlist' ? 'ep' : 'single';
    return {
      id: String(item.id),
      title: item.title || item.name || 'Sans titre',
      cover_url: item.image_src || item.image || '',
      release_type: releaseType,
      release_date: item.released_at ? item.released_at.split('T')[0] : '',
      audiomack_url: item.url_slug ? `https://audiomack.com/${slug}/${rawType}/${item.url_slug}` : '',
    };
  });
}

// ── SEARCH YOUTUBE ──
async function searchYouTube(query) {
  // Scrape YouTube search page to find channels
  const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' official channel')}&sp=EgIQAg%253D%253D`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`YouTube search ${res.status}`);
  const html = await res.text();

  const results = [];
  // Extract initial data JSON
  const dataMatch = html.match(/var ytInitialData = ([\s\S]*?);<\/script>/);
  if (!dataMatch) return [];

  let ytData;
  try { ytData = JSON.parse(dataMatch[1]); } catch { return []; }

  const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents
    ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

  for (const item of contents) {
    const ch = item.channelRenderer;
    if (!ch) continue;
    const channelId = ch.channelId;
    const name = ch.title?.simpleText || '';
    const thumbnail = ch.thumbnail?.thumbnails?.[ch.thumbnail.thumbnails.length - 1]?.url || '';
    const subs = ch.videoCountText?.simpleText || ch.subscriberCountText?.simpleText || '';
    const handle = ch.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl || '';

    results.push({
      id: channelId,
      name,
      image: thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail,
      followers: subs,
      genres: [],
      url: `https://www.youtube.com/channel/${channelId}`,
      platform: 'youtube',
      handle,
    });
    if (results.length >= 6) break;
  }
  return results;
}

// ── FETCH YOUTUBE VIDEOS (RSS) ──
async function fetchYouTubeVideos(channelId) {
  const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!rssRes.ok) throw new Error(`YouTube RSS ${rssRes.status}`);
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
      id: videoId,
      title,
      youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      publish_date: pubMatch ? pubMatch[1].split('T')[0] : '',
      video_type,
    });
  }
  return videos;
}

// ── MAIN HANDLER ──
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { action, query, artist_id, platform_artist_id, artist_name, items } = body;

    // ── SEARCH ──
    if (action === 'search') {
      if (!query) return Response.json({ error: 'Requête manquante' }, { status: 400 });

      const [spotify, deezer, audiomack, youtube] = await Promise.allSettled([
        searchSpotify(query),
        searchDeezer(query),
        searchAudiomack(query),
        searchYouTube(query),
      ]);

      return Response.json({
        spotify: spotify.status === 'fulfilled' ? spotify.value : [],
        deezer: deezer.status === 'fulfilled' ? deezer.value : [],
        audiomack: audiomack.status === 'fulfilled' ? audiomack.value : [],
        youtube: youtube.status === 'fulfilled' ? youtube.value : [],
        errors: {
          spotify: spotify.status === 'rejected' ? spotify.reason?.message : null,
          deezer: deezer.status === 'rejected' ? deezer.reason?.message : null,
          audiomack: audiomack.status === 'rejected' ? audiomack.reason?.message : null,
          youtube: youtube.status === 'rejected' ? youtube.reason?.message : null,
        }
      });
    }

    // ── FETCH PROFILE CONTENT ──
    if (action === 'fetch_content') {
      const { platform, platform_artist_id: pid, artist_url } = body;
      let content = [];

      if (platform === 'spotify') {
        content = await fetchSpotifyDiscography(pid);
      } else if (platform === 'deezer') {
        content = await fetchDeezerDiscography(pid);
      } else if (platform === 'audiomack') {
        content = await fetchAudiomackReleases(pid); // pid is the slug
      } else if (platform === 'youtube') {
        content = await fetchYouTubeVideos(pid); // pid is channelId
      }

      return Response.json({ content });
    }

    // ── IMPORT SELECTED ITEMS ──
    if (action === 'import_items') {
      const { platform, items: itemsToImport, artist_name: aName, artist_id: aId, platform_artist_url } = body;
      if (!itemsToImport?.length) return Response.json({ error: 'Aucun élément à importer' }, { status: 400 });

      const isVideo = platform === 'youtube';
      let created = 0;
      let skipped = 0;

      if (isVideo) {
        const existing = await base44.asServiceRole.entities.Video.filter({ artist_name: aName });
        const existingUrls = new Set(existing.map(v => v.youtube_url).filter(Boolean));
        for (const item of itemsToImport) {
          if (existingUrls.has(item.youtube_url)) { skipped++; continue; }
          await base44.asServiceRole.entities.Video.create({ ...item, artist_name: aName, is_featured: false });
          created++;
        }
        // Save youtube_url on artist
        if (aId && platform_artist_url) {
          await base44.asServiceRole.entities.Artist.update(aId, { youtube_url: platform_artist_url });
        }
      } else {
        const existing = await base44.asServiceRole.entities.Release.filter({ artist_name: aName });
        const existingTitles = new Set(existing.map(r => r.title?.toLowerCase()).filter(Boolean));
        for (const item of itemsToImport) {
          if (existingTitles.has(item.title?.toLowerCase())) { skipped++; continue; }
          const { id: _id, ...rest } = item;
          await base44.asServiceRole.entities.Release.create({ ...rest, artist_name: aName, is_featured: false });
          created++;
        }
        // Save platform url on artist
        if (aId && platform_artist_url) {
          const field = platform === 'spotify' ? 'spotify_url'
            : platform === 'deezer' ? 'deezer_url'
            : platform === 'audiomack' ? 'audiomack_url' : null;
          if (field) await base44.asServiceRole.entities.Artist.update(aId, { [field]: platform_artist_url });
        }
      }

      return Response.json({ success: true, created, skipped });
    }

    // ── DELETE ITEM ──
    if (action === 'delete_release') {
      const { release_id } = body;
      await base44.asServiceRole.entities.Release.delete(release_id);
      return Response.json({ success: true });
    }

    if (action === 'delete_video') {
      const { video_id } = body;
      await base44.asServiceRole.entities.Video.delete(video_id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Action non reconnue' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});