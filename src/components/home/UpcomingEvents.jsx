import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function UpcomingEvents({ events }) {
  if (!events || events.length === 0) return null;

  return (
    <section className="py-20 md:py-32 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-mono text-primary tracking-widest uppercase">Agenda</span>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight mt-2">
              Événements
            </h2>
          </div>
          <Link to="/evenements" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        <div className="space-y-4">
          {events.slice(0, 5).map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="group flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 p-6 rounded-xl border border-border/50 hover:border-primary/30 bg-card/50 hover:bg-card transition-all">
                {/* Date */}
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

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {event.event_type && (
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {event.event_type}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-lg group-hover:text-primary transition-colors truncate">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {event.location}
                      </span>
                    )}
                    {event.city && (
                      <span>{event.city}</span>
                    )}
                    {event.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {format(new Date(event.event_date), 'HH:mm')}
                      </span>
                    )}
                  </div>
                </div>

                {event.ticket_url && (
                  <a
                    href={event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-full hover:bg-primary/80 transition-colors"
                  >
                    Billets
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}