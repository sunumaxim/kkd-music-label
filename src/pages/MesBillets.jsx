import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import MobileHeader from '@/components/mobile/MobileHeader';
import TicketCard from '@/components/events/TicketCard';
import { Ticket, Loader2, LogIn, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MesBillets() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });
  const email = me?.email;

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my-tickets', email],
    queryFn: () => base44.entities.Ticket.list('-created_date', 100),
    enabled: !!email,
  });

  if (!email) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Mes billets" backPath="/" />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <Ticket size={40} className="mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="font-display font-bold text-lg mb-2">Connectez-vous</h1>
          <p className="text-sm text-muted-foreground mb-6">Vos billets KKD apparaissent ici après achat.</p>
          <Link to="/login"><Button className="gap-2"><LogIn size={15} /> Se connecter</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader title="Mes billets" backPath="/" />
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold mb-2">Mes billets</h1>
        <p className="text-sm text-muted-foreground mb-6">Vos billets générés avec QR code d'entrée.</p>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
            <CalendarDays size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mb-4">Aucun billet pour le moment.</p>
            <Link to="/evenements"><Button className="bg-primary">Voir les événements</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}