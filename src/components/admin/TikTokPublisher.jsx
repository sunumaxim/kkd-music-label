import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Copy, Check, Music, Video, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
  </svg>
);

function generateCaption(type, item) {
  if (type === 'release') {
    const link = item.spotify_url || item.apple_music_url || item.audiomack_url || item.youtube_url || '';
    return `🎵 ${item.title} — ${item.artist_name}\n\n` +
      (item.description ? `${item.description}\n\n` : '') +
      (link ? `🎧 ${link}\n\n` : '') +
      `#KKDmusic #NouveautéMusicale #${item.artist_name?.replace(/\s+/g, '') || 'Music'} #${item.release_type || 'Music'} #Afrobeats #Rap`;
  }
  if (type === 'video') {
    return `🎬 ${item.title}${item.artist_name ? ` — ${item.artist_name}` : ''}\n\n` +
      (item.description ? `${item.description}\n\n` : '') +
      (item.youtube_url ? `▶️ ${item.youtube_url}\n\n` : '') +
      `#KKDmusic #ClipOfficiel ${item.artist_name ? `#${item.artist_name?.replace(/\s+/g, '')}` : ''} #Musique #Africa`;
  }
  if (type === 'event') {
    const dateStr = item.event_date ? new Date(item.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    return `📅 ${item.title}\n\n` +
      (dateStr ? `🗓️ ${dateStr}\n` : '') +
      (item.location ? `📍 ${item.location}${item.city ? `, ${item.city}` : ''}\n` : '') +
      (item.description ? `\n${item.description}\n` : '') +
      (item.ticket_url ? `\n🎟️ ${item.ticket_url}\n` : '') +
      `\n#KKDmusic #Concert #Live #${item.city?.replace(/\s+/g, '') || 'Événement'}`;
  }
  return '';
}

function ContentCard({ type, item, icon: Icon, label }) {
  const [copied, setCopied] = useState(false);
  const caption = generateCaption(type, item);
  const image = item.cover_url || item.thumbnail_url || item.image_url;

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const ytLink = item.youtube_url || (type === 'video' ? item.youtube_url : null);

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 flex gap-4">
      {image ? (
        <img src={image} alt={item.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon size={22} className="text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="font-heading font-bold text-sm truncate">{item.title || item.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.artist_name || item.city || ''} · <span className="capitalize">{label}</span>
          </p>
        </div>
        <pre className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2 whitespace-pre-wrap line-clamp-3 font-body">
          {caption}
        </pre>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={handleCopy} className={`gap-1.5 text-xs ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-black hover:bg-black/80'}`}>
            {copied ? <Check size={13} /> : <TikTokIcon />}
            {copied ? 'Copié !' : 'Copier pour TikTok'}
          </Button>
          {ytLink && (
            <Button size="sm" variant="outline" asChild className="text-xs gap-1.5">
              <a href={ytLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} /> Voir la vidéo
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'release', label: 'Sorties', icon: Music },
  { key: 'video', label: 'Vidéos', icon: Video },
  { key: 'event', label: 'Événements', icon: Calendar },
];

export default function TikTokPublisher() {
  const [activeTab, setActiveTab] = useState('release');

  const { data: releases = [] } = useQuery({
    queryKey: ['admin-releases'],
    queryFn: () => base44.entities.Release.list('-created_date', 50),
  });
  const { data: videos = [] } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: () => base44.entities.Video.list('-created_date', 50),
  });
  const { data: events = [] } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => base44.entities.Event.list('-event_date', 50),
  });

  const dataMap = { release: releases, video: videos, event: events };
  const items = dataMap[activeTab] || [];
  const currentTab = TABS.find(t => t.key === activeTab);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center text-white">
          <TikTokIcon />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg">Publication TikTok</h2>
          <p className="text-xs text-muted-foreground">Générez et copiez le contenu optimisé, puis collez-le dans l'app TikTok</p>
        </div>
      </div>

      {/* How to */}
      <div className="bg-muted/40 border border-border/50 rounded-xl p-4 mb-6 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground text-sm">📱 Comment publier sur TikTok :</p>
        <p>1. Cliquez <strong>"Copier pour TikTok"</strong> sur le contenu souhaité</p>
        <p>2. Ouvrez l'app TikTok, créez une vidéo ou un post</p>
        <p>3. Collez la caption copiée dans la description</p>
        <p>4. Publiez ! Les hashtags et liens sont déjà optimisés.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-black text-white' : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucun(e) {currentTab?.label?.toLowerCase()} disponible.</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <ContentCard
              key={item.id}
              type={activeTab}
              item={item}
              icon={currentTab?.icon || Music}
              label={currentTab?.label || ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}