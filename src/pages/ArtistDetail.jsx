import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Music, Youtube, Instagram, Facebook, Share2, Copy, Check } from 'lucide-react';
import { EmbeddedPlayer } from '../components/shared/UniversalPlayer';
import { StreamingLinks } from '../components/shared/StreamingEmbed';
import MobileHeader from '@/components/mobile/MobileHeader';
import ArtistSocialSync from '@/components/artist/ArtistSocialSync';
import ArtistTopTracks from '@/components/artist/ArtistTopTracks';

export default function ArtistDetail() {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: artist?.name, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => base44.entities.Artist.filter({ id }),
    select: (data) => data[0],
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['artist-releases', artist?.name],
    queryFn: () => base44.entities.Release.filter({ artist_name: artist?.name }),
    enabled: !!artist?.name,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['artist-videos', artist?.name],
    queryFn: () => base44.entities.Video.filter({ artist_name: artist?.name }),
    enabled: !!artist?.name,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Artiste introuvable.</p>
        <Link to="/artistes" className="text-primary hover:underline">← Retour aux artistes</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title={artist.name} backPath="/artistes" />
      {/* Hero */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        {artist.photo_url ? (
          <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-card to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <Link to="/artistes" className="hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft size={16} /> Tous les artistes
          </Link>
          <div className="flex items-end gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-extrabold">{artist.name}</h1>
              {artist.genre && <p className="text-primary text-sm font-medium mt-1">{artist.genre}</p>}
            </div>
            <button
              onClick={handleShare}
              className="mb-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            >
              {copied ? <Check size={13} /> : <Share2 size={13} />}
              {copied ? 'Copié !' : 'Partager'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {/* Bio + Links */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {artist.biography && (
              <div>
                <h2 className="font-heading font-bold text-lg mb-3">Biographie</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{artist.biography}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <StreamingLinks
              spotify={artist.spotify_url}
              youtube={artist.youtube_url}
              apple_music={artist.apple_music_url}
              audiomack={artist.audiomack_url}
            />
            <div className="flex gap-3 flex-wrap">
              {artist.instagram_url && (
                <a href={artist.instagram_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-pink-400 transition-colors">
                  <Instagram size={20} />
                </a>
              )}
              {artist.tiktok_url && (
                <a href={artist.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
                </a>
              )}
              {artist.facebook_url && (
                <a href={artist.facebook_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook size={20} />
                </a>
              )}
              {artist.youtube_url && (
                <a href={artist.youtube_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Youtube size={20} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Top tracks dynamiques */}
        <ArtistTopTracks artist={artist} />

        {/* Releases */}
        {releases.length > 0 && (
          <div>
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <Music size={18} className="text-primary" /> Discographie
            </h2>
            <div className="space-y-4">
              {releases.map((r) => {
                const streamUrl = r.spotify_url || r.apple_music_url || r.audiomack_url || r.youtube_url;
                return (
                  <div key={r.id} className="bg-card border border-border/50 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      {r.cover_url ? (
                        <img src={r.cover_url} alt={r.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Music size={20} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-sm truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{r.release_type?.replace('_', ' ')} {r.release_date ? `· ${r.release_date.slice(0,4)}` : ''}</p>
                      </div>
                    </div>
                    {streamUrl && <EmbeddedPlayer url={streamUrl} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <div>
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <Youtube size={18} className="text-primary" /> Vidéos
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {videos.map((v) => {
                const match = v.youtube_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
                const videoId = match ? match[1] : null;
                const thumb = v.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);
                return (
                  <Link key={v.id} to={`/videos/${v.id}`} className="bg-card border border-border/50 rounded-xl overflow-hidden group hover:border-primary/40 transition-all block">
                    <div className="relative aspect-video overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : videoId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                          title={v.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-base ml-0.5">▶</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-heading font-bold text-sm group-hover:text-primary transition-colors">{v.title}</p>
                        {v.video_type && <p className="text-xs text-muted-foreground capitalize mt-0.5">{v.video_type.replace('_', ' ')}</p>}
                      </div>
                      <Share2 size={13} className="text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Social media sync */}
        <ArtistSocialSync artist={artist} />
      </div>
    </div>
  );
}