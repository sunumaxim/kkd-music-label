import React from 'react';
import {
  Music, Video as VideoIcon, Eye, Heart, ShoppingCart,
  Wallet, Ticket, FileText, Headphones, ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CONTENT_TYPE_LABELS = {
  sortie_musicale: 'Single',
  video_clip: 'Clip',
  album: 'Album',
  ep: 'EP',
  playlist: 'Playlist',
  autre: 'Autre',
};

const PUB_STATUS = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600' },
  approuve: { label: 'Approuvé', color: 'bg-blue-500/10 text-blue-600' },
  publie: { label: 'Publié', color: 'bg-green-500/10 text-green-600' },
  refuse: { label: 'Refusé', color: 'bg-red-500/10 text-red-600' },
};

function fmt(n) {
  return (n || 0).toLocaleString('fr-FR');
}

/**
 * Vue d'ensemble optimisée du tableau de bord partenaire :
 * - Carte revenus en évidence (brut / net / commission)
 * - Statistiques rapides combinées (musique + vidéo + événements)
 * - Vues par vidéo avec barre de progression relative
 * - Dernières publications avec détails (type, date, prix, statut)
 */
export default function PartnerOverview({
  linkedArtistName,
  artistReleases = [],
  artistVideos = [],
  myPublications = [],
  grossEarnings = 0,
  netEarnings = 0,
  totalPlays = 0,
  totalVideoViews = 0,
  totalLikes = 0,
  totalVideoLikes = 0,
  totalSales = 0,
  totalVideoSales = 0,
  totalTicketsSold = 0,
  pendingPubs = 0,
  onNavigateTab,
}) {
  const commission = grossEarnings - netEarnings;
  const maxVideoViews = Math.max(1, ...artistVideos.map(v => v.views_count || 0));
  const showRevenue = !!linkedArtistName;

  return (
    <div className="space-y-6">
      {/* ═══ Carte Revenus Total (hero) ═══ */}
      {showRevenue && (
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} />
            <span className="text-xs font-mono uppercase tracking-widest opacity-80">Revenus nets totaux</span>
          </div>
          <p className="font-display text-4xl sm:text-5xl font-extrabold leading-none">
            {fmt(netEarnings)} <span className="text-xl opacity-70">FCFA</span>
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm">
            <span className="opacity-85">
              <span className="opacity-60">Brut : </span>
              <strong>{fmt(grossEarnings)} F</strong>
            </span>
            <span className="opacity-60">
              Commission KKD (10%) : {fmt(commission)} F
            </span>
          </div>
        </div>
      )}

      {/* ═══ Statistiques rapides ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Écoutes', value: fmt(totalPlays), icon: Headphones },
          { label: 'Vues vidéos', value: fmt(totalVideoViews), icon: Eye },
          { label: "J'aime", value: fmt(totalLikes + totalVideoLikes), icon: Heart },
          { label: 'Ventes', value: fmt(totalSales + totalVideoSales), icon: ShoppingCart },
          { label: 'Billets', value: fmt(totalTicketsSold), icon: Ticket },
          { label: 'Publications', value: myPublications.length, sub: `${pendingPubs} en attente`, icon: FileText },
        ].map(s => {
          const Ic = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4">
              <Ic size={15} className="text-primary mb-1" />
              <p className="font-display text-xl sm:text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              {s.sub && <p className="text-[11px] text-muted-foreground/60">{s.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* ═══ Vues par vidéo ═══ */}
      {artistVideos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">
              Vues par vidéo
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('artiste')}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Voir tout <ArrowRight size={11} />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {artistVideos.slice(0, 5).map(v => {
              const views = v.views_count || 0;
              const pct = Math.round((views / maxVideoViews) * 100);
              return (
                <div key={v.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <VideoIcon size={16} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm truncate">{v.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 font-bold text-primary">
                        <Eye size={11} /> {fmt(views)} vues
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={11} /> {v.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingCart size={11} /> {v.sales_count || 0}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Dernières publications (détaillées) ═══ */}
      {myPublications.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">
              Dernières publications
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('publications')}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Voir tout <ArrowRight size={11} />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {myPublications.slice(0, 4).map(pub => {
              const st = PUB_STATUS[pub.status] || PUB_STATUS.en_attente;
              const typeLabel = CONTENT_TYPE_LABELS[pub.content_type] || pub.content_type;
              const dateStr = pub.created_date
                ? format(new Date(pub.created_date), 'dd MMM yyyy', { locale: fr })
                : '';
              return (
                <div key={pub.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
                  {pub.cover_url ? (
                    <img src={pub.cover_url} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Music size={16} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm truncate">{pub.title}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/70">{typeLabel}</span>
                      {pub.artist_name && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[120px]">{pub.artist_name}</span>
                        </>
                      )}
                      {pub.is_for_sale && (
                        <>
                          <span>·</span>
                          <span className="text-accent font-bold">{fmt(pub.price || 0)} F</span>
                        </>
                      )}
                      {dateStr && (
                        <>
                          <span>·</span>
                          <span>{dateStr}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}