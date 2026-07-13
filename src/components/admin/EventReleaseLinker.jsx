import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Music, Search, Check, Link2 } from 'lucide-react';

/**
 * Lets an admin select which releases to display under an event
 * so visitors can listen to them on the event page.
 */
export default function EventReleaseLinker({ eventId, linkedIds = [] }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(linkedIds);
  const [saving, setSaving] = useState(null);
  const queryClient = useQueryClient();

  const { data: releases = [] } = useQuery({
    queryKey: ['all-releases-for-linker'],
    queryFn: () => base44.entities.Release.list('-created_date', 200),
  });

  const filtered = releases.filter(r =>
    !search ||
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.artist_name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = async (releaseId) => {
    const next = selected.includes(releaseId)
      ? selected.filter(id => id !== releaseId)
      : [...selected, releaseId];
    const prev = selected;
    setSelected(next);
    setSaving(releaseId);
    try {
      await base44.entities.Event.update(eventId, { linked_release_ids: next });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    } catch {
      setSelected(prev); // revert on error
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5">
      <h3 className="font-heading font-bold text-sm flex items-center gap-2 mb-1">
        <Link2 size={16} className="text-primary" /> Sorties liées à l'événement
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Sélectionnez les sorties à afficher sur la page de l'événement pour que les visiteurs puissent les écouter.
      </p>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre ou artiste…"
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary text-sm border border-border/50 focus:border-primary/50 outline-none"
        />
      </div>

      <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">Aucune sortie trouvée.</p>
        )}
        {filtered.map((r) => {
          const isLinked = selected.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              disabled={saving === r.id}
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors disabled:opacity-50 ${
                isLinked ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary border border-transparent'
              }`}
            >
              <div className="w-9 h-9 rounded overflow-hidden bg-secondary shrink-0 flex items-center justify-center">
                {r.cover_url ? (
                  <img src={r.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music size={14} className="text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground truncate">{r.artist_name}</p>
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isLinked ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                {isLinked ? <Check size={12} /> : <Link2 size={11} />}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {selected.length} sortie{selected.length !== 1 ? 's' : ''} liée{selected.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}