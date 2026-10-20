import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Check, X, Ticket, HelpCircle, CalendarDays, ShieldCheck, MapPin, TrendingUp } from 'lucide-react';
import TikTokPublishButton from '../../components/admin/TikTokPublishButton';
import EntityForm from '../../components/admin/EntityForm';
import EventReleaseLinker from '../../components/admin/EventReleaseLinker';
import BatchTicketGenerator from '@/components/events/BatchTicketGenerator';
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
    { value: 'emerald', label: 'Emerald NIA (Vert/Noir)' },
    { value: 'royal', label: 'Royal (Violet/Noir)' },
    { value: 'ocean', label: 'Ocean (Bleu/Noir)' },
    { value: 'midnight', label: 'Midnight (Graphite/Noir)' },
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

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    retry: false,
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
        {editing !== 'new' && editing.id && (
          <div className="mt-6">
            <BatchTicketGenerator event={editing} user={me} />
          </div>
        )}
      </div>
    );
  }

  const pendingCount = events.filter((event) => ['en_attente', 'clarification_demandee'].includes(event.published_status)).length;
  const upcomingCount = events.filter((event) => event.event_date && new Date(event.event_date) >= new Date()).length;
  const ticketedCount = events.filter((event) => event.is_ticketed).length;
  const capacityTotal = events.reduce((sum, event) => sum + Number(event.ticket_capacity || 0), 0);

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5 sm:p-7">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary mb-3">
            <ShieldCheck size={13} /> Gestion sécurisée des événements
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Événements & billetterie</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">Validez les organisateurs, configurez les billets et suivez les événements depuis un seul espace.</p>
        </div>
        <Button onClick={() => setEditing('new')} className="bg-primary hover:bg-primary/90 h-11 px-5 shadow-sm shrink-0">
          <Plus size={16} className="mr-2" /> Créer un événement
        </Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Événements au total', value: events.length, icon: CalendarDays, note: 'Tous les statuts', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'À examiner', value: pendingCount, icon: ShieldCheck, note: 'Validation KKD requise', color: 'text-amber-600', bg: 'bg-amber-500/10' },
          { label: 'Dates à venir', value: upcomingCount, icon: TrendingUp, note: 'Événements futurs', color: 'text-sky-600', bg: 'bg-sky-500/10' },
          { label: 'Avec billetterie', value: ticketedCount, icon: Ticket, note: capacityTotal ? `${capacityTotal.toLocaleString('fr-FR')} places configurées` : 'Capacité à configurer', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
        ].map((stat) => {
          const Icon = stat.icon;
          return <div key={stat.label} className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{stat.label}</span><span className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}><Icon size={17} /></span></div>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-3">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{stat.note}</p>
          </div>;
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-bold text-base">Tous les événements</h2><p className="text-xs text-muted-foreground mt-0.5">Affiches, statuts, organisateurs et actions rapides</p></div>
        <span className="text-xs font-semibold rounded-full border border-border bg-secondary/50 px-3 py-1.5">{events.length} événement{events.length !== 1 ? 's' : ''}</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucun événement. Cliquez sur "Ajouter".</p>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
          {events.map((event) => (
            <div key={event.id} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-card border border-border/60 rounded-2xl p-4 sm:p-5 hover:border-primary/30 hover:shadow-sm transition-all">
              {event.image_url ? <img src={event.image_url} alt="" className="w-full sm:w-24 h-28 sm:h-20 rounded-xl object-cover border border-border/50 shrink-0" /> : <div className="w-full sm:w-24 h-28 sm:h-20 rounded-xl bg-primary/5 border border-border/50 flex items-center justify-center shrink-0"><CalendarDays size={24} className="text-primary/60" /></div>}
              <div className="flex-shrink-0 w-14 text-center rounded-xl bg-secondary/60 py-2">
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
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <MapPin size={12} className="shrink-0" /> {[event.location, event.city].filter(Boolean).join(' · ') || 'Lieu à confirmer'}{event.organizer_email ? ` · ${event.organizer_email}` : ''}
                  {!event.artist_id && <span className="ml-2 text-[10px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded-full">Artiste non lié</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-wrap sm:justify-end border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0">
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