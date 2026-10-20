import React, { useMemo } from 'react';
import qrcode from '@/lib/vendor/qrcode-generator';

/**
 * QR code généré localement (aucune donnée envoyée à un service tiers : le lien de vérification
 * contient le sceau de sécurité du billet et ne doit jamais quitter l'application).
 * Correction d'erreur H : reste scannable avec l'image centrale.
 */
export default function QrWithLogo({ value, image, size = 200 }) {
  const { n, path } = useMemo(() => {
    const qr = qrcode(0, 'H');
    qr.addData(String(value || ''));
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { n, path: d };
  }, [value]);
  const c = Math.round(size * 0.22);
  return (
    <div className="relative inline-block bg-white rounded-xl p-2" style={{ width: size + 16, height: size + 16 }}>
      <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label="QR code du billet" className="block">
        <rect width={n} height={n} fill="#fff" />
        <path d={path} fill="#000" />
      </svg>
      {image ? (
        <img src={image} alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg object-cover border-[3px] border-white shadow-md bg-white" style={{ width: c, height: c }} />
      ) : (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black flex items-center justify-center border-[3px] border-white" style={{ width: c, height: c }}>
          <span className="text-white font-display font-extrabold" style={{ fontSize: c * 0.4 }}>K</span>
        </div>
      )}
    </div>
  );
}
