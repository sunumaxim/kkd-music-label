import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Heart, MessageCircle, Sparkles, Crown, Radio, Music, Newspaper, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_META = {
  broadcast: { label: 'Live', icon: Radio, path: (id) => `/direct/${id}`, color: 'text-red-500' },
  release: { label: 'Sortie', icon: Music, path: (id) => `/musique/${id}`, color: 'text-primary' },
  video: { label: 'Vidéo', icon: Music, path: (id) => `/videos/${id}`, color: 'text-blue-400' },
  event: { label: 'Événement', icon: Calendar, path: (id) => `/evenements/${id}`, color: 'text-green-400' },
  news: { label: 'Article', icon: Newspaper, path: (id) => `/actualites/${id}`, color: 'text-amber-400' },
};

const RANK_BADGE = ['🥇', '🥈', '🥉'];

export default function TopFansSection() {
  const [userEmail, setUserEmail] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUserEmail(me?.email || null);
      }
      setAuthChecked(true);
    });
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['fan-activity', userEmail || 'anon'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getFanActivity', { user_email: userEmail || '' });
      return res.data;
    },
  });

  const leaderboard = data?.leaderboard || [];
  const myContributions = data?.myContributions || [];

  return (
    <section className="mb-14">
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={20} className="text-primary" />
        <h2 className="font-display text-2xl md:text-3xl font-extrabold">Fans les plus actifs</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        La communauté KKD qui commente, partage et soutient les artistes. Merci à vous — vous faites vivre le label.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Classement */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
            <Crown size={15} className="text-amber-400" /> Classement
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-10 bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">Aucun commentaire pour l'instant. Soyez le premier !</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2.5 rounded-lg ${i < 3 ? 'bg-primary/5 border border-primary/10' : ''}`}
                >
                  <span className="w-7 text-center font-display font-bold text-sm">{i < 3 ? RANK_BADGE[i] : i + 1}</span>
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {(f.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 font-heading font-semibold text-sm truncate">{f.name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                    <MessageCircle size={11} /> {f.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mes contributions */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
            <Sparkles size={15} className="text-primary" /> Mes contributions
          </h3>
          {!authChecked ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !userEmail ? (
            <div className="text-center py-6">
              <Heart size={24} className="text-primary/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Connectez-vous pour suivre vos contributions et votre historique.</p>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline">
                Se connecter
              </Link>
            </div>
          ) : myContributions.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">
              Vous n'avez pas encore commenté. Participez aux lives, sorties et vidéos pour grimper dans le classement !
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {myContributions.map((c, i) => {
                const meta = TYPE_META[c.entity_type] || TYPE_META.release;
                const Icon = meta.icon;
                return (
                  <Link
                    key={i}
                    to={meta.path(c.entity_id)}
                    className="block p-3 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={12} className={meta.color} />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{meta.label}</span>
                      <span className="text-xs text-muted-foreground/70 truncate flex-1">{c.entity_title}</span>
                    </div>
                    <p className="text-sm text-foreground/85 line-clamp-2 group-hover:text-primary transition-colors">« {c.text} »</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}