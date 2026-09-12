import { useEffect, useState } from 'react';
import { storageService } from '@/services';

/**
 * usePlayableUrl — résout une URL lisible pour un fichier audio/vidéo.
 * Si l'URL est publique (http), la renvoie directement.
 * Si c'est un file_uri privé (contenu vendu), génère une URL signée temporaire.
 */
export function usePlayableUrl(fileUrl) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!fileUrl) { setUrl(null); return; }
    if (fileUrl.startsWith('http')) { setUrl(fileUrl); return; }
    setLoading(true);
    (async () => {
      try {
        const signedUrl = await storageService.getSignedUrl(fileUrl);
        if (active) setUrl(signedUrl);
      } catch {
        if (active) setUrl(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [fileUrl]);

  return { url, loading };
}