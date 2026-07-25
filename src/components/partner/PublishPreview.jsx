import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Music, Video, Disc, ListMusic, CheckCircle, Loader2, Lock, Link2, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_LABELS = {
  sortie_musicale: 'Single / Titre',
  album: 'Album',
  ep: 'EP / Mixtape',
  video_clip: 'Clip vidéo',
};

const TYPE_ICONS = {
  sortie_musicale: Music, album: Disc, ep: ListMusic, video_clip: Video,
};

/**
 * PublishPreview — étape de prévisualisation avant publication.
 * Affiche la pochette, les métadonnées, le featuring, et un lecteur
 * pour ÉCOUTER le contenu (audio/vidéo/album) avant de valider.
 */
export default function PublishPreview({
  form, contentType, isVideo, isAlbum, playableUrl, playableLoading,
  onBack, onPublish, publishing,
}) {
  const typeLabel = TYPE_LABELS[contentType] || contentType;
  const TypeIcon = TYPE_ICONS[contentType] || Music;
  const albumTracks = (form.tracks || []).filter((t) => t.audio_file_url);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TypeIcon size={16} className="text-primary" />
          </div>
          <p className="font-heading font-bold text-sm leading-none">Prévisualisation</p>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        {/* Pochette + métadonnées */}
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          {form.cover_url ? (
            <img src={form.cover_url} alt={form.title} className="w-full sm:w-40 aspect-square rounded-xl object-cover shadow-lg" />
          ) : (
            <div className="w-full sm:w-40 aspect-square rounded-xl bg-primary/10 flex items-center justify-center">
              <TypeIcon size={32} className="text-primary/40" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary">{typeLabel}</span>
            <h3 className="font-display text-xl font-extrabold leading-tight mt-1 break-words">{form.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {form.artist_name}
              {form.featuring_artist && (
                <span className="text-foreground/80"> (feat. {form.featuring_artist})</span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {form.is_for_sale ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1">
                  <Lock size={10} /> Payant — {form.price} €
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
                  Gratuit — écoute complète
                </span>
              )}
              {form.is_for_sale && (
                <span className="text-[10px] text-muted-foreground">Extrait 30s dès {Math.floor(form.preview_start || 0)}s</span>
              )}
            </div>
          </div>
        </div>

        {/* Lecteur de prévisualisation */}
        <div className="border-t border-border/30 p-4 space-y-3">
          <p className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
            <Play size={11} className="text-primary" /> Écouter avant de publier
          </p>
          {playableLoading ? (
            <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Préparation de l'écoute…</p>
          ) : isAlbum ? (
            albumTracks.length ? (
              <div className="space-y-2">
                {albumTracks.map((t, i) => (
                  <div key={i} className="bg-secondary/40 rounded-lg p-2">
                    <p className="text-xs font-medium mb-1 truncate">{i + 1}. {t.title || `Piste ${i + 1}`}</p>
                    <audio controls src={t.audio_file_url} className="w-full h-9" />
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">Aucune piste audio.</p>
          ) : isVideo ? (
            playableUrl ? (
              <video controls src={playableUrl} className="w-full rounded-xl bg-black max-h-72" />
            ) : <p className="text-xs text-muted-foreground">Aperçu vidéo indisponible.</p>
          ) : (
            playableUrl ? (
              <audio controls src={playableUrl} className="w-full h-10" />
            ) : <p className="text-xs text-muted-foreground">Aperçu audio indisponible.</p>
          )}
        </div>

        {/* Lien streaming */}
        {form.streaming_link && (
          <div className="border-t border-border/30 p-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Link2 size={12} className="text-primary shrink-0" />
            <span className="truncate">{form.streaming_platform} : {form.streaming_link}</span>
          </div>
        )}

        {/* Description */}
        {form.description && (
          <div className="border-t border-border/30 p-4">
            <p className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-1">Description</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{form.description}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-5">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-12">
          Modifier
        </Button>
        <Button type="button" onClick={onPublish} disabled={publishing} className="flex-1 h-12 font-bold">
          {publishing ? (
            <><Loader2 size={16} className="animate-spin mr-2" /> Publication…</>
          ) : (
            <><CheckCircle size={16} className="mr-2" /> Publier</>
          )}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground text-center mt-3">
        Vérifiez l'écoute, puis validez. L'équipe KKD examinera votre contenu avant sa mise en ligne.
      </p>
    </motion.div>
  );
}