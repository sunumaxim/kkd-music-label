import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Music, Video, Newspaper, CalendarDays, Inbox, UserPlus, Clock, ArrowRight, TrendingUp } from 'lucide-react';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

export default function Dashboard() {
  const { data: artists = [] } = useQuery({ queryKey: ['admin-artists'], queryFn: () => base44.entities.Artist.list() });
  const { data: releases = [] } = useQuery({ queryKey: ['admin-releases'], queryFn: () => base44.entities.Release.list() });
  const { data: videos = [] } = useQuery({ queryKey: ['admin-videos'], queryFn: () => base44.entities.Video.list() });
  const { data: news = [] } = useQuery({ queryKey: ['admin-news'], queryFn: () => base44.entities.News.list() });
  const { data: events = [] } = useQuery({ queryKey: ['admin-events'], queryFn: () => base44.entities.Event.list() });
  const { data: requests = [] } = useQuery({ queryKey: ['admin-requests'], queryFn: () => base44.entities.ServiceRequest.list('-created_date') });
  const { data: invites = [] } = useQuery({ queryKey: ['admin-invites'], queryFn: () => base44.entities.ArtistInvite.list() });

  const pendingRequests = requests.filter(r => r.status === 'en_attente');
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img src={LOGO_URL} alt="KKD Music" className="h-10 w-auto" />
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">Tableau de bord</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Alertes */}
      {(pendingRequests.length > 0 || expiringSoon.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pendingRequests.length > 0 && (
            <Link to="/admin/demandes" className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-500/60 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
                <Inbox size={18} className="text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-yellow-400">{pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente</p>
                <p className="text-xs text-muted-foreground">Cliquez pour traiter</p>
              </div>
              <ArrowRight size={14} className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )}
          {expiringSoon.length > 0 && (
            <Link to="/admin/invitations" className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/60 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                <Clock size={18} className="text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-orange-400">{expiringSoon.length} contrat{expiringSoon.length > 1 ? 's' : ''} expirant bientôt</p>
                <p className="text-xs text-muted-foreground">À renouveler dans 30 jours</p>
              </div>
              <ArrowRight size={14} className="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )}
        </div>
      )}

      {/* Statistiques contenu */}
      <div>
        <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Contenu</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Artistes', count: artists.length, icon: Users, color: 'bg-red-500/10 text-red-400', path: '/admin/artistes' },
            { label: 'Sorties', count: releases.length, icon: Music, color: 'bg-green-500/10 text-green-400', path: '/admin/sorties' },
            { label: 'Vidéos', count: videos.length, icon: Video, color: 'bg-blue-500/10 text-blue-400', path: '/admin/videos' },
            { label: 'Articles publiés', count: publishedNews, icon: Newspaper, color: 'bg-yellow-500/10 text-yellow-400', path: '/admin/actualites' },
            { label: 'Événements', count: events.length, icon: CalendarDays, color: 'bg-purple-500/10 text-purple-400', path: '/admin/evenements' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} to={s.path} className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors group">
                <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                  <Icon size={17} />
                </div>
                <p className="font-display text-3xl font-extrabold">{s.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats partenaires */}
      <div>
        <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Partenaires & Invitations</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Demandes totales', count: requests.length, icon: Inbox, color: 'bg-cyan-500/10 text-cyan-400', path: '/admin/demandes' },
            { label: 'En attente', count: pendingRequests.length, icon: Clock, color: 'bg-yellow-500/10 text-yellow-400', path: '/admin/demandes' },
            { label: 'Artistes actifs', count: activeArtists, icon: TrendingUp, color: 'bg-green-500/10 text-green-400', path: '/admin/invitations' },
            { label: 'Invitations', count: invites.length, icon: UserPlus, color: 'bg-primary/10 text-primary', path: '/admin/invitations' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} to={s.path} className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
                <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                  <Icon size={17} />
                </div>
                <p className="font-display text-3xl font-extrabold">{s.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grille : demandes récentes + événements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demandes en attente */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Demandes en attente</p>
            <Link to="/admin/demandes" className="text-xs text-primary hover:underline">Voir tout</Link>
          </div>
          {recentRequests.length === 0 ? (
            <div className="bg-card border border-border/30 rounded-xl p-6 text-center text-sm text-muted-foreground">Aucune demande en attente</div>
          ) : (
            <div className="space-y-2">
              {recentRequests.map((req) => (
                <Link key={req.id} to="/admin/demandes" className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-xl hover:border-primary/30 transition-colors">
                  <div>
                    <p className="font-heading font-bold text-sm">{req.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{req.request_type?.replace(/_/g, ' ')}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-500/10 text-yellow-400">
                    En attente
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Prochains événements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Prochains événements</p>
            <Link to="/admin/evenements" className="text-xs text-primary hover:underline">Gérer</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="bg-card border border-border/30 rounded-xl p-6 text-center text-sm text-muted-foreground">Aucun événement à venir</div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-purple-400">{new Date(ev.event_date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</span>
                    <span className="text-sm font-extrabold text-purple-400 leading-none">{new Date(ev.event_date).getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-sm truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{ev.city || ev.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accès rapides */}
      <div>
        <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Actions rapides</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Ajouter un artiste', path: '/admin/artistes', icon: Users },
            { label: 'Publier une sortie', path: '/admin/sorties', icon: Music },
            { label: 'Publier un clip', path: '/admin/videos', icon: Video },
            { label: 'Rédiger un article', path: '/admin/actualites', icon: Newspaper },
            { label: 'Ajouter un événement', path: '/admin/evenements', icon: CalendarDays },
            { label: 'Inviter un artiste', path: '/admin/invitations', icon: UserPlus },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} to={a.path} className="flex items-center gap-3 bg-card border border-border/50 rounded-xl p-3 hover:border-primary/30 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon size={15} className="text-primary" />
                </div>
                <p className="font-heading font-bold text-sm">{a.label}</p>
                <ArrowRight size={13} className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}