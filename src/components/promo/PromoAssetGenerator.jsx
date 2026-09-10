import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Megaphone, AlertTriangle } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';
const ACCENT = '#E60000';

const FORMATS = {
  square: { w: 1080, h: 1080, label: 'Carré · 1:1', hint: 'Instagram / Facebook' },
  story: { w: 1080, h: 1920, label: 'Story · 9:16', hint: 'Stories / TikTok' },
  landscape: { w: 1200, h: 630, label: 'Paysage · 1,91:1', hint: 'Twitter / liens' },
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(ctx, text, maxW) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? cur + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function slug(s) {
  return String(s || 'promo').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'promo';
}

/**
 * Générateur d'affiche promo « DistroKid-style » : compose une affiche avec la
 * pochette + logo KKD superposé + titre/artiste, téléchargeable en PNG pour
 * partage sur les réseaux sociaux. Fonctionne sans serveur (canvas).
 */
export default function PromoAssetGenerator({ coverUrl, title, artistName, kind = 'release' }) {
  const canvasRef = useRef(null);
  const [format, setFormat] = useState('square');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [coverImg, setCoverImg] = useState(null);
  const [logoImg, setLogoImg] = useState(null);

  useEffect(() => {
    let active = true;
    if (!coverUrl) return;
    loadImage(coverUrl)
      .then((img) => { if (active) setCoverImg(img); })
      .catch(() => { if (active) setCoverImg(null); });
    return () => { active = false; };
  }, [coverUrl]);

  useEffect(() => {
    let active = true;
    loadImage(LOGO_URL)
      .then((img) => { if (active) setLogoImg(img); })
      .catch(() => { if (active) setLogoImg(null); });
    return () => { active = false; };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = FORMATS[format];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Fond
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // Pochette (cover-fit)
    if (coverImg) {
      const scale = Math.max(w / coverImg.width, h / coverImg.height);
      const dw = coverImg.width * scale;
      const dh = coverImg.height * scale;
      ctx.drawImage(coverImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
    } else {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#1a1a1a');
      g.addColorStop(1, '#000000');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // Overlay lisibilité
    const og = ctx.createLinearGradient(0, h * 0.4, 0, h);
    og.addColorStop(0, 'rgba(0,0,0,0)');
    og.addColorStop(1, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = og;
    ctx.fillRect(0, h * 0.4, w, h * 0.6);

    const tg = ctx.createLinearGradient(0, 0, 0, h * 0.22);
    tg.addColorStop(0, 'rgba(0,0,0,0.55)');
    tg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tg;
    ctx.fillRect(0, 0, w, h * 0.22);

    // Logo KKD en haut à gauche
    const pad = Math.round(w * 0.06);
    if (logoImg) {
      const lh = Math.round(h * 0.06);
      const lw = (logoImg.width * lh) / logoImg.height;
      ctx.drawImage(logoImg, pad, pad, lw, lh);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${Math.round(h * 0.04)}px Syne, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('KKD MUSIC', pad, pad + Math.round(h * 0.045));
    }

    // Texte bas
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const baseY = h - pad;

    // Artiste
    ctx.font = `600 ${Math.round(h * 0.032)}px Inter, sans-serif`;
    ctx.fillStyle = '#cfcfcf';
    ctx.fillText(artistName || '', pad, baseY);

    // Titre (2 lignes max)
    ctx.font = `800 ${Math.round(h * 0.066)}px Syne, Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    const lines = wrap(ctx, title, w - pad * 2).slice(0, 2);
    const lineH = Math.round(h * 0.08);
    const titleBottom = baseY - Math.round(h * 0.05);
    lines.forEach((ln, i) => {
      ctx.fillText(ln, pad, titleBottom - (lines.length - 1 - i) * lineH);
    });

    // Tag "NOUVELLE SORTIE" / "NOUVEAU CLIP"
    ctx.font = `bold ${Math.round(h * 0.024)}px Inter, sans-serif`;
    ctx.fillStyle = ACCENT;
    const tagY = titleBottom - lines.length * lineH - Math.round(h * 0.02);
    ctx.fillText(kind === 'video' ? '● NOUVEAU CLIP' : '● NOUVELLE SORTIE', pad, tagY);

    // Badge "Disponible sur KKD Music" en bas à droite
    const badgeText = 'Disponible sur KKD Music';
    ctx.font = `600 ${Math.round(h * 0.022)}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'right';
    ctx.fillText(badgeText, w - pad, baseY);
  }, [format, coverImg, logoImg, title, artistName, kind]);

  useEffect(() => { draw(); }, [draw]);

  const download = () => {
    setBusy(true);
    setError('');
    try {
      canvasRef.current.toBlob((blob) => {
        if (!blob) {
          setError("L'image de pochette provient d'une source externe qui bloque l'export. Utilisez une pochette hébergée sur KKD Music.");
          setBusy(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `KKD_${slug(title)}_${format}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setBusy(false);
      }, 'image/png');
    } catch {
      setError("Export impossible. La pochette vient d'une source externe sans autorisation CORS.");
      setBusy(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Megaphone size={16} className="text-primary" />
        <h3 className="font-heading font-bold text-base">Kit promo — Affiche à partager</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Affiche générée automatiquement avec le logo KKD Music. Choisissez le format, téléchargez et partagez sur vos réseaux.
      </p>

      {/* Aperçu */}
      <div className="bg-black/40 rounded-xl p-3 mb-4 flex justify-center">
        <canvas ref={canvasRef} className="w-full max-w-[320px] h-auto rounded-lg shadow-lg" />
      </div>

      {/* Formats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries(FORMATS).map(([key, f]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFormat(key)}
            className={`px-2 py-2 rounded-lg text-center border transition-colors ${
              format === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            <span className="block text-xs font-bold">{f.label}</span>
            <span className="block text-[10px] opacity-70">{f.hint}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5 mb-3">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button onClick={download} disabled={busy} className="w-full gap-2">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        Télécharger l'affiche (.png)
      </Button>
    </div>
  );
}