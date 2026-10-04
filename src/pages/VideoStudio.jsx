import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { VIDEO_DURATIONS, VIDEO_ASPECTS } from '@/lib/videoPacks';
import { extractPlayableSongs } from '@/lib/playableSongs';
import SongExcerptPicker from '@/components/studio/SongExcerptPicker';
import VideoWithAudio from '@/components/studio/VideoWithAudio';
import {
  Sparkles, Loader2, Wand2, Film, LogIn, ImageIcon,
  AlertTriangle, History, Clock, Music,
} from 'lucide-react';

const KKD_LOGO = 'https://media.base44.com/images/public/695179b6b73caf48a00876c1/d0c46d8b9_generated_acb63943.png';
const DAILY_LIMIT = 2;

export default function VideoStudio() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [imageUri, setImageUri] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [action, setAction] = useState('');
  const [duration, setDuration] = useState(6);
  const [aspect, setAspect] = useState('16:9');
  const [consent, setConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [genStatus, setGenStatus] = useState(null); // null | 'preparation' | 'generation' | 'termine' | 'echec'
  const [result, setResult] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [excerptStart, setExcerptStart] = useState(0);
  const [excerptDuration, setExcerptDuration] = useState(6);
  const pollRef = useRef(null);

  const todayUTC = new Date().toISOString().slice(0, 10);
  const resetMs = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1, 0, 0, 0);
  const resetLabel = new Date(resetMs).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });

  const { data: todayGens = [] } = useQuery({
    queryKey: ['video-gens-today', user?.email, todayUTC],
    queryFn: () => base44.entities.VideoGeneration.filter({ user_email: user.email, quota_date: todayUTC }),
    enabled: !!user?.email,
  });
  const remaining = Math.max(0, DAILY_LIMIT - todayGens.filter(g => g.status !== 'echoue').length);

  const { data: generations = [], isLoading: gensLoading } = useQuery({
    queryKey: ['video-generations', user?.email],
    queryFn: () => base44.entities.VideoGeneration.filter({ user_email: user.email }, '-created_date', 20),
    enabled: !!user?.email,
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['studio-releases'],
    queryFn: () => base44.entities.Release.list('-created_date', 50),
    enabled: !!user?.email,
    staleTime: 60_000,
  });
  const songs = extractPlayableSongs(releases);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((id) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const rec = await base44.entities.VideoGeneration.get(id);
        if (rec.status === 'genere') {
          stopPolling();
          setResult(rec);
          setGenStatus('termine');
          setPendingId(null);
          qc.invalidateQueries({ queryKey: ['video-gens-today'] });
          qc.invalidateQueries({ queryKey: ['video-generations'] });
        } else if (rec.status === 'echoue') {
          stopPolling();
          setGenStatus('echec');
          setPendingId(null);
          qc.invalidateQueries({ queryKey: ['video-gens-today'] });
          qc.invalidateQueries({ queryKey: ['video-generations'] });
        }
      } catch (e) { /* retry au prochain interval */ }
    }, 4000);
  }, [stopPolling, qc]);

  // Au chargement : reprend une génération en attente (après navigation/rechargement)
  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    (async () => {
      try {
        const latest = (await base44.entities.VideoGeneration.filter({ user_email: user.email }, '-created_date', 1))[0];
        if (!cancelled && latest?.status === 'en_attente') {
          setPendingId(latest.id);
          setGenStatus('generation');
          startPolling(latest.id);
        }
      } catch (e) {}
    })();
    return () => { cancelled = true; stopPolling(); };
  }, [user?.email, startPolling, stopPolling]);

  // La durée de l'extrait suit la durée vidéo par défaut
  useEffect(() => { setExcerptDuration(duration); }, [duration]);

  const isGenerating = genStatus === 'preparation' || genStatus === 'generation';
  const canGenerate = !!imageUri && consent && remaining > 0 && !isGenerating;

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPrivateFile({ file });
      setImageUri(res.file_uri);
      toast({ title: 'Image prête', description: 'Vous pouvez générer la vidéo.' });
    } catch (err) {
      toast({ title: 'Erreur upload', description: err.message, variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const generate = async () => {
    if (!canGenerate) return;
    setGenStatus('preparation');
    setResult(null);
    try {
      const res = await base44.functions.invoke('generateVideo', {
        image_file_uri: imageUri,
        action_prompt: action,
        duration,
        aspect_ratio: aspect,
        release_id: selectedSong?.release_id || '',
        release_title: selectedSong?.title || '',
        artist_name: selectedSong?.artist_name || '',
        audio_file_url: selectedSong?.audio_url || '',
        excerpt_start: excerptStart,
        excerpt_duration: excerptDuration,
      });
      const data = res.data || res;
      if (data?.error) throw data;
      if (data?.generation_id) {
        setPendingId(data.generation_id);
        setGenStatus('generation');
        startPolling(data.generation_id);
        qc.invalidateQueries({ queryKey: ['video-gens-today'] });
      }
    } catch (err) {
      const e = err.response?.data || err;
      if (e.error === 'quota_epuise') {
        setGenStatus(null);
        toast({ title: 'Quota quotidien atteint', description: `Réinitialisation à ${resetLabel}.`, variant: 'destructive' });
        qc.invalidateQueries({ queryKey: ['video-gens-today'] });
      } else {
        setGenStatus('echec');
        toast({ title: 'Génération échouée', description: e.error || err.message, variant: 'destructive' });
      }
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <img src={KKD_LOGO} alt="KKD Music" className="w-14 h-14 mx-auto mb-4 rounded-xl object-cover" />
        <h1 className="font-heading text-2xl font-extrabold mb-2">Studio Vidéo IA</h1>
        <p className="text-sm text-muted-foreground mb-6">Connectez-vous pour générer des vidéos animées à partir de vos images.</p>
        <Link to="/login" className="kkd-btn-primary">
          <LogIn size={16} /> Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 pb-28 md:pb-12">
      {/* Header avec logo KKD */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-primary/10 border border-border flex items-center justify-center shrink-0">
            <img src={KKD_LOGO} alt="KKD" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-extrabold leading-none">Studio Vidéo IA</h1>
            <p className="text-xs text-muted-foreground mt-1">Transformez une image en vidéo animée</p>
          </div>
        </div>
        {/* Compteur de générations restantes */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${remaining > 0 ? 'bg-secondary/40 border-border' : 'bg-amber-500/10 border-amber-500/30'}`}>
          <Clock size={16} className={remaining > 0 ? 'text-accent' : 'text-amber-500'} />
          <div className="leading-tight">
            <p className="text-[10px] text-muted-foreground uppercase">Aujourd'hui</p>
            <p className="font-heading font-extrabold text-sm">
              {remaining > 0 ? `${remaining} génér. restante${remaining > 1 ? 's' : ''}` : 'Quota atteint'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Formulaire */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
          {/* Image source */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Image source</label>
            <label className="block cursor-pointer">
              <div className={`relative rounded-xl border-2 border-dashed ${imagePreview ? 'border-primary/40' : 'border-border'} bg-secondary/20 aspect-video flex items-center justify-center overflow-hidden`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="source" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6">
                    <ImageIcon size={28} className="mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">{uploading ? 'Envoi en cours…' : 'Cliquez pour téléverser une image'}</p>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 size={22} className="animate-spin text-primary" />
                  </div>
                )}
              </div>
              <input type="file" className="hidden" onChange={handleImage} accept="image/*" disabled={uploading} />
            </label>
          </div>

          {/* Action souhaitée */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Action souhaitée <span className="text-muted-foreground/60 normal-case font-normal">(optionnel)</span>
            </label>
            <Textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Ex : la personne marche souriante vers la caméra, ambiance cinématique"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Chanson + extrait */}
          <SongExcerptPicker
            songs={songs}
            selectedSong={selectedSong}
            onSelect={setSelectedSong}
            excerptStart={excerptStart}
            setExcerptStart={setExcerptStart}
            excerptDuration={excerptDuration}
            setExcerptDuration={setExcerptDuration}
          />

          {/* Durée + format */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Durée</label>
              <div className="flex gap-1.5">
                {VIDEO_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
                      duration === d.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }`}
                  >
                    {d.value}s
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Format</label>
              <div className="flex gap-1.5">
                {VIDEO_ASPECTS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setAspect(a.value)}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
                      aspect === a.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }`}
                  >
                    {a.value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Consentement */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--brand-primary)]" />
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              Je confirme disposer des droits sur cette image et m'engage à ne pas porter atteinte à l'image, à la vie privée ou à l'identité d'autrui.
            </span>
          </label>

          {/* Générer */}
          <button onClick={generate} disabled={!canGenerate} className="kkd-btn-primary w-full !justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {isGenerating ? (
              <><Loader2 size={18} className="animate-spin" /> Génération en cours…</>
            ) : (
              <><Wand2 size={18} /> Générer la vidéo</>
            )}
          </button>

          {remaining === 0 && !isGenerating && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200">
                Vous avez utilisé vos {DAILY_LIMIT} générations d'aujourd'hui. Nouveau quota à {resetLabel}.
              </p>
            </div>
          )}
        </div>

        {/* Résultat + historique */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Film size={16} className="text-primary" />
              <p className="font-heading font-bold text-sm">Résultat</p>
            </div>
            {isGenerating ? (
              <GenerationProgress status={genStatus} />
            ) : result?.video_url ? (
              <VideoWithAudio
                videoUrl={result.video_url}
                audioUrl={result.audio_file_url}
                excerptStart={result.excerpt_start}
                excerptDuration={result.excerpt_duration}
              />
            ) : genStatus === 'echec' ? (
              <div className="aspect-video rounded-xl bg-destructive/10 border border-destructive/30 flex flex-col items-center justify-center gap-2 text-center p-6">
                <AlertTriangle size={28} className="text-destructive" />
                <p className="text-xs text-muted-foreground">La génération a échoué. Vous pouvez réessayer, le quota n'est pas consommé en cas d'échec.</p>
                <button onClick={() => setGenStatus(null)} className="kkd-btn-outline !text-xs !py-2">Réessayer</button>
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-secondary/20 flex flex-col items-center justify-center gap-2 text-center p-6">
                <Sparkles size={28} className="text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Votre vidéo générée apparaîtra ici.</p>
              </div>
            )}
          </div>

          {/* Historique */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <History size={16} className="text-primary" />
              <p className="font-heading font-bold text-sm">Mes générations</p>
            </div>
            {gensLoading ? (
              <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
            ) : generations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Aucune génération pour le moment.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {generations.map((g) => (
                  <GenerationHistoryItem key={g.id} gen={g} onPlay={setResult} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerationProgress({ status }) {
  const steps = [
    { id: 'preparation', label: 'Préparation', icon: Loader2 },
    { id: 'generation', label: 'Génération en cours', icon: Loader2 },
  ];
  const currentIdx = status === 'preparation' ? 0 : 1;
  return (
    <div className="aspect-video rounded-xl bg-secondary/40 flex flex-col items-center justify-center gap-4 p-6">
      <Loader2 size={32} className="animate-spin text-primary" />
      <div className="text-center space-y-1">
        <p className="text-sm font-heading font-bold">{steps[currentIdx].label}…</p>
        <p className="text-xs text-muted-foreground">Cela prend généralement 30 à 60 secondes.<br />Vous pouvez quitter la page, la vidéo apparaîtra dans votre historique.</p>
      </div>
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className={`h-1.5 w-12 rounded-full transition-colors ${i <= currentIdx ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
    </div>
  );
}

function GenerationHistoryItem({ gen, onPlay }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-2">
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {gen.status === 'genere' && gen.video_url ? (
          <video src={gen.video_url} className="w-full h-full object-cover" muted />
        ) : gen.status === 'echoue' ? (
          <AlertTriangle size={16} className="text-destructive" />
        ) : (
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">
          {gen.release_title ? (
            <span className="flex items-center gap-1"><Music size={10} className="text-primary shrink-0" /> {gen.release_title}</span>
          ) : (gen.prompt || 'Sans action précisée')}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {gen.duration}s · {new Date(gen.created_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </p>
      </div>
      {gen.status === 'genere' && gen.video_url && (
        <button onClick={() => onPlay(gen)} className="text-primary hover:underline text-[10px] font-bold">Voir</button>
      )}
    </div>
  );
}