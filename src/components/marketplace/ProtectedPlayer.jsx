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
    <div className="space-y-2 select-none bg-card rounded-2xl border border-border/40 p-3 shadow-sm" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck size={14} className="shrink-0" />
        <span className="text-[11px] font-mono uppercase tracking-widest">Lecture sur KKD uniquement</span>
      </div>
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
      <p className="text-[10px] text-muted-foreground">
        Téléchargement et extraction désactivés.
      </p>
    </div>
  );
}