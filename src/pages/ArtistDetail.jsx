import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { StreamingLinks } from '../components/shared/StreamingEmbed';

export default function ArtistDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const artistId = window.location.pathname.split('/').pop();

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', artistId],
    queryFn: async () => {
      const artists = await base44.entities.Artist.list();
      return artists.find(a => a.id === artistId);
    },
  });

  const { data: releases } = useQuery({
    queryKey: ['artist-releases', artist?.name],
    queryFn: () => base44.entities.Release.filter({ artist_name: artist.name }, '-release_date'),
    enabled: !!artist?.name,
    initialData: [],
  });

  const { data: videos } = useQuery({
    queryKey: ['artist-videos', artist?.name],
    queryFn: () => base44.entities.Video.filter({ artist_name: artist.name }, '-publish_date'),
    enabled: !!artist?.name,
    initialData: [],
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
        <Link to="/artistes" className="text-primary text-sm">Retour aux artistes</Link>
      </div>
    );
  }

  const socialLinks = [
    { url: artist.instagram_url, label: 'Instagram' },
    { url: artist.facebook_url, label: 'Facebook' },
    { url: artist.tiktok_url, label: 'TikTok' },
  ].filter(l => l.url);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-[50vh] md:h-[60vh]">
        {artist.photo_url ? (
          <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <Link to="/artistes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={14} /> Retour
            </Link>
            <h1 className="font-display text-4xl md:text-7xl font-extrabold tracking-tight">
              {artist.name}
            </h1>
            {artist.genre && (
              <p className="text-primary font-mono text-sm mt-2">{artist.genre}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {artist.biography && (
              <div>
                <h2 className="font-heading font-bold text-xl mb-4">Biographie</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{artist.biography}</p>
              </div>
            )}

            {releases.length > 0 && (
              <div>
                <h2 className="font-heading font-bold text-xl mb-4">Discographie</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {releases.map((r) => (
                    <div key={r.id} className="group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-card mb-2">
                        {r.cover_url ? (
                          <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-secondary flex items-center justify-center">
                            <span className="text-primary/30 font-display text-2xl">♪</span>
                          </div>
                        )}
                      </div>
                      <p className="font-heading text-sm font-bold truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{r.release_type?.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videos.length > 0 && (
              <div>
                <h2 className="font-heading font-bold text-xl mb-4">Clips Vidéo</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map((v) => {
                    const match = v.youtube_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
                    const thumb = match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
                    return (
                      <a key={v.id} href={v.youtube_url} target="_blank" rel="noopener noreferrer" className="group">
                        <div className="aspect-video rounded-lg overflow-hidden bg-card">
                          {thumb ? (
                            <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-secondary" />
                          )}
                        </div>
                        <p className="font-heading text-sm font-bold mt-2 group-hover:text-primary transition-colors">{v.title}</p>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 border border-border/50">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-primary mb-4">Écouter</h3>
              <StreamingLinks
                spotify={artist.spotify_url}
                youtube={artist.youtube_url}
                apple_music={artist.apple_music_url}
                audiomack={artist.audiomack_url}
              />
            </div>

            {socialLinks.length > 0 && (
              <div className="bg-card rounded-xl p-6 border border-border/50">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-primary mb-4">Réseaux sociaux</h3>
                <div className="space-y-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}