import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Instagram requires publicly accessible image URLs.
// This helper checks if the URL is a base44 private file and creates a signed URL.
async function getPublicImageUrl(base44, imageUrl) {
  if (!imageUrl) return null;
  // base44 private files contain /private/ or /user_/ in the path
  if (imageUrl.includes('/private/') || (imageUrl.includes('media.base44.com') && imageUrl.includes('/user_'))) {
    try {
      const result = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: imageUrl,
        expires_in: 3600,
      });
      return result.signed_url || imageUrl;
    } catch {
      return imageUrl;
    }
  }
  return imageUrl;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { content_type, entity_id } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');

    // Get Instagram Business Account ID via Graph API
    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account&access_token=${accessToken}`
    );
    const meData = await meRes.json();

    // Try to get ig business account from pages
    let igUserId = null;
    if (meData.data && meData.data.length > 0) {
      for (const page of meData.data) {
        if (page.instagram_business_account?.id) {
          igUserId = page.instagram_business_account.id;
          break;
        }
      }
    }

    // Fallback: try direct /me endpoint (Instagram Basic Display)
    if (!igUserId) {
      const directRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
      const directData = await directRes.json();
      igUserId = directData.id;
    }

    if (!igUserId) {
      return Response.json({
        error: 'Impossible de récupérer le compte Instagram Business. Vérifiez que votre compte Instagram est bien un compte Business/Creator lié à une Page Facebook.',
        details: meData
      }, { status: 500 });
    }

    let imageUrl, caption;

    if (content_type === 'release') {
      const releases = await base44.asServiceRole.entities.Release.filter({ id: entity_id });
      const r = releases[0];
      if (!r) return Response.json({ error: 'Release not found' }, { status: 404 });
      imageUrl = await getPublicImageUrl(base44, r.cover_url);
      const streamLink = r.spotify_url || r.apple_music_url || r.audiomack_url || r.youtube_url || '';
      caption = `🎵 Nouvelle sortie : ${r.title} par ${r.artist_name}\n\n` +
        (r.description ? `${r.description}\n\n` : '') +
        (streamLink ? `🎧 Écouter : ${streamLink}\n\n` : '') +
        `#KKDmusic #NouveautéMusicale #${r.artist_name?.replace(/\s+/g, '')} #${r.release_type || 'Music'}`;

    } else if (content_type === 'event') {
      const events = await base44.asServiceRole.entities.Event.filter({ id: entity_id });
      const e = events[0];
      if (!e) return Response.json({ error: 'Event not found' }, { status: 404 });
      imageUrl = await getPublicImageUrl(base44, e.image_url);
      const dateStr = e.event_date ? new Date(e.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      caption = `📅 ${e.title}\n\n` +
        (dateStr ? `🗓️ ${dateStr}\n` : '') +
        (e.location ? `📍 ${e.location}${e.city ? `, ${e.city}` : ''}\n` : '') +
        (e.description ? `\n${e.description}\n` : '') +
        (e.ticket_url ? `\n🎟️ Billets : ${e.ticket_url}\n` : '') +
        `\n#KKDmusic #Concert #${e.city?.replace(/\s+/g, '') || 'Événement'}`;

    } else if (content_type === 'news') {
      const newsList = await base44.asServiceRole.entities.News.filter({ id: entity_id });
      const n = newsList[0];
      if (!n) return Response.json({ error: 'News not found' }, { status: 404 });
      imageUrl = await getPublicImageUrl(base44, n.image_url);
      caption = `📰 ${n.title}\n\n` +
        (n.excerpt || n.content?.slice(0, 200) || '') +
        `\n\n#KKDmusic #Actualité #Music`;

    } else if (content_type === 'video') {
      const videos = await base44.asServiceRole.entities.Video.filter({ id: entity_id });
      const v = videos[0];
      if (!v) return Response.json({ error: 'Video not found' }, { status: 404 });
      imageUrl = await getPublicImageUrl(base44, v.thumbnail_url);
      if (!imageUrl && v.youtube_url) {
        const match = v.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?\s]+)/);
        if (match) imageUrl = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
      }
      caption = `🎬 ${v.title}${v.artist_name ? ` par ${v.artist_name}` : ''}\n\n` +
        (v.description ? `${v.description}\n\n` : '') +
        (v.youtube_url ? `▶️ Voir : ${v.youtube_url}\n\n` : '') +
        `#KKDmusic #ClipOfficiel ${v.artist_name ? `#${v.artist_name?.replace(/\s+/g, '')}` : ''}`;
    } else {
      return Response.json({ error: 'Unknown content_type' }, { status: 400 });
    }

    if (!imageUrl) {
      return Response.json({
        error: 'Aucune image disponible pour ce contenu. Ajoutez une image/pochette pour publier sur Instagram.',
        skipped: true
      }, { status: 200 });
    }

    // Step 1: Create media container
    const createRes = await fetch(`https://graph.instagram.com/v19.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
    });
    const created = await createRes.json();
    if (!created.id) {
      return Response.json({
        error: `Échec de la création du post Instagram : ${created.error?.message || JSON.stringify(created)}`,
        details: created
      }, { status: 500 });
    }

    // Step 2: Publish
    const publishRes = await fetch(`https://graph.instagram.com/v19.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: created.id, access_token: accessToken }),
    });
    const published = await publishRes.json();

    if (!published.id) {
      return Response.json({
        error: `Échec de la publication : ${published.error?.message || JSON.stringify(published)}`,
        details: published
      }, { status: 500 });
    }

    return Response.json({ success: true, post_id: published.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});