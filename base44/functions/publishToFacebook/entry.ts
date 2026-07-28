import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Renvoie une URL d'image publiquement accessible (signée si fichier privé KKD)
async function getPublicImageUrl(base44, imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.includes('/private/') || (imageUrl.includes('media.base44.com') && imageUrl.includes('/user_'))) {
    try {
      const result = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: imageUrl,
        expires_in: 3600,
      });
      return result.signed_url || imageUrl;
    } catch {
      return imageUrl;
    }
  }
  return imageUrl;
}

// Liste les pages Facebook gérées par le compte connecté
async function listPages(accessToken) {
  const res = await fetch(
    `https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
  );
  const data = await res.json();
  return (data.data || []).map((p) => ({ id: p.id, name: p.name, access_token: p.access_token }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { list, page_id, cover_url, caption, link } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');

    if (list) {
      const pages = await listPages(accessToken);
      return Response.json({ pages });
    }

    const pages = await listPages(accessToken);
    if (!pages.length) {
      return Response.json({ error: 'Aucune page Facebook gérée par ce compte.' }, { status: 400 });
    }

    const imageUrl = await getPublicImageUrl(base44, cover_url);
    if (!imageUrl) {
      return Response.json({ error: 'Aucune image (pochette) disponible pour la publication.' }, { status: 400 });
    }

    const fullCaption = (caption || '') + (link ? `\n\n${link}` : '');
    const targetPages = page_id ? pages.filter((p) => p.id === page_id) : pages;

    const results = [];
    for (const page of targetPages) {
      try {
        // Publication photo sur la page
        const fd = new FormData();
        fd.append('url', imageUrl);
        fd.append('caption', fullCaption);
        fd.append('access_token', page.access_token);
        const pres = await fetch(`https://graph.facebook.com/v25.0/${page.id}/photos`, {
          method: 'POST',
          body: fd,
        });
        const pdata = await pres.json();
        if (pdata.id) results.push({ page: page.name, post_id: pdata.id });
        else results.push({ page: page.name, error: pdata.error?.message || 'Échec' });
      } catch (e) {
        results.push({ page: page.name, error: e.message });
      }
    }

    const ok = results.filter((r) => r.post_id).length;
    if (!ok) {
      return Response.json({ error: 'Aucune publication réussie', details: results }, { status: 500 });
    }
    return Response.json({ success: true, pages: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});