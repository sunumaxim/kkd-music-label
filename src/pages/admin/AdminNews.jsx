import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import EntityForm from '../../components/admin/EntityForm';

const FIELDS = [
  { key: 'title', label: 'Titre', type: 'text', required: true },
  { key: 'image_url', label: 'Image de couverture', type: 'file' },
  { key: 'category', label: 'Catégorie', type: 'select', options: [
    { value: 'communique', label: 'Communiqué' },
    { value: 'nouveaute', label: 'Nouveauté' },
    { value: 'article', label: 'Article' },
    { value: 'info_artiste', label: 'Info artiste' },
  ]},
  { key: 'excerpt', label: 'Résumé court', type: 'textarea', placeholder: 'Résumé affiché sur les listes...' },
  { key: 'content', label: 'Contenu complet', type: 'textarea', placeholder: 'Contenu de l\'article (Markdown supporté)...' },
  { key: 'publish_date', label: 'Date de publication', type: 'date' },
  { key: 'is_published', label: 'Publié', type: 'boolean', placeholder: 'Visible sur le site' },
];

export default function AdminNews() {
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: news, isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => base44.entities.News.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.News.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-news'] }); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.News.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-news'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.News.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-news'] }),
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
        title={editing === 'new' ? 'Publier une actualité' : 'Modifier l\'actualité'}
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
        <h1 className="font-display text-2xl font-extrabold">Actualités</h1>
        <Button onClick={() => setEditing('new')} className="bg-primary hover:bg-primary/80">
          <Plus size={16} className="mr-1" /> Publier
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : news.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucune actualité. Cliquez sur "Publier".</p>
      ) : (
        <div className="space-y-2">
          {news.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-card border border-border/50 rounded-lg p-4">
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.category?.replace('_', ' ')} • {item.is_published ? 'Publié' : 'Brouillon'}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(item)}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm('Supprimer cette actualité ?')) deleteMutation.mutate(item.id);
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