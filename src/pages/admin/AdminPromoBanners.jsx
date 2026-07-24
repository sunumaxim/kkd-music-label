import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Image as ImageIcon, Megaphone, Plus, Trash2, Upload, Loader2,
  CheckCircle, X, ExternalLink, Volume2, Pencil, Power,
} from 'lucide-react';

const TYPE_LABEL = { banner: 'Bannière', audio: 'Annonce audio' };
const PLACEMENT_LABEL = { top_banner: 'Haut de page', feed: 'Dans le fil', player: 'Lecteur' };

const empty = {
  title: '', type: 'banner', sponsor_name: '', image_url: '', audio_url: '',
  link_url: '', embed_url: '', text: '', placement: 'top_banner',
  is_active: true, start_date: '', end_date: '', order: 0,
};

function toLocalInput(d) {
  if (!d) return '';
  const n = new Date(d);
  if (isNaN(n)) return '';
  const off = n.getTimezoneOffset();
  return new Date(n - off * 60000).toISOString().slice(0, 16);
}

export default function AdminPromoBanners() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | existing object
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(null); // 'image' | 'audio'

  const { data: promos = [] } = useQuery({
    queryKey: ['admin-promo-banners'],
    queryFn: () => base44.entities.PromoBanner.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? base44.entities.PromoBanner.update(id, data) : base44.entities.PromoBanner.create(data)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-promo-banners'] }); setEditing(null); setForm(empty); },
  });

  const delMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoBanner.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-promo-banners'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PromoBanner.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-promo-banners'] }),
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const startEdit = (p) => {
    setEditing(p);
    setForm({
      ...empty,
      ...p,
      start_date: toLocalInput(p.start_date),
      end_date: toLocalInput(p.end_date),
    });
  };

  const upload = async (kind, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(kind);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      set(kind === 'image' ? 'image_url' : 'audio_url', res.file_url);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      order: Number(form.order) || 0,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
    };
    saveMutation.mutate({ id: typeof editing === 'object' ? editing.id : null, data: payload });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
            <Megaphone size={22} className="text-primary" /> Bannières & Annonces
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les bannières sponsors et les annonces audio KKD affichées dynamiquement dans l'interface.
          </p>
        </div>
        {!editing && (
          <Button onClick={() => { setEditing('new'); setForm(empty); }} className="gap-2">
            <Plus size={16} /> Nouvelle promo
          </Button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="bg-card border border-border/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg">
              {editing === 'new' ? 'Nouvelle promotion' : 'Modifier la promotion'}
            </h2>
            <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[{ k: 'banner', l: 'Bannière', icon: ImageIcon }, { k: 'audio', l: 'Annonce audio', icon: Volume2 }].map((o) => {
              const Icon = o.icon;
              return (
                <button type="button" key={o.k} onClick={() => set('type', o.k)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${form.type === o.k ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  <Icon size={15} /> {o.l}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Titre *</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sponsor / Source</Label>
              <Input value={form.sponsor_name} onChange={(e) => set('sponsor_name', e.target.value)} placeholder="KKD Music ou nom du sponsor" />
            </div>
          </div>

          {form.type === 'banner' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Image de la bannière</Label>
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors w-fit">
                  <Upload size={14} />
                  {uploading === 'image' ? 'Envoi…' : form.image_url ? 'Image chargée ✓' : 'Choisir une image'}
                  <input type="file" className="hidden" onChange={(e) => upload('image', e)} accept="image/*" />
                </label>
                {form.image_url && <img src={form.image_url} alt="" className="h-20 rounded-lg object-cover" />}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Lien externe (ouvert au clic)</Label>
                  <Input value={form.link_url} onChange={(e) => set('link_url', e.target.value)} placeholder="https://site-sponsor.com" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">…ou afficher un site en iframe (habillage)</Label>
                  <Input value={form.embed_url} onChange={(e) => set('embed_url', e.target.value)} placeholder="https://site-a-integrer.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Texte / slogan (si pas d'image)</Label>
                <Textarea value={form.text} onChange={(e) => set('text', e.target.value)} rows={2} />
              </div>
            </>
          )}

          {form.type === 'audio' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Fichier audio de l'annonce *</Label>
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs transition-colors w-fit">
                <Upload size={14} />
                {uploading === 'audio' ? 'Envoi…' : form.audio_url ? 'Audio chargé ✓' : 'Choisir un audio'}
                <input type="file" className="hidden" onChange={(e) => upload('audio', e)} accept="audio/*" />
              </label>
              {form.audio_url && <audio src={form.audio_url} controls className="w-full mt-2 h-9" />}
              <div className="space-y-1.5">
                <Label className="text-xs">Texte accompagnant l'annonce</Label>
                <Textarea value={form.text} onChange={(e) => set('text', e.target.value)} rows={2} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Emplacement</Label>
              <select value={form.placement} onChange={(e) => set('placement', e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm">
                <option value="top_banner">Haut de page</option>
                <option value="feed">Dans le fil</option>
                <option value="player">Lecteur</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ordre</Label>
              <Input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Début</Label>
              <Input type="datetime-local" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fin</Label>
              <Input type="datetime-local" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-primary w-4 h-4" />
            Active (afficher dans l'interface)
          </label>

          <div className="flex gap-3">
            <Button type="submit" disabled={saveMutation.isPending || uploading} className="gap-2">
              {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              {editing === 'new' ? 'Créer' : 'Enregistrer'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setEditing(null); setForm(empty); }}>Annuler</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          {promos.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
              <Megaphone size={36} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucune promotion créée.</p>
            </div>
          ) : (
            promos.map((p) => (
              <div key={p.id} className="bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-4">
                {p.type === 'banner' && p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-20 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {p.type === 'audio' ? <Volume2 size={20} className="text-primary" /> : <ImageIcon size={20} className="text-primary" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{TYPE_LABEL[p.type]}</span>
                    <p className="font-heading font-bold text-sm truncate">{p.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.sponsor_name && `${p.sponsor_name} · `}
                    {PLACEMENT_LABEL[p.placement] || p.placement}
                    {p.link_url && <> · <ExternalLink size={10} className="inline" /> lien</>}
                    {p.embed_url && ' · iframe'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggleMutation.mutate({ id: p.id, is_active: !p.is_active })}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${p.is_active ? 'bg-green-500/10 text-green-400' : 'bg-secondary text-muted-foreground'}`}
                    title={p.is_active ? 'Active' : 'Inactive'}>
                    <Power size={15} />
                  </button>
                  <button onClick={() => startEdit(p)} className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary text-muted-foreground hover:text-foreground">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => delMutation.mutate(p.id)} className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary text-muted-foreground hover:text-destructive">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}