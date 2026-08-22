import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  FileText, Award, Loader2, CheckCircle, XCircle, Download,
  Send, Shield, ShieldCheck, Music, Video as VideoIcon, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

const LICENSE_TYPES = [
  { value: 'double', label: 'Licence + Certificat', icon: ShieldCheck, desc: 'Les deux documents (recommandé)' },
  { value: 'distribution', label: 'Licence de distribution', icon: FileText, desc: 'Contrat autorisant KKD à distribuer' },
  { value: 'authenticite', label: "Certificat d'authenticité", icon: Award, desc: 'Atteste l\'originalité de l\'œuvre' },
];

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-400', icon: Loader2 },
  genere: { label: 'Généré', color: 'bg-blue-500/10 text-blue-400', icon: CheckCircle },
  envoye: { label: 'Envoyé', color: 'bg-green-500/10 text-green-400', icon: Send },
  expire: { label: 'Expiré', color: 'bg-orange-500/10 text-orange-400', icon: XCircle },
  refuse: { label: 'Refusé', color: 'bg-red-500/10 text-red-400', icon: XCircle },
};

export default function LicenseManager({ user, linkedArtistId, linkedArtistName }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedWork, setSelectedWork] = useState('');
  const [workType, setWorkType] = useState('release');
  const [licenseType, setLicenseType] = useState('double');
  const [generating, setGenerating] = useState(false);

  // Récupérer les sorties et vidéos de l'artiste
  const { data: releases = [] } = useQuery({
    queryKey: ['license-releases', linkedArtistName],
    queryFn: () => base44.entities.Release.filter({ artist_name: linkedArtistName }, '-release_date'),
    enabled: !!linkedArtistName,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['license-videos', linkedArtistName],
    queryFn: () => base44.entities.Video.filter({ artist_name: linkedArtistName }, '-publish_date'),
    enabled: !!linkedArtistName,
  });

  // Licences existantes
  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['my-licenses', user?.email],
    queryFn: () => base44.entities.MusicLicense.filter({ requested_by_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const works = workType === 'release' ? releases : videos;

  const handleGenerate = async () => {
    if (!linkedArtistId) {
      toast({ title: 'Artiste requis', description: 'Réclamez votre profil artiste pour générer des licences.', variant: 'destructive' });
      return;
    }
    if (!selectedWork) {
      toast({ title: 'Œuvre requise', description: 'Sélectionnez une sortie ou une vidéo.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateMusicLicense', {
        artist_id: linkedArtistId,
        release_id: workType === 'release' ? selectedWork : '',
        video_id: workType === 'video' ? selectedWork : '',
        license_type: licenseType,
        recipient_email: user.email,
      });
      if (res.data?.error) {
        toast({ title: 'Échec', description: res.data.error, variant: 'destructive' });
      } else {
        toast({
          title: 'Documents générés et envoyés',
          description: `Email envoyé à ${res.data.sent_to}. Vérifiez votre boîte de réception.`,
        });
        queryClient.invalidateQueries({ queryKey: ['my-licenses'] });
        setSelectedWork('');
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err?.message || 'Génération échouée', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  if (!linkedArtistId) {
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
          Générez des documents professionnels (licence de distribution, certificat d'authenticité) envoyés par email.
        </p>
      </div>

      {/* Générateur */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          <h3 className="font-heading font-bold text-sm">Générer un nouveau document</h3>
        </div>

        {/* Type d'œuvre */}
        <div>
          <Label className="text-xs mb-1.5 block">Type d'œuvre</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setWorkType('release'); setSelectedWork(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${workType === 'release' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
            >
              <Music size={13} /> Sortie musicale
            </button>
            <button
              type="button"
              onClick={() => { setWorkType('video'); setSelectedWork(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${workType === 'video' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
            >
              <VideoIcon size={13} /> Clip vidéo
            </button>
          </div>
        </div>

        {/* Sélection de l'œuvre */}
        <div>
          <Label className="text-xs mb-1.5 block">Œuvre concernée</Label>
          <Select value={selectedWork} onValueChange={setSelectedWork}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez..." />
            </SelectTrigger>
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

        {/* Type de licence */}
        <div>
          <Label className="text-xs mb-1.5 block">Type de document</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {LICENSE_TYPES.map(lt => {
              const Icon = lt.icon;
              return (
                <button
                  key={lt.value}
                  type="button"
                  onClick={() => setLicenseType(lt.value)}
                  className={`text-left p-3 rounded-xl border transition-all ${licenseType === lt.value ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/30'}`}
                >
                  <Icon size={16} className={licenseType === lt.value ? 'text-primary' : 'text-muted-foreground'} />
                  <p className="font-heading font-bold text-xs mt-1.5">{lt.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{lt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!selectedWork || generating}
          className="w-full gap-2 h-11"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {generating ? 'Génération & envoi...' : 'Générer et envoyer par email'}
        </Button>
      </div>

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
                        {lic.document_url && (
                          <a href={lic.document_url} target="_blank" rel="noreferrer"
                            className="text-[11px] text-primary hover:underline flex items-center gap-1">
                            <Download size={10} /> Licence
                          </a>
                        )}
                        {lic.certificate_url && (
                          <a href={lic.certificate_url} target="_blank" rel="noreferrer"
                            className="text-[11px] text-primary hover:underline flex items-center gap-1">
                            <Download size={10} /> Certificat
                          </a>
                        )}
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