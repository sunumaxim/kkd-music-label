import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Ticket, Layers, Download, CheckCircle, AlertTriangle } from 'lucide-react';

export default function BatchTicketGenerator({ event, user }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(50);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState(event.ticket_price || 0);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  // Déterminer la limite max selon le rôle
  const isPartner = user?.role === 'admin' || event.organizer_email === user?.email;
  const maxAllowed = isPartner ? 700 : 100;

  const { data: myTickets = [] } = useQuery({
    queryKey: ['event-batch-tickets', event.id],
    queryFn: async () => {
      const list = await base44.entities.Ticket.filter({ event_id: event.id });
      return list.filter((t) => t.batch_id).sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
    },
    enabled: open,
  });

  const handleGenerate = async () => {
    if (!name.trim() || !phone.trim() || !location.trim()) {
      toast({ title: 'Nom, téléphone et lieu requis', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateTicketBatch', {
        event_id: event.id,
        quantity: Number(quantity),
        buyer_name: name.trim(),
        buyer_email: email.trim(),
        buyer_phone: phone.trim(),
        buyer_location: location.trim(),
        amount: Number(amount) || 0,
      });
      setResult(res.data);
      qc.invalidateQueries({ queryKey: ['event-batch-tickets', event.id] });
      toast({ title: `${res.data.count} billets générés`, description: `Lot ${res.data.batch_id}` });
    } catch (err) {
      toast({ title: 'Erreur', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const downloadTicket = async (ticketNumber) => {
    try {
      const res = await base44.functions.invoke('generateTicketFile', {
        ticket_number: ticketNumber,
        app_url: window.location.origin,
      });
      if (res.data?.pdf) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.data.pdf}`;
        link.download = res.data.filename || `billet-${ticketNumber}.pdf`;
        link.click();
      }
    } catch (err) {
      toast({ title: 'Erreur PDF', description: err.message, variant: 'destructive' });
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors shrink-0">
          <Layers size={18} className="text-primary" />
        </div>
        <div className="text-left">
          <p className="font-heading font-bold text-sm">Générer un lot de billets</p>
          <p className="text-xs text-muted-foreground">Jusqu'à {maxAllowed} billets automatiques avec QR sécurisés</p>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Layers size={16} />
          <span className="text-[11px] font-mono uppercase tracking-widest">Génération en lot</span>
        </div>
        <button onClick={() => { setOpen(false); setResult(null); }} className="text-xs text-muted-foreground hover:text-foreground">Fermer</button>
      </div>

      {result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle size={18} />
            <span className="font-heading font-bold text-sm">{result.count} billets générés avec succès</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">Lot : {result.batch_id}</p>
          <div className="max-h-48 overflow-y-auto space-y-1.5 bg-secondary/30 rounded-xl p-3">
            {result.tickets.slice(0, 20).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono truncate">{t.ticket_number}</span>
                <button onClick={() => downloadTicket(t.ticket_number)} className="text-primary hover:underline flex items-center gap-1 shrink-0">
                  <Download size={11} /> PDF
                </button>
              </div>
            ))}
            {result.tickets.length > 20 && (
              <p className="text-[10px] text-muted-foreground text-center pt-1">+{result.tickets.length - 20} autres — téléchargez-les depuis « Mes billets »</p>
            )}
          </div>
          <Button variant="outline" onClick={() => setResult(null)} className="w-full">Générer un autre lot</Button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Quantité (max {maxAllowed})</Label>
              <Input type="number" min="1" max={maxAllowed} value={quantity} onChange={(e) => setQuantity(Math.min(maxAllowed, Math.max(1, Number(e.target.value))))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Montant unitaire (FCFA)</Label>
              <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Nom (acheteur) *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Téléphone *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 ..." />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Lieu / Ville *</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Dakar..." />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Email (facultatif)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" />
            </div>
          </div>

          {event.ticket_capacity > 0 && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              Capacité : {event.tickets_sold || 0}/{event.ticket_capacity} vendus. {Math.max(0, event.ticket_capacity - (event.tickets_sold || 0))} restants.
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating} className="w-full h-11 bg-primary gap-2">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
            {generating ? 'Génération...' : `Générer ${quantity} billet${quantity > 1 ? 's' : ''}`}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Numéros cryptographiques uniques · QR codes sécurisés avec hash de vérification
          </p>
        </>
      )}

      {/* Lots déjà générés */}
      {myTickets.length > 0 && !result && (
        <div className="border-t border-border/30 pt-3 space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Billets de lot déjà générés ({myTickets.length})</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {myTickets.slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono truncate">{t.ticket_number}</span>
                <button onClick={() => downloadTicket(t.ticket_number)} className="text-primary hover:underline flex items-center gap-1 shrink-0">
                  <Download size={11} /> PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}