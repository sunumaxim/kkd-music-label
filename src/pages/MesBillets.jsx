import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import MobileHeader from '@/components/mobile/MobileHeader';
import TicketCard from '@/components/events/TicketCard';
import { Ticket, Loader2, LogIn, CalendarDays, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function downloadPdf(b64, name) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url; a.download = name || 'billet-KKD.pdf';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export default function MesBillets() {
  const { toast } = useToast();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });
  const email = me?.email;
  const [downloading, setDownloading] = useState(null);

  const download = async (ticket_number) => {
    setDownloading(ticket_number);
    try {
      const res = await base44.functions.invoke('generateTicketFile', { ticket_number, app_url: window.location.origin });
      if (res.data?.pdf) downloadPdf(res.data.pdf, res.data.filename);
      else toast({ title: 'Erreur', description: res.data?.error || 'Billet indisponible', variant: 'destructive' });
    } catch (e) {
      toast({ title: 'Erreur', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setDownloading(null); }
  };

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
            {tickets.map((t) => (
              <div key={t.id} className="space-y-2">
                <TicketCard ticket={t} />
                {t.status === 'valide' && (
                  <Button variant="outline" size="sm" onClick={() => download(t.ticket_number)} disabled={downloading === t.ticket_number} className="gap-2 w-full">
                    {downloading === t.ticket_number ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Télécharger mon billet
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}