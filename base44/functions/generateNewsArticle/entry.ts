/**
 * Rédaction assistée par IA d'un article / résumé d'actualité KKD Music.
 * Réservé aux admins (pages d'administration uniquement).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { user = null; }
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Réservé admin' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { title, category, type, artist_name, artist_genre, excerpt, context } = body;
    if (!title) return Response.json({ error: 'Titre manquant' }, { status: 400 });

    const artistInfo = artist_name
      ? `Artiste: ${artist_name}${type === 'excerpt' ? '' : `, genre: ${artist_genre || ''}`}.`
      : '';

    const prompt = type === 'excerpt'
      ? `Tu es un rédacteur pour KKD Music. Rédige un résumé accrocheur (2-3 phrases max) pour "${title}" catégorie "${category}". ${artistInfo} ${context || ''} Réponds uniquement avec le résumé.`
      : `Tu es rédacteur professionnel KKD Music. Rédige un article complet sur "${title}" (${category}). ${artistInfo} ${excerpt || ''} ${context || ''} En français, ton dynamique. Structure avec paragraphes. Pas de titre principal.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    return Response.json({ text: typeof result === 'string' ? result : String(result ?? '') });
  } catch (error) {
    console.error('generateNewsArticle error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}