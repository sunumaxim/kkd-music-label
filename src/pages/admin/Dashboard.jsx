import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  Users, Music, Video, Newspaper, CalendarDays,
  Inbox, UserPlus, Clock, ArrowRight, TrendingUp,
  AlertTriangle, Bell, Megaphone
} from 'lucide-react';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: artists = [] } = useQuery({ queryKey: ['admin-artists'], queryFn: () => base44.entities.Artist.list() });
  const { data: releases = [] } = useQuery({ queryKey: ['admin-releases'], queryFn: () => base44.entities.Release.list() });
  const { data: videos = [] } = useQuery({ queryKey: ['admin-videos'], queryFn: () => base44.entities.Video.list() });
  const { data: news = [] } = useQuery({ queryKey: ['admin-news'], queryFn: () => base44.entities.News.list() });
  const { data: events = [] } = useQuery({ queryKey: ['admin-events'], queryFn: () => base44.entities.Event.list() });
  const { data: requests = [] } = useQuery({ queryKey: ['admin-requests'], queryFn: () => base44.entities.ServiceRequest.list('-created_date') });
  const { data: promotions = [] } = useQuery({ queryKey: ['admin-promotions'], queryFn: () => base44.entities.SponsoredPlacement.list('-created_date') });
  const { data: invites = [] } = useQuery({ queryKey: ['admin-invites'], queryFn: () => base44.entities.ArtistInvite.list() });

  const pendingRequests = requests.filter(r => r.status === 'en_attente');
  const pendingPromotions = promotions.filter(p => p.status === 'en_attente');
  const activeArtists = invites.filter(i => i.status === 'actif').length;
  const publishedNews = news.filter(n => n.is_published).length;
  const today = new Date();

  const expiringSoon = invites.filter(i => {
    if (!i.contract_end || i.status !== 'actif') return false;
    const diff = (new Date(i.contract_end) - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= today).slice(0, 3);
  const recentRequests = pendingRequests.slice(0, 4);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const contentStats = [
    { label: 'Artistes', count: artists.length, icon: Users, color: 'text-red-400', bg: 'bg-red-500/10', path: '/admin/artistes' },
    { label: 'Sorties', count: releases.length, icon: Music, color: 'text-emerald-400', bg: 'bg-emerald-500/10', path: '/admin/sorties' },
    { label: 'Vidéos', count: videos.length, icon: Video, color: 'text-blue-400', bg: 'bg-blue-500/10', path: '/admin/videos' },
    { label: 'Articles', count: publishedNews, icon: Newspaper, color: 'text-yellow-400', bg: 'bg-yellow-500/10', path: '/admin/actualites' },
    { label: 'Événements', count: events.length, icon: CalendarDays, color: 'text-purple-400', bg: 'bg-purple-500/10', path: '/admin/evenements' },
    { label: 'Invitations', count: invites.length, icon: UserPlus, color: 'text-primary', bg: 'bg-primary/10', path: '/admin/invitations' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Hero Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="font-display text-2xl font-extrabold leading-tight">
            {user?.full_name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <img src={LOGO_URL} alt="KKD Music" className="h-12 w-auto opacity-90" />
      </div>

      {/* ── Alertes ── */}
      {(pendingRequests.length > 0 || expiringSoon.length > 0 || pendingPromotions.length > 0) && (
        <div className="space-y-2">
          {pendingRequests.length > 0 && (
            <Link
              to="/admin/demandes"
              className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                <Bell size={18} className="text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-yellow-400">
                  {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
                </p>
                <p className="text-xs text-muted-foreground">Appuyez pour traiter</p>
              </div>
              <ArrowRight size={16} className="text-yellow-400 shrink-0" />
            </Link>
          )}
          {expiringSoon.length > 0 && (
            <Link
              to="/admin/invitations"
              className="flex items-center gap-3 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-orange-400">
                  {expiringSoon.length} contrat{expiringSoon.length > 1 ? 's' : ''} expirant bientôt
                </p>
                <p className="text-xs text-muted-foreground">À renouveler dans 30 jours</p>
              </div>
              <ArrowRight size={16} className="text-orange-400 shrink-0" />
            </Link>
          )}
          {pendingPromotions.length > 0 && (
            <Link
              to="/admin/promotions"
              className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Megaphone size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-primary">
                  {pendingPromotions.length} demande{pendingPromotions.length > 1 ? 's' : ''} de mise en avant
                </p>
                <p className="text-xs text-muted-foreground">À valider (promotion payante)</p>
              </div>
              <ArrowRight size={16} className="text-primary shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* ── Stats rapides ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest">Vue d'ensemble</p>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {contentStats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                to={s.path}
                className="bg-card border border-border/40 rounded-2xl p-3.5 active:scale-[0.97] transition-transform hover:border-border/70"
              >
                <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2.5`}>
                  <Icon size={16} className={s.color} />
                </div>
                <p className={`font-display text-2xl font-extrabold ${s.color}`}>{s.count}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── KPIs Partenaires ── */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link to="/admin/demandes" className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 active:scale-[0.97] transition-transform">
          <div className="flex items-center justify-between mb-2">
            <Inbox size={18} className="text-cyan-400" />
            <span className="text-[10px] text-cyan-400/70 font-mono uppercase">Total</span>
          </div>
          <p className="font-display text-3xl font-extrabold text-cyan-400">{requests.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Demandes reçues</p>
        </Link>
        <Link to="/admin/invitations" className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 active:scale-[0.97] transition-transform">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-400/70 font-mono uppercase">Actifs</span>
          </div>
          <p className="font-display text-3xl font-extrabold text-emerald-400">{activeArtists}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Artistes sous contrat</p>
        </Link>
      </div>

      {/* ── Demandes récentes ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest">Demandes en attente</p>
          <Link to="/admin/demandes" className="text-xs text-primary font-medium">Voir tout →</Link>
        </div>
        {recentRequests.length === 0 ? (
          <div className="bg-card border border-border/30 rounded-2xl p-6 text-center">
            <Inbox size={24} className="mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucune demande en attente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentRequests.map((req) => (
              <Link
                key={req.id}
                to="/admin/demandes"
                className="flex items-center gap-3 p-3.5 bg-card border border-border/40 rounded-2xl active:scale-[0.98] transition-transform hover:border-border/70"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 font-bold text-sm text-foreground">
                  {req.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{req.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{req.request_type?.replace(/_/g, ' ')}</p>
                </div>
                <span className="shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  En attente
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Prochains événements ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest">Prochains événements</p>
          <Link to="/admin/evenements" className="text-xs text-primary font-medium">Gérer →</Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="bg-card border border-border/30 rounded-2xl p-6 text-center">
            <CalendarDays size={24} className="mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucun événement à venir</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 p-3.5 bg-card border border-border/40 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-purple-400 uppercase leading-none">
                    {new Date(ev.event_date).toLocaleDateString('fr-FR', { month: 'short' })}
                  </span>
                  <span className="text-lg font-extrabold text-purple-400 leading-tight">
                    {new Date(ev.event_date).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{ev.city || ev.location || 'Lieu à confirmer'}</p>
                </div>
                <span className="text-[10px] font-mono text-purple-400/70 shrink-0 capitalize">
                  {ev.event_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions rapides ── */}
      <div className="pb-2">
        <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-3">Actions rapides</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Ajouter un artiste', path: '/admin/artistes', icon: Users, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Publier une sortie', path: '/admin/sorties', icon: Music, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Publier un clip', path: '/admin/videos', icon: Video, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Rédiger un article', path: '/admin/actualites', icon: Newspaper, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Valider une promo', path: '/admin/promotions', icon: Megaphone, color: 'text-primary', bg: 'bg-primary/10' },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                to={a.path}
                className="flex items-center gap-3 bg-card border border-border/40 rounded-2xl p-3.5 active:scale-[0.97] transition-transform hover:border-border/70 group"
              >
                <div className={`w-9 h-9 rounded-xl ${a.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={17} className={a.color} />
                </div>
                <p className="font-semibold text-sm leading-tight">{a.label}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}