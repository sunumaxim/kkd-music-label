import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Check, X, Ticket, Loader2, ExternalLink, Wallet } from 'lucide-react';

const STATUS = {
  en_attente: { label: 'En attente', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  valide: { label: 'Validé', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  refuse: { label: 'Refusé', cls: 'bg-red-500/15 text-red-500 border-red-500/30' },
  annule: { label: 'Annulé', cls: 'bg-muted text-muted-foreground border-border' },
};

export default function AdminTickets() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('en_attente');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date', 200),
  });

  const validateMutation = useMutation({
    mutationFn: (t) => base44.functions.invoke('validateTicketPayment', { ticket_id: t.id }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
      toast({ title: 'Billet validé', description: res.data?.ticket_number });
    },
    onError: (e) => toast({ title: 'Erreur', description: e.response?.data?.error || e.message, variant: 'destructive' }),
  });

  const refuseMutation = useMutation({
    mutationFn: (t) => base44.entities.Ticket.update(t.id, { status: 'refuse' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tickets'] }); toast({ title: 'Billet refusé' }); },
  });

  const counts = {
    en_attente: tickets.filter((t) => t.status === 'en_attente').length,
    valide: tickets.filter((t) => t.status === 'valide').length,
    all: tickets.length,
  };

  const validated = tickets.filter((t) => t.status === 'valide');
  const totalRevenue = validated.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalCommission = validated.reduce((s, t) => s + Math.round(Number(t.amount || 0) * (t.commission_pct || 10) / 100), 0);

  const list = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Ticket size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl">Billetterie</h1>
          <p className="text-sm text-muted-foreground">Validez les achats de billets (Wave).</p>
        </div>
      </div>

      {/* Revenus */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <Wallet size={15} className="text-primary mb-1" />
          <p className="font-display text-xl font-extrabold">{totalRevenue.toLocaleString('fr-FR')}</p>
          <p className="text-[11px] text-muted-foreground">FCFA encaissés</p>
        </div>
        <div className="bg-card border border-primary/30 rounded-xl p-4">
          <p className="font-display text-xl font-extrabold text-primary">{totalCommission.toLocaleString('fr-FR')}</p>
          <p className="text-[11px] text-muted-foreground">Commission KKD (10 %)</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <p className="font-display text-xl font-extrabold">{(totalRevenue - totalCommission).toLocaleString('fr-FR')}</p>
          <p className="text-[11px] text-muted-foreground">Reversement organisateurs</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[{ k: 'en_attente', l: 'En attente' }, { k: 'valide', l: 'Validés' }, { k: 'all', l: 'Tous' }].map((t) => (
          <button key={t.k} onClick={() => setFilter(t.k)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filter === t.k ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>
            {t.l} <span className="opacity-70">{counts[t.k]}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Aucun billet.</p>
      ) : (
        <div className="space-y-3">
          {list.map((t) => {
            const st = STATUS[t.status] || STATUS.en_attente;
            return (
              <div key={t.id} className="bg-card border border-border/50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Ticket size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-heading font-bold truncate">{t.event_title}</p>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t.buyer_name} · {t.buyer_email}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                      <span className="font-display font-bold">{Number(t.amount || 0).toLocaleString('fr-FR')} FCFA</span>
                      <span className="text-muted-foreground">Réf : <span className="font-mono">{t.wave_reference}</span></span>
                      {t.ticket_number && <span className="text-primary font-mono">{t.ticket_number}</span>}
                      {t.proof_file_url && <a href={t.proof_file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1"><ExternalLink size={11} /> Reçu</a>}
                      {t.checked_in && <span className="text-emerald-500 font-medium">✓ Entré</span>}
                    </div>
                  </div>
                </div>
                {t.status === 'en_attente' && (
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => validateMutation.mutate(t)} disabled={validateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <Check size={15} /> Valider & générer le billet
                    </Button>
                    <Button variant="outline" onClick={() => refuseMutation.mutate(t)} disabled={refuseMutation.isPending} className="gap-2 text-destructive hover:text-destructive">
                      <X size={15} /> Refuser
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}