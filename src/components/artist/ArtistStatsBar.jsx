import React from 'react';
import { Users, Headphones, Disc3, Music2, Youtube } from 'lucide-react';

function compact(n) {
  if (!n || n < 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

/**
 * Barre de statistiques publique du profil artiste (style Spotify / YouTube Music).
 * Toutes les valeurs sont calculées en direct (écoutes, abonnés, morceaux…).
 */
export default function ArtistStatsBar({ followers, plays, tracks, albums, videos }) {
  const items = [
    { icon: Users, label: 'Abonnés', value: compact(followers) },
    { icon: Headphones, label: 'Écoutes', value: compact(plays) },
    { icon: Music2, label: 'Morceaux', value: compact(tracks) },
    { icon: Disc3, label: 'Albums', value: compact(albums) },
    { icon: Youtube, label: 'Vidéos', value: compact(videos) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-1.5">
          <Icon size={14} className="text-primary/80" />
          <span className="font-heading font-bold text-sm">{value}</span>
          <span className="text-[11px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}