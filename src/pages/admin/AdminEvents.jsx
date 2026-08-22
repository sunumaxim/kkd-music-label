import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Check, X, Ticket, HelpCircle } from 'lucide-react';
import TikTokPublishButton from '../../components/admin/TikTokPublishButton';
import EntityForm from '../../components/admin/EntityForm';
import EventReleaseLinker from '../../components/admin/EventReleaseLinker';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

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
  { key: 'artist_id', label: 'Artiste lié (catalogue) *', type: 'artist', required: true },
  { key: 'location', label: 'Lieu', type: 'text', placeholder: 'Ex: Salle Pleyel' },
  { key: 'city', label: 'Ville', type: 'text', placeholder: 'Ex: Paris' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'ticket_url', label: 'Lien billetterie', type: 'url', placeholder: 'https://...' },
  { key: 'stream_url', label: 'Lien Live Stream', type: 'url', placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'is_ticketed', label: 'Vente de billets KKD', type: 'boolean', placeholder: 'Activer la billetterie en ligne' },
  { key: 'ticket_price', label: 'Prix billet (FCFA)', type: 'number' },
  { key: 'ticket_capacity', label: 'Capacité (0 = illimitée)', type: 'number' },
  { key: 'commission_pct', label: 'Commission KKD (%)', type: 'number' },
  { key: 'ticket_theme', label: 'Thème des billets', type: 'select', options: [
    { value: 'classic', label: 'Classic (Rouge/Noir)' },
    { value: 'gold', label: 'Gold (Or/Noir)' },
    { value: 'emerald', label: 'Emerald (Vert/Noir)' },
    { value: 'royal', label: 'Royal (Violet/Noir)' },
    { value: 'ocean', label: 'Ocean (Bleu/Noir)' },
  ]},
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
  const [clarifyEvent, setClarifyEvent] = useState(null);
  const [clarifyMsg, setClarifyMsg] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.update(id, { published_status: 'approuve' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
  });
  const refuseMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.update(id, { published_status: 'refuse' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
  });
  const clarifyMutation = useMutation({
    mutationFn: ({ id, message }) => base44.entities.Event.update(id, {
      published_status: 'clarification_demandee',
      admin_notes: message,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setClarifyEvent(null);
      setClarifyMsg('');
      toast({ title: 'Clarification demandée', description: 'L\'organisateur a été notifié.' });
    },
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
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-heading font-bold text-sm truncate">{event.title}</p>
                  {event.published_status === 'en_attente' && <span className="text-[10px] bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full">En attente</span>}
                  {event.published_status === 'refuse' && <span className="text-[10px] bg-red-500/15 text-red-500 px-2 py-0.5 rounded-full">Refusé</span>}
                  {event.published_status === 'clarification_demandee' && <span className="text-[10px] bg-blue-500/15 text-blue-500 px-2 py-0.5 rounded-full">Clarification demandée</span>}
                  {event.is_ticketed && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1"><Ticket size={9} /> {Number(event.ticket_price || 0).toLocaleString('fr-FR')} F</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {event.event_type} • {event.location} {event.city}{event.organizer_email ? ` • ${event.organizer_email}` : ''}
                  {!event.artist_id && <span className="ml-2 text-[10px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded-full">Artiste non lié</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {event.published_status === 'en_attente' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate(event.id)} className="text-emerald-600 hover:text-emerald-700 text-xs gap-1"><Check size={13} /> Approuver</Button>
                    <Button variant="ghost" size="sm" onClick={() => refuseMutation.mutate(event.id)} className="text-destructive text-xs gap-1"><X size={13} /> Refuser</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setClarifyEvent(event); setClarifyMsg(event.admin_notes || ''); }} className="text-blue-600 hover:text-blue-700 text-xs gap-1"><HelpCircle size={13} /> Clarifier</Button>
                  </>
                )}
                {event.published_status === 'clarification_demandee' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate(event.id)} className="text-emerald-600 hover:text-emerald-700 text-xs gap-1"><Check size={13} /> Approuver</Button>
                    <Button variant="ghost" size="sm" onClick={() => refuseMutation.mutate(event.id)} className="text-destructive text-xs gap-1"><X size={13} /> Refuser</Button>
                  </>
                )}
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

      {/* Dialog : demander clarification */}
      <Dialog open={!!clarifyEvent} onOpenChange={(open) => { if (!open) { setClarifyEvent(null); setClarifyMsg(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle size={18} className="text-blue-600" />
              Demander des précisions
            </DialogTitle>
            <DialogDescription>
              {clarifyEvent?.title && `"${clarifyEvent.title}"`} — L'organisateur recevra votre message par email et notification.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={clarifyMsg}
            onChange={(e) => setClarifyMsg(e.target.value)}
            placeholder="Ex : Merci de préciser l'heure exacte, le lieu détaillé, et ajouter une affiche en bonne qualité..."
            rows={5}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setClarifyEvent(null); setClarifyMsg(''); }}>Annuler</Button>
            <Button
              onClick={() => clarifyMutation.mutate({ id: clarifyEvent.id, message: clarifyMsg })}
              disabled={!clarifyMsg.trim() || clarifyMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {clarifyMutation.isPending ? 'Envoi...' : 'Demander clarification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}