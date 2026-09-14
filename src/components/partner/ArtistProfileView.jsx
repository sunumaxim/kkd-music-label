import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Instagram } from 'lucide-react';
import { ReleaseCard, VideoCard, PlaylistPlayer } from '@/components/shared/MusicPlayer';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import { isArtistCertified } from '@/services/artistCertification';

const STREAMING_LINKS = [
  { key: 'spotify_url', label: 'Spotify', color: 'text-green-400', bg: 'bg-green-500/10 hover:bg-green-500/20' },
  { key: 'apple_music_url', label: 'Apple Music', color: 'text-pink-400', bg: 'bg-pink-500/10 hover:bg-pink-500/20' },
  { key: 'audiomack_url', label: 'Audiomack', color: 'text-orange-400', bg: 'bg-orange-500/10 hover:bg-orange-500/20' },
  { key: 'deezer_url', label: 'Deezer', color: 'text-purple-400', bg: 'bg-purple-500/10 hover:bg-purple-500/20' },
  { key: 'soundcloud_url', label: 'SoundCloud', color: 'text-orange-500', bg: 'bg-orange-500/10 hover:bg-orange-500/20' },
  { key: 'youtube_url', label: 'YouTube', color: 'text-red-400', bg: 'bg-red-500/10 hover:bg-red-500/20' },
];

export default function ArtistProfileView({ artistId }) {
  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist-profile', artistId],
    queryFn: () => base44.entities.Artist.filter({ id: artistId }).then(r => r[0]),
    enabled: !!artistId,
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['artist-releases', artistId],
    queryFn: () => base44.entities.Release.filter({ artist_name: artist?.name }, '-release_date'),
    enabled: !!artist?.name,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['artist-videos', artistId],
    queryFn: () => base44.entities.Video.filter({ artist_name: artist?.name }, '-publish_date'),
    enabled: !!artist?.name,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Profil artiste non trouvé.</p>
      </div>
    );
  }

  const releasesWithSpotify = releases.filter(r => r.spotify_url);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50">
        <div className="h-28 bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-10">
            {artist.photo_url ? (
              <img src={artist.photo_url} alt={artist.name}
                className="w-20 h-20 rounded-xl object-cover border-4 border-background shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-primary/20 flex items-center justify-center border-4 border-background shrink-0 text-2xl font-bold text-primary">
                {artist.name[0]}
              </div>
            )}
            <div className="pb-1">
              <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
                <span>{artist.name}</span>
                {isArtistCertified(artist) && (
                  <VerifiedBadge
                    size={20}
                    interactive
                    artistName={artist.name}
                    labelName={artist.label || 'KKD Music'}
                  />
                )}
              </h2>
              {artist.genre && <p className="text-xs text-muted-foreground">{artist.genre}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {artist.biography && (
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-2">Biographie</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{artist.biography}</p>
        </div>
      )}

      {/* Streaming links */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-3">Plateformes de streaming</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STREAMING_LINKS.map(({ key, label, color, bg }) => artist[key] ? (
            <a key={key} href={artist[key]} target="_blank" rel="noreferrer"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bg} transition-colors text-xs font-medium ${color}`}>
              <ExternalLink size={12} /> {label}
            </a>
          ) : null)}
          {STREAMING_LINKS.every(({ key }) => !artist[key]) && (
            <p className="text-xs text-muted-foreground col-span-full">Aucun lien streaming renseigné.</p>
          )}
        </div>
      </div>

      {/* Réseaux sociaux */}
      {(artist.instagram_url || artist.tiktok_url) && (
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-3">Réseaux sociaux</p>
          <div className="flex flex-wrap gap-3">
            {artist.instagram_url && (
              <a href={artist.instagram_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors text-xs font-medium">
                <Instagram size={13} /> @{artist.instagram_username || 'Instagram'}
              </a>
            )}
            {artist.tiktok_url && (
              <a href={artist.tiktok_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 transition-colors text-xs font-medium">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
                @{artist.tiktok_username || 'TikTok'}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Informations de paiement */}
      {(artist.wave_number || artist.payout_phone) && (
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-3">Informations de paiement</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {artist.wave_number && (
              <div>
                <p className="text-[11px] text-muted-foreground">Numéro Wave</p>
                <p className="font-mono font-medium">{artist.wave_number}</p>
              </div>
            )}
            {artist.payout_phone && (
              <div>
                <p className="text-[11px] text-muted-foreground">Téléphone (Orange Money)</p>
                <p className="font-mono font-medium">{artist.payout_phone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Playlist player (Spotify) */}
      {releasesWithSpotify.length > 0 && (
        <PlaylistPlayer releases={releases} artistName={artist.name} />
      )}

      {/* Discographie */}
      {releases.length > 0 && (
        <div>
          <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-3">Discographie ({releases.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {releases.map(r => (
              <ReleaseCard key={r.id} release={r} allReleases={releases} />
            ))}
          </div>
        </div>
      )}

      {/* Vidéos */}
      {videos.length > 0 && (
        <div>
          <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-3">Vidéos ({videos.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {videos.map(v => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}