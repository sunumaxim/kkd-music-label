import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { ListPlus, X, Check, Loader2 } from 'lucide-react';

/**
 * Bouton « Ajouter à une playlist ».
 * Ajoute toutes les pistes jouables (gratuites) de la release dans la playlist choisie.
 */
export default function AddToPlaylist({ release }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();

  const tracks = getReleaseTracks(release);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['my-playlists'],
    queryFn: () => base44.entities.Playlist.list('-updated_date', 50),
    enabled: !!me,
  });

  const addMutation = useMutation({
    mutationFn: async ({ playlist }) => {
      const existing = (playlist.items || []).map((i) => i.audio_url);
      const toAdd = tracks
        .filter((t) => !existing.includes(t.audio_url))
        .map((t) => ({
          release_id: release.id,
          title: t.title,
          artist_name: t.artist_name,
          cover_url: t.cover_url,
          audio_url: t.audio_url,
          added_date: new Date().toISOString(),
        }));
      const items = [...(playlist.items || []), ...toAdd];
      const cover = playlist.cover_url || (tracks[0] && tracks[0].cover_url) || '';
      return base44.entities.Playlist.update(playlist.id, { items, cover_url: cover });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-playlists'] });
      setOpen(false);
    },
  });

  const createAndAdd = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await base44.entities.Playlist.create({
        user_email: me.email,
        title: newName.trim(),
        items: tracks.map((t) => ({
          release_id: release.id,
          title: t.title,
          artist_name: t.artist_name,
          cover_url: t.cover_url,
          audio_url: t.audio_url,
          added_date: new Date().toISOString(),
        })),
        cover_url: tracks[0] ? tracks[0].cover_url : '',
      });
      qc.invalidateQueries({ queryKey: ['my-playlists'] });
      setNewName('');
      setOpen(false);
      return created;
    } finally {
      setCreating(false);
    }
  };

  if (!tracks.length) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 h-10 rounded-full border border-border/60 hover:border-primary/50 hover:text-primary text-sm transition-colors"
        title="Ajouter à une playlist"
      >
        <ListPlus size={16} />
        <span className="hidden sm:inline">Ajouter</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-64 bg-card border border-border rounded-xl shadow-2xl p-2 select-none">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-xs font-heading font-bold">Ajouter à une playlist</p>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <div className="max-h-52 overflow-y-auto space-y-0.5">
              {isLoading ? (
                <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
              ) : playlists.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-3 text-center">Aucune playlist — créez-en une ci-dessous.</p>
              ) : (
                playlists.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addMutation.mutate({ playlist: p })}
                    disabled={addMutation.isPending}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary text-left text-sm transition-colors disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                      {p.cover_url ? <img src={p.cover_url} alt="" className="w-full h-full object-cover" /> : <ListPlus size={13} className="text-muted-foreground" />}
                    </div>
                    <span className="flex-1 min-w-0 truncate">{p.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{(p.items || []).length}</span>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border/40 mt-1 pt-2 px-1">
              <div className="flex gap-1">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nouvelle playlist…"
                  className="flex-1 min-w-0 text-sm bg-background border border-border rounded-lg px-2 py-1.5"
                  onKeyDown={(e) => e.key === 'Enter' && createAndAdd()}
                />
                <button
                  onClick={createAndAdd}
                  disabled={creating || !newName.trim()}
                  className="px-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 transition-colors"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
                </button>
              </div>
            </div>
            {addMutation.isSuccess && <p className="text-[11px] text-primary px-2 pt-1">Ajouté ✓</p>}
          </div>
        </>
      )}
    </div>
  );
}