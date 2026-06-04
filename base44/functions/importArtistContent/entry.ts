import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── HELPERS ──
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

// ── MUSICBRAINZ: open API, no auth required ──
async function fetchMusicBrainzDiscography(artistName) {
  await new Promise(r => setTimeout(r, 200));
  const searchUrl = `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artistName)}&limit=3&fmt=json`;
  const searchRes = await fetch(searchUrl, {
    headers: { 'User-Agent': 'KKDMusicApp/1.0 (contact@kkdmusic.com)' }
  });
  if (!searchRes.ok) throw new Error(`MusicBrainz search error: ${searchRes.status}`);
  const searchData = await searchRes.json();
  const mbArtist = searchData?.artists?.[0];
  if (!mbArtist?.id) return { releases: [], mbArtistName: artistName };
  await new Promise(r => setTimeout(r, 300));
  const releasesUrl = `https://musicbrainz.org/ws/2/release-group/?artist=${mbArtist.id}&type=album|single|ep&limit=100&fmt=json`;
  const releasesRes = await fetch(releasesUrl, {
    headers: { 'User-Agent': 'KKDMusicApp/1.0 (contact@kkdmusic.com)' }
  });
  if (!releasesRes.ok) return { releases: [], mbArtistName: mbArtist.name };
  const releasesData = await releasesRes.json();
  const releases = (releasesData['release-groups'] || []).map(rg => {
    const type = (rg['primary-type'] || '').toLowerCase();
    const releaseType = type === 'album' ? 'album' : type === 'ep' ? 'ep' : 'single';
    return {
      title: rg.title,
      artist_name: mbArtist.name,
      cover_url: '',
      release_type: releaseType,
      release_date: rg['first-release-date'] || '',
      spotify_url: '',
    };
  });
  releases.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
  return { releases, mbArtistName: mbArtist.name };
}

// ── WIKIPEDIA: fetch artist bio & metadata ──
async function fetchWikipediaArtistInfo(artistName) {
  await new Promise(r => setTimeout(r, 100));
  // Search for the artist on Wikipedia (try French first, fallback to English)
  for (const lang of ['fr', 'en']) {
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(artistName + ' musicien chanteur')}&format=json&origin=*&srlimit=3`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) continue;
    const searchData = await searchRes.json();
    const page = searchData?.query?.search?.[0];
    if (!page?.title) continue;

    const pageUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(page.title)}&prop=extracts|pageprops&exintro=true&explaintext=true&format=json&origin=*`;
    const pageRes = await fetch(pageUrl);
    if (!pageRes.ok) continue;
    const pageData = await pageRes.json();
    const pages = Object.values(pageData?.query?.pages || {});
    const wikiPage = pages[0];
    if (!wikiPage?.extract) continue;

    const extract = wikiPage.extract.slice(0, 2000);
    const wikiLink = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`;

    // Try to extract birth date, birth place from infobox via REST API
    let birthDate = null, birthPlace = null, realName = null, genre = null;
    try {
      const summaryRes = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title.replace(/ /g, '_'))}`);
      if (summaryRes.ok) {
        const summary = await summaryRes.json();
        // Extract from description
        if (summary.description) {
          // Try to find birth year in description
          const yearMatch = summary.description.match(/\b(19[5-9]\d|200\d|201\d)\b/);
          if (yearMatch) birthDate = yearMatch[1];
        }
      }
    } catch (_) {
      // ignore
    }

    return { biography: extract, wikipedia_url: wikiLink, birthDate, birthPlace, realName, genre };
  }
  return null;
}

// ── YOUTUBE: RSS feed (no API key needed) ──
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
  if (!channelId) throw new Error('Impossible de trouver l\'ID de la chaîne. Essayez youtube.com/channel/UCxxx');

  const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KKDMusicBot/1.0)' }
  });
  if (!rssRes.ok) throw new Error(`Impossible de charger le flux YouTube (${rssRes.status})`);
  const rssText = await rssRes.text();
  const videos = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(rssText)) !== null) {
    const entry = match[1];
    const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
    const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    if (titleMatch && videoIdMatch) {
      const videoId = videoIdMatch[1].trim();
      const title = titleMatch[1].trim()
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      // Classify video type by title keywords
      const titleLow = title.toLowerCase();
      let video_type = 'clip_officiel';
      if (titleLow.includes('teaser') || titleLow.includes('trailer')) video_type = 'teaser';
      else if (titleLow.includes('interview') || titleLow.includes('itw')) video_type = 'interview';
      else if (titleLow.includes('making of') || titleLow.includes('behind')) video_type = 'making_of';
      videos.push({
        title,
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        publish_date: publishedMatch ? publishedMatch[1].split('T')[0] : '',
        video_type,
      });
    }
  }
  const channelNameMatch = rssText.match(/<title>(.*?)<\/title>/s);
  const channelName = channelNameMatch ? channelNameMatch[1].trim() : channel.value;
  return { channelName, channelId, videos };
}

// ── MAIN HANDLER ──
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const { action, spotify_url, youtube_url, artist_id, artist_name } = await req.json();

    // ── IMPORT WIKIPEDIA BIO ──
    if (action === 'import_wikipedia') {
      if (!artist_name) return Response.json({ error: 'Nom d\'artiste manquant' }, { status: 400 });
      const info = await fetchWikipediaArtistInfo(artist_name);
      if (!info) return Response.json({ error: 'Artiste non trouvé sur Wikipedia' }, { status: 404 });
      if (artist_id && info.biography) {
        const update = { biography: info.biography, wikipedia_url: info.wikipedia_url };
        await base44.asServiceRole.entities.Artist.update(artist_id, update);
      }
      return Response.json({ success: true, ...info });
    }

    // ── IMPORT / PREVIEW SPOTIFY via MusicBrainz ──
    if (action === 'import_spotify' || action === 'preview_spotify') {
      if (!artist_name && !spotify_url) return Response.json({ error: 'Nom d\'artiste ou URL Spotify manquante' }, { status: 400 });
      const nameToSearch = artist_name || '';
      if (!nameToSearch) return Response.json({ error: 'Veuillez fournir le nom de l\'artiste (artist_name)' }, { status: 400 });
      const { releases, mbArtistName } = await fetchMusicBrainzDiscography(nameToSearch);
      const finalName = mbArtistName || nameToSearch;
      const releasesWithLinks = releases.map(r => ({
        ...r,
        artist_name: finalName,
        spotify_url: spotify_url ? `https://open.spotify.com/search/${encodeURIComponent(r.title + ' ' + finalName)}` : '',
      }));
      if (action === 'preview_spotify') {
        return Response.json({ success: true, artist: { name: finalName, spotify_url }, releases: releasesWithLinks });
      }
      if (artist_id && spotify_url) {
        await base44.asServiceRole.entities.Artist.update(artist_id, { spotify_url });
      }
      const existing = await base44.asServiceRole.entities.Release.filter({ artist_name: finalName });
      const existingTitles = new Set(existing.map(r => r.title?.toLowerCase()).filter(Boolean));
      const toCreate = releasesWithLinks.filter(r => !existingTitles.has(r.title?.toLowerCase()));
      let created = 0;
      for (const release of toCreate) {
        await base44.asServiceRole.entities.Release.create({ ...release, is_featured: false });
        created++;
      }
      return Response.json({ success: true, total: releases.length, created, skipped: releases.length - created, artist_name: finalName, releases: releasesWithLinks });
    }

    // ── IMPORT / PREVIEW YOUTUBE ──
    if (action === 'import_youtube' || action === 'preview_youtube') {
      if (!youtube_url) return Response.json({ error: 'URL YouTube manquante' }, { status: 400 });
      const { channelName, channelId, videos } = await fetchYouTubeVideos(youtube_url);
      if (action === 'preview_youtube') {
        return Response.json({ success: true, channelName, channelId, videos });
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
        await base44.asServiceRole.entities.Artist.update(artist_id, {
          youtube_url: `https://www.youtube.com/channel/${channelId}`,
        });
      }
      return Response.json({ success: true, total: videos.length, created, skipped: videos.length - created, channel_name: channelName, videos });
    }

    return Response.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});