import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, X, Eye, ExternalLink } from 'lucide-react';
import PageMeta from '@/components/shared/PageMeta';

const VIDEO_TYPES = [
  { value: 'all', label: 'Tout' },
  { value: 'clip_officiel', label: 'Clips' },
  { value: 'teaser', label: 'Teasers' },
  { value: 'interview', label: 'Interviews' },
  { value: 'making_of', label: 'Making-of' },
];

const TYPE_COLORS = {
  clip_officiel: 'bg-primary/80 text-white',
  teaser: 'bg-blue-500/80 text-white',
  interview: 'bg-purple-500/80 text-white',
  making_of: 'bg-orange-500/80 text-white',
};

const TYPE_LABELS = {
  clip_officiel: 'Clip',
  teaser: 'Teaser',
  interview: 'Interview',
  making_of: 'Making-of',
};

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

function VideoCard({ video, index }) {
  const [playing, setPlaying] = useState(false);
  const videoId = getYouTubeId(video.youtube_url);
  const thumbnail = video.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="bg-card border border-border/50 rounded-2xl overflow-hidden group hover:border-primary/30 transition-all"
    >
      {/* Thumbnail / Player */}
      <div className="relative aspect-video bg-secondary overflow-hidden">
        <AnimatePresence mode="wait">
          {playing && videoId ? (
            <motion.iframe
              key="player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <motion.div
              key="thumb"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play size={32} className="text-muted-foreground/20" />
                </div>
              )}
              {/* Play overlay */}
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl">
                  <Play size={20} className="text-white ml-1" fill="white" />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badges */}
        {video.video_type && !playing && (
          <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[video.video_type] || 'bg-secondary text-foreground'}`}>
            {TYPE_LABELS[video.video_type] || video.video_type}
          </span>
        )}
        {playing && (
          <button
            onClick={() => setPlaying(false)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10"
          >
            <X size={14} />
          </button>
        )}
        {video.is_featured && !playing && (
          <span className="absolute top-2 right-2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full">⭐</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-heading font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <div>
            {video.artist_name && (
              <p className="text-xs text-muted-foreground">{video.artist_name}</p>
            )}
            {video.publish_date && (
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {new Date(video.publish_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {video.views_count > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-mono">
                <Eye size={10} /> {video.views_count.toLocaleString('fr-FR')}
              </span>
            )}
            <Link
              to={`/videos/${video.id}`}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Page dédiée"
            >
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Videos() {
  const [activeType, setActiveType] = useState('all');
  const [artistFilter, setArtistFilter] = useState('all');

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: () => base44.entities.Video.list('-publish_date', 200),
  });

  const artists = ['all', ...new Set(videos.map(v => v.artist_name).filter(Boolean))];

  let filtered = videos;
  if (activeType !== 'all') filtered = filtered.filter(v => v.video_type === activeType);
  if (artistFilter !== 'all') filtered = filtered.filter(v => v.artist_name === artistFilter);

  return (
    <div className="min-h-screen px-4 py-16 md:py-24">
      <PageMeta title="Vidéos — KKD Music" description="Clips officiels, teasers, interviews et making-of KKD Music." />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Visuels</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-2">Vidéos</h1>
          {!isLoading && (
            <p className="text-muted-foreground mt-2 text-sm">
              <span className="text-foreground font-medium">{filtered.length}</span> vidéo{filtered.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Filtres type */}
        <div className="flex flex-wrap gap-2 mb-4">
          {VIDEO_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeType === type.value
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              {type.label}
              {type.value !== 'all' && videos.filter(v => v.video_type === type.value).length > 0 && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {videos.filter(v => v.video_type === type.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filtres artiste */}
        {artists.length > 2 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {artists.map(a => (
              <button
                key={a}
                onClick={() => setArtistFilter(a)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  artistFilter === a
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border/50 text-muted-foreground hover:border-border'
                }`}
              >
                {a === 'all' ? 'Tous les artistes' : a}
              </button>
            ))}
          </div>
        )}

        {/* Grille */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-secondary" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Play size={40} className="text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune vidéo disponible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((video, i) => (
              <VideoCard key={video.id} video={video} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}