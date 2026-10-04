import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';

const DAILY_LIMIT = 2;

const KKD_WATERMARK_NOTE =
  ` Un petit logo en filigrane « KKD Music » (texte discret, blanc et orange) ` +
  `doit rester visible en haut à gauche de l'image tout au long de la vidéo, ` +
  `subtil et élégant, semi-transparent, pour indiquer que la vidéo est diffusée sur la plateforme KKD Music.`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const image_file_uri = body.image_file_uri;
    if (!image_file_uri) return Response.json({ error: 'Image manquante' }, { status: 400 });

    const dur = [4, 6, 8].includes(Number(body.duration)) ? Number(body.duration) : 6;
    const ar = body.aspect_ratio === '9:16' ? '9:16' : '16:9';
    const prompt = (body.action_prompt || '').trim().slice(0, 500);
    const songTitle = (body.release_title || '').trim().slice(0, 120);
    const songArtist = (body.artist_name || '').trim().slice(0, 120);
    const exStart = Math.max(0, Number(body.excerpt_start) || 0);
    const exDur = Math.min(30, Math.max(1, Number(body.excerpt_duration) || dur));
    const audioFileUrl = (body.audio_file_url || '').trim().slice(0, 2048);

    const db = base44.asServiceRole;

    // --- Quota quotidien (2 générations / utilisateur / jour UTC) ---
    const todayUTC = new Date().toISOString().slice(0, 10);
    const todayRecords = await db.entities.VideoGeneration.filter({ user_email: user.email, quota_date: todayUTC });
    const activeCount = todayRecords.filter(r => r.status !== 'echoue').length;
    if (activeCount >= DAILY_LIMIT) {
      const reset = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1, 0, 0, 0);
      return Response.json({ error: 'quota_epuise', reset_at: reset, remaining: 0 }, { status: 429 });
    }

    // --- Réservation atomique : création du record en_attente ---
    const gen = await db.entities.VideoGeneration.create({
      user_email: user.email,
      prompt,
      image_url: image_file_uri,
      status: 'en_attente',
      duration: dur,
      aspect_ratio: ar,
      release_id: body.release_id || '',
      release_title: songTitle,
      artist_name: songArtist,
      audio_file_url: audioFileUrl,
      excerpt_start: exStart,
      excerpt_duration: exDur,
      quota_date: todayUTC,
    });

    // --- Lance la génération en arrière-plan, retourne immédiatement ---
    waitUntil(processGeneration(base44, gen.id, image_file_uri, prompt, songTitle, songArtist, dur, ar));

    return Response.json({
      generation_id: gen.id,
      status: 'en_attente',
      remaining: DAILY_LIMIT - activeCount - 1,
    });
  } catch (error) {
    console.error('[generateVideo] fatal', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function processGeneration(base44, genId, imageUri, prompt, songTitle, songArtist, dur, ar) {
  const db = base44.asServiceRole;
  try {
    // Signe l'URL de l'image privée pour la lecture IA
    const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: imageUri, expires_in: 600 });

    const songContext = songTitle
      ? `Cette vidéo illustre le morceau « ${songTitle} »${songArtist ? ` de ${songArtist}` : ''}. ` +
        `L'ambiance visuelle doit évoquer le rythme et l'émotion d'un clip musical. `
      : '';

    const descRes = await base44.integrations.Core.InvokeLLM({
      prompt: `Décris cette image de façon cinématographique et détaillée pour générer une courte vidéo animée. ` +
        `Identifie le sujet (personne, objet, décor), l'arrière-plan, les couleurs, l'éclairage et l'ambiance. ` +
        songContext +
        (prompt ? `L'action souhaitée par l'utilisateur : « ${prompt} ». Intègre cette action de façon fluide et naturelle. ` : '') +
        `Réponds en français, en 3 à 5 phrases, prête à servir de prompt vidéo. ` +
        `Reste neutre et respectueux : ne produis rien de diffamant, injurieux, ou usurpant l'identité d'une personne réelle identifiable.`,
      file_urls: [signed.signed_url],
    });
    const imageDescription = typeof descRes === 'string' ? descRes : (descRes?.description || JSON.stringify(descRes || ''));

    const videoPrompt = `${imageDescription}. Animation fluide, réaliste et cinématographique, haute qualité, mouvements naturels.${KKD_WATERMARK_NOTE}`;
    const videoRes = await base44.integrations.Core.GenerateVideo({ prompt: videoPrompt, duration: dur, aspect_ratio: ar, generate_audio: false });
    const videoUrl = videoRes?.url;
    if (!videoUrl) throw new Error('URL vidéo non renvoyée par le générateur');

    await db.entities.VideoGeneration.update(genId, { video_url: videoUrl, status: 'genere', image_description: imageDescription });
  } catch (err) {
    console.error('[generateVideo] échec génération:', err.message);
    try { await db.entities.VideoGeneration.update(genId, { status: 'echoue' }); } catch (_) {}
  }
}