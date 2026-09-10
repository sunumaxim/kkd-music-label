import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  FileText, Award, Loader2, CheckCircle, XCircle, Download,
  Send, Shield, ShieldCheck, Music, Video as VideoIcon, Calendar, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { generatePdfBlobs, buildPdfDataFromBackend } from '@/lib/licensePdf';

const LICENSE_TYPES = [
  { value: 'double', label: 'Licence + Certificat', icon: ShieldCheck, desc: 'Les deux documents (recommandé)' },
  { value: 'distribution', label: 'Licence de distribution', icon: FileText, desc: 'Contrat autorisant KKD à distribuer' },
  { value: 'authenticite', label: "Certificat d'authenticité", icon: Award, desc: 'Atteste l\'originalité de l\'œuvre' },
];

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600', icon: Loader2 },
  genere: { label: 'Généré', color: 'bg-blue-500/10 text-blue-600', icon: CheckCircle },
  envoye: { label: 'Envoyé', color: 'bg-emerald-500/10 text-emerald-600', icon: Send },
  expire: { label: 'Expiré', color: 'bg-orange-500/10 text-orange-600', icon: XCircle },
  refuse: { label: 'Refusé', color: 'bg-red-500/10 text-red-600', icon: XCircle },
};

export default function LicenseManager({ user, linkedArtistId, linkedArtistName, managedArtists = [] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedArtistId, setSelectedArtistId] = useState(linkedArtistId || '');
  const [selectedWork, setSelectedWork] = useState('');
  const [workType, setWorkType] = useState('release');
  const [licenseType, setLicenseType] = useState('double');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(null);

  const isLabel = managedArtists.length > 1;
  const activeArtistId = isLabel ? selectedArtistId : linkedArtistId;
  const activeArtistName = isLabel
    ? managedArtists.find(a => a.id === selectedArtistId)?.name
    : linkedArtistName;

  // Récupérer les sorties et vidéos de l'artiste actif
  const { data: releases = [] } = useQuery({
    queryKey: ['license-releases', activeArtistName],
    queryFn: () => base44.entities.Release.filter({ artist_name: activeArtistName }, '-release_date'),
    enabled: !!activeArtistName,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['license-videos', activeArtistName],
    queryFn: () => base44.entities.Video.filter({ artist_name: activeArtistName }, '-publish_date'),
    enabled: !!activeArtistName,
  });

  // Licences existantes (pour cet artiste si label, sinon toutes les miennes)
  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['my-licenses', user?.email, activeArtistId],
    queryFn: () => base44.entities.MusicLicense.filter({ requested_by_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const works = workType === 'release' ? releases : videos;

  const handleGenerate = async () => {
    if (!activeArtistId) {
      toast({ title: 'Artiste requis', description: 'Sélectionnez un artiste.', variant: 'destructive' });
      return;
    }
    if (!selectedWork) {
      toast({ title: 'Œuvre requise', description: 'Sélectionnez une sortie ou une vidéo.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateMusicLicense', {
        artist_id: activeArtistId,
        release_id: workType === 'release' ? selectedWork : '',
        video_id: workType === 'video' ? selectedWork : '',
        license_type: licenseType,
        recipient_email: user.email,
        preview_only: true,
      });
      if (res.data?.error) {
        toast({ title: 'Échec', description: res.data.error, variant: 'destructive' });
      } else {
        const pdfData = await buildPdfDataFromBackend(res.data);
        const urls = await generatePdfBlobs(pdfData, licenseType);
        setPreview({
          document_url: urls.license_url || '',
          certificate_url: urls.certificate_url || '',
          license_number: res.data.license_number,
          certificate_number: res.data.certificate_number,
          sent_to: res.data.sent_to,
          _params: {
            artist_id: activeArtistId,
            release_id: workType === 'release' ? selectedWork : '',
            video_id: workType === 'video' ? selectedWork : '',
            license_type: licenseType,
            recipient_email: user.email,
          },
        });
        toast({ title: 'Document généré', description: 'Prévisualisez, puis envoyez ou téléchargez.' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err?.message || 'Génération échouée', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!preview?._params) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('generateMusicLicense', {
        ...preview._params,
        preview_only: false,
      });
      if (res.data?.error) {
        toast({ title: 'Échec envoi', description: res.data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Email envoyé', description: `Documents envoyés à ${res.data.sent_to}.` });
        if (preview?.document_url?.startsWith('blob:')) URL.revokeObjectURL(preview.document_url);
        if (preview?.certificate_url?.startsWith('blob:')) URL.revokeObjectURL(preview.certificate_url);
        setPreview(null);
        setSelectedWork('');
        queryClient.invalidateQueries({ queryKey: ['my-licenses'] });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err?.message || 'Envoi échoué', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (!linkedArtistId && managedArtists.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
        <Shield size={40} className="mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="font-display font-bold text-lg mb-2">Profil artiste requis</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Réclamez votre profil artiste vérifié pour générer des licences professionnelles et des certificats d'authenticité.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold">Licences & Certificats</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Générez des documents professionnels signés KKD Music. Prévisualisez, téléchargez ou envoyez par email.
        </p>
      </div>

      {/* Sélecteur d'artiste (label) */}
      {isLabel && (
        <div>
          <Label className="text-xs mb-1.5 block">Artiste (label)</Label>
          <Select value={selectedArtistId} onValueChange={(v) => { setSelectedArtistId(v); setSelectedWork(''); }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionnez un artiste..." /></SelectTrigger>
            <SelectContent>
              {managedArtists.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Étape prévisualisation ── */}
      {preview ? (
        <div className="bg-card border border-emerald-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-500" />
            <h3 className="font-heading font-bold text-sm">Document généré — Prévisualisation</h3>
          </div>

          <div className="bg-emerald-500/5 rounded-xl p-3 text-xs">
            <p className="font-semibold">Licence N° {preview.license_number}</p>
            {preview.certificate_number && <p>Certificat N° {preview.certificate_number}</p>}
            <p className="mt-1 text-muted-foreground">Destinataire : {preview.sent_to}</p>
          </div>

          {preview.document_url && (
            <div>
              <p className="text-xs font-semibold mb-1 flex items-center gap-1"><FileText size={12} /> Licence de distribution</p>
              <iframe src={preview.document_url} className="w-full h-64 rounded-lg border border-border/50" title="Licence" />
            </div>
          )}
          {preview.certificate_url && (
            <div>
              <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Award size={12} /> Certificat d'authenticité</p>
              <iframe src={preview.certificate_url} className="w-full h-64 rounded-lg border border-border/50" title="Certificat" />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {preview.document_url && (
              <a href={preview.document_url} target="_blank" rel="noreferrer" download>
                <Button variant="outline" size="sm" className="gap-2"><Download size={14} /> Licence</Button>
              </a>
            )}
            {preview.certificate_url && (
              <a href={preview.certificate_url} target="_blank" rel="noreferrer" download>
                <Button variant="outline" size="sm" className="gap-2"><Download size={14} /> Certificat</Button>
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={() => {
              if (preview?.document_url?.startsWith('blob:')) URL.revokeObjectURL(preview.document_url);
              if (preview?.certificate_url?.startsWith('blob:')) URL.revokeObjectURL(preview.certificate_url);
              setPreview(null); setSelectedWork('');
            }}>
              <Plus size={14} /> Nouveau
            </Button>
            <Button size="sm" onClick={handleSend} disabled={sending} className="gap-2 ml-auto">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Envoi...' : 'Envoyer par email'}
            </Button>
          </div>
        </div>
      ) : (
        /* ── Générateur ── */
        <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h3 className="font-heading font-bold text-sm">Générer un nouveau document</h3>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Type d'œuvre</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setWorkType('release'); setSelectedWork(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${workType === 'release' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                <Music size={13} /> Sortie musicale
              </button>
              <button type="button" onClick={() => { setWorkType('video'); setSelectedWork(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${workType === 'video' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                <VideoIcon size={13} /> Clip vidéo
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Œuvre concernée</Label>
            <Select value={selectedWork} onValueChange={setSelectedWork} disabled={!activeArtistId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
              <SelectContent>
                {works.length === 0 ? (
                  <SelectItem value="_none" disabled>Aucune œuvre disponible</SelectItem>
                ) : works.map(w => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.title} {w.release_date ? `· ${format(new Date(w.release_date), 'dd MMM yyyy', { locale: fr })}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Type de document</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {LICENSE_TYPES.map(lt => {
                const Icon = lt.icon;
                return (
                  <button key={lt.value} type="button" onClick={() => setLicenseType(lt.value)}
                    className={`text-left p-3 rounded-xl border transition-all ${licenseType === lt.value ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/30'}`}>
                    <Icon size={16} className={licenseType === lt.value ? 'text-primary' : 'text-muted-foreground'} />
                    <p className="font-heading font-bold text-xs mt-1.5">{lt.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{lt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={!selectedWork || generating || !activeArtistId} className="w-full gap-2 h-11">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {generating ? 'Génération...' : 'Générer & prévisualiser'}
          </Button>
        </div>
      )}

      {/* Licences existantes */}
      <div>
        <h3 className="font-heading font-bold text-sm mb-3">Mes documents</h3>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 size={16} className="animate-spin" /> Chargement...
          </div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border/30 rounded-xl">
            <FileText size={28} className="mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Aucun document généré pour l'instant</p>
          </div>
        ) : (
          <div className="space-y-2">
            {licenses.map(lic => {
              const st = STATUS_CONFIG[lic.status] || STATUS_CONFIG.en_attente;
              const StIcon = st.icon;
              return (
                <motion.div
                  key={lic.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border/50 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${st.color}`}>
                      <StIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-heading font-bold text-sm">
                            {lic.release_title || lic.video_title || lic.artist_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lic.license_type === 'double' ? 'Licence + Certificat' :
                             lic.license_type === 'distribution' ? 'Licence de distribution' :
                             "Certificat d'authenticité"}
                          </p>
                        </div>
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${st.color}`}>{st.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <a href={`/document/${lic.id}`} target="_blank" rel="noreferrer"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1">
                          <Download size={10} /> Voir les documents
                        </a>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar size={10} />
                          {lic.sent_date ? format(new Date(lic.sent_date), 'dd MMM yyyy', { locale: fr }) : 'En attente'}
                        </span>
                      </div>
                      {lic.originality_hash && (
                        <p className="text-[10px] font-mono text-muted-foreground/60 mt-1.5 truncate">
                          SHA-256 : {lic.originality_hash.slice(0, 32)}...
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}