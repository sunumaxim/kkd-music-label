import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ImagePlus, Loader2, Type } from 'lucide-react';

const POSITIONS = [
  { value: 'top-left', label: '↖' },
  { value: 'top-right', label: '↗' },
  { value: 'center', label: '◉' },
  { value: 'bottom-left', label: '↙' },
  { value: 'bottom-right', label: '↘' },
];

export default function WatermarkConfig({ watermark_logo_url, watermark_position, watermark_opacity, overlay_text, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange({ watermark_logo_url: res.file_url });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
      <h3 className="font-heading font-bold text-sm flex items-center gap-2">
        <ImagePlus size={16} className="text-primary" /> Incrustations (logo & texte)
      </h3>

      {/* Logo upload */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">Logo / Watermark</label>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg bg-secondary border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
            {watermark_logo_url ? (
              <img src={watermark_logo_url} alt="logo" className="w-full h-full object-contain" />
            ) : (
              <ImagePlus size={18} className="text-muted-foreground/40" />
            )}
          </div>
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-secondary/70">
            {uploading && <Loader2 size={13} className="animate-spin" />}
            {uploading ? 'Chargement…' : 'Téléverser un logo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleUpload(e.target.files?.[0])}
              disabled={uploading}
            />
          </label>
          {watermark_logo_url && (
            <button onClick={() => onChange({ watermark_logo_url: '' })} className="text-xs text-destructive hover:underline">
              Retirer
            </button>
          )}
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">Position du logo</label>
        <div className="grid grid-cols-5 gap-2">
          {POSITIONS.map(p => (
            <button
              key={p.value}
              onClick={() => onChange({ watermark_position: p.value })}
              className={`aspect-square rounded-lg border text-lg flex items-center justify-center transition-colors ${
                watermark_position === p.value ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
          Opacité : {Math.round((watermark_opacity ?? 0.85) * 100)}%
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={watermark_opacity ?? 0.85}
          onChange={e => onChange({ watermark_opacity: parseFloat(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      {/* Overlay text */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Type size={11} /> Bandeau texte incrusté
        </label>
        <input
          value={overlay_text || ''}
          onChange={e => onChange({ overlay_text: e.target.value })}
          placeholder="Ex: 🔴 LIVE — KKD Music"
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>
    </div>
  );
}