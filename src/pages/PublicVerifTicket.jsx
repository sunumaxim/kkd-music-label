import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import QrWithLogo from '@/components/events/QrWithLogo';
import MobileHeader from '@/components/mobile/MobileHeader';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, MapPin, Calendar, CheckCircle2, Ticket, ShieldCheck, LogIn, User } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';

export default function PublicVerifTicket() {
  const { number } = useParams();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);

  const { data: t, isLoading, error } = useQuery({
    queryKey: ['ticket-by-number', number],
    queryFn: async () => {
      const res = await base44.functions.invoke('getTicketByNumber', { ticket_number: number });
      return res.data;
    },
    retry: false,
  });

  const checkIn = async () => {
    setChecking(true);
    try {
      const res = await base44.functions.invoke('checkInTicket', { ticket_number: number });
      if (res.data?.already) toast({ title: 'Déjà enregistré', description: res.data.ticket.buyer_name });
      else toast({ title: 'Entrée validée ✅', description: res.data.ticket.buyer_name });
      qc.invalidateQueries({ queryKey: ['ticket-by-number', number] });
    } catch (e) {
      toast({ title: 'Erreur', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setChecking(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !t) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <Ticket size={40} className="text-muted-foreground/30" />
        <p className="text-muted-foreground">Billet introuvable ou non validé.</p>
        <Link to="/evenements" className="text-primary text-sm">← Événements</Link>
      </div>
    );
  }

  const verifUrl = `${window.location.origin}/billet/${t.ticket_number}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader title="Vérification billet" backPath="/evenements" />
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          {/* Bandeau affiche */}
          {t.event_image_url && (
            <div className="relative h-40">
              <img src={t.event_image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>
          )}

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={LOGO_URL} alt="KKD" className="h-6 w-auto" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary">Billet KKD</span>
              </div>
              {t.checked_in ? (
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 size={14} /> Entrée validée</span>
              ) : (
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><ShieldCheck size={14} /> Valide</span>
              )}
            </div>

            <div>
              <h1 className="font-display text-xl font-extrabold leading-tight">{t.event_title}</h1>
              {t.artist_name && <p className="text-sm text-primary font-medium">{t.artist_name}</p>}
              {t.event_date && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Calendar size={12} /> {format(new Date(t.event_date), "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              )}
              {(t.location || t.city) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <MapPin size={12} /> {[t.city, t.location].filter(Boolean).join(' — ')}
                </p>
              )}
            </div>

            {/* QR avec affiche centrée */}
            <div className="flex justify-center py-2">
              <QrWithLogo value={verifUrl} image={t.event_image_url} size={200} />
            </div>
            <p className="text-center text-[10px] font-mono text-muted-foreground break-all px-4">{t.ticket_number}</p>

            {/* Acheteur */}
            <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <User size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Au nom de</p>
                <p className="font-heading font-bold">{t.buyer_name || '—'}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Prix</p>
                <p className="font-heading font-bold text-sm">{Number(t.amount || 0).toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>

            {/* Check-in pour organisateurs */}
            {t.can_check_in && !t.checked_in && (
              <Button onClick={checkIn} disabled={checking} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                {checking ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Valider l'entrée
              </Button>
            )}
            {t.checked_in && t.checked_in_date && (
              <p className="text-xs text-center text-emerald-500">Entrée validée le {format(new Date(t.checked_in_date), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
            )}
          </div>
        </div>

        <Link to="/evenements" className="block text-center text-xs text-muted-foreground hover:text-primary mt-4">← Retour aux événements</Link>
      </div>
    </div>
  );
}