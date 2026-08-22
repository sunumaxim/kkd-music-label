import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isUserAuthorizedForEvent, isUserLinkedToArtist } from '../../shared/artistAccess.ts';

// ── Génération sécurisée de numéro de billet (crypto-random) ──
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1 (ambigus)

function genSecureTicketNumber(eventDate?: string) {
  const ed = eventDate ? new Date(eventDate) : new Date();
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  const edPart = `${p(ed.getFullYear() % 100)}${p(ed.getMonth() + 1)}${p(ed.getDate())}`;
  const randBytes = new Uint8Array(6);
  crypto.getRandomValues(randBytes);
  let rand = '';
  for (let i = 0; i < 6; i++) rand += SAFE_CHARS[randBytes[i] % SAFE_CHARS.length];
  return `KKD-${edPart}-${rand}-SM`;
}

function genSecurityHash() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function genBatchId() {
  const ts = Date.now().toString(36).toUpperCase();
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `BATCH-${ts}-${rand}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { event_id, quantity, buyer_name, buyer_email, buyer_phone, buyer_location, amount } = await req.json();

    if (!event_id) return Response.json({ error: 'event_id requis' }, { status: 400 });
    if (!buyer_name || !buyer_name.trim()) return Response.json({ error: 'Le nom est obligatoire' }, { status: 400 });
    if (!buyer_phone || !buyer_phone.trim()) return Response.json({ error: 'Le téléphone est obligatoire' }, { status: 400 });
    if (!buyer_location || !buyer_location.trim()) return Response.json({ error: 'Le lieu (ville/village) est obligatoire' }, { status: 400 });

    const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
    const ev = events[0];
    if (!ev) return Response.json({ error: 'Événement introuvable' }, { status: 404 });

    const authorized = await isUserAuthorizedForEvent(base44, ev, user);
    if (!authorized) return Response.json({ error: 'Non autorisé' }, { status: 403 });

    // Déterminer la limite : 700 pour partenaires/artistes/admin, 100 pour les autres
    let maxBatch = 100;
    if (user.role === 'admin' || ev.organizer_email === user.email) {
      maxBatch = 700;
    } else if (ev.artist_id && await isUserLinkedToArtist(base44, ev.artist_id, user.email)) {
      maxBatch = 700;
    }

    const qty = Math.max(1, Math.min(maxBatch, Math.floor(Number(quantity) || 1)));
    const ticketAmount = Number(amount) || ev.ticket_price || 0;
    const now = new Date().toISOString();
    const batchId = genBatchId();

    // Vérifier la capacité restante
    if (ev.ticket_capacity > 0) {
      const remaining = ev.ticket_capacity - (ev.tickets_sold || 0);
      if (qty > remaining) {
        return Response.json({ error: `Capacité insuffisante : ${remaining} billets restants` }, { status: 400 });
      }
    }

    // Générer les tickets en lot avec numéros uniques
    const ticketsData: any[] = [];
    const usedNumbers = new Set<string>();
    for (let i = 0; i < qty; i++) {
      let number = genSecureTicketNumber(ev.event_date);
      let attempts = 0;
      while (usedNumbers.has(number) && attempts < 10) {
        number = genSecureTicketNumber(ev.event_date);
        attempts++;
      }
      usedNumbers.add(number);
      ticketsData.push({
        event_id,
        event_title: ev.title,
        event_date: ev.event_date,
        event_image_url: ev.image_url,
        artist_name: ev.artist_name,
        organizer_email: ev.organizer_email,
        managers: ev.managers || [],
        buyer_email: buyer_email ? buyer_email.trim().toLowerCase() : '',
        buyer_name: buyer_name.trim(),
        buyer_phone: buyer_phone.trim(),
        buyer_location: buyer_location.trim(),
        ticket_number: number,
        security_hash: genSecurityHash(),
        batch_id: batchId,
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
    }

    // bulkCreate par tranches de 500 (limite API)
    const allTickets: any[] = [];
    for (let i = 0; i < ticketsData.length; i += 500) {
      const chunk = ticketsData.slice(i, i + 500);
      const created = await base44.asServiceRole.entities.Ticket.bulkCreate(chunk);
      allTickets.push(...created);
    }

    // Mettre à jour tickets_sold
    await base44.asServiceRole.entities.Event.update(event_id, {
      tickets_sold: (ev.tickets_sold || 0) + qty,
    });

    return Response.json({
      batch_id: batchId,
      count: allTickets.length,
      max_allowed: maxBatch,
      tickets: allTickets.map((t) => ({
        id: t.id,
        ticket_number: t.ticket_number,
        security_hash: t.security_hash,
        buyer_name: t.buyer_name,
      })),
    });
  } catch (error) {
    console.error('generateTicketBatch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});