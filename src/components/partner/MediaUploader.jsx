import React, { useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Music, Video, CheckCircle2, Lock } from 'lucide-react';

/**
 * Zone de téléversement intuitive avec aperçu (image / audio / vidéo).
 * Affiche la pochette ou un lecteur inline une fois le fichier chargé.
 */
export default function MediaUploader({
  label, hint, accept, value, onUpload, onClear, uploading, kind, isPrivate,
}) {
  const inputRef = useRef(null);
  const isPlayable = String(value || '').startsWith('http');

  const pick = (file) => { if (file) onUpload(file); };

  return (
    <div>
      {label && <p className="text-xs mb-1.5 font-medium block">{label}</p>}

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card">
          {kind === 'image' && (
            <div className="aspect-square w-full max-w-[200px] mx-auto bg-black/30">
              <img src={value} alt="aperçu" className="w-full h-full object-cover" />
            </div>
          )}
          {kind === 'audio' && (
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                {isPrivate ? <Lock size={14} className="text-primary" /> : <Music size={14} className="text-primary" />}
                <span className="truncate flex-1">{isPrivate ? 'Fichier privé chargé' : 'Fichier audio chargé'}</span>
                <CheckCircle2 size={14} className="text-green-500" />
              </div>
              {isPlayable && <audio src={value} controls className="w-full h-9" />}
            </div>
          )}
          {kind === 'video' && (isPlayable ? (
            <video src={value} controls className="w-full max-h-56 bg-black" />
          ) : (
            <div className="p-3 flex items-center gap-2 text-xs">
              <Lock size={14} className="text-primary" /> <span>Fichier vidéo privé chargé</span>
              <CheckCircle2 size={14} className="text-green-500 ml-auto" />
            </div>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-white transition-colors z-10"
            aria-label="Supprimer"
          >
            <X size={14} />
          </button>
          {!isPrivate && isPlayable && (
            <label className="block text-center text-[11px] text-primary py-1.5 hover:underline cursor-pointer">
              Remplacer
              <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files[0])} />
            </label>
          )}
        </div>
      ) : (
        <label
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer?.files?.[0]); }}
          onDragOver={(e) => e.preventDefault()}
          className="block cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-primary/5 transition-colors p-6 text-center"
        >
          <input type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files[0])} />
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {uploading ? (
              <Loader2 size={26} className="animate-spin text-primary" />
            ) : kind === 'image' ? (
              <ImageIcon size={26} />
            ) : kind === 'video' ? (
              <Video size={26} />
            ) : (
              <Music size={26} />
            )}
            <p className="text-sm font-medium">
              {uploading ? 'Envoi en cours…' : `Téléverser ${kind === 'image' ? 'une image' : kind === 'video' ? 'une vidéo' : 'un audio'}`}
            </p>
            {hint && <p className="text-[11px]">{hint}</p>}
          </div>
        </label>
      )}
    </div>
  );
}