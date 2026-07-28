import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Youtube, Share2, Check, Disc3, Calendar, MapPin, ChevronRight,
  Play, Eye, Heart, ShoppingCart, Newspaper,
} from 'lucide-react';
import { StreamingLinks } from '@/components/shared/StreamingEmbed';
import MobileHeader from '@/components/mobile/MobileHeader';
import PageMeta from '@/components/shared/PageMeta';
import ArtistSocialSync from '@/components/artist/ArtistSocialSync';
import ArtistGallery from '@/components/artist/ArtistGallery';
import ArtistInfoCard from '@/components/artist/ArtistInfoCard';
import SimilarArtists from '@/components/artist/SimilarArtists';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import ArtistActionBar from '@/components/artist/ArtistActionBar';
import ArtistPopularList from '@/components/artist/ArtistPopularList';
import CarouselRow from '@/components/home/CarouselRow';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { slugify, buildEntitySlug, buildSharePreviewUrl, buildShareUrl, extractIdFromSlug } from '@/lib/slugify';

function compact(n) {
  if (!n || n < 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

const TABS = [
  { key: 'aperçu', label: 'Aperçu' },
  { key: 'morceaux', label: 'Morceaux' },
  { key: 'albums', label: 'Albums' },
  { key: 'videos', label: 'Vidéos' },
  { key: 'annonces', label: 'Annonces' },
  { key: 'evenements', label: 'Événements' },
];

export default function ArtistDetail() {
  const { id: slugParam } = useParams();
  const navigate = useNavigate();
  const slug = slugify(slugParam);
  const legacyId = slugParam?.includes('--') ? extractIdFromSlug(slugParam) : null;
  const id = legacyId || slug;
  const player = usePlayer();
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('aperçu');
  const [videoFilter, setVideoFilter] = useState('all');

  const handleShare = () => {
    if (!artist) return;
    const url = buildShareUrl('/artistes', artist.slug || artist.name);
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
    queryFn: async () => {
      if (legacyId) return (await base44.entities.Artist.filter({ id: legacyId }))[0] || null;
      const bySlug = (await base44.entities.Artist.filter({ slug }))[0];
      if (bySlug) return bySlug;
      const all = await base44.entities.Artist.list('-created_date', 500);
      const found = all.find((a) => slugify(a.name) === slug);
      if (found) { base44.entities.Artist.update(found.id, { slug }).catch(() => {}); return found; }
      return null;
    },
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

  const { data: news = [] } = useQuery({
    queryKey: ['artist-news', artist?.name],
    queryFn: () => base44.entities.News.list('-publish_date', 30),
    enabled: !!artist?.name,
    select: (data) =>
      data
        .filter(
          (n) =>
            (n.tags || []).some((t) => t.toLowerCase().includes(artist.name.toLowerCase())) ||
            `${n.title} ${n.excerpt || ''} ${n.content || ''}`.toLowerCase().includes(artist.name.toLowerCase())
        )
        .slice(0, 6),
  });

  const { data: followers = 0 } = useQuery({
    queryKey: ['artist-followers-count', artist?.id],
    queryFn: async () => (await base44.entities.ArtistFollow.filter({ artist_id: artist.id })).length,
    enabled: !!artist?.id,
  });

  const availableVideoTypes = [...new Set(videos.map((v) => v.video_type).filter(Boolean))];
  const filteredVideos = videoFilter === 'all' ? videos : videos.filter((v) => v.video_type === videoFilter);
  const albums = releases.filter((r) => ['album', 'ep', 'projet_special'].includes(r.release_type));
  const singles = releases.filter((r) => r.release_type === 'single' || !r.release_type);
  const totalPlays =
    releases.reduce((s, r) => s + (r.plays_count || 0), 0) +
    videos.reduce((s, v) => s + (v.plays_count || 0) + (v.views_count || 0), 0);

  const popular = useMemo(
    () =>
      [...releases]
        .sort((a, b) => (b.plays_count || 0) + (b.likes_count || 0) - ((a.plays_count || 0) + (a.likes_count || 0)))
        .slice(0, 10),
    [releases]
  );
  const firstPlayable = popular.find((r) => getReleaseTracks(r).length);
  const firstTracks = firstPlayable ? getReleaseTracks(firstPlayable) : [];
  const firstIsCurrent = firstTracks.some((t) => t.key === player.current?.key);
  const firstPlaying = firstIsCurrent && player.isPlaying;

  const playFirst = () => {
    if (!firstTracks.length) return;
    if (firstIsCurrent) player.togglePlay();
    else player.playQueue(firstTracks, 0);
  };
  const shufflePlay = () => {
    const queue = popular.flatMap(getReleaseTracks);
    if (!queue.length) return;
    player.playQueue([...queue].sort(() => Math.random() - 0.5), 0);
  };

  const getYoutubeId = (url) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : null;
  };

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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PageMeta
        title={artist.name}
        description={artist.biography?.slice(0, 160) || `${artist.genre || 'Artiste'} sur KKD Music.`}
        image={artist.photo_url}
        url={buildShareUrl('/artistes', artist.slug || artist.name)}
        type="profile"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'MusicGroup',
          name: artist.name,
          image: artist.photo_url,
          genre: artist.genre,
          url: buildShareUrl('/artistes', artist.slug || artist.name),
          sameAs: [artist.spotify_url, artist.youtube_url, artist.apple_music_url, artist.instagram_url, artist.facebook_url, artist.tiktok_url].filter(Boolean),
        }}
      />
      <MobileHeader title={artist.name} backPath="/artistes" />

      {/* ── HERO ── */}
      <div className="relative h-64 md:h-[420px] overflow-hidden">
        {artist.cover_url ? (
          <img src={artist.cover_url} alt="" className="w-full h-full object-cover object-center" />
        ) : artist.photo_url ? (
          <img src={artist.photo_url} alt="" className="w-full h-full object-cover object-center scale-110 blur-md opacity-70" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-card to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        <Link
          to="/artistes"
          className="hidden md:inline-flex absolute top-6 left-6 items-center gap-2 text-sm text-white/80 hover:text-white bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 transition-colors z-10"
        >
          <ArrowLeft size={14} /> Artistes
        </Link>

        <button
          onClick={handleShare}
          className="absolute top-6 right-6 flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white text-sm font-medium transition-colors z-10"
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          {copied ? 'Copié !' : 'Partager'}
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 max-w-full">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight break-words leading-tight">
              {artist.name}
            </h1>
            {artist.is_verified && <VerifiedBadge size={26} />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {compact(followers)} abonné{followers > 1 ? 's' : ''} · {compact(totalPlays)} écoutes
          </p>
        </div>
      </div>

      {/* ── CORPS ── */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <ArtistActionBar
          artist={artist}
          onPlay={playFirst}
          onShuffle={shufflePlay}
          isPlaying={firstPlaying}
          canPlay={firstTracks.length > 0}
          onMore={() => navigate('/mon-espace')}
        />

        {/* Onglets */}
        <div className="flex items-center gap-5 sm:gap-6 border-b border-border/40 mb-4 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative pb-3 text-sm font-bold whitespace-nowrap transition-colors ${
                tab === t.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>

        {/* APERÇU */}
        {tab === 'aperçu' && (
          <>
            <ArtistPopularList releases={popular} max={5} />

            {artist.biography && (
              <section className="py-6 border-t border-border/30">
                <h2 className="font-heading font-bold text-xl mb-3">Biographie</h2>
                <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line line-clamp-6">{artist.biography}</p>
              </section>
            )}

            <div className="py-2">
              <StreamingLinks
                spotify={artist.spotify_url}
                youtube={artist.youtube_url}
                apple_music={artist.apple_music_url}
                audiomack={artist.audiomack_url}
                deezer={artist.deezer_url}
                soundcloud={artist.soundcloud_url}
              />
            </div>

            <section className="py-6 border-t border-border/30">
              <SimilarArtists genre={artist.genre} artistId={artist.id} />
            </section>
          </>
        )}

        {/* MORCEAUX */}
        {tab === 'morceaux' && (
          <>
            <ArtistPopularList releases={releases} max={releases.length} />
            <div className="py-6">
              <StreamingLinks
                spotify={artist.spotify_url}
                youtube={artist.youtube_url}
                apple_music={artist.apple_music_url}
                audiomack={artist.audiomack_url}
                deezer={artist.deezer_url}
                soundcloud={artist.soundcloud_url}
              />
            </div>
          </>
        )}

        {/* ALBUMS */}
        {tab === 'albums' && (
          <section className="py-2">
            {albums.length > 0 ? (
              <>
                <h2 className="font-heading font-bold text-xl mb-3">Discographie</h2>
                <CarouselRow>
                  {albums.map((r) => (
                    <div key={r.id} className="snap-start shrink-0 w-44 md:w-48">
                      <Link to={`/musique/${buildEntitySlug(r.title, r.id)}`} className="group block">
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-card mb-2 shadow-lg shadow-black/20">
                          {r.cover_url ? (
                            <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Disc3 size={32} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Aucun album publié.</p>
                {singles.length > 0 && (
                  <button onClick={() => setTab('morceaux')} className="mt-3 text-primary text-sm hover:underline">
                    Voir les singles
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* VIDÉOS */}
        {tab === 'videos' && (
          <section className="py-2">
            {videos.length > 0 ? (
              <>
                {availableVideoTypes.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setVideoFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        videoFilter === 'all' ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      Tous ({videos.length})
                    </button>
                    {availableVideoTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setVideoFilter(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          videoFilter === type ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {type.replace('_', ' ')} ({videos.filter((v) => v.video_type === type).length})
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
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Youtube size={32} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Aucune vidéo disponible.</p>
              </div>
            )}
          </section>
        )}

        {/* ANNONCES */}
        {tab === 'annonces' && (
          <section className="py-2">
            {news.length > 0 ? (
              <div className="space-y-3">
                {news.map((n) => (
                  <Link
                    key={n.id}
                    to={`/actualites/${n.id}`}
                    className="flex gap-3 bg-card border border-border/40 rounded-2xl p-3 hover:border-primary/40 transition-all group"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary shrink-0">
                      {n.image_url ? (
                        <img src={n.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper size={22} className="text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-primary">{n.category || 'nouveauté'}</span>
                      <p className="font-heading font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{n.title}</p>
                      {n.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.excerpt}</p>}
                      {n.publish_date && (
                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                          {new Date(n.publish_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Newspaper size={32} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Aucune actualité pour cet artiste.</p>
              </div>
            )}
          </section>
        )}

        {/* ÉVÉNEMENTS */}
        {tab === 'evenements' && (
          <section className="py-2">
            {events.length > 0 ? (
              <>
                <div className="space-y-3">
                  {events.map((e) => (
                    <Link
                      key={e.id}
                      to={`/evenements/${buildEntitySlug(e.title, e.id)}`}
                      className="flex items-center gap-3 sm:gap-4 bg-card border border-border/40 rounded-2xl p-3 sm:p-4 hover:border-primary/40 transition-all group"
                    >
                      {e.event_date && (
                        <div className="text-center bg-secondary border border-border/40 rounded-xl p-2.5 sm:p-3 shrink-0 min-w-[56px]">
                          <p className="text-[10px] font-mono text-muted-foreground uppercase">
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
                        {e.event_date && (
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                            {new Date(e.event_date).toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </div>
                <Link
                  to="/evenements"
                  className="mt-5 inline-flex items-center justify-center w-full px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:border-foreground/60 transition-colors"
                >
                  Voir tous les événements
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar size={32} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Aucun événement à venir.</p>
              </div>
            )}
          </section>
        )}

        {/* À propos (commun) */}
        <section className="py-6 border-t border-border/30 space-y-5">
          <ArtistInfoCard artist={artist} />
          <ArtistSocialSync artist={artist} />
          {artist.gallery?.length > 0 && <ArtistGallery gallery={artist.gallery} artistName={artist.name} />}
        </section>
      </div>
    </div>
  );
}