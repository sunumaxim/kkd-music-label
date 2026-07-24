import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ticket_id, ticket_number } = await req.json();

    let ticket;
    if (ticket_id) {
      const t = await base44.asServiceRole.entities.Ticket.filter({ id: ticket_id });
      ticket = t[0];
    } else if (ticket_number) {
      const t = await base44.asServiceRole.entities.Ticket.filter({ ticket_number });
      ticket = t[0];
    }
    if (!ticket) return Response.json({ error: 'Ticket introuvable' }, { status: 404 });
    if (ticket.status !== 'valide') return Response.json({ error: 'Ticket non validé' }, { status: 400 });

    const events = await base44.asServiceRole.entities.Event.filter({ id: ticket.event_id });
    const ev = events[0];
    const isAdmin = user.role === 'admin';
    const isOrg = !!ev && ev.organizer_email === user.email;
    const isMgr = !!ev && Array.isArray(ev.managers) && ev.managers.includes(user.email);
    if (!isAdmin && !isOrg && !isMgr) return Response.json({ error: 'Non autorisé' }, { status: 403 });

    if (ticket.checked_in) {
      return Response.json({ ticket, already: true });
    }

    await base44.asServiceRole.entities.Ticket.update(ticket.id, {
      checked_in: true,
      checked_in_date: new Date().toISOString(),
      checked_in_by: user.email,
    });

    return Response.json({
      ticket: { ...ticket, checked_in: true, checked_in_date: new Date().toISOString(), checked_in_by: user.email },
      already: false,
    });
  } catch (error) {
    console.error('checkInTicket error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});