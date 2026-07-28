import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { slugify } from '@/lib/slugify';

export default function EventCard({ event: e }) {
  const slug = `${slugify(e.title)}--${e.id}`;
  const d = e.event_date ? new Date(e.event_date) : null;
  const dateTag = d ? `${format(d, 'dd')} ${format(d, 'MMM', { locale: fr }).toUpperCase()}` : '';
  return (
    <Link to={`/evenements/${slug}`} className="block h-full">
      <article className="kkd-card-event">
        <div className="kkd-card-event-media">
          {e.image_url && <img src={e.image_url} alt={e.title} loading="lazy" />}
          <span className="kkd-card-event-live">Bientôt</span>
          {dateTag && <span className="kkd-card-event-date">{dateTag}</span>}
        </div>
        <div className="kkd-card-event-body">
          <h3 className="kkd-card-event-title">{e.title}</h3>
          <p className="kkd-card-event-place">{[e.city, e.location].filter(Boolean).join(' · ')}</p>
          {e.ticket_url && (
            <button className="kkd-card-event-cta" type="button" onClick={(ev) => ev.preventDefault()}>
              Réserver ma place
            </button>
          )}
        </div>
      </article>
    </Link>
  );
}