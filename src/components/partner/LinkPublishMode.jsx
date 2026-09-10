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
  Music, Video, ArrowLeft, Eye
} from 'lucide-react';
import ArtistSelector from './ArtistSelector';
import { useToast } from '@/components/ui/use-toast';

const PLATFORM_LABELS = {
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  youtube: 'YouTube',
  audiomack: 'Audiomack',
  deezer: 'Deezer',
  soundcloud: 'SoundCloud',
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
      const res = await base44.functions.invoke('extractLinkMetadata', { url: url.trim() });
      if (res.data?.error) {
        setExtractError(res.data.error);
      } else {
        setMetadata(res.data);
        setArtistName(res.data.artist_name || '');
        if (res.data.duplicate_warning) {
          toast({
            title: 'Doublon détecté',
            description: res.data.duplicate_warning,
            variant: 'destructive',
          });
        }
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

  const canSubmit = metadata && (artistId || artistName.trim()) && metadata.title;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const platformField = metadata.platform === 'spotify' ? 'spotify_url'
      : metadata.platform === 'youtube' ? 'youtube_url'
      : metadata.platform === 'deezer' ? 'deezer_url'
      : metadata.platform === 'audiomack' ? 'audiomack_url'
      : metadata.platform === 'apple_music' ? 'apple_music_url'
      : metadata.platform === 'soundcloud' ? 'soundcloud_url' : 'streaming_link';

    mutation.mutate({
      partner_email: user.email,
      partner_name: user.full_name || user.email,
      content_type: metadata.type === 'video' ? 'video_clip' : 'sortie_musicale',
      title: metadata.title,
      artist_name: artistName.trim(),
      artist_id: artistId || '',
      streaming_link: url.trim(),
      streaming_platform: metadata.platform,
      cover_url: metadata.cover_url || '',
      description: description || metadata.description || '',
      is_for_sale: isForSale,
      price: isForSale ? Number(price) : 0,
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
          Votre contenu « {metadata?.title} » est en attente de validation par l'équipe KKD.
        </p>
        <Button onClick={onClose} variant="outline">Retour au tableau de bord</Button>
      </motion.div>
    );
  }

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

        {/* Étape 2 : Métadonnées extraites */}
        {metadata && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
              <CheckCircle size={14} />
              Métadonnées extraites depuis {PLATFORM_LABELS[metadata.platform] || metadata.platform}
            </div>

            {/* Aperçu pochette + infos */}
            <div className="flex gap-4 bg-card border border-border/50 rounded-xl p-4">
              {metadata.cover_url && (
                <img src={metadata.cover_url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  {metadata.type === 'video' ? <Video size={13} className="text-primary" /> : <Music size={13} className="text-primary" />}
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {metadata.type === 'video' ? 'Vidéo' : metadata.type === 'album' ? 'Album' : metadata.type === 'artist' ? 'Artiste' : 'Titre'}
                  </span>
                </div>
                <p className="font-heading font-bold text-sm truncate">{metadata.title}</p>
                <p className="text-xs text-muted-foreground truncate">{metadata.artist_name}</p>
                {metadata.description && (
                  <p className="text-[11px] text-muted-foreground/70 line-clamp-2">{metadata.description}</p>
                )}
              </div>
            </div>

            {metadata.duplicate_warning && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Doublon détecté</p>
                  <p className="text-amber-400/80">{metadata.duplicate_warning}</p>
                </div>
              </div>
            )}

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
            Le système récupère automatiquement le titre, l'artiste et la pochette.
          </div>
        )}
      </div>
    </motion.div>
  );
}