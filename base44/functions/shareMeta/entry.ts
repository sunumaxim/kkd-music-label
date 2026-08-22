import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const BASE_PATHS = {
  release: 'musique',
  video: 'videos',
  artist: 'artistes',
  news: 'actualites',
  event: 'evenements',
};

const SITE_URL = 'https://kkdmusic.com';
const DEFAULT_IMAGE = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';

const EVENT_TYPE_LABELS = {
  concert: 'Concert',
  showcase: 'Showcase',
  festival: 'Festival',
  rencontre: 'Rencontre artistique',
};

function extractId(slugParam) {
  if (!slugParam) return slugParam;
  const clean = String(slugParam).replace(/\/+$/g, '').trim();
  const idx = clean.lastIndexOf('--');
  if (idx !== -1) {
    const id = clean.slice(idx + 2).replace(/^-+/, '');
    if (id) return id;
  }
  return clean;
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slugify(text) {
  if (!text) return '';
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const ENTITY_MAP = {
  release: { name: 'Release', nameField: 'title' },
  video: { name: 'Video', nameField: 'title' },
  artist: { name: 'Artist', nameField: 'name' },
  news: { name: 'News', nameField: 'title' },
  event: { name: 'Event', nameField: 'title' },
};

async function resolveEntity(base44, type, rawSlug) {
  const cfg = ENTITY_MAP[type];
  if (!cfg || !rawSlug) return null;
  const entity = base44.asServiceRole.entities[cfg.name];
  const cleanSlug = slugify(rawSlug);
  const legacyId = String(rawSlug).includes('--') ? extractId(rawSlug) : null;

  if (legacyId) {
    try { const r = (await entity.filter({ id: legacyId }))[0]; if (r) return r; } catch (_) {}
  }
  if (cleanSlug) {
    try { const r = (await entity.filter({ slug: cleanSlug }))[0]; if (r) return r; } catch (_) {}
  }
  if (rawSlug.length >= 20 && /^[a-f0-9]+$/i.test(rawSlug)) {
    try { const r = await entity.get(rawSlug); if (r) return r; } catch (_) {}
  }
  try {
    const all = await entity.list('-created_date', 500);
    const found = all.find(r => slugify(r[cfg.nameField]) === cleanSlug);
    if (found) return found;
  } catch (_) {}
  return null;
}

function ytId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return m ? m[1] : null;
}

// ── JSON-LD structured data builders for rich search results ──
function buildJsonLd(type, ent, pageUrl, image) {
  const base = { '@context': 'https://schema.org' };
  const name = ent.title || ent.name || '';
  const desc = (ent.description || ent.excerpt || ent.biography || '').slice(0, 300);

  if (type === 'release') {
    return {
      ...base,
      '@type': 'MusicRecording',
      name: esc(name),
      byArtist: { '@type': 'MusicGroup', name: esc(ent.artist_name) },
      image: esc(image),
      description: esc(desc),
      datePublished: ent.release_date || ent.created_date,
      genre: ent.genre || 'Musique africaine',
      url: esc(pageUrl),
      ...(ent.is_for_sale && Number(ent.price) > 0 ? {
        offers: {
          '@type': 'Offer',
          price: Number(ent.price),
          priceCurrency: 'XOF',
          availability: 'https://schema.org/InStock',
        },
      } : {}),
    };
  }

  if (type === 'video') {
    const yid = ytId(ent.youtube_url);
    return {
      ...base,
      '@type': 'VideoObject',
      name: esc(name),
      description: esc(desc),
      thumbnailUrl: esc(image),
      uploadDate: ent.publish_date || ent.created_date,
      contentUrl: ent.youtube_url || ent.video_file_url || '',
      embedUrl: yid ? `https://www.youtube.com/embed/${yid}` : '',
      url: esc(pageUrl),
      ...(ent.artist_name ? { creator: { '@type': 'Person', name: esc(ent.artist_name) } } : {}),
    };
  }

  if (type === 'artist') {
    const sameAs = [
      ent.spotify_url, ent.youtube_url, ent.apple_music_url,
      ent.audiomack_url, ent.deezer_url, ent.soundcloud_url,
      ent.instagram_url, ent.tiktok_url, ent.facebook_url, ent.wikipedia_url, ent.website_url,
    ].filter(Boolean);
    return {
      ...base,
      '@type': 'MusicGroup',
      name: esc(name),
      image: esc(image),
      description: esc(desc || `${name} — artiste sur KKD Music`),
      genre: ent.genre || 'Musique africaine',
      url: esc(pageUrl),
      ...(sameAs.length ? { sameAs } : {}),
    };
  }

  if (type === 'event') {
    const offers = ent.is_ticketed && Number(ent.ticket_price) > 0 ? {
      '@type': 'Offer',
      price: Number(ent.ticket_price),
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
      url: esc(pageUrl),
    } : undefined;
    return {
      ...base,
      '@type': 'Event',
      name: esc(name),
      description: esc(desc),
      image: esc(image),
      startDate: ent.event_date,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: esc(ent.location || ent.title),
        address: esc([ent.location, ent.city].filter(Boolean).join(', ')),
      },
      ...(ent.organizer_name ? { organizer: { '@type': 'Organization', name: esc(ent.organizer_name) } } : {}),
      ...(ent.artist_name ? { performer: { '@type': 'MusicGroup', name: esc(ent.artist_name) } } : {}),
      url: esc(pageUrl),
      ...(offers ? { offers } : {}),
    };
  }

  if (type === 'news') {
    return {
      ...base,
      '@type': 'NewsArticle',
      headline: esc(name),
      image: [esc(image)],
      datePublished: ent.publish_date || ent.created_date,
      dateModified: ent.updated_date || ent.created_date,
      author: { '@type': 'Organization', name: 'KKD Music' },
      publisher: {
        '@type': 'Organization',
        name: 'KKD Music',
        logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE },
      },
      articleSection: ent.category || 'Actualité musicale',
      description: esc(desc),
      url: esc(pageUrl),
      ...(ent.tags?.length ? { keywords: ent.tags.join(', ') } : {}),
    };
  }

  return null;
}

// ── Breadcrumb structured data ──
function buildBreadcrumbLd(type, ent, pageUrl) {
  const category = BASE_PATHS[type] || '';
  const categoryName = {
    release: 'Musique', video: 'Vidéos', artist: 'Artistes',
    news: 'Actualités', event: 'Événements',
  }[type] || '';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: categoryName, item: `${SITE_URL}/${category}` },
      { '@type': 'ListItem', position: 3, name: esc(ent.title || ent.name || ''), item: esc(pageUrl) },
    ],
  };
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let type = url.searchParams.get('type');
    let slug = url.searchParams.get('slug');
    let to = url.searchParams.get('to');
    let body = null;
    if (!type || !slug || !to) {
      try { body = await req.json(); } catch (_) {}
      if (body) {
        if (!type) type = body.type;
        if (!slug) slug = body.slug;
        if (!to) to = body.to;
      }
    }
    type = type || 'release';
    slug = slug || '';
    const id = extractId(slug);
    const base44 = createClientFromRequest(req);

    let title = 'KKD Music — Musique Africaine';
    let description = 'Découvrez la musique africaine sur KKD Music — artistes, sorties, vidéos et événements.';
    let image = DEFAULT_IMAGE;
    let keywords = 'musique africaine, KKD Music, streaming, artistes, concerts, clips';
    let entity = null;

    if (id) {
      try {
        const ent = await resolveEntity(base44, type, slug);
        if (ent) {
          entity = ent;
          title = ent.title || ent.name || title;
          let baseDesc = ent.description || ent.excerpt || (ent.biography ? ent.biography.slice(0, 120) : '') ||
            (ent.name ? `${ent.name} sur KKD Music` : description);
          let pricePrefix = '';
          if (type === 'release' && ent.is_for_sale && Number(ent.price) > 0) {
            pricePrefix = `Prix: ${Number(ent.price).toLocaleString('fr-FR')} F CFA — `;
          } else if (type === 'event' && ent.is_ticketed && Number(ent.ticket_price) > 0) {
            pricePrefix = `Billet: ${Number(ent.ticket_price).toLocaleString('fr-FR')} F CFA — `;
          }
          description = pricePrefix + baseDesc;
          if (description.length > 200) description = description.slice(0, 197) + '...';
          image = ent.cover_url || ent.photo_url || ent.image_url || ent.thumbnail_url || image;
          if (type === 'video' && !ent.thumbnail_url) {
            const yid = ytId(ent.youtube_url);
            if (yid) image = `https://img.youtube.com/vi/${yid}/maxresdefault.jpg`;
          }

          // ── Keywords : catégorie + genre + artiste + type ──
          const kwParts = [];
          if (type === 'release') {
            kwParts.push('musique', 'single', 'sortie musicale', 'streaming');
            if (ent.artist_name) kwParts.push(ent.artist_name);
            if (ent.release_type) kwParts.push(ent.release_type);
          } else if (type === 'video') {
            kwParts.push('clip vidéo', 'vidéo musicale', 'clip officiel');
            if (ent.artist_name) kwParts.push(ent.artist_name);
            if (ent.video_type) kwParts.push(ent.video_type.replace(/_/g, ' '));
          } else if (type === 'artist') {
            kwParts.push('artiste', 'profil artiste', 'biographie');
            if (ent.genre) kwParts.push(ent.genre);
            if (ent.nationality) kwParts.push(ent.nationality);
          } else if (type === 'event') {
            kwParts.push('événement', 'concert', 'show');
            if (ent.event_type && EVENT_TYPE_LABELS[ent.event_type]) kwParts.push(EVENT_TYPE_LABELS[ent.event_type]);
            if (ent.city) kwParts.push(ent.city);
            if (ent.artist_name) kwParts.push(ent.artist_name);
          } else if (type === 'news') {
            kwParts.push('actualité musicale', 'news', 'article');
            if (ent.category) kwParts.push(ent.category);
            if (ent.tags?.length) kwParts.push(...ent.tags);
          }
          kwParts.push('KKD Music', 'musique africaine');
          keywords = [...new Set(kwParts.filter(Boolean))].join(', ');
        }
      } catch (e) {
        console.error('shareMeta fetch error:', e);
      }
    }

    function safeRedirect(value, origin) {
      if (!value) return null;
      const v = String(value);
      if (v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\')) return v;
      try {
        const u = new URL(v, origin);
        if ((u.protocol === 'http:' || u.protocol === 'https:') && u.origin === new URL(origin).origin) {
          return u.pathname + u.search + u.hash;
        }
      } catch (_) {}
      return null;
    }
    const defaultRedirect = `${url.origin}/${BASE_PATHS[type] || 'musique'}/${slug}`;
    const redirect = safeRedirect(to, url.origin) || defaultRedirect;

    // ── JSON-LD structured data ──
    const jsonLdScripts = [];
    if (entity) {
      const mainLd = buildJsonLd(type, entity, redirect, image);
      if (mainLd) jsonLdScripts.push(JSON.stringify(mainLd));
      const breadcrumbLd = buildBreadcrumbLd(type, entity, redirect);
      jsonLdScripts.push(JSON.stringify(breadcrumbLd));
    }

    const ogType = type === 'video' ? 'video.other' : type === 'artist' ? 'profile' : type === 'event' ? 'article' : 'website';

    const html = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8">
<title>${esc(title)} — KKD Music</title>
<meta name="description" content="${esc(description)}">
<meta name="keywords" content="${esc(keywords)}">
<meta name="author" content="KKD Music">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="language" content="French">
<meta name="geo.region" content="AF">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="KKD Music">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:alt" content="${esc(title)}">
<meta property="og:url" content="${esc(redirect)}">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta name="twitter:image:alt" content="${esc(title)}">
<link rel="canonical" href="${esc(redirect)}">
${jsonLdScripts.map(ld => `<script type="application/ld+json">${ld}</script>`).join('\n')}
<meta http-equiv="refresh" content="0;url=${esc(redirect)}">
</head>
<body>
<script>window.location.replace(${JSON.stringify(redirect)});</script>
<p>Redirection vers <a href="${esc(redirect)}">KKD Music</a></p>
</body></html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    console.error('shareMeta error:', error);
    return new Response('Erreur de partage', { status: 500 });
  }
});