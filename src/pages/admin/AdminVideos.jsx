import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, ArrowLeft, Play, Youtube, Music2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { mediaSyncSchedulerService } from '@/services/mediaSyncSchedulerService';
import TikTokPublishButton from '../../components/admin/TikTokPublishButton';
import WatermarkUploader from '../../components/admin/WatermarkUploader';
import QuickCatalogImporterModal from '../../components/admin/QuickCatalogImporterModal';

const VIDEO_TYPES = [
  { value: 'clip_officiel', label: 'Clip officiel' },
  { value: 'teaser', label: 'Teaser' },
  { value: 'interview', label: 'Interview' },
  { value: 'making_of', label: 'Making-of' },
];

const EMPTY = {
  title: '', artist_name: '', youtube_url: '',
  thumbnail_url: '', video_type: 'clip_officiel',
  description: '', publish_date: new Date().toISOString().split('T')[0],
  is_featured: false,
  is_for_sale: false, price: 0, protected_file_uri: '',
  linked_release_id: '',
};

function getYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/);
  return match ? match[1] : null;
}

export default function AdminVideos() {
  const [editing, setEditing] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: () => base44.entities.Video.list('-created_date'),
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['admin-releases-for-video-link'],
    queryFn: () => base44.entities.Release.list('-created_date', 300),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.Video.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-videos'] }); setEditing(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Video.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-videos'] }); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Video.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin-videos'] });
      const prev = queryClient.getQueryData(['admin-videos']);
      queryClient.setQueryData(['admin-videos'], (old = []) => old.filter(v => v.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => queryClient.setQueryData(['admin-videos'], ctx.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-videos'] }),
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const uploadPrivate = async (file) => {
    const res = await base44.integrations.Core.UploadPrivateFile({ file });
    set('protected_file_uri', res.file_uri);
  };

  const openNew = () => { setForm(EMPTY); setEditing('new'); };
  const openEdit = (v) => { setForm({ ...EMPTY, ...v }); setEditing(v); };

  const handleSave = async () => {
    // Auto-générer thumbnail depuis YouTube si pas de thumbnail custom
    const savedForm = { ...form };
    if (!savedForm.thumbnail_url && savedForm.youtube_url) {
      const ytId = getYoutubeId(savedForm.youtube_url);
      if (ytId) savedForm.thumbnail_url = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }
    let savedVideoId = editing !== 'new' ? editing?.id : null;
    if (editing !== 'new' && editing?.id) {
      await updateMutation.mutateAsync({ id: editing.id, data: savedForm });
    } else {
      const created = await createMutation.mutateAsync(savedForm);
      savedVideoId = created?.id;
    }

    if (savedForm.linked_release_id && savedVideoId) {
      try {
        await base44.entities.Release.update(savedForm.linked_release_id, {
          linked_video_id: savedVideoId,
        });
      } catch (err) {
        console.warn('Erreur liaison automatique chanson:', err);
      }
    }
  };

  const ytPreviewId = getYoutubeId(form.youtube_url);

  // ── FORM ──
  if (editing !== null) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-xl font-extrabold">
            {editing === 'new' ? 'Publier une vidéo' : 'Modifier la vidéo'}
          </h1>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Titre *</Label>
              <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titre de la vidéo" />
            </div>
            <div>
              <Label className="mb-1.5 block">Artiste</Label>
              <Input value={form.artist_name} onChange={e => set('artist_name', e.target.value)} placeholder="Nom de l'artiste" />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Lien YouTube *</Label>
            <Input
              type="url"
              value={form.youtube_url}
              onChange={e => set('youtube_url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {/* Prévisualisation YouTube */}
          {ytPreviewId && (
            <div className="aspect-video rounded-xl overflow-hidden bg-secondary">
              <iframe
                src={`https://www.youtube.com/embed/${ytPreviewId}`}
                className="w-full h-full"
                allowFullScreen
                title="Prévisualisation"
              />
            </div>
          )}

          {/* Miniature custom avec watermark */}
          <WatermarkUploader
            label="Miniature personnalisée (avec logo KKD)"
            value={form.thumbnail_url}
            onChange={(url) => set('thumbnail_url', url)}
            multiple={false}
          />
          <p className="text-xs text-muted-foreground -mt-2">Si laissé vide, la miniature YouTube sera utilisée automatiquement.</p>

          {/* Chanson / Œuvre musicale synchronisée */}
          <div>
            <Label className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-xs">
                <Music2 size={13} className="text-primary" />
                Chanson synchronisée (Lien direct)
              </span>
              {form.linked_release_id && (
                <button
                  type="button"
                  onClick={() => set('linked_release_id', '')}
                  className="text-[11px] text-muted-foreground hover:text-destructive underline"
                >
                  Dissocier
                </button>
              )}
            </Label>
            <Select
              value={form.linked_release_id || 'none'}
              onValueChange={v => set('linked_release_id', v === 'none' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la chanson correspondante" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">-- Aucune chanson liée --</SelectItem>
                {releases
                  .filter(r => !form.artist_name || (r.artist_name && (r.artist_name.toLowerCase().includes(form.artist_name.toLowerCase()) || form.artist_name.toLowerCase().includes(r.artist_name.toLowerCase()))))
                  .map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title} ({r.artist_name})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Permet aux auditeurs de basculer instantanément entre le clip vidéo et la chanson.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Type de vidéo</Label>
              <Select value={form.video_type} onValueChange={v => set('video_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VIDEO_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Date de publication</Label>
              <Input type="date" value={form.publish_date || ''} onChange={e => set('publish_date', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Description</Label>
            <Textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3} />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={!!form.is_featured} onCheckedChange={v => set('is_featured', v)} />
            <Label>Mise en avant (page d'accueil)</Label>
          </div>

          {/* Vente (avant disponibilité officielle) */}
          <div className="border-t border-border/40 pt-4 mt-4 space-y-4">
            <p className="font-display font-bold text-sm">Vente sur KKD</p>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.is_for_sale} onCheckedChange={v => set('is_for_sale', v)} />
              <Label>Mettre en vente (clip privé)</Label>
            </div>
            <div>
              <Label className="mb-1.5 block">Prix (FCFA)</Label>
              <Input type="number" step="1" value={form.price || ''} onChange={e => set('price', parseInt(e.target.value) || 0)} placeholder="0 = non vendu" />
            </div>
            <div>
              <Label className="mb-1.5 block">Fichier vendu (clip privé)</Label>
              {form.protected_file_uri && (
                <video src={form.protected_file_uri} controls className="w-full max-h-40 rounded-lg bg-black mb-2" />
              )}
              <Input type="file" accept="video/*,audio/*" onChange={e => { if (e.target.files[0]) uploadPrivate(e.target.files[0]); }} />
              <p className="text-xs text-muted-foreground mt-1">Stockage privé — accessible uniquement après achat.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={!form.title || !form.youtube_url || createMutation.isPending || updateMutation.isPending}
            className="bg-primary hover:bg-primary/80"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : editing === 'new' ? 'Publier la vidéo' : 'Enregistrer'}
          </Button>
          <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
        </div>
      </div>
    );
  }

  // ── LIST ──
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl font-extrabold">Vidéos</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={async () => {
              setIsSyncing(true);
              const res = await mediaSyncSchedulerService.syncClipsAndSongs();
              setIsSyncing(false);
              toast({
                title: 'Synchronisation effectuée',
                description: res.message,
              });
              queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
              queryClient.invalidateQueries({ queryKey: ['admin-releases-for-video-link'] });
            }}
            variant="outline"
            disabled={isSyncing}
            className="border-border text-foreground hover:bg-muted gap-1.5 font-medium text-xs sm:text-sm"
            title="Lier automatiquement chaque chanson à son clip (programmée quotidiennement à 14h)"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin text-primary' : ''} />
            <span>{isSyncing ? 'Synchronisation...' : 'Synchro clips & chansons'}</span>
          </Button>
          <Button
            onClick={() => setShowImporter(true)}
            variant="outline"
            className="border-primary/40 text-primary hover:bg-primary/10 gap-1.5 font-bold text-xs sm:text-sm"
          >
            <Youtube size={16} className="text-red-500" /> Importer clips YouTube
          </Button>
          <Button onClick={openNew} className="bg-primary hover:bg-primary/80 text-xs sm:text-sm">
            <Plus size={16} className="mr-1" /> Publier une vidéo
          </Button>
        </div>
      </div>

      <QuickCatalogImporterModal
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        initialMode="search"
        onSuccess={() => {
          setShowImporter(false);
          queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
        }}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="aspect-video bg-card rounded-xl animate-pulse" />)}
        </div>
      ) : videos.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucune vidéo publiée.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => {
            const ytId = getYoutubeId(video.youtube_url);
            const thumb = video.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);
            return (
              <div key={video.id} className="bg-card border border-border/50 rounded-xl overflow-hidden group">
                <div className="aspect-video relative bg-secondary">
                  {thumb ? (
                    <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={32} className="text-primary/30" />
                    </div>
                  )}
                  {video.is_featured && (
                    <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Vedette</span>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-sm truncate">{video.title}</p>
                    <p className="text-xs text-muted-foreground">{video.artist_name} • {VIDEO_TYPES.find(t => t.value === video.video_type)?.label}</p>
                    {video.linked_release_id && (
                      <p className="text-[10px] font-mono text-primary flex items-center gap-1 mt-1 font-semibold">
                        <Music2 size={11} />
                        <span>Chanson liée</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <TikTokPublishButton item={video} type="video" />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(video)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Supprimer cette vidéo ?')) deleteMutation.mutate(video.id); }}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}