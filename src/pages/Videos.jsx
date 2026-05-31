import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { YouTubePlayer } from '../components/shared/StreamingEmbed';

const VIDEO_TYPES = [
  { value: 'all', label: 'Tout' },
  { value: 'clip_officiel', label: 'Clips' },
  { value: 'teaser', label: 'Teasers' },
  { value: 'interview', label: 'Interviews' },
  { value: 'making_of', label: 'Making-of' },
];

export default function Videos() {
  const [activeType, setActiveType] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);

  const { data: videos, isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: () => base44.entities.Video.list('-created_date', 100),
    initialData: [],
  });

  const filtered = activeType === 'all' ? videos : videos.filter(v => v.video_type === activeType);

  function getYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : null;
  }

  return (
    <div className="min-h-screen px-4 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Visuels</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-2">
            Vidéos
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-12">
          {VIDEO_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeType === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Selected video player */}
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <YouTubePlayer url={selectedVideo.youtube_url} className="rounded-2xl" />
            <div className="mt-4">
              <h2 className="font-heading font-bold text-xl">{selectedVideo.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{selectedVideo.artist_name}</p>
              {selectedVideo.description && (
                <p className="text-sm text-muted-foreground mt-3">{selectedVideo.description}</p>
              )}
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="aspect-video rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">Aucune vidéo disponible.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((video, i) => {
              const videoId = getYouTubeId(video.youtube_url);
              const thumbnail = video.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedVideo(video)}
                  className="cursor-pointer group"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-card mb-3">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary" />
                    )}
                    <div className="absolute inset-0 bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-white text-lg ml-0.5">▶</span>
                      </div>
                    </div>
                    {video.video_type && (
                      <span className="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded">
                        {video.video_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm group-hover:text-primary transition-colors">{video.title}</h3>
                  {video.artist_name && <p className="text-xs text-muted-foreground mt-0.5">{video.artist_name}</p>}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}