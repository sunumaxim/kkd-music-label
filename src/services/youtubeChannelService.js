/**
 * Service de résolution et synchronisation YouTube pour KKD Music / NIA
 * - Résolution des chaînes YouTube d'artistes
 * - Récupération du nombre d'abonnés et du profil de chaîne officiel
 * - Respect des contraintes de performance et de légèreté visuelle (anti-surcharge)
 */
import { base44 } from '@/api/base44Client';

// Cache mémoire pour éviter les requêtes répétitives
const ytCache = new Map();

/**
 * Extrait l'ID ou le slug YouTube depuis différentes formes d'URLs
 */
export function extractYouTubeChannelIdentifier(url) {
  if (!url) return null;
  // Patterns: youtube.com/@username, youtube.com/channel/UC..., youtube.com/c/customName, youtube.com/user/userName
  const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/i);
  if (handleMatch) return { type: 'handle', value: handleMatch[1], url: `https://www.youtube.com/@${handleMatch[1]}` };

  const channelMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i);
  if (channelMatch) return { type: 'channelId', value: channelMatch[1], url: `https://www.youtube.com/channel/${channelMatch[1]}` };

  const cMatch = url.match(/youtube\.com\/(?:c|user)\/([a-zA-Z0-9_.-]+)/i);
  if (cMatch) return { type: 'custom', value: cMatch[1], url: `https://www.youtube.com/c/${cMatch[1]}` };

  return { type: 'url', value: url, url };
}

/**
 * Formatage lisible du nombre d'abonnés
 * Exemple: 1250000 -> "1,25 M"
 */
export function formatSubscriberCount(count) {
  if (count === null || count === undefined || count === '') return null;
  const num = typeof count === 'string' ? parseInt(count.replace(/[^0-9]/g, ''), 10) : count;
  if (isNaN(num)) return typeof count === 'string' ? count : null;

  if (num >= 1_000_000) {
    const formatted = (num / 1_000_000).toFixed(num % 1_000_000 >= 100_000 ? 1 : 0);
    return `${formatted.replace('.', ',')} M`;
  }
  if (num >= 1_000) {
    const formatted = (num / 1_000).toFixed(num % 1_000 >= 100 ? 1 : 0);
    return `${formatted.replace('.', ',')} k`;
  }
  return num.toLocaleString('fr-FR');
}

/**
 * Récupère les métadonnées de chaîne YouTube pour un artiste
 * Interroge l'entité Artist, la fonction searchArtistOnPlatforms ou les données stockées
 */
export async function getArtistYouTubeChannelInfo(artistName, artistYoutubeUrl = '', artistData = null) {
  if (!artistName && !artistYoutubeUrl) return null;

  const cacheKey = (artistYoutubeUrl || artistName).toLowerCase().trim();
  if (ytCache.has(cacheKey)) {
    return ytCache.get(cacheKey);
  }

  let channelUrl = artistYoutubeUrl || '';
  let subscribersCount = artistData?.youtube_subscribers || artistData?.subscribers_count || null;
  let channelTitle = artistName || '';
  let channelThumbnail = artistData?.photo_url || '';

  // Vérifier d'abord si l'artiste stocké a déjà un nombre d'abonnés ou une chaîne YouTube
  if ((!subscribersCount || !channelUrl) && artistName) {
    try {
      const dbArtists = await base44.entities.Artist.filter({ name: artistName });
      if (dbArtists && dbArtists[0]) {
        const a = dbArtists[0];
        channelUrl = channelUrl || a.youtube_url || '';
        subscribersCount = subscribersCount || a.youtube_subscribers || a.subscribers_count || null;
        channelThumbnail = channelThumbnail || a.photo_url || '';
      }
    } catch (e) {}
  }

  // 1. Si on n'a pas encore le nombre d'abonnés, interrogeons searchArtistOnPlatforms
  if (!subscribersCount) {
    try {
      const query = artistName || artistYoutubeUrl;
      const res = await base44.functions.invoke('searchArtistOnPlatforms', {
        action: 'search',
        query: query,
      });

      const ytData = res.data?.youtube;
      if (Array.isArray(ytData) && ytData.length > 0) {
        // Trouver la chaîne la plus pertinente
        const match = ytData.find(c => {
          if (channelUrl && (c.url?.toLowerCase().includes(channelUrl.toLowerCase()) || channelUrl.toLowerCase().includes(c.id?.toLowerCase()))) {
            return true;
          }
          return c.name?.toLowerCase().includes((artistName || '').toLowerCase());
        }) || ytData[0];

        if (match) {
          channelTitle = match.name || channelTitle;
          channelUrl = match.url || (match.id ? `https://www.youtube.com/channel/${match.id}` : channelUrl);
          channelThumbnail = channelThumbnail || match.image || match.thumbnail || '';
          subscribersCount = match.subscribers || match.subscriberCount || match.followers || null;
        }
      }
    } catch (err) {
      // Silencieux, le fallback prend le relais
    }
  }

  // 2. Si aucune URL officielle n'était renseignée mais qu'on a un nom d'artiste
  if (!channelUrl && artistName) {
    channelUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(artistName)}`;
  }

  const result = {
    channelTitle: channelTitle || artistName,
    channelUrl,
    subscribersCount: subscribersCount ? formatSubscriberCount(subscribersCount) : null,
    rawSubscribers: subscribersCount,
    channelThumbnail,
  };

  ytCache.set(cacheKey, result);
  return result;
}
