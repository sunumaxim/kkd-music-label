import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user_email } = body;

    // Authentification obligatoire : on ne fait jamais confiance à l'email fourni par le client.
    let authEmail;
    try {
      const me = await base44.auth.me();
      authEmail = me.email;
    } catch (_) {
      return Response.json({ error: 'Authentification requise' }, { status: 401 });
    }
    if (!authEmail) return Response.json({ error: 'Authentification requise' }, { status: 401 });
    if (user_email && user_email !== authEmail) {
      return Response.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const purchases = await base44.asServiceRole.entities.Purchase.filter({
      user_email: authEmail, status: 'paid'
    });

    const result = [];
    for (const p of purchases) {
      const entityApi = p.item_type === 'release'
        ? base44.asServiceRole.entities.Release
        : base44.asServiceRole.entities.Video;
      const items = await entityApi.filter({ id: p.item_id });
      const item = items[0];

      let protected_url = null;
      if (item?.protected_file_uri) {
        const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
          file_uri: item.protected_file_uri,
          expires_in: 86400
        });
        protected_url = signed.signed_url;
      }

      result.push({
        item_type: p.item_type,
        item_id: p.item_id,
        item_title: p.item_title,
        artist_name: p.artist_name,
        cover_url: item?.cover_url || item?.thumbnail_url || null,
        is_video: p.item_type === 'video',
        protected_url,
        amount: p.amount,
        currency: p.currency,
        created_date: p.created_date
      });
    }

    return Response.json({ purchases: result });
  } catch (error) {
    console.error('getMyPurchases error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});