import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ticket_id, ticket_number, action = 'entry' } = await req.json();

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

    // Autorisation : admin, organisateur ou contrôleur
    const events = await base44.asServiceRole.entities.Event.filter({ id: ticket.event_id });
    const ev = events[0];
    const isAdmin = user.role === 'admin';
    const isOrg = !!ev && ev.organizer_email === user.email;
    const isMgr = !!ev && Array.isArray(ev.managers) && ev.managers.includes(user.email);
    if (!isAdmin && !isOrg && !isMgr) return Response.json({ error: 'Non autorisé' }, { status: 403 });

    const now = new Date().toISOString();
    const log = Array.isArray(ticket.access_log) ? ticket.access_log : [];

    if (action === 'exit') {
      // ── Sortie ──
      if (!ticket.checked_in) {
        return Response.json({ error: 'Personne non présente', ticket, not_present: true }, { status: 400 });
      }
      const exitCount = (ticket.exit_count || 0) + 1;
      const updated = {
        checked_in: false,
        checked_out: true,
        checked_out_date: now,
        checked_out_by: user.email,
        exit_count: exitCount,
        access_log: [...log, { action: 'exit', timestamp: now, by: user.email }],
      };
      await base44.asServiceRole.entities.Ticket.update(ticket.id, updated);
      return Response.json({ ticket: { ...ticket, ...updated }, action: 'exit' });
    }

    // ── Entrée (par défaut) ──
    if (ticket.checked_in) {
      return Response.json({ ticket, already: true });
    }
    const entryCount = (ticket.entry_count || 0) + 1;
    const isReEntry = entryCount > 1;
    const updated = {
      checked_in: true,
      checked_in_date: now,
      checked_in_by: user.email,
      checked_out: false,
      entry_count: entryCount,
      access_log: [...log, { action: 'entry', timestamp: now, by: user.email }],
    };
    await base44.asServiceRole.entities.Ticket.update(ticket.id, updated);
    return Response.json({ ticket: { ...ticket, ...updated }, already: false, re_entry: isReEntry });
  } catch (error) {
    console.error('checkInTicket error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});