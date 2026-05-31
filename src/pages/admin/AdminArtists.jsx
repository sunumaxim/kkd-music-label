import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import EntityForm from '../../components/admin/EntityForm';

const FIELDS = [
  { key: 'name', label: 'Nom', type: 'text', required: true },
  { key: 'photo_url', label: 'Photo', type: 'file' },
  { key: 'genre', label: 'Genre musical', type: 'text', placeholder: 'Ex: Afrobeat, Hip-Hop...' },
  { key: 'biography', label: 'Biographie', type: 'textarea', placeholder: 'Biographie de l\'artiste...' },
  { key: 'spotify_url', label: 'Spotify', type: 'url', placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'youtube_url', label: 'YouTube', type: 'url', placeholder: 'https://youtube.com/...' },
  { key: 'apple_music_url', label: 'Apple Music', type: 'url', placeholder: 'https://music.apple.com/...' },
  { key: 'audiomack_url', label: 'Audiomack', type: 'url', placeholder: 'https://audiomack.com/...' },
  { key: 'instagram_url', label: 'Instagram', type: 'url', placeholder: 'https://instagram.com/...' },
  { key: 'facebook_url', label: 'Facebook', type: 'url', placeholder: 'https://facebook.com/...' },
  { key: 'tiktok_url', label: 'TikTok', type: 'url', placeholder: 'https://tiktok.com/@...' },
  { key: 'is_featured', label: 'Mis en avant', type: 'boolean', placeholder: 'Afficher en vedette' },
  { key: 'order', label: 'Ordre d\'affichage', type: 'number' },
];

export default function AdminArtists() {
  const [editing, setEditing] = useState(null); // null=list, 'new'=new, object=edit
  const queryClient = useQueryClient();

  const { data: artists, isLoading } = useQuery({
    queryKey: ['admin-artists'],
    queryFn: () => base44.entities.Artist.list('order'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Artist.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-artists'] }); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Artist.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-artists'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Artist.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-artists'] }),
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
      <div>
        <EntityForm
          title={editing === 'new' ? 'Ajouter un artiste' : 'Modifier l\'artiste'}
          fields={FIELDS}
          initialData={editing === 'new' ? {} : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-extrabold">Artistes</h1>
        <Button onClick={() => setEditing('new')} className="bg-primary hover:bg-primary/80">
          <Plus size={16} className="mr-1" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : artists.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucun artiste. Cliquez sur "Ajouter" pour commencer.</p>
      ) : (
        <div className="space-y-2">
          {artists.map((artist) => (
            <div key={artist.id} className="flex items-center gap-4 bg-card border border-border/50 rounded-lg p-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                {artist.photo_url ? (
                  <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                    {artist.name?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm truncate">{artist.name}</p>
                <p className="text-xs text-muted-foreground">{artist.genre || 'Genre non défini'}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(artist)}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm('Supprimer cet artiste ?')) deleteMutation.mutate(artist.id);
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