import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, ArrowLeft, Star } from 'lucide-react';
import WatermarkUploader from '../../components/admin/WatermarkUploader';

const EMPTY = {
  name: '', genre: '', biography: '',
  photo_url: '', gallery: [],
  spotify_url: '', youtube_url: '', apple_music_url: '',
  audiomack_url: '', instagram_url: '', facebook_url: '', tiktok_url: '',
  is_featured: false, order: 0,
};

export default function AdminArtists() {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const queryClient = useQueryClient();

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['admin-artists'],
    queryFn: () => base44.entities.Artist.list('order'),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.Artist.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-artists'] }); setEditing(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Artist.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-artists'] }); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Artist.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin-artists'] });
      const prev = queryClient.getQueryData(['admin-artists']);
      queryClient.setQueryData(['admin-artists'], (old = []) => old.filter(a => a.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => queryClient.setQueryData(['admin-artists'], ctx.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-artists'] }),
  });

  const openNew = () => { setForm(EMPTY); setEditing('new'); };
  const openEdit = (a) => { setForm({ ...EMPTY, ...a }); setEditing(a); };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (editing !== 'new' && editing?.id) {
      await updateMutation.mutateAsync({ id: editing.id, data: form });
    } else {
      await createMutation.mutateAsync(form);
    }
  };

  // ── FORM ──
  if (editing !== null) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-xl font-extrabold">
            {editing === 'new' ? 'Ajouter un artiste' : `Modifier — ${form.name}`}
          </h1>
        </div>

        <div className="space-y-5">
          {/* Infos de base */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Nom *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nom de l'artiste" />
            </div>
            <div>
              <Label className="mb-1.5 block">Genre musical</Label>
              <Input value={form.genre} onChange={e => set('genre', e.target.value)} placeholder="Afrobeat, Hip-Hop..." />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Biographie</Label>
            <Textarea value={form.biography} onChange={e => set('biography', e.target.value)} rows={4} placeholder="Biographie de l'artiste..." />
          </div>

          {/* Photo principale avec watermark */}
          <WatermarkUploader
            label="Photo principale"
            value={form.photo_url}
            onChange={(url) => set('photo_url', url)}
            multiple={false}
          />

          {/* Galerie multi-photos avec watermark */}
          <WatermarkUploader
            label="Galerie de photos"
            value={form.gallery}
            onChange={(urls) => set('gallery', urls)}
            multiple={true}
          />

          {/* Liens streaming */}
          <div>
            <p className="text-sm font-medium mb-3">Liens streaming</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'spotify_url', label: 'Spotify' },
                { key: 'youtube_url', label: 'YouTube' },
                { key: 'apple_music_url', label: 'Apple Music' },
                { key: 'audiomack_url', label: 'Audiomack' },
                { key: 'deezer_url', label: 'Deezer' },
                { key: 'soundcloud_url', label: 'SoundCloud' },
                { key: 'facebook_url', label: 'Facebook' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-xs mb-1 block">{label}</Label>
                  <Input type="url" value={form[key] || ''} onChange={e => set(key, e.target.value)} placeholder="https://..." className="text-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <p className="text-sm font-medium mb-3">Réseaux sociaux (Instagram & TikTok)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Instagram — URL du profil</Label>
                <Input type="url" value={form.instagram_url || ''} onChange={e => set('instagram_url', e.target.value)} placeholder="https://instagram.com/..." className="text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Instagram — Nom d'utilisateur</Label>
                <Input value={form.instagram_username || ''} onChange={e => set('instagram_username', e.target.value)} placeholder="nomdutilisateur (sans @)" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">TikTok — URL du profil</Label>
                <Input type="url" value={form.tiktok_url || ''} onChange={e => set('tiktok_url', e.target.value)} placeholder="https://tiktok.com/@..." className="text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">TikTok — Nom d'utilisateur</Label>
                <Input value={form.tiktok_username || ''} onChange={e => set('tiktok_username', e.target.value)} placeholder="nomdutilisateur (sans @)" className="text-sm" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block text-sm">Ordre d'affichage</Label>
              <Input type="number" value={form.order || 0} onChange={e => set('order', parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch checked={!!form.is_featured} onCheckedChange={v => set('is_featured', v)} />
              <Label>Mis en avant (accueil)</Label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={!form.name || createMutation.isPending || updateMutation.isPending}
            className="bg-primary hover:bg-primary/80"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : editing === 'new' ? 'Ajouter l\'artiste' : 'Enregistrer'}
          </Button>
          <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
        </div>
      </div>
    );
  }

  // ── LIST ──
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-extrabold">Artistes</h1>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/80">
          <Plus size={16} className="mr-1" /> Ajouter un artiste
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-card rounded-lg animate-pulse" />)}</div>
      ) : artists.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucun artiste. Cliquez sur "Ajouter un artiste".</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.map((artist) => (
            <div key={artist.id} className="bg-card border border-border/50 rounded-xl overflow-hidden group">
              {/* Cover */}
              <div className="aspect-video relative bg-secondary overflow-hidden">
                {artist.photo_url ? (
                  <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary/30">
                    {artist.name?.[0]}
                  </div>
                )}
                {artist.is_featured && (
                  <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={9} /> Vedette
                  </span>
                )}
                {/* Galerie count badge */}
                {artist.gallery?.length > 0 && (
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                    +{artist.gallery.length} photo{artist.gallery.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {/* Info */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-sm">{artist.name}</p>
                  <p className="text-xs text-muted-foreground">{artist.genre || 'Genre non défini'}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(artist)}><Pencil size={14} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm('Supprimer cet artiste ?')) deleteMutation.mutate(artist.id);
                  }}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}