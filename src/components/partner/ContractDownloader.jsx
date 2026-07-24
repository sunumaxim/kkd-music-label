import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText } from 'lucide-react';
import ContractDocument from './ContractDocument';
import { downloadContractPdf } from '@/lib/contractPdf';

export default function ContractDownloader({ invite, label = 'Télécharger le contrat', variant = 'default', size = 'sm' }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const name = (invite?.artist_name || 'artiste').replace(/\s+/g, '_');
      await downloadContractPdf(ref.current, `Contrat_KKD_Music_${name}.pdf`);
    } catch (e) {
      console.error('Contract PDF error:', e);
      alert('Erreur lors de la génération du contrat. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button onClick={handleDownload} disabled={busy} variant={variant} size={size} className="gap-1.5">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        {busy ? 'Génération…' : label}
      </Button>

      {/* Rendu hors écran pour la capture PDF */}
      <div style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
        <div ref={ref}>
          <ContractDocument invite={invite} />
        </div>
      </div>
    </>
  );
}