import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { usePlayer } from '@/lib/PlayerContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ListMusic, Play, Pause, Trash2, X, Plus, Music as MusicIcon, ArrowLeft, LogIn, Heart } from 'lucide-react';
import { buildEntitySlug } from '@/lib/slugify';
import QueueLibrary from '@/components/player/QueueLibrary';

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function Playlists() {
  const player = usePlayer();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [tab, setTab] = useState('playlists');

  const TABS = [
    { key: 'favoris', label: "Coups de cœur" },
    { key: 'playlists', label: "Playlists" },
    { key: 'file', label: "File d'attente" },
  ];

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['my-playlists'],
    queryFn: () => base44.entities.Playlist.list('-updated_date', 100),
    enabled: !!me,
  });

  const { data: likes = [] } = useQuery({
    queryKey: ['my-likes'],
    queryFn: () => base44.entities.Like.list('-created_date', 100),
    enabled: !!me,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Playlist.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-playlists'] });
      setCreating(false); setNewTitle(''); setNewDesc('');
      toast({ title: 'Playlist créée' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Playlist.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-playlists'] });
      setSelected(null);
      toast({ title: 'Playlist supprimée' });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ id, items }) => base44.entities.Playlist.update(id, { items }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-playlists'] }),
  });

  const playPlaylist = (playlist, startIndex = 0) => {
    const tracks = (playlist.items || []).map((it, i) => ({
      key: it.audio_url || `${playlist.id}-${i}`,
      title: it.title,
      artist_name: it.artist_name,
      cover_url: it.cover_url,
      audio_url: it.audio_url,
      item_type: 'release',
      item_id: it.release_id,
    }));
    if (!tracks.length) return;
    player.playQueue(tracks, startIndex);
  };

  const isPlayingItem = (playlist, idx) => {
    const it = playlist.items[idx];
    return player.current?.audio_url === it?.audio_url && player.isPlaying;
  };

  // ── Connexion requise ──
  if (!meLoading && !me) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <LogIn size={24} className="text-primary" />
        </div>
        <h1 className="font-display font-bold text-xl mb-2">Connectez-vous</h1>
        <p className="text-sm text-muted-foreground mb-6">Vos playlists sont personnelles. Connectez-vous pour créer et gérer vos listes de lecture.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/login"><Button variant="outline" size="sm">Se connecter</Button></Link>
          <Link to="/register"><Button size="sm" className="bg-primary">Créer un compte</Button></Link>
        </div>
      </div>
    );
  }

  // ── Détail d'une playlist ──
  if (selected) {
    const p = playlists.find((x) => x.id === selected) || selected;
    const items = p.items || [];
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="flex items-end gap-5 mb-8">
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center overflow-hidden shadow-xl shrink-0">
            {p.cover_url ? <img src={p.cover_url} alt="" className="w-full h-full object-cover" /> : <ListMusic size={48} className="text-primary/40" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Playlist</p>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl truncate mb-1">{p.title}</h1>
            <p className="text-sm text-muted-foreground">{items.length} titre{items.length !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2 mt-4">
              <Button onClick={() => playPlaylist(p, 0)} disabled={!items.length} className="bg-primary gap-2 rounded-full">
                <Play size={16} fill="currentColor" /> Lecture
              </Button>
              <Button variant="outline" onClick={() => deleteMutation.mutate(p.id)} className="gap-2 rounded-full text-destructive hover:text-destructive">
                <Trash2 size={15} /> Supprimer
              </Button>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Aucun titre. Ajoutez-en depuis une fiche sortie.</p>
        ) : (
          <div className="divide-y divide-border/30">
            {items.map((it, i) => {
              const playing = isPlayingItem(p, i);
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 group">
                  <button
                    onClick={() => (player.current?.audio_url === it.audio_url ? player.togglePlay() : playPlaylist(p, i))}
                    className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground flex items-center justify-center shrink-0 transition-colors"
                  >
                    {playing ? <Pause size={13} /> : <Play size={13} className="ml-0.5" fill="currentColor" />}
                  </button>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary shrink-0">
                    {it.cover_url ? <img src={it.cover_url} alt="" className="w-full h-full object-cover" /> : <MusicIcon size={14} className="text-muted-foreground m-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${playing ? 'text-primary font-medium' : 'text-foreground'}`}>{it.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{it.artist_name}</p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">{fmtDate(it.added_date)}</span>
                  <button
                    onClick={() => removeItemMutation.mutate({ id: p.id, items: items.filter((_, idx) => idx !== i) })}
                    className="p-1.5 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Liste des playlists (vue à onglets type Mon Lecteur) ──
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl">Mon lecteur</h1>
          <p className="text-sm text-muted-foreground">Vos coups de cœur, playlists et file d'attente</p>
        </div>
        {tab === 'playlists' && (
          <Button onClick={() => setCreating((v) => !v)} className="bg-primary gap-2 rounded-full">
            <Plus size={16} /> Nouvelle
          </Button>
        )}
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-5 sm:gap-6 border-b border-border/40 mb-6 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative pb-3 text-sm font-bold whitespace-nowrap transition-colors ${
              tab === t.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {tab === 'playlists' && creating && (
        <div className="bg-card border border-border/50 rounded-2xl p-4 mb-6 space-y-3">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Nom de la playlist" className="text-sm" />
          <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (facultatif)" rows={2} className="text-sm resize-none" />
          <div className="flex gap-2">
            <Button onClick={() => createMutation.mutate({ user_email: me.email, title: newTitle.trim(), description: newDesc.trim(), items: [] })} disabled={!newTitle.trim() || createMutation.isPending} className="bg-primary gap-2">
              {createMutation.isPending ? 'Création…' : 'Créer'}
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {/* Onglet Coups de cœur */}
      {tab === 'favoris' && (
        <>
          {likes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {likes.map((lk) => (
                <Link
                  key={lk.id}
                  to={lk.target_type === 'video' ? `/videos/${lk.target_id}` : `/musique/${buildEntitySlug(lk.target_title, lk.target_id)}`}
                  className="group"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary mb-2">
                    {lk.cover_url ? (
                      <img src={lk.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><MusicIcon size={24} className="text-muted-foreground/40" /></div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/40 rounded-full p-1">
                      <Heart size={14} className="text-primary" fill="currentColor" />
                    </div>
                  </div>
                  <p className="font-heading font-bold text-sm truncate">{lk.target_title}</p>
                  <p className="text-xs text-muted-foreground truncate">{lk.artist_name}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart size={28} className="text-primary/40" />
              </div>
              <p className="font-heading font-bold mb-1">Aucun coup de cœur</p>
              <p className="text-sm text-muted-foreground">Touchez le ❤ sur une sortie ou une vidéo pour la retrouver ici.</p>
            </div>
          )}
        </>
      )}

      {/* Onglet Playlists */}
      {tab === 'playlists' && (
        <>
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-12 text-center">Chargement…</div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ListMusic size={28} className="text-primary/40" />
              </div>
              <p className="font-heading font-bold mb-1">Aucune playlist</p>
              <p className="text-sm text-muted-foreground">Créez votre première liste via le bouton + ou depuis une musique.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="text-left bg-card border border-border/40 rounded-2xl overflow-hidden hover:border-primary/40 transition-colors group"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-primary/15 to-secondary flex items-center justify-center overflow-hidden">
                    {p.cover_url ? <img src={p.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <ListMusic size={32} className="text-primary/30" />}
                    <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); playPlaylist(p, 0); }}>
                      <Play size={16} className="ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-heading font-bold text-sm truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{(p.items || []).length} titre{(p.items || []).length !== 1 ? 's' : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Onglet File d'attente */}
      {tab === 'file' && <QueueLibrary />}
    </div>
  );
}