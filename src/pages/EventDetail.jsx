import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, MapPin, Calendar, Clock, ExternalLink, Play, Pause, Music, User, ShieldCheck, ScanLine, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import MobileHeader from '@/components/mobile/MobileHeader';
import TicketPurchase from '@/components/events/TicketPurchase';
import TicketCard from '@/components/events/TicketCard';
import BatchTicketGenerator from '@/components/events/BatchTicketGenerator';
import UniversalPlayer, { EmbeddedPlayer } from '@/components/shared/UniversalPlayer';
import CommentsSection from '@/components/shared/CommentsSection';
import PageMeta from '@/components/shared/PageMeta';
import ShareBar from '@/components/shared/ShareBar';
import { slugify, buildShareUrl, buildSharePreviewUrl, buildEntitySlug, extractIdFromSlug } from '@/lib/slugify';
import { resolveEntityBySlug } from '@/lib/resolveEntity';
import { useQueryClient } from '@tanstack/react-query';

const EVENT_TYPE_LABELS = {
  concert: 'Concert',
  showcase: 'Showcase',
  festival: 'Festival',
  rencontre: 'Rencontre artistique',
};

export default function EventDetail() {
  const { slug: slugParam } = useParams();
  const slug = slugify(slugParam);
  const legacyId = slugParam?.includes('--') ? extractIdFromSlug(slugParam) : null;
  const id = legacyId || slug;
  const [showStream, setShowStream] = useState(false);
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-detail', id],
    queryFn: () => resolveEntityBySlug('Event', slugParam, 'title'),
  });

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });

  const { data: artist } = useQuery({
    queryKey: ['event-artist', event?.artist_name],
    queryFn: async () => {
      const r = await base44.entities.Artist.filter({ name: event.artist_name });
      return r[0] || null;
    },
    enabled: !!event?.artist_name,
  });

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

  // Billets achetés par l'utilisateur pour cet événement
  const { data: userTickets = [], isLoading: loadingUserTickets } = useQuery({
    queryKey: ['my-event-tickets', me?.email, event?.id],
    queryFn: async () => {
      if (!me?.email || !event?.id) return [];
      const list = await base44.entities.Ticket.filter({ event_id: event.id, buyer_email: me.email });
      return list.sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
    },
    enabled: !!me?.email && !!event?.id,
  });

  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [showPurchaseMore, setShowPurchaseMore] = useState(false);
  const [downloadingTicket, setDownloadingTicket] = useState(null);
  const [showBatchGen, setShowBatchGen] = useState(false);

  const handleDownloadTicket = async (ticket_number) => {
    setDownloadingTicket(ticket_number);
    try {
      const res = await base44.functions.invoke('generateTicketFile', { ticket_number, app_url: window.location.origin });
      if (res.data?.pdf) {
        const bin = atob(res.data.pdf);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.filename || `billet-${ticket_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingTicket(null);
    }
  };

  const isOrganizerOrAdmin = me && (
    me.role === 'admin' ||
    event?.organizer_email === me.email ||
    (Array.isArray(event?.managers) && event?.managers.includes(me.email))
  );

  const shareUrl = event ? buildShareUrl('/evenements', event.slug || event.title) : '';
  const sharePreviewUrl = event ? buildSharePreviewUrl('event', event.slug || slugify(event.title)) : '';

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
        description={
          (event.is_ticketed && Number(event.ticket_price) > 0 ? `Billet: ${Number(event.ticket_price).toLocaleString('fr-FR')} F CFA — ` : '') +
          (event.description?.slice(0, 160) || `${event.event_type} — ${event.city || event.location || ''} sur KKD Music.`)
        }
        image={event.image_url}
        url={shareUrl}
        type="event"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: event.title,
          description: event.description,
          image: event.image_url,
          startDate: event.event_date,
          location: { '@type': 'Place', name: event.location, address: event.city },
          organizer: event.organizer_name ? { '@type': 'Organization', name: event.organizer_name } : undefined,
        }}
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
        <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3">
          {event.title}
        </h1>
        {event.artist_name && (
          <div className="mb-6">
            {artist ? (
              <Link to={`/artistes/${buildEntitySlug(artist.name, artist.id)}`} className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium">
                <User size={13} /> {event.artist_name}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">{event.artist_name}</span>
            )}
          </div>
        )}

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

        {/* ── Client's Official Ticket Section (Quand un client a déjà acheté un ticket) ── */}
        {userTickets.length > 0 && (
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <h2 className="font-display font-extrabold text-xl text-foreground flex items-center gap-2">
                    Votre Billet d'Événement Officiel {userTickets.length > 1 && `(${userTickets.length})`}
                  </h2>
                  <p className="text-xs text-muted-foreground">Présentez ce QR code ou code-barres à l'entrée de la salle</p>
                </div>
              </div>

              {userTickets.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {userTickets.map((t, idx) => (
                    <button
                      key={t.id || idx}
                      onClick={() => setSelectedTicketIndex(idx)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                        selectedTicketIndex === idx
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border border-border/40'
                      }`}
                    >
                      Billet {idx + 1} ({t.ticket_category || 'Standard'})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <TicketCard
              ticket={userTickets[selectedTicketIndex] || userTickets[0]}
              onDownload={handleDownloadTicket}
              downloading={downloadingTicket === (userTickets[selectedTicketIndex]?.ticket_number || userTickets[0]?.ticket_number)}
            />

            {event.is_ticketed && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setShowPurchaseMore(v => !v)}
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 py-1"
                >
                  {showPurchaseMore ? '▲ Masquer le formulaire d\'achat' : '＋ Acheter un autre billet pour un proche ou invité'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Billetterie KKD / Formulaire d'achat (si aucun billet ou si demande de rachat) */}
        {(userTickets.length === 0 || showPurchaseMore) && (
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
        )}

        {/* ── Espace Contrôle d'Accès & Gestion — Strictement réservé aux Organisateurs & Administration ── */}
        {isOrganizerOrAdmin && (
          <div className="mb-8 bg-card border-2 border-primary/20 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                    Espace Sécurisé
                  </span>
                  <h3 className="font-display font-black text-base sm:text-lg text-foreground">
                    Gestion & Contrôle d'Accès de l'Événement
                  </h3>
                </div>
              </div>
              <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full font-bold bg-secondary text-foreground border border-border">
                Rôle : {me?.role === 'admin' ? 'Administrateur' : event.organizer_email === me?.email ? 'Organisateur' : 'Contrôleur'}
              </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/40">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">Billetterie</span>
                <span className="font-bold text-sm text-foreground">{event.is_ticketed ? 'Activée ✅' : 'Désactivée'}</span>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/40">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">Vendus</span>
                <span className="font-bold text-sm text-foreground">{event.tickets_sold || 0} places</span>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/40">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">Capacité Jauge</span>
                <span className="font-bold text-sm text-foreground">{event.ticket_capacity > 0 ? `${event.ticket_capacity} places` : 'Illimitée'}</span>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/40">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">Prix Standard</span>
                <span className="font-bold text-sm text-primary">{Number(event.ticket_price || 0).toLocaleString('fr-FR')} F</span>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to={`/controle-acces?event=${event.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 shadow-sm transition-transform hover:scale-[1.02]"
              >
                <ScanLine size={15} /> Contrôle d'accès & Scanner les entrées
              </Link>

              <button
                type="button"
                onClick={() => setShowBatchGen(v => !v)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold transition-colors"
              >
                <Ticket size={15} className="text-primary" /> {showBatchGen ? 'Masquer le générateur de billets' : 'Générer des billets (Guichet / Lots)'}
              </button>
            </div>

            {/* Batch Ticket Generator inside */}
            {showBatchGen && (
              <div className="pt-3 border-t border-border/60">
                <BatchTicketGenerator event={event} user={me} />
              </div>
            )}
          </div>
        )}

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