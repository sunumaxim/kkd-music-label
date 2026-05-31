import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Music, Video, Newspaper, CalendarDays, Plus } from 'lucide-react';

const stats = [
  { label: 'Artistes', key: 'artists', icon: Users, color: 'text-red-500', path: '/admin/artistes' },
  { label: 'Sorties', key: 'releases', icon: Music, color: 'text-green-500', path: '/admin/sorties' },
  { label: 'Vidéos', key: 'videos', icon: Video, color: 'text-blue-500', path: '/admin/videos' },
  { label: 'Actualités', key: 'news', icon: Newspaper, color: 'text-yellow-500', path: '/admin/actualites' },
  { label: 'Événements', key: 'events', icon: CalendarDays, color: 'text-purple-500', path: '/admin/evenements' },
];

export default function Dashboard() {
  const { data: artists } = useQuery({
    queryKey: ['admin-artists'], queryFn: () => base44.entities.Artist.list(), initialData: []
  });
  const { data: releases } = useQuery({
    queryKey: ['admin-releases'], queryFn: () => base44.entities.Release.list(), initialData: []
  });
  const { data: videos } = useQuery({
    queryKey: ['admin-videos'], queryFn: () => base44.entities.Video.list(), initialData: []
  });
  const { data: news } = useQuery({
    queryKey: ['admin-news'], queryFn: () => base44.entities.News.list(), initialData: []
  });
  const { data: events } = useQuery({
    queryKey: ['admin-events'], queryFn: () => base44.entities.Event.list(), initialData: []
  });

  const counts = { artists: artists.length, releases: releases.length, videos: videos.length, news: news.length, events: events.length };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Bienvenue sur l'administration KKD Music</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.key}
              to={stat.path}
              className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-colors group"
            >
              <Icon size={20} className={`${stat.color} mb-3`} />
              <p className="font-display text-2xl font-extrabold">{counts[stat.key]}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Ajouter un artiste', path: '/admin/artistes', icon: Users },
          { label: 'Publier une sortie', path: '/admin/sorties', icon: Music },
          { label: 'Publier un clip', path: '/admin/videos', icon: Video },
          { label: 'Publier une actualité', path: '/admin/actualites', icon: Newspaper },
          { label: 'Ajouter un événement', path: '/admin/evenements', icon: CalendarDays },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.path}
              className="flex items-center gap-3 bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">Cliquez pour accéder</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}