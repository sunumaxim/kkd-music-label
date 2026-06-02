import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Music, Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FanGalleryLightbox({ posts, currentIndex, onClose, onNext, onPrev, likedPosts, onLike }) {
  const post = posts[currentIndex];

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'ArrowLeft') onPrev();
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  if (!post) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
        >
          <X size={20} />
        </button>

        {/* Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-mono">
          {currentIndex + 1} / {posts.length}
        </div>

        {/* Prev */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Next */}
        {currentIndex < posts.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Content */}
        <motion.div
          key={post.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col md:flex-row w-full max-w-5xl max-h-[90vh] mx-4 overflow-hidden rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image */}
          {post.photo_url ? (
            <div className="md:w-3/5 bg-black flex items-center justify-center">
              <img
                src={post.photo_url}
                alt={post.title || 'Photo fan'}
                className="w-full max-h-[60vh] md:max-h-[90vh] object-contain"
              />
            </div>
          ) : (
            <div className="md:w-3/5 bg-gradient-to-br from-primary/20 via-card to-card flex items-center justify-center min-h-[200px]">
              <Music size={64} className="text-primary/30" />
            </div>
          )}

          {/* Info panel */}
          <div className="md:w-2/5 bg-card flex flex-col p-6 overflow-y-auto">
            {/* Artist / event tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.artist_name && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                  <Music size={10} /> {post.artist_name}
                </span>
              )}
              {post.event_name && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-secondary text-foreground px-3 py-1 rounded-full border border-border/40">
                  <MapPin size={10} /> {post.event_name}
                </span>
              )}
              {post.concert_date && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-secondary text-muted-foreground px-3 py-1 rounded-full border border-border/40">
                  <Calendar size={10} /> {format(new Date(post.concert_date), 'dd MMM yyyy', { locale: fr })}
                </span>
              )}
            </div>

            {post.title && (
              <h2 className="font-display text-xl font-extrabold mb-3 leading-tight">{post.title}</h2>
            )}

            <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-6">{post.content}</p>

            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User size={12} className="text-primary" />
                </div>
                <span className="font-medium">{post.author_name}</span>
              </div>
              <button
                onClick={() => onLike(post)}
                className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-full border transition-all ${
                  likedPosts.includes(post.id)
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'border-border/40 text-muted-foreground hover:border-primary/30 hover:text-primary'
                }`}
              >
                <Heart size={14} className={likedPosts.includes(post.id) ? 'fill-current' : ''} />
                <span>{post.likes_count || 0}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}