// KKD Music — Modal d'Export Vidéo & Partage Social (TikTok / Reels / YouTube)
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, Share2, Film, Copy, Check, RefreshCw 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ExportModal({ 
  isOpen, 
  onClose, 
  status, // 'exporting' | 'complete' | 'error'
  progress, // { percent, elapsedSeconds, totalSeconds }
  result, // { blob, videoUrl, filename, duration }
  projectDetails, // { title, artist, format, theme }
  onReset
}) {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const defaultCaption = `Écoutez « ${projectDetails?.title || 'ce morceau'} » de ${projectDetails?.artist || 'l\'artiste'} sur KKD Music 🎵🔥 #KKDMusic #Afrobeat #NewMusic #TikTokMusic`;

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(defaultCaption);
    setCopiedCaption(true);
    toast({
      title: 'Légende copiée !',
      description: 'Collez-la directement dans votre publication TikTok ou Instagram.',
    });
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleDownload = () => {
    if (!result?.videoUrl) return;
    const a = document.createElement('a');
    a.href = result.videoUrl;
    a.download = result.filename || 'kkd-clip-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: 'Téléchargement lancé',
      description: `Fichier ${result.filename} enregistré sur votre appareil.`,
    });
  };

  const handleTikTokShare = () => {
    // Copie de la légende automatique
    navigator.clipboard.writeText(defaultCaption);
    toast({
      title: 'Prêt pour TikTok !',
      description: 'Légende copiée dans le presse-papier. Téléchargez le fichier et importez-le sur TikTok.',
    });
    // Si l'utilisateur est sur desktop, on ouvre TikTok Web Upload
    window.open('https://www.tiktok.com/upload?lang=fr', '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-[#0D121D] border border-border/80 rounded-2xl shadow-2xl overflow-hidden text-foreground"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-[#121826]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Film size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {status === 'exporting' ? 'Génération de la vidéo en cours' : 'Votre vidéo est prête !'}
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {projectDetails?.title} · {projectDetails?.artist}
                </span>
              </div>
            </div>

            {status !== 'exporting' && (
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-white rounded-lg hover:bg-secondary/60 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Corps du modal */}
          <div className="p-6">
            {status === 'exporting' ? (
              <div className="py-8 flex flex-col items-center text-center">
                {/* Indicateur circulaire animé */}
                <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="text-secondary"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="text-amber-500 transition-all duration-300"
                      strokeWidth="8"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * (progress?.percent || 0)) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black font-mono text-white tabular-nums">
                      {progress?.percent || 0}%
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">Rendu</span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white mb-2">Capture Canvas & Encodage Audio/Vidéo</h4>
                <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
                  Veuillez garder cette page ouverte pendant que les fréquences audio et le motion design sont synchronisés.
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 tabular-nums">
                  <span>Temps écoulé : {progress?.elapsedSeconds || 0}s</span>
                  <span>·</span>
                  <span>Durée cible : {progress?.totalSeconds || 15}s</span>
                </div>
              </div>
            ) : status === 'complete' ? (
              <div className="space-y-5">
                {/* Lecteur Vidéo de prévisualisation */}
                <div className="relative rounded-xl overflow-hidden bg-black border border-border/60 flex items-center justify-center max-h-72">
                  {result?.videoUrl && (
                    <video
                      src={result.videoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="max-h-72 w-auto mx-auto object-contain rounded-lg"
                    />
                  )}
                </div>

                {/* Légende TikTok suggérée */}
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Légende TikTok suggérée
                    </span>
                    <button
                      onClick={handleCopyCaption}
                      className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {copiedCaption ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedCaption ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 italic">
                    {defaultCaption}
                  </p>
                </div>

                {/* Boutons d'actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleDownload}
                    className="py-3 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    <span>Télécharger la vidéo MP4</span>
                  </button>

                  <button
                    onClick={handleTikTokShare}
                    className="py-3 px-4 rounded-xl text-xs font-bold bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 size={16} />
                    <span>Publier sur TikTok</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <button
                    onClick={onReset}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-white transition-colors"
                  >
                    <RefreshCw size={13} />
                    <span>Créer un autre clip</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-white transition-colors font-medium"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-rose-400">
                <p className="text-sm font-semibold mb-3">Une erreur est survenue lors de l’encodage.</p>
                <button
                  onClick={onClose}
                  className="py-2 px-4 rounded-lg bg-secondary text-white text-xs font-bold"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
