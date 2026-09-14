import React, { useRef, useState } from 'react';
import {
  ListMusic,
  Plus,
  Trash2,
  Upload,
  Play,
  Pause,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function SubmissionTracklistEditor({
  tracks = [],
  onChange,
  artistName = '',
  format = 'album',
}) {
  const { toast } = useToast();
  const multiAudioInputRef = useRef(null);
  const [playingTrackIndex, setPlayingTrackIndex] = useState(null);
  const [activeAudioElement, setActiveAudioElement] = useState(null);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);

  // Audio preview control
  const handleTogglePlay = (index, audioUrl) => {
    if (!audioUrl) return;

    if (playingTrackIndex === index && activeAudioElement) {
      activeAudioElement.pause();
      setActiveAudioElement(null);
      setPlayingTrackIndex(null);
      return;
    }

    if (activeAudioElement) {
      activeAudioElement.pause();
    }

    const audio = new Audio(audioUrl);
    audio.play().catch(() => {});
    audio.onended = () => {
      setPlayingTrackIndex(null);
      setActiveAudioElement(null);
    };

    setActiveAudioElement(audio);
    setPlayingTrackIndex(index);
  };

  // Add empty track
  const handleAddTrack = () => {
    const nextNum = tracks.length + 1;
    const newTrack = {
      id: `trk_${Date.now()}_${nextNum}`,
      track_number: nextNum,
      title: `Piste ${nextNum}`,
      featuring_artist: '',
      audio_file_url: '',
      duration: 180,
      is_for_sale: false,
    };
    onChange([...tracks, newTrack]);
  };

  // Update track property
  const handleUpdateTrack = (index, field, value) => {
    const updated = tracks.map((t, idx) => {
      if (idx === index) {
        return { ...t, [field]: value };
      }
      return t;
    });
    onChange(updated);
  };

  // Remove track
  const handleRemoveTrack = (index) => {
    if (tracks.length <= 1) {
      toast({
        title: 'Action impossible',
        description: 'Un album ou EP doit contenir au moins un morceau.',
      });
      return;
    }
    const filtered = tracks
      .filter((_, idx) => idx !== index)
      .map((t, idx) => ({ ...t, track_number: idx + 1 }));
    onChange(filtered);
  };

  // Upload single track audio
  const handleSingleAudioUpload = async (index, file) => {
    if (!file) return;
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      const url = res.file_url || URL.createObjectURL(file);
      handleUpdateTrack(index, 'audio_file_url', url);
      toast({
        title: 'Piste audio chargée',
        description: `${file.name} associé à la piste #${index + 1}.`,
      });
    } catch {
      toast({
        title: 'Erreur import',
        description: "Échec de l'importation de l'audio.",
        variant: 'destructive',
      });
    }
  };

  // Batch upload multiple MP3/WAV files at once
  const handleBatchAudioUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingBatch(true);
    toast({
      title: 'Import multiple en cours…',
      description: `Téléversement de ${files.length} fichiers audio pour cet album.`,
    });

    try {
      const newTracksList = [...tracks];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileUrl = '';
        try {
          const res = await base44.integrations.Core.UploadPublicFile({ file });
          fileUrl = res.file_url || URL.createObjectURL(file);
        } catch {
          fileUrl = URL.createObjectURL(file);
        }

        // Clean filename for title
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/^[0-9]+[-_.\s]+/, '')
          .trim();

        const trackNumber = newTracksList.length + 1;
        newTracksList.push({
          id: `trk_batch_${Date.now()}_${i}`,
          track_number: trackNumber,
          title: cleanName || `Piste ${trackNumber}`,
          featuring_artist: '',
          audio_file_url: fileUrl,
          duration: 180,
          is_for_sale: false,
        });
      }

      onChange(newTracksList);
      toast({
        title: 'Morceaux ajoutés à l’album',
        description: `${files.length} pistes audio ont été importées et regroupées.`,
      });
    } catch (err) {
      toast({
        title: 'Erreur import multiple',
        description: 'Une erreur est survenue lors de l’envoi des fichiers.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingBatch(false);
      if (multiAudioInputRef.current) multiAudioInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and guidance */}
      <div className="p-4 rounded-2xl bg-[#141824] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <ListMusic size={20} />
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-white font-bold flex items-center gap-2">
              Architecture {format === 'ep' ? 'de l’EP' : 'de l’Album'}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                {tracks.length} {tracks.length > 1 ? 'morceaux regroupés' : 'morceau'}
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Toutes les chansons de cet {format === 'ep' ? 'EP' : 'album'} restent liées et
              indissociables sur KKD Music.
            </p>
          </div>
        </div>

        {/* Batch upload button */}
        <div className="flex items-center gap-2">
          <input
            ref={multiAudioInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleBatchAudioUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => multiAudioInputRef.current?.click()}
            disabled={isUploadingBatch}
            className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 hover:text-white font-bold flex items-center gap-1.5 transition-all border border-white/[0.06] cursor-pointer"
          >
            <Upload size={13} />
            {isUploadingBatch ? 'Import en cours…' : 'Importer plusieurs fichiers MP3'}
          </button>
        </div>
      </div>

      {/* Tracks rows */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {tracks.map((track, idx) => {
          const isPlaying = playingTrackIndex === idx;
          return (
            <div
              key={track.id || idx}
              className="p-3 sm:p-3.5 rounded-xl bg-[#161a26] border border-white/[0.07] hover:border-white/[0.15] transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              {/* Track number badge */}
              <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/[0.08] flex items-center justify-center text-xs font-mono font-bold text-zinc-400 shrink-0">
                #{idx + 1}
              </div>

              {/* Title input */}
              <div className="flex-1 w-full sm:w-auto">
                <input
                  type="text"
                  value={track.title || ''}
                  onChange={(e) => handleUpdateTrack(idx, 'title', e.target.value)}
                  placeholder={`Titre du morceau ${idx + 1}`}
                  className="w-full bg-[#1b202e] border border-white/[0.08] focus:border-primary rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 font-medium"
                />
              </div>

              {/* Featuring input */}
              <div className="w-full sm:w-48">
                <input
                  type="text"
                  value={track.featuring_artist || ''}
                  onChange={(e) => handleUpdateTrack(idx, 'featuring_artist', e.target.value)}
                  placeholder="Feat. (ex: Wally Seck)"
                  className="w-full bg-[#1b202e] border border-white/[0.08] focus:border-primary rounded-lg px-2.5 py-1.5 text-xs text-amber-300 placeholder-zinc-500 font-medium"
                />
              </div>

              {/* Audio status & Play/Upload */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {track.audio_file_url ? (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleTogglePlay(idx, track.audio_file_url)}
                      className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      title="Écouter l'extrait"
                    >
                      {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                      <span>{isPlaying ? 'Pause' : 'Écouter'}</span>
                    </button>
                  </div>
                ) : (
                  <label className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white font-medium cursor-pointer border border-white/[0.08] flex items-center gap-1">
                    <Upload size={11} />
                    <span>Fichier audio</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleSingleAudioUpload(idx, e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveTrack(idx)}
                  className="w-7 h-7 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                  title="Supprimer ce morceau de l'album"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add track button */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleAddTrack}
          className="text-xs text-primary hover:text-primary/90 font-bold flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all cursor-pointer"
        >
          <Plus size={14} />
          Ajouter une piste à l'album
        </button>

        <span className="text-[11px] text-zinc-400 font-mono">
          Total : {tracks.length} titre{tracks.length > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
