import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Youtube, Instagram, Facebook, BadgeCheck, Share2, Check, Play,
  Disc3, Calendar, MapPin, ExternalLink, Eye, Heart, ShoppingCart,
} from 'lucide-react';
import { StreamingLinks } from '@/components/shared/StreamingEmbed';
import MobileHeader from '@/components/mobile/MobileHeader';
import PageMeta from '@/components/shared/PageMeta';
import ArtistSocialSync from '@/components/artist/ArtistSocialSync';
import ArtistGallery from '@/components/artist/ArtistGallery';
import ArtistInfoCard from '@/components/artist/ArtistInfoCard';
import SimilarArtists from '@/components/artist/SimilarArtists';
import ArtistPopularTracks from '@/components/artist/ArtistPopularTracks';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import FollowButton from '@/components/artist/FollowButton';
import CarouselRow from '@/components/home/CarouselRow';
import { buildEntitySlug, buildSharePreviewUrl, buildShareUrl, extractIdFromSlug } from '@/lib/slugify';

const VIDEO_TYPE_LABELS = {
  clip_officiel: 'Clip officiel',
  teaser: 'Teaser',
  interview: 'Interview',
  making_of: 'Making-of',
  replay_live: 'Replay live',
};

const VIDEO_TYPE_COLORS = {
  clip_officiel: 'bg-primary/10 text-primary',
  teaser: 'bg-blue-500/10 text-blue-400',
  interview: 'bg-purple-500/10 text-purple-400',
  making_of: 'bg-orange-500/10 text-orange-400',
};

function SectionHeader({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2">
        {Icon && <Icon size={18} className="text-primary" />}
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-xs font-mono text-muted-foreground/60">{count}</span>
      )}
    </div>
  );
}

export default function ArtistDetail() {
  const { id: slugParam } = useParams();
  const id = extractIdFromSlug(slugParam);
  const [copied, setCopied] = useState(false);
  const [videoFilter, setVideoFilter] = useState('all');

  const handleShare = () => {
    if (!artist) return;
    const url = buildSharePreviewUrl('artist', buildEntitySlug(artist.name, artist.id), buildShareUrl('/artistes', artist.name, artist.id));
    if (navigator.share) {
      navigator.share({ title: artist.name, url });
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
    select: (data) =>
      [...data].sort((a, b) => (b.release_date || '').localeCompare(a.release_date || '')),
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
    select: (data) =>
      data
        .filter(
          (e) =>
            (e.artist_name && e.artist_name.toLowerCase() === artist?.name?.toLowerCase()) ||
            (!e.artist_name && (e.title?.toLowerCase().includes(artist?.name?.toLowerCase()) ||
              e.description?.toLowerCase().includes(artist?.name?.toLowerCase())))
        )
        .filter((e) => !e.published_status || e.published_status === 'approuve')
        .slice(0, 6),
  });

  const availableVideoTypes = [...new Set(videos.map((v) => v.video_type).filter(Boolean))];
  const filteredVideos = videoFilter === 'all' ? videos : videos.filter((v) => v.video_type === videoFilter);

  const albums = releases.filter((r) => ['album', 'ep', 'projet_special'].includes(r.release_type));
  const totalPlays =
    releases.reduce((s, r) => s + (r.plays_count || 0), 0) +
    videos.reduce((s, v) => s + (v.plays_count || 0) + (v.views_count || 0), 0);

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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PageMeta
        title={artist.name}
        description={artist.biography?.slice(0, 160) || `${artist.genre || 'Artiste'} sur KKD Music.`}
        image={artist.photo_url}
        type="profile"
      />
      <MobileHeader title={artist.name} backPath="/artistes" />

      {/* ── HERO ── */}
      <div className="relative h-72 md:h-[440px] overflow-hidden max-w-full">
        {artist.photo_url ? (
          <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-card via-secondary to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <Link
          to="/artistes"
          className="hidden md:inline-flex absolute top-6 left-6 items-center gap-2 text-sm text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 transition-colors"
        >
          <ArrowLeft size={14} /> Artistes
        </Link>

        <button
          onClick={handleShare}
          className="absolute top-6 right-6 flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white text-sm font-medium transition-colors"
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          {copied ? 'Copié !' : 'Partager'}
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 max-w-full">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl md:text-6xl font-extrabold tracking-tight break-words leading-tight">
              {artist.name}
            </h1>
            {artist.is_verified && <VerifiedBadge size={30} />}
          </div>
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
          <FollowButton artistId={artist.id} artistName={artist.name} variant="hero" />
        </div>
      </div>

      {/* ── CORPS ── */}
      <div className="max-w-3xl mx-auto px-4 pb-16">

        {/* Chanson populaire + actions */}
        <ArtistPopularTracks releases={releases} artist={artist} totalPlays={totalPlays} />

        {/* Albums */}
        {albums.length > 0 && (
          <section className="py-6 border-t border-border/30">
            <SectionHeader icon={Disc3} title="Albums" count={albums.length} />
            <CarouselRow>
              {albums.map((r) => (
                <div key={r.id} className="snap-start shrink-0 w-44 md:w-48">
                  <Link to={`/musique/${buildEntitySlug(r.title, r.id)}`} className="group block">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-card mb-2 shadow-lg shadow-black/20">
                      {r.cover_url ? (
                        <img
                          src={r.cover_url}
                          alt={r.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc3 size={32} className="text-primary/25" />
                        </div>
                      )}
                    </div>
                    <p className="font-heading font-bold text-sm truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.release_type === 'ep' ? 'EP' : r.release_type === 'projet_special' ? 'Projet spécial' : 'Album'}
                      {r.release_date ? ` • ${new Date(r.release_date).getFullYear()}` : ''}
                    </p>
                  </Link>
                </div>
              ))}
            </CarouselRow>
          </section>
        )}

        {/* Streaming plateformes */}
        <div className="py-6 border-t border-border/30">
          <StreamingLinks
            spotify={artist.spotify_url}
            youtube={artist.youtube_url}
            apple_music={artist.apple_music_url}
            audiomack={artist.audiomack_url}
            deezer={artist.deezer_url}
            soundcloud={artist.soundcloud_url}
          />
        </div>

        {/* Vidéos */}
        {videos.length > 0 && (
          <section className="py-6 border-t border-border/30">
            <SectionHeader icon={Youtube} title="Vidéos" count={videos.length} />

            {availableVideoTypes.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
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
                {availableVideoTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setVideoFilter(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      videoFilter === type
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {VIDEO_TYPE_LABELS[type] || type} ({videos.filter((v) => v.video_type === type).length})
                  </button>
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {filteredVideos.map((v) => {
                const videoId = getYoutubeId(v.youtube_url);
                const thumb = v.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);
                return (
                  <Link
                    key={v.id}
                    to={`/videos/${v.id}`}
                    className="bg-card border border-border/40 rounded-2xl overflow-hidden group hover:border-primary/40 hover:shadow-md transition-all"
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
                    <div className="p-3 min-w-0">
                      <p className="font-heading font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{v.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye size={11} /> {v.views_count || 0}</span>
                        <span className="flex items-center gap-1"><Heart size={11} className="text-primary/70" /> {v.likes_count || 0}</span>
                        {(v.sales_count || 0) > 0 && (
                          <span className="flex items-center gap-1"><ShoppingCart size={11} className="text-primary/70" /> {v.sales_count}</span>
                        )}
                        {v.publish_date && (
                          <span className="ml-auto">{new Date(v.publish_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Concerts & événements */}
        {events.length > 0 && (
          <section className="py-6 border-t border-border/30">
            <SectionHeader icon={Calendar} title="Prochains événements" count={events.length} />
            <div className="space-y-3">
              {events.map((e) => (
                <Link
                  key={e.id}
                  to={`/evenements/${buildEntitySlug(e.title, e.id)}`}
                  className="flex items-center gap-3 sm:gap-4 bg-card border border-border/40 rounded-2xl p-3 sm:p-4 hover:border-primary/40 transition-all group"
                >
                  {e.event_date && (
                    <div className="text-center bg-primary/10 border border-primary/20 rounded-xl p-2.5 sm:p-3 shrink-0 min-w-[56px]">
                      <p className="text-[10px] font-mono text-primary/70 uppercase">
                        {new Date(e.event_date).toLocaleDateString('fr-FR', { month: 'short' })}
                      </p>
                      <p className="text-xl sm:text-2xl font-display font-extrabold text-primary leading-none">
                        {new Date(e.event_date).getDate()}
                      </p>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm group-hover:text-primary transition-colors truncate">{e.title}</p>
                    {(e.city || e.location) && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{[e.city, e.location].filter(Boolean).join(' · ')}</span>
                      </p>
                    )}
                  </div>
                  <ArrowLeft size={14} className="text-muted-foreground rotate-180 shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Biographie */}
        {artist.biography && (
          <section className="py-6 border-t border-border/30">
            <SectionHeader title="Biographie" />
            <div className="bg-card border border-border/40 rounded-2xl p-5">
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{artist.biography}</p>
            </div>
          </section>
        )}

        {/* Galerie */}
        {artist.gallery?.length > 0 && (
          <section className="py-6 border-t border-border/30">
            <SectionHeader title="Galerie" />
            <ArtistGallery gallery={artist.gallery} artistName={artist.name} />
          </section>
        )}

        {/* Infos & sync réseaux */}
        <section className="py-6 border-t border-border/30 space-y-5">
          <ArtistInfoCard artist={artist} />
          <ArtistSocialSync artist={artist} />
        </section>

        {/* Recommandations */}
        <section className="py-6 border-t border-border/30">
          <SimilarArtists genre={artist.genre} artistId={artist.id} />
        </section>
      </div>
    </div>
  );
}