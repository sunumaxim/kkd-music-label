import React, { useState } from 'react';
import { usePlayer } from '@/lib/PlayerContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, Ticket, Radio, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

export default function NowPlayingView({ open, onClose }) {
  const player = usePlayer();
  const { toast } = useToast();
  const { current } = player;

  const [isFollowed, setIsFollowed] = useState(false);

  // Fetch artist details
  const { data: artist } = useQuery({
    queryKey: ['artist-now-playing', current?.artist_name],
    queryFn: async () => {
      if (!current?.artist_name) return null;
      const list = await base44.entities.Artist.filter({ name: current.artist_name });
      return list[0] || null;
    },
    enabled: !!current?.artist_name,
  });

  // Fetch upcoming events for this artist
  const { data: events = [] } = useQuery({
    queryKey: ['events-now-playing', current?.artist_name],
    queryFn: async () => {
      if (!current?.artist_name) return [];
      const all = await base44.entities.Event.list('-event_date', 50);
      const now = new Date();
      return all.filter(e => 
        (e.artist_name?.toLowerCase() === current.artist_name?.toLowerCase() ||
         e.artist_id === artist?.id) &&
        new Date(e.event_date) >= now
      );
    },
    enabled: !!current?.artist_name,
  });

  if (!open || !current) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 380, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 380, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="fixed top-14 bottom-24 right-0 z-30 w-80 md:w-96 bg-[#121212]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl flex flex-col text-white select-none overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight text-white">
            <Radio size={16} className="text-primary animate-pulse" />
            <span>En cours de lecture</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* Main Cover Artwork */}
          <div className="space-y-3">
            <div className="aspect-square w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
              {current.cover_url ? (
                <img
                  src={current.cover_url}
                  alt={current.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/30 flex items-center justify-center text-4xl">
                  ♪
                </div>
              )}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                HD MASTER 24-BIT
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-black text-xl text-white tracking-tight leading-snug hover:underline cursor-pointer">
                {current.title}
              </h3>
              <p className="text-sm text-zinc-400 font-medium">
                {current.artist_name || 'Artiste KKD'}
              </p>
            </div>
          </div>

          {/* Artist Bio & Card */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {artist?.photo_url ? (
                  <img
                    src={artist.photo_url}
                    alt={artist.name}
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {current.artist_name?.[0] || 'A'}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    {current.artist_name}
                    <span className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center text-[9px] text-white font-bold">✓</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {artist?.genre || 'Artiste Panafricain'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsFollowed(!isFollowed);
                  toast({
                    title: isFollowed ? 'Artiste retiré' : 'Artiste suivi !',
                    description: `Vous suivez désormais ${current.artist_name}.`,
                  });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isFollowed
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white text-black hover:scale-105'
                }`}
              >
                {isFollowed ? 'Abonné' : 'Suivre'}
              </button>
            </div>

            {artist?.bio && (
              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                {artist.bio}
              </p>
            )}
          </div>

          {/* Upcoming Concert of the Artist (Empire Ticketing Integration!) */}
          {events.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-primary/5 to-transparent border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Ticket size={14} /> Prochain Concert
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 font-mono font-bold">
                  En tournée
                </span>
              </div>

              {events.slice(0, 1).map(ev => (
                <div key={ev.id} className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center justify-center text-center shrink-0">
                      <span className="text-[10px] uppercase font-mono text-zinc-400">
                        {format(new Date(ev.event_date), 'MMM', { locale: fr })}
                      </span>
                      <span className="text-base font-black text-amber-300 leading-none">
                        {format(new Date(ev.event_date), 'dd')}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs text-white truncate">{ev.title}</h5>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-primary" /> {ev.location}, {ev.city}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/evenements/${ev.slug || ev.id}`}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                  >
                    <Ticket size={14} /> Réserver mon Pass ({ev.ticket_price ? `${ev.ticket_price.toLocaleString()} F` : 'Billetterie'})
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Credits */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
              <Info size={14} /> Crédits de production
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-zinc-500">Interprète</span>
                <span className="font-semibold text-white">{current.artist_name || 'Artiste'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-zinc-500">Label / Éditeur</span>
                <span className="font-semibold text-white">KKD Music Pan-African</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-zinc-500">Qualité sonore</span>
                <span className="font-mono text-emerald-400 font-bold">FLAC / Lossless HD</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500">Distribution</span>
                <span className="font-semibold text-white">D2C & Streaming Direct</span>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
