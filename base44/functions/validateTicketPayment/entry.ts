import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification } from "../../shared/emailKit.js";

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
    if (user.role !== 'admin') return Response.json({ error: 'Réservé admin' }, { status: 403 });

    const { ticket_id } = await req.json();
    if (!ticket_id) return Response.json({ error: 'ticket_id requis' }, { status: 400 });

    const tickets = await base44.asServiceRole.entities.Ticket.filter({ id: ticket_id });
    const ticket = tickets[0];
    if (!ticket) return Response.json({ error: 'Ticket introuvable' }, { status: 404 });
    if (ticket.status === 'valide') return Response.json({ ticket_number: ticket.ticket_number, status: 'valide' });

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
        tickets_sold: (events[0].tickets_sold || 0) + 1,
      });
    }

    // Notifier l'acheteur que son billet est validé et téléchargeable
    if (ticket.buyer_email) {
      const eventTitle = ticket.event_title || "l'événement";
      const eventDateStr = ticket.event_date
        ? new Date(ticket.event_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : null;

      const infoRows = [
        ["Billet N°", number],
        ["Événement", eventTitle],
        ["Date", eventDateStr],
        ["Acheteur", ticket.buyer_name],
        ["Téléphone", ticket.buyer_phone],
        ["Ville", ticket.buyer_location],
      ];

      const htmlBody = buildEmailHtml({
        subject: "Billet validé — téléchargez-le",
        preheader: `Votre billet pour "${eventTitle}" est confirmé.`,
        action: "success",
        actionLabel: "BILLET VALIDÉ",
        headline: "Votre billet est confirmé !",
        body: `Votre paiement pour <strong>"${eventTitle}"</strong> a été validé. Votre billet est désormais téléchargeable au format PDF. Présentez-le (ou son QR code) à l'entrée de l'événement.`,
        infoRows,
        cta: { label: "Télécharger mon billet", url: `${SITE_URL}/mes-billets` },
      });

      await pushNotification({
        base44,
        userEmail: ticket.buyer_email,
        title: "Billet validé !",
        message: `Votre billet pour "${eventTitle}" est confirmé. Téléchargez-le depuis la rubrique « Mes billets ».`,
        type: "success",
        link: "/mes-billets",
        subject: `KKD Music — Billet validé : ${eventTitle}`,
        body: htmlBody,
      });
    }

    return Response.json({ ticket_number: number, status: 'valide' });
  } catch (error) {
    console.error('validateTicketPayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});