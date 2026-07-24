import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import MobileHeader from '@/components/mobile/MobileHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { QrCode, Search, CheckCircle2, Loader2, UserPlus, Trash2, ScanLine, LogIn, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ControleAcces() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [scanValue, setScanValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [newMgr, setNewMgr] = useState('');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });
  const email = me?.email;

  const { data: allEvents = [] } = useQuery({
    queryKey: ['events-all'],
    queryFn: () => base44.entities.Event.list('-event_date', 200),
  });
  const myEvents = allEvents.filter(
    (e) => e.organizer_email === email || (Array.isArray(e.managers) && e.managers.includes(email))
  );

  const selected = myEvents.find((e) => e.id === selectedId) || null;

  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['event-tickets', selectedId],
    queryFn: () => base44.entities.Ticket.filter({ event_id: selectedId }, '-created_date'),
    enabled: !!selectedId,
  });

  const filtered = tickets.filter((t) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (t.buyer_name || '').toLowerCase().includes(q) || (t.ticket_number || '').toLowerCase().includes(q);
  });
  const validated = tickets.filter((t) => t.status === 'valide');
  const checkedIn = validated.filter((t) => t.checked_in);

  const checkIn = async (ticket_id, ticket_number) => {
    setChecking(true);
    try {
      const res = await base44.functions.invoke('checkInTicket', ticket_id ? { ticket_id } : { ticket_number });
      if (res.data?.already) toast({ title: 'Déjà enregistré', description: res.data.ticket.buyer_name });
      else toast({ title: 'Entrée validée ✅', description: res.data.ticket.buyer_name });
      qc.invalidateQueries({ queryKey: ['event-tickets', selectedId] });
      setScanValue('');
    } catch (e) {
      toast({ title: 'Erreur', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setChecking(false); }
  };

  const addManager = async () => {
    if (!newMgr.trim() || !selected) return;
    const list = Array.from(new Set([...(selected.managers || []), newMgr.trim()]));
    try {
      await base44.entities.Event.update(selected.id, { managers: list });
      qc.invalidateQueries({ queryKey: ['events-all'] });
      setNewMgr('');
      toast({ title: 'Gestionnaire ajouté' });
    } catch (e) { toast({ title: 'Erreur', description: e.message, variant: 'destructive' }); }
  };
  const removeManager = async (m) => {
    if (!selected) return;
    const list = (selected.managers || []).filter((x) => x !== m);
    try {
      await base44.entities.Event.update(selected.id, { managers: list });
      qc.invalidateQueries({ queryKey: ['events-all'] });
    } catch (e) { toast({ title: 'Erreur', description: e.message, variant: 'destructive' }); }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Contrôle d'accès" backPath="/" />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <ScanLine size={40} className="mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="font-display font-bold text-lg mb-2">Connexion requise</h1>
          <p className="text-sm text-muted-foreground mb-6">Réservé aux organisateurs et gestionnaires d'événements.</p>
          <Link to="/login"><Button className="gap-2"><LogIn size={15} /> Se connecter</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader title="Contrôle d'accès" backPath="/" />
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-12">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold mb-2 flex items-center gap-2">
          <ScanLine size={22} className="text-primary" /> Contrôle d'accès
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Vérifiez et validez les entrées de vos événements.</p>

        {myEvents.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
            <Users size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Vous n'organisez aucun événement pour le moment.</p>
          </div>
        ) : !selected ? (
          <div className="space-y-3">
            {myEvents.map((e) => (
              <button key={e.id} onClick={() => setSelectedId(e.id)}
                className="w-full text-left bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/40 transition-colors flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <QrCode size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.event_date ? format(new Date(e.event_date), 'dd MMM yyyy HH:mm', { locale: fr }) : ''} · {e.tickets_sold || 0} billets
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <button onClick={() => setSelectedId(null)} className="text-xs text-muted-foreground hover:text-primary">← Changer d'événement</button>
            <div>
              <h2 className="font-display font-extrabold text-lg">{selected.title}</h2>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
                  <p className="font-display text-2xl font-extrabold">{validated.length}</p>
                  <p className="text-[11px] text-muted-foreground">Vendus</p>
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
                  <p className="font-display text-2xl font-extrabold text-emerald-500">{checkedIn.length}</p>
                  <p className="text-[11px] text-muted-foreground">Entrés</p>
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
                  <p className="font-display text-2xl font-extrabold">{Math.max(0, validated.length - checkedIn.length)}</p>
                  <p className="text-[11px] text-muted-foreground">Restants</p>
                </div>
              </div>
            </div>

            {/* Scan / recherche */}
            <div className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-2">
              <ScanLine size={16} className="text-primary shrink-0" />
              <Input value={scanValue} onChange={(e) => setScanValue(e.target.value)} placeholder="Scanner / saisir n° de billet (KKD-...-SM)" className="border-0 focus-visible:ring-0" onKeyDown={(e) => { if (e.key === 'Enter' && scanValue.trim()) checkIn(null, scanValue.trim()); }} />
              <Button size="sm" disabled={!scanValue.trim() || checking} onClick={() => checkIn(null, scanValue.trim())} className="bg-primary gap-2">
                {checking ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Valider
              </Button>
            </div>

            {/* Recherche par nom */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom ou n° de billet" className="pl-9" />
            </div>

            {/* Liste */}
            <div className="space-y-2">
              {loadingTickets ? (
                <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun billet.</p>
              ) : filtered.map((t) => (
                <div key={t.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.checked_in ? 'bg-emerald-500/15' : 'bg-secondary'}`}>
                    <CheckCircle2 size={16} className={t.checked_in ? 'text-emerald-500' : 'text-muted-foreground'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm truncate">{t.buyer_name || '—'}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{t.ticket_number || 'En attente de validation'}</p>
                  </div>
                  {t.status === 'valide' && !t.checked_in && (
                    <Button size="sm" variant="outline" disabled={checking} onClick={() => checkIn(t.id)} className="gap-1.5">
                      <CheckCircle2 size={13} /> Entrée
                    </Button>
                  )}
                  {t.checked_in && <span className="text-[11px] text-emerald-500 font-medium">Entré</span>}
                </div>
              ))}
            </div>

            {/* Gestionnaires */}
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60">Gestionnaires d'accès</p>
              <div className="flex gap-2">
                <Input value={newMgr} onChange={(e) => setNewMgr(e.target.value)} placeholder="email du gestionnaire" />
                <Button size="sm" variant="outline" onClick={addManager} className="gap-1.5"><UserPlus size={14} /> Ajouter</Button>
              </div>
              <div className="space-y-1.5">
                {(selected.managers || []).map((m) => (
                  <div key={m} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-1.5 text-xs">
                    <span>{m}</span>
                    <button onClick={() => removeManager(m)} className="text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                  </div>
                ))}
                {(selected.managers || []).length === 0 && <p className="text-[11px] text-muted-foreground">Aucun gestionnaire ajouté.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}