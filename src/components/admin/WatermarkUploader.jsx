import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { X, Loader2, ImagePlus } from 'lucide-react';

/**
 * Uploader d'images générique (photos d'artistes, miniatures, galeries).
 * Props :
 *  - label     : libellé affiché au-dessus
 *  - value     : string (URL) si multiple=false, ou string[] si multiple=true
 *  - onChange  : reçoit la nouvelle valeur (string | string[])
 *  - multiple  : active le mode galerie (plusieurs images)
 */
export default function WatermarkUploader({ label, value, onChange, multiple = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (files) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      if (multiple) {
        const urls = [];
        for (const f of Array.from(files)) {
          const res = await base44.integrations.Core.UploadPublicFile({ file: f });
          if (res?.file_url) urls.push(res.file_url);
        }
        onChange([...(value || []), ...urls]);
      } else {
        const res = await base44.integrations.Core.UploadPublicFile({ file: files[0] });
        if (res?.file_url) onChange(res.file_url);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url) => {
    if (multiple) onChange((value || []).filter((v) => v !== url));
    else onChange('');
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs mb-1 block">{label}</Label>}

      {multiple ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {(value || []).map((url) => (
            <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-secondary group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {value ? (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-secondary shrink-0 group">
              <img src={value} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(value)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors shrink-0 disabled:opacity-50"
            >
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
            </button>
          )}
          {!value && <p className="text-xs text-muted-foreground">Cliquez pour téléverser une image.</p>}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
    </div>
  );
}