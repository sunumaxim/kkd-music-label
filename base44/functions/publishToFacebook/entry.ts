import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Renvoie une URL d'image publiquement accessible (signée si fichier privé KKD)
async function getPublicImageUrl(base44, imageUrl) {
  if (!imageUrl) return null;
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

// Récupère un enregistrement : utilise les données de l'automatisation si présentes, sinon fetch par ID
async function getRecord(base44, entityName, autoData, entityId) {
  if (autoData) return autoData;
  try { return await base44.asServiceRole.entities[entityName].get(entityId); } catch { return null; }
}

// Liste les pages Facebook gérées par le compte connecté
async function listPages(accessToken) {
  const res = await fetch(
    `https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
  );
  const data = await res.json();
  return (data.data || []).map((p) => ({ id: p.id, name: p.name, access_token: p.access_token }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    let { list, page_id, cover_url, caption, link, video_url, content_type, entity_id } = body;

    // Payload d'automatisation entité : { event: { entity_name, entity_id }, data, old_data }
    let autoData = null;
    if (!content_type && body.event?.entity_name) {
      const map = { Video: 'video', News: 'news', Release: 'release', Event: 'event', Broadcast: 'broadcast' };
      content_type = map[body.event.entity_name];
      entity_id = entity_id || body.event.entity_id;
      autoData = body.data;
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');

    if (list) {
      const pages = await listPages(accessToken);
      return Response.json({ pages });
    }

    const pages = await listPages(accessToken);
    if (!pages.length) {
      return Response.json({ error: 'Aucune page Facebook gérée par ce compte.' }, { status: 400 });
    }

    // ── Mode automatique (workflow) : construire caption + image depuis l'entité ──
    if (content_type) {
      if (content_type === 'event') {
        const e = await getRecord(base44, 'Event', autoData, entity_id);
        if (!e) return Response.json({ error: 'Event not found' }, { status: 404 });
        cover_url = await getPublicImageUrl(base44, e.image_url);
        const dateStr = e.event_date ? new Date(e.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        caption = `📅 ${e.title}\n\n` +
          (dateStr ? `🗓️ ${dateStr}\n` : '') +
          (e.location ? `📍 ${e.location}${e.city ? `, ${e.city}` : ''}\n` : '') +
          (e.description ? `\n${e.description}\n` : '') +
          (e.ticket_url ? `\n🎟️ Billets : ${e.ticket_url}\n` : '') +
          `\n#KKDmusic #Concert #${(e.city || 'Événement').replace(/\s+/g, '')}`;
      } else if (content_type === 'release') {
        const r = await getRecord(base44, 'Release', autoData, entity_id);
        if (!r) return Response.json({ error: 'Release not found' }, { status: 404 });
        cover_url = await getPublicImageUrl(base44, r.cover_url);
        const streamLink = r.spotify_url || r.apple_music_url || r.audiomack_url || r.youtube_url || '';
        caption = `🎵 Nouvelle sortie : ${r.title} par ${r.artist_name}\n\n` +
          (r.description ? `${r.description}\n\n` : '') +
          (streamLink ? `🎧 Écouter : ${streamLink}\n\n` : '') +
          `#KKDmusic #NouveautéMusicale #${(r.artist_name || 'Music').replace(/\s+/g, '')}`;
      } else if (content_type === 'video') {
        const v = await getRecord(base44, 'Video', autoData, entity_id);
        if (!v) return Response.json({ error: 'Video not found' }, { status: 404 });
        cover_url = await getPublicImageUrl(base44, v.thumbnail_url);
        caption = `🎬 ${v.title}${v.artist_name ? ` par ${v.artist_name}` : ''}\n\n` +
          (v.description ? `${v.description}\n\n` : '') +
          (v.youtube_url ? `▶️ Voir : ${v.youtube_url}\n\n` : '') +
          `#KKDmusic ${v.artist_name ? `#${v.artist_name.replace(/\s+/g, '')}` : ''}`;
      } else if (content_type === 'news') {
        const n = await getRecord(base44, 'News', autoData, entity_id);
        if (!n) return Response.json({ error: 'News not found' }, { status: 404 });
        cover_url = await getPublicImageUrl(base44, n.image_url);
        caption = `📰 ${n.title}\n\n` +
          (n.excerpt || (n.content && n.content.slice(0, 200)) || '') +
          `\n\n#KKDmusic #Actualité #Music`;
      } else {
        return Response.json({ error: 'Unknown content_type' }, { status: 400 });
      }

      if (!cover_url) {
        return Response.json({ error: 'Aucune image disponible pour la publication Facebook.', skipped: true }, { status: 200 });
      }
    }

    const fullCaption = (caption || '') + (link ? `\n\n${link}` : '');
    const targetPages = page_id ? pages.filter((p) => p.id === page_id) : pages;

    // ── Publication d'un clip vidéo ──
    if (video_url) {
      const results = [];
      for (const page of targetPages) {
        try {
          const fd = new FormData();
          fd.append('file_url', video_url);
          fd.append('description', fullCaption);
          fd.append('access_token', page.access_token);
          const pres = await fetch(`https://graph.facebook.com/v25.0/${page.id}/videos`, { method: 'POST', body: fd });
          const pdata = await pres.json();
          if (pdata.id) results.push({ page: page.name, post_id: pdata.id, kind: 'video' });
          else results.push({ page: page.name, error: pdata.error?.message || 'Échec vidéo' });
        } catch (e) {
          results.push({ page: page.name, error: e.message });
        }
      }
      const ok = results.filter((r) => r.post_id).length;
      if (!ok) return Response.json({ error: 'Aucune publication vidéo réussie', details: results }, { status: 500 });
      return Response.json({ success: true, pages: results });
    }

    const imageUrl = await getPublicImageUrl(base44, cover_url);
    if (!imageUrl) {
      return Response.json({ error: 'Aucune image (pochette) disponible pour la publication.' }, { status: 400 });
    }

    const results = [];
    for (const page of targetPages) {
      try {
        // Publication photo sur la page
        const fd = new FormData();
        fd.append('url', imageUrl);
        fd.append('caption', fullCaption);
        fd.append('access_token', page.access_token);
        const pres = await fetch(`https://graph.facebook.com/v25.0/${page.id}/photos`, {
          method: 'POST',
          body: fd,
        });
        const pdata = await pres.json();
        if (pdata.id) results.push({ page: page.name, post_id: pdata.id });
        else results.push({ page: page.name, error: pdata.error?.message || 'Échec' });
      } catch (e) {
        results.push({ page: page.name, error: e.message });
      }
    }

    const ok = results.filter((r) => r.post_id).length;
    if (!ok) {
      return Response.json({ error: 'Aucune publication réussie', details: results }, { status: 500 });
    }
    return Response.json({ success: true, pages: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});