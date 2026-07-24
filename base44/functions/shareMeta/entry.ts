import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const BASE_PATHS = {
  release: 'musique',
  video: 'videos',
  artist: 'artistes',
  news: 'actualites',
  event: 'evenements',
};

const DEFAULT_IMAGE = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';

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

function ytId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return m ? m[1] : null;
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

    if (id) {
      try {
        let ent = null;
        if (type === 'release') ent = (await base44.asServiceRole.entities.Release.filter({ id }))[0];
        else if (type === 'video') ent = (await base44.asServiceRole.entities.Video.filter({ id }))[0];
        else if (type === 'artist') ent = (await base44.asServiceRole.entities.Artist.filter({ id }))[0];
        else if (type === 'news') ent = (await base44.asServiceRole.entities.News.filter({ id }))[0];
        else if (type === 'event') ent = (await base44.asServiceRole.entities.Event.filter({ id }))[0];

        if (ent) {
          title = ent.title || ent.name || title;
          description =
            ent.description || ent.excerpt || (ent.biography ? ent.biography.slice(0, 160) : '') ||
            (ent.name ? `${ent.name} sur KKD Music` : description);
          image = ent.cover_url || ent.photo_url || ent.image_url || ent.thumbnail_url || image;
          if (type === 'video' && !ent.thumbnail_url) {
            const yid = ytId(ent.youtube_url);
            if (yid) image = `https://img.youtube.com/vi/${yid}/maxresdefault.jpg`;
          }
        }
      } catch (e) {
        console.error('shareMeta fetch error:', e);
      }
    }

    const redirect = to || `${url.origin}/${BASE_PATHS[type] || 'musique'}/${slug}`;
    const html = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8">
<title>${esc(title)} — KKD Music</title>
<meta property="og:type" content="${type === 'video' ? 'video.other' : type === 'artist' ? 'profile' : 'website'}">
<meta property="og:site_name" content="KKD Music">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(redirect)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
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