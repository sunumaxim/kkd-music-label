import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, ArrowLeft, Star, Download, ShieldCheck } from 'lucide-react';
import WatermarkUploader from '../../components/admin/WatermarkUploader';
import ArtistImporter from '@/components/partner/ArtistImporter';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import { tiktokService } from '@/services';

const EMPTY = {
  name: '', genre: '', biography: '', label: '',
  birth_date: '', birth_place: '', nationality: '', active_since: '',
  group_members: [], associated_acts: [],
  wikipedia_url: '', website_url: '',
  photo_url: '', gallery: [],
  spotify_url: '', youtube_url: '', apple_music_url: '',
  audiomack_url: '', deezer_url: '', soundcloud_url: '',
  instagram_url: '', instagram_username: '',
  tiktok_url: '', tiktok_username: '',
  facebook_url: '',
  wave_number: '', payout_phone: '',
  is_featured: false, is_verified: false, order: 0,
};

function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput('');
  };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder} className="text-sm flex-1" />
        <Button type="button" variant="outline" size="sm" onClick={add}>Ajouter</Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-secondary rounded-full px-2.5 py-1">
              {v}
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-foreground ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminArtists() {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [importing, setImporting] = useState(null);
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
    if (form.tiktok_username) {
      tiktokService.connectAccount({
        username: form.tiktok_username,
        display_name: form.name,
        account_type: 'artist',
        artist_name: form.name,
        verified: true,
      });
    }
  };

  // ── IMPORTER OVERLAY ──
  if (importing !== null) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setImporting(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-xl font-extrabold">Import contenu — {importing.name}</h1>
        </div>
        <ArtistImporter artist={importing} onClose={() => setImporting(null)} />
      </div>
    );
  }

  // ── FORM ──
  if (editing !== null) {
    return (
      <div className="max-w-2xl space-y-6 pb-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-xl font-extrabold">
            {editing === 'new' ? 'Ajouter un artiste' : `Modifier — ${form.name}`}
          </h1>
        </div>

        <div className="space-y-6">
          {/* ── Identité ── */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Identité</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Nom *</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nom de l'artiste" />
              </div>
              <div>
                <Label className="mb-1.5 block">Genre musical</Label>
                <Input value={form.genre} onChange={e => set('genre', e.target.value)} placeholder="Afrobeat, Hip-Hop..." />
              </div>
              <div>
                <Label className="mb-1.5 block">Label</Label>
                <Input value={form.label || ''} onChange={e => set('label', e.target.value)} placeholder="Nom du label" />
              </div>
              <div>
                <Label className="mb-1.5 block">Actif depuis</Label>
                <Input value={form.active_since || ''} onChange={e => set('active_since', e.target.value)} placeholder="2018" />
              </div>
            </div>
          </div>

          {/* ── Naissance ── */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Informations personnelles</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Date de naissance</Label>
                <Input type="date" value={form.birth_date || ''} onChange={e => set('birth_date', e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Lieu de naissance</Label>
                <Input value={form.birth_place || ''} onChange={e => set('birth_place', e.target.value)} placeholder="Abidjan, Côte d'Ivoire" />
              </div>
              <div>
                <Label className="mb-1.5 block">Nationalité</Label>
                <Input value={form.nationality || ''} onChange={e => set('nationality', e.target.value)} placeholder="Ivoirien(ne)" />
              </div>
            </div>
          </div>

          {/* ── Groupe ── */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Groupe & Collaborations</p>
            <div>
              <Label className="mb-1.5 block">Membres du groupe</Label>
              <TagInput value={form.group_members || []} onChange={v => set('group_members', v)} placeholder="Ajouter un membre..." />
            </div>
            <div>
              <Label className="mb-1.5 block">Artistes associés</Label>
              <TagInput value={form.associated_acts || []} onChange={v => set('associated_acts', v)} placeholder="Ajouter un artiste associé..." />
            </div>
          </div>

          {/* ── Biographie ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Biographie</p>
            <Textarea value={form.biography} onChange={e => set('biography', e.target.value)} rows={5} placeholder="Biographie de l'artiste..." />
          </div>

          {/* ── Photos ── */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Photos</p>
            <WatermarkUploader label="Photo principale" value={form.photo_url} onChange={(url) => set('photo_url', url)} multiple={false} />
            <WatermarkUploader label="Galerie de photos" value={form.gallery} onChange={(urls) => set('gallery', urls)} multiple={true} />
          </div>

          {/* ── Liens streaming ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Liens streaming</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'spotify_url', label: 'Spotify' },
                { key: 'youtube_url', label: 'YouTube' },
                { key: 'apple_music_url', label: 'Apple Music' },
                { key: 'audiomack_url', label: 'Audiomack' },
                { key: 'deezer_url', label: 'Deezer' },
                { key: 'soundcloud_url', label: 'SoundCloud' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-xs mb-1 block">{label}</Label>
                  <Input type="url" value={form[key] || ''} onChange={e => set(key, e.target.value)} placeholder="https://..." className="text-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Réseaux sociaux ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Réseaux sociaux</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Instagram — URL</Label>
                <Input type="url" value={form.instagram_url || ''} onChange={e => set('instagram_url', e.target.value)} placeholder="https://instagram.com/..." className="text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Instagram — @username</Label>
                <Input value={form.instagram_username || ''} onChange={e => set('instagram_username', e.target.value)} placeholder="username (sans @)" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">TikTok — URL</Label>
                <Input type="url" value={form.tiktok_url || ''} onChange={e => set('tiktok_url', e.target.value)} placeholder="https://tiktok.com/@..." className="text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">TikTok — @username</Label>
                <Input value={form.tiktok_username || ''} onChange={e => set('tiktok_username', e.target.value)} placeholder="username (sans @)" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Facebook</Label>
                <Input type="url" value={form.facebook_url || ''} onChange={e => set('facebook_url', e.target.value)} placeholder="https://facebook.com/..." className="text-sm" />
              </div>
            </div>
          </div>

          {/* ── Liens web ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Liens web</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Wikipedia</Label>
                <Input type="url" value={form.wikipedia_url || ''} onChange={e => set('wikipedia_url', e.target.value)} placeholder="https://fr.wikipedia.org/wiki/..." className="text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Site officiel</Label>
                <Input type="url" value={form.website_url || ''} onChange={e => set('website_url', e.target.value)} placeholder="https://..." className="text-sm" />
              </div>
            </div>
          </div>

          {/* ── Paiement ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Informations de paiement</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Numéro Wave</Label>
                <Input value={form.wave_number || ''} onChange={e => set('wave_number', e.target.value)} placeholder="76 123 45 67" className="text-sm font-mono" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Téléphone (Orange Money / virement)</Label>
                <Input value={form.payout_phone || ''} onChange={e => set('payout_phone', e.target.value)} placeholder="77 000 00 00" className="text-sm font-mono" />
              </div>
            </div>
          </div>

          {/* ── Paramètres ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block text-sm">Ordre d'affichage</Label>
              <Input type="number" value={form.order || 0} onChange={e => set('order', parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch checked={!!form.is_featured} onCheckedChange={v => set('is_featured', v)} />
              <Label>Mis en avant (accueil)</Label>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch checked={!!form.is_verified} onCheckedChange={v => set('is_verified', v)} />
              <Label className="flex items-center gap-1.5">Certifié <VerifiedBadge size={14} /></Label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={!form.name || createMutation.isPending || updateMutation.isPending}
            className="bg-primary hover:bg-primary/80"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : editing === 'new' ? "Ajouter l'artiste" : 'Enregistrer'}
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
                {artist.gallery?.length > 0 && (
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                    +{artist.gallery.length} photo{artist.gallery.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-sm flex items-center gap-1">
                    {artist.name}
                    {artist.is_verified && <VerifiedBadge size={14} />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {artist.genre || 'Genre non défini'}
                    {artist.label ? ` · ${artist.label}` : ''}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={artist.is_verified ? 'Retirer la certification' : 'Certifier (badge bleu)'}
                    onClick={() => updateMutation.mutate({ id: artist.id, data: { is_verified: !artist.is_verified } })}
                  >
                    <ShieldCheck size={14} className={artist.is_verified ? 'text-primary' : 'text-muted-foreground'} />
                  </Button>
                  <Button variant="ghost" size="icon" title="Importer Spotify/YouTube/Wikipedia" onClick={() => setImporting(artist)}>
                    <Download size={14} className="text-primary" />
                  </Button>
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