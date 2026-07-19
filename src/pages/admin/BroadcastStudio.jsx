import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Radio, Plus, Save, Play, Square, Loader2, Trash2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import SourceSelector from '@/components/broadcast/SourceSelector';
import WatermarkConfig from '@/components/broadcast/WatermarkConfig';
import BroadcastPreview from '@/components/broadcast/BroadcastPreview';
import DestinationPanel from '@/components/broadcast/DestinationPanel';

const STATUS_STYLES = {
  brouillon: 'bg-secondary text-muted-foreground',
  programme: 'bg-blue-500/10 text-blue-400',
  en_direct: 'bg-red-500/15 text-red-500',
  termine: 'bg-green-500/10 text-green-400',
  erreur: 'bg-destructive/10 text-destructive',
};
const STATUS_LABELS = {
  brouillon: 'Brouillon', programme: 'Programmé', en_direct: 'En direct', termine: 'Terminé', erreur: 'Erreur',
};

const EMPTY = {
  title: '', description: '', source_type: 'live_stream', stream_url: '',
  source_video_url: '', source_video_ids: [], linked_event_id: '', watermark_logo_url: '',
  watermark_position: 'top-right', watermark_opacity: 0.85, overlay_text: '',
  transition_type: 'none', destinations: ['plateforme'], status: 'brouillon',
};

export default function BroadcastStudio() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');

  const { data: broadcasts = [] } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => base44.entities.Broadcast.list('-updated_date', 50),
  });
  const { data: events = [] } = useQuery({
    queryKey: ['studio-events'],
    queryFn: () => base44.entities.Event.list('-event_date', 50),
  });
  const { data: videos = [] } = useQuery({
    queryKey: ['broadcast-videos-all'],
    queryFn: () => base44.entities.Video.list('-created_date', 100),
  });

  const current = editingId ? broadcasts.find(b => b.id === editingId) : null;
  const linkedEvent = events.find(e => e.id === draft.linked_event_id) || null;

  useEffect(() => {
    if (editingId && current) setDraft({ ...EMPTY, ...current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  const update = (patch) => setDraft(d => ({ ...d, ...patch }));

  const persist = async (extra = {}) => {
    let id = editingId;
    const payload = { ...draft, ...extra };
    if (id) {
      await base44.entities.Broadcast.update(id, payload);
    } else {
      const created = await base44.entities.Broadcast.create(payload);
      id = created.id;
      setEditingId(id);
    }
    queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    return id;
  };

  const handleSave = async () => {
    setSaving(true);
    try { await persist(); } finally { setSaving(false); }
  };

  const handleStart = async () => {
    const now = new Date().toISOString();
    const log = [...(draft.broadcast_log || []), { time: now, message: 'Direct démarré', level: 'info' }];
    await persist({ status: 'en_direct', started_date: now, broadcast_log: log });
    update({ status: 'en_direct', started_date: now, broadcast_log: log });
    if (draft.destinations?.includes('plateforme') && draft.linked_event_id && draft.stream_url) {
      await base44.entities.Event.update(draft.linked_event_id, { stream_url: draft.stream_url });
      queryClient.invalidateQueries({ queryKey: ['studio-events'] });
    }
  };

  const handleStop = async () => {
    const now = new Date().toISOString();
    const log = [...(draft.broadcast_log || []), { time: now, message: 'Direct terminé', level: 'info' }];
    await persist({ status: 'termine', ended_date: now, broadcast_log: log });
    update({ status: 'termine', ended_date: now, broadcast_log: log });
  };

  const handleNew = () => { setEditingId(null); setDraft(EMPTY); };

  const handleDelete = async (id) => {
    if (confirm('Supprimer ce direct ?')) {
      await base44.entities.Broadcast.delete(id);
      if (editingId === id) handleNew();
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    }
  };

  const grantEmailHandler = () => {
    if (!grantEmail) return;
    update({ granted_emails: [...(draft.granted_emails || []), grantEmail] });
    setGrantEmail('');
  };

  const isLive = draft.status === 'en_direct';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Diffusion</span>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold mt-1 flex items-center gap-2">
            <Radio size={24} className="text-primary" /> Studio de Diffusion
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Espace de contrôle centralisé pour vos directs multi-plateformes.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-3 py-1.5 rounded-full ${STATUS_STYLES[draft.status] || ''}`}>
            {STATUS_LABELS[draft.status]}
          </span>
          <Button onClick={handleNew} variant="outline" size="sm"><Plus size={14} className="mr-1" /> Nouveau</Button>
        </div>
      </div>

      {/* Broadcast selector */}
      {broadcasts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {broadcasts.map(b => (
            <button
              key={b.id}
              onClick={() => setEditingId(b.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs whitespace-nowrap transition-colors ${
                editingId === b.id ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border hover:bg-secondary text-muted-foreground'
              }`}
            >
              {b.status === 'en_direct' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              {b.title || 'Sans titre'}
              <span
                onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                className="ml-1 text-muted-foreground/50 hover:text-destructive"
              >
                <Trash2 size={11} />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Config column */}
        <div className="space-y-4">
          <div className="bg-card border border-border/50 rounded-xl p-5 space-y-3">
            <input
              value={draft.title}
              onChange={e => update({ title: e.target.value })}
              placeholder="Titre du direct"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <textarea
              value={draft.description}
              onChange={e => update({ description: e.target.value })}
              placeholder="Description"
              rows={2}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Événement lié</label>
              <select
                value={draft.linked_event_id}
                onChange={e => update({ linked_event_id: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">— Aucun —</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
          </div>

          <SourceSelector
            source_type={draft.source_type}
            stream_url={draft.stream_url}
            source_video_ids={draft.source_video_ids}
            source_video_url={draft.source_video_url}
            onChange={update}
          />
          <WatermarkConfig
            watermark_logo_url={draft.watermark_logo_url}
            watermark_position={draft.watermark_position}
            watermark_opacity={draft.watermark_opacity}
            overlay_text={draft.overlay_text}
            transition_type={draft.transition_type}
            onChange={update}
          />

          {/* Access grants */}
          <div className="bg-card border border-border/50 rounded-xl p-5 space-y-3">
            <h3 className="font-heading font-bold text-sm flex items-center gap-2">
              <Users size={16} className="text-primary" /> Accès partenaires
            </h3>
            <p className="text-xs text-muted-foreground">Emails autorisés à piloter ce direct (artistes / labels), sur demande.</p>
            <div className="flex gap-2">
              <input
                value={grantEmail}
                onChange={e => setGrantEmail(e.target.value)}
                placeholder="email@partenaire.com"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <Button onClick={grantEmailHandler} variant="secondary" size="sm">Ajouter</Button>
            </div>
            {(draft.granted_emails || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {draft.granted_emails.map(em => (
                  <span key={em} className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-full">
                    {em}
                    <button
                      onClick={() => update({ granted_emails: draft.granted_emails.filter(x => x !== em) })}
                      className="text-muted-foreground hover:text-destructive"
                    >×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview column */}
        <div className="space-y-4">
          <BroadcastPreview broadcast={draft} videos={videos} />
          <div className="bg-card border border-border/50 rounded-xl p-5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleSave} disabled={saving} variant="outline">
                {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
                Enregistrer
              </Button>
              {!isLive ? (
                <Button onClick={handleStart} className="bg-red-600 hover:bg-red-700 text-white">
                  <Play size={14} className="mr-1" fill="currentColor" /> Démarrer
                </Button>
              ) : (
                <Button onClick={handleStop} className="bg-foreground hover:bg-foreground/80">
                  <Square size={14} className="mr-1" /> Terminer
                </Button>
              )}
            </div>
            {(draft.broadcast_log || []).length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {[...(draft.broadcast_log || [])].reverse().map((l, i) => (
                  <p key={i} className="text-[10px] font-mono text-muted-foreground">
                    <Clock size={9} className="inline mr-1" />
                    {format(new Date(l.time), 'HH:mm:ss')} — {l.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Destinations column */}
        <DestinationPanel broadcast={draft} linkedEvent={linkedEvent} onChange={update} />
      </div>
    </div>
  );
}