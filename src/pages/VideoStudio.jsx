import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { VIDEO_DURATIONS, VIDEO_ASPECTS, creditsForDuration } from '@/lib/videoPacks';
import CreditPurchaseModal from '@/components/video/CreditPurchaseModal';
import {
  Sparkles, Loader2, Upload, Wand2, Film, LogIn, Coins, ImageIcon,
  AlertTriangle, Download, History, Clapperboard,
} from 'lucide-react';

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
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [showPurchase, setShowPurchase] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });

  const { data: credit } = useQuery({
    queryKey: ['video-credit', user?.email],
    queryFn: async () => (await base44.entities.VideoCredit.filter({ user_email: user.email }))[0] || null,
    enabled: !!user?.email,
  });

  const { data: generations = [], isLoading: gensLoading } = useQuery({
    queryKey: ['video-generations', user?.email],
    queryFn: () => base44.entities.VideoGeneration.filter({ user_email: user.email }, '-created_date', 20),
    enabled: !!user?.email,
  });

  const balance = credit?.balance || 0;
  const cost = creditsForDuration(duration);
  const canGenerate = !!imageUri && consent && balance >= cost && !generating;

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
    setGenerating(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('generateVideo', {
        image_file_uri: imageUri,
        action_prompt: action,
        duration,
        aspect_ratio: aspect,
      });
      const data = res.data || res;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      qc.invalidateQueries({ queryKey: ['video-credit', user.email] });
      qc.invalidateQueries({ queryKey: ['video-generations', user.email] });
      toast({ title: 'Vidéo générée !', description: `${data.credits_used} crédit(s) utilisé(s).` });
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      toast({ title: 'Génération échouée', description: msg, variant: 'destructive' });
    } finally { setGenerating(false); }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <Clapperboard size={48} className="mx-auto mb-4 text-muted-foreground/40" />
        <h1 className="font-display text-2xl font-extrabold mb-2">Studio Vidéo IA</h1>
        <p className="text-sm text-muted-foreground mb-6">Connectez-vous pour générer des vidéos animées à partir de vos images.</p>
        <Link to="/login" className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-primary text-primary-foreground font-bold">
          <LogIn size={16} /> Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 pb-28 md:pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl md:text-2xl font-extrabold">Studio Vidéo IA</h1>
            <p className="text-xs text-muted-foreground">Transformez une image en vidéo animée</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/60 border border-border">
            <Coins size={16} className="text-accent" />
            <div className="leading-tight">
              <p className="text-[10px] text-muted-foreground uppercase">Solde</p>
              <p className="font-display font-extrabold text-sm">{balance} crédit{balance > 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button onClick={() => setShowPurchase(true)} size="sm" className="bg-primary gap-2">
            <Coins size={14} /> Acheter
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
          {/* Image upload */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Image source</label>
            <label className="block cursor-pointer">
              <div className={`relative rounded-xl border-2 border-dashed ${imagePreview ? 'border-primary/40' : 'border-border'} bg-secondary/30 aspect-video flex items-center justify-center overflow-hidden`}>
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

          {/* Action prompt */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Action souhaitée (optionnel)</label>
            <Textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Ex : La personne marche souriante vers la caméra, regard confiant, ambiance cinématique"
              rows={3}
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground mt-1">L'IA décrit votre image puis anime la scène selon cette action.</p>
          </div>

          {/* Duration + aspect */}
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
                    <span className="block text-[9px] font-normal opacity-80">{d.credits} cr</span>
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

          {/* Consent */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--brand-primary)]" />
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              Je confirme disposer des droits sur cette image et m'engage à ne pas porter atteinte à l'image, à la vie privée ou à l'identité d'autrui (usurpation, diffamation).
            </span>
          </label>

          {/* Generate */}
          <Button onClick={generate} disabled={!canGenerate} className="w-full bg-primary gap-2 h-11">
            {generating ? (
              <><Loader2 size={18} className="animate-spin" /> Génération en cours…</>
            ) : (
              <><Wand2 size={18} /> Générer · {cost} crédit{cost > 1 ? 's' : ''}</>
            )}
          </Button>

          {balance < cost && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200">
                Crédits insuffisants ({balance}/{cost}). <button onClick={() => setShowPurchase(true)} className="underline font-bold">Acheter un pack</button> pour générer.
              </p>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Film size={16} className="text-primary" />
              <p className="font-heading font-bold text-sm">Résultat</p>
            </div>
            {generating ? (
              <div className="aspect-video rounded-xl bg-secondary/40 flex flex-col items-center justify-center gap-3">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-xs text-muted-foreground text-center px-4">Création de votre vidéo animée…<br />Cela peut prendre 30 à 60 secondes.</p>
              </div>
            ) : result?.video_url ? (
              <div className="space-y-3">
                <video src={result.video_url} controls autoPlay loop className="w-full rounded-xl bg-black" />
                <a href={result.video_url} download className="inline-flex items-center gap-2 text-xs text-primary hover:underline">
                  <Download size={14} /> Télécharger la vidéo
                </a>
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-secondary/30 flex flex-col items-center justify-center gap-2 text-center p-6">
                <Sparkles size={28} className="text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Votre vidéo générée apparaîtra ici.</p>
              </div>
            )}
          </div>

          {/* History */}
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
              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                {generations.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 rounded-lg bg-secondary/30 p-2">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {g.status === 'genere' && g.video_url ? (
                        <video src={g.video_url} className="w-full h-full object-cover" muted />
                      ) : g.status === 'echoue' ? (
                        <AlertTriangle size={16} className="text-destructive" />
                      ) : (
                        <Loader2 size={16} className="animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{g.prompt || 'Sans action précisée'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {g.duration}s · {g.credits_used} cr · {new Date(g.created_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {g.status === 'genere' && g.video_url && (
                      <a href={g.video_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px]">Voir</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPurchase && <CreditPurchaseModal user={user} onClose={() => setShowPurchase(false)} />}
    </div>
  );
}