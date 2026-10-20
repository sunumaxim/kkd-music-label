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

    const { event_id, quantity, buyer_name, buyer_email, buyer_phone, buyer_location, ticket_category, blank } = await req.json();

    if (!event_id) return Response.json({ error: 'event_id requis' }, { status: 400 });

    // Mode "blank" (vente physique) : billets vierges sans infos acheteur, à activer par scan QR.
    // Mode normal : infos acheteur obligatoires, billets déjà activés.
    const isBlank = !!blank;
    if (!isBlank) {
      if (!buyer_name || !buyer_name.trim()) return Response.json({ error: 'Le nom est obligatoire' }, { status: 400 });
      if (!buyer_phone || !buyer_phone.trim()) return Response.json({ error: 'Le téléphone est obligatoire' }, { status: 400 });
      if (!buyer_location || !buyer_location.trim()) return Response.json({ error: 'Le lieu (ville/village) est obligatoire' }, { status: 400 });
    }

    const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
    const ev = events[0];
    if (!ev) return Response.json({ error: 'Événement introuvable' }, { status: 404 });
    if (ev.published_status && ev.published_status !== 'approuve') {
      return Response.json({ error: 'La génération des billets est disponible après approbation de l’événement' }, { status: 403 });
    }

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
    const basePrice = Math.max(0, Number(ev.ticket_price) || 0);
    const configuredCategories = Array.isArray(ev.ticket_categories) ? ev.ticket_categories : [];
    const configuredCategory = configuredCategories.find((category: any) =>
      category && (category.name === ticket_category || category.id === ticket_category)
    );
    const categoryName = String(ticket_category || 'Pass Standard');
    const categoryMultiplier = categoryName.toLowerCase().includes('vvip') ? 4
      : categoryName.toLowerCase().includes('carré') || categoryName.toLowerCase().includes('carre') ? 3
      : categoryName.toLowerCase().includes('vip') ? 2.5
      : categoryName.toLowerCase().includes('festival') ? 3.5
      : categoryName.toLowerCase().includes('early') || categoryName.toLowerCase().includes('prévente') ? 0.8
      : 1;
    const configuredPrice = Number(configuredCategory?.price);
    const ticketAmount = Number.isFinite(configuredPrice) && configuredPrice >= 0
      ? configuredPrice
      : Math.round(basePrice * categoryMultiplier);
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
        ticket_theme: ev.ticket_theme || 'classic',
        ticket_category: categoryName,
        artist_name: ev.artist_name,
        organizer_email: ev.organizer_email,
        managers: ev.managers || [],
        buyer_email: isBlank ? '' : (buyer_email ? buyer_email.trim().toLowerCase() : ''),
        buyer_name: isBlank ? '' : buyer_name.trim(),
        buyer_phone: isBlank ? '' : buyer_phone.trim(),
        buyer_location: isBlank ? '' : buyer_location.trim(),
        ticket_number: number,
        security_hash: genSecurityHash(),
        batch_id: batchId,
        amount: ticketAmount,
        commission_pct: ev.commission_pct || 10,
        payment_method: 'wave',
        status: isBlank ? 'en_attente' : 'valide',
        validated_date: isBlank ? null : now,
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