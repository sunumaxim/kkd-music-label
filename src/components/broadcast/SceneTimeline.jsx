import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Film, Image as ImageIcon, Music, Upload, X, ChevronUp, ChevronDown, Loader2, Plus } from 'lucide-react';

export default function SceneTimeline({ source_video_ids = [], background_image_url, audio_playlist = [], onChange }) {
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioLink, setAudioLink] = useState('');

  const { data: videos = [] } = useQuery({
    queryKey: ['timeline-videos'],
    queryFn: () => base44.entities.Video.list('-created_date', 100),
  });

  const scenes = source_video_ids.map(id => videos.find(v => v.id === id)).filter(Boolean);

  const move = (idx, dir) => {
    const arr = [...source_video_ids];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    onChange({ source_video_ids: arr });
  };
  const remove = (id) => onChange({ source_video_ids: source_video_ids.filter(x => x !== id) });

  const uploadImage = async (file) => {
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange({ background_image_url: res.file_url });
    } finally { setUploadingImg(false); }
  };
  const uploadAudio = async (file) => {
    if (!file) return;
    setUploadingAudio(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange({ audio_playlist: [...audio_playlist, res.file_url] });
    } finally { setUploadingAudio(false); }
  };
  const removeAudio = (i) => onChange({ audio_playlist: audio_playlist.filter((_, j) => j !== i) });

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
      <h3 className="font-heading font-bold text-sm flex items-center gap-2">
        <Film size={16} className="text-primary" /> Programme (file de scènes)
      </h3>

      {scenes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucune vidéo en file. Ajoute des vidéos depuis la source « Catalogue ».</p>
      ) : (
        <div className="space-y-1.5">
          {scenes.map((v, idx) => (
            <div key={v.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <span className="w-5 h-5 rounded bg-primary/15 text-primary text-[10px] font-mono flex items-center justify-center shrink-0">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground truncate">{v.artist_name}</p>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 rounded hover:bg-secondary disabled:opacity-30"><ChevronUp size={13} /></button>
                <button onClick={() => move(idx, 1)} disabled={idx === scenes.length - 1} className="p-1 rounded hover:bg-secondary disabled:opacity-30"><ChevronDown size={13} /></button>
                <button onClick={() => remove(v.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><X size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Background image (circulation) */}
      <div className="border-t border-border/50 pt-3">
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <ImageIcon size={11} /> Image fixe (circulation)
        </label>
        {background_image_url ? (
          <div className="relative">
            <img src={background_image_url} alt="fond" className="w-full h-24 object-cover rounded-lg" />
            <button onClick={() => onChange({ background_image_url: '' })} className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white"><X size={12} /></button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 cursor-pointer border border-dashed border-border/60 rounded-lg py-4 text-xs text-muted-foreground hover:border-primary/50">
            {uploadingImg ? <><Loader2 size={14} className="animate-spin" /> Upload…</> : <><Upload size={14} /> Choisir une image</>}
            <input type="file" accept="image/*" className="hidden" onChange={e => uploadImage(e.target.files?.[0])} disabled={uploadingImg} />
          </label>
        )}
      </div>

      {/* Audio playlist */}
      <div className="border-t border-border/50 pt-3">
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Music size={11} /> Pistes audio
        </label>
        <div className="space-y-1 mb-2">
          {audio_playlist.map((url, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <Music size={12} className="text-muted-foreground shrink-0" />
              <span className="text-xs flex-1">Piste {i + 1}</span>
              <audio controls src={url} className="h-7 max-w-[140px]" />
              <button onClick={() => removeAudio(i)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><X size={12} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-2">
          <input
            value={audioLink}
            onChange={e => setAudioLink(e.target.value)}
            placeholder="Coller un lien (Spotify, YouTube, SoundCloud…)"
            className="flex-1 bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={() => {
              if (audioLink.trim()) {
                onChange({ audio_playlist: [...audio_playlist, audioLink.trim()] });
                setAudioLink('');
              }
            }}
            className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            Ajouter
          </button>
        </div>
        <label className="flex items-center justify-center gap-2 cursor-pointer border border-dashed border-border/60 rounded-lg py-3 text-xs text-muted-foreground hover:border-primary/50">
          {uploadingAudio ? <><Loader2 size={14} className="animate-spin" /> Upload…</> : <><Plus size={14} /> Ajouter un son (fichier)</>}
          <input type="file" accept="audio/*" className="hidden" onChange={e => uploadAudio(e.target.files?.[0])} disabled={uploadingAudio} />
        </label>
      </div>
    </div>
  );
}