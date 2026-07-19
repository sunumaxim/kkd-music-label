import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { phone_token, video_url } = await req.json();
    if (!phone_token || !video_url) {
      return Response.json({ error: 'phone_token et video_url requis' }, { status: 400 });
    }

    const results = await base44.asServiceRole.entities.Broadcast.filter({ phone_token });
    const b = results[0];
    if (!b) return Response.json({ error: 'Lien téléphone invalide' }, { status: 404 });

    const allowed = user.role === 'admin' || (b.granted_emails || []).includes(user.email);
    if (!allowed) {
      return Response.json({ error: 'Non autorisé à piloter ce direct' }, { status: 403 });
    }

    await base44.asServiceRole.entities.Broadcast.update(b.id, {
      source_type: 'file_upload',
      source_video_url: video_url,
    });

    return Response.json({ success: true, broadcast_id: b.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});