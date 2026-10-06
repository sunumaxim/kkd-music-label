import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { collectLinksForArtist } from '../../shared/collectLinks.ts';

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; KKDMusicBot/1.0)', Accept: 'application/json' };

function slugify(s) {
  return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
function uniqueSlug(base, used) {
  let s = base || 'item';
  let i = 2;
  while (used.has(s)) s = `${base}-${i++}`;
  used.add(s);
  return s;
}
const spotifyId = (u) => (u || '').match(/spotify\.com\/(?:intl-[a-z]+\/)?artist\/([a-zA-Z0-9]+)/)?.[1] || null;
const deezerId = (u) => (u || '').match(/deezer\.com\/(?:[a-z]+\/)?artist\/([0-9]+)/)?.[1] || null;

async function spotifyToken() {
  const id = secrets.get('SPOTIFY_CLIENT_ID');
  const sec = secrets.get('SPOTIFY_CLIENT_SECRET');
  if (!id || !sec) throw new Error('Secrets Spotify manquants');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + btoa(`${id}:${sec}`) },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Auth Spotify échouée (${res.status})`);
  return (await res.json()).access_token;
}

async function youtubeChannelId(url) {
  const ch = (url || '').match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (ch) return ch[1];
  if (!/youtube\.com\/(@|user\/|c\/)/.test(url || '')) return null;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0', 'Accept-Language': 'en-US,en;q=0.9' } });
  if (!res.ok) return null;
  const html = await res.text();
  return html.match(/"(?:channelId|externalChannelId|browseId)":"(UC[a-zA-Z0-9_-]{22})"/)?.[1] || null;
}

function decodeXml(t) {
  return t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// ── SPOTIFY RELEASES ──
async function syncSpotify(db, artist, ctx) {
  const id = spotifyId(artist.spotify_url);
  if (!id) return 0;
  if (!ctx.token) ctx.token = await spotifyToken();
  const items = [];
  let url = `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single&limit=50&market=FR`;
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${ctx.token}` } });
    if (!res.ok) throw new Error(`Spotify albums ${res.status}: ${(await res.text()).slice(0, 150)}`);
    const data = await res.json();
    items.push(...(data.items || []));
    url = data.next || null;
  }
  let created = 0;
  for (const it of items) {
    const link = it.external_urls?.spotify;
    const key = `${artist.name}|${it.name}`.toLowerCase();
    if (!link || ctx.urls.has(link) || ctx.titles.has(key)) continue;
    const type = it.album_type === 'album' ? 'album' : 'single';
    await db.entities.Release.create({
      title: it.name,
      slug: uniqueSlug(slugify(it.name), ctx.slugs),
      artist_name: artist.name,
      artist_id: artist.id,
      cover_url: it.images?.[0]?.url || '',
      release_type: type,
      release_date: (it.release_date || '').length === 10 ? it.release_date : undefined,
      spotify_url: link,
    });
    ctx.urls.add(link);
    ctx.titles.add(key);
    created++;
  }
  return created;
}

// ── DEEZER RELEASES ──
async function syncDeezer(db, artist, ctx) {
  const id = deezerId(artist.deezer_url);
  if (!id) return 0;
  const items = [];
  let url = `https://api.deezer.com/artist/${id}/albums?limit=100`;
  while (url) {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) throw new Error(`Deezer albums ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Erreur Deezer');
    items.push(...(data.data || []));
    url = data.next || null;
  }
  let created = 0;
  for (const it of items) {
    const link = `https://www.deezer.com/album/${it.id}`;
    const key = `${artist.name}|${it.title}`.toLowerCase();
    if (ctx.urls.has(link) || ctx.titles.has(key)) continue;
    const rt = (it.record_type || '').toLowerCase();
    await db.entities.Release.create({
      title: it.title,
      slug: uniqueSlug(slugify(it.title), ctx.slugs),
      artist_name: artist.name,
      artist_id: artist.id,
      cover_url: it.cover_xl || it.cover_big || it.cover || '',
      release_type: rt === 'album' ? 'album' : rt === 'ep' ? 'ep' : 'single',
      release_date: (it.release_date || '').length === 10 ? it.release_date : undefined,
      deezer_url: link,
    });
    ctx.urls.add(link);
    ctx.titles.add(key);
    created++;
  }
  return created;
}

// ── PROFILE (champs vides ou photos issues des plateformes uniquement) ──
async function syncProfile(db, artist, ctx) {
  const patch = {};
  const fromCdn = (u) => !u || /scdn\.co|dzcdn\.net/.test(u);
  const sid = spotifyId(artist.spotify_url);
  if (sid) {
    if (!ctx.token) ctx.token = await spotifyToken();
    const res = await fetch(`https://api.spotify.com/v1/artists/${sid}`, { headers: { Authorization: `Bearer ${ctx.token}` } });
    if (res.ok) {
      const d = await res.json();
      const img = d.images?.[0]?.url;
      if (img && fromCdn(artist.photo_url) && img !== artist.photo_url) patch.photo_url = img;
      if (!artist.genre && d.genres?.length) patch.genre = d.genres[0];
    }
  }
  const did = deezerId(artist.deezer_url);
  if (did) {
    const res = await fetch(`https://api.deezer.com/artist/${did}`, { headers: UA });
    if (res.ok) {
      const d = await res.json();
      if (!d.error && d.picture_xl && !patch.photo_url && fromCdn(artist.photo_url) && d.picture_xl !== artist.photo_url) patch.photo_url = d.picture_xl;
    }
  }
  if (Object.keys(patch).length === 0) return 0;
  await db.entities.Artist.update(artist.id, patch);
  return 1;
}

// ── YOUTUBE (flux RSS officiel de la chaîne, sans clé) ──
async function syncYoutube(db, artist, ctx) {
  const cid = await youtubeChannelId(artist.youtube_url);
  if (!cid) return 0;
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cid}`, { headers: UA });
  if (!res.ok) throw new Error(`YouTube RSS ${res.status}`);
  const xml = await res.text();
  let created = 0;
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const vid = e.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1]?.trim();
    const rawTitle = e.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    if (!vid || !rawTitle) continue;
    const link = `https://www.youtube.com/watch?v=${vid}`;
    if (ctx.urls.has(link)) continue;
    const title = decodeXml(rawTitle.trim());
    const t = title.toLowerCase();
    const video_type = /teaser|trailer/.test(t) ? 'teaser' : /interview|itw/.test(t) ? 'interview' : /making of|behind/.test(t) ? 'making_of' : 'clip_officiel';
    await db.entities.Video.create({
      title,
      slug: uniqueSlug(slugify(title), ctx.slugs),
      artist_name: artist.name,
      youtube_url: link,
      thumbnail_url: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
      video_type,
      publish_date: e.match(/<published>(.*?)<\/published>/)?.[1]?.split('T')[0],
    });
    ctx.urls.add(link);
    created++;
  }
  return created;
}

// ── CONCERTS (recherche web via LLM) ──
async function syncConcerts(db, artist, ctx) {
  const today = new Date().toISOString().split('T')[0];
  const res = await db.integrations.Core.InvokeLLM({
    prompt: `Recherche sur le web les concerts, festivals et showcases À VENIR (date >= ${today}) de l'artiste "${artist.name}" (${artist.genre || 'musique'}${artist.nationality ? ', ' + artist.nationality : ''}). ` +
      `Ne renvoie que des événements réels et confirmés, avec date précise au format ISO (YYYY-MM-DDTHH:MM:SS). Si aucun, renvoie une liste vide. Donne le lien de la billetterie ou de la page de l'événement.`,
    add_context_from_internet: true,
    model: 'gemini_3_8_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' }, date: { type: 'string' }, venue: { type: 'string' },
              city: { type: 'string' }, ticket_url: { type: 'string' }, image_url: { type: 'string' },
            },
          },
        },
      },
    },
  });
  let created = 0;
  for (const ev of res?.events || []) {
    const d = new Date(ev.date);
    if (!ev.title || isNaN(d.getTime()) || d.toISOString().split('T')[0] < today) continue;
    const day = d.toISOString().split('T')[0];
    const key = `${artist.id}|${day}|${(ev.venue || ev.city || '').toLowerCase().trim()}`;
    if (ctx.events.has(key)) continue;
    await db.entities.Event.create({
      title: ev.title,
      slug: uniqueSlug(slugify(`${ev.title}-${day}`), ctx.slugs),
      description: `Concert de ${artist.name}${ev.venue ? ' — ' + ev.venue : ''}${ev.city ? ', ' + ev.city : ''}.`,
      image_url: ev.image_url || artist.photo_url || '',
      event_type: 'concert',
      event_date: d.toISOString(),
      location: ev.venue || '',
      city: ev.city || '',
      ticket_url: ev.ticket_url || '',
      artist_id: artist.id,
      artist_name: artist.name,
      published_status: 'approuve',
    });
    ctx.events.add(key);
    created++;
  }
  return created;
}

// ── LINKS (récherche web via LLM pour profils sociaux et web) ──
async function syncLinks(db, artist, ctx) {
  const result = await collectLinksForArtist(db, artist);
  return result.updated_count;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    // Appel planifié (sans utilisateur) autorisé ; tout utilisateur connecté doit être admin
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (user && user.role !== 'admin') return Response.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const offset = Number(body.offset) || 0;
    const limit = Math.min(Number(body.limit) || 100, 200);
    const db = base44.asServiceRole;

    const handlers = { spotify: syncSpotify, deezer: syncDeezer, profile: syncProfile, youtube: syncYoutube, concerts: syncConcerts, links: syncLinks };
    if (!handlers[action]) return Response.json({ error: 'action invalide' }, { status: 400 });

    const all = await db.entities.Artist.list('created_date', 1000);
    let artists = all.filter((a) => {
      if (action === 'spotify') return spotifyId(a.spotify_url);
      if (action === 'deezer') return deezerId(a.deezer_url);
      if (action === 'profile') return spotifyId(a.spotify_url) || deezerId(a.deezer_url);
      if (action === 'youtube') return !!a.youtube_url;
      if (action === 'links') return a.is_verified || a.is_featured;
      return a.is_verified || a.is_featured;
    });
    const total = artists.length;
    artists = artists.slice(offset, offset + limit);

    const ctx = { token: null, urls: new Set(), titles: new Set(), slugs: new Set(), events: new Set() };
    if (action === 'spotify' || action === 'deezer') {
      const rels = await db.entities.Release.list('-created_date', 5000);
      rels.forEach((r) => {
        [r.spotify_url, r.deezer_url].forEach((u) => u && ctx.urls.add(u));
        ctx.titles.add(`${r.artist_name}|${r.title}`.toLowerCase());
        if (r.slug) ctx.slugs.add(r.slug);
      });
    } else if (action === 'youtube') {
      const vids = await db.entities.Video.list('-created_date', 5000);
      vids.forEach((v) => { if (v.youtube_url) ctx.urls.add(v.youtube_url); if (v.slug) ctx.slugs.add(v.slug); });
    } else if (action === 'concerts') {
      const evs = await db.entities.Event.list('-created_date', 2000);
      evs.forEach((e) => {
        if (e.slug) ctx.slugs.add(e.slug);
        if (e.artist_id && e.event_date) ctx.events.add(`${e.artist_id}|${e.event_date.split('T')[0]}|${(e.location || e.city || '').toLowerCase().trim()}`);
      });
    }

    let created = 0;
    const errors = [];
    for (const artist of artists) {
      try {
        created += await handlers[action](db, artist, ctx);
      } catch (err) {
        console.error(`[autoSync:${action}] ${artist.name}: ${err.message}`);
        errors.push({ artist: artist.name, error: err.message });
      }
    }
    const next = offset + limit;
    return Response.json({ action, processed: artists.length, total, created, errors, has_more: next < total, next_offset: next < total ? next : null });
  } catch (error) {
    console.error('[autoSync] fatal', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}