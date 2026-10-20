import React from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { mapsUrl, directionsUrl, osmEmbedUrl } from '@/lib/maps';

/** Lieu cliquable (ouvre Google Maps). variant: 'inline' (texte) | 'card' (bloc complet avec carte et itinéraire) */
export default function LocationLink({ event, variant = 'inline', className = '' }) {
  const label = [event?.location, event?.city].filter(Boolean).join(', ');
  const url = mapsUrl(event);
  if (!label) return null;

  if (variant === 'inline') {
    return url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
         className={`inline-flex items-center gap-1 hover:underline hover:text-primary ${className}`} title="Ouvrir dans Google Maps">
        <MapPin size={13} className="shrink-0" /> <span className="truncate">{label}</span> <ExternalLink size={11} className="opacity-60 shrink-0" />
      </a>
    ) : <span className={`inline-flex items-center gap-1 ${className}`}><MapPin size={13} /> {label}</span>;
  }

  const embed = osmEmbedUrl(event);
  return (
    <div className={`rounded-2xl border border-border bg-card overflow-hidden ${className}`}>
      {embed && <iframe title="Carte du lieu" src={embed} loading="lazy" className="w-full h-52 border-0" referrerPolicy="no-referrer" />}
      <div className="p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="min-w-0">
          <p className="font-heading font-bold flex items-center gap-1.5"><MapPin size={16} className="text-primary shrink-0" />{event.location}</p>
          <p className="text-xs text-muted-foreground">{event.location_address || event.city}</p>
        </div>
        <div className="flex gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border border-border hover:bg-secondary"><ExternalLink size={14} />Ouvrir la carte</a>
          <a href={directionsUrl(event)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90"><Navigation size={14} />Itinéraire</a>
        </div>
      </div>
    </div>
  );
}
