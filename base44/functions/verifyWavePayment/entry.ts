import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { confirmTicketPayment } from '../../shared/confirmTicketPayment.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'Connexion requise' }, { status: 401 });

    const { ticket_id } = await req.json().catch(() => ({}));
    if (!ticket_id) return Response.json({ error: 'ticket_id requis' }, { status: 400 });

    const rows = await base44.asServiceRole.entities.Ticket.filter({ id: String(ticket_id) });
    const ticket = rows[0];
    if (!ticket) return Response.json({ error: 'Billet introuvable' }, { status: 404 });
    if (ticket.buyer_email?.toLowerCase() !== user.email.toLowerCase() && user.role !== 'admin') {
      return Response.json({ error: 'Billet non autorisé' }, { status: 403 });
    }
    if (ticket.status === 'valide') return Response.json({ status: 'valide', ticket_number: ticket.ticket_number });
    if (ticket.payment_method !== 'wave_api' || !ticket.wave_checkout_id) {
      return Response.json({ status: 'en_attente', message: 'Session Wave introuvable pour cette commande.' });
    }

    const apiKey = Deno.env.get('WAVE_API_KEY');
    if (!apiKey) return Response.json({ error: 'La vérification Wave est momentanément indisponible.' }, { status: 503 });

    const response = await fetch(`https://api.wave.com/v1/checkout/sessions/${encodeURIComponent(ticket.wave_checkout_id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const session = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Wave verification failed', response.status, session?.error_code || 'provider_error');
      return Response.json({ error: 'Wave ne permet pas encore de vérifier ce paiement. Réessayez.' }, { status: 502 });
    }

    const amountMatches = Math.round(Number(session.amount)) === Math.round(Number(ticket.amount));
    const paid = session.payment_status === 'succeeded' && session.checkout_status === 'complete';
    if (session.id !== ticket.wave_checkout_id ||
        session.client_reference !== ticket.id ||
        session.currency !== 'XOF' ||
        !amountMatches) {
      return Response.json({ error: 'Les informations de paiement ne correspondent pas à cette commande.' }, { status: 409 });
    }
    if (!paid) return Response.json({ status: 'en_attente' });

    const result = await confirmTicketPayment(base44, ticket, String(session.transaction_id || ''));
    return Response.json(result);
  } catch (error) {
    console.error('verifyWavePayment error:', error);
    return Response.json({ error: 'Impossible de vérifier le paiement Wave' }, { status: 500 });
  }
});
