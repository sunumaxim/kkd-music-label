/**
 * Rédaction assistée par IA du corps d'un email de campagne KKD Music.
 * Réservé aux admins (espace d'administration mailing).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const TONE_PROMPTS = {
  institutionnel: "Ton solennel, prestigieux, diplomatique, rédigé avec l'autorité bienveillante d'Abdoulaye Sylla, Gestionnaire Principal de KKD Music.",
  chaleureux: "Ton dynamique, chaleureux, passionné par la musique africaine, célébrant la créativité des artistes et fédérant la communauté KKD.",
  commercial: "Ton convaincant, axé sur les opportunités business de distribution (90% de royalties), la visibilité internationale et l'accompagnement d'excellence.",
  vip: "Ton luxueux, exclusif, invitant à une expérience VIP privilégiée avec une formulation soignée.",
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { user = null; }
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Réservé admin' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { headline, subject, tone, promoted } = body;
    if (!headline) return Response.json({ error: 'Titre du message manquant' }, { status: 400 });

    const toneRule = TONE_PROMPTS[tone] || TONE_PROMPTS.institutionnel;
    const promotedLine = promoted
      ? `Élément promu : ${JSON.stringify({ type: promoted.type, title: promoted.title, artist: promoted.artist || '' })}\n`
      : '';

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Tu es Abdoulaye Sylla, Gestionnaire Principal de KKD Music Label Group (Dakar et international).
Rédige le corps d'un email officiel et stylé pour la communauté KKD.
Titre du message : "${headline}"
Sujet actuel : "${subject || ''}"
${promotedLine}Consigne de ton : ${toneRule}
Règles :
- Longueur : 3 à 4 paragraphes percutants et fluides
- En français impeccable, élégant et soigné
- Pas de code HTML, pas de balises, texte brut avec sauts de lignes naturels
- Termine par une formule de salutation professionnelle adaptée à Abdoulaye Sylla`,
      response_json_schema: {
        type: 'object',
        properties: { body: { type: 'string' } },
      },
    });

    return Response.json({ body: res?.body || '' });
  } catch (error) {
    console.error('generateMailingBody error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}