import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, ExternalLink, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EmbeddedPlayer } from '@/components/shared/UniversalPlayer';
import { slugify } from '@/lib/slugify';

export default function Events() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('event_date', 100),
    initialData: [],
  });

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.event_date) >= now);
  const past = events.filter(e => new Date(e.event_date) < now);

  return (
    <div className="min-h-screen px-4 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Agenda</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-2">
            Événements
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">Aucun événement programmé.</p>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="mb-16">
                <h2 className="font-heading font-bold text-lg mb-6 text-primary">À venir</h2>
                <div className="space-y-4">
                  {upcoming.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="font-heading font-bold text-lg mb-6 text-muted-foreground">Passés</h2>
                <div className="space-y-4 opacity-60">
                  {past.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, index }) {
  const [showStream, setShowStream] = useState(false);
  const hasStream = !!event.stream_url;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border/50 hover:border-primary/30 bg-card/50 hover:bg-card transition-all overflow-hidden"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 p-6">
        <div className="flex-shrink-0 w-20 text-center">
          {event.event_date && (
            <>
              <p className="font-display text-3xl font-extrabold text-primary leading-none">
                {format(new Date(event.event_date), 'dd')}
              </p>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">
                {format(new Date(event.event_date), 'MMM yyyy', { locale: fr })}
              </p>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {event.event_type && (
            <span className="text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded mb-1 inline-block">
              {event.event_type}
            </span>
          )}
          <Link to={`/evenements/${slugify(event.title)}--${event.id}`} className="hover:text-primary transition-colors">
          <h3 className="font-heading font-bold text-lg">{event.title}</h3>
          </Link>
          <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {event.location}
              </span>
            )}
            {event.city && <span>{event.city}</span>}
            {event.event_date && (
              <span className="flex items-center gap-1">
                <Calendar size={12} /> {format(new Date(event.event_date), 'HH:mm')}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {hasStream && (
            <button
              onClick={() => setShowStream(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-full transition-colors ${
                showStream
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {showStream ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
              {showStream ? 'Masquer' : '🔴 Live'}
            </button>
          )}
          {event.ticket_url && (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground text-xs font-medium px-5 py-2.5 rounded-full hover:bg-primary/80 transition-colors flex items-center gap-1"
            >
              Billets <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showStream && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <EmbeddedPlayer url={event.stream_url} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}