import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Video, ListMusic, Disc, Upload,
  Link2, Instagram, CheckCircle, ArrowLeft, Loader2
} from 'lucide-react';

const CONTENT_TYPES = [
  { value: 'sortie_musicale', label: 'Single / Titre', icon: Music, desc: 'Un titre disponible sur les plateformes' },
  { value: 'album', label: 'Album', icon: Disc, desc: 'Un album complet' },
  { value: 'ep', label: 'EP / Mixtape', icon: ListMusic, desc: 'Un EP ou une mixtape' },
  { value: 'video_clip', label: 'Clip vidéo', icon: Video, desc: 'Un clip sur YouTube ou autre' },
  { value: 'playlist', label: 'Playlist', icon: ListMusic, desc: 'Une playlist complète' },
  { value: 'autre', label: 'Autre', icon: Music, desc: 'Tout autre type de contenu' },
];

const PLATFORMS = [
  { value: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/...' },
  { value: 'apple_music', label: 'Apple Music', placeholder: 'https://music.apple.com/...' },
  { value: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' },
  { value: 'audiomack', label: 'Audiomack', placeholder: 'https://audiomack.com/...' },
  { value: 'amazon_music', label: 'Amazon Music', placeholder: 'https://music.amazon.com/...' },
  { value: 'deezer', label: 'Deezer', placeholder: 'https://deezer.com/...' },
  { value: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/...' },
  { value: 'autre', label: 'Autre lien', placeholder: 'https://...' },
];

export default function PublishForm({ user, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1=type, 2=form
  const [contentType, setContentType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    title: '',
    artist_name: user?.full_name || '',
    streaming_platform: 'spotify',
    streaming_link: '',
    secondary_link: '',
    instagram_link: '',
    description: '',
    cover_url: '',
    file_url: '',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const selectedPlatform = PLATFORMS.find(p => p.value === form.streaming_platform) || PLATFORMS[0];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    set('file_url', result.file_url);
    setUploading(false);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    set('cover_url', result.file_url);
    setUploading(false);
  };

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.PartnerPublication.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-publications'] });
      setDone(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      content_type: contentType,
      partner_email: user.email,
      partner_name: user.full_name || user.email,
    });
  };

  if (done) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h3 className="font-display text-xl font-extrabold mb-2">Publication envoyée !</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          Notre équipe va examiner votre publication et la mettre en ligne rapidement.
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CONTENT_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => { setContentType(t.value); setStep(2); }}
                className="text-left p-4 rounded-xl border border-border/50 bg-card hover:border-primary/60 hover:bg-primary/5 transition-all group active:scale-[0.97]"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Icon size={18} className="text-primary" />
                </div>
                <p className="font-heading font-bold text-sm leading-tight mb-0.5">{t.label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{t.desc}</p>
              </button>
            );
          })}
        </div>
        <Button variant="ghost" onClick={onClose} className="mt-6 w-full text-muted-foreground">
          Annuler
        </Button>
      </motion.div>
    );
  }

  const selected = CONTENT_TYPES.find(t => t.value === contentType);
  const SelIcon = selected?.icon || Music;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <SelIcon size={16} className="text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm leading-none">{selected?.label}</p>
            <p className="text-[11px] text-muted-foreground">Remplissez les informations</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Titre + Artiste */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs mb-1.5 block">Titre *</Label>
            <Input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Nom du titre, album, clip…"
              required
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Nom de l'artiste *</Label>
            <Input
              value={form.artist_name}
              onChange={e => set('artist_name', e.target.value)}
              placeholder="Nom de scène"
              required
            />
          </div>
        </div>

        {/* Lien principal */}
        <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={15} className="text-primary" />
            <p className="font-heading font-bold text-sm">Lien de streaming principal *</p>
          </div>

          {/* Sélecteur de plateforme */}
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => set('streaming_platform', p.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  form.streaming_platform === p.value
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Input
            value={form.streaming_link}
            onChange={e => set('streaming_link', e.target.value)}
            placeholder={selectedPlatform.placeholder}
            type="url"
            required
          />
          <p className="text-[11px] text-muted-foreground">
            Collez simplement le lien de votre titre, album ou playlist depuis {selectedPlatform.label}
          </p>
        </div>

        {/* Lien secondaire */}
        <div>
          <Label className="text-xs mb-1.5 block">Lien secondaire (autre plateforme — optionnel)</Label>
          <Input
            value={form.secondary_link}
            onChange={e => set('secondary_link', e.target.value)}
            placeholder="https://… (YouTube, Apple Music, Audiomack…)"
            type="url"
          />
        </div>

        {/* Instagram */}
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Instagram size={15} className="text-pink-400" />
            <p className="font-heading font-bold text-sm text-pink-400">Synchronisation Instagram</p>
          </div>
          <Input
            value={form.instagram_link}
            onChange={e => set('instagram_link', e.target.value)}
            placeholder="https://instagram.com/p/... ou @votrecompte"
            className="border-pink-500/30 focus-visible:ring-pink-500/50"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Partagez le lien de votre post Instagram ou votre compte pour une mise en avant coordonnée
          </p>
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs mb-1.5 block">Message pour l'équipe KKD (optionnel)</Label>
          <Textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Décrivez votre projet, vos attentes…"
            rows={3}
          />
        </div>

        {/* Fichier + pochette */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block">Pochette / Miniature (optionnel)</Label>
            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors">
              <Upload size={14} />
              {uploading ? 'Envoi…' : form.cover_url ? 'Image chargée ✓' : 'Choisir une image'}
              <input type="file" className="hidden" onChange={handleCoverUpload} accept="image/*" />
            </label>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Fichier audio/vidéo (optionnel)</Label>
            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors">
              <Upload size={14} />
              {uploading ? 'Envoi…' : form.file_url ? 'Fichier joint ✓' : 'Joindre un fichier'}
              <input type="file" className="hidden" onChange={handleFileUpload} accept="audio/*,video/*,.pdf,.zip" />
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending || uploading}
          className="w-full h-12 font-bold text-base"
        >
          {mutation.isPending ? (
            <><Loader2 size={16} className="animate-spin mr-2" /> Envoi en cours…</>
          ) : 'Soumettre ma publication'}
        </Button>
      </form>
    </motion.div>
  );
}