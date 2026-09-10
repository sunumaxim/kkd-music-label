import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Ticket, Layers, Download, CheckCircle, AlertTriangle, Store, Monitor } from 'lucide-react';

export default function BatchTicketGenerator({ event, user }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const isOrganizer = user?.email && event?.organizer_email === user.email;
  const isAdmin = user?.role === 'admin';
  const isManager = user?.email && (event?.managers || []).includes(user.email);
  const isAuthorized = isAdmin || isOrganizer || isManager;

  const [open, setOpen] = useState(false);
  const [blank, setBlank] = useState(false);
  const [quantity, setQuantity] = useState(25);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');

  // Catégories disponibles pour l'événement
  const categories = (event?.ticket_categories && event.ticket_categories.length > 0)
    ? event.ticket_categories
    : [
        { id: 'standard', name: 'Pass Standard', price: event?.ticket_price || 5000 },
        { id: 'vip', name: 'Pass VIP', price: Math.round((event?.ticket_price || 5000) * 2.5) }
      ];

  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || 'Pass Standard');
  const [amount, setAmount] = useState(categories[0]?.price || event?.ticket_price || 5000);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Maximum allowed
  const maxAllowed = isAdmin || isOrganizer ? 1000 : 100;

  const { data: myTickets = [] } = useQuery({
    queryKey: ['event-batch-tickets', event?.id],
    queryFn: async () => {
      if (!event?.id) return [];
      const list = await base44.entities.Ticket.filter({ event_id: event.id });
      return list.filter((t) => t.batch_id).sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
    },
    enabled: open && !!event?.id,
  });

  if (!isAuthorized) {
    return null;
  }

  const handleCategoryChange = (catName) => {
    setSelectedCategory(catName);
    const found = categories.find(c => c.name === catName);
    if (found?.price) {
      setAmount(found.price);
    }
  };

  const handleGenerate = async () => {
    if (!blank && (!name.trim() || !phone.trim() || !location.trim())) {
      toast({ title: 'Nom, téléphone et lieu requis pour les billets nominatifs', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const payload = {
        event_id: event.id,
        quantity: Number(quantity),
        amount: Number(amount) || 0,
        blank,
        ticket_category: selectedCategory,
        ticket_theme: event.ticket_theme || 'classic',
      };
      if (!blank) {
        payload.buyer_name = name.trim();
        payload.buyer_email = email.trim();
        payload.buyer_phone = phone.trim();
        payload.buyer_location = location.trim();
      }
      const res = await base44.functions.invoke('generateTicketBatch', payload);
      setResult(res.data);
      qc.invalidateQueries({ queryKey: ['event-batch-tickets', event.id] });
      toast({
        title: `${res.data.count} billets ${blank ? 'vierges' : ''} générés avec succès`,
        description: blank ? 'Prêts pour impression et activation guichet' : `Lot n° ${res.data.batch_id}`,
      });
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

  const downloadAllTickets = async () => {
    if (!result?.tickets) return;
    setDownloadingAll(true);
    for (let i = 0; i < result.tickets.length; i++) {
      await downloadTicket(result.tickets[i].ticket_number);
      if (i < result.tickets.length - 1) await new Promise(r => setTimeout(r, 200));
    }
    setDownloadingAll(false);
    toast({ title: 'Téléchargement terminé', description: `${result.tickets.length} billets téléchargés.` });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0 text-primary">
          <Layers size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm text-foreground">Générer un lot de billets (Guichet / Partenaires)</p>
          <p className="text-xs text-muted-foreground">Création groupée sécurisée avec QR codes infalsifiables (max {maxAllowed})</p>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Layers size={16} />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Génération de Lots Sécurisés</span>
        </div>
        <button
          onClick={() => { setOpen(false); setResult(null); }}
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
        >
          Fermer
        </button>
      </div>

      {result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            <CheckCircle size={18} />
            <span className="font-heading font-bold text-sm">{result.count} billets {blank ? 'vierges' : ''} générés</span>
          </div>

          {blank && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary">
              <Store size={15} className="shrink-0 mt-0.5" />
              <p>Billets vierges prêts à imprimer pour la vente physique au guichet. L'acheteur scanne le QR code pour l'activer.</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground font-mono">Lot ID : {result.batch_id}</p>

          <div className="max-h-48 overflow-y-auto space-y-1.5 bg-secondary/40 rounded-xl p-3">
            {result.tickets.slice(0, 20).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/50 last:border-0">
                <span className="font-mono truncate text-foreground">{t.ticket_number}</span>
                <button
                  onClick={() => downloadTicket(t.ticket_number)}
                  className="text-primary hover:underline flex items-center gap-1 font-semibold shrink-0"
                >
                  <Download size={12} /> PDF
                </button>
              </div>
            ))}
            {result.tickets.length > 20 && (
              <p className="text-[10px] text-muted-foreground text-center pt-2">
                +{result.tickets.length - 20} autres billets disponibles
              </p>
            )}
          </div>

          <Button variant="outline" onClick={downloadAllTickets} disabled={downloadingAll} className="w-full gap-2 font-bold">
            {downloadingAll ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {downloadingAll ? 'Téléchargement groupé...' : `Télécharger tous les PDFs (${result.tickets.length})`}
          </Button>
          <Button variant="ghost" onClick={() => setResult(null)} className="w-full text-xs">
            Générer un autre lot
          </Button>
        </div>
      ) : (
        <>
          {/* Choix du mode */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setBlank(false)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${!blank ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
            >
              <Monitor size={18} />
              <span className="text-xs font-bold">Billet Nominatif</span>
              <span className="text-[10px] text-muted-foreground text-center">Infos acheteur attribuées</span>
            </button>
            <button
              onClick={() => setBlank(true)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${blank ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
            >
              <Store size={18} />
              <span className="text-xs font-bold">Vente Guichet Physique</span>
              <span className="text-[10px] text-muted-foreground text-center">Billets vierges à activation</span>
            </button>
          </div>

          {/* Sélection de catégorie */}
          <div>
            <Label className="text-xs mb-1.5 block font-bold text-foreground">Catégorie de Pass</Label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id || c.name}
                  type="button"
                  onClick={() => handleCategoryChange(c.name)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    selectedCategory === c.name
                      ? 'bg-primary text-white border-primary font-bold shadow-xs'
                      : 'bg-secondary text-muted-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {c.name} ({Number(c.price || 0).toLocaleString('fr-FR')} FCFA)
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block font-bold">Quantité (max {maxAllowed})</Label>
              <Input
                type="number"
                min="1"
                max={maxAllowed}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(maxAllowed, Math.max(1, Number(e.target.value))))}
                className="bg-background border-border font-bold"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block font-bold">Montant unitaire (FCFA)</Label>
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background border-border font-bold"
              />
            </div>
          </div>

          {!blank && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Nom complet *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex : Aminata Diallo" className="bg-background border-border" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Téléphone *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 77..." className="bg-background border-border" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Ville / Localisation *</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Dakar, Almadies..." className="bg-background border-border" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Email (recommandé pour synchronisation)</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="acheteur@gmail.com" className="bg-background border-border" />
              </div>
            </div>
          )}

          {blank && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary">
              <Store size={15} className="shrink-0 mt-0.5" />
              <p>
                Les billets générés seront imprimables immédiatement. L'acheteur pourra scanner le QR code pour l'activer sur son nom.
              </p>
            </div>
          )}

          {event.ticket_capacity > 0 && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              Jauge : {event.tickets_sold || 0} / {event.ticket_capacity} vendus ({Math.max(0, event.ticket_capacity - (event.tickets_sold || 0))} disponibles).
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating} className="w-full h-11 bg-primary text-white gap-2 font-bold shadow-xs">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
            {generating ? 'Génération du lot sécurisé...' : `Générer ${quantity} pass ${blank ? 'vierges' : ''}`}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            QR codes cryptographiques haute résolution et codes-barres Code128 intégrés
          </p>
        </>
      )}

      {/* Lots déjà générés */}
      {myTickets.length > 0 && !result && (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider font-bold">
            Lots déjà émis ({myTickets.length} billets)
          </p>
          <div className="max-h-36 overflow-y-auto space-y-1">
            {myTickets.slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 text-xs py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono truncate text-foreground">{t.ticket_number}</span>
                  {t.ticket_category && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold shrink-0">
                      {t.ticket_category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => downloadTicket(t.ticket_number)}
                  className="text-primary hover:underline flex items-center gap-1 shrink-0 font-semibold"
                >
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
