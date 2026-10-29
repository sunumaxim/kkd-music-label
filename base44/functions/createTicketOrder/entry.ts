import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Création SÉCURISÉE d'une commande de billet en ligne.
 * Le client ne crée plus jamais un Ticket lui-même : prix, statut, capacité,
 * fenêtre de vente et anti-doublon sont décidés ICI, côté serveur.
 * Le billet est créé "en_attente" ; il ne devient "valide" qu'après
 * confirmation du paiement (Square vérifié serveur) ou validation admin (Wave).
 */
const MAX_PENDING_PER_USER = 3;
const MAX_TICKETS_PER_USER = 10;

function clean(v: unknown, max: number) {
  return String(v ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'Connexion requise' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const event_id = clean(body.event_id, 64);
    const payment_method = body.payment_method === 'square' ? 'square' : body.payment_method === 'wave_api' ? 'wave_api' : body.payment_method === 'wave' ? 'wave' : '';
    const buyer_name = clean(body.buyer_name, 80);
    const buyer_phone = clean(body.buyer_phone, 30);
    const buyer_location = clean(body.buyer_location, 80);
    const wave_reference = clean(body.wave_reference, 64);
    let proof_file_url = clean(body.proof_file_url, 500);

    if (!event_id) return Response.json({ error: 'event_id requis' }, { status: 400 });
    if (!payment_method) return Response.json({ error: 'Moyen de paiement invalide' }, { status: 400 });
    if (buyer_name.length < 2) return Response.json({ error: 'Nom du titulaire requis' }, { status: 400 });
    if (proof_file_url && !/^https:\/\//i.test(proof_file_url)) proof_file_url = '';
    if (payment_method === 'wave') {
      if (wave_reference.length < 4 || !/^[A-Za-z0-9_\-. ]+$/.test(wave_reference)) {
        return Response.json({ error: 'Référence de transaction Wave invalide' }, { status: 400 });
      }
    }

    const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
    const ev = events[0];
    if (!ev || ev.published_status !== 'approuve') return Response.json({ error: 'Événement introuvable' }, { status: 404 });
    if (!ev.is_ticketed) return Response.json({ error: "La billetterie en ligne n'est pas ouverte pour cet événement" }, { status: 400 });

    // Fenêtre de vente
    const closeAt = ev.online_sales_end || ev.event_date;
    if (closeAt && new Date(closeAt).getTime() <= Date.now()) {
      return Response.json({ error: 'La vente en ligne est terminée' }, { status: 400 });
    }

    // Prix décidé par le serveur
    const cats = Array.isArray(ev.ticket_categories) ? ev.ticket_categories : [];
    const onlineCat = cats.find((c: any) => c && c.channel === 'online');
    const price = Math.round(Number(onlineCat?.price ?? ev.ticket_price));
    if (!Number.isFinite(price) || price <= 0) return Response.json({ error: 'Prix du billet non configuré' }, { status: 400 });

    // Capacité (billets validés + commandes Square/Wave en cours récentes)
    const cap = Number(ev.ticket_capacity) || 0;
    if (cap > 0 && (Number(ev.tickets_sold) || 0) >= cap) {
      return Response.json({ error: 'Événement complet' }, { status: 400 });
    }

    const email = String(user.email).trim().toLowerCase();
    const mine = await base44.asServiceRole.entities.Ticket.filter({ event_id, buyer_email: email });
    const active = mine.filter((t: any) => t.status === 'valide' || t.status === 'en_attente');
    const pending = mine.filter((t: any) => t.status === 'en_attente');
    if (active.length >= MAX_TICKETS_PER_USER) {
      return Response.json({ error: 'Limite de billets atteinte pour ce compte' }, { status: 429 });
    }

    // Square : réutiliser la commande en attente au lieu d'en créer une nouvelle à chaque clic
    if (payment_method === 'square' || payment_method === 'wave_api') {
      const reuse = pending.find((t: any) => t.payment_method === payment_method && !t.wave_reference);
      if (reuse) return Response.json({ ticket: { id: reuse.id, status: reuse.status, amount: reuse.amount }, reused: true });
    }
    if (pending.length >= MAX_PENDING_PER_USER) {
      return Response.json({ error: 'Vous avez déjà des paiements en attente de validation pour cet événement' }, { status: 429 });
    }

    // Wave : une référence de transaction ne peut servir qu'une seule fois
    if (payment_method === 'wave') {
      const dup = await base44.asServiceRole.entities.Ticket.filter({ wave_reference });
      if (dup.some((t: any) => t.status !== 'refuse' && t.status !== 'annule')) {
        return Response.json({ error: 'Cette référence de transaction a déjà été utilisée' }, { status: 409 });
      }
    }

    const ticket = await base44.asServiceRole.entities.Ticket.create({
      event_id,
      event_title: ev.title,
      event_date: ev.event_date,
      event_image_url: ev.image_url || '',
      ticket_theme: ev.ticket_theme || 'classic',
      ticket_category: onlineCat?.name || '',
      artist_name: ev.artist_name || '',
      organizer_email: ev.organizer_email || '',
      managers: ev.managers || [],
      buyer_email: email,
      buyer_name,
      buyer_phone,
      buyer_location,
      amount: price,
      commission_pct: Number(ev.commission_pct) || 10,
      payment_method,
      wave_reference: payment_method === 'wave' ? wave_reference : '',
      proof_file_url: payment_method === 'wave' ? proof_file_url : '',
      status: 'en_attente',
    });

    return Response.json({ ticket: { id: ticket.id, status: ticket.status, amount: ticket.amount } });
  } catch (error) {
    console.error('createTicketOrder error:', error);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});
