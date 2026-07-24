import React from 'react';

/**
 * QR code avec l'affiche de l'événement centrée.
 * Niveau de correction d'erreur H pour rester scannable malgré le logo central.
 * `value` = données encodées (URL de vérification du billet).
 */
export default function QrWithLogo({ value, image, size = 200 }) {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&ecc=H&margin=0&data=${encodeURIComponent(value)}`;
  const c = Math.round(size * 0.24);
  return (
    <div className="relative inline-block bg-white rounded-xl p-2" style={{ width: size + 16, height: size + 16 }}>
      <img src={qr} alt="QR billet" width={size} height={size} className="block" />
      {image ? (
        <img
          src={image}
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg object-cover border-[3px] border-white shadow-md bg-white"
          style={{ width: c, height: c }}
        />
      ) : (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-primary flex items-center justify-center border-[3px] border-white"
          style={{ width: c, height: c }}
        >
          <span className="text-white font-display font-extrabold" style={{ fontSize: c * 0.4 }}>K</span>
        </div>
      )}
    </div>
  );
}