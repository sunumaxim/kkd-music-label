import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, UserPlus, Building2, Calendar, AlertCircle, UserCheck, CheckCircle, XCircle } from 'lucide-react';
import ArtistSelector from '@/components/partner/ArtistSelector';

const statusColors = {
  invite: 'bg-yellow-500/10 text-yellow-400',
  actif: 'bg-green-500/10 text-green-400',
  expire: 'bg-muted text-muted-foreground',
  resilie: 'bg-red-500/10 text-red-400',
};

const statusLabels = { invite: 'Invité', actif: 'Actif', expire: 'Expiré', resilie: 'Résilié' };
const typeLabels = { artiste_kkd: 'Artiste KKD', label_partenaire: 'Label Partenaire' };
const emptyForm = { artist_id: '', artist_name: '', email: '', invite_type: 'artiste_kkd', label_name: '', label_id: '', contract_start: '', contract_end: '', notes: '' };

export default function AdminInvites() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('invites');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [editId, setEditId] = useState(null);

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ['admin-invites'],
    queryFn: () => base44.entities.ArtistInvite.list('-created_date'),
  });

  const { data: accessRequests = [], isLoading: loadingAccess } = useQuery({
    queryKey: ['admin-access-requests'],
    queryFn: () => base44.entities.ArtistAccessRequest.list('-created_date'),
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

  const updateAccessMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ArtistAccessRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['admin-access-requests']),
  });

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    if (form.email) {
      await base44.users.inviteUser(form.email, 'user').catch(() => {});
    }
    await createMutation.mutateAsync({ ...form, status: 'invite' });
    setSending(false);
  };

  const handleStatusChange = (id, status) => updateMutation.mutate({ id, data: { status } });

  const today = new Date();
  const expiringSoon = invites.filter(i => {
    if (!i.contract_end || i.status !== 'actif') return false;
    const end = new Date(i.contract_end);
    const diff = (end - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  const pendingAccess = accessRequests.filter(r => r.status === 'en_attente').length;

  // Label invites (for label_id selector)
  const labelInvites = invites.filter(i => i.invite_type === 'label_partenaire');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">Artistes & Labels</h1>
          <p className="text-sm text-muted-foreground mt-1">Invitations, contrats et accès artiste</p>
        </div>
        {activeTab === 'invites' && (
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <UserPlus size={16} /> Inviter
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('invites')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'invites' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
          Contrats & Invitations
        </button>
        <button onClick={() => setActiveTab('access')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'access' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
          Demandes d'accès artiste
          {pendingAccess > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'access' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
              {pendingAccess}
            </span>
          )}
        </button>
      </div>

      {/* ── INVITES TAB ── */}
      {activeTab === 'invites' && (
        <>
          {expiringSoon.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
              <AlertCircle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-heading font-bold text-sm text-yellow-400">Contrats expirant bientôt</p>
                <p className="text-xs text-muted-foreground mt-1">{expiringSoon.map(i => i.artist_name).join(', ')} — à renouveler dans moins de 30 jours.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="bg-card border border-border/50 rounded-xl p-3">
                <p className="text-xl font-extrabold font-display">{invites.filter(i => i.status === key).length}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {showForm && (
            <div className="bg-card border border-border/50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold">Nouvelle invitation</h2>
                <button onClick={() => setShowForm(false)}><X size={18} className="text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1.5 block">Artiste lié (facultatif)</Label>
                    <ArtistSelector
                      value={form.artist_id}
                      onChange={(id, name) => { handleChange('artist_id', id); handleChange('artist_name', name); }}
                      placeholder="Sélectionner un artiste existant…"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Ou saisissez le nom manuellement ci-dessous.</p>
                  </div>
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
                  {form.invite_type === 'artiste_kkd' && labelInvites.length > 0 && (
                    <div>
                      <Label className="text-sm mb-1.5 block">Label rattaché (facultatif)</Label>
                      <Select value={form.label_id || ''} onValueChange={v => {
                        const lbl = labelInvites.find(l => l.id === v);
                        handleChange('label_id', v);
                        handleChange('label_name', lbl?.artist_name || '');
                      }}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner un label…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Aucun label</SelectItem>
                          {labelInvites.map(l => <SelectItem key={l.id} value={l.id}>{l.artist_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                  <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Conditions particulières…" rows={3} />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={sending}>{sending ? 'Envoi…' : 'Envoyer l\'invitation'}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                </div>
                <p className="text-xs text-muted-foreground">L'artiste recevra un email d'invitation pour accéder à la plateforme.</p>
              </form>
            </div>
          )}

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
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">{typeLabels[inv.invite_type]}</span>
                        {inv.label_name && <span className="text-xs text-muted-foreground">🏷 {inv.label_name}</span>}
                        {inv.artist_id && <span className="text-[10px] text-green-400">● Profil lié</span>}
                      </div>
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
        </>
      )}

      {/* ── ACCESS REQUESTS TAB ── */}
      {activeTab === 'access' && (
        <div className="space-y-3">
          {loadingAccess && <p className="text-muted-foreground text-sm">Chargement…</p>}
          {!loadingAccess && accessRequests.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border/30 rounded-xl">
              Aucune demande d'accès artiste pour le moment.
            </div>
          )}
          {accessRequests.map(req => (
            <div key={req.id} className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <UserCheck size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm">{req.artist_name}</p>
                    <p className="text-xs text-muted-foreground">{req.user_email}</p>
                    <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      req.status === 'en_attente' ? 'bg-yellow-500/10 text-yellow-400' :
                      req.status === 'approuve' ? 'bg-green-500/10 text-green-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {req.status === 'en_attente' ? 'En attente' : req.status === 'approuve' ? 'Approuvé' : 'Refusé'}
                    </span>
                  </div>
                </div>
                {req.status === 'en_attente' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateAccessMutation.mutate({ id: req.id, data: { status: 'approuve' } })}
                      className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-8">
                      <CheckCircle size={13} /> Approuver
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateAccessMutation.mutate({ id: req.id, data: { status: 'refuse' } })}
                      className="gap-1.5 text-red-400 border-red-500/30 h-8">
                      <XCircle size={13} /> Refuser
                    </Button>
                  </div>
                )}
              </div>
              {req.message && (
                <p className="mt-3 text-xs text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2">
                  💬 {req.message}
                </p>
              )}
              <p className="mt-2 text-[10px] text-muted-foreground/50">
                {new Date(req.created_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}