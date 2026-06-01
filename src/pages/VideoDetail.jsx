import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Share2, User, Copy, Check, ExternalLink, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobileHeader from '@/components/mobile/MobileHeader';
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
};

export default function VideoDetail() {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);

  const { data: video, isLoading } = useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      const results = await base44.entities.Video.filter({ id });
      return results[0] || null;
    },
  });

  const { data: artist } = useQuery({
    queryKey: ['artist-by-name', video?.artist_name],
    queryFn: async () => {
      const results = await base44.entities.Artist.filter({ name: video.artist_name });
      return results[0] || null;
    },
    enabled: !!video?.artist_name,
  });

  const { data: relatedVideos = [] } = useQuery({
    queryKey: ['related-videos', video?.artist_name, id],
    queryFn: async () => {
      const all = await base44.entities.Video.filter({ artist_name: video.artist_name });
      return all.filter(v => v.id !== id).slice(0, 4);
    },
    enabled: !!video?.artist_name,
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: video?.title, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title={video.title} backPath="/videos" />

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-12">
        {/* Back desktop */}
        <Link to="/videos" className="hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} /> Toutes les vidéos
        </Link>

        {/* Video player */}
        {videoId && (
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

        {/* Title + share */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            {video.video_type && (
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1 block">
                {VIDEO_TYPE_LABELS[video.video_type] || video.video_type}
              </span>
            )}
            <h1 className="font-display text-2xl md:text-3xl font-extrabold leading-tight">{video.title}</h1>
            {video.publish_date && (
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(video.publish_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="shrink-0 gap-2"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
            {copied ? 'Lien copié !' : 'Partager'}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            {video.description && (
              <p className="text-muted-foreground leading-relaxed">{video.description}</p>
            )}

            {/* Share block */}
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Partager cette vidéo</p>
              <div className="flex flex-wrap gap-2">
                <ShareButton
                  label="Copier le lien"
                  icon={<Copy size={13} />}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  active={copied}
                />
                <ShareButton
                  label="WhatsApp"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(video.title + ' — ' + window.location.href)}`, '_blank')}
                  color="bg-green-500/10 text-green-400 border-green-500/20"
                />
                <ShareButton
                  label="Twitter / X"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(video.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                  color="bg-sky-500/10 text-sky-400 border-sky-500/20"
                />
                <ShareButton
                  label="Facebook"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  color="bg-blue-600/10 text-blue-400 border-blue-600/20"
                />
                {video.youtube_url && (
                  <a
                    href={video.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    <ExternalLink size={12} /> Voir sur YouTube
                  </a>
                )}
              </div>
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
      </div>
    </div>
  );
}

function ShareButton({ label, icon, onClick, color, active }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
        active
          ? 'bg-green-500/10 text-green-400 border-green-500/20'
          : color || 'bg-secondary text-muted-foreground border-border/50 hover:bg-secondary/80'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}