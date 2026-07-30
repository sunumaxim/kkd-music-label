import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Wallet, TrendingUp, Percent, ArrowDownToLine,
  Save, CheckCircle, Clock, XCircle, Music, Ticket,
  Smartphone, Info, ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const PLATFORM_COMMISSION = 0.10;

function formatFCFA(n) {
  return `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
}

function compactDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TX_STATUS = {
  paid: { label: 'Payé', cls: 'text-green-400', Ic: CheckCircle },
  valide: { label: 'Validé', cls: 'text-green-400', Ic: CheckCircle },
  pending: { label: 'En attente', cls: 'text-yellow-400', Ic: Clock },
  en_attente: { label: 'En attente', cls: 'text-yellow-400', Ic: Clock },
  refunded: { label: 'Remboursé', cls: 'text-red-400', Ic: XCircle },
  refuse: { label: 'Refusé', cls: 'text-red-400', Ic: XCircle },
  annule: { label: 'Annulé', cls: 'text-red-400', Ic: XCircle },
};

export default function ArtistEarnings({ user, artistName, artist }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [waveNum, setWaveNum] = useState(user?.wave_number || artist?.wave_number || '');
  const [payoutPhone, setPayoutPhone] = useState(user?.payout_phone || artist?.payout_phone || '');
  const [savingPayout, setSavingPayout] = useState(false);

  // Achats Stripe (contenu payant)
  const { data: purchases = [] } = useQuery({
    queryKey: ['artist-purchases', artistName],
    queryFn: () => base44.entities.Purchase.filter({ artist_name: artistName }, '-created_date'),
    enabled: !!artistName,
  });

  // Paiements Wave (contenu payant)
  const { data: wavePayments = [] } = useQuery({
    queryKey: ['artist-wave-payments', artistName],
    queryFn: () => base44.entities.WavePayment.filter({ artist_name: artistName }, '-created_date'),
    enabled: !!artistName,
  });

  // Billets d'événements (ventes ticketing)
  const { data: tickets = [] } = useQuery({
    queryKey: ['artist-tickets', artistName],
    queryFn: () => base44.entities.Ticket.filter({ artist_name: artistName }, '-created_date'),
    enabled: !!artistName,
  });

  // Transactions validées uniquement
  const validPurchases = purchases.filter((p) => p.status === 'paid');
  const validWave = wavePayments.filter((w) => w.status === 'valide');
  const validTickets = tickets.filter((t) => t.status === 'valide');

  const purchasesGross = validPurchases.reduce((s, p) => s + (p.amount || 0), 0);
  const waveGross = validWave.reduce((s, w) => s + (w.amount || 0), 0);
  const ticketsGross = validTickets.reduce((s, t) => s + (t.amount || 0), 0);
  const grossRevenue = purchasesGross + waveGross + ticketsGross;

  const purchasesCommission = purchasesGross * PLATFORM_COMMISSION;
  const waveCommission = waveGross * PLATFORM_COMMISSION;
  const ticketsCommission = validTickets.reduce((s, t) => s + ((t.amount || 0) * ((t.commission_pct || 10) / 100)), 0);
  const totalCommission = purchasesCommission + waveCommission + ticketsCommission;

  const netDue = grossRevenue - totalCommission;

  // Transactions fusionnées pour le tableau
  const allTransactions = [
    ...validPurchases.map((p) => ({
      id: p.id, date: p.created_date, type: 'Achat (Stripe)', item: p.item_title,
      buyer: p.user_email, amount: p.amount || 0,
      commission: (p.amount || 0) * PLATFORM_COMMISSION,
      net: (p.amount || 0) * (1 - PLATFORM_COMMISSION),
      status: p.status, Ic: ShoppingBag,
    })),
    ...validWave.map((w) => ({
      id: w.id, date: w.created_date, type: 'Achat (Wave)', item: w.item_title,
      buyer: w.user_email, amount: w.amount || 0,
      commission: (w.amount || 0) * PLATFORM_COMMISSION,
      net: (w.amount || 0) * (1 - PLATFORM_COMMISSION),
      status: w.status, Ic: Music,
    })),
    ...validTickets.map((t) => ({
      id: t.id, date: t.created_date, type: 'Billet', item: t.event_title,
      buyer: t.buyer_email, amount: t.amount || 0,
      commission: (t.amount || 0) * ((t.commission_pct || 10) / 100),
      net: (t.amount || 0) * (1 - ((t.commission_pct || 10) / 100)),
      status: t.status, Ic: Ticket,
    })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const savePayout = async () => {
    setSavingPayout(true);
    try {
      await base44.auth.updateMe({ wave_number: waveNum.trim(), payout_phone: payoutPhone.trim() });
      toast({ title: 'Infos de paiement enregistrées', description: 'Votre numéro Wave a été communiqué à l\'équipe KKD.' });
      qc.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      toast({ title: 'Erreur', description: err?.message || 'Impossible d\'enregistrer.', variant: 'destructive' });
    } finally {
      setSavingPayout(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Résumé financier ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-primary/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <TrendingUp size={16} />
            <span className="text-[11px] font-mono uppercase tracking-widest">Revenus bruts</span>
          </div>
          <p className="font-display text-2xl font-extrabold">{formatFCFA(grossRevenue)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {validPurchases.length + validWave.length + validTickets.length} transaction(s)
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Percent size={16} />
            <span className="text-[11px] font-mono uppercase tracking-widest">Commission KKD (10%)</span>
          </div>
          <p className="font-display text-2xl font-extrabold text-muted-foreground">−{formatFCFA(totalCommission)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Prélèv. plateforme</p>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/30 rounded-xl p-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Wallet size={16} />
            <span className="text-[11px] font-mono uppercase tracking-widest">Net à percevoir</span>
          </div>
          <p className="font-display text-2xl font-extrabold text-primary">{formatFCFA(netDue)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Après commission</p>
        </div>
      </div>

      {/* ── Détail par source ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Ventes contenu (Stripe)', value: purchasesGross, count: validPurchases.length, Ic: ShoppingBag },
          { label: 'Ventes contenu (Wave)', value: waveGross, count: validWave.length, Ic: Music },
          { label: 'Billetterie événements', value: ticketsGross, count: validTickets.length, Ic: Ticket },
        ].map((s) => {
          const Ic = s.Ic;
          return (
            <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Ic size={15} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm">{formatFCFA(s.value)}</p>
                <p className="text-[11px] text-muted-foreground truncate">{s.label} · {s.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Infos de paiement (numéro Wave) ── */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-primary" />
          <h3 className="font-heading font-bold text-sm">Mes informations de paiement</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Renseignez votre numéro Wave pour recevoir vos versements. L'équipe KKD vous transfère vos gains
          sur ce numéro après validation des transactions.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Numéro Wave</label>
            <Input
              value={waveNum}
              onChange={(e) => setWaveNum(e.target.value)}
              placeholder="ex : 76 123 45 67"
              className="font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Téléphone (Orange Money / virement)</label>
            <Input
              value={payoutPhone}
              onChange={(e) => setPayoutPhone(e.target.value)}
              placeholder="ex : 77 000 00 00"
              className="font-mono"
            />
          </div>
        </div>
        <Button onClick={savePayout} disabled={savingPayout} className="gap-2 bg-primary">
          {savingPayout ? 'Enregistrement…' : <><Save size={14} /> Enregistrer mes infos</>}
        </Button>
        {user?.wave_number && (
          <p className="text-[11px] text-green-400 flex items-center gap-1">
            <CheckCircle size={12} /> Numéro Wave enregistré : {user.wave_number}
          </p>
        )}
      </div>

      {/* ── Transactions récentes ── */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30">
          <h3 className="font-heading font-bold text-sm">Transactions récentes</h3>
        </div>
        {allTransactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ArrowDownToLine size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Aucune transaction validée pour l'instant.</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              Les ventes de votre contenu et billetterie apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {allTransactions.slice(0, 30).map((tx) => {
              const stCfg = TX_STATUS[tx.status] || TX_STATUS.en_attente;
              const StIc = stCfg.Ic;
              const TxIc = tx.Ic;
              return (
                <div key={`${tx.type}-${tx.id}`} className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <TxIc size={13} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{tx.item || '—'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {tx.type} · {tx.buyer || 'N/A'} · {compactDate(tx.date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">{formatFCFA(tx.amount)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Commission {formatFCFA(tx.commission)} · Net {formatFCFA(tx.net)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-[11px] font-medium shrink-0 ${stCfg.cls}`}>
                    <StIc size={11} /> {stCfg.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Note d'info ── */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/40 rounded-xl p-4">
        <Info size={14} className="shrink-0 mt-0.5" />
        <p>
          Les revenus sont calculés sur les transactions validées. La commission KKD Music est de 10% sur les
          ventes de contenu (singles/clips payants) et peut varier sur la billetterie selon l'événement.
          Les versements sont effectués par l'équipe KKD sur votre numéro Wave après période de validation.
        </p>
      </div>
    </div>
  );
}