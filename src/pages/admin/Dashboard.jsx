import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Music, Video, Newspaper, CalendarDays, Inbox, UserPlus, TrendingUp, Clock } from 'lucide-react';

export default function Dashboard() {
  const { data: artists } = useQuery({ queryKey: ['admin-artists'], queryFn: () => base44.entities.Artist.list(), initialData: [] });
  const { data: releases } = useQuery({ queryKey: ['admin-releases'], queryFn: () => base44.entities.Release.list(), initialData: [] });
  const { data: videos } = useQuery({ queryKey: ['admin-videos'], queryFn: () => base44.entities.Video.list(), initialData: [] });
  const { data: news } = useQuery({ queryKey: ['admin-news'], queryFn: () => base44.entities.News.list(), initialData: [] });
  const { data: events } = useQuery({ queryKey: ['admin-events'], queryFn: () => base44.entities.Event.list(), initialData: [] });
  const { data: requests } = useQuery({ queryKey: ['admin-requests'], queryFn: () => base44.entities.ServiceRequest.list('-created_date'), initialData: [] });
  const { data: invites } = useQuery({ queryKey: ['admin-invites'], queryFn: () => base44.entities.ArtistInvite.list(), initialData: [] });

  const pendingRequests = requests.filter(r => r.status === 'en_attente').length;
  const activeArtists = invites.filter(i => i.status === 'actif').length;

  const today = new Date();
  const expiringSoon = invites.filter(i => {
    if (!i.contract_end || i.status !== 'actif') return false;
    const diff = (new Date(i.contract_end) - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }).length;

  const recentRequests = requests.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Administration KKD Music — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Alerts */}
      {(pendingRequests > 0 || expiringSoon > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pendingRequests > 0 && (
            <Link to="/admin/demandes" className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
              <Inbox size={20} className="text-yellow-400" />
              <div>
                <p className="font-bold text-sm text-yellow-400">{pendingRequests} demande{pendingRequests > 1 ? 's' : ''} en attente</p>
                <p className="text-xs text-muted-foreground">Cliquez pour traiter</p>
              </div>
            </Link>
          )}
          {expiringSoon > 0 && (
            <Link to="/admin/invitations" className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <Clock size={20} className="text-orange-400" />
              <div>
                <p className="font-bold text-sm text-orange-400">{expiringSoon} contrat{expiringSoon > 1 ? 's' : ''} expirant bientôt</p>
                <p className="text-xs text-muted-foreground">À renouveler dans 30 jours</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Content stats */}
      <div>
        <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Contenu</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Artistes', count: artists.length, icon: Users, color: 'text-red-400', path: '/admin/artistes' },
            { label: 'Sorties', count: releases.length, icon: Music, color: 'text-green-400', path: '/admin/sorties' },
            { label: 'Vidéos', count: videos.length, icon: Video, color: 'text-blue-400', path: '/admin/videos' },
            { label: 'Actualités', count: news.length, icon: Newspaper, color: 'text-yellow-400', path: '/admin/actualites' },
            { label: 'Événements', count: events.length, icon: CalendarDays, color: 'text-purple-400', path: '/admin/evenements' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} to={s.path} className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors group">
                <Icon size={18} className={`${s.color} mb-3`} />
                <p className="font-display text-2xl font-extrabold">{s.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Partners stats */}
      <div>
        <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Partenaires</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Demandes totales', count: requests.length, icon: Inbox, color: 'text-cyan-400', path: '/admin/demandes' },
            { label: 'En attente', count: pendingRequests, icon: Clock, color: 'text-yellow-400', path: '/admin/demandes' },
            { label: 'Artistes actifs', count: activeArtists, icon: Users, color: 'text-green-400', path: '/admin/invitations' },
            { label: 'Invitations envoyées', count: invites.length, icon: UserPlus, color: 'text-primary', path: '/admin/invitations' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} to={s.path} className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
                <Icon size={18} className={`${s.color} mb-3`} />
                <p className="font-display text-2xl font-extrabold">{s.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent requests */}
      {recentRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground">Dernières demandes</h2>
            <Link to="/admin/demandes" className="text-xs text-primary hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-2">
            {recentRequests.map((req) => (
              <Link key={req.id} to="/admin/demandes" className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-xl hover:border-primary/30 transition-colors">
                <div>
                  <p className="font-heading font-bold text-sm">{req.full_name}</p>
                  <p className="text-xs text-muted-foreground">{req.request_type?.replace(/_/g, ' ')}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  req.status === 'en_attente' ? 'bg-yellow-500/10 text-yellow-400' :
                  req.status === 'accepte' ? 'bg-green-500/10 text-green-400' :
                  req.status === 'refuse' ? 'bg-red-500/10 text-red-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>
                  {req.status?.replace(/_/g, ' ')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Ajouter un artiste', path: '/admin/artistes', icon: Users },
            { label: 'Publier une sortie', path: '/admin/sorties', icon: Music },
            { label: 'Publier un clip', path: '/admin/videos', icon: Video },
            { label: 'Publier une actualité', path: '/admin/actualites', icon: Newspaper },
            { label: 'Ajouter un événement', path: '/admin/evenements', icon: CalendarDays },
            { label: 'Inviter un artiste', path: '/admin/invitations', icon: UserPlus },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} to={a.path} className="flex items-center gap-3 bg-card border border-border/50 rounded-xl p-3 hover:border-primary/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <p className="font-heading font-bold text-sm">{a.label}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}