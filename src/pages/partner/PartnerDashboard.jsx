import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, Music, Video, Bell, Clock, CheckCircle, XCircle, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/shared/NotificationBell';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-500/10 text-blue-400', icon: Clock },
  accepte: { label: 'Accepté', color: 'bg-green-500/10 text-green-400', icon: CheckCircle },
  refuse: { label: 'Refusé', color: 'bg-red-500/10 text-red-400', icon: XCircle },
};

const REQUEST_LABELS = {
  distribution: 'Distribution',
  promotion_clip: 'Promotion clip',
  promotion_musique: 'Promotion musique',
  collaboration: 'Collaboration',
  partenariat_label: 'Partenariat label',
  autre: 'Autre',
};

export default function PartnerDashboard() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['my-requests', user?.email],
    queryFn: () => base44.entities.ServiceRequest.filter({ email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: invite } = useQuery({
    queryKey: ['my-invite', user?.email],
    queryFn: async () => {
      const results = await base44.entities.ArtistInvite.filter({ email: user.email });
      return results[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['partner-releases'],
    queryFn: () => base44.entities.Release.list('-created_date', 5),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['partner-videos'],
    queryFn: () => base44.entities.Video.list('-created_date', 4),
  });

  const accepted = myRequests.filter(r => r.status === 'accepte').length;
  const pending = myRequests.filter(r => r.status === 'en_attente').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="KKD Music" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="font-heading font-bold text-sm leading-none">Espace Partenaire</p>
              <p className="text-xs text-muted-foreground">{user?.full_name || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && <NotificationBell user={user} />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.logout('/')}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              <LogOut size={14} className="mr-1" /> Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Bienvenue */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6">
          <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1">Espace Partenaire</p>
          <h1 className="font-display text-2xl font-extrabold">
            Bonjour, {user?.full_name?.split(' ')[0] || 'Partenaire'} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Bienvenue dans votre espace KKD Music.</p>
        </div>

        {/* Statut du contrat */}
        {invite && (
          <div className={`rounded-xl border p-5 flex items-center gap-4 ${
            invite.status === 'actif' ? 'border-green-500/30 bg-green-500/5' :
            invite.status === 'expire' ? 'border-orange-500/30 bg-orange-500/5' :
            'border-border/30 bg-card'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              invite.status === 'actif' ? 'bg-green-500/20' : 'bg-orange-500/20'
            }`}>
              <CheckCircle size={20} className={invite.status === 'actif' ? 'text-green-400' : 'text-orange-400'} />
            </div>
            <div className="flex-1">
              <p className="font-heading font-bold text-sm">Contrat KKD Music</p>
              <p className="text-xs text-muted-foreground">
                Type : {invite.invite_type === 'artiste_kkd' ? 'Artiste KKD' : 'Label Partenaire'} •
                Statut : <span className={invite.status === 'actif' ? 'text-green-400' : 'text-orange-400'}>
                  {invite.status === 'actif' ? 'Actif' : invite.status === 'expire' ? 'Expiré' : invite.status}
                </span>
              </p>
              {invite.contract_end && (
                <p className="text-xs text-muted-foreground">Expire le : {new Date(invite.contract_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              )}
            </div>
          </div>
        )}

        {/* Stats demandes */}
        <div>
          <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Mes demandes</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', count: myRequests.length, color: 'bg-card border-border/50' },
              { label: 'En attente', count: pending, color: 'bg-yellow-500/5 border-yellow-500/20' },
              { label: 'Acceptées', count: accepted, color: 'bg-green-500/5 border-green-500/20' },
              { label: 'En cours', count: myRequests.filter(r => r.status === 'en_cours').length, color: 'bg-blue-500/5 border-blue-500/20' },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
                <p className="font-display text-3xl font-extrabold">{s.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Liste des demandes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Historique des demandes</p>
            <Link to="/partenaires" className="text-xs text-primary hover:underline flex items-center gap-1">
              Nouvelle demande <ArrowRight size={11} />
            </Link>
          </div>
          {myRequests.length === 0 ? (
            <div className="bg-card border border-border/30 rounded-xl p-8 text-center">
              <FileText size={28} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucune demande soumise</p>
              <Link to="/partenaires">
                <Button size="sm" className="mt-4 bg-primary hover:bg-primary/80">Soumettre une demande</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myRequests.map((req) => {
                const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.en_attente;
                const Icon = cfg.icon;
                return (
                  <div key={req.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm">{REQUEST_LABELS[req.request_type] || req.request_type}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.description?.slice(0, 60)}...</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        {new Date(req.created_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${cfg.color}`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dernières sorties KKD */}
        {releases.length > 0 && (
          <div>
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Dernières sorties KKD</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {releases.map((r) => (
                <div key={r.id} className="group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-secondary mb-2">
                    {r.cover_url
                      ? <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center"><Music size={24} className="text-primary/30" /></div>
                    }
                  </div>
                  <p className="font-heading font-bold text-xs truncate">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground">{r.artist_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}