import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Video, Download, Loader2, Music, AlertTriangle, Sparkles, Upload } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';
const ACCENT = '#E60000';

const DURATIONS = [
  { s: 10, label: '10s' },
  { s: 15, label: '15s' },
  { s: 30, label: '30s' },
];

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

function drawPoster(ctx, W, H, cover, logo, release, t) {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  if (cover) {
    const scale = Math.max(W / cover.width, H / cover.height) * (1 + t * 0.08);
    const dw = cover.width * scale;
    const dh = cover.height * scale;
    const dx = (W - dw) / 2 - t * W * 0.04;
    const dy = (H - dh) / 2;
    ctx.drawImage(cover, dx, dy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#1a1a1a'); g.addColorStop(1, '#000000');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  const og = ctx.createLinearGradient(0, H * 0.4, 0, H);
  og.addColorStop(0, 'rgba(0,0,0,0)'); og.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.fillStyle = og; ctx.fillRect(0, H * 0.4, W, H * 0.6);

  const tg = ctx.createLinearGradient(0, 0, 0, H * 0.22);
  tg.addColorStop(0, 'rgba(0,0,0,0.55)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H * 0.22);

  const pad = Math.round(W * 0.06);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  if (logo) {
    const lh = Math.round(H * 0.07);
    const lw = (logo.width * lh) / logo.height;
    ctx.drawImage(logo, pad, pad, lw, lh);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${Math.round(H * 0.04)}px Syne, sans-serif`;
    ctx.fillText('KKD MUSIC', pad, pad + Math.round(H * 0.045));
  }

  const baseY = H - pad;
  ctx.font = `600 ${Math.round(H * 0.032)}px Inter, sans-serif`;
  ctx.fillStyle = '#cfcfcf';
  ctx.fillText(release?.artist_name || '', pad, baseY);

  ctx.font = `800 ${Math.round(H * 0.06)}px Syne, Inter, sans-serif`;
  ctx.fillStyle = '#ffffff';
  const lines = wrap(ctx, release?.title, W - pad * 2).slice(0, 2);
  const lineH = Math.round(H * 0.075);
  const titleBottom = baseY - Math.round(H * 0.05);
  lines.forEach((ln, i) => ctx.fillText(ln, pad, titleBottom - (lines.length - 1 - i) * lineH));

  ctx.font = `bold ${Math.round(H * 0.024)}px Inter, sans-serif`;
  ctx.fillStyle = ACCENT;
  ctx.fillText('● NOUVELLE SORTIE', pad, titleBottom - lines.length * lineH - Math.round(H * 0.02));

  // Barre de progression
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(0, H - 6, W, 6);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, H - 6, W * t, 6);
}

function slug(s) {
  return String(s || 'promo').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'promo';
}

export default function PartnerPromoVideo({ artistName }) {
  const canvasRef = useRef(null);
  const [duration, setDuration] = useState(15);
  const [selectedId, setSelectedId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState('');
  const [coverImg, setCoverImg] = useState(null);
  const [logoImg, setLogoImg] = useState(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const { data: releases = [] } = useQuery({
    queryKey: ['partner-promo-releases', artistName],
    queryFn: () => base44.entities.Release.filter({ artist_name: artistName }, '-release_date'),
    enabled: !!artistName,
  });

  const selected = releases.find(r => r.id === selectedId) || releases[0] || null;

  useEffect(() => {
    let active = true;
    loadImage(LOGO_URL).then(img => { if (active) setLogoImg(img); }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selected?.cover_url) { setCoverImg(null); return; }
    loadImage(selected.cover_url).then(img => { if (active) setCoverImg(img); }).catch(() => setCoverImg(null));
    return () => { active = false; };
  }, [selected?.cover_url]);

  // Aperçu statique
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selected) return;
    canvas.width = 720; canvas.height = 720;
    drawPoster(canvas.getContext('2d'), 720, 720, coverImg, logoImg, selected, 0);
  }, [coverImg, logoImg, selected]);

  const uploadAudio = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setUploadedAudioUrl(res.file_url);
    } finally {
      setUploadingAudio(false);
    }
  };

  const generate = async () => {
    if (!selected) return;
    setError(''); setResultUrl(null); setGenerating(true); setProgress(0);
    const canvas = canvasRef.current;
    const W = 720, H = 720;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    let audioEl = null, audioCtx = null;
    try {
      let audioUrl = uploadedAudioUrl;
      if (!audioUrl && selected.protected_file_uri) {
        const s = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: selected.protected_file_uri, expires_in: 180 });
        audioUrl = s.signed_url;
      }
      if (!audioUrl) {
        setError('Fournissez un fichier audio pour générer la vidéo : téléversez un extrait de la sortie, ou ajoutez un fichier protégé à la sortie côté admin.');
        setGenerating(false);
        return;
      }

      const fps = 30;
      const videoStream = canvas.captureStream(fps);
      const tracks = [...videoStream.getVideoTracks()];

      if (audioUrl) {
        audioEl = new Audio(audioUrl);
        audioEl.crossOrigin = 'anonymous';
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        const srcNode = audioCtx.createMediaElementSource(audioEl);
        const dest = audioCtx.createMediaStreamDestination();
        srcNode.connect(dest);
        srcNode.connect(audioCtx.destination);
        tracks.push(...dest.stream.getAudioTracks());
      }

      const combined = new MediaStream(tracks);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';
      const rec = new MediaRecorder(combined, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setResultUrl(URL.createObjectURL(blob));
        setGenerating(false);
        setProgress(100);
        if (audioEl) audioEl.pause();
        if (audioCtx) audioCtx.close();
        // Redessine l'aperçu statique
        drawPoster(ctx, W, H, coverImg, logoImg, selected, 0);
      };

      rec.start();
      if (audioEl) { try { await audioEl.play(); } catch {} }

      const start = performance.now();
      const dur = duration * 1000;
      const frame = (now) => {
        const t = Math.min(1, (now - start) / dur);
        setProgress(Math.round(t * 100));
        drawPoster(ctx, W, H, coverImg, logoImg, selected, t);
        if (now - start < dur) requestAnimationFrame(frame);
        else rec.stop();
      };
      requestAnimationFrame(frame);
    } catch (e) {
      setError('Génération impossible : ' + (e?.message || 'erreur inconnue'));
      setGenerating(false);
      if (audioEl) audioEl.pause();
      if (audioCtx) audioCtx.close();
      drawPoster(ctx, W, H, coverImg, logoImg, selected, 0);
    }
  };

  if (!artistName) return null;

  if (releases.length === 0) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-6 text-center">
        <Video size={32} className="mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Aucune sortie trouvée pour « {artistName} ». Publiez d'abord une sortie pour générer une vidéo promo.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <h3 className="font-heading font-bold text-base">Studio vidéo promo</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Génère automatiquement une courte vidéo (pochette animée + extrait audio) avec le logo KKD Music, prête à partager sur TikTok, Instagram et WhatsApp.
      </p>

      {/* Choix de la sortie */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60">Choisir une sortie</label>
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {releases.map(r => (
            <button key={r.id} type="button" onClick={() => { setSelectedId(r.id); setResultUrl(null); setUploadedAudioUrl(null); setError(''); }}
              className={`shrink-0 w-16 text-center ${selected?.id === r.id ? '' : 'opacity-60 hover:opacity-100'}`}>
              <div className={`w-16 h-16 rounded-lg overflow-hidden bg-secondary border-2 ${selected?.id === r.id ? 'border-primary' : 'border-transparent'}`}>
                {r.cover_url
                  ? <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Music size={16} className="text-muted-foreground" /></div>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Aperçu */}
      <div className="bg-black/40 rounded-xl p-3 flex justify-center">
        <canvas ref={canvasRef} className="w-full max-w-[300px] h-auto rounded-lg" />
      </div>

      {/* Durée */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Durée de l'extrait :</span>
        {DURATIONS.map(d => (
          <button key={d.s} type="button" onClick={() => setDuration(d.s)} disabled={generating}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${duration === d.s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60">Audio de l'extrait *</label>
        {selected?.protected_file_uri && !uploadedAudioUrl && (
          <p className="text-[11px] text-muted-foreground">Le fichier sécurisé de la sortie sera utilisé pour le son.</p>
        )}
        <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors w-fit">
          <Upload size={14} />
          {uploadingAudio ? 'Envoi…' : uploadedAudioUrl ? 'Audio chargé ✓ (cliquer pour changer)' : 'Téléverser un extrait audio (.mp3, .wav, .m4a)'}
          <input type="file" className="hidden" onChange={uploadAudio} accept="audio/*" />
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button onClick={generate} disabled={generating || !selected || (!uploadedAudioUrl && !selected?.protected_file_uri)} className="w-full gap-2">
        {generating ? <><Loader2 size={15} className="animate-spin" /> Génération… {progress}%</> : <><Video size={15} /> Générer la vidéo promo</>}
      </Button>

      {resultUrl && (
        <div className="space-y-3">
          <video src={resultUrl} controls className="w-full rounded-xl bg-black" />
          <a href={resultUrl} download={`KKD_${slug(selected?.title)}_promo.webm`}
            className="flex items-center justify-center gap-2 w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Download size={15} /> Télécharger la vidéo (.webm)
          </a>
        </div>
      )}
    </div>
  );
}