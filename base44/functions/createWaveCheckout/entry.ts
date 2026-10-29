import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ALLOWED_ORIGINS = new Set([
  'https://controle.kkdmusic.com',
  'https://kkdlabel.base44.app',
  'https://show-of-kkd.base44.app',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'Connexion requise' }, { status: 401 });

    const apiKey = Deno.env.get('WAVE_API_KEY');
    if (!apiKey) {
      return Response.json({
        code: 'WAVE_NOT_CONFIGURED',
        error: "Le paiement Wave automatique n'est pas encore configuré. Aucun paiement n'a été lancé.",
      }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const ticketId = String(body.ticket_id || '').trim();
    let origin = '';
    try {
      const parsed = new URL(String(body.origin || ''));
      if (parsed.protocol === 'https:' && ALLOWED_ORIGINS.has(parsed.origin)) origin = parsed.origin;
    } catch (_) {}
    if (!ticketId) return Response.json({ error: 'ticket_id requis' }, { status: 400 });
    if (!origin) return Response.json({ error: 'Origine de paiement non autorisée' }, { status: 400 });

    const found = await base44.asServiceRole.entities.Ticket.filter({ id: ticketId });
    const ticket = found[0];
    if (!ticket) return Response.json({ error: 'Commande introuvable' }, { status: 404 });
    if (ticket.buyer_email?.toLowerCase() !== user.email.toLowerCase() && user.role !== 'admin') {
      return Response.json({ error: 'Commande non autorisée' }, { status: 403 });
    }
    if (ticket.payment_method !== 'wave_api' || ticket.status !== 'en_attente') {
      return Response.json({ error: 'Cette commande ne peut pas être payée par Wave' }, { status: 400 });
    }
    const amount = Math.round(Number(ticket.amount));
    if (!Number.isFinite(amount) || amount <= 0) return Response.json({ error: 'Montant du billet invalide' }, { status: 400 });

    const success = new URL('/mes-billets', origin);
    success.searchParams.set('wave', '1');
    success.searchParams.set('ticket', ticket.id);
    const error = new URL('/evenements', origin);
    error.searchParams.set('wave_error', '1');
    error.searchParams.set('ticket', ticket.id);

    const response = await fetch('https://api.wave.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(amount),
        currency: 'XOF',
        client_reference: ticket.id,
        success_url: success.toString(),
        error_url: error.toString(),
      }),
    });
    const session = await response.json().catch(() => ({}));
    if (!response.ok || !session?.id || !session?.wave_launch_url) {
      console.error('Wave checkout creation failed', response.status, session?.error_code || session?.error || 'provider_error');
      return Response.json({ error: "Wave n'a pas pu créer la session de paiement. Réessayez dans quelques instants." }, { status: 502 });
    }

    await base44.asServiceRole.entities.Ticket.update(ticket.id, {
      wave_checkout_id: session.id,
      wave_transaction_id: '',
    });
    return Response.json({ url: session.wave_launch_url, checkout_id: session.id });
  } catch (error) {
    console.error('createWaveCheckout error:', error);
    return Response.json({ error: 'Impossible de préparer le paiement Wave' }, { status: 500 });
  }
});
