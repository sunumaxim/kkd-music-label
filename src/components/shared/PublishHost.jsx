import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Music, Video, CalendarDays, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SongSubmissionModal from '@/components/partner/SongSubmissionModal';
import VideoPublishModal from '@/components/video/VideoPublishModal';
import EventPublishModal from '@/components/events/EventPublishModal';

/**
 * Hôte global du bouton "Publier" Spotify-grade.
 * Permet de publier : Morceau musical, Clip vidéo, ou Concert & Billetterie.
 */
export default function PublishHost() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'song' | 'video' | 'event'
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['publish-host-user'],
    queryFn: async () => {
      const auth = await base44.auth.isAuthenticated();
      if (!auth) return null;
      return base44.auth.me();
    },
    retry: false,
    staleTime: 60000,
  });

  useEffect(() => {
    const checkRoleAndProceed = async (callback) => {
      const auth = await base44.auth.isAuthenticated();
      if (!auth) { navigate('/login?from=/devenir-artiste'); return; }
      const me = await base44.auth.me();
      if (me?.role !== 'admin' && me?.role !== 'partner') {
        navigate('/devenir-artiste');
        return;
      }
      callback();
    };

    const handleGeneral = (e) => {
      checkRoleAndProceed(() => {
        const requestedType = e.detail?.type || 'menu';
        if (requestedType === 'song') setActiveModal('song');
        else if (requestedType === 'video') setActiveModal('video');
        else if (requestedType === 'event') setActiveModal('event');
        else setMenuOpen(true);
      });
    };

    const handleSong = () => {
      checkRoleAndProceed(() => setActiveModal('song'));
    };

    const handleVideo = () => {
      checkRoleAndProceed(() => setActiveModal('video'));
    };

    const handleEvent = () => {
      checkRoleAndProceed(() => setActiveModal('event'));
    };

    window.addEventListener('kkd:publish', handleGeneral);
    window.addEventListener('kkd:publish-song', handleSong);
    window.addEventListener('kkd:publish-video', handleVideo);
    window.addEventListener('kkd:publish-event', handleEvent);

    return () => {
      window.removeEventListener('kkd:publish', handleGeneral);
      window.removeEventListener('kkd:publish-song', handleSong);
      window.removeEventListener('kkd:publish-video', handleVideo);
      window.removeEventListener('kkd:publish-event', handleEvent);
    };
  }, [navigate]);

  if (!user) return null;

  return (
    <>
      {/* Floating Action Menu (FAB) */}
      <div className="fixed bottom-24 right-4 sm:right-6 z-40 flex flex-col items-end gap-2 select-none">
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="bg-[#181818]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-56 mb-2"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setActiveModal('song');
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/10 text-left text-xs font-bold text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                  <Music size={16} />
                </div>
                <div>
                  <div>Nouveau Titre</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Single, Master & Vente D2C</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  setActiveModal('video');
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/10 text-left text-xs font-bold text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Video size={16} />
                </div>
                <div>
                  <div>Nouveau Clip Vidéo</div>
                  <div className="text-[10px] text-zinc-400 font-normal">4K, YouTube & Avant-première</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  setActiveModal('event');
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/10 text-left text-xs font-bold text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <div>Concert & Billetterie</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Pass QR Code & Contrôle d'accès</div>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Publier un contenu"
          className="h-14 px-5 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center gap-2 font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all"
        >
          {menuOpen ? <X size={20} /> : <Plus size={22} strokeWidth={2.5} />}
          <span className="hidden sm:inline">Créer / Publier</span>
        </button>
      </div>

      {/* Modals */}
      {activeModal === 'song' && (
        <SongSubmissionModal
          isOpen={true}
          user={user}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'video' && (
        <VideoPublishModal
          isOpen={true}
          user={user}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'event' && (
        <EventPublishModal
          isOpen={true}
          user={user}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}