import React, { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * Lecteur on-platform protégé.
 * - Téléchargement désactivé (controlsList nodownload)
 * - Picture-in-picture désactivé
 * - Clic droit / menu contextuel bloqué
 * - Accès via URL signée à durée limitée (fichier privé)
 * Note: aucune solution web ne peut empêcher 100% une capture d'écran matérielle.
 */
export default function ProtectedPlayer({ url, isVideo, title }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prevent = (e) => e.preventDefault();
    el.addEventListener('contextmenu', prevent);
    return () => el.removeEventListener('contextmenu', prevent);
  }, []);

  if (!url) {
    return <p className="text-xs text-muted-foreground">Contenu protégé non disponible.</p>;
  }

  return (
    <div className="space-y-1.5 select-none" onContextMenu={(e) => e.preventDefault()}>
      {isVideo ? (
        <video
          ref={ref}
          src={url}
          controls
          controlsList="nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          className="w-full rounded-xl bg-black"
          title={title}
        />
      ) : (
        <audio
          ref={ref}
          src={url}
          controls
          controlsList="nodownload noplaybackrate noremoteplayback"
          className="w-full"
          title={title}
        />
      )}
      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <ShieldCheck size={11} className="text-primary" />
        Lecture sur KKD uniquement — téléchargement et extraction désactivés.
      </p>
    </div>
  );
}