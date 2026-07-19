import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, action, video_url } = await req.json();
    if (!token || !action) return Response.json({ error: 'token et action requis' }, { status: 400 });

    const invites = await base44.asServiceRole.entities.CorrespondentInvite.filter({ token });
    const invite = invites[0];
    if (!invite) return Response.json({ error: 'Invitation invalide' }, { status: 404 });

    // Load — renvoyer l'invitation + l'événement lié
    if (action === 'load') {
      let event = null;
      if (invite.event_id) {
        const ev = await base44.asServiceRole.entities.Event.filter({ id: invite.event_id });
        event = ev[0] || null;
      }
      return Response.json({ invite, event });
    }

    // Accept — marquer l'invitation acceptée
    if (action === 'accept') {
      await base44.asServiceRole.entities.CorrespondentInvite.update(invite.id, {
        status: 'accepte',
        accepted_date: new Date().toISOString(),
      });
      return Response.json({ success: true });
    }

    // Capture — attacher la vidéo filmée au direct et passer en direct
    if (action === 'capture') {
      if (!video_url) return Response.json({ error: 'video_url requis' }, { status: 400 });
      const broadcast = await base44.asServiceRole.entities.Broadcast.get(invite.broadcast_id);
      if (!broadcast) return Response.json({ error: 'Direct introuvable' }, { status: 404 });

      const now = new Date().toISOString();
      await base44.asServiceRole.entities.Broadcast.update(broadcast.id, {
        source_type: 'camera',
        source_video_url: video_url,
        status: 'en_direct',
        started_date: broadcast.started_date || now,
      });

      await base44.asServiceRole.entities.CorrespondentInvite.update(invite.id, {
        status: 'filme',
        capture_url: video_url,
      });

      // Synchroniser le stream sur la page événement si un lien YouTube existe
      if (broadcast.linked_event_id && broadcast.stream_url) {
        await base44.asServiceRole.entities.Event.update(broadcast.linked_event_id, { stream_url: broadcast.stream_url });
      }

      return Response.json({ success: true, broadcast_id: broadcast.id });
    }

    return Response.json({ error: 'action inconnue' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});