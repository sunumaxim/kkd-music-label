import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import {
  Link2, Loader2, Sparkles, CheckCircle, AlertTriangle,
  Music, Video, Disc, ArrowLeft, Eye, Headphones
} from 'lucide-react';
import ArtistSelector from './ArtistSelector';
import EmbeddedPlayer from '@/components/shared/UniversalPlayer';
import { useToast } from '@/components/ui/use-toast';
import { catalogImporterService } from '@/services/catalogImporterService';

const PLATFORM_LABELS = {
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  youtube: 'YouTube',
  audiomack: 'Audiomack',
  deezer: 'Deezer',
  soundcloud: 'SoundCloud',
};

const TYPE_META = {
  track:  { label: 'Titre',  icon: Music, content_type: 'sortie_musicale' },
  album:  { label: 'Album', icon: Disc,  content_type: 'album' },
  video:  { label: 'Vidéo', icon: Video, content_type: 'video_clip' },
  artist: { label: 'Artiste', icon: Music, content_type: 'sortie_musicale' },
};

export default function LinkPublishMode({ user, onClose }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [extractError, setExtractError] = useState('');
  const [artistId, setArtistId] = useState('');
  const [artistName, setArtistName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isForSale, setIsForSale] = useState(false);
  const [price, setPrice] = useState(0);
  const [done, setDone] = useState(false);

  const handleExtract = async () => {
    if (!url.trim()) return;
    setExtracting(true);
    setExtractError('');
    setMetadata(null);
    try {
      // 1. Extraction optimisée multi-sources (résout 403 Spotify et extrait featurings)
      let data = null;
      try {
        data = await catalogImporterService.extractFromUrl(url.trim());
      } catch (e) {
        console.warn('Fallback vers Base44 extractLinkMetadata:', e);
      }

      if (!data) {
        const res = await base44.functions.invoke('extractLinkMetadata', { url: url.trim() });
        if (res.data?.error) throw new Error(res.data.error);
        data = res.data;
      }

      if (!data) throw new Error("Impossible d'extraire les données du lien.");

      setMetadata(data);
      setArtistName(data.artist_name || '');
      setTitle(data.title || '');
      if (data.description) setDescription(data.description);
      if (data.duplicate_warning) {
        toast({
          title: 'Doublon détecté',
          description: data.duplicate_warning,
          variant: 'destructive',
        });
      }
    } catch (err) {
      setExtractError(err?.message || 'Extraction échouée');
    } finally {
      setExtracting(false);
    }
  };

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.PartnerPublication.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-publications'] });
      setDone(true);
    },
  });

  const canSubmit = metadata && (artistId || artistName.trim()) && title.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    const contentType = TYPE_META[metadata.type]?.content_type || 'sortie_musicale';
    const tracks = metadata.tracks
      ? metadata.tracks.map((t) => ({
          title: t.title || '',
          streaming_link: t.spotify_url || t.deezer_url || t.youtube_url || t.streaming_link || '',
          streaming_platform: metadata.platform,
          duration_ms: t.duration_ms || 0,
        }))
      : [];

    mutation.mutate({
      partner_email: user.email,
      partner_name: user.full_name || user.email,
      content_type: contentType,
      title: title.trim(),
      artist_name: artistName.trim(),
      artist_id: artistId || '',
      streaming_link: url.trim(),
      streaming_platform: metadata.platform,
      cover_url: metadata.cover_url || '',
      description: description || metadata.description || '',
      is_for_sale: isForSale,
      price: isForSale ? Number(price) : 0,
      tracks,
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
          Votre contenu « {title} » est en attente de validation par l'équipe KKD.
        </p>
        <Button onClick={onClose} variant="outline">Retour au tableau de bord</Button>
      </motion.div>
    );
  }

  const detectedType = metadata ? TYPE_META[metadata.type] : null;
  const TypeIcon = detectedType?.icon || Music;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Link2 size={16} className="text-primary" />
          </div>
          <p className="font-heading font-bold text-sm leading-none">Publication par lien externe</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Étape 1 : Coller le lien */}
        <div>
          <Label className="text-xs mb-1.5 flex items-center gap-1.5">
            <Link2 size={12} className="text-primary" /> Lien de streaming (Spotify, YouTube, Apple Music, Deezer, Audiomack, SoundCloud)
          </Label>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://open.spotify.com/track/..."
              type="url"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleExtract}
              disabled={!url.trim() || extracting}
              className="shrink-0 gap-2"
            >
              {extracting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {extracting ? 'Extraction...' : 'Extraire'}
            </Button>
          </div>
          {extractError && (
            <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              {extractError}
            </div>
          )}
        </div>

        {/* Étape 2 : Métadonnées extraites + lecteur intégré */}
        {metadata && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
              <CheckCircle size={14} />
              Métadonnées extraites depuis {PLATFORM_LABELS[metadata.platform] || metadata.platform}
            </div>

            {/* Aperçu pochette + infos + type détecté */}
            <div className="flex gap-4 bg-card border border-border/50 rounded-xl p-4">
              {metadata.cover_url && (
                <img src={metadata.cover_url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <TypeIcon size={13} className="text-primary" />
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {detectedType?.label || 'Contenu'} · {PLATFORM_LABELS[metadata.platform]}
                  </span>
                </div>
                <p className="font-heading font-bold text-sm truncate">{metadata.title}</p>
                <p className="text-xs text-muted-foreground truncate">{metadata.artist_name}</p>
                {metadata.description && (
                  <p className="text-[11px] text-muted-foreground/70 line-clamp-2">{metadata.description}</p>
                )}
              </div>
            </div>

            {/* Lecteur intégré — écouter / regarder avant de publier */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Headphones size={12} className="text-primary" /> Aperçu lecteur — vérifiez le contenu
              </Label>
              <EmbeddedPlayer url={url.trim()} />
            </div>

            {/* Pistes extraites (album) */}
            {metadata.tracks && metadata.tracks.length > 0 && (
              <div className="bg-card border border-border/50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <Disc size={12} className="text-primary" /> {metadata.tracks.length} piste(s) extraite(s)
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {metadata.tracks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-1">
                      <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                      <span className="flex-1 truncate">{t.title}</span>
                      {t.duration_ms > 0 && (
                        <span className="text-muted-foreground shrink-0">
                          {Math.floor(t.duration_ms / 60000)}:{String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {metadata.duplicate_warning && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Doublon détecté</p>
                  <p className="text-amber-400/80">{metadata.duplicate_warning}</p>
                </div>
              </div>
            )}

            {/* Titre (éditable) */}
            <div>
              <Label className="text-xs mb-1.5 block">Titre *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du contenu" />
            </div>

            {/* Artiste : lier au catalogue */}
            <div className="space-y-2">
              <Label className="text-xs mb-1.5 block">Lier à un artiste du catalogue (recommandé)</Label>
              <ArtistSelector
                value={artistId}
                onChange={(id, name) => { setArtistId(id); setArtistName(name); }}
                placeholder="Rechercher l'artiste dans le catalogue KKD..."
              />
              {!artistId && (
                <Input value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Ou saisir le nom de scène manuellement" />
              )}
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs mb-1.5 block">Description (facultatif)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ajoutez un contexte, des crédits..." rows={2} />
            </div>

            {/* Mise en vente (single/clip uniquement) */}
            {metadata.type !== 'album' && metadata.type !== 'artist' && (
              <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-bold text-sm">Mettre en vente (exclusif KKD)</p>
                    <p className="text-[11px] text-muted-foreground">L'acheteur accède au contenu via le lien externe après paiement.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsForSale(v => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${isForSale ? 'bg-primary' : 'bg-secondary'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isForSale ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {isForSale && (
                  <div>
                    <Label className="text-xs mb-1.5 block">Prix (FCFA) *</Label>
                    <Input type="number" min="100" step="100" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" />
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="button"
                disabled={!canSubmit || mutation.isPending}
                onClick={handleSubmit}
                className="w-full h-12 font-bold text-base gap-2"
              >
                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                {mutation.isPending ? 'Envoi...' : 'Soumettre pour validation'}
              </Button>
              {!canSubmit && (
                <p className="text-[11px] text-muted-foreground text-center mt-2">
                  Liez un artiste et vérifiez le titre avant de soumettre.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {!metadata && !extracting && !extractError && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Link2 size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            Collez un lien de streaming ci-dessus et cliquez sur « Extraire ».
            <br />
            Le système récupère automatiquement le titre, l'artiste et la pochette,
            <br />avec un aperçu lecteur pour vérifier le contenu.
          </div>
        )}
      </div>
    </motion.div>
  );
}