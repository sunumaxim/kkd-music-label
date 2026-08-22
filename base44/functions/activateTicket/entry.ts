import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Active un billet généré en lot (vente physique) en y ajoutant les infos acheteur.
 * Le billet passe de status "en_attente" → "valide".
 * Aucune authentification requise : la sécurité repose sur le security_hash du QR code
 * (prouve que le scanneur détient physiquement le billet imprimé).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { ticket_number, security_hash, buyer_name, buyer_phone, buyer_location, buyer_email } = await req.json();

    if (!ticket_number) return Response.json({ error: 'ticket_number requis' }, { status: 400 });
    if (!security_hash) return Response.json({ error: 'Hash de sécurité requis' }, { status: 400 });
    if (!buyer_name || !buyer_name.trim()) return Response.json({ error: 'Le nom est obligatoire' }, { status: 400 });
    if (!buyer_phone || !buyer_phone.trim()) return Response.json({ error: 'Le téléphone est obligatoire' }, { status: 400 });
    if (!buyer_location || !buyer_location.trim()) return Response.json({ error: 'Le lieu (ville/village) est obligatoire' }, { status: 400 });

    const tickets = await base44.asServiceRole.entities.Ticket.filter({ ticket_number });
    const ticket = tickets[0];
    if (!ticket) return Response.json({ error: 'Billet introuvable' }, { status: 404 });

    // Vérifier le hash de sécurité (anti-falsification)
    if (!ticket.security_hash || security_hash !== ticket.security_hash) {
      return Response.json({ error: 'Hash de sécurité invalide' }, { status: 403 });
    }

    // Le billet doit être en attente d'activation
    if (ticket.status === 'valide') {
      return Response.json({ error: 'Ce billet est déjà activé', already_active: true, ticket_number }, { status: 400 });
    }
    if (ticket.status === 'annule' || ticket.status === 'refuse') {
      return Response.json({ error: 'Ce billet a été annulé ou refusé' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updated = await base44.asServiceRole.entities.Ticket.update(ticket.id, {
      buyer_name: buyer_name.trim(),
      buyer_phone: buyer_phone.trim(),
      buyer_location: buyer_location.trim(),
      buyer_email: buyer_email ? buyer_email.trim().toLowerCase() : '',
      status: 'valide',
      validated_date: now,
    });

    // Récupérer l'événement pour les infos complètes
    const events = await base44.asServiceRole.entities.Event.filter({ id: ticket.event_id });
    const ev = events[0];

    return Response.json({
      success: true,
      ticket_number: updated.ticket_number,
      event_title: updated.event_title,
      event_date: updated.event_date,
      event_image_url: ev?.image_url || null,
      artist_name: ev?.artist_name || updated.artist_name || null,
      location: ev?.location || null,
      city: ev?.city || null,
      buyer_name: updated.buyer_name,
      amount: updated.amount,
      status: updated.status,
      message: 'Billet activé avec succès',
    });
  } catch (error) {
    console.error('activateTicket error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});