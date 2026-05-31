import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

export default function LatestVideos({ videos }) {
  if (!videos || videos.length === 0) return null;

  return (
    <section className="py-20 md:py-32 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-mono text-primary tracking-widest uppercase">Clips</span>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight mt-2">
              Dernières Vidéos
            </h2>
          </div>
          <Link to="/videos" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.slice(0, 6).map((video, i) => {
            const videoId = getYouTubeId(video.youtube_url);
            const thumbnail = video.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/videos`} className="group block">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-card mb-3">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <Play className="w-12 h-12 text-primary" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                    {video.video_type && (
                      <span className="absolute top-3 left-3 bg-primary/90 text-white text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded">
                        {video.video_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  {video.artist_name && (
                    <p className="text-xs text-muted-foreground mt-1">{video.artist_name}</p>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}