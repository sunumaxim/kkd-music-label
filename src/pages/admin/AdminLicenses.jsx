import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  FileText, Award, Loader2, CheckCircle, XCircle, Download, Send,
  ShieldCheck, Music, Video as VideoIcon, Calendar, Search, Plus, Mail, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

const LICENSE_TYPES = [
  { value: 'double', label: 'Licence + Certificat', icon: ShieldCheck },
  { value: 'distribution', label: 'Licence de distribution', icon: FileText },
  { value: 'authenticite', label: "Certificat d'authenticité", icon: Award },
];

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600', icon: Loader2 },
  genere: { label: 'Généré', color: 'bg-blue-500/10 text-blue-600', icon: CheckCircle },
  envoye: { label: 'Envoyé', color: 'bg-emerald-500/10 text-emerald-600', icon: Send },
  expire: { label: 'Expiré', color: 'bg-orange-500/10 text-orange-600', icon: XCircle },
  refuse: { label: 'Refusé', color: 'bg-red-500/10 text-red-600', icon: XCircle },
};

export default function AdminLicenses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerator, setShowGenerator] = useState(false);

  // All licenses
  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: () => base44.entities.MusicLicense.list('-created_date', 200),
  });

  // All artists (for generator)
  const { data: artists = [] } = useQuery({
    queryKey: ['admin-artists-for-licenses'],
    queryFn: () => base44.entities.Artist.list('name', 200),
  });

  const stats = {
    total: licenses.length,
    envoye: licenses.filter(l => l.status === 'envoye').length,
    genere: licenses.filter(l => l.status === 'genere').length,
    en_attente: licenses.filter(l => l.status === 'en_attente').length,
  };

  const filtered = licenses.filter(l => {
    const matchSearch = !search ||
      l.artist_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.release_title?.toLowerCase().includes(search.toLowerCase()) ||
      l.video_title?.toLowerCase().includes(search.toLowerCase()) ||
      l.sent_to_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const resendMutation = useMutation({
    mutationFn: async (lic) => {
      const res = await base44.functions.invoke('sendLicenseEmail', { license_id: lic.id });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.error) {
        toast({ title: 'Échec', description: data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Email envoyé', description: `Documents envoyés à ${data.sent_to}.` });
        queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
      }
    },
    onError: (err) => {
      toast({ title: 'Erreur', description: err?.message || 'Échec de l\'envoi', variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold flex items-center gap-2">
            <ShieldCheck size={24} className="text-primary" />
            Documents & Licences
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Générez et envoyez des licences et certificats aux artistes et partenaires.
          </p>
        </div>
        <Button onClick={() => setShowGenerator(true)} className="gap-2 shrink-0">
          <Plus size={16} /> Générer un document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
          <p className="font-heading text-xl font-extrabold">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
        </div>
        <div className="bg-card border border-emerald-500/20 rounded-xl p-3 text-center">
          <p className="font-heading text-xl font-extrabold text-emerald-600">{stats.envoye}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Envoyés</p>
        </div>
        <div className="bg-card border border-blue-500/20 rounded-xl p-3 text-center">
          <p className="font-heading text-xl font-extrabold text-blue-600">{stats.genere}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Générés</p>
        </div>
        <div className="bg-card border border-yellow-500/20 rounded-xl p-3 text-center">
          <p className="font-heading text-xl font-extrabold text-yellow-600">{stats.en_attente}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">En attente</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par artiste, œuvre, email..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="envoye">Envoyé</SelectItem>
            <SelectItem value="genere">Généré</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="expire">Expiré</SelectItem>
            <SelectItem value="refuse">Refusé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
          <FileText size={36} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Aucun document trouvé</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Générez un nouveau document pour un artiste</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(lic => {
            const st = STATUS_CONFIG[lic.status] || STATUS_CONFIG.en_attente;
            const StIcon = st.icon;
            return (
              <div key={lic.id} className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${st.color}`}>
                    <StIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-sm truncate">
                          {lic.release_title || lic.video_title || lic.artist_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lic.artist_name} · {lic.license_type === 'double' ? 'Licence + Certificat' :
                            lic.license_type === 'distribution' ? 'Licence de distribution' :
                            "Certificat d'authenticité"}
                        </p>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${st.color}`}>{st.label}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {lic.document_url && (
                        <a href={lic.document_url} target="_blank" rel="noreferrer"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1">
                          <Download size={11} /> Licence
                        </a>
                      )}
                      {lic.certificate_url && (
                        <a href={lic.certificate_url} target="_blank" rel="noreferrer"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1">
                          <Download size={11} /> Certificat
                        </a>
                      )}
                      {lic.sent_to_email && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                          <Mail size={11} /> {lic.sent_to_email}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar size={11} />
                        {lic.sent_date ? format(new Date(lic.sent_date), 'dd MMM yyyy', { locale: fr }) : 'En attente'}
                      </span>
                    </div>

                    {lic.originality_hash && (
                      <p className="text-[10px] font-mono text-muted-foreground/60 mt-1.5 truncate">
                        SHA-256 : {lic.originality_hash.slice(0, 32)}...
                      </p>
                    )}

                    {lic.status === 'envoye' && lic.sent_to_email && (
                      <button
                        onClick={() => resendMutation.mutate(lic)}
                        disabled={resendMutation.isPending}
                        className="mt-2 text-[11px] text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        <RefreshCw size={11} className={resendMutation.isPending ? 'animate-spin' : ''} />
                        Renvoyer par email
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generator Dialog */}
      {showGenerator && (
        <LicenseGenerator
          artists={artists}
          onClose={() => setShowGenerator(false)}
          onGenerated={() => {
            setShowGenerator(false);
            queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
          }}
        />
      )}
    </div>
  );
}

// ── Generator Dialog (flux : sélection → prévisualisation → envoi) ──
function LicenseGenerator({ artists, onClose, onGenerated }) {
  const { toast } = useToast();
  const [artistId, setArtistId] = useState('');
  const [workType, setWorkType] = useState('release');
  const [workId, setWorkId] = useState('');
  const [licenseType, setLicenseType] = useState('double');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(null); // { license_id, document_url, certificate_url, sent_to }

  const selectedArtist = artists.find(a => a.id === artistId);

  const { data: releases = [] } = useQuery({
    queryKey: ['gen-releases', selectedArtist?.name],
    queryFn: () => base44.entities.Release.filter({ artist_name: selectedArtist.name }, '-release_date'),
    enabled: !!selectedArtist?.name,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['gen-videos', selectedArtist?.name],
    queryFn: () => base44.entities.Video.filter({ artist_name: selectedArtist.name }, '-publish_date'),
    enabled: !!selectedArtist?.name,
  });

  const works = workType === 'release' ? releases : videos;

  const handleGenerate = async () => {
    if (!artistId) { toast({ title: 'Sélectionnez un artiste', variant: 'destructive' }); return; }
    if (!workId) { toast({ title: 'Sélectionnez une œuvre', variant: 'destructive' }); return; }
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateMusicLicense', {
        artist_id: artistId,
        release_id: workType === 'release' ? workId : '',
        video_id: workType === 'video' ? workId : '',
        license_type: licenseType,
        recipient_email: recipientEmail || undefined,
        preview_only: true,
      });
      if (res.data?.error) {
        toast({ title: 'Échec', description: res.data.error, variant: 'destructive' });
      } else {
        setPreview(res.data);
        toast({ title: 'Document généré', description: 'Prévisualisez puis envoyez ou téléchargez.' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err?.message || 'Génération échouée', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!preview?.license_id) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendLicenseEmail', {
        license_id: preview.license_id,
        recipient_email: recipientEmail || undefined,
      });
      if (res.data?.error) {
        toast({ title: 'Échec envoi', description: res.data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Email envoyé', description: `Documents envoyés à ${res.data.sent_to}.` });
        onGenerated();
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err?.message || 'Envoi échoué', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setArtistId('');
    setWorkId('');
    setRecipientEmail('');
  };

  // ── Étape 2 : Prévisualisation ──
  if (preview) {
    return (
      <Dialog open onOpenChange={() => { reset(); onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" /> Document généré — Prévisualisation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-700">
              <p className="font-semibold">Licence N° {preview.license_number}</p>
              {preview.certificate_number && <p>Certificat N° {preview.certificate_number}</p>}
              <p className="mt-1 text-muted-foreground">Destinataire : {preview.sent_to}</p>
            </div>

            {/* PDF Preview */}
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
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-wrap">
              {preview.document_url && (
                <a href={preview.document_url} target="_blank" rel="noreferrer" download>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <Download size={15} /> Licence
                  </Button>
                </a>
              )}
              {preview.certificate_url && (
                <a href={preview.certificate_url} target="_blank" rel="noreferrer" download>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <Download size={15} /> Certificat
                  </Button>
                </a>
              )}
            </div>
            <div className="flex gap-2 flex-1 sm:justify-end">
              <Button variant="ghost" onClick={() => { reset(); }}>
                <Plus size={15} /> Nouveau
              </Button>
              <Button onClick={handleSend} disabled={sending} className="gap-2 flex-1 sm:flex-none">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Envoi...' : 'Envoyer par email'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Étape 1 : Sélection ──
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" /> Générer un document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">Artiste</Label>
            <Select value={artistId} onValueChange={(v) => { setArtistId(v); setWorkId(''); }}>
              <SelectTrigger><SelectValue placeholder="Sélectionnez un artiste..." /></SelectTrigger>
              <SelectContent>
                {artists.length === 0 ? (
                  <SelectItem value="_none" disabled>Aucun artiste</SelectItem>
                ) : artists.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {artistId && (
            <div>
              <Label className="text-xs mb-1.5 block">Type d'œuvre</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setWorkType('release'); setWorkId(''); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${workType === 'release' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  <Music size={13} /> Sortie
                </button>
                <button type="button" onClick={() => { setWorkType('video'); setWorkId(''); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${workType === 'video' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  <VideoIcon size={13} /> Clip
                </button>
              </div>
            </div>
          )}

          {artistId && (
            <div>
              <Label className="text-xs mb-1.5 block">Œuvre</Label>
              <Select value={workId} onValueChange={setWorkId}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                <SelectContent>
                  {works.length === 0 ? (
                    <SelectItem value="_none" disabled>Aucune œuvre</SelectItem>
                  ) : works.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.title} {w.release_date ? `· ${format(new Date(w.release_date), 'dd MMM yyyy', { locale: fr })}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs mb-1.5 block">Type de document</Label>
            <div className="grid grid-cols-1 gap-2">
              {LICENSE_TYPES.map(lt => {
                const Icon = lt.icon;
                return (
                  <button key={lt.value} type="button" onClick={() => setLicenseType(lt.value)}
                    className={`text-left p-3 rounded-xl border transition-all ${licenseType === lt.value ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/30'}`}>
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={licenseType === lt.value ? 'text-primary' : 'text-muted-foreground'} />
                      <p className="font-heading font-bold text-xs">{lt.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Email destinataire (optionnel)</Label>
            <Input
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder={selectedArtist?.name ? `Email de ${selectedArtist.name}...` : 'Laissez vide pour l\'email de l\'artiste'}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Le document sera prévisualisé. Vous pourrez ensuite l'envoyer ou le télécharger.
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleGenerate} disabled={generating || !artistId || !workId} className="gap-2">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {generating ? 'Génération...' : 'Générer & prévisualiser'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}