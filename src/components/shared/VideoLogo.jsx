import React, { useRef, useState } from 'react';

const VIDEO_LOGO_URL = "https://media.base44.com/videos/public/6a1cbc29f199c6e829efde07/2ca3c28b4_video.mp4";

/**
 * Logo animé KKD — utilise la vidéo fournie en boucle silencieuse.
 * Repasse sur une image statique si la vidéo échoue.
 */
import { LOGO_MAIN } from '@/lib/logos';
const FALLBACK_IMG = LOGO_MAIN;

export default function VideoLogo({ className = "h-12 w-auto", containerClass = "" }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <img src={FALLBACK_IMG} alt="KKD Music" className={className} />;
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${containerClass}`} style={{ display: 'inline-block' }}>
      <video
        ref={videoRef}
        src={VIDEO_LOGO_URL}
        autoPlay
        muted
        loop
        playsInline
        onError={() => setFailed(true)}
        className={className}
        style={{ objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}