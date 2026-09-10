import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { accessControlService } from '@/services/accessControlService';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Play, Pause, CheckCircle2, ShieldCheck, Sparkles,
  X, Loader2, Music, Smartphone, CreditCard,
  Headphones, ChevronRight
} from 'lucide-react';

export default function TrackLockPurchaseModal({ isOpen, onClose, track, onUnlocked }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const previewAudioRef = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState('wave');
  const [emailInput, setEmailInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Audio preview (extrait gratuit 25s)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    retry: false,
    enabled: isOpen,
  });

  useEffect(() => {
    if (me?.email) {
      setEmailInput(me.email);
    }
  }, [me]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setIsSuccess(false);
      setIsPreviewPlaying(false);
      setPreviewProgress(0);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsPreviewPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen || !track) return null;

  const price = Number(track.price) > 0 ? Number(track.price) : 500;
  const previewAudioSrc = track.audio_url || track.audio_file_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  // Toggle preview audio (limited to 25s)
  const togglePreview = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
    } else {
      audio.currentTime = 0;
      audio.play().then(() => {
        setIsPreviewPlaying(true);
      }).catch(() => {
        setIsPreviewPlaying(false);
      });
    }
  };

  const handleTimeUpdate = (e) => {
    const audio = e.currentTarget;
    const cur = audio.currentTime;
    // Stop at 25 seconds
    if (cur >= 25) {
      audio.pause();
      setIsPreviewPlaying(false);
      setPreviewProgress(100);
      return;
    }
    setPreviewProgress(Math.min(100, (cur / 25) * 100));
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Simuler ou valider la transaction via le service de contrôle d'accès
      const userEmail = emailInput.trim() || me?.email || 'auditeur@kkdmusic.com';

      // Petite pause pour feedback visuel réaliste
      await new Promise((resolve) => setTimeout(resolve, 800));

      const unlockedTrack = await accessControlService.unlockTrack(track, {
        paymentMethod,
        userEmail,
        queryClient,
      });

      setIsSuccess(true);
      toast({
        title: '🎉 Titre débloqué avec succès !',
        description: `L'accès complet à "${track.title}" est maintenant actif dans le lecteur KKD.`,
      });

      // Lancer immédiatement la lecture après 1.2s
      setTimeout(() => {
        if (onUnlocked) {
          onUnlocked(unlockedTrack);
        }
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Erreur lors du déverrouillage de la piste:', err);
      toast({
        title: 'Échec de la transaction',
        description: 'Une erreur est survenue lors de la tentative de déblocage.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isProcessing ? onClose : undefined}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
          className="relative w-full max-w-lg bg-[#121622] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden z-10 text-white"
        >
          {/* Audio preview element */}
          <audio
            ref={previewAudioRef}
            src={previewAudioSrc}
            preload="none"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              setIsPreviewPlaying(false);
              setPreviewProgress(0);
            }}
          />

          {/* Top Banner: For Sale Warning */}
          <div className="bg-gradient-to-r from-amber-500/20 via-primary/20 to-amber-500/20 px-6 py-3 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Lock size={15} className="animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest font-bold">
                Contenu En Vente Exclusive
              </span>
            </div>
            {!isProcessing && !isSuccess && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="p-6 md:p-7 space-y-6">
            {/* SUCCESS STATE */}
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg">
                  <CheckCircle2 size={44} className="animate-bounce" />
                </div>
                <h3 className="font-display text-2xl font-black text-white">
                  Titre Débloqué !
                </h3>
                <p className="text-sm text-zinc-300 max-w-sm mx-auto">
                  Votre achat direct a été validé. Chargement immédiat du morceau dans le lecteur KKD…
                </p>
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400 pt-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Démarrage de la lecture audio HQ</span>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Track Card Presentation */}
                <div className="flex items-center gap-4 bg-white/[0.04] p-3.5 rounded-2xl border border-white/[0.06]">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-800 border border-white/[0.08]">
                    {track.cover_url ? (
                      <img
                        src={track.cover_url}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        <Music size={28} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg">
                        <Lock size={15} />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        En Vente Exclusive
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">Master 24-bit HQ</span>
                    </div>
                    <h4 className="font-display font-bold text-base text-white truncate">
                      {track.title}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate">
                      {track.artist_name || 'Artiste KKD Music'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-zinc-400 block font-mono">Prix</span>
                    <span className="font-display font-extrabold text-xl text-amber-400">
                      {price.toLocaleString()} <span className="text-xs font-normal">F CFA</span>
                    </span>
                  </div>
                </div>

                {/* Information Security Box */}
                <div className="p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-amber-300 font-bold block mb-0.5">
                      Accès strictement protégé par l'artiste
                    </strong>
                    Ce titre ne peut pas être écouté en streaming libre. Il requiert un achat direct unique pour soutenir la création et débloquer la lecture permanente.
                  </div>
                </div>

                {/* Free Preview Snippet Option (25s) */}
                <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Headphones size={13} className="text-primary" /> Extrait promotionnel gratuit (25s)
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {isPreviewPlaying ? 'En lecture…' : 'Écouter avant d\'acheter'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePreview}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isPreviewPlaying
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      aria-label={isPreviewPlaying ? 'Pause extrait' : 'Écouter extrait'}
                    >
                      {isPreviewPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                    </button>

                    <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${previewProgress}%` }}
                      />
                    </div>

                    <span className="text-xs font-mono text-zinc-400 w-8 text-right">
                      {Math.round((previewProgress / 100) * 25)}s
                    </span>
                  </div>
                </div>

                {/* Payment Form */}
                <form onSubmit={handlePurchase} className="space-y-4">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold mb-2 block">
                      Moyen de paiement direct
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('wave')}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          paymentMethod === 'wave'
                            ? 'bg-[#1ba8e0]/15 border-[#1ba8e0] text-white shadow-sm'
                            : 'bg-black/30 border-white/[0.08] text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <Smartphone size={18} className={paymentMethod === 'wave' ? 'text-[#1ba8e0]' : ''} />
                        <span className="text-xs font-bold font-sans">Wave</span>
                        <span className="text-[10px] text-zinc-500 font-mono">0% frais</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('orange_money')}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          paymentMethod === 'orange_money'
                            ? 'bg-orange-500/15 border-orange-500 text-white shadow-sm'
                            : 'bg-black/30 border-white/[0.08] text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <Smartphone size={18} className={paymentMethod === 'orange_money' ? 'text-orange-500' : ''} />
                        <span className="text-xs font-bold font-sans">Orange Money</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Mobile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          paymentMethod === 'card'
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                            : 'bg-black/30 border-white/[0.08] text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <CreditCard size={18} className={paymentMethod === 'card' ? 'text-emerald-400' : ''} />
                        <span className="text-xs font-bold font-sans">Carte</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Visa / MC</span>
                      </button>
                    </div>
                  </div>

                  {/* Email confirmation */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold mb-1.5 block">
                      Email de confirmation & reçu d'accès
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="votre-email@domaine.com"
                      className="w-full bg-[#181d2a] border border-white/[0.1] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* CTA Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm transition-all shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Validation du paiement en cours…</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Débloquer et Écouter ({price.toLocaleString()} F CFA)</span>
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer security badge */}
                <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-400" /> Paiement chiffré 256-bit
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-400" /> 90% reversés à l'artiste
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
