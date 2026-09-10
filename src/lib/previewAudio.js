/**
 * Convertit une chaîne base64 en URL de blob (pour lecture audio sécurisée).
 * Le blob est local au navigateur et n'expose jamais l'URL du fichier source.
 */
export function base64ToBlobUrl(base64, contentType = 'audio/mpeg') {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  const chunkSize = 0x8000;
  for (let i = 0; i < byteCharacters.length; i += chunkSize) {
    const chunk = byteCharacters.slice(i, i + chunkSize);
    const byteNumbers = new Array(chunk.length);
    for (let j = 0; j < chunk.length; j++) {
      byteNumbers[j] = chunk.charCodeAt(j);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  const blob = new Blob(byteArrays, { type: contentType });
  return URL.createObjectURL(blob);
}

/**
 * Récupère un extrait audio protégé via la fonction backend et renvoie une URL de blob.
 * L'URL du fichier original n'est jamais exposée au client.
 */
export async function fetchProtectedPreview({ itemType, itemId, previewStart = 0, previewDuration = 30 }) {
  const { base44 } = await import('@/api/base44Client');
  const res = await base44.functions.invoke('getProtectedPreview', {
    item_type: itemType,
    item_id: itemId,
    preview_start: previewStart,
    preview_duration: previewDuration,
  });
  // Architecture production : extrait tronqué en base64 → blob URL local
  if (res.data?.audio_base64) {
    return base64ToBlobUrl(res.data.audio_base64, res.data.content_type || 'audio/mpeg');
  }
  // Architecture locale autonome : URL audio directe (demo localStorage)
  if (res.data?.audio_url) {
    return res.data.audio_url;
  }
  return null;
}