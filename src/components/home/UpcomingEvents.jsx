import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SectionHeader from './SectionHeader';
import { slugify } from '@/lib/slugify';

export default function UpcomingEvents({ events }) {
  if (!events || events.length === 0) return null;
  const items = events.slice(0, 6);

  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader label="Agenda" title="Événements" to="/evenements" count={items.length} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {items.map((e, i) => {
            const slug = `${slugify(e.title)}--${e.id}`;
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: Math.min(i * 0.06, 0.3) }}
              >
                <Link to={`/evenements/${slug}`} className="group flex items-center gap-4 md:gap-6 p-4 md:p-5 rounded-2xl border border-border/50 hover:border-primary/40 bg-card hover:bg-card/80 transition-all">
                  {/* Date block */}
                  <div className="shrink-0 w-16 md:w-20 text-center bg-primary/5 rounded-xl py-2 md:py-3">
                    {e.event_date && (
                      <>
                        <p className="font-display text-2xl md:text-3xl font-extrabold text-primary leading-none">
                          {format(new Date(e.event_date), 'dd')}
                        </p>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                          {format(new Date(e.event_date), 'MMM', { locale: fr })}
                        </p>
                      </>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {e.event_type && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-primary">{e.event_type}</span>
                    )}
                    <h3 className="font-heading font-bold text-base md:text-lg group-hover:text-primary transition-colors truncate">{e.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {e.city && <span className="flex items-center gap-1"><MapPin size={11} /> {e.city}</span>}
                      {e.event_date && <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(e.event_date), 'HH:mm')}</span>}
                    </div>
                  </div>
                  {e.ticket_url && (
                    <span className="shrink-0 inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full group-hover:bg-primary/85 transition-colors">
                      <Ticket size={12} /> Billets
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}