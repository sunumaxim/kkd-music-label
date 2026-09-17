import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * getProtectedPreview — renvoie un extrait audio tronqué (30s) d'un fichier protégé.
 * Le client ne reçoit JAMAIS l'URL signée du fichier complet : la fonction
 * fetch le fichier côté serveur, ne garde que les premiers octets correspondant
 * à la durée de l'extrait, et renvoie les données audio en base64.
 *
 * Request: { item_type: 'release' | 'video', item_id, preview_start?, preview_duration? }
 * Response: { audio_base64, content_type, size } | { error }
 */
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { item_type, item_id } = body;

    if (!item_type || !item_id) {
      return Response.json({ error: 'item_type and item_id required' }, { status: 400 });
    }

    // Récupérer l'entité côté serveur (service role) pour obtenir le file_uri protégé
    let entity;
    if (item_type === 'release') {
      const items = await base44.asServiceRole.entities.Release.filter({ id: item_id });
      entity = items[0];
    } else if (item_type === 'video') {
      const items = await base44.asServiceRole.entities.Video.filter({ id: item_id });
      entity = items[0];
    } else {
      return Response.json({ error: 'Invalid item_type' }, { status: 400 });
    }

    if (!entity) {
      return Response.json({ error: 'Entity not found' }, { status: 404 });
    }

    const fileUri = entity.protected_file_uri;
    if (!fileUri) {
      return Response.json({ error: 'No protected file' }, { status: 404 });
    }

    // Générer l'URL signée côté serveur uniquement (jamais exposée au client)
    const signRes = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
    const signedUrl = signRes.signed_url;
    if (!signedUrl) {
      return Response.json({ error: 'Failed to sign URL' }, { status: 500 });
    }

    // Utiliser les paramètres de prévisualisation stockés sur l'entité (non contrôlables par l'appelant)
    // Plafonné à 30s maximum pour un extrait gratuit
    const previewStart = Number(entity.preview_start || 0);
    const previewDuration = Math.min(Number(entity.preview_duration || 30), 30);
    const totalSeconds = previewStart + previewDuration;
    const maxBytes = Math.min(Math.ceil(totalSeconds * 192 * 1024 / 8), 3 * 1024 * 1024);

    let audioData: ArrayBuffer;
    try {
      const rangeResp = await fetch(signedUrl, {
        headers: { 'Range': `bytes=0-${maxBytes}` },
      });
      if (rangeResp.status === 206) {
        // Range supporté — on ne reçoit que la portion demandée
        audioData = await rangeResp.arrayBuffer();
      } else {
        // Range non supporté — on reçoit tout, on tronque
        const fullData = await rangeResp.arrayBuffer();
        audioData = fullData.slice(0, maxBytes);
      }
    } catch {
      return Response.json({ error: 'Failed to fetch audio' }, { status: 502 });
    }

    // Convertir en base64
    const bytes = new Uint8Array(audioData);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = btoa(binary);

    return Response.json({
      audio_base64: base64,
      content_type: 'audio/mpeg',
      size: bytes.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}