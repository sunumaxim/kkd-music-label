import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import MobileHeader from '@/components/mobile/MobileHeader';
import QrScanner from '@/components/shared/QrScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  QrCode, Search, CheckCircle2, Loader2, UserPlus, Trash2,
  ScanLine, LogIn, Users, XCircle, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/** Extrait le n° de billet depuis l'URL encodée dans le QR ou depuis une saisie brute */
function extractTicketNumber(scanned) {
  if (!scanned) return '';
  const match = scanned.match(/\/billet\/(.+)/);
  if (match) return match[1];
  return scanned.trim();
}

export default function ControleAcces() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [scanValue, setScanValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [newMgr, setNewMgr] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [showList, setShowList] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { type, name, message }
  const resultTimerRef = useRef(null);

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

  const handleScan = async (scannedText) => {
    const ticketNumber = extractTicketNumber(scannedText);
    if (!ticketNumber) return;
    setScanResult({ type: 'loading', message: 'Validation en cours…' });
    try {
      const res = await base44.functions.invoke('checkInTicket', { ticket_number: ticketNumber });
      if (res.data?.already) {
        setScanResult({ type: 'already', name: res.data.ticket?.buyer_name, message: 'Déjà entré' });
      } else {
        setScanResult({ type: 'success', name: res.data.ticket?.buyer_name, message: 'Entrée validée' });
      }
      qc.invalidateQueries({ queryKey: ['event-tickets', selectedId] });
    } catch (e) {
      setScanResult({ type: 'error', message: e.response?.data?.error || e.message || 'Billet invalide' });
    }
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => setScanResult(null), 4000);
  };

  const addManager = async () => {
    if (!newMgr.trim() || !selected) return;
    const list = Array.from(new Set([...(selected.managers || []), newMgr.trim()]));
    try {
      await base44.entities.Event.update(selected.id, { managers: list });
      qc.invalidateQueries({ queryKey: ['events-all'] });
      setNewMgr('');
      toast({ title: 'Contrôleur ajouté', description: newMgr.trim() });
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
          <p className="text-sm text-muted-foreground mb-6">Réservé aux organisateurs et contrôleurs d'événements.</p>
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
        <p className="text-sm text-muted-foreground mb-6">Scannez les QR codes des billets et validez les entrées.</p>

        {myEvents.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
            <Users size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Vous n'organisez aucun événement pour le moment.</p>
          </div>
        ) : !selected ? (
          <div className="space-y-3">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-1">Vos événements</p>
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
                <ScanLine size={18} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <button onClick={() => { setSelectedId(null); setScanResult(null); }} className="text-xs text-muted-foreground hover:text-primary">
              ← Changer d'événement
            </button>

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

            {/* ═══ Scanner QR (interface principale) ═══ */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Scanner le billet</p>
              <QrScanner onScan={handleScan} paused={!!scanResult} />

              {/* Résultat du scan */}
              {scanResult && (
                <div className={`rounded-xl p-4 flex items-center gap-3 animate-in fade-in ${
                  scanResult.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                  scanResult.type === 'already' ? 'bg-amber-500/10 border border-amber-500/30' :
                  scanResult.type === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                  'bg-secondary border border-border/50'
                }`}>
                  {scanResult.type === 'loading' && <Loader2 size={22} className="animate-spin text-muted-foreground shrink-0" />}
                  {scanResult.type === 'success' && <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />}
                  {scanResult.type === 'already' && <AlertCircle size={22} className="text-amber-500 shrink-0" />}
                  {scanResult.type === 'error' && <XCircle size={22} className="text-red-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`font-heading font-bold text-sm ${
                      scanResult.type === 'success' ? 'text-emerald-600' :
                      scanResult.type === 'already' ? 'text-amber-600' :
                      scanResult.type === 'error' ? 'text-red-600' : ''
                    }`}>
                      {scanResult.message}
                    </p>
                    {scanResult.name && <p className="text-xs text-muted-foreground truncate">{scanResult.name}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* ═══ Saisie manuelle (repli) ═══ */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowManual(!showManual)}
                className="w-full flex items-center justify-between p-3 text-sm font-medium"
              >
                <span className="flex items-center gap-2"><Search size={15} className="text-muted-foreground" /> Saisie manuelle</span>
                {showManual ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showManual && (
                <div className="px-3 pb-3 flex items-center gap-2">
                  <Input
                    value={scanValue}
                    onChange={(e) => setScanValue(e.target.value)}
                    placeholder="N° de billet (KKD-...-SM)"
                    onKeyDown={(e) => { if (e.key === 'Enter' && scanValue.trim()) checkIn(null, scanValue.trim()); }}
                  />
                  <Button size="sm" disabled={!scanValue.trim() || checking} onClick={() => checkIn(null, scanValue.trim())} className="bg-primary gap-2 shrink-0">
                    {checking ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Valider
                  </Button>
                </div>
              )}
            </div>

            {/* ═══ Liste des billets ═══ */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowList(!showList)}
                className="w-full flex items-center justify-between p-3 text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <Users size={15} className="text-muted-foreground" /> Liste des billets
                  <span className="text-xs text-muted-foreground">({filtered.length})</span>
                </span>
                {showList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showList && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom ou n°" className="pl-9 h-8 text-sm" />
                  </div>
                  {loadingTickets ? (
                    <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
                  ) : filtered.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">Aucun billet.</p>
                  ) : filtered.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.checked_in ? 'bg-emerald-500/15' : 'bg-secondary'}`}>
                        <CheckCircle2 size={13} className={t.checked_in ? 'text-emerald-500' : 'text-muted-foreground'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-xs truncate">{t.buyer_name || '—'}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{t.ticket_number || 'En attente'}</p>
                      </div>
                      {t.status === 'valide' && !t.checked_in && (
                        <Button size="sm" variant="outline" disabled={checking} onClick={() => checkIn(t.id)} className="h-7 px-2 text-xs gap-1">
                          <CheckCircle2 size={11} /> Entrée
                        </Button>
                      )}
                      {t.checked_in && <span className="text-[10px] text-emerald-500 font-medium">Entré</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ═══ Contrôleurs / Gestionnaires ═══ */}
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60">Contrôleurs d'accès</p>
              <p className="text-[11px] text-muted-foreground">Ajoutez les emails des personnes autorisées à scanner les billets à l'entrée.</p>
              <div className="flex gap-2">
                <Input value={newMgr} onChange={(e) => setNewMgr(e.target.value)} placeholder="email du contrôleur" onKeyDown={(e) => { if (e.key === 'Enter') addManager(); }} />
                <Button size="sm" variant="outline" onClick={addManager} className="gap-1.5 shrink-0"><UserPlus size={14} /> Ajouter</Button>
              </div>
              <div className="space-y-1.5">
                {(selected.managers || []).map((m) => (
                  <div key={m} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-1.5 text-xs">
                    <span className="truncate">{m}</span>
                    <button onClick={() => removeManager(m)} className="text-muted-foreground hover:text-destructive shrink-0 ml-2"><Trash2 size={13} /></button>
                  </div>
                ))}
                {(selected.managers || []).length === 0 && <p className="text-[11px] text-muted-foreground">Aucun contrôleur ajouté.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}