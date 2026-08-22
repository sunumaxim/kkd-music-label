import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { ticket_number, security_hash } = await req.json();
    if (!ticket_number) return Response.json({ error: 'ticket_number requis' }, { status: 400 });

    const tickets = await base44.asServiceRole.entities.Ticket.filter({ ticket_number });
    const ticket = tickets[0];
    if (!ticket) return Response.json({ error: 'Billet introuvable' }, { status: 404 });
    if (ticket.status !== 'valide') return Response.json({ error: 'Billet non validé' }, { status: 400 });

    // Vérifier le hash de sécurité si fourni (anti-falsification QR)
    if (security_hash && ticket.security_hash && security_hash !== ticket.security_hash) {
      return Response.json({ error: 'Hash de sécurité invalide' }, { status: 403 });
    }

    const events = await base44.asServiceRole.entities.Event.filter({ id: ticket.event_id });
    const ev = events[0];

    // Optionally resolve organizer authority for check-in button (caller identity)
    let can_check_in = false;
    try {
      const user = await base44.auth.me();
      if (user) {
        if (user.role === 'admin') can_check_in = true;
        else if (ev && ev.organizer_email === user.email) can_check_in = true;
        else if (ev && Array.isArray(ev.managers) && ev.managers.includes(user.email)) can_check_in = true;
      }
    } catch (_) { /* anonymous viewer */ }

    return Response.json({
      ticket_number: ticket.ticket_number,
      security_hash: ticket.security_hash || null,
      event_title: ticket.event_title,
      event_date: ticket.event_date,
      event_image_url: ev?.image_url || null,
      event_type: ev?.event_type || null,
      artist_name: ev?.artist_name || ticket.artist_name || null,
      location: ev?.location || null,
      city: ev?.city || null,
      buyer_name: ticket.buyer_name,
      amount: ticket.amount,
      checked_in: !!ticket.checked_in,
      checked_in_date: ticket.checked_in_date || null,
      commission_pct: ticket.commission_pct || 10,
      can_check_in,
    });
  } catch (error) {
    console.error('getTicketByNumber error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});