import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle2, Clock, Sparkles, Music, Disc, Calendar,
  ArrowRight, ShieldCheck, AlertCircle, Phone, Globe
} from 'lucide-react';
import PageMeta from '@/components/shared/PageMeta';

export default function DevenirArtiste() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'artist';

  const [requestType, setRequestType] = useState(initialType);
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: me, isLoading: loadingMe } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const email = me?.email;

  const { data: myRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['my-access-requests', email],
    queryFn: () => (email ? base44.entities.ArtistAccessRequest.filter({ user_email: email }) : []),
    enabled: !!email,
  });

  const latestRequest = myRequests[myRequests.length - 1];
  const isApproved = me?.role === 'partner' || me?.role === 'admin' || latestRequest?.status === 'approuve';
  const isPending = !isApproved && latestRequest?.status === 'en_attente';

  const mutation = useMutation({
    mutationFn: async (payload) => {
      return base44.entities.ArtistAccessRequest.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-access-requests'] });
      setIsSubmitted(true);
      toast({
        title: 'Demande soumise avec succès !',
        description: 'Votre dossier a été transmis à la direction KKD Music pour validation.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Erreur de soumission',
        description: err.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      navigate('/login?from=/devenir-artiste');
      return;
    }
    if (!name.trim()) {
      toast({ title: 'Veuillez saisir votre nom ou pseudo', variant: 'destructive' });
      return;
    }

    mutation.mutate({
      user_id: me?.id,
      user_email: email,
      request_type: requestType,
      artist_name: name.trim(),
      genre: genre.trim() || 'Afro',
      payout_phone: payoutPhone.trim(),
      wave_number: payoutPhone.trim(),
      portfolio_url: portfolioLink.trim(),
      message: message.trim(),
      status: 'en_attente',
      created_date: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageMeta
        title="Procédure d'Adhésion Artiste & Partenaire — KKD Music"
        description="Rejoignez KKD Music comme Artiste Indépendant, Label de Production ou Organisateur d'Événements."
      />

      <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-12">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} /> Procédure d'Attribution de Rôles KKD Music
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            Devenir Artiste, Label ou Organisateur
          </h1>
          <p className="text-muted-foreground mt-3 text-sm md:text-base leading-relaxed">
            Chaque profil dispose d'un espace dédié et sécurisé. Suivez les 4 étapes réglementaires pour
            publier votre musique, organiser vos concerts et percevoir vos revenus directs.
          </p>
        </div>

        {/* 4 Steps Workflow Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-10">
          <div className="p-4 rounded-2xl bg-card border border-border/60 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs mb-2">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-xs font-mono uppercase text-muted-foreground">Étape 1</p>
            <h3 className="font-bold text-sm text-foreground mt-0.5">Accéder à la plateforme</h3>
            <p className="text-xs text-muted-foreground mt-1">Découverte du catalogue et des fonctionnalités.</p>
          </div>

          <div className={`p-4 rounded-2xl bg-card border ${me ? 'border-emerald-500/40' : 'border-primary/40'} relative`}>
            <div className={`w-8 h-8 rounded-full ${me ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary'} font-bold flex items-center justify-center text-xs mb-2`}>
              {me ? <CheckCircle2 size={16} /> : '2'}
            </div>
            <p className="text-xs font-mono uppercase text-muted-foreground">Étape 2</p>
            <h3 className="font-bold text-sm text-foreground mt-0.5">Créer son compte</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {me ? `Connecté (${me.email})` : 'Compte auditeur requis avant demande.'}
            </p>
          </div>

          <div className={`p-4 rounded-2xl bg-card border ${isApproved ? 'border-emerald-500/40' : isPending ? 'border-amber-500/40' : 'border-border/60'} relative`}>
            <div className={`w-8 h-8 rounded-full ${isApproved ? 'bg-emerald-500/20 text-emerald-400' : isPending ? 'bg-amber-500/20 text-amber-400' : 'bg-secondary text-foreground'} font-bold flex items-center justify-center text-xs mb-2`}>
              {isApproved ? <CheckCircle2 size={16} /> : isPending ? <Clock size={16} /> : '3'}
            </div>
            <p className="text-xs font-mono uppercase text-muted-foreground">Étape 3</p>
            <h3 className="font-bold text-sm text-foreground mt-0.5">Demander à être Artiste</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isPending ? 'Dossier en examen administrateur' : 'Remplir le formulaire officiel.'}
            </p>
          </div>

          <div className={`p-4 rounded-2xl bg-card border ${isApproved ? 'border-emerald-500/60 bg-emerald-950/10' : 'border-border/60'} relative`}>
            <div className={`w-8 h-8 rounded-full ${isApproved ? 'bg-emerald-500 text-black' : 'bg-secondary text-foreground'} font-bold flex items-center justify-center text-xs mb-2`}>
              {isApproved ? <ShieldCheck size={16} /> : '4'}
            </div>
            <p className="text-xs font-mono uppercase text-muted-foreground">Étape 4</p>
            <h3 className="font-bold text-sm text-foreground mt-0.5">Accès Tableau de Bord</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isApproved ? 'Accès débloqué avec succès !' : 'Déblocage immédiat après approbation.'}
            </p>
          </div>
        </div>

        {/* State 1: User is already Approved / Partner */}
        {isApproved ? (
          <div className="p-8 rounded-3xl bg-card border border-emerald-500/30 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck size={32} />
            </div>
            <h2 className="font-display text-2xl font-extrabold text-foreground">
              Félicitations, vous disposez d'un rôle Partenaire Vérifié !
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Votre compte est officiellement accrédité sur KKD Music. Vous avez un accès direct à
              votre tableau de bord pour publier vos musiques (gratuites ou payantes), gérer vos contrats
              et organiser vos événements.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6">
                <Link to="/partenaire">
                  Accéder à mon Tableau de Bord Partenaire <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-border">
                <Link to="/partenaire/nouvelle-sortie">
                  Publier une Sortie Musicale
                </Link>
              </Button>
            </div>
          </div>
        ) : isPending || isSubmitted ? (
          /* State 2: Request Pending Review */
          <div className="p-8 rounded-3xl bg-card border border-amber-500/30 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <Clock size={32} />
            </div>
            <h2 className="font-display text-2xl font-extrabold text-foreground">
              Demande en attente de validation
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Votre candidature au rôle d'artiste / partenaire est actuellement entre les mains de l'équipe de direction.
              Dès qu'un administrateur valide votre profil dans le panneau de contrôle, votre accès au tableau de bord sera instantanément activé.
            </p>
            <div className="p-4 bg-secondary/50 rounded-2xl max-w-md mx-auto text-xs text-left space-y-1.5 border border-border/40">
              <p><strong>Compte :</strong> {email}</p>
              <p><strong>Nom / Pseudo :</strong> {latestRequest?.artist_name || name}</p>
              <p><strong>Type sollicité :</strong> {latestRequest?.request_type === 'label' ? 'Label de Production' : latestRequest?.request_type === 'event_organizer' ? "Organisateur d'Événements" : 'Artiste Indépendant'}</p>
              <p><strong>Statut :</strong> <span className="text-amber-400 font-bold">En examen par un administrateur</span></p>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" className="border-border">
                <Link to="/musique">
                  Explorer la musique en attendant
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          /* State 3: Registration & Application Form */
          <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl">
            {!me && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl mb-6 flex items-start gap-3">
                <AlertCircle size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="text-foreground font-bold">Étape 2 préalable requise :</p>
                  <p>
                    Vous devez créer votre compte ou vous connecter avant d'envoyer votre demande de rôle.
                  </p>
                  <div className="pt-2 flex gap-2">
                    <Button asChild size="sm" className="h-8 text-xs font-bold">
                      <Link to="/register?from=/devenir-artiste">Créer un compte</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                      <Link to="/login?from=/devenir-artiste">Se connecter</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type selector */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  1. Choisissez le profil souhaité
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'artist',
                      title: 'Artiste Indépendant',
                      desc: 'Sorties singles & albums, distribution, vente exclusive et streaming gratuit.',
                      icon: Music,
                    },
                    {
                      id: 'label',
                      title: 'Label de Production',
                      desc: 'Gestion multi-artistes, catalogue de masters, signatures et licences.',
                      icon: Disc,
                    },
                    {
                      id: 'event_organizer',
                      title: 'Organisateur Concerts',
                      desc: 'Création d’événements exclusifs, billetterie et scan de contrôle aux portes.',
                      icon: Calendar,
                    },
                  ].map((t) => {
                    const Icon = t.icon;
                    const active = requestType === t.id;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setRequestType(t.id)}
                        className={`p-4 rounded-2xl text-left border transition-all ${
                          active
                            ? 'bg-primary/10 border-primary text-foreground shadow-sm'
                            : 'bg-secondary/30 border-border/60 text-muted-foreground hover:border-border'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
                          active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                        }`}>
                          <Icon size={18} />
                        </div>
                        <p className="font-bold text-sm text-foreground">{t.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-foreground mb-1.5 block">
                    Nom d'artiste / Nom de la structure *
                  </Label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex. Sidy Diop, Sahel Records, Dakar Fest…"
                    className="bg-secondary/40 border-border/60"
                  />
                </div>

                <div>
                  <Label className="text-xs text-foreground mb-1.5 block">
                    Genre musical / Style principal
                  </Label>
                  <Input
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Ex. Afrobeats, Mbalax, Hip-Hop, Amapiano…"
                    className="bg-secondary/40 border-border/60"
                  />
                </div>

                <div>
                  <Label className="text-xs text-foreground mb-1.5 block">
                    Numéro Wave / Orange Money pour vos revenus
                  </Label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={payoutPhone}
                      onChange={(e) => setPayoutPhone(e.target.value)}
                      placeholder="+221 77 123 45 67"
                      className="pl-8 bg-secondary/40 border-border/60 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-foreground mb-1.5 block">
                    Lien démo / Spotify / YouTube / Réseaux sociaux
                  </Label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={portfolioLink}
                      onChange={(e) => setPortfolioLink(e.target.value)}
                      placeholder="https://instagram.com/... ou YouTube"
                      className="pl-8 bg-secondary/40 border-border/60 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-foreground mb-1.5 block">
                  Message ou présentation de vos projets musicaux
                </Label>
                <Textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez brièvement vos titres, albums à publier, ou concerts à programmer…"
                  className="bg-secondary/40 border-border/60 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8"
                >
                  {mutation.isPending ? 'Envoi en cours…' : 'Soumettre ma Demande de Rôle'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
