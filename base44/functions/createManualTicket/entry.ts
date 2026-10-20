import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isUserAuthorizedForEvent } from '../../shared/artistAccess.ts';

const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateTicketNumber() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const randBytes = new Uint8Array(6);
  crypto.getRandomValues(randBytes);
  let rand = '';
  for (let i = 0; i < 6; i++) rand += SAFE_CHARS[randBytes[i] % SAFE_CHARS.length];
  return `KKD-${y}${m}${d}-${rand}-SM`;
}

function genSecurityHash() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { event_id, buyer_name, buyer_email, buyer_phone, buyer_location, quantity, ticket_category } = await req.json();

    // Champs obligatoires : nom, téléphone, lieu (email optionnel)
    if (!event_id) return Response.json({ error: 'event_id requis' }, { status: 400 });
    if (!buyer_name || !buyer_name.trim()) return Response.json({ error: 'Le nom est obligatoire' }, { status: 400 });
    if (!buyer_phone || !buyer_phone.trim()) return Response.json({ error: 'Le téléphone est obligatoire' }, { status: 400 });
    if (!buyer_location || !buyer_location.trim()) return Response.json({ error: 'Le lieu (ville/village) est obligatoire' }, { status: 400 });

    const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
    const ev = events[0];
    if (!ev) return Response.json({ error: 'Événement introuvable' }, { status: 404 });

    const authorized = await isUserAuthorizedForEvent(base44, ev, user);
    if (!authorized) return Response.json({ error: 'Non autorisé' }, { status: 403 });

    const qty = Math.max(1, Math.min(50, Math.floor(Number(quantity) || 1)));
    const basePrice = Math.max(0, Number(ev.ticket_price) || 0);
    const categoryName = String(ticket_category || 'Pass Standard');
    const configuredCategories = Array.isArray(ev.ticket_categories) ? ev.ticket_categories : [];
    const configuredCategory = configuredCategories.find((category: any) => category && (category.name === categoryName || category.id === categoryName));
    const categoryMultiplier = categoryName.toLowerCase().includes('vvip') ? 4
      : categoryName.toLowerCase().includes('carré') || categoryName.toLowerCase().includes('carre') ? 3
      : categoryName.toLowerCase().includes('vip') ? 2.5
      : categoryName.toLowerCase().includes('festival') ? 3.5
      : categoryName.toLowerCase().includes('early') || categoryName.toLowerCase().includes('prévente') ? 0.8
      : 1;
    const configuredPrice = Number(configuredCategory?.price);
    const ticketAmount = Number.isFinite(configuredPrice) && configuredPrice >= 0 ? configuredPrice : Math.round(basePrice * categoryMultiplier);
    const now = new Date().toISOString();

    const tickets = [];
    for (let i = 0; i < qty; i++) {
      const ticket_number = generateTicketNumber();
      const ticket = await base44.asServiceRole.entities.Ticket.create({
        event_id,
        event_title: ev.title,
        event_date: ev.event_date,
        event_image_url: ev.image_url,
        ticket_theme: ev.ticket_theme || 'classic',
        ticket_category: categoryName,
        artist_name: ev.artist_name,
        organizer_email: ev.organizer_email,
        managers: ev.managers || [],
        buyer_email: buyer_email ? buyer_email.trim().toLowerCase() : '',
        buyer_name: buyer_name.trim(),
        buyer_phone: buyer_phone.trim(),
        buyer_location: buyer_location.trim(),
        ticket_number,
        security_hash: genSecurityHash(),
        amount: ticketAmount,
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
      tickets.push(ticket);
    }

    return Response.json({ tickets, ticket: tickets[0] });
  } catch (error) {
    console.error('createManualTicket error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});