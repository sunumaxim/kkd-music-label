import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import EntityForm from '../../components/admin/EntityForm';

const FIELDS = [
  { key: 'title', label: 'Titre', type: 'text', required: true },
  { key: 'artist_name', label: 'Artiste', type: 'text' },
  { key: 'youtube_url', label: 'Lien YouTube', type: 'url', required: true, placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'video_type', label: 'Type', type: 'select', options: [
    { value: 'clip_officiel', label: 'Clip officiel' },
    { value: 'teaser', label: 'Teaser' },
    { value: 'interview', label: 'Interview' },
    { value: 'making_of', label: 'Making-of' },
  ]},
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'publish_date', label: 'Date de publication', type: 'date' },
  { key: 'is_featured', label: 'Mise en avant', type: 'boolean', placeholder: 'Afficher en page d\'accueil' },
];

export default function AdminVideos() {
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: videos, isLoading } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: () => base44.entities.Video.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Video.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-videos'] }); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Video.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-videos'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Video.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-videos'] }),
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
        title={editing === 'new' ? 'Publier une vidéo' : 'Modifier la vidéo'}
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
        <h1 className="font-display text-2xl font-extrabold">Vidéos</h1>
        <Button onClick={() => setEditing('new')} className="bg-primary hover:bg-primary/80">
          <Plus size={16} className="mr-1" /> Publier
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : videos.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucune vidéo. Cliquez sur "Publier".</p>
      ) : (
        <div className="space-y-2">
          {videos.map((video) => (
            <div key={video.id} className="flex items-center gap-4 bg-card border border-border/50 rounded-lg p-4">
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm truncate">{video.title}</p>
                <p className="text-xs text-muted-foreground">{video.artist_name} • {video.video_type?.replace('_', ' ')}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(video)}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm('Supprimer cette vidéo ?')) deleteMutation.mutate(video.id);
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