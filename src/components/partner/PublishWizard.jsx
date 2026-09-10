import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Music, Video, X, ArrowLeft, ArrowRight, Check, Upload,
  UserPlus, CheckCircle, ShoppingBag, Link2, Sparkles, AlertCircle
} from 'lucide-react';
import ArtistSelector from './ArtistSelector';
import MediaUploader from './MediaUploader';
import { useToast } from '@/components/ui/use-toast';

const PLATFORMS = [
  { value: 'spotify', label: 'Spotify' },
  { value: 'apple_music', label: 'Apple Music' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'audiomack', label: 'Audiomack' },
  { value: 'deezer', label: 'Deezer' },
  { value: 'soundcloud', label: 'SoundCloud' },
];

const QUICK_PRICES = [500, 1000, 2000, 5000];

export default function PublishWizard({ user, onClose }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState(0); // 0:type · 1:sale · 2:artist · 3:content
  const [type, setType] = useState(null); // 'son' | 'video'
  const [sale, setSale] = useState(false);
  const [price, setPrice] = useState(1000); // 1000 F CFA default

  const [artistMode, setArtistMode] = useState('linked'); // 'linked' | 'new' | 'request'
  const [pickedLinkedId, setPickedLinkedId] = useState('');
  const [newArtist, setNewArtist] = useState({ name: '', genre: '', photo_url: '' });
  const [requestArtist, setRequestArtist] = useState({ id: '', name: '', message: '' });

  const [form, setForm] = useState({
    title: '',
    cover_url: '',
    file_url: '',
    genre: 'Afrobeats',
    isrc: '',
    release_year: new Date().getFullYear(),
    lyrics: '',
    streaming_link: '',
    streaming_platform: 'spotify',
    description: '',
  });
  const [uploads, setUploads] = useState({ cover: false, file: false, photo: false });
  const [done, setDone] = useState(null); // {kind:'publication'|'request'}

  // Profils artistes liés au compte (invite + accès approuvés)
  const { data: invite } = useQuery({
    queryKey: ['my-invite', user?.email],
    queryFn: async () => (await base44.entities.ArtistInvite.filter({ email: user.email }))[0] || null,
    enabled: !!user?.email,
  });
  const { data: myAccess = [] } = useQuery({
    queryKey: ['my-access-requests', user?.email],
    queryFn: () => base44.entities.ArtistAccessRequest.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const linkedArtists = useMemo(() => {
    const list = [];
    if (invite?.artist_id) list.push({ id: invite.artist_id, name: invite.artist_name });
    myAccess.filter(r => r.status === 'approuve').forEach(r => {
      if (!list.some(a => a.id === r.artist_id)) list.push({ id: r.artist_id, name: r.artist_name });
    });
    return list;
  }, [invite, myAccess]);

  useEffect(() => {
    if (linkedArtists.length > 0 && !pickedLinkedId) {
      setPickedLinkedId(linkedArtists[0].id);
      setArtistMode('linked');
    } else if (linkedArtists.length === 0) {
      setArtistMode('new');
    }
  }, [linkedArtists, pickedLinkedId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const isVideo = type === 'video';
  const isUploading = uploads.cover || uploads.file || uploads.photo;

  // ---- Uploads ----
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploads(p => ({ ...p, file: true }));
    try {
      if (sale) {
        const res = await base44.integrations.Core.UploadPrivateFile({ file });
        set('file_url', res.file_uri);
        toast({ title: 'Fichier chargé (privé)', description: 'Accessible après achat.' });
      } else {
        const res = await base44.integrations.Core.UploadFile({ file });
        set('file_url', res.file_url);
        toast({ title: 'Fichier chargé' });
      }
    } catch (err) {
      toast({ title: 'Échec du téléversement', description: err?.message, variant: 'destructive' });
    } finally {
      setUploads(p => ({ ...p, file: false }));
    }
  };
  const handleCoverUpload = async (file) => {
    if (!file) return;
    setUploads(p => ({ ...p, cover: true }));
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      set('cover_url', res.file_url);
    } catch (err) {
      toast({ title: 'Échec de la pochette', description: err?.message, variant: 'destructive' });
    } finally {
      setUploads(p => ({ ...p, cover: false }));
    }
  };
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploads(p => ({ ...p, photo: true }));
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setNewArtist(p => ({ ...p, photo_url: res.file_url }));
    } catch (err) {
      toast({ title: 'Échec de la photo', description: err?.message, variant: 'destructive' });
    } finally {
      setUploads(p => ({ ...p, photo: false }));
    }
  };

  // ---- Mutations ----
  const pubMut = useMutation({
    mutationFn: (data) => base44.entities.PartnerPublication.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-publications'] });
      setDone({ kind: 'publication' });
    },
  });
  const reqMut = useMutation({
    mutationFn: (data) => base44.entities.ArtistAccessRequest.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-access-requests'] });
      setDone({ kind: 'request' });
    },
  });

  const pendingForRequest = myAccess.find(r => r.artist_id === requestArtist.id && r.status === 'en_attente');

  // ---- Validation par étape ----
  const canNextType = !!type;
  const canNextSale = !sale || (Number(price) > 0);
  const canNextArtist = artistMode === 'linked'
    ? !!pickedLinkedId
    : artistMode === 'new'
      ? !!newArtist.name.trim()
      : !!requestArtist.id && !pendingForRequest;
  const canPublish = !!form.title.trim() && !!form.cover_url && !!form.file_url && (!sale || Number(price) > 0);

  const submitRequest = () => {
    if (!requestArtist.id) return;
    reqMut.mutate({
      user_email: user.email, user_id: user.id,
      artist_id: requestArtist.id, artist_name: requestArtist.name,
      message: requestArtist.message,
    });
  };

  const publish = () => {
    if (!canPublish) return;
    const linked = linkedArtists.find(a => a.id === pickedLinkedId);
    pubMut.mutate({
      partner_email: user.email,
      partner_name: user.full_name || user.email,
      content_type: isVideo ? 'video_clip' : 'sortie_musicale',
      title: form.title.trim(),
      artist_name: artistMode === 'new' ? newArtist.name.trim() : (linked?.name || ''),
      artist_id: artistMode === 'linked' ? (linked?.id || '') : '',
      new_artist_genre: artistMode === 'new' ? newArtist.genre.trim() : '',
      new_artist_photo_url: artistMode === 'new' ? newArtist.photo_url : '',
      genre: form.genre || '',
      isrc: form.isrc || '',
      lyrics: form.lyrics || '',
      release_year: form.release_year,
      streaming_link: form.streaming_link || '',
      streaming_platform: form.streaming_platform,
      description: form.description || '',
      cover_url: form.cover_url,
      file_url: form.file_url,
      is_for_sale: sale,
      price: sale ? Number(price) : 0,
      preview_start: 0,
    });
  };

  // ---- Écran de fin ----
  if (done) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        {done.kind === 'publication' ? (
          <>
            <h3 className="font-display text-xl font-extrabold mb-2">Publication envoyée !</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              L'équipe KKD valide votre contenu. Dès approbation, il est automatiquement mis en ligne sur la plateforme.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-display text-xl font-extrabold mb-2">Demande d'accès envoyée !</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Vous serez notifié dès validation. Une fois approuvé, vous pourrez publier au nom de cet artiste.
            </p>
          </>
        )}
        <Button onClick={onClose} variant="outline">Fermer</Button>
      </motion.div>
    );
  }

  const STEPS = ['Type', 'Vente', 'Artiste', 'Contenu'];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <h2 className="font-display font-extrabold text-lg">Publier</h2>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1.5 mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 text-[11px] font-medium ${i <= step ? 'text-primary' : 'text-muted-foreground/50'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < step ? 'bg-primary text-white' : i === step ? 'bg-primary/15 text-primary border border-primary/40' : 'bg-secondary text-muted-foreground'}`}>
                {i < step ? <Check size={11} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-primary' : 'bg-border'}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Étape 0 : Type ── */}
        {step === 0 && (
          <motion.div key="type" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <h3 className="font-heading font-bold text-base mb-1">Que publiez-vous ?</h3>
            <p className="text-sm text-muted-foreground mb-5">Choisissez le format de votre contenu.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setType('son'); setStep(1); }}
                className="text-left p-5 rounded-2xl border-2 border-border/50 bg-card hover:border-primary hover:bg-primary/5 transition-all group active:scale-[0.98]">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20">
                  <Music size={22} className="text-primary" />
                </div>
                <p className="font-heading font-bold text-base">Son</p>
                <p className="text-xs text-muted-foreground">Single, titre audio</p>
              </button>
              <button onClick={() => { setType('video'); setStep(1); }}
                className="text-left p-5 rounded-2xl border-2 border-border/50 bg-card hover:border-primary hover:bg-primary/5 transition-all group active:scale-[0.98]">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20">
                  <Video size={22} className="text-primary" />
                </div>
                <p className="font-heading font-bold text-base">Vidéo</p>
                <p className="text-xs text-muted-foreground">Clip, teaser, live</p>
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Étape 1 : Vente ── */}
        {step === 1 && (
          <motion.div key="sale" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setStep(0)} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
              <h3 className="font-heading font-bold text-base">Mettre en vente ou en ligne ?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5 ml-6">Activez la vente si vous voulez commercialiser ce contenu.</p>

            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sale ? 'bg-primary/15' : 'bg-secondary'}`}>
                    {sale ? <ShoppingBag size={18} className="text-primary" /> : <Music size={18} className="text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm">{sale ? 'Mettre en vente' : 'Mettre en ligne'}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {sale
                        ? (isVideo ? 'Clip payant — extrait gratuit puis achat.' : 'Single payant — extrait 30s puis achat.')
                        : 'Gratuit — écoute / visionnage complet.'}
                    </p>
                  </div>
                </div>
                <Switch checked={sale} onCheckedChange={setSale} />
              </div>

              <AnimatePresence>
                {sale && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-4 mt-4 border-t border-border/50 space-y-3">
                      <div>
                        <Label className="text-xs mb-1.5 block font-bold text-white">Prix de vente direct (F CFA) *</Label>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {QUICK_PRICES.map(qp => (
                            <button
                              key={qp}
                              type="button"
                              onClick={() => setPrice(qp)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                Number(price) === qp
                                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                                  : 'bg-secondary text-zinc-300 hover:bg-secondary/80'
                              }`}
                            >
                              {qp.toLocaleString('fr-FR')} F CFA
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="100"
                            step="50"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            className="max-w-[160px] font-mono text-base font-bold text-white"
                          />
                          <span className="text-xs font-mono font-bold text-zinc-400">F CFA</span>
                        </div>
                      </div>
                      <div className="rounded-xl bg-primary/10 border border-primary/25 p-3 text-[11px] text-zinc-300 space-y-1">
                        <p className="font-bold text-primary flex items-center gap-1.5">
                          <Sparkles size={12} /> Direct-to-Consumer (D2C) KKD
                        </p>
                        <p className="text-muted-foreground leading-tight">
                          Les auditeurs paient instantanément par Wave, Orange Money ou Carte. 80% des revenus sont reversés directement sur votre solde partenaire.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" onClick={() => setStep(0)} className="flex-1">Retour</Button>
              <Button onClick={() => canNextSale && setStep(2)} disabled={!canNextSale} className="flex-1 gap-2">
                Continuer <ArrowRight size={15} />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Étape 2 : Artiste ── */}
        {step === 2 && (
          <motion.div key="artist" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
              <h3 className="font-heading font-bold text-base">Profil artiste</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5 ml-6">Toute publication est liée à un profil d'artiste.</p>

            {linkedArtists.length > 0 && artistMode === 'linked' && (
              <div className="space-y-2">
                {linkedArtists.map(a => (
                  <button key={a.id} onClick={() => setPickedLinkedId(a.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${pickedLinkedId === a.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/40'}`}>
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">{a.name?.[0]}</div>
                    <span className="font-heading font-bold text-sm flex-1">{a.name}</span>
                    {pickedLinkedId === a.id && <Check size={16} className="text-primary" />}
                  </button>
                ))}
                <button onClick={() => setArtistMode('request')}
                  className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                  <UserPlus size={14} /> Demander l'accès à un autre profil
                </button>
              </div>
            )}

            {linkedArtists.length === 0 && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button onClick={() => setArtistMode('new')}
                    className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-all ${artistMode === 'new' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                    Créer mon profil
                  </button>
                  <button onClick={() => setArtistMode('request')}
                    className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-all ${artistMode === 'request' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                    Réclamer un profil existant
                  </button>
                </div>

                {artistMode === 'new' && (
                  <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
                    <div>
                      <Label className="text-xs mb-1.5 block">Nom de scène *</Label>
                      <Input value={newArtist.name} onChange={e => setNewArtist(p => ({ ...p, name: e.target.value }))} placeholder="Votre nom d'artiste" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Genre musical</Label>
                      <Input value={newArtist.genre} onChange={e => setNewArtist(p => ({ ...p, genre: e.target.value }))} placeholder="Afropop, Rap, Mbalax…" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Photo (optionnel)</Label>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors">
                        <Upload size={14} />
                        {uploads.photo ? 'Envoi…' : newArtist.photo_url ? 'Photo chargée ✓' : 'Choisir une photo'}
                        <input type="file" className="hidden" onChange={e => handlePhotoUpload(e.target.files[0])} accept="image/*" />
                      </label>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" /> Un seul profil par compte. Le profil est créé par l'équipe KKD lors de la validation.
                    </p>
                  </div>
                )}

                {artistMode === 'request' && (
                  <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
                    <div>
                      <Label className="text-xs mb-1.5 block">Sélectionnez l'artiste *</Label>
                      <ArtistSelector
                        value={requestArtist.id}
                        onChange={(id, name) => setRequestArtist(p => ({ ...p, id, name }))}
                        placeholder="Rechercher votre profil…"
                      />
                      {pendingForRequest && <p className="text-xs text-yellow-500 mt-1">⏳ Demande déjà en attente pour cet artiste.</p>}
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Justification (optionnel)</Label>
                      <Textarea value={requestArtist.message} onChange={e => setRequestArtist(p => ({ ...p, message: e.target.value }))} rows={2} placeholder="Lien réseaux, votre musique…" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Retour</Button>
              {artistMode === 'request' && linkedArtists.length === 0 ? (
                <Button onClick={submitRequest} disabled={!canNextArtist || reqMut.isPending} className="flex-1 gap-2">
                  {reqMut.isPending ? 'Envoi…' : <>Envoyer la demande <ArrowRight size={15} /></>}
                </Button>
              ) : artistMode === 'request' && linkedArtists.length > 0 ? (
                <Button variant="ghost" onClick={() => setArtistMode('linked')} className="flex-1">Annuler</Button>
              ) : (
                <Button onClick={() => canNextArtist && setStep(3)} disabled={!canNextArtist} className="flex-1 gap-2">
                  Continuer <ArrowRight size={15} />
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Étape 3 : Contenu ── */}
        {step === 3 && (
          <motion.div key="content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setStep(2)} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
              <h3 className="font-heading font-bold text-base">Votre contenu</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-1.5 block">Titre *</Label>
                <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Nom du titre / clip" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Genre musical</Label>
                  <Input value={form.genre} onChange={e => set('genre', e.target.value)} placeholder="Afrobeats, Rap, Mbalax…" />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Code ISRC (optionnel)</Label>
                  <Input value={form.isrc} onChange={e => set('isrc', e.target.value.toUpperCase())} placeholder="SN-KKD-26-00001" className="font-mono text-xs" />
                </div>
              </div>

              <MediaUploader
                label="Pochette / Miniature (1400x1400 recommandé) *"
                kind="image" accept="image/*"
                value={form.cover_url} uploading={uploads.cover}
                onUpload={handleCoverUpload} onClear={() => set('cover_url', '')}
              />

              <MediaUploader
                label={`${isVideo ? 'Fichier vidéo master (MP4/MOV)' : 'Fichier audio master (WAV / MP3 320kbps)'} ${sale ? '(privé, vendu)' : '(gratuit)'} *`}
                kind={isVideo ? 'video' : 'audio'} accept={isVideo ? 'video/*' : 'audio/*'}
                value={form.file_url} uploading={uploads.file} isPrivate={sale}
                onUpload={handleFileUpload} onClear={() => set('file_url', '')}
              />

              <div className="bg-card border border-border/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Link2 size={13} /> Lien de streaming (optionnel)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map(p => (
                    <button key={p.value} type="button" onClick={() => set('streaming_platform', p.value)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${form.streaming_platform === p.value ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <Input value={form.streaming_link} onChange={e => set('streaming_link', e.target.value)} placeholder="https://…" type="url" className="text-sm" />
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Paroles (Lyrics, optionnel)</Label>
                <Textarea value={form.lyrics} onChange={e => set('lyrics', e.target.value)} rows={3} placeholder="Collez les paroles pour l'affichage karaoké / synchronisé…" />
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Description / Note d'intention (optionnel)</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Quelques mots sur votre sortie…" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">Retour</Button>
              <Button onClick={publish} disabled={!canPublish || isUploading || pubMut.isPending} className="flex-1 gap-2">
                {pubMut.isPending ? 'Publication…' : <>Publier <Check size={15} /></>}
              </Button>
            </div>
            {!canPublish && <p className="text-[11px] text-muted-foreground text-center mt-2">Titre, pochette et fichier sont obligatoires.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}