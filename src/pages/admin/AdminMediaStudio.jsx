import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Music2, Video as VideoIcon, Play, Scissors, Loader2, ShieldCheck, Lock } from 'lucide-react';
import ShortGenerator from '@/components/admin/ShortGenerator';
import ProtectedPlayer from '@/components/marketplace/ProtectedPlayer';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { buildEntitySlug } from '@/lib/slugify';
import { Link } from 'react-router-dom';

export default function AdminMediaStudio() {
  const [tab, setTab] = useState('release');
  const [active, setActive] = useState(null); // item sélectionné pour le panneau

  const { data: releases = [], isLoading: rL } = useQuery({
    queryKey: ['studio-releases'],
    queryFn: () => base44.entities.Release.list('-created_date', 100),
  });
  const { data: videos = [], isLoading: vL } = useQuery({
    queryKey: ['studio-videos'],
    queryFn: () => base44.entities.Video.list('-created_date', 100),
  });

  const items = tab === 'release' ? releases : videos;
  const loading = tab === 'release' ? rL : vL;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-mono text-primary tracking-widest uppercase">Studio Médias</span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mt-1">Studio Médias Admin</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Accès libre à tout le catalogue (sorties & vidéos), génération de shorts 30s/60s (audio + pochette) téléchargeables,
          et publication automatique sur Instagram & Facebook.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { k: 'release', label: 'Sorties', icon: Music2 },
          { k: 'video', label: 'Vidéos', icon: VideoIcon },
        ].map((t) => (
          <button key={t.k} onClick={() => { setTab(t.k); setActive(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === t.k ? 'bg-primary text-primary-foreground' : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Liste */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">Aucun contenu.</p>
          ) : (
            items.map((item) => (
              <ItemRow key={item.id} item={item} type={tab} active={active?.id === item.id} onSelect={() => setActive(item)} />
            ))
          )}
        </div>

        {/* Panneau d'action */}
        <div className="lg:sticky lg:top-4 h-fit">
          {active ? <ActionPanel item={active} type={tab} /> : (
            <div className="bg-card border border-dashed border-border/50 rounded-2xl p-10 text-center text-muted-foreground text-sm">
              <Scissors size={28} className="mx-auto mb-2 text-muted-foreground/30" />
              Sélectionnez un contenu pour écouter, générer un short et publier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item, type, active, onSelect }) {
  const cover = type === 'release' ? item.cover_url : item.thumbnail_url;
  const paid = item.is_for_sale && Number(item.price) > 0;
  return (
    <button onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${active ? 'bg-primary/10 border-primary' : 'bg-card border-border/40 hover:border-primary/30'}`}>
      {cover ? (
        <img src={cover} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          {type === 'release' ? <Music2 size={18} className="text-muted-foreground/50" /> : <VideoIcon size={18} className="text-muted-foreground/50" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-sm truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.artist_name}</p>
      </div>
      {paid && <span className="text-[9px] font-mono uppercase text-yellow-500 flex items-center gap-0.5"><Lock size={9} /> Payant</span>}
      <Play size={16} className="text-primary shrink-0" />
    </button>
  );
}

function ActionPanel({ item, type }) {
  const video = type === 'video';
  const paid = item.is_for_sale && Number(item.price) > 0;
  const [fullUrl, setFullUrl] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);

  // Résout l'URL de lecture complète (admin = accès libre, même payant)
  useQuery({
    queryKey: ['admin-full-url', type, item.id],
    queryFn: async () => {
      setUrlLoading(true);
      try {
        let uri;
        if (video) uri = item.protected_file_uri || item.video_file_url;
        else uri = item.protected_file_uri || item.audio_file_url || (item.tracks && item.tracks[0]?.audio_file_url);
        if (!uri) { setFullUrl(null); return null; }
        let url = uri;
        if (!uri.startsWith('http')) {
          const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
          url = res.signed_url;
        }
        setFullUrl(url);
        return url;
      } finally {
        setUrlLoading(false);
      }
    },
    enabled: !!item.id,
  });

  const cover = video ? item.thumbnail_url : item.cover_url;
  const tracks = video ? [] : getReleaseTracks(item);
  const audioForShort = video ? fullUrl : (tracks[0]?.audio_file_url || item.audio_file_url || fullUrl);
  const shareLink = video
    ? item.youtube_url || ''
    : (item.spotify_url || item.apple_music_url || item.audiomack_url || item.youtube_url || '');
  const slug = buildEntitySlug(item.title, item.id);

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border/40 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1 text-primary">
          <ShieldCheck size={14} />
          <span className="text-[11px] font-mono uppercase tracking-widest">Accès admin — lecture libre</span>
        </div>
        <p className="font-heading font-bold text-sm truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.artist_name} {paid && <span className="text-yellow-500">· contenu payant (accès admin)</span>}</p>
        <div className="mt-3">
          {urlLoading ? <Loader2 size={16} className="animate-spin text-primary" /> :
           fullUrl ? <ProtectedPlayer url={fullUrl} isVideo={video} title={item.title} /> :
           (video ? item.youtube_url : (item.audio_file_url || (tracks[0]?.audio_file_url))) ? (
             <ProtectedPlayer url={(video ? item.youtube_url : (item.audio_file_url || tracks[0]?.audio_file_url))} isVideo={video} title={item.title} />
           ) : (
             <p className="text-xs text-muted-foreground">Aucun fichier hébergé sur KKD (lien externe uniquement).</p>
           )}
        </div>
        <Link to={video ? `/videos/${slug}` : `/musique/${slug}`} className="text-xs text-primary hover:underline mt-2 inline-block">
          Voir la page publique →
        </Link>
      </div>

      <div className="bg-card border border-border/40 rounded-2xl p-4">
        <ShortGenerator
          audioUrl={audioForShort}
          coverUrl={cover}
          title={item.title}
          artistName={item.artist_name}
          kind={video ? 'video' : 'release'}
          shareLink={shareLink}
          entityId={item.id}
        />
      </div>
    </div>
  );
}