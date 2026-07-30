import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isUserAuthorizedForEvent } from '../../shared/artistAccess.ts';

function generateTicketNumber() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const h = String(now.getUTCHours()).padStart(2, '0');
  const min = String(now.getUTCMinutes()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KKD-${y}${m}${d}${h}${min}-${rand}-SM`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { event_id, buyer_name, buyer_email, buyer_phone, amount } = await req.json();
    if (!event_id || !buyer_email) {
      return Response.json({ error: 'event_id et buyer_email requis' }, { status: 400 });
    }

    const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
    const ev = events[0];
    if (!ev) return Response.json({ error: 'Événement introuvable' }, { status: 404 });

    const authorized = await isUserAuthorizedForEvent(base44, ev, user);
    if (!authorized) return Response.json({ error: 'Non autorisé' }, { status: 403 });

    const ticket_number = generateTicketNumber();
    const now = new Date().toISOString();

    const ticket = await base44.asServiceRole.entities.Ticket.create({
      event_id,
      event_title: ev.title,
      event_date: ev.event_date,
      event_image_url: ev.image_url,
      artist_name: ev.artist_name,
      organizer_email: ev.organizer_email,
      managers: ev.managers || [],
      buyer_email: buyer_email.trim().toLowerCase(),
      buyer_name: buyer_name || '',
      buyer_phone: buyer_phone || '',
      ticket_number,
      amount: Number(amount) || ev.ticket_price || 0,
      commission_pct: ev.commission_pct || 10,
      payment_method: 'wave',
      status: 'valide',
      validated_date: now,
      checked_in: false,
      checked_out: false,
      entry_count: 0,
      exit_count: 0,
      access_log: [],
    });

    return Response.json({ ticket });
  } catch (error) {
    console.error('createManualTicket error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});