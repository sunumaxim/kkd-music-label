import React, { useRef, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Download, Loader2, Film, Scissors, AlertTriangle, Instagram, Facebook, Music2, Video as VideoIcon } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';
const ACCENT = '#E60000';

const FORMATS = {
  story: { w: 720, h: 1280, label: 'Story / Reel · 9:16' },
  square: { w: 720, h: 720, label: 'Carré · 1:1' },
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
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = word; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function slug(s) {
  return String(s || 'promo').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'promo';
}

/**
 * ShortGenerator — génère un clip court (30s / 60s) côté navigateur en combinant
 * l'audio d'un morceau et la pochette (animation Ken Burns + logo KKD + titre).
 * Résultat téléchargeable (.webm) pour partage manuel sur TikTok / Reels / Stories.
 * Publication auto Instagram / Facebook via la pochette (post image + lien).
 */
export default function ShortGenerator({ audioUrl, coverUrl, title, artistName, kind = 'release', shareLink = '', entityId = '' }) {
  const canvasRef = useRef(null);
  const [format, setFormat] = useState('story');
  const [duration, setDuration] = useState(30);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState('');
  const [coverImg, setCoverImg] = useState(null);
  const [logoImg, setLogoImg] = useState(null);
  const [publishing, setPublishing] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    if (!coverUrl) return;
    loadImage(coverUrl).then((img) => active && setCoverImg(img)).catch(() => active && setCoverImg(null));
    return () => { active = false; };
  }, [coverUrl]);

  useEffect(() => {
    let active = true;
    loadImage(LOGO_URL).then((img) => active && setLogoImg(img)).catch(() => active && setLogoImg(null));
    return () => { active = false; };
  }, []);

  // Aperçu statique sur le canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = FORMATS[format];
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    renderFrame(ctx, w, h, coverImg, logoImg, title, artistName, kind, 0, 0);
  }, [format, coverImg, logoImg, title, artistName, kind]);

  useEffect(() => { if (!busy) drawPreview(); }, [drawPreview, busy]);

  const generate = async () => {
    if (!audioUrl) { setError('Aucun fichier audio hébergé sur KKD disponible pour ce contenu.'); return; }
    setError(''); setBusy(true); setProgress(0); setResultUrl(null);
    const canvas = canvasRef.current;
    const { w, h } = FORMATS[format];
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');

    try {
      const audioEl = new Audio();
      audioEl.crossOrigin = 'anonymous';
      audioEl.src = audioUrl;
      audioEl.preload = 'auto';
      await new Promise((res, rej) => { audioEl.oncanplay = res; audioEl.onerror = () => rej(new Error('Chargement audio impossible (CORS).')); audioEl.load(); });

      const AC = window.AudioContext || window.webkitAudioContext;
      const ac = new AC();
      await ac.resume();
      const srcNode = ac.createMediaElementSource(audioEl);
      const dest = ac.createMediaStreamDestination();
      srcNode.connect(dest);
      srcNode.connect(ac.destination);

      const canvasStream = canvas.captureStream(30);
      canvasStream.addTrack(dest.stream.getAudioTracks()[0]);

      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
      const rec = new MediaRecorder(canvasStream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.start();

      audioEl.currentTime = 0;
      await audioEl.play();

      const start = performance.now();
      const tick = () => {
        const elapsed = (performance.now() - start) / 1000;
        const p = Math.min(1, elapsed / duration);
        setProgress(Math.round(p * 100));
        renderFrame(ctx, w, h, coverImg, logoImg, title, artistName, kind, p, elapsed);
        if (p < 1) requestAnimationFrame(tick);
        else {
          audioEl.pause(); rec.stop();
        }
      };
      requestAnimationFrame(tick);

      const stopped = new Promise((res) => { rec.onstop = res; });
      await stopped;
      ac.close();
      const blob = new Blob(chunks, { type: 'video/webm' });
      setResultUrl(URL.createObjectURL(blob));
      setBusy(false);
      toast({ title: 'Short généré', description: `${duration}s — téléchargez et partagez.` });
    } catch (e) {
      setError(e.message || 'Génération échouée. L\'audio doit être hébergé sur KKD (CORS).');
      setBusy(false);
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `KKD_short_${slug(title)}_${duration}s.webm`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const caption = () =>
    `${kind === 'video' ? '🎬' : '🎵'} ${title}${artistName ? ` — ${artistName}` : ''}\n\n` +
    (shareLink ? `🎧 ${shareLink}\n` : '') +
    `#KKDmusic #Nouveauté #${(artistName || 'Music').replace(/\s+/g, '')}`;

  const publish = async (platform) => {
    setPublishing(platform);
    try {
      if (platform === 'instagram') {
        const res = await base44.functions.invoke('publishToInstagram', { content_type: kind, entity_id: entityId });
        // publishToInstagram requires entity_id; for ad-hoc, fall back to direct image post below
        if (res.data?.error) throw new Error(res.data.error);
        toast({ title: 'Publié sur Instagram', description: 'La pochette a été postée.' });
      } else if (platform === 'facebook') {
        const res = await base44.functions.invoke('publishToFacebook', { cover_url: coverUrl, caption: caption(), link: shareLink });
        if (res.data?.error) throw new Error(res.data.error);
        toast({ title: 'Publié sur Facebook', description: res.data?.pages?.length ? `${res.data.pages.length} page(s) publiée(s).` : 'Publié.' });
      }
    } catch (e) {
      toast({ title: 'Échec publication', description: e.message, variant: 'destructive' });
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Scissors size={16} className="text-primary" />
        <h3 className="font-heading font-bold text-base">Générer un short {duration}s</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Coupe l'audio à {duration}s, l'associe à la pochette animée (logo KKD + titre). Téléchargez le clip puis partagez-le sur TikTok / Reels / Stories.
      </p>

      {/* Contrôles */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-mono uppercase text-muted-foreground/70">Format</label>
          <div className="flex gap-2 mt-1">
            {Object.entries(FORMATS).map(([key, f]) => (
              <button key={key} type="button" onClick={() => setFormat(key)}
                className={`flex-1 px-2 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${format === key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] font-mono uppercase text-muted-foreground/70">Durée</label>
          <div className="flex gap-2 mt-1">
            {[30, 60].map((d) => (
              <button key={d} type="button" onClick={() => setDuration(d)}
                className={`flex-1 px-2 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${duration === d ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                {d}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aperçu / résultat */}
      <div className="bg-black/40 rounded-xl p-3 flex justify-center">
        {resultUrl ? (
          <video src={resultUrl} controls className="max-h-[360px] rounded-lg" />
        ) : (
          <canvas ref={canvasRef} className="max-h-[360px] h-auto rounded-lg shadow-lg" />
        )}
      </div>

      {busy && (
        <div className="space-y-1">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground text-center">Génération… {progress}%</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={generate} disabled={busy}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Film size={15} />}
          {busy ? 'Génération…' : 'Générer le short'}
        </button>
        {resultUrl && (
          <button onClick={download}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-secondary text-foreground text-sm font-bold hover:bg-secondary/80">
            <Download size={15} /> Télécharger
          </button>
        )}
        <button onClick={() => publish('instagram')} disabled={publishing === 'instagram' || !coverUrl}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-border text-sm font-semibold hover:border-primary/40 disabled:opacity-50">
          {publishing === 'instagram' ? <Loader2 size={15} className="animate-spin" /> : <Instagram size={15} />} Publier pochette IG
        </button>
        <button onClick={() => publish('facebook')} disabled={publishing === 'facebook' || !coverUrl}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-border text-sm font-semibold hover:border-primary/40 disabled:opacity-50">
          {publishing === 'facebook' ? <Loader2 size={15} className="animate-spin" /> : <Facebook size={15} />} Publier pochette FB
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
        {kind === 'video' ? <VideoIcon size={11} /> : <Music2 size={11} />}
        La publication auto envoie la pochette + lien (le short vidéo se partage manuellement via le téléchargement).
      </p>
    </div>
  );
}

function renderFrame(ctx, w, h, coverImg, logoImg, title, artistName, kind, p, elapsed) {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  // Cover avec zoom doux (Ken Burns)
  if (coverImg) {
    const scale = 1 + p * 0.08;
    const cw = coverImg.width, ch = coverImg.height;
    const base = Math.max(w / cw, h / ch);
    const dw = cw * base * scale, dh = ch * base * scale;
    ctx.drawImage(coverImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1a1a1a'); g.addColorStop(1, '#000');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  // Overlay dégradé bas
  const og = ctx.createLinearGradient(0, h * 0.45, 0, h);
  og.addColorStop(0, 'rgba(0,0,0,0)'); og.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.fillStyle = og; ctx.fillRect(0, h * 0.45, w, h * 0.55);
  // Overlay haut
  const tg = ctx.createLinearGradient(0, 0, 0, h * 0.22);
  tg.addColorStop(0, 'rgba(0,0,0,0.55)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = tg; ctx.fillRect(0, 0, w, h * 0.22);

  const pad = Math.round(w * 0.06);

  // Logo KKD haut gauche
  if (logoImg) {
    const lh = Math.round(h * 0.05);
    const lw = (logoImg.width * lh) / logoImg.height;
    ctx.drawImage(logoImg, pad, pad, lw, lh);
  } else {
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${Math.round(h * 0.035)}px Inter, sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('KKD MUSIC', pad, pad + Math.round(h * 0.04));
  }

  // Tag
  ctx.font = `bold ${Math.round(h * 0.022)}px Inter, sans-serif`;
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(kind === 'video' ? '● NOUVEAU CLIP' : '● NOUVELLE SORTIE', pad, pad + Math.round(h * 0.085));

  // Texte bas
  const baseY = h - pad;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.font = `600 ${Math.round(h * 0.028)}px Inter, sans-serif`;
  ctx.fillStyle = '#cfcfcf';
  ctx.fillText(artistName || '', pad, baseY);

  ctx.font = `800 ${Math.round(h * 0.058)}px Inter, sans-serif`;
  ctx.fillStyle = '#fff';
  const lines = wrap(ctx, title, w - pad * 2).slice(0, 2);
  const lineH = Math.round(h * 0.07);
  const titleBottom = baseY - Math.round(h * 0.045);
  lines.forEach((ln, i) => ctx.fillText(ln, pad, titleBottom - (lines.length - 1 - i) * lineH));

  // Barre de progression
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(0, h - 4, w, 4);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, h - 4, w * p, 4);
}