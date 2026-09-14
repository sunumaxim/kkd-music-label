/**
 * musicLinkResolverService.js
 * 
 * Permet aux artistes indépendants et administrateurs d'importer une musique,
 * un EP ou un Album complet à partir d'un simple lien (Spotify, Deezer, Apple Music, YouTube, URL directe).
 * 
 * Règles d'or :
 * - Respecte la structure Album / EP : regroupe toutes les pistes d'un même album ensemble.
 * - Ne génère AUCUNE fausse métadonnée (pas de faux distributeur KKD, pas de faux label, pas de faux ISRC).
 * - Préserve les liens officiels vers les plateformes de streaming pour l'écoute complète.
 */

import { cleanArtistName, extractFeaturing } from './artistSyncService';

/**
 * Détecte la plateforme et le type d'entité d'une URL
 */
export function identifyMusicUrl(url = '') {
  const cleanUrl = (url || '').trim();
  if (!cleanUrl) return { platform: 'unknown', entityType: 'unknown', url: '' };

  // 1. Spotify
  if (cleanUrl.includes('spotify.com')) {
    let entityType = 'track';
    if (cleanUrl.includes('/album/')) entityType = 'album';
    else if (cleanUrl.includes('/artist/')) entityType = 'artist';
    else if (cleanUrl.includes('/playlist/')) entityType = 'playlist';
    return { platform: 'spotify', entityType, url: cleanUrl };
  }

  // 2. Deezer
  if (cleanUrl.includes('deezer.com')) {
    let entityType = 'track';
    if (cleanUrl.includes('/album/')) entityType = 'album';
    else if (cleanUrl.includes('/artist/')) entityType = 'artist';
    return { platform: 'deezer', entityType, url: cleanUrl };
  }

  // 3. Apple Music / iTunes
  if (cleanUrl.includes('music.apple.com') || cleanUrl.includes('itunes.apple.com')) {
    let entityType = 'single';
    if (cleanUrl.includes('/album/')) {
      entityType = cleanUrl.includes('?i=') ? 'track' : 'album';
    }
    return { platform: 'apple_music', entityType, url: cleanUrl };
  }

  // 4. YouTube
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    return { platform: 'youtube', entityType: 'video', url: cleanUrl };
  }

  // 5. Direct Audio Stream (.mp3, .wav, .m4a, .aac, .ogg)
  const isAudioFile = /\.(mp3|wav|m4a|aac|ogg)(\?.*)?$/i.test(cleanUrl);
  if (isAudioFile) {
    return { platform: 'direct_audio', entityType: 'track', url: cleanUrl };
  }

  return { platform: 'generic', entityType: 'track', url: cleanUrl };
}

/**
 * Résout les métadonnées et la tracklist complète depuis un lien
 */
export async function resolveMusicLink(url) {
  const info = identifyMusicUrl(url);
  if (!info.url) {
    throw new Error('Veuillez fournir un lien musical valide.');
  }

  switch (info.platform) {
    case 'spotify':
      return resolveSpotifyLink(info.url, info.entityType);
    case 'deezer':
      return resolveDeezerLink(info.url, info.entityType);
    case 'apple_music':
      return resolveAppleMusicLink(info.url, info.entityType);
    case 'youtube':
      return resolveYouTubeLink(info.url);
    case 'direct_audio':
      return resolveDirectAudioLink(info.url);
    default:
      return resolveGenericLink(info.url);
  }
}

/**
 * Résolution Spotify (via Spotify oEmbed + iTunes Search pour audio & tracklist d'album)
 */
async function resolveSpotifyLink(url, entityType) {
  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const oembedRes = await fetch(oembedUrl);
    if (!oembedRes.ok) throw new Error('Contenu Spotify introuvable.');
    const oembed = await oembedRes.json();

    const rawTitle = oembed.title || '';
    let artistName = '';
    let workTitle = rawTitle;

    if (rawTitle.includes(' - ')) {
      const parts = rawTitle.split(' - ');
      artistName = parts[0].trim();
      workTitle = parts.slice(1).join(' - ').trim();
    }

    const featData = extractFeaturing(workTitle, artistName);
    const coverUrl = oembed.thumbnail_url || '';

    // Si c'est un ALBUM : récupérer la liste complète des morceaux qui composent l'album
    if (entityType === 'album') {
      let albumTracks = [];
      let albumYear = new Date().getFullYear();

      try {
        // Recherche de la collection album correspondante sur iTunes
        const searchRes = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(`${artistName} ${featData.cleanTitle}`)}&entity=album&limit=3`
        ).then(r => r.json());

        const matchedAlbum = searchRes.results?.[0];
        if (matchedAlbum?.collectionId) {
          if (matchedAlbum.releaseDate) albumYear = parseInt(matchedAlbum.releaseDate.slice(0, 4), 10);

          // Récupérer toutes les pistes de l'album via iTunes lookup
          const lookupRes = await fetch(
            `https://itunes.apple.com/lookup?id=${matchedAlbum.collectionId}&entity=song`
          ).then(r => r.json());

          const songs = (lookupRes.results || []).filter(item => item.wrapperType === 'track');
          if (songs.length > 0) {
            albumTracks = songs.map((s, idx) => {
              const trkFeat = extractFeaturing(s.trackName, artistName);
              return {
                id: `trk_${idx + 1}_${s.trackId || Date.now()}`,
                track_number: s.trackNumber || idx + 1,
                title: trkFeat.cleanTitle || s.trackName,
                featuring: trkFeat.featuring || '',
                artist_name: artistName,
                audio_file_url: s.previewUrl || '',
                duration: s.trackTimeMillis ? Math.round(s.trackTimeMillis / 1000) : 180,
                spotify_url: url,
                apple_music_url: s.trackViewUrl || '',
              };
            });
          }
        }
      } catch (err) {
        console.warn('[musicLinkResolver] Erreur recherche tracklist album iTunes:', err);
      }

      // Si aucune piste n'a pu être résolue automatiquement, préparer au moins 1 piste pour l'album
      if (albumTracks.length === 0) {
        albumTracks = [
          {
            id: `trk_1_${Date.now()}`,
            track_number: 1,
            title: featData.cleanTitle,
            featuring: featData.featuring || '',
            artist_name: artistName,
            audio_file_url: '',
            duration: 180,
            spotify_url: url,
          }
        ];
      }

      return {
        success: true,
        platform: 'spotify',
        format: albumTracks.length > 6 ? 'album' : 'ep',
        title: featData.cleanTitle,
        artist_name: artistName || 'Artiste',
        featuring: featData.featuring || '',
        cover_url: coverUrl,
        release_year: albumYear,
        release_date: `${albumYear}-01-01`,
        spotify_url: url,
        audio_file_url: albumTracks[0]?.audio_file_url || '',
        tracks: albumTracks,
        source: 'spotify_album',
      };
    }

    // Si c'est un SINGLE / TRACK :
    let previewAudio = '';
    let trackDuration = 180;
    let appleUrl = '';
    let releaseYear = new Date().getFullYear();

    try {
      const itRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(`${artistName} ${featData.cleanTitle}`)}&entity=song&limit=1`
      ).then(r => r.json());

      if (itRes.results?.[0]) {
        const trk = itRes.results[0];
        previewAudio = trk.previewUrl || '';
        if (trk.trackTimeMillis) trackDuration = Math.round(trk.trackTimeMillis / 1000);
        if (trk.releaseDate) releaseYear = parseInt(trk.releaseDate.slice(0, 4), 10);
        appleUrl = trk.trackViewUrl || '';
      }
    } catch {
      // preview audio optionnel
    }

    const singleTrack = {
      id: `trk_1_${Date.now()}`,
      track_number: 1,
      title: featData.cleanTitle,
      featuring: featData.featuring || '',
      artist_name: artistName,
      audio_file_url: previewAudio,
      duration: trackDuration,
      spotify_url: url,
      apple_music_url: appleUrl,
    };

    return {
      success: true,
      platform: 'spotify',
      format: 'single',
      title: featData.cleanTitle,
      artist_name: artistName || 'Artiste',
      featuring: featData.featuring || '',
      cover_url: coverUrl,
      release_year: releaseYear,
      release_date: `${releaseYear}-01-01`,
      spotify_url: url,
      apple_music_url: appleUrl,
      audio_file_url: previewAudio,
      duration: trackDuration,
      tracks: [singleTrack],
      source: 'spotify_track',
    };
  } catch (err) {
    throw new Error(err?.message || "Échec de l'analyse du lien Spotify.");
  }
}

/**
 * Résolution Deezer
 */
async function resolveDeezerLink(url, entityType) {
  try {
    // Si c'est un album Deezer
    const albumMatch = url.match(/\/album\/(\d+)/);
    if (albumMatch) {
      const albumId = albumMatch[1];
      const res = await fetch(`https://api.deezer.com/album/${albumId}`);
      if (res.ok) {
        const data = await res.json();
        const artistName = data.artist?.name || 'Artiste';
        const rawTracks = data.tracks?.data || [];
        const format = data.record_type === 'ep' ? 'ep' : rawTracks.length <= 1 ? 'single' : 'album';

        const tracks = rawTracks.map((t, idx) => {
          const feat = extractFeaturing(t.title, artistName);
          return {
            id: `trk_${idx + 1}_${t.id}`,
            track_number: t.track_position || idx + 1,
            title: feat.cleanTitle || t.title,
            featuring: feat.featuring || '',
            artist_name: artistName,
            audio_file_url: t.preview || '',
            duration: t.duration || 180,
            deezer_url: t.link || url,
          };
        });

        const featData = extractFeaturing(data.title, artistName);

        return {
          success: true,
          platform: 'deezer',
          format,
          title: featData.cleanTitle || data.title,
          artist_name: artistName,
          featuring: featData.featuring || '',
          cover_url: data.cover_xl || data.cover_big || data.cover_medium || '',
          release_year: data.release_date ? parseInt(data.release_date.slice(0, 4), 10) : new Date().getFullYear(),
          release_date: data.release_date || new Date().toISOString().split('T')[0],
          deezer_url: url,
          audio_file_url: tracks[0]?.audio_file_url || '',
          tracks,
          source: 'deezer_album',
        };
      }
    }

    // Fallback oEmbed Deezer pour track
    const oembedUrl = `https://api.deezer.com/oembed?url=${encodeURIComponent(url)}`;
    const oembedRes = await fetch(oembedUrl);
    if (!oembedRes.ok) throw new Error('Contenu Deezer introuvable.');
    const oembed = await oembedRes.json();

    const artistName = oembed.author_name || 'Artiste';
    const featData = extractFeaturing(oembed.title, artistName);

    const singleTrack = {
      id: `trk_1_${Date.now()}`,
      track_number: 1,
      title: featData.cleanTitle,
      featuring: featData.featuring || '',
      artist_name: artistName,
      audio_file_url: '',
      duration: 180,
      deezer_url: url,
    };

    return {
      success: true,
      platform: 'deezer',
      format: 'single',
      title: featData.cleanTitle,
      artist_name: artistName,
      featuring: featData.featuring || '',
      cover_url: oembed.thumbnail_url || '',
      release_year: new Date().getFullYear(),
      deezer_url: url,
      audio_file_url: '',
      tracks: [singleTrack],
      source: 'deezer_track',
    };
  } catch (err) {
    throw new Error(err?.message || "Échec de l'analyse du lien Deezer.");
  }
}

/**
 * Résolution Apple Music / iTunes
 */
async function resolveAppleMusicLink(url) {
  try {
    // Extraire l'identifiant d'album ou de morceau
    const albumMatch = url.match(/\/album\/[^/]+\/(\d+)/);
    const trackMatch = url.match(/[?&]i=(\d+)/);

    const albumId = albumMatch ? albumMatch[1] : null;
    const trackId = trackMatch ? trackMatch[1] : null;

    if (albumId) {
      const lookupUrl = `https://itunes.apple.com/lookup?id=${albumId}&entity=song`;
      const res = await fetch(lookupUrl);
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        const collection = results.find(r => r.wrapperType === 'collection');
        const songTracks = results.filter(r => r.wrapperType === 'track');

        if (collection) {
          const artistName = collection.artistName || 'Artiste';
          const format = songTracks.length > 6 ? 'album' : songTracks.length > 1 ? 'ep' : 'single';
          const featData = extractFeaturing(collection.collectionName, artistName);

          const tracks = songTracks.map((s, idx) => {
            const trkFeat = extractFeaturing(s.trackName, artistName);
            return {
              id: `trk_${idx + 1}_${s.trackId}`,
              track_number: s.trackNumber || idx + 1,
              title: trkFeat.cleanTitle || s.trackName,
              featuring: trkFeat.featuring || '',
              artist_name: artistName,
              audio_file_url: s.previewUrl || '',
              duration: s.trackTimeMillis ? Math.round(s.trackTimeMillis / 1000) : 180,
              apple_music_url: s.trackViewUrl || url,
            };
          });

          return {
            success: true,
            platform: 'apple_music',
            format,
            title: featData.cleanTitle || collection.collectionName,
            artist_name: artistName,
            featuring: featData.featuring || '',
            cover_url: (collection.artworkUrl100 || '').replace('100x100bb.jpg', '1000x1000bb.jpg'),
            release_year: collection.releaseDate ? parseInt(collection.releaseDate.slice(0, 4), 10) : new Date().getFullYear(),
            release_date: collection.releaseDate?.slice(0, 10) || '',
            apple_music_url: url,
            audio_file_url: tracks[0]?.audio_file_url || '',
            tracks: tracks.length > 0 ? tracks : [
              {
                id: `trk_1_${Date.now()}`,
                track_number: 1,
                title: featData.cleanTitle,
                featuring: featData.featuring || '',
                artist_name: artistName,
                audio_file_url: '',
                duration: 180,
              }
            ],
            source: 'apple_music_album',
          };
        }
      }
    }

    throw new Error('Lien Apple Music non résolu.');
  } catch (err) {
    throw new Error(err?.message || "Échec de l'analyse du lien Apple Music.");
  }
}

/**
 * Résolution YouTube (oEmbed noembed)
 */
async function resolveYouTubeLink(url) {
  try {
    const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (!oembedRes.ok) throw new Error('Vidéo YouTube introuvable.');
    const oembed = await oembedRes.json();

    const artistName = oembed.author_name || 'Artiste';
    const featData = extractFeaturing(oembed.title || '', artistName);

    const singleTrack = {
      id: `trk_1_${Date.now()}`,
      track_number: 1,
      title: featData.cleanTitle || oembed.title,
      featuring: featData.featuring || '',
      artist_name: artistName,
      audio_file_url: '',
      duration: 180,
      youtube_url: url,
    };

    return {
      success: true,
      platform: 'youtube',
      format: 'single',
      title: featData.cleanTitle || oembed.title,
      artist_name: artistName,
      featuring: featData.featuring || '',
      cover_url: oembed.thumbnail_url || '',
      release_year: new Date().getFullYear(),
      youtube_url: url,
      audio_file_url: '',
      tracks: [singleTrack],
      source: 'youtube_video',
    };
  } catch (err) {
    throw new Error(err?.message || "Échec de l'analyse du lien YouTube.");
  }
}

/**
 * Résolution Direct Audio URL
 */
function resolveDirectAudioLink(url) {
  const fileName = url.split('/').pop().split('?')[0];
  const title = decodeURIComponent(fileName).replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  const singleTrack = {
    id: `trk_1_${Date.now()}`,
    track_number: 1,
    title,
    featuring: '',
    artist_name: 'Artiste',
    audio_file_url: url,
    duration: 180,
  };

  return {
    success: true,
    platform: 'direct_audio',
    format: 'single',
    title,
    artist_name: '',
    featuring: '',
    cover_url: '',
    release_year: new Date().getFullYear(),
    audio_file_url: url,
    tracks: [singleTrack],
    source: 'direct_audio',
  };
}

/**
 * Résolution Générique
 */
function resolveGenericLink(url) {
  return {
    success: true,
    platform: 'generic',
    format: 'single',
    title: '',
    artist_name: '',
    featuring: '',
    cover_url: '',
    release_year: new Date().getFullYear(),
    streaming_link: url,
    audio_file_url: '',
    tracks: [],
    source: 'generic_link',
  };
}
