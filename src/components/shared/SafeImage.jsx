import React, { useState } from 'react';

// Image avec chargement différé et repli visuel : si l'affiche est absente,
// supprimée ou indisponible, un visuel de remplacement s'affiche au lieu d'une image cassée.
export default function SafeImage({ src, alt, className, fallback = null }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return fallback;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}