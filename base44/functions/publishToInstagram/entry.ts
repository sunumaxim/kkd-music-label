import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Instagram exige des URLs d'images publiquement accessibles.
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Réservé admin' }, { status: 403 });
    const body = await req.json();
    let { content_type, entity_id, video_url, caption: bodyCaption } = body;

    // Payload d'automatisation entité : { event: { entity_name, entity_id }, data, old_data }
    let autoData = null;
    if (!content_type && body.event?.entity_name) {
      const map = { Video: 'video', News: 'news', Release: 'release', Event: 'event', Broadcast: 'broadcast' };
      content_type = map[body.event.entity_name];
      entity_id = entity_id || body.event.entity_id;
      autoData = body.data;
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');

    // IMPORTANT : l'API Instagram utilise graph.instagram.com (PAS graph.facebook.com).
    // Le token Instagram ne fonctionne qu'avec les endpoints Instagram.
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
    );
    const meData = await meRes.json();
    const igUserId = meData.id;
    if (!igUserId) {
      return Response.json({
        error: `Compte Instagram Business introuvable : ${meData.error?.message || JSON.stringify(meData)}. Vérifiez que le compte est Business/Creator et lié à une Page.`,
      }, { status: 500 });
    }

    // ── Publication d'un clip vidéo (Reel) ──
    if (video_url) {
      const reelCaption = bodyCaption || '';
      const createRes = await fetch(`https://graph.instagram.com/v19.0/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_type: 'REELS', video_url, caption: reelCaption, access_token: accessToken }),
      });
      const created = await createRes.json();
      if (!created.id) {
        return Response.json({ error: `Conteneur Reel Instagram échoué : ${created.error?.message || JSON.stringify(created)}` }, { status: 500 });
      }
      // Attend la fin du traitement côté Instagram
      let status = 'IN_PROGRESS';
      for (let i = 0; i < 24; i++) {
        await new Promise((r) => setTimeout(r, 2500));
        const sres = await fetch(`https://graph.instagram.com/v19.0/${created.id}?fields=status_code&access_token=${accessToken}`);
        const sd = await sres.json();
        status = sd.status_code;
        if (status === 'FINISHED') break;
        if (status === 'ERROR') return Response.json({ error: 'Traitement vidéo Instagram échoué.' }, { status: 500 });
      }
      if (status !== 'FINISHED') return Response.json({ error: 'Délai dépassé : traitement vidéo Instagram.' }, { status: 500 });
      const publishRes = await fetch(`https://graph.instagram.com/v19.0/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: created.id, access_token: accessToken }),
      });
      const published = await publishRes.json();
      if (!published.id) return Response.json({ error: `Publication Reel échouée : ${published.error?.message || JSON.stringify(published)}` }, { status: 500 });
      return Response.json({ success: true, post_id: published.id, kind: 'reel' });
    }

    let imageUrl, caption;

    if (content_type === 'broadcast') {
      const b = await getRecord(base44, 'Broadcast', autoData, entity_id);
      if (!b) return Response.json({ error: 'Direct introuvable' }, { status: 404 });
      imageUrl = await getPublicImageUrl(base44, b.background_image_url);
      if (!imageUrl && b.linked_event_id) {
        const evs = await base44.asServiceRole.entities.Event.filter({ id: b.linked_event_id });
        if (evs[0]) imageUrl = await getPublicImageUrl(base44, evs[0].image_url);
      }
      caption = `🔴 ${b.title}\n\n${b.description || ''}\n\n${b.stream_url ? `▶️ Regarder le direct : ${b.stream_url}\n\n` : ''}#KKDmusic #live #concert`;
    } else if (content_type === 'release') {
      const r = await getRecord(base44, 'Release', autoData, entity_id);
      if (!r) return Response.json({ error: 'Release not found' }, { status: 404 });
      imageUrl = await getPublicImageUrl(base44, r.cover_url);
      const streamLink = r.spotify_url || r.apple_music_url || r.audiomack_url || r.youtube_url || '';
      caption = `🎵 Nouvelle sortie : ${r.title} par ${r.artist_name}\n\n` +
        (r.description ? `${r.description}\n\n` : '') +
        (streamLink ? `🎧 Écouter : ${streamLink}\n\n` : '') +
        `#KKDmusic #NouveautéMusicale #${(r.artist_name || 'Music').replace(/\s+/g, '')} #${r.release_type || 'Music'}`;
    } else if (content_type === 'event') {
      const e = await getRecord(base44, 'Event', autoData, entity_id);
      if (!e) return Response.json({ error: 'Event not found' }, { status: 404 });
      imageUrl = await getPublicImageUrl(base44, e.image_url);
      const dateStr = e.event_date ? new Date(e.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      caption = `📅 ${e.title}\n\n` +
        (dateStr ? `🗓️ ${dateStr}\n` : '') +
        (e.location ? `📍 ${e.location}${e.city ? `, ${e.city}` : ''}\n` : '') +
        (e.description ? `\n${e.description}\n` : '') +
        (e.ticket_url ? `\n🎟️ Billets : ${e.ticket_url}\n` : '') +
        `\n#KKDmusic #Concert #${(e.city || 'Événement').replace(/\s+/g, '')}`;
    } else if (content_type === 'news') {
      const n = await getRecord(base44, 'News', autoData, entity_id);
      if (!n) return Response.json({ error: 'News not found' }, { status: 404 });
      imageUrl = await getPublicImageUrl(base44, n.image_url);
      caption = `📰 ${n.title}\n\n` +
        (n.excerpt || (n.content && n.content.slice(0, 200)) || '') +
        `\n\n#KKDmusic #Actualité #Music`;
    } else if (content_type === 'video') {
      const v = await getRecord(base44, 'Video', autoData, entity_id);
      if (!v) return Response.json({ error: 'Video not found' }, { status: 404 });
      imageUrl = await getPublicImageUrl(base44, v.thumbnail_url);
      if (!imageUrl && v.youtube_url) {
        const match = v.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?\s]+)/);
        if (match) imageUrl = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
      }
      caption = `🎬 ${v.title}${v.artist_name ? ` par ${v.artist_name}` : ''}\n\n` +
        (v.description ? `${v.description}\n\n` : '') +
        (v.youtube_url ? `▶️ Voir : ${v.youtube_url}\n\n` : '') +
        `#KKDmusic ${v.artist_name ? `#${v.artist_name.replace(/\s+/g, '')}` : ''}`;
    } else {
      return Response.json({ error: 'Unknown content_type' }, { status: 400 });
    }

    if (!imageUrl) {
      return Response.json({
        error: 'Aucune image disponible. Ajoutez une image (fond du direct, événement ou pochette) pour publier sur Instagram.',
        skipped: true,
      }, { status: 200 });
    }

    // Étape 1 : créer le conteneur média
    const createRes = await fetch(`https://graph.instagram.com/v19.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
    });
    const created = await createRes.json();
    if (!created.id) {
      return Response.json({
        error: `Création du post Instagram échouée : ${created.error?.message || JSON.stringify(created)}`,
        details: created,
      }, { status: 500 });
    }

    // Étape 2 : publier
    const publishRes = await fetch(`https://graph.instagram.com/v19.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: created.id, access_token: accessToken }),
    });
    const published = await publishRes.json();
    if (!published.id) {
      return Response.json({
        error: `Publication Instagram échouée : ${published.error?.message || JSON.stringify(published)}`,
        details: published,
      }, { status: 500 });
    }

    return Response.json({ success: true, post_id: published.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});