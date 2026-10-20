import React, { useState } from 'react';
import { Plus, Trash2, Upload, Loader2, ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { safeHttpUrl } from '@/lib/maps';

export const SPONSOR_TIERS = [
  { value: 'principal', label: 'Partenaire principal' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'media', label: 'Partenaire média' },
];
const MAX = 12;

/** Éditeur de sponsors d'un événement : logo (upload), nom, lien, niveau. */
export default function SponsorsEditor({ value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  const [busy, setBusy] = useState(-1);
  const [err, setErr] = useState('');

  const set = (i, patch) => onChange(list.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const add = () => list.length < MAX && onChange([...list, { name: '', logo_url: '', link_url: '', tier: 'sponsor' }]);
  const remove = (i) => onChange(list.filter((_, k) => k !== i));

  const upload = async (i, file) => {
    setErr('');
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) return setErr('Logo : PNG, JPG, WebP ou SVG uniquement.');
    if (file.size > 2 * 1024 * 1024) return setErr('Logo trop lourd (2 Mo maximum).');
    setBusy(i);
    try {
      const r = await base44.integrations.Core.UploadPublicFile({ file });
      set(i, { logo_url: r.file_url });
    } catch { setErr("L'envoi du logo a échoué, réessayez."); }
    setBusy(-1);
  };

  return (
    <div className="space-y-3">
      {list.map((s, i) => (
        <div key={i} className="flex flex-wrap sm:flex-nowrap gap-3 items-center p-3 rounded-xl border border-border bg-secondary/30">
          <label className="w-20 h-20 shrink-0 rounded-xl border border-dashed border-border bg-card flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary">
            {busy === i ? <Loader2 className="animate-spin" size={18} /> : s.logo_url ? <img src={s.logo_url} alt="" className="w-full h-full object-contain p-1" /> : <span className="text-[10px] text-muted-foreground text-center flex flex-col items-center gap-1"><Upload size={16} />Logo</span>}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => upload(i, e.target.files?.[0])} />
          </label>
          <div className="flex-1 min-w-[180px] grid gap-2">
            <Input value={s.name || ''} maxLength={60} onChange={(e) => set(i, { name: e.target.value })} placeholder="Nom du sponsor" />
            <Input value={s.link_url || ''} onChange={(e) => set(i, { link_url: e.target.value })} onBlur={(e) => e.target.value && set(i, { link_url: safeHttpUrl(e.target.value) })} placeholder="Lien (https://…)" />
          </div>
          <select value={s.tier || 'sponsor'} onChange={(e) => set(i, { tier: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            {SPONSOR_TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Retirer"><Trash2 size={16} /></Button>
        </div>
      ))}
      {err && <p className="text-xs text-destructive">{err}</p>}
      <Button type="button" variant="outline" size="sm" onClick={add} disabled={list.length >= MAX} className="gap-1.5"><Plus size={14} />Ajouter un sponsor</Button>
      {list.length === 0 && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><ImageIcon size={13} />Les logos apparaîtront sur la page de l’événement et sur les billets.</p>}
    </div>
  );
}
