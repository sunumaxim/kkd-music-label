import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Music, Calendar, MapPin, ZoomIn, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Masonry grid using CSS columns
function MasonryGrid({ posts, likedPosts, onLike, onOpen }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.4 }}
          className="break-inside-avoid"
        >
          <div
            className="group relative bg-card border border-border/40 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/40 transition-all hover:shadow-xl hover:shadow-primary/5"
            onClick={() => onOpen(i)}
          >
            {post.photo_url ? (
              <div className="relative overflow-hidden">
                <img
                  src={post.photo_url}
                  alt={post.title || 'Photo fan'}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{ minHeight: '180px' }}
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="w-full">
                    {post.title && <p className="text-white font-heading font-bold text-sm line-clamp-1 mb-1">{post.title}</p>}
                    <p className="text-white/70 text-xs line-clamp-2">{post.content}</p>
                  </div>
                  <div className="absolute top-3 right-3">
                    <ZoomIn size={18} className="text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-primary/10 via-secondary to-card p-8 flex flex-col gap-3 min-h-[180px]">
                <Music size={28} className="text-primary/40" />
              </div>
            )}

            <div className="p-4">
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {post.artist_name && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                    <Music size={8} /> {post.artist_name}
                  </span>
                )}
                {post.event_name && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border/30">
                    <MapPin size={8} /> {post.event_name}
                  </span>
                )}
                {post.concert_date && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border/30">
                    <Calendar size={8} /> {format(new Date(post.concert_date), 'MMM yyyy', { locale: fr })}
                  </span>
                )}
              </div>

              {post.title && <h3 className="font-heading font-bold text-sm mb-1 line-clamp-1">{post.title}</h3>}
              {!post.photo_url && (
                <p className="text-muted-foreground text-xs leading-relaxed line-clamp-4 mb-2">{post.content}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border/30 mt-2">
                <span className="text-xs text-muted-foreground font-medium truncate">{post.author_name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onLike(post); }}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                    likedPosts.includes(post.id)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  <Heart size={11} className={likedPosts.includes(post.id) ? 'fill-current' : ''} />
                  {post.likes_count || 0}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// List view
function ListView({ posts, likedPosts, onLike, onOpen }) {
  return (
    <div className="space-y-4">
      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="group bg-card border border-border/40 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/40 transition-all flex gap-0"
          onClick={() => onOpen(i)}
        >
          {post.photo_url && (
            <div className="w-28 sm:w-40 flex-shrink-0 overflow-hidden">
              <img
                src={post.photo_url}
                alt={post.title || 'Photo fan'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          {!post.photo_url && (
            <div className="w-28 sm:w-40 flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center">
              <Music size={32} className="text-primary/30" />
            </div>
          )}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {post.artist_name && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                  <Music size={8} /> {post.artist_name}
                </span>
              )}
              {post.event_name && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border/30">
                  <MapPin size={8} /> {post.event_name}
                </span>
              )}
            </div>
            {post.title && <h3 className="font-heading font-bold text-sm mb-1 line-clamp-1">{post.title}</h3>}
            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-3">{post.content}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{post.author_name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onLike(post); }}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                  likedPosts.includes(post.id)
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary'
                }`}
              >
                <Heart size={11} className={likedPosts.includes(post.id) ? 'fill-current' : ''} />
                {post.likes_count || 0}
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function FanGalleryGrid({ posts, likedPosts, onLike, onOpen, viewMode }) {
  if (viewMode === 'list') {
    return <ListView posts={posts} likedPosts={likedPosts} onLike={onLike} onOpen={onOpen} />;
  }
  return <MasonryGrid posts={posts} likedPosts={likedPosts} onLike={onLike} onOpen={onOpen} />;
}