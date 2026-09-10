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
  en_attente: { label: 'En attente', color: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  approuve: { label: 'Approuvé', color: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  publie: { label: 'Publié', color: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  refuse: { label: 'Refusé', color: 'bg-red-500/15 text-red-400 border border-red-500/30' },
};

function fmt(n) {
  return (n || 0).toLocaleString('fr-FR');
}

/**
 * Vue d'ensemble optimisée du tableau de bord partenaire (style Spotify for Artists / Audiomack Creator) :
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
    <div className="space-y-8">
      {/* ═══ Carte Revenus Total (hero Spotify / Audiomack style) ═══ */}
      {showRevenue && (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1c222e] via-[#141821] to-[#0d1017] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <Wallet size={15} />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                Solde & Revenus Directs (D2C)
              </span>
            </div>
            <p className="font-display text-4xl sm:text-6xl font-black tracking-tight text-white leading-none my-3">
              {fmt(netEarnings)} <span className="text-xl sm:text-2xl font-bold text-zinc-400">F CFA</span>
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs sm:text-sm text-zinc-300">
              <span className="bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 rounded-full">
                <span className="text-zinc-400">Total brut : </span>
                <strong className="text-white">{fmt(grossEarnings)} F CFA</strong>
              </span>
              <span className="bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 rounded-full">
                <span className="text-zinc-400">Frais de distribution (10%) : </span>
                <strong className="text-zinc-300">{fmt(commission)} F CFA</strong>
              </span>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('revenus')}
                  className="ml-auto text-primary hover:underline font-bold text-xs flex items-center gap-1"
                >
                  Détail des transactions <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Statistiques rapides (Spotify KPI blocks) ═══ */}
      <div>
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">
          Performance globale (Audio, Vidéos & Billetterie)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: 'Écoutes audio', value: fmt(totalPlays), icon: Headphones, color: 'text-primary' },
            { label: 'Vues vidéos', value: fmt(totalVideoViews), icon: Eye, color: 'text-amber-400' },
            { label: "Mentions j'aime", value: fmt(totalLikes + totalVideoLikes), icon: Heart, color: 'text-rose-400' },
            { label: 'Titres vendus', value: fmt(totalSales + totalVideoSales), icon: ShoppingCart, color: 'text-emerald-400' },
            { label: 'Billets live', value: fmt(totalTicketsSold), icon: Ticket, color: 'text-indigo-400' },
            { label: 'Publications', value: myPublications.length, sub: `${pendingPubs} en cours`, icon: FileText, color: 'text-blue-400' },
          ].map(s => {
            const Ic = s.icon;
            return (
              <div key={s.label} className="bg-[#141821] border border-white/[0.08] hover:border-white/[0.15] transition-all rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Ic size={18} className={s.color} />
                    {s.sub && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        {s.sub}
                      </span>
                    )}
                  </div>
                  <p className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">{s.value}</p>
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Vues par vidéo ═══ */}
      {artistVideos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
              Vidéos & Clips récents
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('artiste')}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-bold"
              >
                Voir tout <ArrowRight size={12} />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {artistVideos.slice(0, 5).map(v => {
              const views = v.views_count || 0;
              const pct = Math.round((views / maxVideoViews) * 100);
              return (
                <div key={v.id} className="bg-[#141821] border border-white/[0.08] hover:border-white/[0.15] transition-all rounded-2xl p-3.5 flex items-center gap-3.5 shadow-sm">
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <VideoIcon size={18} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm text-white truncate">{v.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1 font-bold text-primary">
                        <Eye size={12} /> {fmt(views)} vues
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} /> {v.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingCart size={12} /> {v.sales_count || 0} ventes
                      </span>
                    </div>
                    <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
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
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
              Historique des soumissions
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('publications')}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-bold"
              >
                Voir tout <ArrowRight size={12} />
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
                <div key={pub.id} className="bg-[#141821] border border-white/[0.08] hover:border-white/[0.15] transition-all rounded-2xl p-3.5 flex items-center gap-3.5 shadow-sm">
                  {pub.cover_url ? (
                    <img src={pub.cover_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Music size={18} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm text-white truncate">{pub.title}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-300">{typeLabel}</span>
                      {pub.artist_name && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[140px] text-zinc-300">{pub.artist_name}</span>
                        </>
                      )}
                      {pub.is_for_sale && (
                        <>
                          <span>·</span>
                          <span className="text-primary font-bold">{fmt(pub.price || 0)} F CFA</span>
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
                  <span className={`text-[11px] px-3 py-1 rounded-full font-bold shrink-0 ${st.color}`}>
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