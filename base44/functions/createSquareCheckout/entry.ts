import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SQUARE_API = 'https://connect.squareup.com';
const SQUARE_VERSION = '2024-12-18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ticket_id, origin } = await req.json();
    if (!ticket_id) return Response.json({ error: 'ticket_id requis' }, { status: 400 });

    // Origine de redirection (liste blanche)
    const ALLOWED_ORIGINS = [
      'https://music.sunumaxim.com',
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    let safeOrigin = '';
    if (origin) {
      try { const u = new URL(origin); if (ALLOWED_ORIGINS.includes(u.origin)) safeOrigin = u.origin; } catch (_) {}
    }
    if (!safeOrigin) return Response.json({ error: 'Origine non autorisée' }, { status: 400 });

    const tickets = await base44.asServiceRole.entities.Ticket.filter({ id: ticket_id });
    const ticket = tickets[0];
    if (!ticket) return Response.json({ error: 'Billet introuvable' }, { status: 404 });
    if (ticket.buyer_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Billet non autorisé' }, { status: 403 });
    }
    if (ticket.status === 'valide') return Response.json({ error: 'Billet déjà validé' }, { status: 400 });

    const events = await base44.asServiceRole.entities.Event.filter({ id: ticket.event_id });
    const event = events[0];
    if (!event) return Response.json({ error: 'Événement introuvable' }, { status: 404 });
    if (!event.is_ticketed || !(Number(event.ticket_price) > 0)) {
      return Response.json({ error: "Cet événement n'est pas payant" }, { status: 400 });
    }

    const capacityFull = Number(event.ticket_capacity) > 0 && (Number(event.tickets_sold) || 0) >= Number(event.ticket_capacity);
    if (capacityFull) return Response.json({ error: 'Événement complet' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('square');
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Square-Version': SQUARE_VERSION,
      'Content-Type': 'application/json',
    };

    // Récupérer un location_id marchand
    const locRes = await fetch(`${SQUARE_API}/v2/locations`, { headers });
    const locData = await locRes.json();
    const location = (locData.locations || []).find((l) => l.status === 'ACTIVE');
    if (!location) return Response.json({ error: 'Aucune localisation Square active trouvée' }, { status: 400 });

    const amount = Math.round(Number(event.ticket_price));
    const itemTitle = `Billet — ${event.title || 'Événement'}`.slice(0, 200);
    const idempotencyKey = `kkd-ticket-${ticket_id}`;

    const body = {
      idempotency_key: idempotencyKey,
      order: {
        location_id: location.id,
        reference_id: `ticket_${ticket_id}`,
        line_items: [
          {
            name: itemTitle,
            quantity: '1',
            base_price_money: { amount, currency: 'XOF' },
          },
        ],
      },
      checkout_options: {
        redirect_url: `${safeOrigin}/mes-billets?square=1&ticket=${ticket_id}`,
        ask_shipping_address: false,
        enable_coupon: false,
      },
      pre_populated_data: {
        buyer_email: ticket.buyer_email || '',
        buyer_name: ticket.buyer_name || '',
      },
      payment_note: `Billet KKD Music — ${event.title || ''}`.slice(0, 500),
    };

    const plRes = await fetch(`${SQUARE_API}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const plData = await plRes.json();
    if (!plRes.ok) {
      console.error('Square payment-link error:', plData);
      return Response.json({ error: plData?.errors?.[0]?.detail || 'Erreur Square' }, { status: 502 });
    }

    const paymentLink = plData.payment_link || {};
    const checkoutUrl = paymentLink.checkout_url || paymentLink.long_url;
    if (!checkoutUrl) return Response.json({ error: 'URL de paiement Square introuvable' }, { status: 502 });

    // Mémoriser le payment link id pour la vérification post-paiement
    await base44.asServiceRole.entities.Ticket.update(ticket_id, {
      square_order_ref: paymentLink.id || '',
      payment_method: 'square',
    });

    return Response.json({ url: checkoutUrl, payment_link_id: paymentLink.id });
  } catch (error) {
    console.error('createSquareCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});