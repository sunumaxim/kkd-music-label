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

function ytId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return m ? m[1] : null;
}

function url(path, lastmod, image, title, priority) {
  const u = `${SITE}/${esc(path)}`;
  let xml = `  <url>\n    <loc>${u}</loc>`;
  if (lastmod) xml += `\n    <lastmod>${lastmod}</lastmod>`;
  if (priority) xml += `\n    <priority>${priority}</priority>`;
  if (image) {
    xml += `\n    <image:image>\n      <image:loc>${esc(image)}</image:loc>`;
    if (title) xml += `\n      <image:title>${esc(title)}</image:title>`;
    xml += `\n      <image:caption>${esc(title || 'KKD Music')}</image:caption>\n    </image:image>`;
  }
  xml += `\n  </url>`;
  return xml;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Static pages with priority
    const staticUrls = [
      url('', null, null, null, '1.0'),
      url('musique', null, null, null, '0.9'),
      url('artistes', null, null, null, '0.9'),
      url('videos', null, null, null, '0.9'),
      url('evenements', null, null, null, '0.9'),
      url('actualites', null, null, null, '0.8'),
      url('partenaires', null, null, null, '0.6'),
      url('a-propos', null, null, null, '0.5'),
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
      ...releases.map(r => {
        const img = r.cover_url;
        return url(`musique/${r.slug || slugify(r.title)}`, r.updated_date || r.created_date, img, r.title, '0.8');
      }),
      ...artists.map(a => url(`artistes/${a.slug || slugify(a.name)}`, a.updated_date || a.created_date, a.photo_url, a.name, '0.8')),
      ...videos.map(v => {
        let img = v.thumbnail_url;
        if (!img) {
          const yid = ytId(v.youtube_url);
          if (yid) img = `https://img.youtube.com/vi/${yid}/maxresdefault.jpg`;
        }
        return url(`videos/${v.slug || slugify(v.title)}`, v.updated_date || v.created_date, img, v.title, '0.8');
      }),
      ...events.filter(e => !e.published_status || e.published_status === 'approuve')
               .map(e => url(`evenements/${e.slug || slugify(e.title)}`, e.updated_date || e.created_date, e.image_url, e.title, '0.7')),
      ...news.filter(n => n.is_published !== false)
            .map(n => url(`actualites/${n.slug || slugify(n.title)}`, n.updated_date || n.created_date, n.image_url, n.title, '0.7')),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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