import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import QrWithLogo from '@/components/events/QrWithLogo';
import Barcode from '@/components/events/Barcode';
import { CheckCircle2, Clock, XCircle, MapPin, Calendar, User, Phone, ShieldCheck, Download, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';

const STATUS = {
  valide: { label: 'Billet Valide', icon: CheckCircle2, badge: 'bg-emerald-600 text-white', text: 'text-emerald-700' },
  en_attente: { label: 'Paiement en attente', icon: Clock, badge: 'bg-amber-500 text-white', text: 'text-amber-700' },
  refuse: { label: 'Refusé', icon: XCircle, badge: 'bg-destructive text-white', text: 'text-destructive' },
  annule: { label: 'Annulé', icon: XCircle, badge: 'bg-muted-foreground text-white', text: 'text-muted-foreground' },
};

const THEME_STYLES = {
  classic: {
    accent: '#DC2626',
    border: 'border-red-500/20',
    headerBg: 'bg-gradient-to-r from-red-700 via-red-600 to-amber-700',
    tagBg: 'bg-red-50 text-red-700 border-red-200',
  },
  gold: {
    accent: '#D4AF37',
    border: 'border-amber-500/30',
    headerBg: 'bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600',
    tagBg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  emerald: {
    accent: '#059669',
    border: 'border-emerald-500/20',
    headerBg: 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700',
    tagBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  royal: {
    accent: '#7C3AED',
    border: 'border-purple-500/20',
    headerBg: 'bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-700',
    tagBg: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  ocean: {
    accent: '#0284C7',
    border: 'border-sky-500/20',
    headerBg: 'bg-gradient-to-r from-sky-800 via-sky-700 to-cyan-700',
    tagBg: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  midnight: {
    accent: '#1F2937',
    border: 'border-zinc-500/20',
    headerBg: 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700',
    tagBg: 'bg-zinc-100 text-zinc-800 border-zinc-300',
  },
};

export default function TicketCard({ ticket, onDownload, downloading = false }) {
  if (!ticket) return null;

  const st = STATUS[ticket.status] || STATUS.en_attente;
  const Icon = st.icon;
  const theme = THEME_STYLES[ticket.ticket_theme || ticket.theme] || THEME_STYLES.classic;

  const verifUrl = ticket.ticket_number
    ? (ticket.security_hash
        ? `${window.location.origin}/billet/${ticket.ticket_number}?h=${ticket.security_hash}`
        : `${window.location.origin}/billet/${ticket.ticket_number}`)
    : '';

  const isBlank = ticket.status === 'en_attente';
  const eventDate = ticket.event_date ? new Date(ticket.event_date) : null;
  const categoryLabel = ticket.ticket_category || ticket.category_name || (Number(ticket.amount) > 10000 ? 'Pass VIP' : 'Pass Standard');

  return (
    <div className={`relative bg-card rounded-3xl overflow-hidden shadow-lg border ${theme.border} text-foreground transition-all`}>
      {/* Top Banner with theme header */}
      <div className={`h-2 w-full ${theme.headerBg}`} />

      <div className="flex flex-col lg:flex-row">
        {/* ── Left: Event visuals & main details ── */}
        <div className="relative flex-1 flex flex-col justify-between p-6 sm:p-7 bg-card">
          {/* Top Brand Bar */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <img src={LOGO_URL} alt="KKD" className="h-5 w-auto object-contain" />
              </div>
              <div>
                <span className="font-display font-black text-sm tracking-wider uppercase text-foreground">KKD Music</span>
                <span className="text-[10px] block font-mono text-muted-foreground uppercase tracking-widest leading-none">Billet Officiel Certifié</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${theme.tagBg}`}>
                <Award size={12} /> {categoryLabel}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${st.badge}`}>
                <Icon size={12} /> {st.label}
              </span>
            </div>
          </div>

          {/* Event Main Section */}
          <div className="py-5 space-y-3">
            <div className="flex items-start gap-4">
              {ticket.event_image_url && (
                <img
                  src={ticket.event_image_url}
                  alt={ticket.event_title || ''}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-border shadow-xs shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-mono text-primary font-bold">
                  {ticket.event_type ? `${ticket.event_type} live` : 'Concert Officiel'}
                </p>
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-foreground leading-snug line-clamp-2">
                  {ticket.event_title || 'Événement'}
                </h3>
                {ticket.artist_name && (
                  <p className="text-sm font-semibold text-muted-foreground mt-0.5">{ticket.artist_name}</p>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
              {eventDate && (
                <div className="bg-secondary/60 rounded-xl p-2.5 border border-border/40">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Date</p>
                  <p className="font-heading font-bold text-xs sm:text-sm text-foreground flex items-center gap-1 mt-0.5">
                    <Calendar size={13} className="text-primary shrink-0" />
                    {format(eventDate, "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>
              )}
              {eventDate && (
                <div className="bg-secondary/60 rounded-xl p-2.5 border border-border/40">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Horaire</p>
                  <p className="font-heading font-bold text-xs sm:text-sm text-foreground flex items-center gap-1 mt-0.5">
                    <Clock size={13} className="text-primary shrink-0" />
                    {format(eventDate, "HH:mm", { locale: fr })}
                  </p>
                </div>
              )}
              {(ticket.location || ticket.city) && (
                <div className="bg-secondary/60 rounded-xl p-2.5 border border-border/40 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Lieu</p>
                  <p className="font-heading font-bold text-xs sm:text-sm text-foreground truncate flex items-center gap-1 mt-0.5" title={[ticket.location, ticket.city].filter(Boolean).join(', ')}>
                    <MapPin size={13} className="text-primary shrink-0" />
                    {[ticket.location, ticket.city].filter(Boolean).join(', ') || 'Sur place'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attendee Info & Security Hash */}
          <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center border border-border text-muted-foreground">
                <User size={13} />
              </div>
              <div>
                <span className="text-[10px] block font-mono text-muted-foreground uppercase leading-none">Titulaire</span>
                <span className="font-bold">{ticket.buyer_name || 'Titulaire'}</span>
              </div>
            </div>

            {ticket.buyer_phone && (
              <div className="text-muted-foreground flex items-center gap-1 font-mono text-[11px]">
                <Phone size={12} className="text-primary" /> {ticket.buyer_phone}
              </div>
            )}

            <div className="ml-auto text-right">
              <span className="text-[10px] block font-mono text-muted-foreground uppercase leading-none">Montant</span>
              <span className="font-display font-black text-sm text-primary">
                {Number(ticket.amount || 0).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* ── Perforation Divider ── */}
        <div className="hidden lg:flex flex-col items-center justify-center relative w-6">
          <div className="h-full w-px border-l-2 border-dashed border-border" />
          <div className="absolute -top-3 w-6 h-6 rounded-full bg-background border border-border/40 shadow-inner" />
          <div className="absolute -bottom-3 w-6 h-6 rounded-full bg-background border border-border/40 shadow-inner" />
        </div>
        <div className="lg:hidden relative h-6 flex items-center">
          <div className="w-full border-t-2 border-dashed border-border" />
          <div className="absolute -left-3 w-6 h-6 rounded-full bg-background border border-border/40 shadow-inner" />
          <div className="absolute -right-3 w-6 h-6 rounded-full bg-background border border-border/40 shadow-inner" />
        </div>

        {/* ── Right Stub: QR Code + Barcode + Fast Scan ── */}
        <div className="lg:w-64 p-6 bg-secondary/40 flex flex-col items-center justify-between text-center gap-4">
          <div className="w-full space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold flex items-center justify-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" /> Pass Électronique
            </span>
            <p className="text-[11px] text-muted-foreground">Présentez ce QR ou code-barres à la porte</p>
          </div>

          {/* QR Code */}
          <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-border/80">
            {ticket.ticket_number ? (
              <QrWithLogo value={verifUrl} image={ticket.event_image_url} size={130} />
            ) : (
              <div className="w-32 h-32 rounded-xl bg-secondary flex items-center justify-center">
                <Clock size={28} className="text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Barcode */}
          {ticket.ticket_number && (
            <div className="w-full bg-white rounded-xl p-2 border border-border/60 shadow-xs">
              <Barcode value={ticket.ticket_number} height={32} showText={true} />
            </div>
          )}

          {/* Status info */}
          {ticket.checked_in ? (
            <div className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 size={14} /> Entrée validée à la porte
            </div>
          ) : (
            <div className="w-full py-1.5 px-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} /> Prêt pour le contrôle d'accès
            </div>
          )}

          {/* Action Download */}
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(ticket.ticket_number)}
              disabled={downloading}
              className="w-full gap-2 text-xs h-9 bg-card hover:bg-card/80 border-border"
            >
              <Download size={13} /> {downloading ? 'Téléchargement…' : 'Télécharger PDF'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
