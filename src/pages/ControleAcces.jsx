import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation } from 'react-router-dom';
import QrScanner from '@/components/shared/QrScanner';
import ControleTicketDrawer from '@/components/controle/ControleTicketDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  QrCode, Search, CheckCircle2, Loader2, UserPlus, Trash2,
  ScanLine, LogIn, Users, XCircle, AlertCircle, ChevronDown, ChevronUp,
  LogOut, Repeat, ArrowRightLeft, Clock, Ticket as TicketIcon, Download,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function extractTicketNumber(scanned) {
  if (!scanned) return '';
  const match = scanned.match(/\/billet\/(.+)/);
  if (match) return match[1];
  return scanned.trim();
}

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'inside', label: 'Présents' },
  { id: 'outside', label: 'Sortis' },
  { id: 'pending', label: 'En attente' },
];

export default function ControleAcces() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const paramEventId = searchParams.get('event');

  const [selectedId, setSelectedId] = useState(paramEventId || null);
  const [query, setQuery] = useState('');
  const [scanValue, setScanValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [newMgr, setNewMgr] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showManagers, setShowManagers] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanMode, setScanMode] = useState('entry');
  const [filterStatus, setFilterStatus] = useState('all');
  const [drawerTicket, setDrawerTicket] = useState(null);
  const [drawerActionLoading, setDrawerActionLoading] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showTicketSearch, setShowTicketSearch] = useState(false);
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketSearchResults, setTicketSearchResults] = useState([]);
  const [searchingTickets, setSearchingTickets] = useState(false);
  const [newTicket, setNewTicket] = useState({ buyer_name: '', buyer_email: '', buyer_phone: '', buyer_location: '', amount: '', quantity: 1, ticket_category: 'Pass Standard' });
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [lastCreatedTickets, setLastCreatedTickets] = useState(null);
  const [downloadingTicket, setDownloadingTicket] = useState(null);
  const resultTimerRef = useRef(null);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });
  const email = me?.email;

  const { data: allEvents = [] } = useQuery({
    queryKey: ['events-all'],
    queryFn: () => base44.entities.Event.list('-event_date', 200),
  });

  // Liens artiste de l'utilisateur (invitation ou accès approuvé)
  const { data: myInvites = [] } = useQuery({
    queryKey: ['my-invites-controle', email],
    queryFn: () => base44.entities.ArtistInvite.filter({ email }),
    enabled: !!email,
  });
  const { data: myAccessReqs = [] } = useQuery({
    queryKey: ['my-access-reqs-controle', email],
    queryFn: () => base44.entities.ArtistAccessRequest.filter({ user_email: email }),
    enabled: !!email,
  });
  const myArtistIds = [
    ...myInvites.filter((i) => i.status === 'actif' || i.status === 'invite').map((i) => i.artist_id),
    ...myAccessReqs.filter((r) => r.status === 'approuve').map((r) => r.artist_id),
  ];

  const myEvents = allEvents.filter(
    (e) =>
      me?.role === 'admin' ||
      e.organizer_email === email ||
      (Array.isArray(e.managers) && e.managers.includes(email)) ||
      (e.artist_id && myArtistIds.includes(e.artist_id))
  );

  useEffect(() => {
    if (paramEventId && !selectedId) {
      const match = myEvents.find(e => e.id === paramEventId);
      if (match) setSelectedId(match.id);
    }
  }, [paramEventId, myEvents, selectedId]);

  const selected = myEvents.find((e) => e.id === selectedId) || null;

  // Reconnaissance rapide du lien entre l'utilisateur et l'événement sélectionné
  const accessRole = selected
    ? me?.role === 'admin' ? 'Administrateur'
      : selected.organizer_email === email ? 'Organisateur'
      : (Array.isArray(selected.managers) && selected.managers.includes(email)) ? 'Contrôleur'
      : (selected.artist_id && myArtistIds.includes(selected.artist_id)) ? 'Artiste lié'
      : null
    : null;

  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['event-tickets', selectedId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getEventTickets', { event_id: selectedId });
      return res?.tickets || res?.data?.tickets || [];
    },
    enabled: !!selectedId,
  });

  const validated = tickets.filter((t) => t.status === 'valide');
  const inside = validated.filter((t) => t.checked_in);
  const exited = validated.filter((t) => t.checked_out && !t.checked_in);
  const reEntries = validated.filter((t) => (t.entry_count || 0) > 1);

  const filtered = tickets.filter((t) => {
    if (filterStatus === 'inside' && !t.checked_in) return false;
    if (filterStatus === 'outside' && (!t.checked_out || t.checked_in)) return false;
    if (filterStatus === 'pending' && (t.checked_in || t.checked_out)) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (t.buyer_name || '').toLowerCase().includes(q) || (t.ticket_number || '').toLowerCase().includes(q);
  });

  const doAction = async (ticket_id, ticket_number, action) => {
    setChecking(true);
    try {
      const res = await base44.functions.invoke('checkInTicket', ticket_id ? { ticket_id, action } : { ticket_number, action });
      if (action === 'entry') {
        if (res.data?.already) toast({ title: "Déjà à l'intérieur", description: res.data.ticket?.buyer_name });
        else if (res.data?.re_entry) toast({ title: 'Ré-entrée validée ✅', description: res.data.ticket?.buyer_name });
        else toast({ title: 'Entrée validée ✅', description: res.data.ticket?.buyer_name });
      } else {
        toast({ title: 'Sortie enregistrée', description: res.data.ticket?.buyer_name });
      }
      qc.invalidateQueries({ queryKey: ['event-tickets', selectedId] });
      setScanValue('');
    } catch (e) {
      toast({ title: 'Erreur', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setChecking(false); }
  };

  const handleScan = async (scannedText) => {
    const ticketNumber = extractTicketNumber(scannedText);
    if (!ticketNumber) return;
    setScanResult({ type: 'loading', message: scanMode === 'entry' ? 'Validation entrée…' : 'Validation sortie…' });
    try {
      const res = await base44.functions.invoke('checkInTicket', { ticket_number: ticketNumber, action: scanMode });
      const name = res.data?.ticket?.buyer_name;
      if (scanMode === 'entry') {
        if (res.data?.already) setScanResult({ type: 'already', name, message: "Déjà à l'intérieur" });
        else if (res.data?.re_entry) setScanResult({ type: 'success', name, message: 'Ré-entrée validée', isReEntry: true });
        else setScanResult({ type: 'success', name, message: 'Entrée validée' });
      } else {
        setScanResult({ type: 'success', name, message: 'Sortie enregistrée', isExit: true });
      }
      qc.invalidateQueries({ queryKey: ['event-tickets', selectedId] });
    } catch (e) {
      setScanResult({ type: 'error', message: e.response?.data?.error || e.message || 'Erreur' });
    }
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => setScanResult(null), 4000);
  };

  const handleDrawerAction = async (ticket, action) => {
    setDrawerActionLoading(true);
    await doAction(ticket.id, null, action);
    setDrawerActionLoading(false);
    setDrawerTicket(null);
  };

  const addManager = async () => {
    if (!newMgr.trim() || !selected) return;
    try {
      await base44.functions.invoke('updateEventManagers', { event_id: selected.id, action: 'add', email: newMgr.trim() });
      qc.invalidateQueries({ queryKey: ['events-all'] });
      setNewMgr('');
      toast({ title: 'Contrôleur ajouté', description: newMgr.trim() });
    } catch (e) { toast({ title: 'Erreur', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };
  const removeManager = async (m) => {
    if (!selected) return;
    try {
      await base44.functions.invoke('updateEventManagers', { event_id: selected.id, action: 'remove', email: m });
      qc.invalidateQueries({ queryKey: ['events-all'] });
    } catch (e) { toast({ title: 'Erreur', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  // ── Création manuelle de billet (achat externe) ──
  const createTicket = async () => {
    if (!newTicket.buyer_name.trim() || !newTicket.buyer_phone.trim() || !newTicket.buyer_location.trim() || !selected) return;
    setCreatingTicket(true);
    try {
      const res = await base44.functions.invoke('createManualTicket', {
        event_id: selected.id,
        buyer_name: newTicket.buyer_name,
        buyer_email: newTicket.buyer_email,
        buyer_phone: newTicket.buyer_phone,
        buyer_location: newTicket.buyer_location,
        amount: Number(newTicket.amount) || selected.ticket_price || 0,
        quantity: Number(newTicket.quantity) || 1,
        ticket_category: newTicket.ticket_category || 'Pass Standard',
        ticket_theme: selected.ticket_theme || 'classic',
      });
      const tickets = res?.tickets || res?.data?.tickets || (res?.ticket ? [res.ticket] : []);
      if (tickets.length > 0) {
        setLastCreatedTickets(tickets);
        setNewTicket({ buyer_name: '', buyer_email: '', buyer_phone: '', buyer_location: '', amount: '', quantity: 1 });
        toast({ title: `${tickets.length} billet(s) créé(s) ✅`, description: tickets.length === 1 ? tickets[0].ticket_number : `${tickets.length} billets générés` });
        qc.invalidateQueries({ queryKey: ['event-tickets', selectedId] });
      }
    } catch (e) {
      toast({ title: 'Erreur', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setCreatingTicket(false); }
  };

  const downloadTicketPdf = async (ticketNumber) => {
    setDownloadingTicket(ticketNumber);
    try {
      const res = await base44.functions.invoke('generateTicketFile', { ticket_number: ticketNumber, app_url: window.location.origin });
      const pdf = res?.data?.pdf || res?.pdf;
      const filename = res?.data?.filename || res?.filename || `billet-${ticketNumber}.pdf`;
      if (pdf) {
        const bin = atob(pdf);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      } else {
        toast({ title: 'Erreur', description: 'Billet indisponible', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erreur téléchargement', description: e.message, variant: 'destructive' });
    } finally { setDownloadingTicket(null); }
  };

  // ── Recherche de billets (global, tous événements) ──
  const searchTickets = async () => {
    const q = ticketSearchQuery.trim().toLowerCase();
    if (q.length < 2) return;
    setSearchingTickets(true);
    try {
      // Recherche par numéro de billet
      const byNumber = await base44.entities.Ticket.filter({ ticket_number: q });
      let results = byNumber;
      // Recherche par email acheteur
      if (results.length === 0) {
        const byEmail = await base44.entities.Ticket.filter({ buyer_email: q });
        results = byEmail;
      }
      // Recherche par téléphone
      if (results.length === 0) {
        const byPhone = await base44.entities.Ticket.filter({ buyer_phone: q });
        results = byPhone;
      }
      // Recherche par nom (si pas de match exact, on récupère un lot et on filtre localement)
      if (results.length === 0) {
        const allTickets = await base44.entities.Ticket.list('-created_date', 200);
        results = allTickets.filter((t) =>
          (t.buyer_name || '').toLowerCase().includes(q) ||
          (t.buyer_email || '').toLowerCase().includes(q) ||
          (t.buyer_phone || '').toLowerCase().includes(q) ||
          (t.ticket_number || '').toLowerCase().includes(q)
        );
      }
      // Filtrage strict : seuls les organisateurs voient les billets de leurs propres événements
      const myEventIdSet = new Set(myEvents.map(e => e.id));
      if (me?.role !== 'admin') {
        results = results.filter(t => myEventIdSet.has(t.event_id));
      }
      setTicketSearchResults(results);
    } catch (e) {
      setTicketSearchResults([]);
    } finally { setSearchingTickets(false); }
  };

  return (
    <div className="pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold mb-1 flex items-center gap-2">
          <ScanLine size={22} className="text-primary" /> Contrôle d'accès
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Scannez, validez les entrées/sorties et suivez les visiteurs en temps réel.</p>

        {myEvents.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border/70 rounded-3xl p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="font-display font-extrabold text-xl text-foreground mb-2">
              Espace Réservé au Contrôle d'Accès
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              Cet espace de scan et validation des entrées/sorties est strictement réservé aux organisateurs d'événements, aux contrôleurs de portes désignés et à l'administration.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/mes-billets">
                <Button className="gap-2 bg-primary">
                  <TicketIcon size={15} /> Voir mes billets achetés
                </Button>
              </Link>
              <Link to="/evenements">
                <Button variant="outline">Découvrir les événements</Button>
              </Link>
            </div>
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
                <div className="flex items-center gap-1.5 shrink-0">
                  {e.organizer_email === email && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Org.</span>}
                  {Array.isArray(e.managers) && e.managers.includes(email) && e.organizer_email !== email && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">Contr.</span>}
                  {e.artist_id && myArtistIds.includes(e.artist_id) && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">Artiste</span>}
                  <ScanLine size={18} className="text-muted-foreground" />
                </div>
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
              {selected.event_date && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selected.event_date), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              )}
            </div>

            {/* ═══ Badge de reconnaissance d'accès ═══ */}
            {email && accessRole && (
              <div className="flex items-center gap-2 text-xs bg-card border border-border/50 rounded-xl px-3 py-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
                  accessRole === 'Organisateur' ? 'bg-primary/10 text-primary' :
                  accessRole === 'Contrôleur' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-emerald-500/10 text-emerald-600'
                }`}>
                  <CheckCircle2 size={12} /> {accessRole}
                </span>
                <span className="text-muted-foreground truncate">{email}</span>
              </div>
            )}

            {/* ═══ Stats ═══ */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
                <p className="font-display text-xl md:text-2xl font-extrabold">{validated.length}</p>
                <p className="text-[10px] text-muted-foreground">Validés</p>
              </div>
              <div className="bg-card border border-emerald-500/20 rounded-xl p-3 text-center">
                <p className="font-display text-xl md:text-2xl font-extrabold text-emerald-500">{inside.length}</p>
                <p className="text-[10px] text-muted-foreground">Présents</p>
              </div>
              <div className="bg-card border border-amber-500/20 rounded-xl p-3 text-center">
                <p className="font-display text-xl md:text-2xl font-extrabold text-amber-500">{exited.length}</p>
                <p className="text-[10px] text-muted-foreground">Sortis</p>
              </div>
              <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
                <p className="font-display text-xl md:text-2xl font-extrabold text-primary">{reEntries.length}</p>
                <p className="text-[10px] text-muted-foreground">Ré-entrées</p>
              </div>
            </div>

            {/* ═══ Mode scanner (Entrée / Sortie) ═══ */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setScanMode('entry')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-heading font-bold text-sm transition-all ${
                    scanMode === 'entry'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LogIn size={16} /> Entrée
                </button>
                <button
                  onClick={() => setScanMode('exit')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-heading font-bold text-sm transition-all ${
                    scanMode === 'exit'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LogOut size={16} /> Sortie
                </button>
              </div>

              <QrScanner onScan={handleScan} paused={!!scanResult} />

              {/* Résultat */}
              {scanResult && (
                <div className={`rounded-xl p-4 flex items-center gap-3 ${
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
                      {scanResult.isReEntry && <Repeat size={13} className="inline ml-1.5 text-primary" />}
                    </p>
                    {scanResult.name && <p className="text-xs text-muted-foreground truncate">{scanResult.name}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* ═══ Saisie manuelle ═══ */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <button onClick={() => setShowManual(!showManual)} className="w-full flex items-center justify-between p-3 text-sm font-medium">
                <span className="flex items-center gap-2"><Search size={15} className="text-muted-foreground" /> Saisie manuelle</span>
                {showManual ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showManual && (
                <div className="px-3 pb-3 flex items-center gap-2">
                  <Input
                    value={scanValue}
                    onChange={(e) => setScanValue(e.target.value)}
                    placeholder="N° de billet (KKD-...-SM)"
                    onKeyDown={(e) => { if (e.key === 'Enter' && scanValue.trim()) doAction(null, scanValue.trim(), scanMode); }}
                  />
                  <Button size="sm" disabled={!scanValue.trim() || checking} onClick={() => doAction(null, scanValue.trim(), scanMode)} className="gap-2 shrink-0"
                    style={scanMode === 'exit' ? { backgroundColor: '#f59e0b' } : {}}>
                    {checking ? <Loader2 size={14} className="animate-spin" /> : scanMode === 'exit' ? <LogOut size={14} /> : <CheckCircle2 size={14} />}
                    {scanMode === 'exit' ? 'Sortie' : 'Valider'}
                  </Button>
                </div>
              )}
            </div>

            {/* ═══ Liste des visiteurs ═══ */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <button onClick={() => setShowList(!showList)} className="w-full flex items-center justify-between p-3 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Users size={15} className="text-muted-foreground" /> Visiteurs
                  <span className="text-xs text-muted-foreground">({filtered.length})</span>
                </span>
                {showList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showList && (
                <div className="px-3 pb-3 space-y-2">
                  {/* Filtres */}
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {FILTERS.map((f) => (
                      <button key={f.id} onClick={() => setFilterStatus(f.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                          filterStatus === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                        }`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {/* Recherche */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom ou n°" className="pl-9 h-8 text-sm" />
                  </div>
                  {/* Liste */}
                  {loadingTickets ? (
                    <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
                  ) : filtered.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">Aucun billet.</p>
                  ) : filtered.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                      <button onClick={() => setDrawerTicket(t)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          t.checked_in ? 'bg-emerald-500/15' : t.checked_out ? 'bg-amber-500/15' : 'bg-secondary'
                        }`}>
                          {t.checked_in ? <LogIn size={13} className="text-emerald-500" /> : t.checked_out ? <LogOut size={13} className="text-amber-500" /> : <Clock size={13} className="text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-xs truncate flex items-center gap-1">
                            {t.buyer_name || (t.status === 'en_attente' ? 'Billet vierge' : '—')}
                            {(t.entry_count || 0) > 1 && <Repeat size={10} className="text-primary" />}
                            {t.status === 'en_attente' && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-600 font-bold shrink-0">VIERGE</span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {t.checked_in && t.checked_in_date ? `Entré ${format(new Date(t.checked_in_date), 'HH:mm', { locale: fr })}` :
                             t.checked_out && t.checked_out_date ? `Sorti ${format(new Date(t.checked_out_date), 'HH:mm', { locale: fr })}` :
                             t.ticket_number || 'En attente'}
                          </p>
                        </div>
                      </button>
                      {t.status === 'valide' && !t.checked_in && (
                        <Button size="sm" variant="outline" disabled={checking} onClick={() => doAction(t.id, null, 'entry')} className="h-7 px-2 text-xs gap-1 shrink-0">
                          <LogIn size={11} /> Entrée
                        </Button>
                      )}
                      {t.status === 'valide' && t.checked_in && (
                        <Button size="sm" variant="outline" disabled={checking} onClick={() => doAction(t.id, null, 'exit')} className="h-7 px-2 text-xs gap-1 shrink-0"
                          style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
                          <LogOut size={11} /> Sortie
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ═══ Recherche de billets (global) ═══ */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <button onClick={() => { setShowTicketSearch(!showTicketSearch); if (showTicketSearch) { setTicketSearchResults([]); setTicketSearchQuery(''); } }} className="w-full flex items-center justify-between p-3 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Search size={15} className="text-muted-foreground" /> Rechercher un billet
                </span>
                {showTicketSearch ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showTicketSearch && (
                <div className="px-3 pb-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground">Recherchez par nom, email, téléphone ou numéro de billet, sur tous les événements.</p>
                  <div className="flex gap-2">
                    <Input
                      value={ticketSearchQuery}
                      onChange={(e) => setTicketSearchQuery(e.target.value)}
                      placeholder="Nom, email, téléphone ou n° billet"
                      onKeyDown={(e) => { if (e.key === 'Enter') searchTickets(); }}
                    />
                    <Button size="sm" variant="outline" disabled={searchingTickets || ticketSearchQuery.trim().length < 2} onClick={searchTickets} className="gap-1.5 shrink-0">
                      {searchingTickets ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Chercher
                    </Button>
                  </div>
                  {ticketSearchResults.length > 0 && (
                    <div className="space-y-2">
                      {ticketSearchResults.map((t) => (
                        <div key={t.id} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.checked_in ? 'bg-emerald-500/15' : t.checked_out ? 'bg-amber-500/15' : 'bg-secondary'}`}>
                            {t.checked_in ? <LogIn size={13} className="text-emerald-500" /> : t.checked_out ? <LogOut size={13} className="text-amber-500" /> : <TicketIcon size={13} className="text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-heading font-bold text-xs truncate">{t.buyer_name || '—'}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{t.buyer_phone || '—'} · {t.buyer_location || ''}</p>
                            <p className="text-[10px] text-muted-foreground/60 truncate">{t.event_title} · {t.ticket_number}</p>
                          </div>
                          {t.status === 'valide' && (
                            <Button size="sm" variant="ghost" onClick={() => downloadTicketPdf(t.ticket_number)} disabled={downloadingTicket === t.ticket_number} className="h-7 px-2 text-xs gap-1 shrink-0">
                              {downloadingTicket === t.ticket_number ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {ticketSearchResults.length === 0 && ticketSearchQuery.trim().length >= 2 && !searchingTickets && (
                    <p className="text-xs text-muted-foreground text-center py-3">Aucun billet trouvé.</p>
                  )}
                </div>
              )}
            </div>

            {/* ═══ Créer un billet (achat externe) ═══ */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <button onClick={() => { setShowCreateTicket(!showCreateTicket); if (showCreateTicket) setLastCreatedTickets(null); }} className="w-full flex items-center justify-between p-3 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <TicketIcon size={15} className="text-muted-foreground" /> Créer un billet
                </span>
                {showCreateTicket ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showCreateTicket && (
                <div className="px-3 pb-3 space-y-2.5">
                  <p className="text-[11px] text-muted-foreground">Pour les achats effectués à part (espèces, Wave, etc.). Les billets sont générés avec un QR code unique et immédiatement valides.</p>
                  <div>
                    <Input placeholder="Nom et prénom *" value={newTicket.buyer_name} onChange={(e) => setNewTicket({ ...newTicket, buyer_name: e.target.value })} />
                  </div>
                  <div>
                    <Input placeholder="Téléphone *" value={newTicket.buyer_phone} onChange={(e) => setNewTicket({ ...newTicket, buyer_phone: e.target.value })} />
                  </div>
                  <div>
                    <Input placeholder="Ville ou village *" value={newTicket.buyer_location} onChange={(e) => setNewTicket({ ...newTicket, buyer_location: e.target.value })} />
                  </div>
                  <div>
                    <Input placeholder="Email (optionnel)" type="email" value={newTicket.buyer_email} onChange={(e) => setNewTicket({ ...newTicket, buyer_email: e.target.value })} />
                    <p className="text-[10px] text-muted-foreground mt-1">Si fourni, l'acheteur retrouvera ses billets dans « Mes Billets » après connexion.</p>
                  </div>
                  <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                    <span className="text-xs text-muted-foreground">Prix du billet</span>
                    <span className="font-bold text-sm">{Number(newTicket.amount || selected.ticket_price || 0).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <Input placeholder={`Prix personnalisé (défaut: ${Number(selected.ticket_price || 0).toLocaleString('fr-FR')})`} type="number" value={newTicket.amount} onChange={(e) => setNewTicket({ ...newTicket, amount: e.target.value })} />
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nombre de billets</label>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" type="button" onClick={() => setNewTicket({ ...newTicket, quantity: Math.max(1, (Number(newTicket.quantity) || 1) - 1) })} className="h-8 w-8 p-0">−</Button>
                      <Input type="number" min={1} max={50} value={newTicket.quantity} onChange={(e) => setNewTicket({ ...newTicket, quantity: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} className="text-center w-16" />
                      <Button size="sm" variant="outline" type="button" onClick={() => setNewTicket({ ...newTicket, quantity: Math.min(50, (Number(newTicket.quantity) || 1) + 1) })} className="h-8 w-8 p-0">+</Button>
                      <span className="text-xs text-muted-foreground ml-1">× {Number(newTicket.amount || selected.ticket_price || 0).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>
                  <Button size="sm" disabled={!newTicket.buyer_name.trim() || !newTicket.buyer_phone.trim() || !newTicket.buyer_location.trim() || creatingTicket} onClick={createTicket} className="gap-2 w-full">
                    {creatingTicket ? <Loader2 size={14} className="animate-spin" /> : <TicketIcon size={14} />} Créer {Number(newTicket.quantity) > 1 ? `${newTicket.quantity} billets` : 'le billet'}
                  </Button>
                  {lastCreatedTickets && lastCreatedTickets.length > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <p className="text-xs font-bold text-emerald-600">{lastCreatedTickets.length} billet(s) créé(s) ✅</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{lastCreatedTickets[0].buyer_name} · {lastCreatedTickets[0].buyer_phone} · {lastCreatedTickets[0].buyer_location || '—'}</p>
                      <div className="space-y-1.5">
                        {lastCreatedTickets.map((t) => (
                          <div key={t.id} className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground flex-1 truncate">{t.ticket_number}</span>
                            <Button size="sm" variant="outline" onClick={() => downloadTicketPdf(t.ticket_number)} disabled={downloadingTicket === t.ticket_number} className="h-7 px-2 text-xs gap-1 shrink-0">
                              {downloadingTicket === t.ticket_number ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} PDF
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ═══ Contrôleurs ═══ */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <button onClick={() => setShowManagers(!showManagers)} className="w-full flex items-center justify-between p-3 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <ArrowRightLeft size={15} className="text-muted-foreground" /> Contrôleurs
                  <span className="text-xs text-muted-foreground">({(selected.managers || []).length})</span>
                </span>
                {showManagers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showManagers && (
                <div className="px-3 pb-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground">Ajoutez les emails des contrôleurs autorisés à scanner les billets.</p>
                  <div className="flex gap-2">
                    <Input value={newMgr} onChange={(e) => setNewMgr(e.target.value)} placeholder="email du contrôleur"
                      onKeyDown={(e) => { if (e.key === 'Enter') addManager(); }} />
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
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drawer détail billet */}
      {drawerTicket && (
        <ControleTicketDrawer
          ticket={drawerTicket}
          onClose={() => setDrawerTicket(null)}
          onAction={handleDrawerAction}
          actionLoading={drawerActionLoading}
        />
      )}
    </div>
  );
}