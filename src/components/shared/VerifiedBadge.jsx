import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Building2, Music2 } from 'lucide-react';

/**
 * Badge de certification officiel KKD Music & NIA.
 * Rosette à 12 pétales, dégradé rouge→noir, motif d'égaliseur en arrière-plan,
 * coche blanche centrée, bordure métallique argentée + halo doux.
 * 
 * Lorsqu'un utilisateur clique sur le badge (mode interactive),
 * une fenêtre d'information élégante s'ouvre pour indiquer
 * que cette certification est attribuée par le label.
 */

// Construit le tracé d'une rosette scallopée (pétales) à partir de rayons int/ext.
function rosettePath(cx, cy, R, r, petals) {
  let d = '';
  for (let i = 0; i < petals; i++) {
    const a0 = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 0.5) / petals) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / petals) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    if (i === 0) d += `M${x0.toFixed(2)} ${y0.toFixed(2)} `;
    d += `Q${x1.toFixed(2)} ${y1.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)} `;
  }
  return d + 'Z';
}

function RosetteSvg({ size = 18 }) {
  const body = useMemo(() => rosettePath(16, 16, 14.6, 11.6, 12), []);
  const border = useMemo(() => rosettePath(16, 16, 15.4, 11.6, 12), []);
  const glowOpacity = size < 20 ? 0.22 : 0.45;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="Artiste certifié KKD Music"
      role="img"
    >
      <defs>
        <linearGradient id={`kkd-grad-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E11D2E" />
          <stop offset="52%" stopColor="#B31524" />
          <stop offset="100%" stopColor="#0D0D0D" />
        </linearGradient>
        <linearGradient id={`kkd-silver-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="42%" stopColor="#C7CAD0" />
          <stop offset="70%" stopColor="#8E9197" />
          <stop offset="100%" stopColor="#F2F2F5" />
        </linearGradient>
        <linearGradient id={`kkd-check-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EDEFF2" />
        </linearGradient>
        <filter id={`kkd-glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Halo rouge doux */}
      <path d={body} fill="#E11D2E" opacity={glowOpacity} filter="blur(2px)" />

      {/* Corps de la rosette */}
      <path d={body} fill={`url(#kkd-grad-${size})`} />

      {/* Motif musical : égaliseur subtil en arrière-plan */}
      <g opacity="0.28" fill="#0D0D0D">
        <rect x="12.4" y="13.2" width="1.5" height="5.6" rx="0.75" />
        <rect x="15.25" y="11" width="1.5" height="8.6" rx="0.75" />
        <rect x="18.1" y="13.8" width="1.5" height="5" rx="0.75" />
      </g>

      {/* Coche blanche */}
      <path
        d="M10.6 16.4 L14.2 20 L21.6 11.8"
        stroke={`url(#kkd-check-${size})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{ filter: 'drop-shadow(0 0.6px 0.4px rgba(0,0,0,0.55))' }}
      />

      {/* Bordure métallique */}
      <path d={border} fill="none" stroke={`url(#kkd-silver-${size})`} strokeWidth="1.1" />
    </svg>
  );
}

export default function VerifiedBadge({
  size = 18,
  showLabel = false,
  className = '',
  interactive = false,
  artistName = '',
  labelName = 'KKD Music',
  onClick,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Fermer la modale avec la touche Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (interactive) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
    }
  };

  const badgeContent = (
    <span
      className={`inline-flex items-center gap-1.5 align-middle select-none ${
        interactive ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : ''
      } ${className}`}
      title={interactive ? 'Certification attribuée par le label (cliquez pour plus de détails)' : 'Artiste certifié par le label'}
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e) : undefined}
      aria-label={interactive ? "Certification attribuée par le label — Ouvrir les informations" : "Artiste certifié par le label"}
    >
      <RosetteSvg size={size} />

      {showLabel && (
        <span className="text-[11px] font-bold uppercase tracking-wide text-primary">
          Certifié
        </span>
      )}
    </span>
  );

  return (
    <>
      {badgeContent}

      {/* Modal d'information sur la certification accordée par le label */}
      {interactive && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              {/* Fond assombri */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              />

              {/* Boîte de dialogue */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md rounded-2xl bg-[#141821] border border-white/[0.12] p-6 shadow-2xl z-10 text-white space-y-5"
              >
                {/* Bouton fermeture */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>

                {/* En-tête avec Rosette géante */}
                <div className="flex flex-col items-center text-center space-y-3 pt-2">
                  <div className="p-3 rounded-full bg-primary/10 border border-primary/20 shadow-inner">
                    <RosetteSvg size={48} />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-white tracking-tight">
                      Certification du Label
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Attribuée par le label officiel <span className="text-white font-medium">{labelName}</span>
                    </p>
                  </div>
                </div>

                {/* Explication claire & conforme */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3 text-xs text-zinc-300 leading-relaxed">
                  <div className="flex items-start gap-3">
                    <Building2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Attribution officielle par le label</span>
                      <span>
                        Cette certification confirme que le compte de {artistName ? <strong className="text-white">{artistName}</strong> : "cet artiste"} a été vérifié, validé et approuvé par la direction du label.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2 border-t border-white/[0.06]">
                    <Music2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Catalogue & Collaborations certifiés</span>
                      <span>
                        Toutes les sorties musicales, albums, featurings et informations publiés sur ce profil sont directement liés aux canaux officiels de l'artiste.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2 border-t border-white/[0.06]">
                    <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Authenticité & Confiance</span>
                      <span>
                        Ce badge protège l'identité artistique de l'artiste contre toute usurpation et assure aux auditeurs qu'ils interagissent avec le profil officiel.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton de confirmation */}
                <div className="pt-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-colors shadow-lg shadow-primary/20"
                  >
                    Compris
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}