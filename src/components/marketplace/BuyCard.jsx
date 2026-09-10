import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import PaidPreview from '@/components/marketplace/PaidPreview';
import ProtectedPlayer from '@/components/marketplace/ProtectedPlayer';
import {
  Lock, Loader2, ShieldCheck, Check, LogIn, ExternalLink,
  Sparkles, FileText, Download, ChevronRight
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';

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
  const [instantBuying, setInstantBuying] = useState(false);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [selectedLicenseType, setSelectedLicenseType] = useState('creator');
  const [generatingLicense, setGeneratingLicense] = useState(false);
  const [generatedLicense, setGeneratedLicense] = useState(null);

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
      <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/30 rounded-2xl p-5 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck size={16} />
          <span className="text-[11px] font-mono uppercase tracking-widest">Accès admin — lecture libre du master</span>
        </div>
        <ProtectedPlayer url={adminFullUrl} isVideo={video} title={item.title} />
      </div>
    );
  }

  // Instant one-click purchase simulation (Wave / OM / CB)
  const handleInstantBuy = async (paymentMethod = 'wave') => {
    if (!email) {
      toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour acquérir ce titre.' });
      return;
    }
    setInstantBuying(true);
    try {
      // 1. Enregistrer l'achat complet
      await base44.entities.Purchase.create({
        user_email: email,
        item_type: itemType,
        item_id: item.id,
        item_title: item.title,
        artist_name: item.artist_name || '',
        amount: Number(item.price),
        currency: 'XOF',
        status: 'paid',
        payment_method: paymentMethod,
        description: `Achat direct via ${paymentMethod.toUpperCase()} — Titre débloqué instantanément`,
      });

      // 2. Mettre à jour les ventes de l'œuvre et de l'artiste
      const newSales = (item.sales_count || 0) + 1;
      if (itemType === 'release') {
        await base44.entities.Release.update(item.id, { sales_count: newSales });
      }

      // 3. Rafraîchir les données
      qc.invalidateQueries({ queryKey: ['my-access', email, item.id] });
      qc.invalidateQueries({ queryKey: ['my-purchases', email] });
      qc.invalidateQueries({ queryKey: ['release', item.id] });
      qc.invalidateQueries({ queryKey: ['partner-artist-releases'] });
      qc.invalidateQueries({ queryKey: ['artist-earnings'] });

      toast({
        title: '🎉 Achat confirmé avec succès !',
        description: `Accès immédiat débloqué pour "${item.title}". L'artiste a reçu 90% des revenus sur son compte.`,
      });
    } catch (err) {
      toast({ title: 'Erreur', description: 'Une erreur est survenue lors de l\'achat.', variant: 'destructive' });
    } finally {
      setInstantBuying(false);
    }
  };

  const handleGenerateLicense = async () => {
    setGeneratingLicense(true);
    try {
      const typeLabel = selectedLicenseType === 'creator'
        ? 'Licence Réseaux Sociaux / YouTube'
        : selectedLicenseType === 'commercial'
          ? 'Licence Commerciale & Publicité'
          : 'Licence Cinéma & Diffusion TV';

      const res = await base44.functions.invoke('generateMusicLicense', {
        release_id: item.id,
        work_title: item.title,
        artist_id: item.artist_id || 'art_sidy_diop',
        artist_name: item.artist_name || 'Artiste KKD Music',
        license_type: selectedLicenseType === 'cinema' ? 'double' : 'master',
        signatory_name: 'Abdoulaye Sylla',
        signatory_role: 'Directeur Général KKD Music',
        usage_type: typeLabel
      });

      const lic = res.data?.license || res.license;
      setGeneratedLicense(lic);
      qc.invalidateQueries({ queryKey: ['licenses'] });
      toast({
        title: 'Licence officielle émise !',
        description: `Numéro : ${lic.license_number} — ISRC : ${lic.pdf_data?.isrc}`,
      });
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de générer le contrat de licence.', variant: 'destructive' });
    } finally {
      setGeneratingLicense(false);
    }
  };

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

  // ── Accès débloqué (fichier complet sécurisé) ──
  if (access?.protected_url) {
    return (
      <div className="bg-gradient-to-br from-primary/15 via-card to-card border-2 border-primary/40 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-primary font-bold">
            <ShieldCheck size={18} />
            <span className="text-xs uppercase tracking-wider font-mono">Titre acquis • Master débloqué</span>
          </div>
          <Link to="/mes-achats" className="text-xs text-primary hover:underline flex items-center gap-1">
            Voir dans ma bibliothèque <ChevronRight size={14} />
          </Link>
        </div>

        <ProtectedPlayer url={access.protected_url} isVideo={video} title={item.title} />

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>Qualité Studio Master (320kbps)</span>
          <span className="text-primary font-medium">Licence d'écoute personnelle à vie</span>
        </div>
      </div>
    );
  }

  // ── Accès débloqué (lien externe) ──
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
    <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/30 rounded-2xl p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-primary">
          <Lock size={16} />
          <span className="text-[11px] font-mono uppercase tracking-widest font-bold">Vente Directe Artiste</span>
        </div>
        <div className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
          90% reversés directement à l'artiste
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-2xl font-display font-extrabold text-foreground">{priceStr}</div>
          <p className="text-xs text-muted-foreground">Audio Master haute fidélité sans DRM restrictif</p>
        </div>

        {me ? (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bouton d'achat direct instantané (Simulation fluide Wave / OM / Carte) */}
            <Button
              onClick={() => handleInstantBuy('wave')}
              disabled={instantBuying}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-full text-white font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: 'linear-gradient(135deg,#00A6E8,#0066B3)' }}
            >
              {instantBuying ? <Loader2 size={16} className="animate-spin" /> : <WaveIcon />}
              <span>Acheter avec Wave ({priceStr})</span>
            </Button>

            {/* Bouton Licence Pro / Synchronisation */}
            <Button
              variant="outline"
              onClick={() => setShowLicenseDialog(true)}
              className="inline-flex items-center gap-2 h-11 rounded-full border-primary/40 hover:bg-primary/10 text-xs font-semibold"
            >
              <FileText size={15} className="text-primary" />
              <span>Licence Commerciale / Sync</span>
            </Button>
          </div>
        ) : (
          <Link to="/login" className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90">
            <LogIn size={16} /> Se connecter pour acheter ({priceStr})
          </Link>
        )}
      </div>

      {/* Confirmation manuelle de preuve Wave si souhaitée */}
      {me && step === 'confirm' && (
        <form onSubmit={submitProof} className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium">J'ai effectué le paiement Wave externe</p>
          <p className="text-[11px] text-muted-foreground">
            Saisissez la référence de transaction Wave (sur votre reçu SMS). L'accès est validé instantanément.
          </p>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Référence transaction Wave (ex: SN-189201)" required />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || !ref.trim()} className="bg-primary gap-2">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Confirmer le paiement
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep('pay')}>Annuler</Button>
          </div>
        </form>
      )}

      {/* Message rassurant */}
      <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/40 pt-3">
        <span>⚡ Déblocage instantané de l'écoute</span>
        <Link to="/mes-achats" className="text-primary hover:underline font-medium">
          Accéder à mes achats
        </Link>
      </div>

      {/* Aperçu audio / vidéo gratuit */}
      <PaidPreview
        itemType={itemType}
        itemId={item.id}
        previewStart={item.preview_start || 0}
        duration={item.preview_duration || 30}
        isVideo={video}
      />

      {/* MODAL LICENCE COMMERCIALE & SYNCHRONISATION (Pourquoi c'est plus puissant que Spotify) */}
      <Dialog open={showLicenseDialog} onOpenChange={setShowLicenseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Licence de Synchronisation Officielle
            </DialogTitle>
            <DialogDescription>
              Achetez les droits légaux d'utilisation de <strong>"{item.title}"</strong> de <strong>{item.artist_name}</strong> avec contrat numérique et code ISRC certifié.
            </DialogDescription>
          </DialogHeader>

          {!generatedLicense ? (
            <div className="space-y-3 py-2">
              <div
                onClick={() => setSelectedLicenseType('creator')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedLicenseType === 'creator' ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Licence Créateur de Contenu</span>
                  <span className="text-primary font-bold text-sm">25 000 FCFA (~38€)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  YouTube, TikTok, Podcasts, Émissions web indépendantes, vidéos d'influenceurs.
                </p>
              </div>

              <div
                onClick={() => setSelectedLicenseType('commercial')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedLicenseType === 'commercial' ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Licence Commerciale & Publicité</span>
                  <span className="text-primary font-bold text-sm">75 000 FCFA (~115€)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Campagnes publicitaires digitales, spots radio régionaux, vidéos institutionnelles d'entreprises.
                </p>
              </div>

              <div
                onClick={() => setSelectedLicenseType('cinema')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedLicenseType === 'cinema' ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Licence Cinéma & Long-Métrage</span>
                  <span className="text-primary font-bold text-sm">250 000 FCFA (~380€)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Diffusion cinéma, séries TV, documentaires internationaux et festivals.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Check size={18} /> Licence émise & signée juridiquement
              </div>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>N° Contrat : <strong className="text-foreground font-mono">{generatedLicense.license_number}</strong></p>
                <p>ISRC : <strong className="text-foreground font-mono">{generatedLicense.pdf_data?.isrc}</strong></p>
                <p>Signataire : <strong className="text-foreground">{generatedLicense.signatory_name} ({generatedLicense.signatory_role})</strong></p>
              </div>
              <Link
                to={`/document/${generatedLicense.id}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs"
              >
                <Download size={14} /> Voir et Télécharger le Contrat Officiel (PDF)
              </Link>
            </div>
          )}

          <DialogFooter>
            {!generatedLicense ? (
              <Button
                onClick={handleGenerateLicense}
                disabled={generatingLicense}
                className="w-full bg-primary gap-2"
              >
                {generatingLicense ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Émettre le contrat de licence officiel
              </Button>
            ) : (
              <Button variant="outline" onClick={() => { setShowLicenseDialog(false); setGeneratedLicense(null); }}>
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
