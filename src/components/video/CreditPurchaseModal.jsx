import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { WAVE_PAY_LINK, WAVE_MERCHANT } from '@/lib/wave';
import { VIDEO_PACKS } from '@/lib/videoPacks';
import { Loader2, Upload, Check, X, Sparkles, Wallet } from 'lucide-react';

function WaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" />
    </svg>
  );
}

export default function CreditPurchaseModal({ user, onClose }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [packId, setPackId] = useState('createur');
  const [step, setStep] = useState('select'); // select | confirm
  const [ref, setRef] = useState('');
  const [proof, setProof] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pack = VIDEO_PACKS.find((p) => p.id === packId);

  const handleProof = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPrivateFile({ file });
      setProof(res.file_uri);
    } catch (err) {
      toast({ title: 'Erreur upload', description: err.message, variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!ref.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.VideoCreditPurchase.create({
        user_email: user.email,
        pack_id: pack.id,
        pack_label: pack.label,
        credits: pack.credits,
        amount: pack.amount,
        wave_reference: ref.trim(),
        proof_file_url: proof || '',
        status: 'en_attente',
      });
      qc.invalidateQueries({ queryKey: ['video-purchases', user.email] });
      toast({ title: 'Achat envoyé', description: 'Vos crédits seront ajoutés après validation par KKD.' });
      onClose();
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-start md:items-center justify-center overflow-y-auto p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg my-8 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base">Acheter des crédits vidéo</h2>
              <p className="text-xs text-muted-foreground">Paiement Wave — validation par KKD</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {step === 'select' ? (
            <>
              <div className="space-y-3">
                {VIDEO_PACKS.map((p) => {
                  const selected = packId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPackId(p.id)}
                      className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                        selected ? 'border-primary bg-primary/10' : 'border-border bg-secondary/40 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-heading font-bold text-sm">{p.label}</p>
                            {p.popular && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold uppercase">Populaire</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.desc} · {p.credits} crédits · {p.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-extrabold text-lg">{Number(p.amount).toLocaleString('fr-FR')}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">FCFA</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <a
                  href={WAVE_PAY_LINK}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setStep('confirm')}
                  className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl text-white font-bold shadow transition-transform hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg,#00A6E8,#0066B3)' }}
                >
                  <WaveIcon /> Payer {Number(pack.amount).toLocaleString('fr-FR')} FCFA avec Wave
                </a>
                <p className="text-[11px] text-muted-foreground text-center">
                  Marchand : {WAVE_MERCHANT}. Effectuez le paiement, puis saisissez la référence ci-après.
                </p>
              </div>
            </>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="bg-secondary/40 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-sm">{pack.label}</p>
                  <p className="text-xs text-muted-foreground">{pack.credits} crédits · {pack.unit}</p>
                </div>
                <p className="font-display font-extrabold">{Number(pack.amount).toLocaleString('fr-FR')} FCFA</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Référence de transaction Wave</label>
                <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Ex : TXN1234567890" required />
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs">
                <Upload size={14} /> {uploading ? 'Envoi…' : proof ? 'Capture du reçu ✓' : 'Capture du reçu (facultatif)'}
                <input type="file" className="hidden" onChange={handleProof} accept="image/*" />
              </label>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || !ref.trim()} className="bg-primary gap-2 flex-1">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Confirmer mon achat
                </Button>
                <Button type="button" variant="outline" onClick={() => setStep('select')}>Retour</Button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Vos crédits sont ajoutés dès que l'équipe KKD valide votre paiement (généralement sous quelques heures).
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}