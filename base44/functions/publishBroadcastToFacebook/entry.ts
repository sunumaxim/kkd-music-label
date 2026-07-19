import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { broadcast_id } = await req.json();
    if (!broadcast_id) return Response.json({ error: 'broadcast_id requis' }, { status: 400 });

    const results = await base44.asServiceRole.entities.Broadcast.filter({ id: broadcast_id });
    const b = results[0];
    if (!b) return Response.json({ error: 'Direct introuvable' }, { status: 404 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');

    // List managed Pages and pick the first
    const pagesRes = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();
    const page = pagesData.data && pagesData.data[0];
    if (!page) {
      return Response.json({ error: 'Aucune Page Facebook gérée par ce compte.' }, { status: 400 });
    }

    const caption = `🔴 ${b.title}\n\n${b.description || ''}\n\n${b.stream_url ? `▶️ Regarder : ${b.stream_url}` : ''}\n\n#KKDmusic #live #concert`.trim();

    // Video upload if a source video is available
    if (b.source_video_url) {
      const videoRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: b.source_video_url,
          description: caption,
          access_token: page.access_token,
        }),
      });
      const videoData = await videoRes.json();
      if (videoData.id) return Response.json({ success: true, post_id: videoData.id, kind: 'video' });
      // fall back to a feed post on video error
    }

    // Feed link post
    const feedRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: caption,
        link: b.stream_url || '',
        access_token: page.access_token,
      }),
    });
    const feedData = await feedRes.json();
    if (feedData.id) return Response.json({ success: true, post_id: feedData.id, kind: 'post' });
    return Response.json({ error: feedData.error?.message || 'Échec de la publication Facebook.', details: feedData }, { status: 500 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});