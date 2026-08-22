import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import QrWithLogo from '@/components/events/QrWithLogo';
import { Ticket, CheckCircle2, Clock, XCircle, MapPin } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';

const STATUS = {
  valide: { label: 'Valide', icon: CheckCircle2, cls: 'text-emerald-500' },
  en_attente: { label: 'En attente', icon: Clock, cls: 'text-amber-500' },
  refuse: { label: 'Refusé', icon: XCircle, cls: 'text-destructive' },
  annule: { label: 'Annulé', icon: XCircle, cls: 'text-muted-foreground' },
};

export default function TicketCard({ ticket }) {
  const st = STATUS[ticket.status] || STATUS.en_attente;
  const Icon = st.icon;
  const verifUrl = ticket.ticket_number
    ? (ticket.security_hash
        ? `${window.location.origin}/billet/${ticket.ticket_number}?h=${ticket.security_hash}`
        : `${window.location.origin}/billet/${ticket.ticket_number}`)
    : '';

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* QR */}
        <div className="bg-gradient-to-br from-primary/10 to-card p-5 flex flex-col items-center justify-center gap-2 sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-border/40">
          {ticket.ticket_number ? (
            <>
              <QrWithLogo value={verifUrl} image={ticket.event_image_url} size={170} />
              <p className="text-[10px] font-mono text-muted-foreground break-all text-center px-2 mt-2">{ticket.ticket_number}</p>
            </>
          ) : (
            <div className="w-40 h-40 rounded-xl bg-secondary flex items-center justify-center">
              <Clock size={28} className="text-muted-foreground" />
            </div>
          )}
        </div>
        {/* Infos */}
        <div className="flex-1 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="KKD" className="h-6 w-auto" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary">Billet KKD</span>
            </div>
            <span className={`text-xs font-bold flex items-center gap-1 ${st.cls}`}>
              <Icon size={14} /> {st.label}
            </span>
          </div>
          <h3 className="font-display font-extrabold text-lg leading-tight">{ticket.event_title}</h3>
          {ticket.event_date && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Ticket size={12} className="text-primary" />
              {format(new Date(ticket.event_date), "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Au nom de</p>
              <p className="font-heading font-bold">{ticket.buyer_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Prix</p>
              <p className="font-heading font-bold">{Number(ticket.amount || 0).toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
          {ticket.checked_in ? (
            <p className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
              <CheckCircle2 size={13} /> Entrée validée{ticket.checked_in_by ? ` par ${ticket.checked_in_by}` : ''}
            </p>
          ) : ticket.status === 'valide' ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin size={12} /> Présentez ce QR à l'entrée
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}