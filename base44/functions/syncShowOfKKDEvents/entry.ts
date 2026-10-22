import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// Portail partenaire "Show Of KKD" — échange d'événements dans les deux sens.
const API_BASE = 'https://app.base44.com/api/apps';
const PUBLIC_EVENT_BASE = 'https://kkdlabel.base44.app/evenements';
const REF_PREFIX = 'showofkkd:';

function rowsOf(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function toDateOnly(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function toTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function toIso(dateStr, timeStr) {
  if (!dateStr) return null;
  const day = String(dateStr).slice(0, 10);
  const time = String(timeStr || '20:00').slice(0, 5);
  const d = new Date(`${day}T${time.length === 5 ? time : '20:00'}:00.000Z`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function callApi(url, options) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) throw new Error(`${res.status} ${(data && (data.error || data.message)) || text.slice(0, 180)}`);
  return data;
}

// Notre événement -> champs du portail Show Of KKD
function remotePayload(event) {
  const slug = event.slug || slugify(event.title);
  return {
    title: event.title || '',
    slug,
    tagline: event.event_type || 'concert',
    featured_artist: event.artist_name || '',
    event_date: toDateOnly(event.event_date),
    event_time: toTime(event.event_date),
    venue: event.location || '',
    city: event.city || '',
    description: event.description || '',
    poster_url: event.image_url || '',
    price_presale: Number(event.ticket_price || 0),
    price_door: 0,
    currency: 'FCFA',
    ticket_url: slug ? `${PUBLIC_EVENT_BASE}/${slug}?achat=1` : '',
    status: 'published',
    is_featured: !!event.is_featured,
    source: 'official',
    official_event_id: event.id,
    official_synced_at: new Date().toISOString(),
    artist_email: event.organizer_email || '',
  };
}

// Mise à jour d'un concert déjà présent sur Show Of KKD : uniquement les faits du concert.
// Le statut (publié, brouillon, archivé), le concert mis en avant, les textes, l'affiche,
// le lien de billet et l'adresse d'accès de l'artiste appartiennent à Show Of KKD une fois
// le concert créé ; les renvoyer ici republierait un concert que le label a masqué ou archivé,
// et écraserait ce qui a été rédigé là-bas.
function remoteUpdatePayload(event) {
  const full = remotePayload(event);
  return {
    title: full.title,
    event_date: full.event_date,
    event_time: full.event_time,
    venue: full.venue,
    city: full.city,
    price_presale: full.price_presale,
    currency: full.currency,
    source: full.source,
    official_event_id: full.official_event_id,
    official_synced_at: full.official_synced_at,
  };
}

// Leur événement -> notre événement (en attente de validation admin)
function localPayload(remote, ref) {
  const categories = [];
  if (Number(remote.price_presale) > 0) {
    categories.push({ id: 'presale', name: 'Prévente en ligne', price: Number(remote.price_presale), channel: 'online' });
  }
  if (Number(remote.price_door) > 0) {
    categories.push({ id: 'door', name: 'Porte', price: Number(remote.price_door), channel: 'door' });
  }
  const artists = Array.isArray(remote.artists) ? remote.artists : [];
  const artistName = remote.featured_artist || artists[0] || '';
  return {
    title: remote.title || '',
    slug: remote.slug || slugify(remote.title),
    description: remote.description || '',
    image_url: remote.poster_url || '',
    event_type: 'concert',
    event_date: toIso(remote.event_date, remote.event_time),
    location: remote.venue || '',
    city: remote.city || '',
    artist_name: artistName,
    organizer_name: artistName,
    organizer_email: remote.artist_email || remote.contact_email || '',
    is_ticketed: categories.length > 0,
    ticket_price: Number(remote.price_presale) || Number(remote.price_door) || 0,
    ticket_categories: categories,
    published_status: 'en_attente',
    external_ref: ref,
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Réservé aux administrateurs' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dryRun = !!(body && body.dry_run === true);

    const rawAppId = (secrets.get('SHOWOFKKD_APP_ID') || '').trim();
    const match = rawAppId.match(/apps\/([A-Za-z0-9]+)/);
    const appId = match ? match[1] : rawAppId;
    if (!appId) return Response.json({ error: 'SHOWOFKKD_APP_ID manquant' }, { status: 500 });

    const headers = {
      Authorization: `Bearer ${secrets.get('SHOWOFKKD_TOKEN')}`,
      'Content-Type': 'application/json',
    };
    const remoteEventsUrl = `${API_BASE}/${appId}/entities/Event`;

    const remoteEvents = rowsOf(await callApi(`${remoteEventsUrl}?limit=200`, { headers }));
    const ourEvents = rowsOf(await base44.asServiceRole.entities.Event.list({ sort: '-created_date', limit: 200 }));

    // 1) Envoi : nos événements approuvés (à venir) vers Show Of KKD
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const toSend = ourEvents.filter(
      (e) => e.published_status === 'approuve' && e.event_date && new Date(e.event_date).getTime() >= cutoff
    );
    const sent = { created: 0, updated: 0, errors: [] };

    for (const event of toSend) {
      const existing = remoteEvents.find((r) => r.official_event_id === event.id);
      if (dryRun) {
        if (existing) sent.updated += 1; else sent.created += 1;
        continue;
      }
      try {
        const payload = JSON.stringify(existing ? remoteUpdatePayload(event) : remotePayload(event));
        if (existing) {
          await callApi(`${remoteEventsUrl}/${existing.id}`, { method: 'PUT', headers, body: payload });
          sent.updated += 1;
        } else {
          const created = await callApi(remoteEventsUrl, { method: 'POST', headers, body: payload });
          const row = created && (created.id ? created : rowsOf(created)[0]);
          if (row && row.id) remoteEvents.push(row);
          sent.created += 1;
        }
      } catch (error) {
        sent.errors.push(`${event.title}: ${error.message}`);
      }
    }

    // 2) Réception : leurs propres événements publiés -> chez nous, en attente de validation
    const knownRefs = new Set(ourEvents.map((e) => e.external_ref).filter(Boolean));
    const incoming = remoteEvents.filter((r) => r.source !== 'official' && r.status === 'published');
    const received = { created: 0, skipped: 0, errors: [] };

    for (const remote of incoming) {
      const ref = `${REF_PREFIX}${remote.id}`;
      if (knownRefs.has(ref)) { received.skipped += 1; continue; }
      const payload = localPayload(remote, ref);
      if (!payload.title || !payload.event_date) { received.skipped += 1; continue; }
      if (dryRun) { received.created += 1; knownRefs.add(ref); continue; }
      try {
        await base44.asServiceRole.entities.Event.create(payload);
        knownRefs.add(ref);
        received.created += 1;
      } catch (error) {
        received.errors.push(`${remote.title}: ${error.message}`);
      }
    }

    return Response.json({
      ok: true,
      dry_run: dryRun,
      sent_to_showofkkd: sent,
      received_from_showofkkd: received,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}