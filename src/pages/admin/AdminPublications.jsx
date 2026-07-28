import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle, XCircle, Clock, ExternalLink, Instagram,
  Music, Video, ListMusic, Disc, ChevronDown, ChevronUp
} from 'lucide-react';

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
  approuve: { label: 'Approuvé', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: CheckCircle },
  publie: { label: 'Publié', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle },
  refuse: { label: 'Refusé', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
};

const PLATFORM_LABELS = {
  spotify: 'Spotify', apple_music: 'Apple Music', youtube: 'YouTube',
  audiomack: 'Audiomack', amazon_music: 'Amazon Music', deezer: 'Deezer',
  soundcloud: 'SoundCloud', autre: 'Autre',
};

const TYPE_ICONS = {
  sortie_musicale: Music, video_clip: Video, playlist: ListMusic,
  album: Disc, ep: ListMusic, autre: Music,
};

const TYPE_LABELS = {
  sortie_musicale: 'Single', video_clip: 'Clip vidéo', playlist: 'Playlist',
  album: 'Album', ep: 'EP / Mixtape', autre: 'Autre',
};

const PLATFORM_FIELD = {
  spotify: 'spotify_url',
  apple_music: 'apple_music_url',
  youtube: 'youtube_url',
  audiomack: 'audiomack_url',
  deezer: 'deezer_url',
};

/**
 * On "Publier": create the actual Release (or Video) in the catalog so it
 * becomes immediately available and listenable. Also creates a new Artist
 * profile if the partner requested one at publication time.
 */
async function publishToCatalog(pub) {
  let artistId = pub.artist_id || '';
  const artistName = pub.artist_name;

  if (!artistId && pub.new_artist_genre) {
    const created = await base44.entities.Artist.create({
      name: artistName,
      genre: pub.new_artist_genre,
      photo_url: pub.new_artist_photo_url || '',
    });
    artistId = created.id;
  }

  const isVideo = pub.content_type === 'video_clip';
  const fullTitle = pub.featuring_artist ? `${pub.title} (feat. ${pub.featuring_artist})` : pub.title;

  if (isVideo) {
    const video = await base44.entities.Video.create({
      title: fullTitle,
      artist_name: artistName,
      artist_id: artistId,
      youtube_url: pub.streaming_platform === 'youtube' ? pub.streaming_link : '',
      video_file_url: pub.file_url || '',
      thumbnail_url: pub.cover_url || '',
      video_type: 'clip_officiel',
      description: pub.description || '',
      is_for_sale: !!pub.is_for_sale,
      price: pub.price || 0,
      protected_file_uri: pub.is_for_sale ? pub.file_url : '',
      preview_start: pub.preview_start || 0,
    });
    await base44.entities.PartnerPublication.update(pub.id, {
      status: 'publie',
      published_as_release_id: video.id,
      artist_id: artistId,
    });
    return video.id;
  }

  const releaseType =
    pub.content_type === 'album' ? 'album' :
    pub.content_type === 'ep' ? 'ep' : 'single';

  const platformLinks = { spotify_url: '', apple_music_url: '', youtube_url: '', audiomack_url: '', deezer_url: '' };
  const field = PLATFORM_FIELD[pub.streaming_platform];
  if (field && pub.streaming_link) platformLinks[field] = pub.streaming_link;

  const release = await base44.entities.Release.create({
    title: fullTitle,
    artist_name: artistName,
    artist_id: artistId,
    cover_url: pub.cover_url || '',
    description: pub.description || '',
    release_type: releaseType,
    ...platformLinks,
    audio_file_url: pub.file_url && !pub.is_for_sale ? pub.file_url : '',
    tracks: Array.isArray(pub.tracks) ? pub.tracks : [],
    is_for_sale: !!pub.is_for_sale,
    price: pub.price || 0,
    protected_file_uri: pub.is_for_sale ? pub.file_url : '',
    preview_start: pub.preview_start || 0,
  });

  await base44.entities.PartnerPublication.update(pub.id, {
    status: 'publie',
    published_as_release_id: release.id,
    artist_id: artistId,
  });
  return release.id;
}

function PublicationCard({ pub, onUpdateStatus, onPublish, publishing }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(pub.admin_notes || '');
  const [saving, setSaving] = useState(false);

  const cfg = STATUS_CONFIG[pub.status] || STATUS_CONFIG.en_attente;
  const Icon = cfg.icon;
  const TypeIcon = TYPE_ICONS[pub.content_type] || Music;

  const handleStatus = async (newStatus) => {
    setSaving(true);
    await onUpdateStatus(pub.id, { status: newStatus, admin_notes: notes });
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        {pub.cover_url ? (
          <img src={pub.cover_url} alt={pub.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <TypeIcon size={20} className="text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading font-bold text-sm truncate">{pub.title}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
              {TYPE_LABELS[pub.content_type] || pub.content_type}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{pub.artist_name} · {pub.partner_email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cfg.color}`}>
              <Icon size={10} className="inline mr-0.5" />{cfg.label}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              {new Date(pub.created_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/30 p-4 space-y-4">
          {/* Links */}
          <div className="space-y-2">
            <p className="text-[11px] font-mono text-muted-foreground/50 uppercase tracking-widest">Liens</p>
            <a
              href={pub.streaming_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink size={13} />
              {PLATFORM_LABELS[pub.streaming_platform] || 'Lien principal'}: {pub.streaming_link}
            </a>
            {pub.secondary_link && (
              <a
                href={pub.secondary_link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink size={12} /> Lien secondaire: {pub.secondary_link}
              </a>
            )}
            {pub.instagram_link && (
              <a
                href={pub.instagram_link.startsWith('http') ? pub.instagram_link : `https://instagram.com/${pub.instagram_link.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs text-pink-400 hover:underline"
              >
                <Instagram size={12} /> Instagram: {pub.instagram_link}
              </a>
            )}
            {pub.file_url && (
              <a href={pub.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                📎 Fichier joint
              </a>
            )}
          </div>

          {/* Description */}
          {pub.description && (
            <div>
              <p className="text-[11px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1">Message du partenaire</p>
              <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">{pub.description}</p>
            </div>
          )}

          {/* Admin notes */}
          <div>
            <p className="text-[11px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1">Notes internes</p>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ajouter des notes internes…"
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {pub.status !== 'publie' && (
              <Button
                size="sm"
                disabled={saving || publishing}
                onClick={async () => { setSaving(true); try { await onPublish(pub); } finally { setSaving(false); } }}
                className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              >
                <CheckCircle size={13} /> {publishing ? 'Publication…' : 'Publier'}
              </Button>
            )}
            {pub.status !== 'approuve' && pub.status !== 'publie' && (
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => handleStatus('approuve')}
                className="gap-1.5 text-blue-400 border-blue-500/30"
              >
                <CheckCircle size={13} /> Approuver
              </Button>
            )}
            {pub.status !== 'refuse' && (
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => handleStatus('refuse')}
                className="gap-1.5 text-red-400 border-red-500/30"
              >
                <XCircle size={13} /> Refuser
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPublications() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('en_attente');

  const { data: publications = [], isLoading } = useQuery({
    queryKey: ['admin-publications'],
    queryFn: () => base44.entities.PartnerPublication.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PartnerPublication.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-publications'] }),
  });

  const publishMutation = useMutation({
    mutationFn: (pub) => publishToCatalog(pub),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publications'] });
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });

  const filtered = filter === 'all' ? publications : publications.filter(p => p.status === filter);
  const pendingCount = publications.filter(p => p.status === 'en_attente').length;

  const FILTERS = [
    { value: 'en_attente', label: `En attente${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { value: 'approuve', label: 'Approuvées' },
    { value: 'publie', label: 'Publiées' },
    { value: 'refuse', label: 'Refusées' },
    { value: 'all', label: 'Toutes' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Publications partenaires</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez les demandes de publication des artistes partenaires</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.value ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Music size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Aucune publication {filter !== 'all' ? `"${FILTERS.find(f => f.value === filter)?.label}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(pub => (
            <PublicationCard
              key={pub.id}
              pub={pub}
              onUpdateStatus={(id, data) => updateMutation.mutateAsync({ id, data })}
              onPublish={(p) => publishMutation.mutateAsync(p)}
              publishing={publishMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}