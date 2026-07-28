import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SQUARE_API = 'https://connect.squareup.com';
const SQUARE_VERSION = '2024-12-18';

function genTicketNumber(eventDate) {
  const ed = eventDate ? new Date(eventDate) : new Date();
  const p = (n, l = 2) => String(n).padStart(l, '0');
  const edPart = `${p(ed.getFullYear() % 100)}${p(ed.getMonth() + 1)}${p(ed.getDate())}`;
  const now = new Date();
  const tPart = `${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KKD-${edPart}-${tPart}${rand}-SM`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { ticket_id, order_id } = body;
    if (!ticket_id) return Response.json({ error: 'ticket_id requis' }, { status: 400 });

    const tickets = await base44.asServiceRole.entities.Ticket.filter({ id: ticket_id });
    const ticket = tickets[0];
    if (!ticket) return Response.json({ error: 'Billet introuvable' }, { status: 404 });
    if (ticket.buyer_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Billet non autorisé' }, { status: 403 });
    }
    if (ticket.status === 'valide') {
      return Response.json({ status: 'valide', ticket_number: ticket.ticket_number });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('square');
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Square-Version': SQUARE_VERSION,
    };

    let confirmed = false;

    // 1) Vérification directe par order_id si fourni (Square le renvoie parfois dans l'URL de retour)
    if (order_id) {
      try {
        const r = await fetch(`${SQUARE_API}/v2/orders/${order_id}`, { headers });
        const d = await r.json();
        if (d?.order?.state === 'COMPLETED') confirmed = true;
      } catch (_) {}
    }

    // 2) Recherche d'un paiement Square lié au payment link stocké
    if (!confirmed && ticket.square_order_ref) {
      const since = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      const locRes = await fetch(`${SQUARE_API}/v2/locations`, { headers });
      const locData = await locRes.json();
      const locations = locData.locations || [];
      for (const loc of locations) {
        const pr = await fetch(
          `${SQUARE_API}/v2/payments?location_id=${loc.id}&begin_time=${encodeURIComponent(since)}&sort_order=DESC`,
          { headers }
        );
        const pd = await pr.json();
        const match = (pd.payments || []).find(
          (p) => p.link_id === ticket.square_order_ref && p.status === 'COMPLETED'
        );
        if (match) { confirmed = true; break; }
      }
    }

    if (!confirmed) {
      return Response.json({ status: 'en_attente' });
    }

    // Paiement confirmé → valider le billet
    let number = genTicketNumber(ticket.event_date);
    for (let i = 0; i < 6; i++) {
      const dup = await base44.asServiceRole.entities.Ticket.filter({ ticket_number: number });
      if (!dup.length) break;
      number = genTicketNumber(ticket.event_date);
    }

    await base44.asServiceRole.entities.Ticket.update(ticket_id, {
      status: 'valide',
      ticket_number: number,
      validated_date: new Date().toISOString(),
    });

    const events = await base44.asServiceRole.entities.Event.filter({ id: ticket.event_id });
    if (events[0]) {
      await base44.asServiceRole.entities.Event.update(ticket.event_id, {
        tickets_sold: (Number(events[0].tickets_sold) || 0) + 1,
      });
    }

    if (ticket.buyer_email) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: ticket.buyer_email,
        title: '✅ Billet validé !',
        message: `Votre billet pour "${ticket.event_title || "l'événement"}" est confirmé. Téléchargez-le depuis la rubrique « Mes billets ».`,
        type: 'success',
        link: '/mes-billets',
        is_read: false,
      }).catch(() => {});
    }

    return Response.json({ status: 'valide', ticket_number: number });
  } catch (error) {
    console.error('verifySquarePayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});