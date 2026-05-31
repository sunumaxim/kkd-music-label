import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Music, Youtube, Instagram, Facebook } from 'lucide-react';
import { StreamingLinks, SpotifyPlayer } from '../components/shared/StreamingEmbed';

export default function ArtistDetail() {
  const { id } = useParams();

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
      {/* Hero */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        {artist.photo_url ? (
          <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-card to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <Link to="/artistes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft size={16} /> Tous les artistes
          </Link>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold">{artist.name}</h1>
          {artist.genre && <p className="text-primary text-sm font-medium mt-1">{artist.genre}</p>}
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
            <div className="flex gap-3">
              {artist.instagram_url && (
                <a href={artist.instagram_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram size={20} />
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

        {/* Releases */}
        {releases.length > 0 && (
          <div>
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <Music size={18} className="text-primary" /> Discographie
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {releases.map((r) => (
                <div key={r.id} className="bg-card border border-border/50 rounded-xl overflow-hidden group">
                  {r.cover_url ? (
                    <img src={r.cover_url} alt={r.title} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center">
                      <Music size={32} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-heading font-bold text-sm truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{r.release_type?.replace('_', ' ')}</p>
                    <div className="mt-2">
                      <StreamingLinks
                        spotify={r.spotify_url}
                        youtube={r.youtube_url}
                        apple_music={r.apple_music_url}
                        audiomack={r.audiomack_url}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                if (!videoId) return null;
                return (
                  <div key={v.id} className="bg-card border border-border/50 rounded-xl overflow-hidden">
                    <div className="relative aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                        title={v.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-heading font-bold text-sm">{v.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}