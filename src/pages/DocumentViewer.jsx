import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { generatePdfBlobs, buildPdfDataFromBackend } from '@/lib/licensePdf';
import { Button } from '@/components/ui/button';
import { FileText, Award, Download, Loader2, ShieldCheck, ShieldAlert, Lock, ArrowLeft, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function DocumentViewer() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [license, setLicense] = useState(null);
  const [blobs, setBlobs] = useState({});

  const id = new URLSearchParams(window.location.search).get('id') || window.location.pathname.split('/').pop();

  useEffect(() => {
    if (!id) { setError('Identifiant de document manquant'); setLoading(false); return; }
    
    // Si l'utilisateur n'est pas connecté, bloquer immédiatement l'accès
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await base44.functions.invoke('getLicenseDocument', { 
          id,
          user_email: user.email
        });

        if (res.data?.is_unauthorized || res.data?.error) {
          setIsUnauthorized(Boolean(res.data?.is_unauthorized));
          setError(res.data?.error || 'Accès non autorisé');
          return;
        }

        const lic = res.data?.license || res.data;
        if (!lic) {
          setError('Document de licence introuvable');
          return;
        }

        setLicense(lic);
        const pdfData = await buildPdfDataFromBackend({
          ...lic,
          ...lic.pdf_data,
          license_id: lic.license_id || lic.id,
        });
        const urls = await generatePdfBlobs(pdfData, lic.license_type);
        setBlobs(urls);
      } catch (err) {
        setError(err?.message || 'Erreur de chargement du document');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f1117] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-[#161a24] border border-white/[0.08] p-8 rounded-3xl shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock size={28} />
          </div>
          <h2 className="font-display font-extrabold text-xl">Authentification Requise</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Ce document juridique officiel (licence d'exploitation et certificat d'authenticité) est strictement confidentiel et protégé par DRM juridique.
          </p>
          <p className="text-xs text-zinc-500">
            Veuillez vous connecter avec le compte ayant acquis la licence ou l'artiste ayant-droit pour consulter ou télécharger ce document.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Button onClick={login} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2">
              <LogIn size={16} /> Se connecter pour débloquer l'accès
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full border-white/10 text-zinc-400 hover:text-white">
              <ArrowLeft size={16} className="mr-2" /> Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-primary mx-auto" />
          <p className="text-sm text-zinc-400 font-mono tracking-wider uppercase text-xs">Vérification des droits d'accès & cryptographie...</p>
        </div>
      </div>
    );
  }

  if (error || isUnauthorized) {
    return (
      <div className="min-h-screen bg-[#0f1117] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-[#161a24] border border-rose-500/30 p-8 rounded-3xl shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <h2 className="font-display font-extrabold text-xl text-rose-300">Accès Strictement Refusé</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {error || "Vous n'êtes pas l'acquéreur légal, l'artiste détenteur des droits ou l'administrateur de cette licence."}
          </p>
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] text-left text-xs text-zinc-400 space-y-1 font-mono">
            <p>• Compte actif : <span className="text-white">{user?.email}</span></p>
            <p>• Protocole : Protection anti-téléchargement illicite KKD</p>
            <p>• Statut : Verrouillé</p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => navigate('/musique')} className="w-full border-white/10 text-zinc-300 hover:text-white">
              <ArrowLeft size={16} className="mr-2" /> Catalogue Musique
            </Button>
            <Button onClick={() => navigate('/mes-achats')} className="w-full bg-white/[0.08] hover:bg-white/[0.15] text-white">
              Mes Licences Officielles
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="font-heading text-lg font-extrabold text-white">
                {license?.license_type === 'distribution' ? 'Licence de distribution officielle' :
                 license?.license_type === 'authenticite' ? "Certificat d'authenticité certifié" :
                 'Documents juridiques certifiés KKD Music'}
              </h1>
              <p className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Accès authentifié • Titulaire vérifié ({user.email})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {blobs.license_url && (
              <a href={blobs.license_url} download={`${license?.license_number || 'licence-kkd'}.pdf`}>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2">
                  <Download size={14} /> Télécharger Licence
                </Button>
              </a>
            )}
            {blobs.certificate_url && (
              <a href={blobs.certificate_url} download={`${license?.certificate_number || 'certificat-kkd'}.pdf`}>
                <Button size="sm" variant="outline" className="border-white/10 hover:bg-white/[0.08] text-white gap-2">
                  <Download size={14} /> Certificat
                </Button>
              </a>
            )}
          </div>
        </div>

        {license && (
          <div className="bg-[#151924] border border-white/[0.08] rounded-2xl p-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">N° Licence</span>
                <strong className="text-white font-bold">{license.license_number || 'En cours'}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">N° Certificat</span>
                <strong className="text-white font-bold">{license.certificate_number || 'En cours'}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Artiste Ayant-Droit</span>
                <strong className="text-white font-bold truncate block">{license.artist_name}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Titulaire Légal</span>
                <strong className="text-emerald-400 font-bold truncate block">{license.buyer_email || user.email}</strong>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6 pt-2">
          {blobs.license_url && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-300 flex items-center gap-2 font-mono uppercase tracking-wider">
                <FileText size={14} className="text-primary" /> Licence d'Exploitation Commerciale
              </p>
              <iframe src={blobs.license_url} className="w-full h-[75vh] rounded-2xl border border-white/[0.1] bg-[#1a1e2a]" title="Licence de distribution" />
            </div>
          )}
          {blobs.certificate_url && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-300 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Award size={14} className="text-amber-400" /> Certificat d'Authenticité & Empreinte Numérique
              </p>
              <iframe src={blobs.certificate_url} className="w-full h-[75vh] rounded-2xl border border-white/[0.1] bg-[#1a1e2a]" title="Certificat d'authenticité" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}