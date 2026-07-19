import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Radio, Download, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import MobileHeader from '@/components/mobile/MobileHeader';
import CommentsSection from '@/components/shared/CommentsSection';
import PageMeta from '@/components/shared/PageMeta';
import ShareBar from '@/components/shared/ShareBar';

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return m ? m[1] : null;
}

export default function LiveDetail() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: broadcast, isLoading } = useQuery({
    queryKey: ['live-detail', id],
    queryFn: async () => {
      const r = await base44.entities.Broadcast.filter({ id });
      return r[0] || null;
    },
  });

  const { data: event } = useQuery({
    queryKey: ['live-event', broadcast?.linked_event_id],
    queryFn: async () => {
      const r = await base44.entities.Event.filter({ id: broadcast.linked_event_id });
      return r[0] || null;
    },
    enabled: !!broadcast?.linked_event_id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Diffusion introuvable.</p>
        <Link to="/" className="text-primary text-sm">← Retour à l'accueil</Link>
      </div>
    );
  }

  const ytId = getYouTubeId(broadcast.stream_url);
  const isLive = broadcast.status === 'en_direct';
  const shareUrl = `${window.location.origin}/direct/${broadcast.id}`;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <PageMeta
        title={broadcast.title}
        description={broadcast.description || 'Diffusion en direct KKD Music'}
        image={event?.image_url || broadcast.background_image_url}
        url={shareUrl}
        type="video.other"
      />
      <MobileHeader title={broadcast.title} backPath="/" />

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link to="/" className="hidden md:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={14} /> Retour à l'accueil
        </Link>

        {/* Player */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : broadcast.source_video_url ? (
            <video src={broadcast.source_video_url} controls autoPlay className="w-full h-full object-contain bg-black" />
          ) : (
            <div className="flex items-center justify-center h-full text-white/40">
              <Radio size={32} />
            </div>
          )}
          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> EN DIRECT
            </div>
          )}
        </div>

        {/* Title + download */}
        <div className="mt-4 flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-extrabold leading-tight">{broadcast.title}</h1>
            {broadcast.description && (
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{broadcast.description}</p>
            )}
          </div>
          {broadcast.source_video_url && (
            <a
              href={broadcast.source_video_url}
              download
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-secondary text-sm font-medium hover:bg-secondary/70 transition-colors"
            >
              <Download size={14} /> Télécharger
            </a>
          )}
        </div>

        {/* Share */}
        <div className="mt-4 pb-4 border-b border-border">
          <ShareBar title={broadcast.title} url={shareUrl} />
        </div>

        {/* Event below */}
        {event && (
          <Link
            to={`/evenements/${event.id}`}
            className="mt-6 block bg-card border border-border/50 rounded-xl p-4 flex gap-4 hover:border-primary/40 transition-colors"
          >
            {event.image_url && (
              <img src={event.image_url} alt={event.title} className="w-24 h-24 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Événement lié</p>
              <h3 className="font-heading font-bold text-base truncate">{event.title}</h3>
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                {event.event_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {format(new Date(event.event_date), 'dd MMM yyyy', { locale: fr })}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {event.location}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Comments + likes */}
        <CommentsSection
          entityType="broadcast"
          entity={broadcast}
          onUpdate={() => qc.invalidateQueries({ queryKey: ['live-detail', id] })}
        />
      </div>
    </div>
  );
}