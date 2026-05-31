import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, UserPlus, Building2, Calendar, AlertCircle } from 'lucide-react';

const statusColors = {
  invite: 'bg-yellow-500/10 text-yellow-400',
  actif: 'bg-green-500/10 text-green-400',
  expire: 'bg-muted text-muted-foreground',
  resilie: 'bg-red-500/10 text-red-400',
};

const statusLabels = { invite: 'Invité', actif: 'Actif', expire: 'Expiré', resilie: 'Résilié' };
const typeLabels = { artiste_kkd: 'Artiste KKD', label_partenaire: 'Label Partenaire' };

const emptyForm = { artist_name: '', email: '', invite_type: 'artiste_kkd', contract_start: '', contract_end: '', notes: '' };

export default function AdminInvites() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [editId, setEditId] = useState(null);

  const { data: invites, isLoading } = useQuery({
    queryKey: ['admin-invites'],
    queryFn: () => base44.entities.ArtistInvite.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ArtistInvite.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['admin-invites']); setShowForm(false); setForm(emptyForm); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ArtistInvite.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['admin-invites']); setEditId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ArtistInvite.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-invites']),
  });

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    // Send platform invite email
    if (form.email) {
      await base44.users.inviteUser(form.email, 'user').catch(() => {});
    }
    await createMutation.mutateAsync({ ...form, status: 'invite' });
    setSending(false);
  };

  const handleStatusChange = (id, status) => updateMutation.mutate({ id, data: { status } });

  // Warn on expiring contracts (within 30 days)
  const today = new Date();
  const expiringSoon = invites.filter(i => {
    if (!i.contract_end || i.status !== 'actif') return false;
    const end = new Date(i.contract_end);
    const diff = (end - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">Artistes & Labels</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les invitations, contrats et accès partenaires</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <UserPlus size={16} /> Inviter
        </Button>
      </div>

      {/* Expiry alerts */}
      {expiringSoon.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
          <AlertCircle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-heading font-bold text-sm text-yellow-400">Contrats expirant bientôt</p>
            <p className="text-xs text-muted-foreground mt-1">{expiringSoon.map(i => i.artist_name).join(', ')} — contrat(s) à renouveler dans moins de 30 jours.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div key={key} className="bg-card border border-border/50 rounded-xl p-3">
            <p className="text-xl font-extrabold font-display">{invites.filter(i => i.status === key).length}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Invite Form */}
      {showForm && (
        <div className="bg-card border border-border/50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold">Nouvelle invitation</h2>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-muted-foreground" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-1.5 block">Nom de l'artiste / Label *</Label>
                <Input value={form.artist_name} onChange={e => handleChange('artist_name', e.target.value)} required placeholder="Nom artistique ou du label" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Email *</Label>
                <Input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} required placeholder="email@exemple.com" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Type</Label>
                <Select value={form.invite_type} onValueChange={v => handleChange('invite_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="artiste_kkd">Artiste KKD Music</SelectItem>
                    <SelectItem value="label_partenaire">Label Partenaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-1.5 block">Début du contrat</Label>
                <Input type="date" value={form.contract_start} onChange={e => handleChange('contract_start', e.target.value)} />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Fin du contrat</Label>
                <Input type="date" value={form.contract_end} onChange={e => handleChange('contract_end', e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Notes</Label>
              <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Conditions particulières, notes du contrat…" rows={3} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={sending}>{sending ? 'Envoi…' : 'Envoyer l\'invitation'}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
            <p className="text-xs text-muted-foreground">L'artiste recevra un email d'invitation pour accéder à la plateforme.</p>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground text-sm">Chargement…</p>}
        {!isLoading && invites.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border/30 rounded-xl">
            Aucune invitation. Cliquez sur "Inviter" pour commencer.
          </div>
        )}
        {invites.map((inv) => (
          <div key={inv.id} className="bg-card border border-border/50 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {inv.invite_type === 'label_partenaire' ? <Building2 size={18} className="text-primary" /> : <UserPlus size={18} className="text-primary" />}
                </div>
                <div>
                  <p className="font-heading font-bold text-sm">{inv.artist_name}</p>
                  <p className="text-xs text-muted-foreground">{inv.email}</p>
                  <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">{typeLabels[inv.invite_type]}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status]}`}>
                  {statusLabels[inv.status]}
                </span>
                <Select value={inv.status} onValueChange={v => handleStatusChange(inv.id, v)}>
                  <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <button onClick={() => deleteMutation.mutate(inv.id)} className="text-muted-foreground hover:text-red-400 transition-colors"><X size={16} /></button>
              </div>
            </div>
            {(inv.contract_start || inv.contract_end) && (
              <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-4 text-xs text-muted-foreground">
                <Calendar size={12} />
                {inv.contract_start && <span>Début: <strong>{new Date(inv.contract_start).toLocaleDateString('fr-FR')}</strong></span>}
                {inv.contract_end && <span>Fin: <strong className={new Date(inv.contract_end) < today ? 'text-red-400' : ''}>{new Date(inv.contract_end).toLocaleDateString('fr-FR')}</strong></span>}
              </div>
            )}
            {inv.notes && <p className="mt-2 text-xs text-muted-foreground italic">{inv.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}