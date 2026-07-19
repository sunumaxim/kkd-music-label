import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Copy, Check, Loader2, Trash2, UserPlus, ExternalLink } from 'lucide-react';

const STATUS = { invite: 'Invité', accepte: 'Accepté', filme: 'En film', termine: 'Terminé' };
const STATUS_COLOR = {
  invite: 'bg-secondary text-muted-foreground',
  accepte: 'bg-blue-500/10 text-blue-400',
  filme: 'bg-red-500/15 text-red-500',
  termine: 'bg-green-500/10 text-green-400',
};

export default function AdminCorrespondents() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ event_id: '', name: '', email: '' });
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);
  const [inviting, setInviting] = useState(null);

  const { data: events = [] } = useQuery({
    queryKey: ['corr-events'],
    queryFn: () => base44.entities.Event.list('-event_date', 50),
  });
  const { data: invites = [] } = useQuery({
    queryKey: ['correspondent-invites'],
    queryFn: () => base44.entities.CorrespondentInvite.list('-created_date', 100),
  });
  const { data: broadcasts = [] } = useQuery({
    queryKey: ['corr-broadcasts'],
    queryFn: () => base44.entities.Broadcast.list('-updated_date', 100),
  });

  const handleCreate = async () => {
    if (!form.event_id || !form.email) return;
    setCreating(true);
    try {
      const event = events.find(e => e.id === form.event_id);
      let b = broadcasts.find(x => x.linked_event_id === form.event_id);
      if (!b) {
        b = await base44.entities.Broadcast.create({
          title: event.title,
          source_type: 'camera',
          linked_event_id: form.event_id,
          status: 'brouillon',
        });
      }
      const token = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      await base44.entities.CorrespondentInvite.create({
        email: form.email,
        name: form.name || '',
        event_id: form.event_id,
        event_title: event.title,
        broadcast_id: b.id,
        token,
        status: 'invite',
      });
      setForm({ event_id: '', name: '', email: '' });
      qc.invalidateQueries({ queryKey: ['correspondent-invites'] });
      qc.invalidateQueries({ queryKey: ['corr-broadcasts'] });
    } finally {
      setCreating(false);
    }
  };

  const link = (token) => `${window.location.origin}/correspondant/${token}`;
  const copy = (token) => {
    navigator.clipboard.writeText(link(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  };

  const inviteUser = async (email) => {
    setInviting(email);
    try {
      await base44.users.inviteUser(email, 'user');
      alert(`Invitation utilisateur envoyée à ${email}`);
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      setInviting(null);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Supprimer cette invitation ?')) {
      await base44.entities.CorrespondentInvite.delete(id);
      qc.invalidateQueries({ queryKey: ['correspondent-invites'] });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-mono text-primary tracking-widest uppercase">Diffusion</span>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold mt-1 flex items-center gap-2">
          <Users size={24} className="text-primary" /> Correspondants
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Invitez des correspondants à couvrir un événement à distance. Ils acceptent, filment, et le direct remonte vers le studio — vous gérez les commentaires.
        </p>
      </div>

      {/* Create */}
      <div className="bg-card border border-border/50 rounded-xl p-5 space-y-3">
        <h3 className="font-heading font-bold text-sm flex items-center gap-2">
          <Plus size={16} className="text-primary" /> Nouvelle invitation
        </h3>
        <div className="grid md:grid-cols-3 gap-2">
          <select
            value={form.event_id}
            onChange={e => setForm(f => ({ ...f, event_id: e.target.value }))}
            className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">— Événement —</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nom du correspondant"
            className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <input
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="email@correspondant.com"
            className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={creating || !form.event_id || !form.email}
          className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Créer l'invitation
        </button>
        <p className="text-[11px] text-muted-foreground">
          Le lien généré utilise votre nom de domaine. Le correspondant doit se connecter (ou créer un compte) pour filmer — utilisez l'icône <UserPlus size={11} className="inline" /> pour l'inviter comme utilisateur.
        </p>
      </div>

      {/* List */}
      <div className="space-y-2">
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune invitation pour le moment.</p>
        ) : invites.map(inv => (
          <div key={inv.id} className="bg-card border border-border/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-heading font-bold text-sm truncate">{inv.name || inv.email}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLOR[inv.status]}`}>{STATUS[inv.status]}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{inv.email} · {inv.event_title}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => copy(inv.token)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-xs font-medium hover:bg-secondary/70">
                {copied === inv.token ? <><Check size={12} className="text-green-500" /> Copié</> : <><Copy size={12} /> Lien</>}
              </button>
              <a href={link(inv.token)} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-secondary/70"><ExternalLink size={14} /></a>
              <button onClick={() => inviteUser(inv.email)} disabled={inviting === inv.email} className="p-2 rounded-lg bg-secondary hover:bg-secondary/70" title="Inviter comme utilisateur">
                {inviting === inv.email ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              </button>
              <button onClick={() => handleDelete(inv.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}