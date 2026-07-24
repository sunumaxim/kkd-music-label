import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, MapPin, Calendar, Clock, ExternalLink, Play, Pause, Music } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import MobileHeader from '@/components/mobile/MobileHeader';
import TicketPurchase from '@/components/events/TicketPurchase';
import UniversalPlayer, { EmbeddedPlayer } from '@/components/shared/UniversalPlayer';
import CommentsSection from '@/components/shared/CommentsSection';
import PageMeta from '@/components/shared/PageMeta';
import ShareBar from '@/components/shared/ShareBar';
import { buildShareUrl, buildSharePreviewUrl, buildEntitySlug, extractIdFromSlug } from '@/lib/slugify';
import { useQueryClient } from '@tanstack/react-query';

const EVENT_TYPE_LABELS = {
  concert: 'Concert',
  showcase: 'Showcase',
  festival: 'Festival',
  rencontre: 'Rencontre artistique',
};

export default function EventDetail() {
  const { slug: slugParam } = useParams();
  const id = extractIdFromSlug(slugParam);
  const [showStream, setShowStream] = useState(false);
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-detail', id],
    queryFn: async () => {
      const results = await base44.entities.Event.filter({ id });
      return results[0] || null;
    },
  });

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });

  const { data: linkedReleases = [] } = useQuery({
    queryKey: ['event-linked-releases', event?.id, event?.linked_release_ids?.join(',') || ''],
    queryFn: async () => {
      const ids = event?.linked_release_ids || [];
      if (!ids.length) return [];
      const results = await base44.entities.Release.filter({ id: { $in: ids } });
      const map = new Map(results.map(r => [r.id, r]));
      return ids.map(id => map.get(id)).filter(Boolean);
    },
    enabled: !!event?.linked_release_ids?.length,
  });

  const shareUrl = event ? buildShareUrl('/evenements', event.title, event.id) : '';
  const sharePreviewUrl = event ? buildSharePreviewUrl('event', buildEntitySlug(event.title, event.id), shareUrl) : '';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Événement introuvable.</p>
        <Link to="/evenements" className="text-primary text-sm">← Retour aux événements</Link>
      </div>
    );
  }

  const hidden = event.published_status && event.published_status !== 'approuve'
    && me?.email !== event.organizer_email && me?.role !== 'admin';
  if (hidden) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Cet événement n'est pas encore publié.</p>
        <Link to="/evenements" className="text-primary text-sm">← Retour aux événements</Link>
      </div>
    );
  }

  const isPast = event.event_date && new Date(event.event_date) < new Date();

  return (
    <div className="min-h-screen pb-24 bg-background">
      <PageMeta
        title={event.title}
        description={event.description?.slice(0, 160) || `${event.event_type} — ${event.city || event.location || ''} sur KKD Music.`}
        image={event.image_url}
        url={shareUrl}
        type="event"
      />
      <MobileHeader title={event.title} backPath="/evenements" />

      {/* Hero image */}
      {event.image_url && (
        <div className="relative w-full aspect-[16/7] md:aspect-[21/9] overflow-hidden">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          {isPast && (
            <div className="absolute top-4 right-4 bg-black/60 text-white/70 text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-full backdrop-blur-sm">
              Passé
            </div>
          )}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4">
        {/* Back — desktop */}
        <Link
          to="/evenements"
          className="hidden md:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-8 mb-4 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Retour aux événements
        </Link>

        {/* Type badge */}
        <div className={`flex items-center gap-3 flex-wrap ${event.image_url ? '-mt-8 relative z-10' : 'mt-8 md:mt-12'} mb-4`}>
          {event.event_type && (
            <span className="inline-flex items-center text-xs font-mono uppercase tracking-wider text-white bg-primary px-3 py-1.5 rounded-full">
              {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">
          {event.title}
        </h1>

        {/* Info grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {event.event_date && (
            <div className="flex items-start gap-3 bg-card border border-border/50 rounded-xl p-4">
              <Calendar size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                <p className="font-heading font-bold">
                  {format(new Date(event.event_date), 'EEEE dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          )}
          {event.event_date && (
            <div className="flex items-start gap-3 bg-card border border-border/50 rounded-xl p-4">
              <Clock size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Heure</p>
                <p className="font-heading font-bold">
                  {format(new Date(event.event_date), 'HH:mm')}
                </p>
              </div>
            </div>
          )}
          {(event.location || event.city) && (
            <div className="flex items-start gap-3 bg-card border border-border/50 rounded-xl p-4 sm:col-span-2">
              <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Lieu</p>
                <p className="font-heading font-bold">
                  {[event.location, event.city].filter(Boolean).join(' — ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-8">
            <div className="h-px bg-border mb-6" />
            <p className="text-foreground/90 leading-relaxed whitespace-pre-line text-base">
              {event.description}
            </p>
          </div>
        )}

        {/* Live stream */}
        {event.stream_url && (
          <div className="mb-8">
            <button
              onClick={() => setShowStream(v => !v)}
              className={`flex items-center gap-2 text-sm font-medium px-5 py-3 rounded-full transition-colors w-full justify-center mb-3 ${
                showStream
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {showStream ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
              {showStream ? 'Masquer le live' : '🔴 Regarder en direct'}
            </button>
            <AnimatePresence>
              {showStream && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden rounded-xl"
                >
                  <EmbeddedPlayer url={event.stream_url} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Billetterie KKD / CTA */}
        <div className="mb-8 space-y-3">
          {event.is_ticketed ? (
            <TicketPurchase event={event} />
          ) : event.ticket_url ? (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-full hover:bg-primary/80 transition-colors"
            >
              🎟️ Acheter des billets <ExternalLink size={14} />
            </a>
          ) : null}
        </div>

        {/* Share */}
        <div className="mb-8 pb-6 border-b border-border">
          <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Partager cet événement</p>
          <ShareBar title={event.title} url={sharePreviewUrl} />
        </div>

        {/* Linked releases */}
        {linkedReleases.length > 0 && (
          <div className="mb-8">
            <div className="h-px bg-border mb-6" />
            <h2 className="font-heading font-bold text-xl mb-1">À écouter</h2>
            <p className="text-xs text-muted-foreground mb-4">Les sorties associées à cet événement.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {linkedReleases.map(r => {
                const streamUrl = r.spotify_url || r.deezer_url || r.audiomack_url || r.apple_music_url || r.youtube_url;
                return (
                  <div key={r.id} className="bg-card border border-border/50 rounded-xl p-3 flex gap-3">
                    <Link to={`/musique/${buildEntitySlug(r.title, r.id)}`} className="shrink-0">
                      <div className="w-16 h-16 rounded overflow-hidden bg-secondary">
                        {r.cover_url ? (
                          <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music size={16} className="text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/musique/${buildEntitySlug(r.title, r.id)}`}>
                        <p className="font-heading font-bold text-sm truncate hover:text-primary transition-colors">{r.title}</p>
                      </Link>
                      <p className="text-xs text-muted-foreground truncate mb-2">{r.artist_name}</p>
                      {streamUrl && <UniversalPlayer url={streamUrl} label={r.title} className="w-full" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments */}
        <CommentsSection
          entityType="event"
          entity={event}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['event-detail', id] })}
        />
      </div>
    </div>
  );
}