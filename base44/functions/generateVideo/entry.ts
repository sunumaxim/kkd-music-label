import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const DURATION_CREDITS = { 4: 1, 6: 1, 8: 2 };

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const { image_file_uri, action_prompt, duration, aspect_ratio } = await req.json();
    if (!image_file_uri) return Response.json({ error: 'Image manquante' }, { status: 400 });
    const dur = [4, 6, 8].includes(Number(duration)) ? Number(duration) : 6;
    const ar = aspect_ratio === '9:16' ? '9:16' : '16:9';
    const creditsNeeded = DURATION_CREDITS[dur];
    const prompt = (action_prompt || '').trim().slice(0, 500);

    const db = base44.asServiceRole;

    // 1. Solde de crédits
    let credit = (await db.entities.VideoCredit.filter({ user_email: user.email }))[0];
    if (!credit) {
      credit = await db.entities.VideoCredit.create({ user_email: user.email, balance: 0, total_purchased: 0, total_used: 0 });
    }
    if ((credit.balance || 0) < creditsNeeded) {
      return Response.json({ error: 'Crédits insuffisants. Achetez un pack pour générer des vidéos.', balance: credit.balance || 0, needed: creditsNeeded }, { status: 402 });
    }

    // 2. Réserve les crédits avant génération (évite la course)
    const newBalance = (credit.balance || 0) - creditsNeeded;
    const newUsed = (credit.total_used || 0) + creditsNeeded;
    await db.entities.VideoCredit.update(credit.id, { balance: newBalance, total_used: newUsed });
    const gen = await db.entities.VideoGeneration.create({ user_email: user.email, prompt, image_url: image_file_uri, status: 'en_attente', credits_used: creditsNeeded, duration: dur, aspect_ratio: ar });

    try {
      // 3. Signe l'URL de l'image privée pour la lecture IA
      const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: image_file_uri, expires_in: 600 });

      // 4. Description visuelle de l'image via IA (vision) + action souhaitée
      const descRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Décris cette image de façon cinématographique et détaillée pour générer une courte vidéo animée. ` +
          `Identifie le sujet (personne, objet, décor), l'arrière-plan, les couleurs, l'éclairage et l'ambiance. ` +
          (prompt ? `L'action souhaitée par l'utilisateur : « ${prompt} ». Intègre cette action de façon fluide et naturelle. ` : '') +
          `Réponds en français, en 3 à 5 phrases, prête à servir de prompt vidéo. ` +
          `Reste neutre et respectueux : ne produis rien de diffamant, injurieux, ou usurpant l'identité d'une personne réelle identifiable.`,
        file_urls: [signed.signed_url],
      });
      const imageDescription = typeof descRes === 'string' ? descRes : (descRes?.description || JSON.stringify(descRes || ''));

      // 5. Génération vidéo
      const videoPrompt = `${imageDescription}. Animation fluide, réaliste et cinématographique, haute qualité, mouvements naturels.`;
      const videoRes = await base44.integrations.Core.GenerateVideo({ prompt: videoPrompt, duration: dur, aspect_ratio: ar, generate_audio: false });
      const videoUrl = videoRes?.url;
      if (!videoUrl) throw new Error('URL vidéo non renvoyée par le générateur');

      await db.entities.VideoGeneration.update(gen.id, { video_url: videoUrl, status: 'genere', image_description: imageDescription });
      return Response.json({ success: true, video_url: videoUrl, credits_used: creditsNeeded, balance: newBalance });
    } catch (err) {
      // Rembourse les crédits en cas d'échec
      await db.entities.VideoCredit.update(credit.id, { balance: credit.balance, total_used: credit.total_used });
      await db.entities.VideoGeneration.update(gen.id, { status: 'echoue' });
      console.error('[generateVideo] échec génération:', err.message);
      return Response.json({ error: 'Échec de la génération : ' + err.message }, { status: 500 });
    }
  } catch (error) {
    console.error('[generateVideo] fatal', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}