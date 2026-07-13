import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import TikTokPublishButton from '../../components/admin/TikTokPublishButton';
import EntityForm from '../../components/admin/EntityForm';
import EventReleaseLinker from '../../components/admin/EventReleaseLinker';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const FIELDS = [
  { key: 'title', label: 'Titre', type: 'text', required: true },
  { key: 'image_url', label: 'Image', type: 'file' },
  { key: 'event_type', label: 'Type', type: 'select', options: [
    { value: 'concert', label: 'Concert' },
    { value: 'showcase', label: 'Showcase' },
    { value: 'festival', label: 'Festival' },
    { value: 'rencontre', label: 'Rencontre artistique' },
  ]},
  { key: 'event_date', label: 'Date et heure', type: 'datetime' },
  { key: 'location', label: 'Lieu', type: 'text', placeholder: 'Ex: Salle Pleyel' },
  { key: 'city', label: 'Ville', type: 'text', placeholder: 'Ex: Paris' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'ticket_url', label: 'Lien billetterie', type: 'url', placeholder: 'https://...' },
  { key: 'stream_url', label: 'Lien Live Stream', type: 'url', placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'is_featured', label: 'Mise en avant', type: 'boolean', placeholder: 'Afficher en page d\'accueil' },
];

function EventFormWrapper({ editing, onSave, onCancel }) {
  const [isDirty, setIsDirty] = useState(false);

  // Block sidebar navigation only when there are real unsaved changes
  useUnsavedGuard(isDirty);

  const handleCancel = () => {
    if (isDirty && !window.confirm('Modifications non enregistrées. Quitter quand même ?')) return;
    onCancel();
  };

  return (
    <EntityForm
      title={editing === 'new' ? 'Ajouter un événement' : "Modifier l'événement"}
      fields={FIELDS}
      initialData={editing === 'new' ? {} : editing}
      onSave={(data) => { setIsDirty(false); return onSave(data); }}
      onCancel={handleCancel}
      onDirtyChange={setIsDirty}
    />
  );
}

export default function AdminEvents() {
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => base44.entities.Event.list('-event_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-events'] }); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-events'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
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
        <EventFormWrapper editing={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
        {editing !== 'new' && editing.id && (
          <div className="mt-6">
            <EventReleaseLinker eventId={editing.id} linkedIds={editing.linked_release_ids || []} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-extrabold">Événements</h1>
        <Button onClick={() => setEditing('new')} className="bg-primary hover:bg-primary/80">
          <Plus size={16} className="mr-1" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucun événement. Cliquez sur "Ajouter".</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="flex items-center gap-4 bg-card border border-border/50 rounded-lg p-4">
              <div className="flex-shrink-0 w-14 text-center">
                {event.event_date && (
                  <>
                    <p className="font-display text-lg font-extrabold text-primary leading-none">
                      {format(new Date(event.event_date), 'dd')}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">
                      {format(new Date(event.event_date), 'MMM', { locale: fr })}
                    </p>
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.event_type} • {event.location} {event.city}</p>
              </div>
              <div className="flex items-center gap-1">
                <TikTokPublishButton item={event} type="event" />
                <Button variant="ghost" size="icon" onClick={() => setEditing(event)}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm('Supprimer cet événement ?')) deleteMutation.mutate(event.id);
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