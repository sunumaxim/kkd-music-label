import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '@/lib/PlayerContext';
import { ListMusic, X, Trash2, Play } from 'lucide-react';

/**
 * Panneau « File d'attente » du lecteur global.
 * Affiche la piste en cours + les pistes à suivre.
 * Clic sur une piste → lecture immédiate ; corbeille → retirer de la file.
 */
export default function QueuePanel({ open, onClose }) {
  const player = usePlayer();
  const { queue, currentIndex, current } = player;
  if (!open) return null;

  const upcoming = queue.map((t, i) => ({ ...t, _i: i })).filter((t) => t._i !== currentIndex);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:bg-transparent md:backdrop-blur-0"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-14 md:bottom-24 left-0 md:left-auto md:right-4 right-0 mx-auto md:mx-0 w-full md:w-96 max-h-[72vh] bg-card border-t md:border border-border/50 md:rounded-2xl shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <h3 className="font-heading font-bold text-base flex items-center gap-2">
              <ListMusic size={18} className="text-primary" /> File d'attente
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-2 py-2">
            {/* En cours */}
            {current && (
              <div className="px-2 pb-2 mb-1 border-b border-border/30">
                <p className="text-[10px] font-mono uppercase tracking-widest text-primary px-2 pt-1 pb-2">En cours</p>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5">
                  {current.cover_url ? (
                    <img src={current.cover_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-primary/15 flex items-center justify-center text-primary shrink-0">♪</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-heading font-bold text-sm truncate">{current.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{current.artist_name || 'KKD Music'}</p>
                  </div>
                  <Play size={14} className="text-primary shrink-0" fill="currentColor" />
                </div>
              </div>
            )}

            {/* À suivre */}
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-4 pt-2 pb-1">
              À suivre · {upcoming.length}
            </p>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 text-center py-6">File d'attente vide.</p>
            ) : (
              upcoming.map((t) => (
                <div
                  key={t.key || t._i}
                  className="group flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer"
                  onClick={() => player.playAt(t._i)}
                >
                  {t.cover_url ? (
                    <img src={t.cover_url} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded bg-secondary flex items-center justify-center text-muted-foreground shrink-0">♪</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.artist_name || 'KKD Music'}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); player.removeFromQueue(t._i); }}
                    className="p-1.5 rounded-md text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    title="Retirer de la file"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}