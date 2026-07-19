import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Film, Check } from 'lucide-react';

export default function FileSource({ source_video_url, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setName(file.name);
    setError('');
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange({ source_video_url: res.file_url });
    } catch (e) {
      setError('Upload échoué : ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-border/60 rounded-xl py-8 hover:border-primary/50 hover:bg-primary/5 transition-colors">
        {uploading ? (
          <>
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Téléversement de « {name} »…</span>
          </>
        ) : source_video_url ? (
          <>
            <Check size={22} className="text-green-500" />
            <span className="text-xs text-muted-foreground">{name || 'Fichier téléversé'}</span>
            <span className="text-[11px] text-primary underline">Remplacer</span>
          </>
        ) : (
          <>
            <Upload size={24} className="text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">Sélectionnez une vidéo depuis l'appareil</span>
          </>
        )}
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={uploading}
        />
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Film size={11} /> MP4, MOV, WebM — la vidéo devient la source du direct.</p>
    </div>
  );
}