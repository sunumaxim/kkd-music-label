const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genTicketNumber(eventDate: string | undefined) {
  const d = eventDate ? new Date(eventDate) : new Date();
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  const datePart = `${p(d.getFullYear() % 100)}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let random = '';
  for (const b of bytes) random += SAFE_CHARS[b % SAFE_CHARS.length];
  return `KKD-${datePart}-${random}-SM`;
}

function genSecurityHash() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Called only after a trusted server-side provider check or a verified provider webhook. */
export async function confirmTicketPayment(base44: any, ticket: any, transactionId = '') {
  if (!ticket) throw new Error('Billet introuvable');
  if (ticket.status === 'valide') {
    return { status: 'valide', ticket_number: ticket.ticket_number, already_validated: true };
  }
  if (ticket.status !== 'en_attente') throw new Error('Ce billet ne peut pas être validé dans son état actuel');

  let number = genTicketNumber(ticket.event_date);
  for (let i = 0; i < 8; i++) {
    const duplicate = await base44.asServiceRole.entities.Ticket.filter({ ticket_number: number });
    if (!duplicate.length) break;
    number = genTicketNumber(ticket.event_date);
  }

  await base44.asServiceRole.entities.Ticket.update(ticket.id, {
    status: 'valide',
    ticket_number: number,
    security_hash: ticket.security_hash || genSecurityHash(),
    validated_date: new Date().toISOString(),
    wave_transaction_id: transactionId || ticket.wave_transaction_id || '',
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
      title: '🎟️ Paiement Wave confirmé',
      message: `Votre billet pour « ${ticket.event_title || "l'événement"} » est confirmé. Téléchargez-le dans « Mes billets ».`,
      type: 'success',
      link: '/mes-billets',
      is_read: false,
    }).catch(() => {});
  }

  return { status: 'valide', ticket_number: number };
}
