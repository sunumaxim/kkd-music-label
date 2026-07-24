import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Check, X, Clock, Wallet, Loader2, Music, Film, ExternalLink } from 'lucide-react';

const STATUS = {
  en_attente: { label: 'En attente', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  valide: { label: 'Validé', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  refuse: { label: 'Refusé', cls: 'bg-red-500/15 text-red-500 border-red-500/30' },
};

export default function AdminPayments() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('en_attente');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['wave-payments'],
    queryFn: () => base44.entities.WavePayment.list('-created_date', 100),
  });

  const validateMutation = useMutation({
    mutationFn: async (wp) => {
      await base44.entities.Purchase.create({
        user_email: wp.user_email,
        item_type: wp.item_type,
        item_id: wp.item_id,
        item_title: wp.item_title,
        artist_name: wp.artist_name || '',
        amount: wp.amount || 0,
        currency: 'xof',
        stripe_session_id: `wave_${wp.id}`,
        status: 'paid',
      });
      await base44.entities.WavePayment.update(wp.id, { status: 'valide' });
      const api = wp.item_type === 'release' ? base44.entities.Release : base44.entities.Video;
      const items = await api.filter({ id: wp.item_id });
      if (items[0]) await api.update(wp.item_id, { sales_count: (items[0].sales_count || 0) + 1 });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wave-payments'] }); toast({ title: 'Paiement validé — accès débloqué' }); },
    onError: (e) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const refuseMutation = useMutation({
    mutationFn: (wp) => base44.entities.WavePayment.update(wp.id, { status: 'refuse' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wave-payments'] }); toast({ title: 'Paiement refusé' }); },
  });

  const counts = {
    en_attente: payments.filter((p) => p.status === 'en_attente').length,
    valide: payments.filter((p) => p.status === 'valide').length,
    refuse: payments.filter((p) => p.status === 'refuse').length,
    all: payments.length,
  };

  const list = filter === 'all' ? payments : payments.filter((p) => p.status === filter);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#00A6E8,#0066B3)' }}>
          <Wallet size={20} />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl">Paiements Wave</h1>
          <p className="text-sm text-muted-foreground">Validez les paiements reçus pour débloquer l'accès.</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { k: 'en_attente', label: 'En attente' },
          { k: 'valide', label: 'Validés' },
          { k: 'refuse', label: 'Refusés' },
          { k: 'all', label: 'Tous' },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setFilter(t.k)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filter === t.k ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
            }`}
          >
            {t.label} <span className="opacity-70">{counts[t.k]}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Aucun paiement dans cette section.</p>
      ) : (
        <div className="space-y-3">
          {list.map((wp) => {
            const st = STATUS[wp.status] || STATUS.en_attente;
            return (
              <div key={wp.id} className="bg-card border border-border/50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    {wp.item_type === 'video' ? <Film size={18} className="text-primary" /> : <Music size={18} className="text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-heading font-bold truncate">{wp.item_title}</p>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{wp.artist_name} · {wp.item_type === 'video' ? 'Clip' : 'Sortie'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{wp.user_email}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="font-display font-bold text-foreground">{Number(wp.amount || 0).toLocaleString('fr-FR')} FCFA</span>
                      <span className="text-muted-foreground">Réf : <span className="font-mono">{wp.wave_reference}</span></span>
                      {wp.proof_file_url && (
                        <a href={wp.proof_file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          <ExternalLink size={11} /> Reçu
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {wp.status === 'en_attente' && (
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => validateMutation.mutate(wp)} disabled={validateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <Check size={15} /> Valider & débloquer
                    </Button>
                    <Button variant="outline" onClick={() => refuseMutation.mutate(wp)} disabled={refuseMutation.isPending} className="gap-2 text-destructive hover:text-destructive">
                      <X size={15} /> Refuser
                    </Button>
                  </div>
                )}
                {wp.status === 'valide' && (
                  <p className="text-[11px] text-emerald-500 mt-3 flex items-center gap-1"><Check size={12} /> Achat créé — accès débloqué pour l'utilisateur.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}