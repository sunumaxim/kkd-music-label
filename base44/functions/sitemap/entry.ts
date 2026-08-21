import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SITE = 'https://kkdmusic.com';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slugify(text) {
  if (!text) return '';
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function url(path, lastmod) {
  const u = `${SITE}/${esc(path)}`;
  return `  <url>\n    <loc>${u}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Static pages
    const staticUrls = [
      url(''),
      url('musique'),
      url('artistes'),
      url('videos'),
      url('evenements'),
      url('actualites'),
      url('partenaires'),
      url('a-propos'),
    ];

    // Dynamic content — fetch all public entities
    const [releases, artists, videos, events, news] = await Promise.all([
      base44.asServiceRole.entities.Release.list('-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.Artist.list('-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.Video.list('-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.Event.list('-event_date', 500).catch(() => []),
      base44.asServiceRole.entities.News.list('-publish_date', 500).catch(() => []),
    ]);

    const dynamicUrls = [
      ...releases.map(r => url(`musique/${r.slug || slugify(r.title)}`, r.updated_date || r.created_date)),
      ...artists.map(a => url(`artistes/${a.slug || slugify(a.name)}`, a.updated_date || a.created_date)),
      ...videos.map(v => url(`videos/${v.slug || slugify(v.title)}`, v.updated_date || v.created_date)),
      ...events.filter(e => !e.published_status || e.published_status === 'approuve')
               .map(e => url(`evenements/${e.slug || slugify(e.title)}`, e.updated_date || e.created_date)),
      ...news.filter(n => n.is_published !== false)
            .map(n => url(`actualites/${n.slug || slugify(n.title)}`, n.updated_date || n.created_date)),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...dynamicUrls].join('\n')}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (error) {
    console.error('sitemap error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
});