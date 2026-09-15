import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Eye } from 'lucide-react';
import ContractDocument from './ContractDocument';
import { downloadContractPdf } from '@/lib/contractPdf';
import DocumentModalViewer from '@/components/documents/DocumentModalViewer';

export default function ContractDownloader({
  invite,
  label = 'Télécharger le contrat',
  variant = 'default',
  size = 'sm',
  showConsultButton = true,
}) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Préparer les métadonnées de document archivé avec date immuable
  const immutableDate = invite?.created_date || invite?.contract_start || '2025-01-15T00:00:00.000Z';
  const isLabel = invite?.invite_type === 'label_partenaire';
  const docData = {
    id: `doc_inv_${invite?.id || 'temp'}`,
    doc_number: `KKD-${(invite?.id || 'CONTRACT').slice(-6).toUpperCase()}`,
    type: isLabel ? 'contrat_label' : 'contrat_artiste',
    title: `${isLabel ? 'Contrat de Partenariat Label' : "Contrat d'Artiste & Distribution"} — ${invite?.artist_name || 'Bénéficiaire'}`,
    recipient_name: invite?.artist_name || 'Artiste / Label Ayant-Droit',
    recipient_email: invite?.email || '',
    issued_at: immutableDate, // FIXE ET IMMUABLE
    status: invite?.status === 'actif' ? 'actif' : 'signe',
    signer_name: 'Abdoulaye Sylla',
    signer_role: 'Gestionnaire Principal · Direction des Opérations',
    content_data: invite || {},
  };

  const handleDownload = async (e) => {
    e?.stopPropagation();
    setBusy(true);
    try {
      const name = (invite?.artist_name || 'artiste').replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadContractPdf(
        ref.current,
        `Contrat_KKD_Music_${name}.pdf`,
        docData
      );
    } catch (e) {
      console.error('Contract PDF error:', e);
      // Recours de sécurité
      window.print();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        {showConsultButton && (
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            variant="outline"
            size={size}
            className="gap-1 text-xs"
            title="Consulter le document avec sa date d'origine"
          >
            <Eye size={13} /> Consulter
          </Button>
        )}

        <Button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          variant={variant}
          size={size}
          className="gap-1.5 text-xs"
          title="Télécharger le fichier PDF sécurisé"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {busy ? 'Génération…' : label}
        </Button>
      </div>

      {/* Rendu hors écran sécurisé (positionné avec opacité 0 pour permettre le calcul de géométrie par html2canvas) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '794px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -999,
        }}
        aria-hidden="true"
      >
        <div ref={ref}>
          <ContractDocument invite={invite} />
        </div>
      </div>

      {/* Modal de reconsultation */}
      <DocumentModalViewer
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        doc={docData}
      />
    </>
  );
}
