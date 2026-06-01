import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { content_type, entity_id } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');

    // Get Instagram user ID
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const me = await meRes.json();
    if (!me.id) return Response.json({ error: 'Cannot get Instagram user ID', details: me }, { status: 500 });
    const igUserId = me.id;

    let imageUrl, caption;

    if (content_type === 'release') {
      const releases = await base44.asServiceRole.entities.Release.filter({ id: entity_id });
      const r = releases[0];
      if (!r) return Response.json({ error: 'Release not found' }, { status: 404 });
      imageUrl = r.cover_url;
      const streamLink = r.spotify_url || r.apple_music_url || r.audiomack_url || r.youtube_url || '';
      caption = `🎵 Nouvelle sortie : *${r.title}* par ${r.artist_name}\n\n` +
        (r.description ? `${r.description}\n\n` : '') +
        (streamLink ? `🎧 Écouter : ${streamLink}\n\n` : '') +
        `#KKDmusic #NouveautéMusicale #${r.artist_name?.replace(/\s+/g, '')} #${r.release_type || 'Music'}`;

    } else if (content_type === 'event') {
      const events = await base44.asServiceRole.entities.Event.filter({ id: entity_id });
      const e = events[0];
      if (!e) return Response.json({ error: 'Event not found' }, { status: 404 });
      imageUrl = e.image_url;
      const dateStr = e.event_date ? new Date(e.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      caption = `📅 Événement : *${e.title}*\n\n` +
        (dateStr ? `🗓️ ${dateStr}\n` : '') +
        (e.location ? `📍 ${e.location}${e.city ? `, ${e.city}` : ''}\n` : '') +
        (e.description ? `\n${e.description}\n` : '') +
        (e.ticket_url ? `\n🎟️ Billets : ${e.ticket_url}\n` : '') +
        `\n#KKDmusic #Concert #${e.city?.replace(/\s+/g, '') || 'Événement'}`;

    } else if (content_type === 'news') {
      const newsList = await base44.asServiceRole.entities.News.filter({ id: entity_id });
      const n = newsList[0];
      if (!n) return Response.json({ error: 'News not found' }, { status: 404 });
      imageUrl = n.image_url;
      caption = `📰 ${n.title}\n\n` +
        (n.excerpt || n.content?.slice(0, 200) || '') +
        `\n\n#KKDmusic #Actualité #Music`;

    } else if (content_type === 'video') {
      const videos = await base44.asServiceRole.entities.Video.filter({ id: entity_id });
      const v = videos[0];
      if (!v) return Response.json({ error: 'Video not found' }, { status: 404 });
      imageUrl = v.thumbnail_url;
      if (!imageUrl && v.youtube_url) {
        const match = v.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?\s]+)/);
        if (match) imageUrl = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
      }
      caption = `🎬 *${v.title}*${v.artist_name ? ` par ${v.artist_name}` : ''}\n\n` +
        (v.description ? `${v.description}\n\n` : '') +
        (v.youtube_url ? `▶️ Voir : ${v.youtube_url}\n\n` : '') +
        `#KKDmusic #ClipOfficiel ${v.artist_name ? `#${v.artist_name?.replace(/\s+/g, '')}` : ''}`;
    } else {
      return Response.json({ error: 'Unknown content_type' }, { status: 400 });
    }

    if (!imageUrl) {
      return Response.json({ error: 'No image URL available for this content', skipped: true }, { status: 200 });
    }

    // Step 1: Create media container
    const createRes = await fetch(`https://graph.instagram.com/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
    });
    const created = await createRes.json();
    if (!created.id) return Response.json({ error: 'Failed to create media container', details: created }, { status: 500 });

    // Step 2: Publish
    const publishRes = await fetch(`https://graph.instagram.com/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: created.id, access_token: accessToken }),
    });
    const published = await publishRes.json();

    return Response.json({ success: true, post_id: published.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});