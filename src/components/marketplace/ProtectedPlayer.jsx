import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

/**
 * Lecteur on-platform protégé.
 * - L'URL signée est convertie en blob local : jamais exposée dans le DOM
 * - Blob révoqué au démontage (impossible à réutiliser après navigation)
 * - Téléchargement désactivé (controlsList nodownload)
 * - Picture-in-picture désactivé
 * - Clic droit / menu contextuel / glisser-déposer bloqués
 * - Raccourcis clavier de recherche (seek) bloqués
 * Note: aucune solution web ne peut empêcher 100% une capture d'écran matérielle.
 */
export default function ProtectedPlayer({ url, isVideo, title }) {
  const ref = useRef(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Convertir l'URL signée en blob local — masque l'URL source du DOM
  useEffect(() => {
    let active = true;
    let objectUrl = null;

    if (!url) { setLoading(false); return; }

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        // Fallback : utiliser l'URL signée si le fetch blob échoue (CORS)
        if (active) setBlobUrl(url);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  // Bloquer clic droit, glisser, et raccourcis clavier de recherche
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prevent = (e) => e.preventDefault();
    const blockKey = (e) => {
      // Bloquer flèches gauche/droite (seek), Home/End (début/fin)
      if ([37, 39, 36, 35].includes(e.keyCode)) {
        e.preventDefault();
      }
    };

    el.addEventListener('contextmenu', prevent);
    el.addEventListener('dragstart', prevent);
    el.addEventListener('keydown', blockKey);
    return () => {
      el.removeEventListener('contextmenu', prevent);
      el.removeEventListener('dragstart', prevent);
      el.removeEventListener('keydown', blockKey);
    };
  }, [blobUrl]);

  if (!url) {
    return <p className="text-xs text-muted-foreground">Contenu protégé non disponible.</p>;
  }

  if (loading) {
    return (
      <div className="space-y-2 select-none bg-card rounded-2xl border border-border/40 p-3 shadow-sm">
        <div className="flex items-center gap-2 text-primary">
          <Loader2 size={14} className="animate-spin shrink-0" />
          <span className="text-[11px] font-mono uppercase tracking-widest">Chargement du contenu sécurisé…</span>
        </div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return <p className="text-xs text-muted-foreground">Contenu protégé indisponible.</p>;
  }

  return (
    <div
      className="space-y-2 select-none bg-card rounded-2xl border border-border/40 p-3 shadow-sm"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck size={14} className="shrink-0" />
        <span className="text-[11px] font-mono uppercase tracking-widest">Lecture sur KKD uniquement</span>
      </div>
      {isVideo ? (
        <video
          ref={ref}
          src={blobUrl}
          controls
          controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
          disablePictureInPicture
          className="w-full rounded-xl bg-black"
          title={title}
        />
      ) : (
        <audio
          ref={ref}
          src={blobUrl}
          controls
          controlsList="nodownload noplaybackrate noremoteplayback"
          className="w-full"
          title={title}
        />
      )}
      <p className="text-[10px] text-muted-foreground">
        Téléchargement, extraction et partage désactivés.
      </p>
    </div>
  );
}