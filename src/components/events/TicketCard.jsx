import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import QrWithLogo from '@/components/events/QrWithLogo';
import { Ticket, CheckCircle2, Clock, XCircle, MapPin, Calendar, User, Phone } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';

const STATUS = {
  valide: { label: 'Valide', icon: CheckCircle2, cls: 'text-emerald-500', badge: 'bg-emerald-500' },
  en_attente: { label: 'Vierge', icon: Clock, cls: 'text-amber-500', badge: 'bg-amber-500' },
  refuse: { label: 'Refusé', icon: XCircle, cls: 'text-destructive', badge: 'bg-destructive' },
  annule: { label: 'Annulé', icon: XCircle, cls: 'text-muted-foreground', badge: 'bg-muted-foreground' },
};

export default function TicketCard({ ticket }) {
  const st = STATUS[ticket.status] || STATUS.en_attente;
  const Icon = st.icon;
  const verifUrl = ticket.ticket_number
    ? (ticket.security_hash
        ? `${window.location.origin}/billet/${ticket.ticket_number}?h=${ticket.security_hash}`
        : `${window.location.origin}/billet/${ticket.ticket_number}`)
    : '';

  const isBlank = ticket.status === 'en_attente';
  const eventDate = ticket.event_date ? new Date(ticket.event_date) : null;

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg border border-border/40">
      {/* Top accent stripe */}
      <div className="h-1.5 bg-primary" />

      <div className="flex flex-col sm:flex-row">
        {/* ── Left: Event image + info ── */}
        <div className="relative flex-1 min-h-[200px] sm:min-h-[260px]">
          {/* Background image */}
          {ticket.event_image_url && (
            <img
              src={ticket.event_image_url}
              alt={ticket.event_title || ''}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />

          {/* Content */}
          <div className="relative h-full p-5 flex flex-col justify-between text-white">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <img src={LOGO_URL} alt="KKD" className="h-6 w-auto brightness-0 invert" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary">KKDmusic</span>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white ${st.badge}`}>
                <Icon size={11} /> {st.label}
              </span>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-white/60 font-medium">Concert Live</p>
              <h3 className="font-display font-extrabold text-xl sm:text-2xl leading-tight uppercase line-clamp-2">
                {ticket.event_title || 'Événement'}
              </h3>
              {ticket.artist_name && (
                <p className="text-sm text-white/80">{ticket.artist_name}</p>
              )}
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {eventDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-primary shrink-0" />
                  <span className="font-medium">{format(eventDate, "dd MMM yyyy", { locale: fr })}</span>
                </div>
              )}
              {eventDate && (
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-primary shrink-0" />
                  <span className="font-medium">{format(eventDate, "HH:mm", { locale: fr })}</span>
                </div>
              )}
              {(ticket.buyer_name && !isBlank) && (
                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-primary shrink-0" />
                  <span className="font-medium truncate">{ticket.buyer_name}</span>
                </div>
              )}
              {(ticket.buyer_phone && !isBlank) && (
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="text-primary shrink-0" />
                  <span className="font-medium truncate">{ticket.buyer_phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Perforation divider ── */}
        <div className="hidden sm:flex items-center px-1">
          <div className="relative h-full w-px border-l-2 border-dashed border-border/50">
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-background" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-background" />
          </div>
        </div>
        <div className="sm:hidden border-t-2 border-dashed border-border/50" />

        {/* ── Right: QR + ticket info ── */}
        <div className="sm:w-56 shrink-0 p-5 flex flex-col items-center gap-3 bg-gradient-to-b from-secondary/30 to-white">
          {/* QR Code */}
          {ticket.ticket_number ? (
            <QrWithLogo value={verifUrl} image={ticket.event_image_url} size={140} />
          ) : (
            <div className="w-36 h-36 rounded-xl bg-secondary flex items-center justify-center">
              <Clock size={28} className="text-muted-foreground" />
            </div>
          )}

          {/* Ticket number */}
          {ticket.ticket_number && (
            <p className="text-[10px] font-mono text-muted-foreground break-all text-center leading-tight">
              {ticket.ticket_number}
            </p>
          )}

          {/* Price */}
          <div className="w-full text-center py-2 border-t border-border/40">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">Prix</p>
            <p className="font-display font-extrabold text-lg text-primary">
              {Number(ticket.amount || 0).toLocaleString('fr-FR')}
              <span className="text-xs ml-1">FCFA</span>
            </p>
          </div>

          {/* Scan instruction */}
          <div className="w-full bg-foreground text-white rounded-lg py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide">
              {isBlank ? 'Scanner pour activer' : 'Scanner pour vérifier'}
            </p>
          </div>

          {/* Check-in status */}
          {ticket.checked_in ? (
            <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium text-center">
              <CheckCircle2 size={13} /> Entrée validée
            </p>
          ) : ticket.status === 'valide' ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1 text-center">
              <MapPin size={12} /> Présentez ce QR à l'entrée
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}