import React from 'react';
import { Play, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return m ? m[1] : null;
}

const POS_CLASSES = {
  'top-left': 'top-3 left-3',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-12 left-3',
  'bottom-right': 'bottom-12 right-3',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

const TRANSITIONS = {
  none: { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slide: { initial: { x: 40, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -40, opacity: 0 } },
};

export default function BroadcastPreview({ broadcast, videos = [] }) {
  let content = null;
  let key = broadcast.source_type;

  if (broadcast.source_type === 'live_stream') {
    const id = getYouTubeId(broadcast.stream_url);
    if (id) {
      content = <iframe src={`https://www.youtube.com/embed/${id}`} title="preview" className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />;
      key = 'yt-' + id;
    }
  } else if (broadcast.source_type === 'video_replay') {
    const firstId = (broadcast.source_video_ids || [])[0];
    const vid = videos.find(v => v.id === firstId);
    const id = getYouTubeId(vid?.youtube_url);
    if (id) {
      content = <iframe src={`https://www.youtube.com/embed/${id}`} title="preview" className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />;
      key = 'ytr-' + id;
    }
  } else if (broadcast.source_type === 'camera' || broadcast.source_type === 'file_upload') {
    if (broadcast.source_video_url) {
      content = <video src={broadcast.source_video_url} controls autoPlay loop playsInline className="absolute inset-0 w-full h-full object-contain bg-black" />;
      key = 'vid-' + broadcast.source_video_url;
    }
  }

  const isLive = broadcast.status === 'en_direct';
  const tr = TRANSITIONS[broadcast.transition_type] || TRANSITIONS.none;

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-bold text-sm flex items-center gap-2">
          <Radio size={16} className="text-primary" /> Aperçu du direct
        </h3>
        {isLive && (
          <span className="flex items-center gap-1.5 text-xs font-mono text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> EN DIRECT
          </span>
        )}
      </div>

      <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={tr.initial}
            animate={tr.animate}
            exit={tr.exit}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            {content || (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
                <Play size={32} />
                <span className="text-xs">Aucune source configurée</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {broadcast.watermark_logo_url && (
          <img
            src={broadcast.watermark_logo_url}
            alt="watermark"
            style={{ opacity: broadcast.watermark_opacity ?? 0.85 }}
            className={`absolute w-20 h-auto object-contain drop-shadow-lg pointer-events-none z-10 ${POS_CLASSES[broadcast.watermark_position] || POS_CLASSES['top-right']}`}
          />
        )}

        {broadcast.overlay_text && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pointer-events-none z-10">
            <p className="text-white text-xs font-mono font-semibold tracking-wide">{broadcast.overlay_text}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2">Aperçu avec incrustations et transitions. La diffusion réelle dépend de chaque plateforme.</p>
    </div>
  );
}