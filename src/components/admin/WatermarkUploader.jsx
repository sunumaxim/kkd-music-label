import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, X, ImagePlus } from 'lucide-react';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";
const LOGO_SCALE = 0.22; // logo = 22% de la largeur de l'image

/**
 * Applique le watermark (logo KKD) sur une image via canvas
 * et retourne un File prêt à uploader.
 */
async function applyWatermark(imageFile) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const logo = new Image();
    img.crossOrigin = 'anonymous';
    logo.crossOrigin = 'anonymous';

    img.onload = () => {
      logo.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Image principale
        ctx.drawImage(img, 0, 0);

        // Overlay sombre en bas
        const gradH = img.height * 0.18;
        const grad = ctx.createLinearGradient(0, img.height - gradH, 0, img.height);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, img.height - gradH, img.width, gradH);

        // Logo en bas à droite
        const logoW = img.width * LOGO_SCALE;
        const logoH = (logo.height / logo.width) * logoW;
        const margin = img.width * 0.03;
        ctx.globalAlpha = 0.88;
        ctx.drawImage(logo, img.width - logoW - margin, img.height - logoH - margin, logoW, logoH);
        ctx.globalAlpha = 1;

        canvas.toBlob((blob) => {
          resolve(new File([blob], imageFile.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.92);
      };
      logo.onerror = () => {
        // Si le logo échoue à charger, on upload sans watermark
        resolve(imageFile);
      };
      logo.src = LOGO_URL + '?t=' + Date.now();
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * WatermarkUploader — upload une ou plusieurs photos avec watermark automatique.
 * 
 * Props:
 *   value: string | string[]   — URL(s) actuelle(s)
 *   onChange: (url | urls) => void
 *   multiple: boolean          — galerie multi-photos (default false)
 *   label: string
 */
export default function WatermarkUploader({ value, onChange, multiple = false, label = 'Photo' }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);

    const results = [];
    for (const file of files) {
      const watermarked = await applyWatermark(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: watermarked });
      results.push(file_url);
    }

    if (multiple) {
      const existing = Array.isArray(value) ? value : (value ? [value] : []);
      onChange([...existing, ...results]);
    } else {
      onChange(results[0]);
    }
    setUploading(false);
  };

  const removePhoto = (idx) => {
    if (multiple) {
      const arr = Array.isArray(value) ? [...value] : [];
      arr.splice(idx, 1);
      onChange(arr);
    } else {
      onChange('');
    }
  };

  const urls = multiple
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : (value ? [value] : []);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{label}</p>

      {/* Galerie existante */}
      {urls.length > 0 && (
        <div className={`grid gap-2 ${multiple ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2'}`}>
          {urls.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-secondary">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-white" />
              </button>
              {i === 0 && multiple && (
                <span className="absolute bottom-1 left-1 bg-primary/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  PRINCIPALE
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bouton upload */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 border border-dashed border-border hover:border-primary/50 rounded-lg px-4 py-3 text-sm text-muted-foreground hover:text-primary transition-colors w-full justify-center"
      >
        {uploading ? (
          <><Loader2 size={15} className="animate-spin" /> Traitement du watermark...</>
        ) : (
          <><ImagePlus size={15} /> {multiple ? 'Ajouter des photos' : 'Choisir une photo'}</>
        )}
      </button>
      <p className="text-xs text-muted-foreground">Le logo KKD Music sera automatiquement apposé sur chaque photo.</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
    </div>
  );
}