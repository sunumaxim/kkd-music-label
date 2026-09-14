/**
 * catalogImporterService.js
 * Service d'importation et d'enrichissement automatique de contenu pour KKD Music / NIA.
 *
 * Permet de :
 * 1. Rechercher un artiste sur Spotify, Deezer, Apple Music / iTunes et YouTube.
 * 2. Récupérer toutes ses sorties (Singles, Albums, EPs) avec métadonnées complètes,
 *    pochette HD, date de sortie, featurings extraits et aperçu audio écoutable.
 * 3. Récupérer tous ses clips officiels et vidéos YouTube avec vignettes HD et dates.
 * 4. Extraire en 1 clic les métadonnées de n'importe quel lien (Spotify, YouTube, Deezer, Apple Music).
 * 5. Publier / importer directement dans le catalogue KKD (Release, Video, Artist) sans friction.
 */

import { base44 } from '@/api/base44Client';

// Helper pour nettoyer et extraire les featurings
export function extractFeaturing(rawTitle = '', defaultArtist = '') {
  if (!rawTitle) return { cleanTitle: '', featuring: '', fullTitle: '' };

  let title = rawTitle.trim();

  // Supprimer les mentions de clip ou tags parasites entre parenthèses ou crochets
  // ex: [Clip Officiel], (Official Music Video), (Visualizer), [Audio]
  title = title
    .replace(/\[\s*(official\s*(music\s*)?video|clip\s*officiel|official\s*audio|visualizer|audio\s*officiel|video\s*lyric|paroles)\s*\]/gi, '')
    .replace(/\(\s*(official\s*(music\s*)?video|clip\s*officiel|official\s*audio|visualizer|audio\s*officiel|video\s*lyric|paroles)\s*\)/gi, '')
    .trim();

  // Si le titre contient "Artiste - Titre", séparer
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    const potentialArtist = parts[0].trim();
    if (defaultArtist && potentialArtist.toLowerCase() === defaultArtist.toLowerCase()) {
      title = parts.slice(1).join(' - ').trim();
    }
  }

  let featuring = '';
  // Motifs courants de featuring : (feat. X), (featuring X), (ft. X), [feat. X], feat. X, ft. X
  const featRegex = /(?:[\(\[]\s*(?:feat\.?|featuring|ft\.?)\s+([^\)\]]+)[\)\]]|(?:feat\.?|featuring|ft\.?)\s+(.+)$)/i;
  const match = title.match(featRegex);

  let cleanTitle = title;
  if (match) {
    featuring = (match[1] || match[2] || '').trim();
    cleanTitle = title.replace(featRegex, '').trim();
  }

  // Nettoyer d'éventuels séparateurs résiduels en fin de titre
  cleanTitle = cleanTitle.replace(/[\-\–\—\s]+$/, '').trim();

  const fullTitle = featuring ? `${cleanTitle} (feat. ${featuring})` : cleanTitle;

  return {
    cleanTitle: cleanTitle || rawTitle,
    featuring,
    fullTitle: fullTitle || rawTitle,
  };
}

// Extraction sécurisée de l'ID YouTube
export function getYoutubeId(url = '') {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([^&?\s]+)/i);
  return match ? match[1] : null;
}

// Extraction sécurisée de l'ID et du type Spotify
export function parseSpotifyUrl(url = '') {
  if (!url) return null;
  const match = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|artist|playlist)\/([a-zA-Z0-9]+)/i);
  if (!match) return null;
  return { type: match[1], id: match[2] };
}

export const catalogImporterService = {
  /**
   * 1. RECHERCHE D'ARTISTE MULTI-PLATEFORMES
   * Recherche simultanée via Base44 (Deezer + YouTube) et iTunes Search API
   */
  async searchArtist(query) {
    if (!query || !query.trim()) return { artists: [], channels: [], raw: null };
    const q = query.trim();

    const [base44Res, itunesRes] = await Promise.allSettled([
      base44.functions.invoke('searchArtistOnPlatforms', { action: 'search', query: q }),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=6`)
        .then(r => r.json())
        .catch(() => ({ results: [] })),
    ]);

    const bData = base44Res.status === 'fulfilled' ? base44Res.value?.data || {} : {};
    const iData = itunesRes.status === 'fulfilled' ? itunesRes.value?.results || [] : [];

    const artistProfiles = [];
    const seenNames = new Set();

    // Ajouter d'abord les profils Deezer (très complets)
    if (Array.isArray(bData.deezer)) {
      for (const p of bData.deezer) {
        if (!p.id || seenNames.has(p.name?.toLowerCase())) continue;
        seenNames.add(p.name?.toLowerCase());
        artistProfiles.push({
          id: `deezer-${p.id}`,
          platformId: p.id,
          platform: 'deezer',
          name: p.name,
          image: p.image || '',
          followers: typeof p.followers === 'number' ? `${p.followers.toLocaleString()} fans` : p.followers || '',
          genres: p.genres || [],
          url: p.url || `https://www.deezer.com/artist/${p.id}`,
          spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(p.name)}`,
        });
      }
    }

    // Ajouter les profils iTunes
    for (const it of iData) {
      const nameKey = it.artistName?.toLowerCase();
      if (!nameKey || seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);
      artistProfiles.push({
        id: `itunes-${it.artistId}`,
        platformId: it.artistId,
        platform: 'itunes',
        name: it.artistName,
        image: '', // iTunes artist endpoint ne donne pas directement l'image de profil
        followers: '',
        genres: it.primaryGenreName ? [it.primaryGenreName] : [],
        url: it.artistLinkUrl || '',
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(it.artistName)}`,
      });
    }

    // Chaînes YouTube trouvées
    const youtubeChannels = Array.isArray(bData.youtube) ? bData.youtube : [];

    return {
      artists: artistProfiles,
      youtubeChannels,
      raw: bData,
    };
  },

  /**
   * 2. RÉCUPÉRATION DE LA DISCOGRAPHIE ET DES CLIPS DE L'ARTISTE
   * Récupère à la fois les sorties musicales (Singles, Albums, EPs) avec featurings
   * et les clips / vidéos YouTube.
   */
  async fetchArtistDiscographyAndVideos(artistName, options = {}) {
    const { platformId, platform = 'deezer', youtubeId } = options;
    const name = (artistName || '').trim();
    if (!name) return { releases: [], videos: [] };

    // Requêtes parallèles : Deezer/Base44 + iTunes Lookup/Search + Base44 YouTube
    const promises = [];

    // 1) Deezer content via Base44 ou direct
    if (platform === 'deezer' && platformId) {
      promises.push(
        base44.functions.invoke('searchArtistOnPlatforms', {
          action: 'fetch_content',
          platform: 'deezer',
          platform_artist_id: platformId,
        }).then(r => ({ type: 'deezer_releases', data: r.data?.content || [] })).catch(() => ({ type: 'deezer_releases', data: [] }))
      );
    } else {
      promises.push(
        fetch(`https://api.deezer.com/search/album?q=${encodeURIComponent(name)}&limit=25`)
          .then(r => r.json())
          .then(d => ({
            type: 'deezer_search',
            data: (d.data || []).map(a => ({
              id: a.id,
              title: a.title,
              cover_url: a.cover_xl || a.cover_big || a.cover_medium,
              release_type: a.record_type || 'single',
              release_date: a.release_date || '',
              deezer_url: a.link,
              spotify_url: `https://open.spotify.com/search/${encodeURIComponent(`${name} ${a.title}`)}`,
              artist_name: a.artist?.name || name,
            }))
          }))
          .catch(() => ({ type: 'deezer_search', data: [] }))
      );
    }

    // 2) iTunes songs & albums pour avoir les previews audio et les featurings précis
    promises.push(
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=song&limit=40`)
        .then(r => r.json())
        .then(d => ({ type: 'itunes_songs', data: d.results || [] }))
        .catch(() => ({ type: 'itunes_songs', data: [] }))
    );

    // 3) YouTube videos via Base44
    if (youtubeId) {
      promises.push(
        base44.functions.invoke('searchArtistOnPlatforms', {
          action: 'fetch_content',
          platform: 'youtube',
          platform_artist_id: youtubeId,
        }).then(r => ({ type: 'youtube_videos', data: r.data?.content || [] })).catch(() => ({ type: 'youtube_videos', data: [] }))
      );
    } else {
      // Si pas de chaîne YouTube spécifiée, tenter avec le nom
      promises.push(
        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=musicVideo&limit=15`)
          .then(r => r.json())
          .then(d => ({ type: 'itunes_videos', data: d.results || [] }))
          .catch(() => ({ type: 'itunes_videos', data: [] }))
      );
    }

    const results = await Promise.all(promises);

    let rawReleases = [];
    let itunesSongs = [];
    let rawVideos = [];

    for (const r of results) {
      if (r.type === 'deezer_releases' || r.type === 'deezer_search') {
        rawReleases = rawReleases.concat(r.data);
      } else if (r.type === 'itunes_songs') {
        itunesSongs = r.data;
      } else if (r.type === 'youtube_videos') {
        rawVideos = rawVideos.concat(r.data);
      } else if (r.type === 'itunes_videos') {
        for (const iv of r.data) {
          rawVideos.push({
            id: `itunes-vid-${iv.trackId}`,
            title: iv.trackName,
            youtube_url: '',
            apple_music_url: iv.trackViewUrl,
            thumbnail_url: (iv.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg'),
            publish_date: iv.releaseDate?.slice(0, 10) || '',
            video_type: 'clip_officiel',
            preview_url: iv.previewUrl || '',
          });
        }
      }
    }

    // Associer les morceaux iTunes pour enrichir les previews audio et les featurings
    const itunesMapByTitle = new Map();
    for (const s of itunesSongs) {
      const key = s.trackName?.toLowerCase().trim();
      if (key && !itunesMapByTitle.has(key)) {
        itunesMapByTitle.set(key, s);
      }
    }

    // Normaliser les releases
    const releases = [];
    const seenReleaseKeys = new Set();

    // Traiter les sorties Deezer
    for (const item of rawReleases) {
      const parsedFeat = extractFeaturing(item.title, name);
      const key = parsedFeat.cleanTitle.toLowerCase();
      if (seenReleaseKeys.has(key)) continue;
      seenReleaseKeys.add(key);

      // Chercher match iTunes pour audio preview
      const itMatch = itunesMapByTitle.get(key) || itunesMapByTitle.get(item.title.toLowerCase());
      const previewAudio = itMatch?.previewUrl || item.preview || '';
      const releaseDate = item.release_date || itMatch?.releaseDate?.slice(0, 10) || new Date().toISOString().split('T')[0];
      const hdCover = item.cover_url || (itMatch?.artworkUrl100 || '').replace('100x100bb.jpg', '1000x1000bb.jpg');

      releases.push({
        id: `release-${item.id || key}`,
        originalId: item.id,
        title: parsedFeat.fullTitle,
        cleanTitle: parsedFeat.cleanTitle,
        featuring: parsedFeat.featuring || (itMatch ? extractFeaturing(itMatch.trackName, name).featuring : ''),
        artist_name: name,
        release_type: item.release_type === 'album' ? 'album' : item.release_type === 'ep' ? 'ep' : 'single',
        release_date: releaseDate,
        cover_url: hdCover,
        audio_preview_url: previewAudio,
        spotify_url: item.spotify_url || `https://open.spotify.com/search/${encodeURIComponent(`${name} ${parsedFeat.cleanTitle}`)}`,
        deezer_url: item.deezer_url || (item.id ? `https://www.deezer.com/album/${item.id}` : ''),
        apple_music_url: itMatch?.collectionViewUrl || itMatch?.trackViewUrl || '',
        youtube_url: '',
        duration_ms: itMatch?.trackTimeMillis || 0,
        selected: false,
      });
    }

    // Si Deezer a renvoyé peu de résultats, compléter avec les morceaux iTunes non vus
    for (const s of itunesSongs) {
      const parsedFeat = extractFeaturing(s.trackName, name);
      const key = parsedFeat.cleanTitle.toLowerCase();
      if (seenReleaseKeys.has(key)) continue;
      seenReleaseKeys.add(key);

      releases.push({
        id: `itunes-track-${s.trackId}`,
        originalId: s.trackId,
        title: parsedFeat.fullTitle,
        cleanTitle: parsedFeat.cleanTitle,
        featuring: parsedFeat.featuring,
        artist_name: name,
        release_type: 'single',
        release_date: s.releaseDate?.slice(0, 10) || new Date().toISOString().split('T')[0],
        cover_url: (s.artworkUrl100 || '').replace('100x100bb.jpg', '1000x1000bb.jpg'),
        audio_preview_url: s.previewUrl || '',
        spotify_url: `https://open.spotify.com/search/${encodeURIComponent(`${name} ${parsedFeat.cleanTitle}`)}`,
        deezer_url: '',
        apple_music_url: s.trackViewUrl || s.collectionViewUrl || '',
        youtube_url: '',
        duration_ms: s.trackTimeMillis || 0,
        selected: false,
      });
    }

    // Normaliser les vidéos YouTube
    const videos = [];
    const seenVideoIds = new Set();
    for (const v of rawVideos) {
      const vId = v.id || getYoutubeId(v.youtube_url);
      if (vId && seenVideoIds.has(vId)) continue;
      if (vId) seenVideoIds.add(vId);

      const parsedFeat = extractFeaturing(v.title, name);

      videos.push({
        id: `vid-${vId || Math.random().toString(36).slice(2)}`,
        youtube_url: v.youtube_url || (v.id ? `https://www.youtube.com/watch?v=${v.id}` : ''),
        title: parsedFeat.fullTitle,
        cleanTitle: parsedFeat.cleanTitle,
        featuring: parsedFeat.featuring,
        artist_name: name,
        thumbnail_url: v.thumbnail_url || (vId ? `https://img.youtube.com/vi/${vId}/maxresdefault.jpg` : ''),
        publish_date: v.publish_date || new Date().toISOString().split('T')[0],
        video_type: v.video_type || 'clip_officiel',
        selected: false,
      });
    }

    return { releases, videos };
  },

  /**
   * 3. EXTRACTION PAR LIEN SIMPLE (1 CLIC)
   * Compatible Spotify, YouTube, Deezer, Apple Music.
   */
  async extractFromUrl(rawUrl) {
    if (!rawUrl || !rawUrl.trim()) throw new Error('Veuillez entrer une URL valide.');
    const url = rawUrl.trim();

    // ── SPOTIFY ──
    const spotifyInfo = parseSpotifyUrl(url);
    if (spotifyInfo) {
      try {
        const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
        if (!oembedRes.ok) throw new Error('Lien Spotify inaccessible via oEmbed');
        const oembed = await oembedRes.json();

        const rawTitle = oembed.title || '';
        let artistName = '';
        let trackTitle = rawTitle;

        // Le titre Spotify oEmbed est souvent "Titre" ou "Artiste - Titre"
        if (rawTitle.includes(' - ')) {
          const parts = rawTitle.split(' - ');
          artistName = parts[0].trim();
          trackTitle = parts.slice(1).join(' - ').trim();
        }

        const featData = extractFeaturing(trackTitle, artistName);

        // Enrichir avec iTunes pour avoir la date exacte et l'audio preview
        let previewAudio = '';
        let releaseDate = new Date().toISOString().split('T')[0];
        try {
          const itSearch = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(`${artistName} ${featData.cleanTitle}`)}&entity=song&limit=1`).then(r => r.json());
          if (itSearch.results?.[0]) {
            const first = itSearch.results[0];
            previewAudio = first.previewUrl || '';
            if (first.releaseDate) releaseDate = first.releaseDate.slice(0, 10);
            if (!artistName) artistName = first.artistName;
            if (!featData.featuring) {
              const extraFeat = extractFeaturing(first.trackName, artistName).featuring;
              if (extraFeat) featData.featuring = extraFeat;
            }
          }
        } catch {
          // Ignorer si iTunes indisponible
        }

        return {
          success: true,
          platform: 'spotify',
          type: spotifyInfo.type === 'album' ? 'album' : 'single',
          title: featData.fullTitle,
          cleanTitle: featData.cleanTitle,
          featuring: featData.featuring,
          artist_name: artistName || 'Artiste',
          cover_url: oembed.thumbnail_url || '',
          release_date: releaseDate,
          spotify_url: url,
          audio_file_url: previewAudio,
          description: `Sortie importée depuis Spotify · ${artistName}${featData.featuring ? ` (feat. ${featData.featuring})` : ''}`,
        };
      } catch (err) {
        // Fallback Base44
        const res = await base44.functions.invoke('extractLinkMetadata', { url });
        if (res.data && !res.data.error) return res.data;
        throw new Error(err.message || "Impossible d'extraire les informations de ce lien Spotify.");
      }
    }

    // ── YOUTUBE ──
    const ytId = getYoutubeId(url);
    if (ytId) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (!oembedRes.ok) throw new Error('Vidéo YouTube introuvable');
        const oembed = await oembedRes.json();

        const featData = extractFeaturing(oembed.title, oembed.author_name);

        return {
          success: true,
          platform: 'youtube',
          type: 'video',
          title: featData.fullTitle,
          cleanTitle: featData.cleanTitle,
          featuring: featData.featuring,
          artist_name: oembed.author_name || 'Artiste',
          thumbnail_url: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
          youtube_url: `https://www.youtube.com/watch?v=${ytId}`,
          video_type: 'clip_officiel',
          publish_date: new Date().toISOString().split('T')[0],
          description: `Clip officiel de ${oembed.author_name || ''} · KKD Video`,
        };
      } catch (err) {
        const res = await base44.functions.invoke('extractLinkMetadata', { url });
        if (res.data && !res.data.error) return res.data;
        throw new Error(err.message || 'Impossible d’extraire cette vidéo YouTube.');
      }
    }

    // ── DEEZER ──
    if (url.includes('deezer.com')) {
      try {
        const oembedRes = await fetch(`https://api.deezer.com/oembed?url=${encodeURIComponent(url)}`);
        const oembed = await oembedRes.json();
        const featData = extractFeaturing(oembed.title, oembed.author_name);

        return {
          success: true,
          platform: 'deezer',
          type: oembed.entity === 'album' ? 'album' : 'single',
          title: featData.fullTitle,
          cleanTitle: featData.cleanTitle,
          featuring: featData.featuring,
          artist_name: oembed.author_name || 'Artiste',
          cover_url: oembed.thumbnail_url || '',
          deezer_url: url,
          release_date: new Date().toISOString().split('T')[0],
          description: `Sortie officielle de ${oembed.author_name}`,
        };
      } catch (err) {
        throw new Error(err.message || 'Extraction Deezer échouée.');
      }
    }

    // Fallback générique Base44
    const res = await base44.functions.invoke('extractLinkMetadata', { url });
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  },

  /**
   * 4. IMPORTATION DIRECTE DANS LE CATALOGUE KKD / NIA
   * Crée ou associe l'artiste, puis crée les releases et les vidéos sélectionnées.
   */
  async importToCatalog({ artist, releases = [], videos = [] }) {
    if (!artist || !artist.name) throw new Error("Nom d'artiste manquant pour l'importation.");

    const artistName = artist.name.trim();

    // 1) Vérifier ou créer l'artiste dans le catalogue
    let artistId = artist.id || '';
    let artistEntity = null;

    try {
      const existingArtists = await base44.entities.Artist.list();
      artistEntity = existingArtists.find(
        a => a.name?.toLowerCase().trim() === artistName.toLowerCase()
      );

      if (artistEntity) {
        artistId = artistEntity.id;
        // Si l'artiste existait mais n'avait pas de photo, mettre à jour si on a une photo
        if (!artistEntity.photo_url && artist.image) {
          await base44.entities.Artist.update(artistEntity.id, { photo_url: artist.image });
        }
      } else {
        // Créer l'artiste automatiquement !
        const created = await base44.entities.Artist.create({
          name: artistName,
          genre: (artist.genres && artist.genres[0]) || 'Afrobeats / Musique Urbaine',
          photo_url: artist.image || '',
          bio: `Artiste ${artistName} répertorié sur le réseau KKD Music & NIA.`,
          spotify_url: artist.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(artistName)}`,
          is_verified: true,
        });
        artistId = created.id;
        artistEntity = created;
      }
    } catch (err) {
      console.warn('[catalogImporterService] Erreur résolution artiste:', err);
    }

    // 2) Importer les sorties musicales (Releases)
    let createdReleasesCount = 0;
    let skippedReleasesCount = 0;

    if (releases.length > 0) {
      // Charger les releases existantes pour cet artiste pour éviter les doublons
      let existingReleases = [];
      try {
        existingReleases = await base44.entities.Release.filter({ artist_name: artistName });
      } catch {
        existingReleases = [];
      }

      const existingTitles = new Set(
        existingReleases.map(r => r.title?.toLowerCase().trim())
      );

      for (const rel of releases) {
        const titleKey = (rel.title || '').toLowerCase().trim();
        if (existingTitles.has(titleKey)) {
          skippedReleasesCount++;
          continue;
        }

        try {
          await base44.entities.Release.create({
            title: rel.title,
            artist_name: artistName,
            artist_id: artistId || '',
            featuring_artist: rel.featuring || '',
            cover_url: rel.cover_url || '',
            release_date: rel.release_date || new Date().toISOString().split('T')[0],
            release_type: rel.release_type || 'single',
            spotify_url: rel.spotify_url || '',
            deezer_url: rel.deezer_url || '',
            apple_music_url: rel.apple_music_url || '',
            youtube_url: rel.youtube_url || '',
            audio_file_url: rel.audio_preview_url || '',
            description: rel.description || `Sortie officielle de ${artistName}${rel.featuring ? ` (feat. ${rel.featuring})` : ''}`,
            is_featured: false,
            is_for_sale: false,
            price: 0,
          });
          existingTitles.add(titleKey);
          createdReleasesCount++;
        } catch (err) {
          console.error(`[catalogImporterService] Erreur création release ${rel.title}:`, err);
        }
      }
    }

    // 3) Importer les clips & vidéos (Videos)
    let createdVideosCount = 0;
    let skippedVideosCount = 0;

    if (videos.length > 0) {
      let existingVideos = [];
      try {
        existingVideos = await base44.entities.Video.filter({ artist_name: artistName });
      } catch {
        existingVideos = [];
      }

      const existingYtUrls = new Set(
        existingVideos.map(v => (v.youtube_url || '').toLowerCase().trim())
      );
      const existingVideoTitles = new Set(
        existingVideos.map(v => (v.title || '').toLowerCase().trim())
      );

      for (const vid of videos) {
        const urlKey = (vid.youtube_url || '').toLowerCase().trim();
        const titleKey = (vid.title || '').toLowerCase().trim();

        if ((urlKey && existingYtUrls.has(urlKey)) || existingVideoTitles.has(titleKey)) {
          skippedVideosCount++;
          continue;
        }

        try {
          await base44.entities.Video.create({
            title: vid.title,
            artist_name: artistName,
            artist_id: artistId || '',
            youtube_url: vid.youtube_url || '',
            thumbnail_url: vid.thumbnail_url || '',
            video_type: vid.video_type || 'clip_officiel',
            publish_date: vid.publish_date || new Date().toISOString().split('T')[0],
            description: vid.description || `Clip officiel de ${artistName}${vid.featuring ? ` (feat. ${vid.featuring})` : ''}`,
            is_featured: false,
            is_for_sale: false,
            price: 0,
          });
          if (urlKey) existingYtUrls.add(urlKey);
          existingVideoTitles.add(titleKey);
          createdVideosCount++;
        } catch (err) {
          console.error(`[catalogImporterService] Erreur création vidéo ${vid.title}:`, err);
        }
      }
    }

    return {
      success: true,
      artistId,
      artistName,
      createdReleasesCount,
      skippedReleasesCount,
      createdVideosCount,
      skippedVideosCount,
      totalImported: createdReleasesCount + createdVideosCount,
    };
  },
};

export default catalogImporterService;
