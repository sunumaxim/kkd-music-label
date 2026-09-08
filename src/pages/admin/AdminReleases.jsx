import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import EntityForm from '../../components/admin/EntityForm';
import TikTokPublishButton from '../../components/admin/TikTokPublishButton';

const FIELDS = [
  { key: 'title', label: 'Titre', type: 'text', required: true },
  { key: 'artist_id', label: 'Artiste (catalogue) *', type: 'artist', required: true },
  { key: 'cover_url', label: 'Pochette', type: 'file' },
  { key: 'release_type', label: 'Type', type: 'select', options: [
    { value: 'single', label: 'Single' },
    { value: 'album', label: 'Album' },
    { value: 'ep', label: 'EP' },
    { value: 'projet_special', label: 'Projet spécial' },
  ]},
  { key: 'release_date', label: 'Date de sortie', type: 'date' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'lyrics', label: 'Paroles', type: 'textarea' },
  { key: 'spotify_url', label: 'Lien Spotify', type: 'url', placeholder: 'https://open.spotify.com/...' },
  { key: 'youtube_url', label: 'Lien YouTube', type: 'url', placeholder: 'https://youtube.com/...' },
  { key: 'apple_music_url', label: 'Lien Apple Music', type: 'url', placeholder: 'https://music.apple.com/...' },
  { key: 'audiomack_url', label: 'Lien Audiomack', type: 'url', placeholder: 'https://audiomack.com/...' },
  { key: 'deezer_url', label: 'Lien Deezer', type: 'url', placeholder: 'https://deezer.com/...' },
  { key: 'audio_file_url', label: 'Fichier audio (lecture gratuite KKD)', type: 'audiofile', placeholder: "Audio écoutable directement sur KKD (single / piste unique). Pour un album multi-pistes, préférez la publication partenaire." },
  { key: 'is_featured', label: 'Mise en avant', type: 'boolean', placeholder: 'Afficher sur la page d\'accueil' },
  { key: 'is_for_sale', label: 'Mettre en vente', type: 'boolean', placeholder: 'Vendre avant disponibilité officielle' },
  { key: 'price', label: 'Prix (FCFA)', type: 'number', placeholder: '0 = non vendu' },
  { key: 'protected_file_uri', label: 'Fichier vendu (audio)', type: 'privatefile', placeholder: 'Fichier audio privé vendu après achat', isVideo: false },
  { key: 'preview_start', label: 'Début extrait (secondes)', type: 'number', placeholder: '0' },
  { key: 'preview_duration', label: 'Durée extrait gratuit', type: 'select', options: [
    { value: 25, label: '25 secondes' },
    { value: 30, label: '30 secondes' },
  ]},
];

export default function AdminReleases() {
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: releases, isLoading } = useQuery({
    queryKey: ['admin-releases'],
    queryFn: () => base44.entities.Release.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Release.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-releases'] }); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Release.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-releases'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Release.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin-releases'] });
      const prev = queryClient.getQueryData(['admin-releases']);
      queryClient.setQueryData(['admin-releases'], (old = []) => old.filter(r => r.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => queryClient.setQueryData(['admin-releases'], ctx.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-releases'] }),
  });

  const handleSave = async (data) => {
    if (editing && editing !== 'new' && editing.id) {
      await updateMutation.mutateAsync({ id: editing.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (editing) {
    return (
      <EntityForm
        title={editing === 'new' ? 'Publier une sortie musicale' : 'Modifier la sortie'}
        fields={FIELDS}
        initialData={editing === 'new' ? {} : editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-extrabold">Sorties musicales</h1>
        <Button onClick={() => setEditing('new')} className="bg-primary hover:bg-primary/80">
          <Plus size={16} className="mr-1" /> Publier
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : releases.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucune sortie. Cliquez sur "Publier" pour commencer.</p>
      ) : (
        <div className="space-y-2">
          {releases.map((release) => (
            <div key={release.id} className="flex items-center gap-4 bg-card border border-border/50 rounded-lg p-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                {release.cover_url ? (
                  <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary">♪</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm truncate">{release.title}</p>
                <p className="text-xs text-muted-foreground">
                  {release.artist_name} • {release.release_type}
                  {!release.artist_id && <span className="ml-2 text-[10px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded-full">Artiste non lié</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <TikTokPublishButton item={release} type="release" />
                <Button variant="ghost" size="icon" onClick={() => setEditing(release)}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm('Supprimer cette sortie ?')) deleteMutation.mutate(release.id);
                }}>
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}