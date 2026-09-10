import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { WAVE_PAY_LINK } from '@/lib/wave';
import { Loader2, Upload, Calendar, Ticket, Plus } from 'lucide-react';
import TicketThemePicker from '@/components/events/TicketThemePicker';

const TYPES = [
  { value: 'concert', label: 'Concert' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'festival', label: 'Festival' },
  { value: 'rencontre', label: 'Rencontre artistique' },
];

export default function PublishEventForm({ user, onClose }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '', event_type: 'concert', event_date: '', location: '', city: '',
    description: '', image_url: '', stream_url: '', ticket_url: '',
    is_ticketed: false, ticket_price: 0, ticket_capacity: 0, managersText: '',
    artist_id: '', artist_name: '', ticket_theme: 'classic',
  });

  const { data: artists = [] } = useQuery({
    queryKey: ['artists-all'],
    queryFn: () => base44.entities.Artist.list('name', 200),
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      set('image_url', res.file_url);
    } finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date || !form.artist_id) {
      toast({ title: 'Titre, date et artiste lié requis', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const managers = form.managersText
        .split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
      await base44.entities.Event.create({
        title: form.title,
        event_type: form.event_type,
        event_date: new Date(form.event_date).toISOString(),
        location: form.location,
        city: form.city,
        description: form.description,
        image_url: form.image_url,
        stream_url: form.stream_url,
        ticket_url: form.ticket_url,
        is_ticketed: !!form.is_ticketed,
        ticket_price: Number(form.ticket_price) || 0,
        ticket_capacity: Number(form.ticket_capacity) || 0,
        ticket_theme: form.ticket_theme || 'classic',
        managers,
        artist_id: form.artist_id || '',
        artist_name: form.artist_name || '',
        organizer_email: user.email,
        organizer_name: user.full_name || user.email,
        published_status: 'en_attente',
        commission_pct: 10,
      });
      toast({ title: 'Événement soumis', description: 'En attente de validation KKD.' });
      onClose();
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-border/50 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
            <Calendar size={18} className="text-primary" /> Publier un événement
          </h2>
          <p className="text-xs text-muted-foreground">Soumis à validation KKD avant publication.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Fermer</Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Titre *</Label>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <select value={form.event_type} onChange={(e) => set('event_type', e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Date & heure *</Label>
          <Input type="datetime-local" value={form.event_date} onChange={(e) => set('event_date', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Lieu</Label>
          <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Ex: Théâtre National" />
        </div>
        <div className="space-y-1.5">
          <Label>Ville</Label>
          <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Artiste lié *</Label>
          <select
            value={form.artist_id}
            onChange={(e) => {
              const a = artists.find((x) => x.id === e.target.value);
              set('artist_id', e.target.value);
              set('artist_name', a?.name || '');
            }}
            required
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">— Sélectionner un artiste —</option>
            {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <p className="text-[11px] text-muted-foreground">L'événement doit être lié à un artiste du catalogue.</p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Description</Label>
          <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Affiche / Image</Label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs">
              <Upload size={14} /> {uploading ? 'Envoi…' : form.image_url ? 'Image ✓' : 'Téléverser'}
              <input type="file" className="hidden" onChange={handleImage} accept="image/*" />
            </label>
            {form.image_url && <img src={form.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Lien live (YouTube)</Label>
          <Input value={form.stream_url} onChange={(e) => set('stream_url', e.target.value)} placeholder="https://youtube.com/…" />
        </div>
        <div className="space-y-1.5">
          <Label>Lien billetterie externe (option)</Label>
          <Input value={form.ticket_url} onChange={(e) => set('ticket_url', e.target.value)} placeholder="https://…" />
        </div>
      </div>

      {/* Billetterie KKD */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_ticketed} onChange={(e) => set('is_ticketed', e.target.checked)} className="w-4 h-4 accent-primary" />
          <span className="font-heading font-bold text-sm flex items-center gap-2"><Ticket size={15} className="text-primary" /> Vendre les billets en ligne via Wave</span>
        </label>
        {form.is_ticketed && (
          <div className="grid sm:grid-cols-2 gap-3 pl-7">
            <div className="space-y-1.5">
              <Label>Prix du billet (FCFA)</Label>
              <Input type="number" min="0" value={form.ticket_price} onChange={(e) => set('ticket_price', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Capacité (0 = illimitée)</Label>
              <Input type="number" min="0" value={form.ticket_capacity} onChange={(e) => set('ticket_capacity', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Gestionnaires d'accès (emails, séparés par virgule)</Label>
              <Textarea rows={2} value={form.managersText} onChange={(e) => set('managersText', e.target.value)} placeholder="entree1@email.com, entree2@email.com" />
              <p className="text-[11px] text-muted-foreground">Ces personnes pourront scanner / rechercher les billets le jour J.</p>
            </div>
            <div className="sm:col-span-2">
              <TicketThemePicker value={form.ticket_theme} onChange={(v) => set('ticket_theme', v)} />
            </div>
            <p className="text-[11px] text-muted-foreground sm:col-span-2">
              Commission KKD : 10 % des ventes. Paiement via Wave ({WAVE_PAY_LINK}).
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="submit" disabled={submitting} className="bg-primary gap-2">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Soumettre l'événement
        </Button>
      </div>
    </form>
  );
}