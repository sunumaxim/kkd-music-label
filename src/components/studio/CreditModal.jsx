// KKD Music — Modal d'Achat de Crédits & Abonnements Studio Vidéo
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Zap, Crown, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { 
  CREDIT_PACKS, 
  SUBSCRIPTION_PLANS, 
  videoGeneratorService 
} from '@/services/videoGeneratorService';
import { useToast } from '@/components/ui/use-toast';

export default function CreditModal({ isOpen, onClose, user, currentCredits, onCreditsUpdated }) {
  const [activeTab, setActiveTab] = useState('packs'); // 'packs' | 'subscriptions'
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const currentSub = videoGeneratorService.getUserSubscription(user);

  const handlePurchasePack = async (pack) => {
    setIsProcessing(true);
    setProcessingId(pack.id);
    try {
      const result = await videoGeneratorService.purchaseCreditPack(user, pack.id);
      toast({
        title: 'Recharge réussie !',
        description: `+${pack.credits} crédits ont été ajoutés à votre compte. Nouveau solde : ${result.newCredits} crédits.`,
      });
      onCreditsUpdated?.(result.newCredits);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingId(null);
        onClose();
      }, 700);
    } catch (err) {
      toast({
        title: 'Erreur lors de la commande',
        description: err?.message || 'Impossible de compléter la transaction.',
        variant: 'destructive'
      });
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  const handleSubscribe = async (plan) => {
    if (plan.id === currentSub.id) return;
    setIsProcessing(true);
    setProcessingId(plan.id);
    try {
      const result = await videoGeneratorService.subscribeToPlan(user, plan.id);
      toast({
        title: 'Abonnement activé !',
        description: `Vous êtes maintenant sur la formule ${plan.name}. +${plan.monthlyCredits} crédits mensuels alloués.`,
      });
      onCreditsUpdated?.(result.newCredits);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingId(null);
        onClose();
      }, 700);
    } catch (err) {
      toast({
        title: 'Erreur lors de l’abonnement',
        description: err?.message || 'Impossible d’activer la formule.',
        variant: 'destructive'
      });
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-[#0F1420] border border-border/70 rounded-2xl shadow-2xl overflow-hidden text-foreground"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 bg-[#141B2D]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Crédits Vidéo & Abonnements</h3>
                <p className="text-xs text-muted-foreground">
                  Générez vos clips musicaux et teasers pour TikTok, Instagram Reels et YouTube
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Votre solde</span>
                <span className="font-mono text-base font-bold text-amber-400 tabular-nums">
                  {currentCredits} crédit{currentCredits > 1 ? 's' : ''}
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-secondary/60 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Onglets */}
          <div className="flex items-center gap-2 px-6 pt-5 pb-2">
            <div className="flex items-center p-1 bg-secondary/40 rounded-xl border border-border/40">
              <button
                onClick={() => setActiveTab('packs')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'packs'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Packs de Crédits (À la demande)
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'subscriptions'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Abonnements Mensuels
              </button>
            </div>
            <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
              15s = 1 crédit · 30s = 2 crédits · 60s = 3 crédits
            </span>
          </div>

          {/* Corps du modal */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {activeTab === 'packs' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CREDIT_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all ${
                      pack.popular
                        ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/50 shadow-lg shadow-amber-500/5'
                        : 'bg-card/50 border-border/60 hover:border-border'
                    }`}
                  >
                    {pack.badge && (
                      <div className="absolute -top-2.5 right-4 bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                        {pack.badge}
                      </div>
                    )}

                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">{pack.title}</span>
                      </div>

                      <div className="flex items-baseline gap-1.5 my-3">
                        <span className="text-3xl font-black text-white font-mono tabular-nums">{pack.credits}</span>
                        <span className="text-xs font-medium text-muted-foreground">crédits</span>
                        {pack.bonus && (
                          <span className="ml-2 text-[11px] font-bold text-amber-400">
                            {pack.bonus}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                        {pack.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between pt-3 border-t border-border/40 mb-4">
                        <span className="text-xs text-muted-foreground">Tarif TTC</span>
                        <span className="text-lg font-bold text-white font-mono tabular-nums">{pack.price.toFixed(2)} €</span>
                      </div>

                      <button
                        onClick={() => handlePurchasePack(pack)}
                        disabled={isProcessing}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          pack.popular
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                            : 'bg-secondary hover:bg-secondary/80 text-white border border-border/60'
                        } disabled:opacity-60`}
                      >
                        {isProcessing && processingId === pack.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Traitement...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={14} />
                            <span>Recharger {pack.credits} crédits</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isCurrent = currentSub.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/50 shadow-lg shadow-amber-500/5'
                          : isCurrent
                          ? 'bg-primary/5 border-primary/40'
                          : 'bg-card/50 border-border/60 hover:border-border'
                      }`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-2.5 right-4 bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                          {plan.badge}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Crown size={16} className={plan.popular ? 'text-amber-400' : 'text-muted-foreground'} />
                          <span className="text-sm font-bold text-white">{plan.name}</span>
                        </div>

                        <div className="flex items-baseline gap-1 my-3">
                          <span className="text-3xl font-black text-white font-mono tabular-nums">
                            {plan.price === 0 ? 'Gratuit' : `${plan.price.toFixed(2)} €`}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-xs text-muted-foreground">/{plan.period}</span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                          {plan.description}
                        </p>

                        <div className="space-y-2 pt-3 border-t border-border/40 mb-6">
                          {plan.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                              <Check size={14} className="text-amber-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={isCurrent || isProcessing}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          isCurrent
                            ? 'bg-secondary/40 text-muted-foreground cursor-default'
                            : plan.popular
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                            : 'bg-secondary hover:bg-secondary/80 text-white border border-border/60'
                        } disabled:opacity-60`}
                      >
                        {isProcessing && processingId === plan.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Activation...</span>
                          </>
                        ) : isCurrent ? (
                          <>
                            <Check size={14} />
                            <span>Formule active</span>
                          </>
                        ) : (
                          <>
                            <span>{plan.ctaText}</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer rassurant */}
          <div className="px-6 py-4 bg-[#0A0D15] border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Garantie KKD Music : Vos crédits restent valides sans limite de temps.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-400">Paiement sécurisé</span>
              <span>·</span>
              <span>TikTok Partner API</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
