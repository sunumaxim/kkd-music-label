import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { generatePdfBlobs, buildPdfDataFromBackend } from '@/lib/licensePdf';
import { Button } from '@/components/ui/button';
import { FileText, Award, Download, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DocumentViewer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [license, setLicense] = useState(null);
  const [blobs, setBlobs] = useState({});

  const id = new URLSearchParams(window.location.search).get('id') || window.location.pathname.split('/').pop();

  useEffect(() => {
    if (!id) { setError('ID manquant'); setLoading(false); return; }
    (async () => {
      try {
        const res = await base44.functions.invoke('getLicenseDocument', { id });
        if (res.data?.error) { setError(res.data.error); return; }
        const lic = res.data;
        setLicense(lic);
        const pdfData = await buildPdfDataFromBackend({
          ...lic,
          ...lic.pdf_data,
          license_id: lic.license_id,
        });
        const urls = await generatePdfBlobs(pdfData, lic.license_type);
        setBlobs(urls);
      } catch (err) {
        setError(err?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Génération du document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <ShieldCheck size={40} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-heading font-bold text-lg mb-1">Document introuvable</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft size={16} className="mr-2" /> Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" />
            <h1 className="font-heading text-lg font-extrabold">
              {license?.license_type === 'distribution' ? 'Licence de distribution' :
               license?.license_type === 'authenticite' ? "Certificat d'authenticité" :
               'Documents officiels'}
            </h1>
          </div>
          <div className="flex gap-2">
            {blobs.license_url && (
              <a href={blobs.license_url} download={`${license?.license_number || 'licence'}.pdf`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download size={14} /> Licence
                </Button>
              </a>
            )}
            {blobs.certificate_url && (
              <a href={blobs.certificate_url} download={`${license?.certificate_number || 'certificat'}.pdf`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download size={14} /> Certificat
                </Button>
              </a>
            )}
          </div>
        </div>

        {license && (
          <div className="bg-card border border-border/50 rounded-xl p-3 mb-4 text-xs">
            <div className="flex flex-wrap gap-4">
              {license.license_number && <span className="text-muted-foreground">Licence N° <strong className="text-foreground">{license.license_number}</strong></span>}
              {license.certificate_number && <span className="text-muted-foreground">Certificat N° <strong className="text-foreground">{license.certificate_number}</strong></span>}
              <span className="text-muted-foreground">Artiste : <strong className="text-foreground">{license.artist_name}</strong></span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {blobs.license_url && (
            <div>
              <p className="text-xs font-semibold mb-1 flex items-center gap-1"><FileText size={12} /> Licence de distribution</p>
              <iframe src={blobs.license_url} className="w-full h-[70vh] rounded-lg border border-border/50" title="Licence de distribution" />
            </div>
          )}
          {blobs.certificate_url && (
            <div>
              <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Award size={12} /> Certificat d'authenticité</p>
              <iframe src={blobs.certificate_url} className="w-full h-[70vh] rounded-lg border border-border/50" title="Certificat d'authenticité" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}