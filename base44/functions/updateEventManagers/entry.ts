import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isUserAuthorizedForEvent } from '../../shared/artistAccess.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { event_id, action, email: targetEmail } = await req.json();
    if (!event_id || !action || !targetEmail) {
      return Response.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
    const ev = events[0];
    if (!ev) return Response.json({ error: 'Événement introuvable' }, { status: 404 });

    const authorized = await isUserAuthorizedForEvent(base44, ev, user);
    if (!authorized) return Response.json({ error: 'Non autorisé' }, { status: 403 });

    let managers = Array.isArray(ev.managers) ? [...ev.managers] : [];
    if (action === 'add') {
      managers = Array.from(new Set([...managers, targetEmail.trim().toLowerCase()]));
    } else if (action === 'remove') {
      managers = managers.filter((m) => m !== targetEmail);
    } else {
      return Response.json({ error: 'Action invalide (add ou remove)' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Event.update(event_id, { managers });
    return Response.json({ managers });
  } catch (error) {
    console.error('updateEventManagers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});