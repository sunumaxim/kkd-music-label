import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Music, Youtube, Instagram, Facebook,
  Share2, Check, Play, Disc3, Calendar, MapPin, ExternalLink
} from 'lucide-react';
import { StreamingLinks } from '../components/shared/StreamingEmbed';
import MobileHeader from '@/components/mobile/MobileHeader';
import ArtistSocialSync from '@/components/artist/ArtistSocialSync';
import ArtistTopTracks from '@/components/artist/ArtistTopTracks';
import ArtistGallery from '@/components/artist/ArtistGallery';
import ArtistInfoCard from '@/components/artist/ArtistInfoCard';
import ArtistReleasesCarousel from '@/components/artist/ArtistReleasesCarousel';

const VIDEO_TYPE_LABELS = {
  clip_officiel: 'Clip officiel',
  teaser: 'Teaser',
  interview: 'Interview',
  making_of: 'Making-of',
};

const VIDEO_TYPE_COLORS = {
  clip_officiel: 'bg-primary/10 text-primary',
  teaser: 'bg-blue-500/10 text-blue-400',
  interview: 'bg-purple-500/10 text-purple-400',
  making_of: 'bg-orange-500/10 text-orange-400',
};

export default function ArtistDetail() {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);
  const [videoFilter, setVideoFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('discographie');

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
    select: data => [...data].sort((a, b) => (b.release_date || '').localeCompare(a.release_date || '')),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['artist-videos', artist?.name],
    queryFn: () => base44.entities.Video.filter({ artist_name: artist?.name }),
    enabled: !!artist?.name,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['artist-events', artist?.name],
    queryFn: () => base44.entities.Event.list('-event_date'),
    enabled: !!artist?.name,
    select: data => data.filter(e =>
      e.title?.toLowerCase().includes(artist?.name?.toLowerCase()) ||
      e.description?.toLowerCase().includes(artist?.name?.toLowerCase())
    ).slice(0, 6),
  });

  const availableVideoTypes = [...new Set(videos.map(v => v.video_type).filter(Boolean))];
  const filteredVideos = videoFilter === 'all' ? videos : videos.filter(v => v.video_type === videoFilter);

  const tabs = [
    { id: 'discographie', label: 'Discographie', count: releases.length },
    { id: 'videos', label: 'Vidéos', count: videos.length },
    ...(events.length > 0 ? [{ id: 'concerts', label: 'Concerts', count: events.length }] : []),
    ...(artist?.biography ? [{ id: 'bio', label: 'Biographie' }] : []),
    ...(artist?.gallery?.length > 0 ? [{ id: 'galerie', label: 'Galerie' }] : []),
  ];

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

  const getYoutubeId = (url) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title={artist.name} backPath="/artistes" />

      {/* ── HERO ── */}
      <div className="relative h-64 md:h-[480px] overflow-hidden">
        {artist.photo_url ? (
          <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-card via-secondary to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back */}
        <Link
          to="/artistes"
          className="hidden md:inline-flex absolute top-6 left-6 items-center gap-2 text-sm text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 transition-colors"
        >
          <ArrowLeft size={14} /> Artistes
        </Link>

        {/* Share */}
        <button
          onClick={handleShare}
          className="absolute top-6 right-6 flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white text-sm font-medium transition-colors"
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          {copied ? 'Copié !' : 'Partager'}
        </button>

        {/* Identity */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-display text-3xl md:text-6xl font-extrabold tracking-tight">{artist.name}</h1>
            <div className="flex items-center flex-wrap gap-2 mt-2">
              {artist.genre && (
                <span className="bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/30">
                  {artist.genre}
                </span>
              )}
              {artist.label && (
                <span className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full border border-white/20">
                  {artist.label}
                </span>
              )}
              {artist.active_since && (
                <span className="text-white/60 text-xs">Actif depuis {artist.active_since}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="max-w-5xl mx-auto px-4">

        {/* ── STATS + SOCIAL BAR ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-b border-border/50">
          {/* Stats */}
          <div className="flex items-center gap-6">
            {releases.length > 0 && (
              <div className="flex items-center gap-2">
                <Disc3 size={15} className="text-primary" />
                <span className="text-sm font-bold">{releases.length}</span>
                <span className="text-sm text-muted-foreground">sortie{releases.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {videos.length > 0 && (
              <div className="flex items-center gap-2">
                <Play size={15} className="text-primary" />
                <span className="text-sm font-bold">{videos.length}</span>
                <span className="text-sm text-muted-foreground">vidéo{videos.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {events.length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-primary" />
                <span className="text-sm font-bold">{events.length}</span>
                <span className="text-sm text-muted-foreground">concert{events.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {artist.instagram_url && (
              <a href={artist.instagram_url} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-pink-400 hover:bg-pink-500/10 transition-all">
                <Instagram size={15} />
              </a>
            )}
            {artist.tiktok_url && (
              <a href={artist.tiktok_url} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                </svg>
              </a>
            )}
            {artist.facebook_url && (
              <a href={artist.facebook_url} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                <Facebook size={15} />
              </a>
            )}
            {artist.youtube_url && (
              <a href={artist.youtube_url} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all">
                <Youtube size={15} />
              </a>
            )}
            {artist.website_url && (
              <a href={artist.website_url} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        {/* ── CONTENT + SIDEBAR ── */}
        <div className="grid md:grid-cols-3 gap-8 py-8">

          {/* ── LEFT : TABS ── */}
          <div className="md:col-span-2 space-y-6">

            {/* Tab nav */}
            <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── TAB: DISCOGRAPHIE ── */}
            {activeTab === 'discographie' && (
              <div>
                {releases.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Disc3 size={40} className="mx-auto mb-3 opacity-20" />
                    <p>Aucune sortie disponible.</p>
                  </div>
                ) : (
                  <ArtistReleasesCarousel releases={releases} />
                )}
                <ArtistTopTracks artist={artist} />
              </div>
            )}

            {/* ── TAB: VIDEOS ── */}
            {activeTab === 'videos' && (
              <div className="space-y-4">
                {/* Filter bar */}
                {availableVideoTypes.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setVideoFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        videoFilter === 'all'
                          ? 'bg-primary text-white border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      Tous ({videos.length})
                    </button>
                    {availableVideoTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setVideoFilter(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          videoFilter === type
                            ? 'bg-primary text-white border-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {VIDEO_TYPE_LABELS[type] || type} ({videos.filter(v => v.video_type === type).length})
                      </button>
                    ))}
                  </div>
                )}

                {filteredVideos.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Youtube size={40} className="mx-auto mb-3 opacity-20" />
                    <p>Aucune vidéo disponible.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {filteredVideos.map(v => {
                      const videoId = getYoutubeId(v.youtube_url);
                      const thumb = v.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);
                      return (
                        <Link
                          key={v.id}
                          to={`/videos/${v.id}`}
                          className="bg-card border border-border/50 rounded-xl overflow-hidden group hover:border-primary/40 hover:shadow-lg transition-all"
                        >
                          <div className="relative aspect-video bg-secondary overflow-hidden">
                            {thumb ? (
                              <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Youtube size={32} className="text-muted-foreground/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                <Play size={18} className="text-white ml-1" fill="white" />
                              </div>
                            </div>
                            {v.video_type && (
                              <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${VIDEO_TYPE_COLORS[v.video_type] || 'bg-secondary text-foreground'}`}>
                                {VIDEO_TYPE_LABELS[v.video_type]}
                              </span>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="font-heading font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{v.title}</p>
                            {v.publish_date && (
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {new Date(v.publish_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: CONCERTS ── */}
            {activeTab === 'concerts' && (
              <div className="space-y-3">
                {events.map(e => (
                  <Link
                    key={e.id}
                    to={`/evenements/${e.id}`}
                    className="flex items-center gap-4 bg-card border border-border/50 rounded-xl p-4 hover:border-primary/40 transition-all group"
                  >
                    {e.event_date && (
                      <div className="text-center bg-primary/10 border border-primary/20 rounded-xl p-3 shrink-0 min-w-[60px]">
                        <p className="text-[10px] font-mono text-primary/70 uppercase">
                          {new Date(e.event_date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </p>
                        <p className="text-2xl font-display font-extrabold text-primary leading-none">
                          {new Date(e.event_date).getDate()}
                        </p>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm group-hover:text-primary transition-colors">{e.title}</p>
                      {(e.city || e.location) && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin size={11} />
                          {[e.city, e.location].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <ArrowLeft size={14} className="text-muted-foreground rotate-180 shrink-0" />
                  </Link>
                ))}
              </div>
            )}

            {/* ── TAB: BIOGRAPHIE ── */}
            {activeTab === 'bio' && (
              <div className="bg-card border border-border/50 rounded-2xl p-6">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">{artist.biography}</p>
              </div>
            )}

            {/* ── TAB: GALERIE ── */}
            {activeTab === 'galerie' && (
              <ArtistGallery gallery={artist.gallery} artistName={artist.name} />
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-5">
            {/* Streaming */}
            <StreamingLinks
              spotify={artist.spotify_url}
              youtube={artist.youtube_url}
              apple_music={artist.apple_music_url}
              audiomack={artist.audiomack_url}
            />

            {/* Info card */}
            <ArtistInfoCard artist={artist} />

            {/* Social sync */}
            <ArtistSocialSync artist={artist} />
          </div>
        </div>
      </div>
    </div>
  );
}