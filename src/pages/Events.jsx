import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, ExternalLink, Play, Pause, Ticket, Plus, QrCode } from 'lucide-react';
import PageMeta from '@/components/shared/PageMeta';
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
  const visible = events.filter(e => !e.published_status || e.published_status === 'approuve');
  const upcoming = visible.filter(e => new Date(e.event_date) >= now);
  const past = visible.filter(e => new Date(e.event_date) < now);

  return (
    <div className="min-h-screen px-4 py-16 md:py-24">
      <PageMeta title="Concerts & Billetterie — KKD Music" description="Découvrez les concerts, showcases et festivals en direct ou en billetterie officielle." />
      <div className="max-w-7xl mx-auto">
        {/* Header with Empire-grade Concert Action Hub */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 pb-8 border-b border-border/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-primary tracking-widest uppercase">Live & Billetterie Officielle</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">QR Sécurisé</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-2">
              Concerts & Festivals
            </h1>
            <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
              Accédez aux plus grands lives d'Afrique de l'Ouest, achetez vos billets sécurisés avec QR code unique, et gérez vos accès en direct.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/mes-billets"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/40 text-sm font-semibold transition-all hover:bg-secondary"
            >
              <Ticket size={16} className="text-amber-400" />
              <span>Mes Billets</span>
            </Link>
            <Link
              to="/controle-acces"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/40 text-sm font-semibold transition-all hover:bg-secondary"
            >
              <QrCode size={16} className="text-emerald-400" />
              <span>Scanner / Contrôle</span>
            </Link>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('kkd:publish-event'))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Créer un Concert</span>
            </button>
          </div>
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
  const eventLink = `/evenements/${slugify(event.title)}--${event.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border/50 hover:border-primary/40 bg-card/60 hover:bg-card transition-all overflow-hidden shadow-sm hover:shadow-xl group"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 p-5 sm:p-6">
        {/* Date block */}
        <div className="flex md:flex-col items-center justify-between md:justify-center w-full md:w-20 text-center shrink-0 border-b md:border-b-0 md:border-r border-border/40 pb-3 md:pb-0 md:pr-4">
          {event.event_date ? (
            <>
              <p className="font-display text-3xl sm:text-4xl font-black text-primary leading-none">
                {format(new Date(event.event_date), 'dd')}
              </p>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                {format(new Date(event.event_date), 'MMM yyyy', { locale: fr })}
              </p>
            </>
          ) : (
            <Calendar size={24} className="text-primary mx-auto" />
          )}
        </div>

        {/* Thumbnail Image (if exists) */}
        {event.image_url && (
          <Link to={eventLink} className="relative w-full sm:w-32 h-28 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-secondary block">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>
        )}

        {/* Event Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {event.event_type && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full inline-block">
                {event.event_type}
              </span>
            )}
            {event.artist_name && (
              <span className="text-xs font-semibold text-zinc-300">
                • {event.artist_name}
              </span>
            )}
          </div>

          <Link to={eventLink} className="hover:text-primary transition-colors block">
            <h3 className="font-heading font-extrabold text-lg sm:text-xl leading-snug group-hover:text-primary transition-colors">
              {event.title}
            </h3>
          </Link>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs text-muted-foreground">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-primary" /> {event.location}
              </span>
            )}
            {event.city && <span className="font-medium text-zinc-300">• {event.city}</span>}
            {event.event_date && (
              <span className="flex items-center gap-1 font-mono">
                <Calendar size={13} /> {format(new Date(event.event_date), 'HH:mm')}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{event.description}</p>
          )}
        </div>

        {/* Pricing & CTA Actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-border/40">
          {event.is_ticketed && (
            <div className="text-right mr-2 hidden sm:block">
              <p className="text-xs font-mono font-extrabold text-primary">
                {Number(event.ticket_price || 0).toLocaleString('fr-FR')} FCFA
              </p>
              {Number(event.ticket_price_vip || 0) > 0 && (
                <p className="text-[10px] font-mono text-amber-400 font-semibold">
                  VIP: {Number(event.ticket_price_vip).toLocaleString('fr-FR')} FCFA
                </p>
              )}
            </div>
          )}

          {hasStream && (
            <button
              onClick={() => setShowStream(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors ${
                showStream
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {showStream ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
              {showStream ? 'Masquer' : '🔴 Live'}
            </button>
          )}

          {event.is_ticketed ? (
            <Link
              to={eventLink}
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-primary/20 hover:scale-105 active:scale-95"
            >
              <Ticket size={14} /> Billetterie
            </Link>
          ) : event.ticket_url ? (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/80 transition-colors flex items-center gap-1"
            >
              Billets <ExternalLink size={13} />
            </a>
          ) : (
            <Link
              to={eventLink}
              className="inline-flex items-center gap-1 text-xs font-medium px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
            >
              Détails <ExternalLink size={12} />
            </Link>
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