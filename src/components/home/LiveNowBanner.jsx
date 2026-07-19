import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return m ? m[1] : null;
}

export default function LiveNowBanner() {
  const { data: lives = [] } = useQuery({
    queryKey: ['live-now'],
    queryFn: () => base44.entities.Broadcast.filter({ status: 'en_direct' }),
    refetchInterval: 15000,
  });
  if (!lives || lives.length === 0) return null;

  const live = lives[0];
  const ytId = getYouTubeId(live.stream_url);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <Link to={live.linked_event_id ? `/evenements/${live.linked_event_id}` : '/videos'} className="block group">
        <div className="relative rounded-2xl overflow-hidden border border-red-500/40 bg-black shadow-lg shadow-red-500/10">
          <div className="aspect-video md:aspect-[21/9]">
            {ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&modestbranding=1&rel=0`}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : live.source_video_url ? (
              <video src={live.source_video_url} autoPlay muted loop controls className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40"><Radio size={32} /></div>
            )}
          </div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> EN DIRECT
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white font-heading font-bold text-lg drop-shadow">{live.title}</p>
            <p className="text-white/70 text-xs">Cliquez pour rejoindre le live{live.linked_event_id ? ' · Événement' : ''}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}