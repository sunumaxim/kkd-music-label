import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, User, ExternalLink, Instagram, Eye, Heart, ShoppingCart, Music2, Youtube, Users } from 'lucide-react';
import CommentsSection from '@/components/shared/CommentsSection';
import BuyCard from '@/components/marketplace/BuyCard';
import PromoAssetGenerator from '@/components/promo/PromoAssetGenerator';
import MobileHeader from '@/components/mobile/MobileHeader';
import PageMeta from '@/components/shared/PageMeta';
import ShareBar from '@/components/shared/ShareBar';
import LikeButton from '@/components/shared/LikeButton';
import { slugify, buildShareUrl, buildSharePreviewUrl, extractIdFromSlug, buildEntitySlug } from '@/lib/slugify';
import { resolveEntityBySlug } from '@/lib/resolveEntity';
import { getArtistYouTubeChannelInfo } from '@/services/youtubeChannelService';
import { motion } from 'framer-motion';

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

const VIDEO_TYPE_LABELS = {
  clip_officiel: 'Clip officiel',
  teaser: 'Teaser',
  interview: 'Interview',
  making_of: 'Making-of',
  replay_live: 'Replay live',
};

export default function VideoDetail() {
  const { id: slugParam } = useParams();
  const slug = slugify(slugParam);
  const legacyId = slugParam?.includes('--') ? extractIdFromSlug(slugParam) : null;
  const id = legacyId || slug;
  const queryClient = useQueryClient();

  const { data: video, isLoading } = useQuery({
    queryKey: ['video', id],
    queryFn: () => resolveEntityBySlug('Video', slugParam, 'title'),
    staleTime: 0,
  });

  const { data: artist } = useQuery({
    queryKey: ['artist-by-name', video?.artist_name],
    queryFn: async () => {
      const results = await base44.entities.Artist.filter({ name: video.artist_name });
      return results[0] || null;
    },
    enabled: !!video?.artist_name,
  });

  // Résolution de la chanson synchronisée / associée au clip
  const { data: linkedRelease } = useQuery({
    queryKey: ['video-linked-release', video?.id, video?.linked_release_id, video?.title, video?.artist_name],
    queryFn: async () => {
      // 1. Si un ID précis est déjà lié
      if (video?.linked_release_id) {
        const found = await base44.entities.Release.filter({ id: video.linked_release_id });
        if (found && found[0]) return found[0];
      }

      // 2. Recherche par correspondance titre / artiste (synchro automatique clip <-> chanson)
      if (video?.artist_name) {
        const artistReleases = await base44.entities.Release.filter({ artist_name: video.artist_name });
        if (artistReleases && artistReleases.length > 0) {
          const cleanVidTitle = (video.title || '')
            .toLowerCase()
            .replace(/\(.*?\)|\[.*?\]/g, '')
            .replace(/clip\s*officiel|official\s*video|music\s*video|visualizer|audio\s*officiel/gi, '')
            .trim();

          // Chercher une correspondance exacte ou forte
          const exact = artistReleases.find(r => {
            const cleanRelTitle = (r.title || '').toLowerCase().trim();
            return cleanRelTitle === cleanVidTitle ||
                   cleanRelTitle.includes(cleanVidTitle) ||
                   cleanVidTitle.includes(cleanRelTitle);
          });
          if (exact) return exact;

          // Si la vidéo a une URL YouTube commune avec la release
          if (video.youtube_url) {
            const byYt = artistReleases.find(r => r.youtube_url && r.youtube_url.trim() === video.youtube_url.trim());
            if (byYt) return byYt;
          }
        }
      }
      return null;
    },
    enabled: !!video,
  });

  // Métadonnées de chaîne YouTube (nombre d'abonnés & profil officiel de la chaîne)
  const { data: youtubeChannel } = useQuery({
    queryKey: ['youtube-channel-stats', video?.artist_name, artist?.youtube_url, artist?.youtube_subscribers],
    queryFn: () => getArtistYouTubeChannelInfo(video?.artist_name, artist?.youtube_url, artist),
    enabled: !!video?.artist_name,
    staleTime: 1000 * 60 * 30, // 30 minutes de cache
  });

  const shareUrl = video ? buildShareUrl('/videos', video.slug || video.title) : '';
  const sharePreviewUrl = video ? buildSharePreviewUrl('video', video.slug || slugify(video.title)) : '';

  // Increment views once per session
  useEffect(() => {
    if (!video) return;
    const key = `viewed_video_${video.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    base44.entities.Video.update(video.id, { views_count: (video.views_count || 0) + 1 });
  }, [video?.id]);

  const { data: relatedVideos = [] } = useQuery({
    queryKey: ['related-videos', video?.artist_name, id],
    queryFn: async () => {
      const all = await base44.entities.Video.filter({ artist_name: video.artist_name });
      return all.filter(v => v.id !== id).slice(0, 4);
    },
    enabled: !!video?.artist_name,
  });



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Vidéo introuvable.</p>
        <Link to="/videos" className="text-primary hover:underline">← Retour aux vidéos</Link>
      </div>
    );
  }

  const videoId = getYouTubeId(video.youtube_url);
  const effectivelyPaid = video.is_for_sale && Number(video.price) > 0;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={video.title}
        description={
          (effectivelyPaid ? `Prix: ${Number(video.price).toLocaleString('fr-FR')} F CFA — ` : '') +
          (video.description || `Regardez ${video.title} de ${video.artist_name} sur KKD Music.`)
        }
        image={video.thumbnail_url || (getYouTubeId(video.youtube_url) ? `https://img.youtube.com/vi/${getYouTubeId(video.youtube_url)}/maxresdefault.jpg` : null)}
        url={shareUrl}
        type="video.other"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnail_url,
          uploadDate: video.publish_date,
          contentUrl: shareUrl,
        }}
      />
      <MobileHeader title={video.title} backPath="/videos" />

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-12">
        {/* Back desktop */}
        <Link to="/videos" className="hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} /> Toutes les vidéos
        </Link>

        {/* Video player — lecture libre uniquement pour les vidéos gratuites */}
        {!effectivelyPaid && videoId && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden bg-black shadow-2xl mb-6"
          >
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </motion.div>
        )}
        {!effectivelyPaid && !videoId && video.video_file_url && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden bg-black shadow-2xl mb-6"
          >
            <div className="relative aspect-video">
              <video src={video.video_file_url} controls autoPlay className="absolute inset-0 w-full h-full bg-black" />
            </div>
          </motion.div>
        )}

        {/* Title + share */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            {video.video_type && (
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1 block">
                {VIDEO_TYPE_LABELS[video.video_type] || video.video_type}
              </span>
            )}
            <h1 className="font-display text-2xl md:text-3xl font-extrabold leading-tight">{video.title}</h1>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              {video.publish_date && (
                <p className="text-sm text-muted-foreground">
                  {new Date(video.publish_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {video.views_count > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Eye size={14} className="text-primary" />
                  {video.views_count.toLocaleString('fr-FR')} vue{video.views_count > 1 ? 's' : ''}
                </span>
              )}
              {(video.likes_count || 0) > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Heart size={14} className="text-primary" />
                  {video.likes_count.toLocaleString('fr-FR')} j'aime
                </span>
              )}
              {(video.sales_count || 0) > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ShoppingCart size={14} className="text-primary" />
                  {video.sales_count} achat{video.sales_count > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Achat exclusif */}
            <BuyCard item={video} itemType="video" />

            {video.is_for_sale && (
              <PromoAssetGenerator
                coverUrl={video.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null)}
                title={video.title}
                artistName={video.artist_name}
                kind="video"
              />
            )}

            {/* Chanson associée / synchronisée au clip */}
            {linkedRelease && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {linkedRelease.cover_url ? (
                    <img
                      src={linkedRelease.cover_url}
                      alt={linkedRelease.title}
                      className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <Music2 size={24} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-primary flex items-center gap-1">
                      <Music2 size={12} /> Chanson synchronisée
                    </span>
                    <h3 className="font-heading font-bold text-sm text-foreground truncate mt-0.5">
                      {linkedRelease.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {linkedRelease.artist_name || video.artist_name}
                      {linkedRelease.release_type ? ` · ${linkedRelease.release_type.toUpperCase()}` : ''}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/musique/${buildEntitySlug(linkedRelease.title, linkedRelease.id)}`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <span>Écouter le morceau</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            )}

            {/* Description */}
            {video.description && (
              <p className="text-muted-foreground leading-relaxed">{video.description}</p>
            )}

            {/* Profil YouTube officiel de l'artiste & Abonnés en bas de la fiche */}
            <div className="rounded-xl border border-red-500/20 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
                  <Youtube size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-bold text-sm text-foreground">
                      {youtubeChannel?.channelTitle || video.artist_name}
                    </p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold uppercase">
                      YouTube Officiel
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Users size={12} className="text-red-400" />
                    <span>
                      {youtubeChannel?.subscribersCount
                        ? `${youtubeChannel.subscribersCount} abonnés sur YouTube`
                        : 'Chaîne officielle certifiée'}
                    </span>
                  </p>
                </div>
              </div>

              <a
                href={youtubeChannel?.channelUrl || video.youtube_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(video.artist_name)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shrink-0 shadow-sm"
              >
                <Youtube size={14} />
                <span>Voir le profil YouTube</span>
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Share block */}
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Partager cette vidéo</p>
              <div className="flex items-center gap-3">
                <LikeButton targetType="video" targetId={video.id} title={video.title} artistName={video.artist_name} coverUrl={video.thumbnail_url} size={22} />
                <ShareBar title={video.title} url={sharePreviewUrl} />
              </div>
              {video.youtube_url && !effectivelyPaid && (
                <a href={video.youtube_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 transition-colors mt-1">
                  <ExternalLink size={12} /> Voir sur YouTube
                </a>
              )}
            </div>

            {/* Related videos */}
            {relatedVideos.length > 0 && (
              <div>
                <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Autres vidéos de {video.artist_name}</p>
                <div className="grid grid-cols-2 gap-3">
                  {relatedVideos.map((v) => {
                    const vid = getYouTubeId(v.youtube_url);
                    const thumb = v.thumbnail_url || (vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null);
                    return (
                      <Link key={v.id} to={`/videos/${v.id}`} className="group block">
                        <div className="aspect-video rounded-xl overflow-hidden bg-card mb-2 relative">
                          {thumb && <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                          <div className="absolute inset-0 bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-white text-sm ml-0.5">▶</span>
                            </div>
                          </div>
                        </div>
                        <p className="font-heading font-bold text-xs truncate group-hover:text-primary transition-colors">{v.title}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Artist */}
          <div className="space-y-4">
            {artist ? (
              <Link
                to={`/artistes/${artist.id}`}
                className="block bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/40 transition-all group"
              >
                {artist.photo_url && (
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={artist.photo_url}
                      alt={artist.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-1">Artiste</p>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-primary shrink-0" />
                    <p className="font-heading font-bold text-sm">{artist.name}</p>
                  </div>
                  {artist.genre && <p className="text-xs text-primary mt-1">{artist.genre}</p>}
                  {artist.biography && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">{artist.biography}</p>
                  )}
                  <div className="mt-3 text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Voir le profil <ArrowLeft size={11} className="rotate-180" />
                  </div>
                </div>
              </Link>
            ) : video.artist_name ? (
              <div className="bg-card border border-border/50 rounded-xl p-4">
                <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-2">Artiste</p>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" />
                  <p className="font-heading font-bold text-sm">{video.artist_name}</p>
                </div>
              </div>
            ) : null}

            {/* YouTube Channel link */}
            {(youtubeChannel?.channelUrl || artist?.youtube_url) && (
              <a
                href={youtubeChannel?.channelUrl || artist?.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-gradient-to-r from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20 transition-all"
              >
                <Youtube size={18} className="text-red-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-red-400">YouTube</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {youtubeChannel?.subscribersCount
                      ? `${youtubeChannel.subscribersCount} abonnés`
                      : `@${artist?.name || video?.artist_name}`}
                  </p>
                </div>
                <ExternalLink size={12} className="ml-auto text-muted-foreground shrink-0" />
              </a>
            )}

            {/* Instagram link */}
            {artist?.instagram_url && (
              <a
                href={artist.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-pink-500/20 bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 transition-all"
              >
                <Instagram size={18} className="text-pink-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-pink-300">Instagram</p>
                  <p className="text-xs text-muted-foreground">@{artist.instagram_username || artist.name}</p>
                </div>
                <ExternalLink size={12} className="ml-auto text-muted-foreground" />
              </a>
            )}

            {/* TikTok link */}
            {artist?.tiktok_url && (
              <a
                href={artist.tiktok_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-500/20 bg-slate-500/10 hover:bg-slate-500/20 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-slate-300 shrink-0">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                </svg>
                <div>
                  <p className="text-sm font-bold text-slate-200">TikTok</p>
                  <p className="text-xs text-muted-foreground">@{artist.tiktok_username || artist.name}</p>
                </div>
                <ExternalLink size={12} className="ml-auto text-muted-foreground" />
              </a>
            )}
          </div>
        </div>

        {/* Comments */}
        <CommentsSection
          entityType="video"
          entity={video}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['video', id] })}
        />
      </div>
    </div>
  );
}