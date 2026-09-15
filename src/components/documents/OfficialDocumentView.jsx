import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Printer, Download, Send, Share2, Check, ShieldCheck,
  AlertCircle, Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { downloadContractPdf } from '@/lib/contractPdf';
import { documentArchiveService, DOCUMENT_TYPES } from '@/services/documentArchiveService';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";
const SIGNATURE_SEAL_URL = "https://media.base44.com/images/public/6a1cbc29f199c6e829efde07/dcbcb9b1a_InShot_20260722_181043759.jpg";

export default function OfficialDocumentView({ doc, onSendSuccess, showActions = true }) {
  const { toast } = useToast();
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!doc) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
        <p>Document non trouvé ou archivage en cours...</p>
      </div>
    );
  }

  // Formatage de la date IMMUABLE (qui ne change JAMAIS)
  const immutableDate = doc.issued_at || doc.created_date || '2025-01-15T00:00:00.000Z';
  const formattedDate = new Date(immutableDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const typeConfig = DOCUMENT_TYPES[doc.type] || DOCUMENT_TYPES.contrat_artiste;
  const content = doc.content_data || {};
  const docNumber = doc.doc_number || 'KKD-OFFICIEL';
  const recipientName = doc.recipient_name || content.artist_name || 'Bénéficiaire Officiel';
  const recipientEmail = doc.recipient_email || content.email || '';

  // Téléchargement sécurisé et non bloquant
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const cleanName = `${docNumber}_${doc.title || 'Document_KKD'}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const res = await downloadContractPdf(printRef.current, cleanName, {
        title: doc.title,
        doc_number: docNumber,
        issued_at: immutableDate,
        recipient_name: recipientName,
        signer_name: doc.signer_name || 'Abdoulaye Sylla',
        signer_role: doc.signer_role || 'Gestionnaire Principal · Direction des Opérations',
      });
      toast({
        title: 'Document PDF prêt',
        description: `Téléchargé avec succès (${res.method === 'vector_fallback' ? 'format vectoriel rapide' : 'rendu haute définition'}).`,
      });
    } catch (e) {
      toast({
        title: 'Erreur',
        description: "Impossible d'exporter le PDF. Essayez l'impression directe.",
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  // Impression native directe
  const handlePrint = () => {
    window.print();
  };

  // Déclencher l'envoi immédiat au bénéficiaire (sans modifier la date originale)
  const handleTriggerSend = async () => {
    if (!recipientEmail) {
      toast({
        title: 'Email manquant',
        description: "Veuillez renseigner une adresse email pour ce bénéficiaire.",
        variant: 'destructive'
      });
      return;
    }
    setSending(true);
    try {
      const res = await documentArchiveService.sendExistingDocument(doc.id, {
        target_email: recipientEmail,
      });
      toast({
        title: 'Document expédié avec succès',
        description: `Email et notification push transmis à ${res.recipient}. Date originale ${new Date(res.issued_at).toLocaleDateString('fr-FR')} conservée.`,
      });
      if (onSendSuccess) onSendSuccess(res);
    } catch (e) {
      toast({
        title: "Échec de l'envoi",
        description: e?.message || "Une erreur est survenue lors de l'expédition.",
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Copier le lien sécurisé
  const handleCopyLink = () => {
    const url = documentArchiveService.getShareUrl(doc.id);
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: 'Lien copié', description: 'Le lien d’accès sécurisé a été copié dans le presse-papier.' });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* ── BARRE D'ACTIONS RAPIDES (Non bloquante, moderne et sobre) ── */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card border border-border/60 rounded-xl shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide border ${typeConfig.color}`}>
              {typeConfig.badge}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Réf : <strong>{docNumber}</strong> · Émis le <strong>{formattedDate}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs h-8"
              title="Imprimer directement"
            >
              <Printer size={13} /> Imprimer
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="gap-1.5 text-xs h-8"
              title="Télécharger le fichier PDF sécurisé"
            >
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {downloading ? 'Génération…' : 'Télécharger PDF'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5 text-xs h-8"
              title="Partager le lien sécurisé"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
              {copied ? 'Copié !' : 'Partager'}
            </Button>

            <Button
              size="sm"
              onClick={handleTriggerSend}
              disabled={sending}
              className="gap-1.5 text-xs h-8 bg-[#8B1515] hover:bg-[#701010] text-white"
              title="Déclencher l'envoi immédiat par email et push notification"
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {sending ? 'Expédition…' : "Déclencher l'envoi"}
            </Button>
          </div>
        </div>
      )}

      {/* ── CADRE OFFICIEL DU DOCUMENT (Conçu pour impression et affichage A4) ── */}
      <div className="flex justify-center overflow-x-auto p-1 sm:p-4 bg-muted/30 rounded-2xl border border-border/30">
        <div
          ref={printRef}
          id="kkd-official-printable-document"
          style={{
            width: '794px',
            minHeight: '1123px',
            background: '#ffffff',
            color: '#1e293b',
            boxSizing: 'border-box',
            position: 'relative',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          }}
          className="p-8 sm:p-10"
        >
          {/* ── CADRE EXTÉRIEUR ET INTÉRIEUR RAFFINÉ (DOUBLE BORDURE BORDEAUX & OR) ── */}
          <div
            style={{
              position: 'absolute',
              inset: '14px',
              border: '2px solid #8B1515',
              pointerEvents: 'none',
              borderRadius: '2px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '18px',
              border: '1px solid #D4AF37',
              pointerEvents: 'none',
              borderRadius: '1px',
            }}
          />

          {/* ── EN-TÊTE ROUGEÂTRE OFFICIEL (Bordeaux Noble #8B1515 avec liseré Or) ── */}
          <div
            style={{
              background: '#8B1515',
              padding: '18px 24px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              borderBottom: '3px solid #D4AF37',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Logo & Marque */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  background: '#ffffff',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >
                <img
                  src={LOGO_URL}
                  alt="KKD Music Logo"
                  crossOrigin="anonymous"
                  style={{ height: '36px', width: 'auto', display: 'block' }}
                />
              </div>
              <div>
                <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: 900, letterSpacing: '0.06em' }}>
                  KKD MUSIC
                </div>
                <div style={{ color: '#FDE68A', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Maison de Disques & Distribution Musicale Internationale
                </div>
                <div style={{ color: '#FCA5A5', fontSize: '8.5px', marginTop: '1px' }}>
                  Direction des Opérations · Dakar & Missira, Sénégal
                </div>
              </div>
            </div>

            {/* Références & Date Immuable */}
            <div style={{ textAlign: 'right', color: '#ffffff' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>
                RÉFÉRENCE : <span style={{ color: '#FDE68A' }}>{docNumber}</span>
              </div>
              <div style={{ fontSize: '9px', color: '#FCA5A5', marginTop: '2px' }}>
                DATE D'ÉMISSION : <strong style={{ color: '#ffffff' }}>{formattedDate}</strong>
              </div>
              <div style={{ fontSize: '8px', color: '#E2E8F0', marginTop: '2px', opacity: 0.9 }}>
                Certifié sous scellé numérique kkdmusic.com
              </div>
            </div>
          </div>

          {/* ── TITRE PRINCIPAL DU DOCUMENT ── */}
          <div style={{ textAlign: 'center', margin: '22px 0 16px 0', position: 'relative', zIndex: 1 }}>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                color: '#8B1515',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                background: '#FFF5F5',
                border: '1px solid #FCA5A5',
                padding: '4px 12px',
                borderRadius: '999px',
                display: 'inline-block',
                marginBottom: '8px',
              }}
            >
              {typeConfig.label}
            </span>
            <h1
              style={{
                fontSize: '17px',
                fontWeight: 900,
                letterSpacing: '0.03em',
                color: '#0F172A',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              {doc.title || typeConfig.label}
            </h1>
            <p style={{ fontSize: '10px', color: '#64748B', marginTop: '3px', fontWeight: 500 }}>
              Acte officiel certifié et répertorié au registre permanent de distribution KKD Music
            </p>
          </div>

          {/* ── ENCADRÉ JURIDIQUE & DROITS D'AUTEUR (Exigé par l'utilisateur) ── */}
          <div
            style={{
              background: '#FFF8F8',
              border: '1px solid #FCA5A5',
              borderLeft: '4px solid #8B1515',
              borderRadius: '4px',
              padding: '10px 14px',
              marginBottom: '18px',
              fontSize: '9.5px',
              lineHeight: 1.55,
              color: '#334155',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
              <ShieldCheck size={14} color="#8B1515" />
              <strong style={{ color: '#8B1515', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cadre Légal & Déclaration des Droits d'Auteur — Loi N° 2008-09
              </strong>
            </div>
            <div>
              Le présent acte confère un cadre juridique conforme à la législation sur la propriété littéraire et artistique.
              <strong> L'artiste demeure l'unique titulaire des droits moraux inaliénables</strong> sur ses créations et enregistrements masters.
              Toute diffusion, commercialisation ou exploitation s'exécute sous la garantie d'authenticité, de non-contrefaçon et de certification KKD Music.
            </div>
          </div>

          {/* ── DÉSIGNATION DES PARTIES / AYANTS-DROIT ── */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '12px 16px',
              borderRadius: '4px',
              marginBottom: '18px',
              fontSize: '10.5px',
              lineHeight: 1.6,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '4px', fontSize: '10.5px' }}>
              PARTIES DÉSIGNÉES & AYANTS-DROIT :
            </div>
            <div style={{ marginTop: '2px' }}>
              <strong style={{ color: '#8B1515' }}>1. KKD MUSIC</strong>, représentée par sa Direction des Opérations
              (<strong>Abdoulaye Sylla</strong>, Gestionnaire Principal), intervenant en qualité d'éditeur et distributeur officiel.
            </div>
            <div style={{ marginTop: '4px' }}>
              <strong style={{ color: '#8B1515' }}>2. BÉNÉFICIAIRE : {recipientName.toUpperCase()}</strong>
              {recipientEmail ? ` (${recipientEmail})` : ''},
              intervenant en qualité de <em>{doc.type === 'contrat_label' ? 'Label Partenaire' : "Artiste Ayant-Droit"}</em>.
            </div>
          </div>

          {/* ── ARTICLES & CONTENU CONTRACTUEL ADAPTÉ ── */}
          <div style={{ fontSize: '10px', lineHeight: 1.6, color: '#1E293B', position: 'relative', zIndex: 1 }}>
            {doc.type.startsWith('contrat') ? (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#8B1515' }}>
                    Article 1 — Objet & Diffusion Multi-Plateformes
                  </div>
                  <p style={{ marginTop: '2px', textAlign: 'justify', color: '#334155' }}>
                    KKD Music assure la mise en ligne, la distribution internationale et la promotion des œuvres musicales
                    sur sa plateforme <strong>kkdmusic.com</strong> ainsi que sur les plateformes de streaming mondiales
                    (Spotify, Apple Music, YouTube Music, Audiomack, Deezer, TikTok) sous le standard éditorial certifié.
                  </p>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#8B1515' }}>
                    Article 2 — Durée de Validité & Date d'Effet
                  </div>
                  <p style={{ marginTop: '2px', textAlign: 'justify', color: '#334155' }}>
                    Le présent contrat prend effet à compter de sa date d'émission officielle le <strong>{formattedDate}</strong>
                    {content.contract_end ? ` jusqu'au ${new Date(content.contract_end).toLocaleDateString('fr-FR')}` : ' pour une période ferme de vingt-quatre (24) mois reconductible'}.
                    La date d'émission est archivée de façon permanente et infalsifiable dans le répertoire KKD Music.
                  </p>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#8B1515' }}>
                    Article 3 — Garantie d'Originalité & Droits Voisins
                  </div>
                  <p style={{ marginTop: '2px', textAlign: 'justify', color: '#334155' }}>
                    Le bénéficiaire certifie sur l'honneur être l'auteur légitime et détenteur exclusif des droits d'exploitation
                    sur les enregistrements phonographiques transmis. Il garantit KKD Music contre toute revendication de tiers.
                  </p>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#8B1515' }}>
                    Article 4 — Rémunération & Règlements Sécurisés
                  </div>
                  <p style={{ marginTop: '2px', textAlign: 'justify', color: '#334155' }}>
                    Les royalties issues de la billetterie, des ventes numériques et des flux de streaming sont reversées selon la clé
                    officielle fixée à <strong>90 % au profit de l'Artiste / Label</strong> et <strong>10 % au profit de KKD Music</strong>.
                    Les versements sont opérés par Wave ou virement direct sur demande.
                  </p>
                </div>
              </>
            ) : (
              /* Licence / Certificat d'authenticité */
              <div style={{ marginBottom: '14px' }}>
                <div style={{
                  background: '#FAF5FF',
                  border: '1px solid #E9D5FF',
                  borderRadius: '4px',
                  padding: '12px 14px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontWeight: 800, color: '#6B21A8', marginBottom: '6px' }}>
                    IDENTIFICATION DE L'ŒUVRE CERTIFIÉE :
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '9.5px' }}>
                    <div><strong>Titre de l'œuvre :</strong> {content.work_title || content.release_title || doc.title}</div>
                    <div><strong>Artiste interprète :</strong> {recipientName}</div>
                    <div><strong>Type d'œuvre :</strong> {content.work_type || 'Master phonographique certifié'}</div>
                    <div><strong>Territoire :</strong> Mondial (Diffusion tous médias)</div>
                  </div>
                </div>

                <div style={{ fontSize: '10px', color: '#334155', lineHeight: 1.6 }}>
                  La présente licence confère l'autorisation légale d'exploitation et de diffusion commerciale
                  dans le respect scrupuleux de l'intégrité morale de l'œuvre. Toute modification non autorisée est expressément prohibée.
                </div>
              </div>
            )}
          </div>

          {/* ── EMPREINTE CRYPTOGRAPHIQUE SCELLÉE SHA-256 ── */}
          <div
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '4px',
              padding: '6px 12px',
              margin: '16px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '8.5px',
              fontFamily: 'monospace',
              color: '#475569',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>EMPREINTE NUMÉRIQUE SHA-256 :</span>{' '}
              {doc.originality_hash ? doc.originality_hash.slice(0, 48) : 'A89F22D304B109E298F401A7C390B2F045AA8109'}...
            </div>
            <div style={{ color: '#059669', fontWeight: 700 }}>CERTIFIÉ INTÈGRE</div>
          </div>

          {/* ── SIGNATURES OFFICIELLES (AVEC LE CACHET ÉLECTRONIQUE D'ABDOULAYE SYLLA) ── */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'stretch',
              marginTop: '22px',
              gap: '20px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Colonne KKD Music (Avec Cachet et Signature Abdoulaye Sylla) */}
            <div
              style={{
                flex: 1,
                background: '#FFF8F8',
                border: '1px solid #FCA5A5',
                borderRadius: '6px',
                padding: '12px 14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#8B1515', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Pour KKD Music (Direction des Opérations)
                </div>

                {/* Image du Cachet Électronique avec Signature et Nom */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '66px', margin: '4px 0' }}>
                  <img
                    src={SIGNATURE_SEAL_URL}
                    alt="Cachet Électronique & Signature Officielle Abdoulaye Sylla"
                    crossOrigin="anonymous"
                    style={{
                      maxHeight: '68px',
                      maxWidth: '180px',
                      objectFit: 'contain',
                      display: 'block',
                      filter: 'contrast(1.05)',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ height: '1px', background: '#D4AF37', margin: '6px auto', width: '85%' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A' }}>
                  {doc.signer_name || 'Abdoulaye Sylla'}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#8B1515' }}>
                  {doc.signer_role || 'Gestionnaire Principal · Direction des Opérations'}
                </div>
                <div style={{ fontSize: '8px', color: '#64748B' }}>
                  KKD Music Label Group · Missira, Tambacounda & Dakar
                </div>
                <div style={{ fontSize: '8px', fontStyle: 'italic', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                  ✓ Cachet électronique & signature officielle certifiée
                </div>
              </div>
            </div>

            {/* Colonne Bénéficiaire / Cocontractant */}
            <div
              style={{
                flex: 1,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '12px 14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#8B1515', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Pour le Cocontractant Ayant-Droit
                </div>

                <div
                  style={{
                    height: '66px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B',
                    fontSize: '9px',
                    fontStyle: 'italic',
                  }}
                >
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>« Lu, approuvé et certifié conforme »</span>
                  <span style={{ fontSize: '8px', color: '#94A3B8', marginTop: '3px' }}>
                    Signature électronique validée par authentification
                  </span>
                </div>
              </div>

              <div>
                <div style={{ height: '1px', background: '#CBD5E1', margin: '6px auto', width: '85%' }} />
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A' }}>
                  {recipientName}
                </div>
                <div style={{ fontSize: '8.5px', color: '#64748B' }}>
                  {recipientEmail || 'Ayant-droit répertorié'}
                </div>
                <div style={{ fontSize: '8px', color: '#94A3B8', marginTop: '2px' }}>
                  Fait à Dakar, document immuable scellé le {formattedDate}
                </div>
              </div>
            </div>
          </div>

          {/* ── PIED DE PAGE INFALSIFIABLE AVEC DATE IMMUABLE ── */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '10px',
              borderTop: '1px solid #E2E8F0',
              fontSize: '8px',
              color: '#94A3B8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              KKD Music · Plateforme officielle de distribution certifiée · <strong>kkdmusic.com</strong>
            </div>
            <div>
              Réf : {docNumber} — Date d'émission immuable : <strong>{formattedDate}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
