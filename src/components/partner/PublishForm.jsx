import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import {
  Music, Video, Disc, ListMusic, Upload,
  Link2, CheckCircle, ArrowLeft, Loader2, Plus, X, User, Lock, Eye, AlertTriangle
} from 'lucide-react';
import ArtistSelector from './ArtistSelector';
import PreviewSnippetSelector from './PreviewSnippetSelector';
import PublishPreview from './PublishPreview';
import MediaUploader from './MediaUploader';
import LinkPublishMode from './LinkPublishMode';
import { usePlayableUrl } from '@/hooks/usePlayableUrl';
import { useToast } from '@/components/ui/use-toast';

const CONTENT_TYPES = [
  { value: 'sortie_musicale', label: 'Single / Titre', icon: Music, release_type: 'single' },
  { value: 'album', label: 'Album', icon: Disc, release_type: 'album' },
  { value: 'ep', label: 'EP / Mixtape', icon: ListMusic, release_type: 'ep' },
  { value: 'video_clip', label: 'Clip vidéo', icon: Video, release_type: null },
];

const PLATFORMS = [
  { value: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/...' },
  { value: 'apple_music', label: 'Apple Music', placeholder: 'https://music.apple.com/...' },
  { value: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' },
  { value: 'audiomack', label: 'Audiomack', placeholder: 'https://audiomack.com/...' },
  { value: 'deezer', label: 'Deezer', placeholder: 'https://deezer.com/...' },
  { value: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/...' },
];

export default function PublishForm({ user, onClose, editPublication }) {
  const queryClient = useQueryClient();
  const isEditing = !!editPublication;
  const [step, setStep] = useState(isEditing ? 2 : 1);
  const [contentType, setContentType] = useState(editPublication?.content_type || null);
  const [linkMode, setLinkMode] = useState(false);
  const [uploads, setUploads] = useState({ cover: false, file: false, photo: false, tracks: {} });
  const isUploading = uploads.cover || uploads.file || uploads.photo || Object.values(uploads.tracks).some(Boolean);
  const setUpload = (key, val) => setUploads((prev) => ({ ...prev, [key]: val }));
  const setTrackUpload = (idx, val) => setUploads((prev) => ({ ...prev, tracks: { ...prev.tracks, [idx]: val } }));
  const [done, setDone] = useState(false);
  const [showLinks, setShowLinks] = useState(!!editPublication?.streaming_link);
  const [newArtist, setNewArtist] = useState(isEditing ? !editPublication?.artist_id : false);
  const [dupCheck, setDupCheck] = useState({ loading: false, duplicates: [], checked: false });

  const [form, setForm] = useState({
    title: editPublication?.title || '',
    artist_id: editPublication?.artist_id || '',
    artist_name: editPublication?.artist_name || user?.full_name || '',
    featuring_artist: editPublication?.featuring_artist || '',
    featuring_artist_id: editPublication?.featuring_artist_id || '',
    description: editPublication?.description || '',
    cover_url: editPublication?.cover_url || '',
    file_url: editPublication?.file_url || '',
    tracks: editPublication?.tracks || [],
    is_for_sale: editPublication?.is_for_sale || false,
    price: editPublication?.price || 0,
    preview_start: editPublication?.preview_start || 0,
    preview_duration: editPublication?.preview_duration || 30,
    streaming_platform: editPublication?.streaming_platform || 'spotify',
    streaming_link: editPublication?.streaming_link || '',
    new_artist_genre: editPublication?.new_artist_genre || '',
    new_artist_photo_url: editPublication?.new_artist_photo_url || '',
  });

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const { toast } = useToast();

  // Dédoublonnage automatique quand un nouvel artiste est saisé
  useEffect(() => {
    if (!newArtist || !form.artist_name.trim() || form.artist_name.trim().length < 2) {
      setDupCheck({ loading: false, duplicates: [], checked: false });
      return;
    }
    const name = form.artist_name.trim();
    setDupCheck((prev) => ({ ...prev, loading: true, checked: false }));
    const timer = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke('checkArtistDuplicate', { artist_name: name });
        setDupCheck({ loading: false, duplicates: res.data?.duplicates || [], checked: true });
      } catch {
        setDupCheck({ loading: false, duplicates: [], checked: false });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [newArtist, form.artist_name]);

  const selectedPlatform = PLATFORMS.find((p) => p.value === form.streaming_platform) || PLATFORMS[0];
  const isVideo = contentType === 'video_clip';
  const isAlbum = contentType === 'album' || contentType === 'ep';
  // URL d'écoute (signée si fichier privé/vendu) pour l'étape de prévisualisation
  const playable = usePlayableUrl(isAlbum ? '' : form.file_url);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUpload('file', true);
    try {
      if (form.is_for_sale) {
        const res = await base44.integrations.Core.UploadPrivateFile({ file });
        set('file_url', res.file_uri);
        toast({ title: 'Fichier audio chargé', description: 'Stockage privé — accessible après achat.' });
      } else {
        const res = await base44.integrations.Core.UploadFile({ file });
        set('file_url', res.file_url);
        toast({ title: 'Fichier audio chargé', description: 'Écoute gratuite disponible.' });
      }
    } catch (err) {
      toast({ title: 'Échec du téléversement audio', description: err?.message || 'Veuillez réessayer.', variant: 'destructive' });
    } finally {
      setUpload('file', false);
    }
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    setUpload('cover', true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      set('cover_url', res.file_url);
      toast({ title: 'Pochette chargée' });
    } catch (err) {
      toast({ title: 'Échec de la pochette', description: err?.message || 'Veuillez réessayer.', variant: 'destructive' });
    } finally {
      setUpload('cover', false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUpload('photo', true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      set('new_artist_photo_url', res.file_url);
    } catch (err) {
      toast({ title: 'Échec de la photo', description: err?.message || 'Veuillez réessayer.', variant: 'destructive' });
    } finally {
      setUpload('photo', false);
    }
  };

  const addTrack = () => set('tracks', [...form.tracks, { title: '', audio_file_url: '' }]);
  const removeTrack = (idx) => set('tracks', form.tracks.filter((_, i) => i !== idx));
  const setTrackTitle = (idx, v) => set('tracks', form.tracks.map((t, i) => (i === idx ? { ...t, title: v } : t)));
  const handleTrackUpload = async (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTrackUpload(idx, true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      set('tracks', form.tracks.map((t, i) => (i === idx ? { ...t, audio_file_url: res.file_url } : t)));
      toast({ title: `Piste ${idx + 1} chargée` });
    } catch (err) {
      toast({ title: 'Échec de la piste', description: err?.message || 'Veuillez réessayer.', variant: 'destructive' });
    } finally {
      setTrackUpload(idx, false);
    }
  };

  const toggleSale = (v) => {
    set('is_for_sale', v);
    set('file_url', ''); // require re-upload with the right storage (public vs private)
    set('preview_start', 0);
  };

  const mutation = useMutation({
    mutationFn: (data) => isEditing
      ? base44.entities.PartnerPublication.update(editPublication.id, data)
      : base44.entities.PartnerPublication.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-publications'] });
      setDone(true);
    },
  });

  const hasContent = isAlbum
    ? form.tracks.filter((t) => t.audio_file_url).length > 0
    : !!form.file_url || !!form.streaming_link?.trim();
  const canSubmit =
    form.title.trim() &&
    !!form.cover_url &&
    (newArtist ? form.artist_name.trim() : !!form.artist_id) &&
    hasContent &&
    (!form.is_for_sale || form.price > 0);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!canSubmit) return;
    // Cohérence fichier / mode de vente : gratuit => URL publique, payant => fichier privé
    if (!isAlbum && form.file_url) {
      const isPublic = String(form.file_url).startsWith('http');
      if (form.is_for_sale && isPublic) {
        toast({ title: 'Fichier incohérent', description: 'Contenu en vente mais fichier public. Re-téléversez en mode payant.', variant: 'destructive' });
        return;
      }
      if (!form.is_for_sale && !isPublic) {
        toast({ title: 'Fichier incohérent', description: 'Contenu gratuit mais fichier privé. Re-téléversez en mode gratuit.', variant: 'destructive' });
        return;
      }
    }
    mutation.mutate({
      partner_email: user.email,
      partner_name: user.full_name || user.email,
      content_type: contentType,
      title: form.title.trim(),
      artist_name: form.artist_name.trim(),
      artist_id: form.artist_id || '',
      featuring_artist: form.featuring_artist.trim(),
      featuring_artist_id: form.featuring_artist_id || '',
      new_artist_genre: newArtist ? form.new_artist_genre.trim() : '',
      new_artist_photo_url: newArtist ? form.new_artist_photo_url : '',
      streaming_link: form.streaming_link || '',
      streaming_platform: form.streaming_platform,
      description: form.description || '',
      cover_url: form.cover_url || '',
      file_url: isAlbum ? '' : form.file_url || '',
      tracks: isAlbum
        ? form.tracks
            .filter((t) => t.audio_file_url)
            .map((t) => ({
              ...t,
              is_for_sale: Boolean(t.is_for_sale),
              access_mode: t.is_for_sale ? 'en_vente' : 'gratuit',
              is_free: !t.is_for_sale,
              price: t.is_for_sale ? Number(t.price || 0) : 0,
              access_control: t.is_for_sale ? 'paid_only' : 'free_public',
            }))
        : form.file_url
        ? [
            {
              title: form.title.trim(),
              audio_file_url: form.file_url,
              is_for_sale: Boolean(form.is_for_sale),
              access_mode: form.is_for_sale ? 'en_vente' : 'gratuit',
              is_free: !form.is_for_sale,
              price: form.is_for_sale ? Number(form.price) : 0,
              access_control: form.is_for_sale ? 'paid_only' : 'free_public',
            },
          ]
        : [],
      is_for_sale: isAlbum ? false : Boolean(form.is_for_sale),
      access_mode: isAlbum ? 'gratuit' : form.is_for_sale ? 'en_vente' : 'gratuit',
      is_free: isAlbum ? true : !form.is_for_sale,
      access_control: isAlbum ? 'free_public' : form.is_for_sale ? 'paid_only' : 'free_public',
      price: isAlbum ? 0 : form.is_for_sale ? Number(form.price) : 0,
      preview_start: isAlbum ? 0 : form.is_for_sale ? form.preview_start : 0,
      preview_duration: isAlbum ? 30 : form.is_for_sale ? Number(form.preview_duration) || 30 : 30,
    });
  };

  if (done) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h3 className="font-display text-xl font-extrabold mb-2">
          {isEditing ? 'Publication mise à jour !' : 'Publication envoyée !'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          {isEditing
            ? 'Vos modifications ont été enregistrées. L\'équipe KKD réexaminera votre contenu.'
            : "L'équipe KKD va examiner votre contenu. Dès validation, il sera automatiquement disponible et écoutable sur la plateforme."}
        </p>
        <Button onClick={onClose} variant="outline">Retour au tableau de bord</Button>
      </motion.div>
    );
  }

  if (linkMode) {
    return <LinkPublishMode user={user} onClose={() => { setLinkMode(false); onClose(); }} />;
  }

  if (step === 1) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-xl font-extrabold mb-1">Que souhaitez-vous publier ?</h2>
        <p className="text-sm text-muted-foreground mb-6">Choisissez le type de contenu</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CONTENT_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.value} onClick={() => { setContentType(t.value); setStep(2); }}
                className="text-left p-4 rounded-xl border border-border/50 bg-card hover:border-primary/60 hover:bg-primary/5 transition-all group active:scale-[0.97]">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Icon size={18} className="text-primary" />
                </div>
                <p className="font-heading font-bold text-sm leading-tight">{t.label}</p>
              </button>
            );
          })}
        </div>

        {/* Option : publication par lien externe */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <button
            onClick={() => setLinkMode(true)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors shrink-0">
              <Link2 size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-heading font-bold text-sm">Publier via un lien externe</p>
              <p className="text-xs text-muted-foreground">Collez un lien Spotify, YouTube, Apple Music… — métadonnées extraites automatiquement</p>
            </div>
          </button>
        </div>

        <Button variant="ghost" onClick={onClose} className="mt-6 w-full text-muted-foreground">Annuler</Button>
      </motion.div>
    );
  }

  // ---- Étape 3 : Prévisualisation + Publication ----
  if (step === 3) {
    return (
      <PublishPreview
        form={form}
        contentType={contentType}
        isVideo={isVideo}
        isAlbum={isAlbum}
        playableUrl={isAlbum ? null : playable.url}
        playableLoading={playable.loading}
        onBack={() => setStep(2)}
        onPublish={handleSubmit}
        publishing={mutation.isPending}
      />
    );
  }

  const selected = CONTENT_TYPES.find((t) => t.value === contentType);
  const SelIcon = selected?.icon || Music;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        {!isEditing && (
          <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <SelIcon size={16} className="text-primary" />
          </div>
          <p className="font-heading font-bold text-sm leading-none">
            {isEditing ? 'Modifier la publication' : selected?.label}
          </p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (canSubmit && !isUploading) setStep(3); }} className="space-y-5">
        {/* Titre */}
        <div>
          <Label className="text-xs mb-1.5 block">Titre *</Label>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Nom du titre, album, clip…" required />
        </div>

        {/* Artiste : lier ou créer */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <button type="button" onClick={() => setNewArtist(false)}
              className={`px-3 py-1.5 rounded-full font-medium transition-all ${!newArtist ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
              Lier un artiste existant
            </button>
            <button type="button" onClick={() => setNewArtist(true)}
              className={`px-3 py-1.5 rounded-full font-medium transition-all ${newArtist ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
              Créer un nouveau profil
            </button>
          </div>

          {newArtist ? (
            <div className="space-y-3 bg-card border border-border/50 rounded-xl p-4">
              <div>
                <Label className="text-xs mb-1.5 block">Nom de scène *</Label>
                <Input value={form.artist_name} onChange={(e) => set('artist_name', e.target.value)} placeholder="Nom de l'artiste" />
                {/* Alerte de dédoublonnage */}
                {dupCheck.loading && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" /> Vérification des doublons...
                  </p>
                )}
                {dupCheck.checked && dupCheck.duplicates.length > 0 && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mb-1.5">
                      <AlertTriangle size={11} /> {dupCheck.duplicates.length} artiste(s) similaire(s) trouvé(s)
                    </p>
                    <div className="space-y-1">
                      {dupCheck.duplicates.map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => { setNewArtist(false); set('artist_id', d.id); set('artist_name', d.name); }}
                          className="w-full flex items-center gap-2 p-1.5 rounded bg-background/60 hover:bg-background text-left transition-colors"
                        >
                          {d.photo_url ? (
                            <img src={d.photo_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                              {d.name[0]}
                            </div>
                          )}
                          <span className="text-[11px] font-medium flex-1 truncate">{d.name}</span>
                          {d.is_verified && <CheckCircle size={11} className="text-blue-400 shrink-0" />}
                          <span className="text-[9px] text-muted-foreground shrink-0">Lier →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {dupCheck.checked && dupCheck.duplicates.length === 0 && (
                  <p className="text-[11px] text-green-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle size={11} /> Aucun doublon — nouvel artiste valide
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Genre musical</Label>
                <Input value={form.new_artist_genre} onChange={(e) => set('new_artist_genre', e.target.value)} placeholder="Afropop, Rap, Mbalax…" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Photo (optionnel)</Label>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors">
                  <Upload size={14} />
                  {uploads.photo ? 'Envoi…' : form.new_artist_photo_url ? 'Photo chargée ✓' : 'Choisir une photo'}
                  <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <ArtistSelector
                value={form.artist_id}
                onChange={(id, name) => { set('artist_id', id); set('artist_name', name); }}
                placeholder="Rechercher l'artiste…"
              />
              {!form.artist_id && (
                <Input value={form.artist_name} onChange={(e) => { set('artist_name', e.target.value); set('artist_id', ''); }} placeholder="Ou saisir le nom de scène manuellement" />
              )}
            </div>
          )}
        </div>

        {/* Artiste en featuring / collaboration (optionnel) */}
        <div className="space-y-1.5">
          <Label className="text-xs mb-1.5 flex items-center gap-1.5">
            <User size={12} className="text-primary" /> Artiste en featuring / collaboration (optionnel)
          </Label>
          <ArtistSelector
            value={form.featuring_artist_id}
            onChange={(id, name) => { set('featuring_artist_id', id); set('featuring_artist', name); }}
            placeholder="Rechercher l'artiste en featuring…"
          />
          {form.featuring_artist_id ? (
            <button type="button" onClick={() => { set('featuring_artist_id', ''); set('featuring_artist', ''); }}
              className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1">
              <X size={11} /> Retirer le featuring
            </button>
          ) : (
            <Input value={form.featuring_artist} onChange={(e) => set('featuring_artist', e.target.value)} placeholder="Ou saisir le nom du featuring manuellement" />
          )}
        </div>

        {isAlbum ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs block">Pistes de l'album *</Label>
              <button type="button" onClick={addTrack} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus size={11} /> Ajouter une piste
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">Ajoutez chaque titre avec son fichier audio. L'album sera gratuit et écoutable en entier.</p>
            {form.tracks.map((t, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 bg-card border border-border/50 rounded-xl p-3">
                <Input value={t.title} onChange={(e) => setTrackTitle(idx, e.target.value)} placeholder={`Piste ${idx + 1} — titre`} className="text-sm sm:w-44" />
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors shrink-0">
                  <Upload size={14} />
                  {uploads.tracks[idx] ? 'Envoi…' : t.audio_file_url ? 'Audio ✓' : 'Audio'}
                  <input type="file" className="hidden" onChange={(e) => handleTrackUpload(idx, e)} accept="audio/*" />
                </label>
                <button type="button" onClick={() => removeTrack(idx)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 sm:self-center">
                  <X size={15} />
                </button>
              </div>
            ))}
            {form.tracks.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-3">Ajoutez au moins une piste.</p>
            )}
          </div>
        ) : (
          <>
            <MediaUploader
              label={`${isVideo ? 'Fichier vidéo' : 'Fichier audio'} ${form.is_for_sale ? '(privé, vendu)' : '(gratuit)'}${form.streaming_link?.trim() ? ' (facultatif — lien fourni)' : ' *'}`}
              kind={isVideo ? 'video' : 'audio'}
              accept={isVideo ? 'video/*' : 'audio/*'}
              value={form.file_url}
              uploading={uploads.file}
              isPrivate={form.is_for_sale}
              onUpload={handleFileUpload}
              onClear={() => set('file_url', '')}
            />
            {form.is_for_sale && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock size={10} /> Fichier stocké en privé, accessible uniquement après achat.
              </p>
            )}

            {!isVideo && (
              <div className="bg-card border border-border/50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-bold text-sm">Modèle d'accès de la piste</p>
                    <p className="text-[11px] text-muted-foreground">Gratuit = écoute complète libre. En vente = verrouillé, achat requis.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg border border-border/50">
                    <button
                      type="button"
                      onClick={() => {
                        set('is_for_sale', false);
                        set('price', 0);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        !form.is_for_sale
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-muted-foreground hover:text-white'
                      }`}
                    >
                      Gratuit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        set('is_for_sale', true);
                        if (!form.price) set('price', 500);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        form.is_for_sale
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'text-muted-foreground hover:text-white'
                      }`}
                    >
                      En vente
                    </button>
                  </div>
                </div>
                {form.is_for_sale && (
                  <>
                    <div>
                      <Label className="text-xs mb-1.5 block">Prix (FCFA) *</Label>
                      <Input type="number" min="100" step="100" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="500" required />
                    </div>
                    {form.file_url && (
                      <PreviewSnippetSelector fileUrl={form.file_url} value={form.preview_start} onChange={(v) => set('preview_start', v)} />
                    )}
                    <div>
                      <Label className="text-xs mb-1.5 block">Durée de l'extrait gratuit</Label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => set('preview_duration', 25)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${Number(form.preview_duration) === 25 ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                          25 secondes
                        </button>
                        <button type="button" onClick={() => set('preview_duration', 30)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${Number(form.preview_duration) === 30 ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                          30 secondes
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Lien de streaming (facultatif, dépliable) */}
        <div>
          {!showLinks ? (
            <button type="button" onClick={() => setShowLinks(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-primary border border-dashed border-primary/30 rounded-xl py-3 hover:bg-primary/5 transition-colors">
              <Plus size={13} /> Ajouter un lien de streaming (facultatif)
            </button>
          ) : (
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-primary" />
                  <p className="font-heading font-bold text-sm">Lien de streaming</p>
                </div>
                <button type="button" onClick={() => { setShowLinks(false); set('streaming_link', ''); }} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p.value} type="button" onClick={() => set('streaming_platform', p.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.streaming_platform === p.value ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <Input value={form.streaming_link} onChange={(e) => set('streaming_link', e.target.value)} placeholder={selectedPlatform.placeholder} type="url" />
            </div>
          )}
        </div>

        {/* Description (facultative) */}
        <div>
          <Label className="text-xs mb-1.5 block">Description (facultatif)</Label>
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Décrivez votre projet…" rows={3} />
        </div>

        {/* Pochette (obligatoire) */}
        <MediaUploader
          label="Pochette / Miniature *"
          hint="Glissez l'image ici ou cliquez pour parcourir"
          kind="image"
          accept="image/*"
          value={form.cover_url}
          uploading={uploads.cover}
          onUpload={handleCoverUpload}
          onClear={() => set('cover_url', '')}
        />

        <div className="pt-2">
          <Button
            type="button"
            disabled={isUploading || !canSubmit}
            onClick={() => setStep(3)}
            className="w-full h-12 font-bold text-base"
          >
            <Eye size={16} className="mr-2" /> Prévisualiser avant publication
          </Button>
          {!canSubmit && (
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Renseignez le titre, l'artiste et la pochette. Le fichier audio est facultatif si un lien de streaming est fourni.
            </p>
          )}
        </div>
      </form>
    </motion.div>
  );
}