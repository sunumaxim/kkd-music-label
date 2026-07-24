import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import {
  Music, Video, Disc, ListMusic, Upload,
  Link2, CheckCircle, ArrowLeft, Loader2, Plus, X, User, Sparkles, Lock
} from 'lucide-react';
import ArtistSelector from './ArtistSelector';
import PreviewSnippetSelector from './PreviewSnippetSelector';

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

export default function PublishForm({ user, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [newArtist, setNewArtist] = useState(false);

  const [form, setForm] = useState({
    title: '',
    artist_id: '',
    artist_name: user?.full_name || '',
    description: '',
    cover_url: '',
    file_url: '',
    is_for_sale: false,
    price: 0,
    preview_start: 0,
    streaming_platform: 'spotify',
    streaming_link: '',
    new_artist_genre: '',
    new_artist_photo_url: '',
  });

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const selectedPlatform = PLATFORMS.find((p) => p.value === form.streaming_platform) || PLATFORMS[0];
  const isVideo = contentType === 'video_clip';

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      if (form.is_for_sale) {
        const res = await base44.integrations.Core.UploadPrivateFile({ file });
        set('file_url', res.file_uri);
      } else {
        const res = await base44.integrations.Core.UploadFile({ file });
        set('file_url', res.file_url);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      set('cover_url', res.file_url);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      set('new_artist_photo_url', res.file_url);
    } finally {
      setUploading(false);
    }
  };

  const toggleSale = (v) => {
    set('is_for_sale', v);
    set('file_url', ''); // require re-upload with the right storage (public vs private)
    set('preview_start', 0);
  };

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.PartnerPublication.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-publications'] });
      setDone(true);
    },
  });

  const canSubmit =
    form.title.trim() &&
    (form.streaming_link.trim() || form.file_url) &&
    (form.artist_id || form.artist_name.trim()) &&
    (!form.is_for_sale || form.price > 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate({
      partner_email: user.email,
      partner_name: user.full_name || user.email,
      content_type: contentType,
      title: form.title.trim(),
      artist_name: form.artist_name.trim(),
      artist_id: form.artist_id || '',
      new_artist_genre: newArtist ? form.new_artist_genre.trim() : '',
      new_artist_photo_url: newArtist ? form.new_artist_photo_url : '',
      streaming_link: form.streaming_link || '',
      streaming_platform: form.streaming_platform,
      description: form.description || '',
      cover_url: form.cover_url || '',
      file_url: form.file_url || '',
      is_for_sale: form.is_for_sale,
      price: form.is_for_sale ? Number(form.price) : 0,
      preview_start: form.is_for_sale ? form.preview_start : 0,
    });
  };

  if (done) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h3 className="font-display text-xl font-extrabold mb-2">Publication envoyée !</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          L'équipe KKD va examiner votre contenu. Dès validation, il sera automatiquement disponible et écoutable sur la plateforme.
        </p>
        <Button onClick={onClose} variant="outline">Retour au tableau de bord</Button>
      </motion.div>
    );
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
        <Button variant="ghost" onClick={onClose} className="mt-6 w-full text-muted-foreground">Annuler</Button>
      </motion.div>
    );
  }

  const selected = CONTENT_TYPES.find((t) => t.value === contentType);
  const SelIcon = selected?.icon || Music;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <SelIcon size={16} className="text-primary" />
          </div>
          <p className="font-heading font-bold text-sm leading-none">{selected?.label}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Genre musical</Label>
                <Input value={form.new_artist_genre} onChange={(e) => set('new_artist_genre', e.target.value)} placeholder="Afropop, Rap, Mbalax…" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Photo (optionnel)</Label>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors">
                  <Upload size={14} />
                  {uploading ? 'Envoi…' : form.new_artist_photo_url ? 'Photo chargée ✓' : 'Choisir une photo'}
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

        {/* Fichier audio/vidéo (contenu principal) */}
        <div>
          <Label className="text-xs mb-1.5 block">
            {isVideo ? 'Fichier vidéo' : 'Fichier audio'} {form.is_for_sale ? '(privé, vendu)' : '(gratuit)'} *
          </Label>
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors">
            <Upload size={14} />
            {uploading ? 'Envoi…' : form.file_url ? 'Fichier chargé ✓' : 'Téléverser le fichier'}
            <input type="file" className="hidden" onChange={handleFileUpload} accept={isVideo ? 'video/*' : 'audio/*'} />
          </label>
          {form.is_for_sale && (
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <Lock size={10} /> Fichier stocké en privé, accessible uniquement après achat.
            </p>
          )}
        </div>

        {/* Gratuit / Payant */}
        <div className="bg-card border border-border/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading font-bold text-sm">Mettre en vente (exclusif KKD)</p>
              <p className="text-[11px] text-muted-foreground">Gratuit = écoute complète. Payant = extrait 30s puis achat.</p>
            </div>
            <Switch checked={form.is_for_sale} onCheckedChange={toggleSale} />
          </div>
          {form.is_for_sale && (
            <>
              <div>
                <Label className="text-xs mb-1.5 block">Prix (euros) *</Label>
                <Input type="number" min="1" step="1" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="5" required />
              </div>
              {form.file_url && (
                <PreviewSnippetSelector fileUrl={form.file_url} value={form.preview_start} onChange={(v) => set('preview_start', v)} />
              )}
            </>
          )}
        </div>

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

        {/* Pochette (facultative) */}
        <div>
          <Label className="text-xs mb-1.5 block">Pochette / Miniature (facultatif)</Label>
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors">
            <Upload size={14} />
            {uploading ? 'Envoi…' : form.cover_url ? 'Image chargée ✓' : 'Choisir une image'}
            <input type="file" className="hidden" onChange={handleCoverUpload} accept="image/*" />
          </label>
        </div>

        <Button type="submit" disabled={mutation.isPending || uploading || !canSubmit} className="w-full h-12 font-bold text-base">
          {mutation.isPending ? (
            <><Loader2 size={16} className="animate-spin mr-2" /> Envoi en cours…</>
          ) : (
            <><Sparkles size={16} className="mr-2" /> Soumettre ma publication</>
          )}
        </Button>
        {!canSubmit && (
          <p className="text-[11px] text-muted-foreground text-center -mt-2">
            Renseignez le titre, l'artiste et un fichier (ou un lien de streaming).
          </p>
        )}
      </form>
    </motion.div>
  );
}