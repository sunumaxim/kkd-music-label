import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText, Music, Bell, Clock, CheckCircle, XCircle,
  ArrowRight, LogOut, Trash2, Plus, ExternalLink,
  User, LayoutDashboard, SendHorizonal, UserCheck, X, Megaphone,
  Headphones, Heart, ShoppingCart, CalendarDays, Ticket, Wallet, Eye, Video as VideoIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/shared/NotificationBell';
import NotificationsPanel from '@/components/shared/NotificationsPanel';
import ContractDownloader from '@/components/partner/ContractDownloader';
import GoldLabelBadge from '@/components/shared/GoldLabelBadge';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import PublishForm from '@/components/partner/PublishForm';
import PublishEventForm from '@/components/partner/PublishEventForm';
import PartnerPromotions from '@/components/partner/PartnerPromotions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PartnerPromoVideo from '@/components/promo/PartnerPromoVideo';
import ArtistProfileView from '@/components/partner/ArtistProfileView';
import ArtistAccessRequestForm from '@/components/partner/ArtistAccessRequestForm';
import ArtistEarnings from '@/components/partner/ArtistEarnings';
import PartnerOverview from '@/components/partner/PartnerOverview';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-blue-500/10 text-blue-400', icon: Clock },
  accepte: { label: 'Accepté', color: 'bg-green-500/10 text-green-400', icon: CheckCircle },
  refuse: { label: 'Refusé', color: 'bg-red-500/10 text-red-400', icon: XCircle },
};

const PUB_STATUS = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-400' },
  approuve: { label: 'Approuvé', color: 'bg-blue-500/10 text-blue-400' },
  publie: { label: 'Publié', color: 'bg-green-500/10 text-green-400' },
  refuse: { label: 'Refusé', color: 'bg-red-500/10 text-red-400' },
};

const REQUEST_LABELS = {
  distribution: 'Distribution', promotion_clip: 'Promotion clip',
  promotion_musique: 'Promotion musique', collaboration: 'Collaboration',
  partenariat_label: 'Partenariat label', autre: 'Autre',
};

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'artiste', label: 'Mon Artiste', icon: User },
  { id: 'revenus', label: 'Revenus', icon: Wallet },
  { id: 'publications', label: 'Publications', icon: Music },
  { id: 'promotion', label: 'Promotion', icon: Megaphone },
  { id: 'evenements', label: 'Événements', icon: CalendarDays },
  { id: 'demandes', label: 'Demandes', icon: FileText },
];

export default function PartnerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [showPublishEventForm, setShowPublishEventForm] = useState(false);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Queries nécessaires pour déterminer le statut partenaire (avant isPartner)
  const { data: invite, isLoading: inviteLoading } = useQuery({
    queryKey: ['my-invite', user?.email],
    queryFn: async () => {
      const results = await base44.entities.ArtistInvite.filter({ email: user.email });
      return results[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: myPublications = [], isLoading: pubsLoading } = useQuery({
    queryKey: ['my-publications', user?.email],
    queryFn: () => base44.entities.PartnerPublication.filter({ partner_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: myAccessRequests = [], isLoading: accessLoading } = useQuery({
    queryKey: ['my-access-requests', user?.email],
    queryFn: () => base44.entities.ArtistAccessRequest.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  // Accès automatique : admin, partner, OU compte lié à un artiste / ayant déjà publié
  const hasActiveInvite = invite?.status === 'actif' || invite?.status === 'invite';
  const hasApprovedAccess = myAccessRequests.some(r => r.status === 'approuve');
  const hasPublications = myPublications.length > 0;
  const partnerStatusResolved = !inviteLoading && !pubsLoading && !accessLoading;
  const isPartner = user?.role === 'admin' || user?.role === 'partner' || hasActiveInvite || hasApprovedAccess || hasPublications;
  useEffect(() => {
    if (!user || !partnerStatusResolved) return;
    if (!isPartner && activeTab !== 'demandes') setActiveTab('demandes');
  }, [user, isPartner, partnerStatusResolved]);

  // Synchronise l'onglet actif avec ?tab= (redirections depuis les notifications)
  useEffect(() => {
    const t = searchParams.get('tab');
    if (!t) return;
    const allowed = isPartner ? TABS.map(x => x.id) : ['demandes'];
    if (allowed.includes(t) && t !== activeTab) setActiveTab(t);
  }, [searchParams, isPartner]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'dashboard' ? {} : { tab }, { replace: true });
  };
  const tabs = isPartner ? TABS : TABS.filter((t) => t.id === 'demandes');

  const { data: myRequests = [] } = useQuery({
    queryKey: ['my-requests', user?.email],
    queryFn: () => base44.entities.ServiceRequest.filter({ email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: myEvents = [] } = useQuery({
    queryKey: ['partner-events', user?.email],
    queryFn: () => base44.entities.Event.filter({ organizer_email: user.email }, '-event_date'),
    enabled: !!user?.email,
  });

  // Artiste approuvé lié au compte
  const approvedAccess = myAccessRequests.find(r => r.status === 'approuve');
  const linkedArtistId = invite?.artist_id || approvedAccess?.artist_id;
  const linkedArtistName = invite?.artist_name || approvedAccess?.artist_name;

  const { data: artistReleases = [] } = useQuery({
    queryKey: ['partner-artist-releases', linkedArtistName],
    queryFn: () => base44.entities.Release.filter({ artist_name: linkedArtistName }, '-release_date'),
    enabled: !!linkedArtistName,
  });
  const totalPlays = artistReleases.reduce((s, r) => s + (r.plays_count || 0), 0);
  const totalLikes = artistReleases.reduce((s, r) => s + (r.likes_count || 0), 0);
  const totalSales = artistReleases.reduce((s, r) => s + (r.sales_count || 0), 0);

  // Statistiques vidéos (fiables via artist_name)
  const { data: artistVideos = [] } = useQuery({
    queryKey: ['partner-artist-videos', linkedArtistName],
    queryFn: () => base44.entities.Video.filter({ artist_name: linkedArtistName }, '-publish_date'),
    enabled: !!linkedArtistName,
  });
  const totalVideoViews = artistVideos.reduce((s, v) => s + (v.views_count || 0), 0);
  const totalVideoLikes = artistVideos.reduce((s, v) => s + (v.likes_count || 0), 0);
  const totalVideoSales = artistVideos.reduce((s, v) => s + (v.sales_count || 0), 0);

  // Revenus de l'artiste (achats + wave + billets validés)
  const { data: artistPurchases = [] } = useQuery({
    queryKey: ['artist-purchases', linkedArtistName],
    queryFn: () => base44.entities.Purchase.filter({ artist_name: linkedArtistName }),
    enabled: !!linkedArtistName,
  });
  const { data: artistWavePmts = [] } = useQuery({
    queryKey: ['artist-wave-payments', linkedArtistName],
    queryFn: () => base44.entities.WavePayment.filter({ artist_name: linkedArtistName }),
    enabled: !!linkedArtistName,
  });
  const { data: artistTickets = [] } = useQuery({
    queryKey: ['artist-tickets', linkedArtistName],
    queryFn: () => base44.entities.Ticket.filter({ artist_name: linkedArtistName }),
    enabled: !!linkedArtistName,
  });
  const grossEarnings =
    artistPurchases.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0) +
    artistWavePmts.filter(w => w.status === 'valide').reduce((s, w) => s + (w.amount || 0), 0) +
    artistTickets.filter(t => t.status === 'valide').reduce((s, t) => s + (t.amount || 0), 0);
  const netEarnings = Math.round(grossEarnings * 0.90);
  const totalTicketsSold = artistTickets.filter(t => t.status === 'valide').length;

  const pendingPubs = myPublications.filter(p => p.status === 'en_attente').length;
  const acceptedReqs = myRequests.filter(r => r.status === 'accepte').length;
  const pendingReqs = myRequests.filter(r => r.status === 'en_attente').length;

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
            <Button variant="ghost" size="sm" onClick={() => base44.auth.logout('/')}
              className="text-muted-foreground hover:text-foreground text-xs">
              <LogOut size={14} className="mr-1" /> Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Overlay PublishForm */}
      {showPublishForm && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <PublishForm user={user} onClose={() => setShowPublishForm(false)} />
          </div>
        </div>
      )}

      {/* Overlay AccessRequest */}
      {showAccessForm && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-12">
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <ArtistAccessRequestForm user={user} onClose={() => setShowAccessForm(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Overlay PublishEventForm */}
      {showPublishEventForm && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <PublishEventForm user={user} onClose={() => setShowPublishEventForm(false)} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border/30 bg-card/30 sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => changeTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.id === 'publications' && pendingPubs > 0 && (
                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingPubs}</span>
                  )}
                  {tab.id === 'demandes' && pendingReqs > 0 && (
                    <span className="bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingReqs}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!isPartner && partnerStatusResolved && user && (
          <div className="bg-secondary/40 border border-border/50 rounded-xl p-4 mb-6 text-sm text-muted-foreground">
            Vous êtes connecté en simple utilisateur. Vous pouvez soumettre une <strong>demande de service</strong> ; la soumission de contenu (sorties, vidéos, événements, promotions) est réservée aux artistes, partenaires et contributeurs.
          </div>
        )}

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6">
              <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1">Espace Partenaire</p>
              <h1 className="font-display text-2xl font-extrabold">
                Bonjour, {user?.full_name?.split(' ')[0] || 'Partenaire'} 👋
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Bienvenue dans votre espace KKD Music.</p>
            </div>

            {/* Notifications récentes */}
            <NotificationsPanel user={user} />

            {/* Contrat */}
            {invite && (
              <div className={`rounded-xl border p-5 flex items-center gap-4 ${
                invite.status === 'actif' ? 'border-green-500/30 bg-green-500/5' :
                invite.status === 'expire' ? 'border-orange-500/30 bg-orange-500/5' :
                'border-border/30 bg-card'
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${invite.status === 'actif' ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                  <CheckCircle size={20} className={invite.status === 'actif' ? 'text-green-400' : 'text-orange-400'} />
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-sm flex items-center gap-1.5">
                    Contrat KKD Music
                    {invite.is_verified && (
                      invite.invite_type === 'label_partenaire'
                        ? <GoldLabelBadge size={15} />
                        : <VerifiedBadge size={15} />
                    )}
                    {invite.label_name && <span className="ml-2 text-xs text-muted-foreground font-normal">· {invite.label_name}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invite.invite_type === 'artiste_kkd' ? 'Artiste KKD' : 'Label Partenaire'} · Statut :{' '}
                    <span className={invite.status === 'actif' ? 'text-green-400' : 'text-orange-400'}>
                      {invite.status === 'actif' ? 'Actif' : invite.status === 'expire' ? 'Expiré' : invite.status}
                    </span>
                  </p>
                  {invite.contract_end && (
                    <p className="text-xs text-muted-foreground">
                      Expire le : {new Date(invite.contract_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <ContractDownloader invite={invite} label="Télécharger" variant="outline" />
                </div>
              </div>
            )}

            <PartnerOverview
              linkedArtistName={linkedArtistName}
              artistReleases={artistReleases}
              artistVideos={artistVideos}
              myPublications={myPublications}
              grossEarnings={grossEarnings}
              netEarnings={netEarnings}
              totalPlays={totalPlays}
              totalVideoViews={totalVideoViews}
              totalLikes={totalLikes}
              totalVideoLikes={totalVideoLikes}
              totalSales={totalSales}
              totalVideoSales={totalVideoSales}
              totalTicketsSold={totalTicketsSold}
              pendingPubs={pendingPubs}
              onNavigateTab={changeTab}
            />

            {/* Actions rapides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => window.dispatchEvent(new CustomEvent('kkd:publish'))}
                className="flex items-center gap-4 p-5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all group active:scale-[0.99] shadow-md">
                <div className="w-12 h-12 rounded-xl bg-primary-foreground/15 flex items-center justify-center group-hover:bg-primary-foreground/25 transition-colors shrink-0">
                  <Plus size={26} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="font-display font-extrabold text-base">Publier</p>
                  <p className="text-sm text-primary-foreground/80">Son, clip — simple et rapide</p>
                </div>
              </button>

              {!linkedArtistId ? (
                <button onClick={() => setShowAccessForm(true)}
                  className="flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 transition-all group active:scale-[0.99]">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors shrink-0">
                    <UserCheck size={24} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-display font-extrabold text-base text-blue-400">Réclamer mon profil</p>
                    <p className="text-sm text-muted-foreground">Demander l'accès à votre profil artiste</p>
                  </div>
                </button>
              ) : (
                <button onClick={() => setActiveTab('artiste')}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                    <User size={24} className="text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-display font-extrabold text-base text-green-400">Mon profil artiste</p>
                    <p className="text-sm text-muted-foreground">Voir vos infos, sorties, vidéos</p>
                  </div>
                </button>
              )}
            </div>

          </div>
        )}

        {/* ── ARTISTE TAB ── */}
        {activeTab === 'artiste' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold">Mon Artiste</h2>
              {!linkedArtistId && (
                <Button size="sm" onClick={() => setShowAccessForm(true)} className="gap-2">
                  <UserCheck size={14} /> Réclamer un profil
                </Button>
              )}
            </div>

            {/* Demandes d'accès en cours */}
            {myAccessRequests.length > 0 && (
              <div className="space-y-2">
                {myAccessRequests.filter(r => r.status !== 'approuve').map(req => (
                  <div key={req.id} className={`rounded-xl border p-4 flex items-center gap-3 ${
                    req.status === 'en_attente' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-red-500/30 bg-red-500/5'
                  }`}>
                    <div className="flex-1">
                      <p className="font-heading font-bold text-sm">
                        Demande d'accès : {req.artist_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.status === 'en_attente' ? '⏳ En attente de validation par l\'équipe KKD' : '❌ Demande refusée'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {linkedArtistId ? (
              <ArtistProfileView artistId={linkedArtistId} />
            ) : (
              <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
                <User size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-display font-bold text-lg mb-2">Aucun profil artiste lié</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Réclamez votre profil artiste pour accéder à toutes vos informations, sorties et vidéos.
                </p>
                <Button onClick={() => setShowAccessForm(true)} className="gap-2">
                  <UserCheck size={16} /> Réclamer mon profil
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── REVENUS TAB ── */}
        {activeTab === 'revenus' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold">Revenus & Transactions</h2>
            </div>
            {linkedArtistName ? (
              <ArtistEarnings user={user} artistName={linkedArtistName} artist={null} />
            ) : (
              <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
                <Wallet size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-display font-bold text-lg mb-2">Aucun profil artiste lié</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Réclamez votre profil artiste pour suivre vos revenus et transactions.
                </p>
                <Button onClick={() => setShowAccessForm(true)} className="gap-2 mt-4">
                  <UserCheck size={16} /> Réclamer mon profil
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── PUBLICATIONS TAB ── */}
        {activeTab === 'publications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold">Mes Publications</h2>
              <Button size="sm" onClick={() => setShowPublishForm(true)} className="gap-2">
                <Plus size={14} /> Nouvelle publication
              </Button>
            </div>

            {myPublications.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
                <Music size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-4">Aucune publication soumise</p>
                <Button onClick={() => setShowPublishForm(true)} className="gap-2">
                  <Plus size={14} /> Soumettre mon premier contenu
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myPublications.map(pub => {
                  const st = PUB_STATUS[pub.status] || PUB_STATUS.en_attente;
                  return (
                    <div key={pub.id} className="bg-card border border-border/50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        {pub.cover_url ? (
                          <img src={pub.cover_url} alt={pub.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Music size={18} className="text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-heading font-bold text-sm">{pub.title}</p>
                              <p className="text-xs text-muted-foreground">{pub.artist_name}</p>
                            </div>
                            <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${st.color}`}>{st.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <a href={pub.streaming_link} target="_blank" rel="noreferrer"
                              className="text-[11px] text-primary hover:underline flex items-center gap-1">
                              <ExternalLink size={10} /> Voir le lien
                            </a>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(pub.created_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {pub.admin_notes && (
                            <p className="mt-2 text-xs bg-secondary/50 rounded-lg px-3 py-2 italic text-muted-foreground">
                              💬 KKD : {pub.admin_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PROMOTION TAB ── */}
        {activeTab === 'promotion' && (
          <div className="space-y-6">
            {linkedArtistName ? (
              <PartnerPromoVideo artistName={linkedArtistName} />
            ) : (
              <div className="bg-card border border-border/50 rounded-2xl p-6 text-center text-sm text-muted-foreground">
                Réclamez votre profil artiste pour générer des vidéos promo de vos sorties.
              </div>
            )}
            <PartnerPromotions user={user} />
          </div>
        )}

        {/* ── DEMANDES TAB ── */}
        {activeTab === 'demandes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold">Mes Demandes</h2>
              <Link to="/partenaires">
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus size={14} /> Nouvelle demande
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total', count: myRequests.length },
                { label: 'En attente', count: pendingReqs },
                { label: 'Acceptées', count: acceptedReqs },
                { label: 'En cours', count: myRequests.filter(r => r.status === 'en_cours').length },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4">
                  <p className="font-display text-3xl font-extrabold">{s.count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {myRequests.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
                <FileText size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-4">Aucune demande soumise</p>
                <Link to="/partenaires">
                  <Button>Soumettre une demande</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {myRequests.map(req => {
                  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.en_attente;
                  const Icon = cfg.icon;
                  return (
                    <div key={req.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-sm">{REQUEST_LABELS[req.request_type] || req.request_type}</p>
                        <p className="text-xs text-muted-foreground truncate">{req.description?.slice(0, 70)}…</p>
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
        )}

        {/* ── ÉVÉNEMENTS TAB ── */}
        {activeTab === 'evenements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold">Mes événements</h2>
              <Button size="sm" onClick={() => setShowPublishEventForm(true)} className="gap-2">
                <Plus size={14} /> Publier un événement
              </Button>
            </div>
            {myEvents.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
                <CalendarDays size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-4">Aucun événement soumis</p>
                <Button onClick={() => setShowPublishEventForm(true)} className="gap-2">
                  <Plus size={14} /> Créer un événement
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myEvents.map((ev) => {
                  const st = ev.published_status === 'en_attente'
                    ? { label: 'En attente', cls: 'bg-amber-500/10 text-amber-400' }
                    : ev.published_status === 'refuse'
                      ? { label: 'Refusé', cls: 'bg-red-500/10 text-red-400' }
                      : { label: 'Publié', cls: 'bg-emerald-500/10 text-emerald-400' };
                  return (
                    <div key={ev.id} className="bg-card border border-border/50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        {ev.image_url ? (
                          <img src={ev.image_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <CalendarDays size={18} className="text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-heading font-bold text-sm">{ev.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {ev.event_date && format(new Date(ev.event_date), 'dd MMM yyyy HH:mm', { locale: fr })} · {ev.location} {ev.city}
                              </p>
                            </div>
                            <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${st.cls}`}>{st.label}</span>
                          </div>
                          {ev.is_ticketed && (
                            <p className="text-[11px] text-primary mt-1.5 flex items-center gap-1">
                              <Ticket size={11} /> {Number(ev.ticket_price || 0).toLocaleString('fr-FR')} FCFA · {ev.tickets_sold || 0} vendu(s)
                            </p>
                          )}
                          {ev.published_status === 'approuve' && (
                            <Link to="/controle-acces" className="text-[11px] text-primary hover:underline">Contrôle d'accès →</Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Zone dangereuse */}
        {activeTab === 'dashboard' && (
          <div className="border border-destructive/30 rounded-2xl p-5 mt-8">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-1">Zone dangereuse</p>
            <h3 className="font-heading font-bold text-sm mb-1">Supprimer mon compte</h3>
            <p className="text-xs text-muted-foreground mb-4">Action irréversible. Toutes vos données seront supprimées.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 size={14} /> Supprimer mon compte
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Voulez-vous continuer ?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => { setDeleting(true); base44.auth.logout('/'); }}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? 'Suppression…' : 'Confirmer'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </main>
    </div>
  );
}