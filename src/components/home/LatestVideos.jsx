import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import SectionHeader from './SectionHeader';
import CarouselRow from './CarouselRow';

const TYPE_LABELS = { clip_officiel: 'Clip', teaser: 'Teaser', interview: 'Interview', making_of: 'Making-of' };

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function LatestVideos({ videos }) {
  if (!videos || videos.length === 0) return null;
  const items = videos.slice(0, 10);

  return (
    <section className="py-12 md:py-20 px-4 md:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Visuels" title="Clips Récents" to="/videos" count={items.length} />
        <CarouselRow>
          {items.map((v, i) => {
            const videoId = getYouTubeId(v.youtube_url);
            const thumb = v.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="snap-start shrink-0 w-72 md:w-96"
              >
                <Link to={`/videos/${v.id}`} className="group block">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-card mb-3 shadow-lg shadow-black/20">
                    {thumb ? (
                      <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Play className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl">
                        <Play size={22} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    {v.video_type && (
                      <span className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-wider bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[v.video_type] || v.video_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm leading-snug truncate group-hover:text-primary transition-colors">{v.title}</h3>
                  {v.artist_name && <p className="text-xs text-muted-foreground truncate mt-0.5">{v.artist_name}</p>}
                </Link>
              </motion.div>
            );
          })}
        </CarouselRow>
      </div>
    </section>
  );
}