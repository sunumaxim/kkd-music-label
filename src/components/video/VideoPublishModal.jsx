import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Upload, Youtube, Film, Sparkles, X, CheckCircle2,
  DollarSign, Play, ChevronRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { slugify } from '@/lib/slugify';

const VIDEO_TYPES = [
  { id: 'clip_officiel', label: 'Clip Officiel', desc: 'Vidéo musicale officielle haute définition' },
  { id: 'replay_live', label: 'Session Live / Concert', desc: 'Captation de concert, acoustique ou festival' },
  { id: 'interview', label: 'Interview & Podcast', desc: 'Entretien exclusif, talk-show ou émission' },
  { id: 'making_of', label: 'Making-Of & Backstage', desc: 'Dans les coulisses du tournage ou du studio' },
  { id: 'teaser', label: 'Teaser & Reel', desc: 'Bande-annonce ou court format promotionnel' },
];

const QUICK_PRICES = [500, 1000, 2000, 5000];

export default function VideoPublishModal({ isOpen, onClose, user }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [step, setStep] = useState(1); // 1: Métadonnées, 2: Fichier / Source, 3: Monétisation & Droits, 4: Succès
  const [submitting, setSubmitting] = useState(false);
  const [sourceType, setSourceType] = useState('youtube'); // 'youtube' | 'upload'
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    artist_name: user?.full_name || '',
    artist_id: '',
    video_type: 'clip_officiel',
    youtube_url: '',
    video_file_url: '',
    thumbnail_url: '',
    description: '',
    publish_date: new Date().toISOString().split('T')[0],
    is_featured: false,
    is_for_sale: false,
    price: 1000,
    preview_start: 0,
    // Crédits étendus
    director: '',
    producer: '',
    dop: '', // Directeur de la photographie
    choreographer: '',
    tags: '',
    linked_release_id: '',
    copyright_agreed: false,
  });

  const [publishedVideo, setPublishedVideo] = useState(null);

  // Fetch artists for linking
  const { data: artists = [] } = useQuery({
    queryKey: ['artists-video-publish'],
    queryFn: () => base44.entities.Artist.list('name', 200),
    initialData: [],
  });

  // Fetch releases for linking
  const { data: releases = [] } = useQuery({
    queryKey: ['releases-video-publish'],
    queryFn: () => base44.entities.Release.list('-created_at', 100),
    initialData: [],
  });

  const setField = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  // Extract YouTube ID for auto thumbnail
  const handleYoutubeChange = (url) => {
    setField('youtube_url', url);
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      const ytId = match[2];
      if (!formData.thumbnail_url) {
        setField('thumbnail_url', `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`);
      }
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) {
        setField('video_file_url', res.file_url);
        toast({ title: 'Vidéo téléchargée !', description: 'Le master vidéo est hébergé avec succès.' });
      }
    } catch (err) {
      toast({ title: 'Échec de l\'upload vidéo', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) {
        setField('thumbnail_url', res.file_url);
        toast({ title: 'Miniature téléchargée !', description: 'Visuel haute définition enregistré.' });
      }
    } catch (err) {
      toast({ title: 'Échec du visuel', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingThumb(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      toast({ title: 'Titre requis', description: 'Veuillez saisir le titre de la vidéo.', variant: 'destructive' });
      return false;
    }
    if (!formData.artist_name.trim()) {
      toast({ title: 'Artiste requis', description: 'Veuillez indiquer le nom de l\'artiste.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (sourceType === 'youtube' && !formData.youtube_url.trim()) {
      toast({ title: 'Lien YouTube requis', description: 'Veuillez coller le lien de votre vidéo YouTube.', variant: 'destructive' });
      return false;
    }
    if (sourceType === 'upload' && !formData.video_file_url.trim()) {
      toast({ title: 'Fichier vidéo requis', description: 'Veuillez uploader un fichier vidéo master.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!formData.copyright_agreed) {
      toast({ title: 'Attestation requise', description: 'Vous devez certifier détenir les droits d\'exploitation de cette vidéo.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const videoSlug = slugify(formData.title);
      const payload = {
        title: formData.title.trim(),
        slug: videoSlug,
        artist_name: formData.artist_name.trim(),
        video_type: formData.video_type,
        youtube_url: formData.youtube_url.trim() || undefined,
        video_file_url: formData.video_file_url.trim() || undefined,
        thumbnail_url: formData.thumbnail_url.trim() || undefined,
        description: formData.description.trim() || undefined,
        publish_date: formData.publish_date || new Date().toISOString().split('T')[0],
        is_featured: !!formData.is_featured,
        is_for_sale: !!formData.is_for_sale,
        price: formData.is_for_sale ? Number(formData.price) || 1000 : 0,
        preview_start: Number(formData.preview_start) || 0,
        views_count: 0,
        likes_count: 0,
        plays_count: 0,
        sales_count: 0,
        comments: [],
      };

      const newRecord = await base44.entities.Video.create(payload);
      setPublishedVideo(newRecord);
      qc.invalidateQueries({ queryKey: ['videos'] });
      qc.invalidateQueries({ queryKey: ['admin-videos'] });
      setStep(4);
      toast({
        title: 'Vidéo publiée avec succès !',
        description: `"${formData.title}" est maintenant disponible sur KKD Music.`,
      });
    } catch (err) {
      toast({
        title: 'Erreur de publication',
        description: err.message || 'Une erreur est survenue lors de l\'enregistrement.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl bg-[#0f131a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-white my-auto"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-purple-900/20 via-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-primary flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Film size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black tracking-tight text-white flex items-center gap-2">
                Studio Vidéo & Clips <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold uppercase">Pro</span>
              </h2>
              <p className="text-xs text-zinc-400">Diffusion 4K, Avant-premières D2C & Monétisation directe</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        {step < 4 && (
          <div className="px-6 py-3 bg-black/40 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-white/10 text-zinc-500'}`}>1</span>
              <span className={step === 1 ? 'text-white font-semibold' : 'text-zinc-400'}>Informations</span>
            </div>
            <div className="h-[1px] w-8 bg-white/10" />
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-white/10 text-zinc-500'}`}>2</span>
              <span className={step === 2 ? 'text-white font-semibold' : 'text-zinc-400'}>Média & Fichier</span>
            </div>
            <div className="h-[1px] w-8 bg-white/10" />
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-primary text-white' : 'bg-white/10 text-zinc-500'}`}>3</span>
              <span className={step === 3 ? 'text-white font-semibold' : 'text-zinc-400'}>D2C & Droits</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6 custom-scrollbar">
          {/* STEP 1: Metadata */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <Label className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Titre de la vidéo *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="ex : SeneGalsen (Clip Officiel) ft. Viviane Chidid"
                  className="mt-1.5 bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-primary text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Artiste principal *</Label>
                  <Input
                    value={formData.artist_name}
                    onChange={(e) => setField('artist_name', e.target.value)}
                    placeholder="Nom de l'artiste ou du groupe"
                    className="mt-1.5 bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-primary"
                  />
                  {artists.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-zinc-500 mr-1">Récents :</span>
                      {artists.slice(0, 4).map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setField('artist_name', a.name);
                            setField('artist_id', a.id);
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
                        >
                          {a.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Catégorie de vidéo</Label>
                  <select
                    value={formData.video_type}
                    onChange={(e) => setField('video_type', e.target.value)}
                    className="w-full mt-1.5 h-10 rounded-xl bg-black/40 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    {VIDEO_TYPES.map(t => (
                      <option key={t.id} value={t.id} className="bg-[#12161f] text-white">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linking to an existing track */}
              {releases.length > 0 && (
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Associer à un morceau du catalogue (optionnel)</Label>
                  <select
                    value={formData.linked_release_id}
                    onChange={(e) => setField('linked_release_id', e.target.value)}
                    className="w-full mt-1.5 h-10 rounded-xl bg-black/40 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="" className="bg-[#12161f] text-zinc-400">-- Aucun morceau lié (vidéo autonome) --</option>
                    {releases.map(r => (
                      <option key={r.id} value={r.id} className="bg-[#12161f] text-white">
                        {r.title} — {r.artist_name || 'Artiste inconnu'} ({r.release_type || 'single'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-zinc-500 mt-1">Permet aux auditeurs de lancer le son en 1-clic depuis le lecteur vidéo.</p>
                </div>
              )}

              {/* Description & Production Credits */}
              <div>
                <Label className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Synopsis & Crédits de réalisation</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Décrivez l'histoire du clip, les lieux de tournage, les danseurs, les partenaires..."
                  className="mt-1.5 bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-primary min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <Label className="text-[11px] text-zinc-400">Réalisateur / Directeur artistique</Label>
                  <Input
                    value={formData.director}
                    onChange={(e) => setField('director', e.target.value)}
                    placeholder="ex : Andy Kane, Young Media"
                    className="mt-1 bg-black/40 border-white/10 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-zinc-400">Directeur de la photo / DOP</Label>
                  <Input
                    value={formData.dop}
                    onChange={(e) => setField('dop', e.target.value)}
                    placeholder="ex : Dakar Cinema Labs"
                    className="mt-1 bg-black/40 border-white/10 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Media Source & Thumbnail */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Choice between YouTube or direct upload */}
              <div>
                <Label className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2 block">Source de diffusion</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSourceType('youtube')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all ${
                      sourceType === 'youtube'
                        ? 'bg-red-500/10 border-red-500 text-white shadow-lg shadow-red-500/20'
                        : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:bg-white/[0.06]'
                    }`}
                  >
                    <Youtube size={28} className={sourceType === 'youtube' ? 'text-red-500' : 'text-zinc-400'} />
                    <span className="font-bold text-sm">Lien YouTube HD</span>
                    <span className="text-[11px] text-zinc-400">Intégration directe ultra-rapide</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType('upload')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all ${
                      sourceType === 'upload'
                        ? 'bg-primary/10 border-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:bg-white/[0.06]'
                    }`}
                  >
                    <Upload size={28} className={sourceType === 'upload' ? 'text-primary' : 'text-zinc-400'} />
                    <span className="font-bold text-sm">Upload Master Vidéo</span>
                    <span className="text-[11px] text-zinc-400">Hébergement direct MP4 / MOV</span>
                  </button>
                </div>
              </div>

              {sourceType === 'youtube' ? (
                <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/10">
                  <Label className="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-2">
                    <Youtube size={16} className="text-red-500" /> URL de la vidéo YouTube *
                  </Label>
                  <Input
                    value={formData.youtube_url}
                    onChange={(e) => handleYoutubeChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                    className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500"
                  />
                  {formData.youtube_url && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black mt-3">
                      <iframe
                        src={formData.youtube_url.replace('watch?v=', 'embed/').split('&')[0]}
                        title="Aperçu YouTube"
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/10">
                  <Label className="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-2">
                    <Upload size={16} className="text-primary" /> Fichier vidéo master (MP4, MOV, WebM)
                  </Label>
                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors">
                    {formData.video_file_url ? (
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle2 size={36} className="text-emerald-400" />
                        <span className="text-sm font-semibold text-white">Vidéo prête pour la diffusion</span>
                        <span className="text-xs text-zinc-400 truncate max-w-md">{formData.video_file_url}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setField('video_file_url', '')}
                          className="mt-2 text-xs"
                        >
                          Remplacer la vidéo
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        {uploadingVideo ? (
                          <Loader2 size={32} className="text-primary animate-spin" />
                        ) : (
                          <Film size={32} className="text-zinc-400" />
                        )}
                        <span className="text-sm font-semibold text-white mt-1">
                          {uploadingVideo ? 'Téléversement du fichier en cours...' : 'Cliquez pour sélectionner le fichier vidéo'}
                        </span>
                        <span className="text-xs text-zinc-500">Formats supportés : MP4, MOV, WebM jusqu'à 500 Mo</span>
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm"
                          onChange={handleVideoUpload}
                          disabled={uploadingVideo}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Thumbnail */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Miniature personnalisée (Cover 16:9)</Label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {formData.thumbnail_url ? (
                    <img
                      src={formData.thumbnail_url}
                      alt="Miniature"
                      className="w-48 aspect-video rounded-xl object-cover border border-white/10 shadow-md"
                    />
                  ) : (
                    <div className="w-48 aspect-video rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-600 text-xs">
                      Aucune miniature
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold cursor-pointer transition-colors">
                      {uploadingThumb ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>{uploadingThumb ? 'Upload en cours...' : 'Uploader une miniature HD'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleThumbUpload}
                        disabled={uploadingThumb}
                        className="hidden"
                      />
                    </label>
                    <Input
                      value={formData.thumbnail_url}
                      onChange={(e) => setField('thumbnail_url', e.target.value)}
                      placeholder="Ou collez une URL d'image directe..."
                      className="bg-black/40 border-white/10 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Monetization, Avant-première D2C & Rights */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Avant-première D2C toggle */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-black/40 to-transparent border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-display font-black text-amber-300 text-sm flex items-center gap-2">
                      <DollarSign size={16} /> Avant-Première Payante D2C (Direct-to-Consumer)
                    </span>
                    <p className="text-xs text-zinc-400">
                      Vendez l'accès exclusif à votre clip 48h à 7 jours avant la diffusion publique mondiale.
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_for_sale}
                    onCheckedChange={(v) => setField('is_for_sale', v)}
                  />
                </div>

                {formData.is_for_sale && (
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <Label className="text-xs text-zinc-300">Prix du pass exclusif en FCFA (Reversé à 85% à l'artiste)</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {QUICK_PRICES.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setField('price', p)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            formData.price === p
                              ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                              : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          {p.toLocaleString()} F
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mise en avant plateforme */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div>
                  <span className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" /> Mettre en avant sur la page d'accueil
                  </span>
                  <p className="text-xs text-zinc-400">Positionner ce clip dans le bandeau cinéma et les recommandations tendances</p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(v) => setField('is_featured', v)}
                />
              </div>

              {/* Rights certification */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="video_rights"
                    checked={formData.copyright_agreed}
                    onChange={(e) => setField('copyright_agreed', e.target.checked)}
                    className="mt-1 rounded border-white/20 text-primary focus:ring-primary h-4 w-4 bg-black/60"
                  />
                  <label htmlFor="video_rights" className="text-xs text-zinc-300 leading-relaxed cursor-pointer">
                    Je certifie sur l'honneur détenir l'intégralité des droits d'auteur, de production audiovisuelle et d'image
                    pour la diffusion de cette œuvre sur KKD Music, conformément aux lois africaines et internationales sur la propriété intellectuelle.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success state */}
          {step === 4 && publishedVideo && (
            <div className="text-center py-8 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-2xl font-black text-white">Vidéo Officiellement Publiée !</h3>
                <p className="text-sm text-zinc-400">
                  Votre contenu est désormais référencé et accessible sur tout le réseau KKD.
                </p>
              </div>

              {publishedVideo.thumbnail_url && (
                <div className="max-w-md mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                  <img src={publishedVideo.thumbnail_url} alt={publishedVideo.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="font-display font-bold text-white text-base">{publishedVideo.title}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => {
                    onClose();
                    window.location.href = `/videos/${publishedVideo.slug || publishedVideo.id}`;
                  }}
                  className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/30"
                >
                  <Play size={16} className="mr-2" /> Voir le clip maintenant
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-white/20 text-white hover:bg-white/10 rounded-xl"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 4 && (
          <div className="px-6 py-4 bg-black/60 border-t border-white/[0.08] flex items-center justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className="text-zinc-400 hover:text-white"
              >
                Précédent
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 1 && validateStep1()) setStep(2);
                  if (step === 2 && validateStep2()) setStep(3);
                }}
                className="bg-primary text-primary-foreground font-bold px-5 rounded-xl"
              >
                Suivant <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 rounded-xl shadow-lg shadow-emerald-600/30"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" /> Publication en cours...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" /> Publier Définitivement
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
