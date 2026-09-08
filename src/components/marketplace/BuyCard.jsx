import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import PaidPreview from '@/components/marketplace/PaidPreview';
import ProtectedPlayer from '@/components/marketplace/ProtectedPlayer';
import { WAVE_PAY_LINK, WAVE_MERCHANT } from '@/lib/wave';
import { Lock, Loader2, ShieldCheck, Clock, Upload, Check, LogIn, ExternalLink } from 'lucide-react';

function WaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" />
    </svg>
  );
}

export default function BuyCard({ item, itemType }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState('pay');
  const [ref, setRef] = useState('');
  const [proof, setProof] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const forSale = !!item?.is_for_sale && !!item.price && Number(item.price) > 0;

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false, enabled: forSale });
  const email = me?.email;
  const isAdmin = me?.role === 'admin';
  const video = itemType === 'video';

  // Admin : accès libre au contenu payant (URL signée du fichier protégé)
  const { data: adminFullUrl } = useQuery({
    queryKey: ['admin-full-url', itemType, item?.id],
    queryFn: async () => {
      const uri = item.protected_file_uri || (video ? item.video_file_url : (item.audio_file_url || (item.tracks && item.tracks[0]?.audio_file_url)));
      if (!uri) return null;
      if (uri.startsWith('http')) return uri;
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
      return res.signed_url || null;
    },
    enabled: forSale && isAdmin,
  });

  const { data: access } = useQuery({
    queryKey: ['my-access', email, item?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('getMyPurchases', { user_email: email });
      return (res.data?.purchases || []).find((p) => p.item_id === item.id) || null;
    },
    enabled: forSale && !!email,
  });

  const { data: waveReq } = useQuery({
    queryKey: ['my-wave', email, item?.id],
    queryFn: async () => {
      const list = await base44.entities.WavePayment.filter({ item_id: item.id });
      return list[0] || null;
    },
    enabled: forSale && !!email,
  });

  if (!forSale) return null;

  // ── Accès admin libre ──
  if (isAdmin && adminFullUrl) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck size={16} />
          <span className="text-[11px] font-mono uppercase tracking-widest">Accès admin — lecture libre</span>
        </div>
        <ProtectedPlayer url={adminFullUrl} isVideo={video} title={item.title} />
      </div>
    );
  }

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setProof(res.file_url);
    } finally {
      setUploading(false);
    }
  };

  const submitProof = async (e) => {
    e.preventDefault();
    if (!ref.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.WavePayment.create({
        user_email: email,
        item_type: itemType,
        item_id: item.id,
        item_title: item.title,
        artist_name: item.artist_name || '',
        amount: Number(item.price),
        wave_reference: ref.trim(),
        proof_file_url: proof || '',
        status: 'en_attente',
      });
      qc.invalidateQueries({ queryKey: ['my-wave', email, item.id] });
      setStep('pay'); setRef(''); setProof('');
      toast({ title: 'Paiement soumis', description: 'En attente de validation KKD.' });
    } finally {
      setSubmitting(false);
    }
  };

  const priceStr = `${Number(item.price).toLocaleString('fr-FR')} FCFA`;

  // ── Accès débloqué (fichier privé hébergé) ──
  if (access?.protected_url) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck size={16} />
          <span className="text-[11px] font-mono uppercase tracking-widest">Accès débloqué — merci !</span>
        </div>
        <ProtectedPlayer url={access.protected_url} isVideo={video} title={item.title} />
      </div>
    );
  }

  // ── Accès débloqué (lien externe — Spotify, YouTube, etc.) ──
  if (access && access.external_url) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck size={16} />
          <span className="text-[11px] font-mono uppercase tracking-widest">Accès débloqué — merci !</span>
        </div>
        <p className="text-sm text-muted-foreground">Votre achat est confirmé. Accédez au contenu sur la plateforme d'origine :</p>
        <a
          href={access.external_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-primary text-primary-foreground font-bold shadow-lg transition-transform hover:scale-[1.02]"
        >
          <ExternalLink size={16} /> Écouter sur la plateforme
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Lock size={16} />
        <span className="text-[11px] font-mono uppercase tracking-widest">Achat exclusif KKD</span>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-2xl font-display font-extrabold">{priceStr}</div>
        {me ? (
          <a
            href={WAVE_PAY_LINK}
            target="_blank"
            rel="noreferrer"
            onClick={() => setStep('confirm')}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-full text-white font-bold shadow-lg transition-transform hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg,#00A6E8,#0066B3)' }}
          >
            <WaveIcon /> Payer avec Wave
          </a>
        ) : (
          <Link to="/login" className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-primary text-primary-foreground font-bold">
            <LogIn size={16} /> Se connecter pour acheter
          </Link>
        )}
      </div>

      {/* Confirmation de paiement */}
      {me && step === 'confirm' && (
        <form onSubmit={submitProof} className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium">J'ai effectué le paiement Wave</p>
          <p className="text-[11px] text-muted-foreground">
            Saisissez la référence de transaction Wave (sur votre reçu), joignez une capture (facultatif). L'équipe KKD validera votre accès.
          </p>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Référence transaction Wave" required />
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors">
            <Upload size={14} />
            {uploading ? 'Envoi…' : proof ? 'Capture ✓' : 'Capture du reçu (facultatif)'}
            <input type="file" className="hidden" onChange={handleProofUpload} accept="image/*" />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || !ref.trim()} className="bg-primary gap-2">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Confirmer le paiement
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep('pay')}>Annuler</Button>
          </div>
        </form>
      )}

      {/* En attente de validation */}
      {waveReq?.status === 'en_attente' && (
        <div className="flex items-start gap-2 text-sm bg-secondary/60 rounded-xl p-3">
          <Clock size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Paiement en cours de validation</p>
            <p className="text-xs text-muted-foreground">Réf : {waveReq.wave_reference}. Accès débloqué dès validation par KKD.</p>
          </div>
        </div>
      )}
      {waveReq?.status === 'refuse' && (
        <p className="text-xs text-destructive">Paiement non validé. Vérifiez votre transaction et réessayez.</p>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Paiement via Wave ({WAVE_MERCHANT}). Ajoutez l'expéditeur à vos contacts pour un lien cliquable. Lecture sur KKD uniquement — téléchargement désactivé.
      </p>

      {/* Aperçu gratuit 30s */}
      {(item.protected_file_uri || item.audio_file_url || (item.tracks && item.tracks[0]?.audio_file_url)) && (
        <PaidPreview
          protectedFileUri={item.protected_file_uri}
          audioUrl={item.protected_file_uri ? null : (video ? item.video_file_url : (item.audio_file_url || (item.tracks && item.tracks[0]?.audio_file_url)))}
          previewStart={item.preview_start || 0}
          duration={item.preview_duration || 30}
          isVideo={video}
        />
      )}

      <Link to="/mes-achats" className="text-xs text-primary hover:underline block">Voir mes achats</Link>
    </div>
  );
}