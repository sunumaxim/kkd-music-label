import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Incrémente le compteur d'écoutes (plays_count) d'une sortie ou d'une vidéo.
 * Endpoint public (compteur d'analyse) — exécuté en service role.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try {
      body = await req.json();
    } catch {}

    const { item_type, item_id } = body;
    if (!item_id || !['release', 'video'].includes(item_type)) {
      return Response.json({ error: 'invalid params' }, { status: 400 });
    }

    const entity =
      item_type === 'release'
        ? base44.asServiceRole.entities.Release
        : base44.asServiceRole.entities.Video;

    const found = await entity.filter({ id: item_id });
    if (!found[0]) {
      return Response.json({ error: 'not found' }, { status: 404 });
    }

    const newCount = (found[0].plays_count || 0) + 1;
    await entity.update(item_id, { plays_count: newCount });

    return Response.json({ ok: true, plays_count: newCount });
  } catch (error) {
    console.error('incrementPlay error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});