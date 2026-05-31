import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, X, Music, Video, Globe, Handshake, Radio, ExternalLink } from 'lucide-react';

const statusColors = {
  en_attente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  en_cours: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  accepte: 'bg-green-500/10 text-green-400 border-green-500/20',
  refuse: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusLabels = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  accepte: 'Accepté',
  refuse: 'Refusé',
};

const typeLabels = {
  distribution: 'Distribution',
  promotion_musique: 'Promo Musique',
  promotion_clip: 'Promo Clip',
  partenariat_label: 'Partenariat Label',
  collaboration: 'Collaboration',
  autre: 'Autre',
};

export default function AdminRequests() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: () => base44.entities.ServiceRequest.list('-created_date'),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceRequest.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['admin-requests']); },
  });

  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus);

  const handleUpdateStatus = (id, status) => {
    updateMutation.mutate({ id, data: { status } });
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
  };

  const handleSaveNotes = () => {
    updateMutation.mutate({ id: selected.id, data: { admin_notes: notes } });
    setSelected(prev => ({ ...prev, admin_notes: notes }));
  };

  const openDetail = (req) => {
    setSelected(req);
    setNotes(req.admin_notes || '');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold">Demandes de Prestation</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez les demandes de distribution, promotion et partenariat</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {['en_attente', 'en_cours', 'accepte', 'refuse'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            className={`p-3 rounded-xl border text-left transition-all ${filterStatus === s ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-card'}`}
          >
            <p className="text-xl font-extrabold font-display">{requests.filter(r => r.status === s).length}</p>
            <p className="text-xs text-muted-foreground">{statusLabels[s]}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="space-y-3">
          {isLoading && <p className="text-muted-foreground text-sm">Chargement…</p>}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">Aucune demande</div>
          )}
          {filtered.map((req) => (
            <div
              key={req.id}
              onClick={() => openDetail(req)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-primary/30 ${selected?.id === req.id ? 'border-primary/40 bg-primary/5' : 'border-border/50 bg-card'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-heading font-bold text-sm">{req.full_name}</p>
                  <p className="text-xs text-muted-foreground">{req.organization || req.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[req.status]}`}>
                  {statusLabels[req.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{typeLabels[req.request_type] || req.request_type}</span>
                {req.artist_name && <span className="text-xs text-muted-foreground">• {req.artist_name}</span>}
                <span className="text-xs text-muted-foreground ml-auto">
                  {req.created_date ? new Date(req.created_date).toLocaleDateString('fr-FR') : ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4 sticky top-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold">Détail de la demande</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Nom</p><p className="font-medium">{selected.full_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium break-all">{selected.email}</p></div>
                {selected.phone && <div><p className="text-xs text-muted-foreground">Téléphone</p><p className="font-medium">{selected.phone}</p></div>}
                {selected.organization && <div><p className="text-xs text-muted-foreground">Organisation</p><p className="font-medium">{selected.organization}</p></div>}
                {selected.artist_name && <div><p className="text-xs text-muted-foreground">Artiste</p><p className="font-medium">{selected.artist_name}</p></div>}
                {selected.genre && <div><p className="text-xs text-muted-foreground">Genre</p><p className="font-medium">{selected.genre}</p></div>}
              </div>

              {selected.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="bg-background rounded-lg p-3 text-sm leading-relaxed">{selected.description}</p>
                </div>
              )}

              {selected.music_link && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Lien musical</p>
                  <a href={selected.music_link} target="_blank" rel="noopener noreferrer" className="text-primary text-sm flex items-center gap-1 hover:underline">
                    <ExternalLink size={14} /> Écouter / Voir
                  </a>
                </div>
              )}

              {selected.file_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fichier joint</p>
                  <a href={selected.file_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm flex items-center gap-1 hover:underline">
                    <ExternalLink size={14} /> Télécharger le fichier
                  </a>
                </div>
              )}
            </div>

            {/* Status update */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Changer le statut</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleUpdateStatus(selected.id, key)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${selected.status === key ? statusColors[key] : 'border-border/50 text-muted-foreground hover:border-primary/30'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin notes */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Notes internes</p>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes réservées à l'équipe KKD…" rows={3} />
              <Button size="sm" onClick={handleSaveNotes} className="mt-2">Sauvegarder les notes</Button>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex items-center justify-center h-64 border border-dashed border-border/30 rounded-xl text-muted-foreground text-sm">
            Sélectionnez une demande pour voir les détails
          </div>
        )}
      </div>
    </div>
  );
}