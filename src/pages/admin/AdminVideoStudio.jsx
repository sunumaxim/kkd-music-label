import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { VIDEO_PACKS } from '@/lib/videoPacks';
import {
  Check, X, Loader2, Sparkles, Coins, Gift, Film, ExternalLink, Wallet, Users,
} from 'lucide-react';

const STATUS = {
  en_attente: { label: 'En attente', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  valide: { label: 'Validé', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  refuse: { label: 'Refusé', cls: 'bg-red-500/15 text-red-500 border-red-500/30' },
};

export default function AdminVideoStudio() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState('achats');
  const [grantEmail, setGrantEmail] = useState('');
  const [grantCredits, setGrantCredits] = useState('');

  const { data: purchases = [], isLoading: purLoading } = useQuery({
    queryKey: ['video-purchases-admin'],
    queryFn: () => base44.entities.VideoCreditPurchase.list('-created_date', 100),
  });
  const { data: generations = [], isLoading: genLoading } = useQuery({
    queryKey: ['video-generations-admin'],
    queryFn: () => base44.entities.VideoGeneration.list('-created_date', 100),
  });
  const { data: credits = [] } = useQuery({
    queryKey: ['video-credits-admin'],
    queryFn: () => base44.entities.VideoCredit.list('-created_date', 100),
  });

  const approveMut = useMutation({
    mutationFn: (id) => base44.functions.invoke('approveVideoCredits', { purchase_id: id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['video-purchases-admin'] }); qc.invalidateQueries({ queryKey: ['video-credits-admin'] }); toast({ title: 'Crédits ajoutés au compte' }); },
    onError: (e) => toast({ title: 'Erreur', description: e.response?.data?.error || e.message, variant: 'destructive' }),
  });
  const refuseMut = useMutation({
    mutationFn: (id) => base44.functions.invoke('approveVideoCredits', { refuse_purchase_id: id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['video-purchases-admin'] }); toast({ title: 'Achat refusé' }); },
  });
  const grantMut = useMutation({
    mutationFn: () => base44.functions.invoke('approveVideoCredits', { user_email: grantEmail.trim(), credits: Number(grantCredits) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['video-credits-admin'] }); setGrantEmail(''); setGrantCredits(''); toast({ title: 'Crédits offerts' }); },
    onError: (e) => toast({ title: 'Erreur', description: e.response?.data?.error || e.message, variant: 'destructive' }),
  });

  const pending = purchases.filter((p) => p.status === 'en_attente');
  const totalSold = credits.reduce((s, c) => s + (c.total_purchased || 0), 0);
  const totalUsed = credits.reduce((s, c) => s + (c.total_used || 0), 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Sparkles size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl">Studio Vidéo IA</h1>
          <p className="text-sm text-muted-foreground">Validez les achats de crédits et suivez les générations.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><Coins size={14} /><p className="text-[10px] uppercase">En attente</p></div>
          <p className="font-display text-2xl font-extrabold mt-1">{pending.length}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><Wallet size={14} /><p className="text-[10px] uppercase">Crédits vendus</p></div>
          <p className="font-display text-2xl font-extrabold mt-1">{totalSold}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><Film size={14} /><p className="text-[10px] uppercase">Crédits utilisés</p></div>
          <p className="font-display text-2xl font-extrabold mt-1">{totalUsed}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><Users size={14} /><p className="text-[10px] uppercase">Utilisateurs</p></div>
          <p className="font-display text-2xl font-extrabold mt-1">{credits.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { k: 'achats', label: `Achats (${pending.length})` },
          { k: 'generations', label: 'Générations' },
          { k: 'octroi', label: 'Octroi manuel' },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              tab === t.k ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'achats' && (
        purLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Aucun achat pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {purchases.map((p) => {
              const st = STATUS[p.status] || STATUS.en_attente;
              return (
                <div key={p.id} className="bg-card border border-border/50 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Coins size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-heading font-bold truncate">{p.pack_label || 'Pack'}</p>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.credits} crédits · {p.user_email}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="font-display font-bold">{Number(p.amount || 0).toLocaleString('fr-FR')} FCFA</span>
                        <span className="text-muted-foreground">Réf : <span className="font-mono">{p.wave_reference}</span></span>
                        {p.proof_file_url && (
                          <a href={p.proof_file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            <ExternalLink size={11} /> Reçu
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {p.status === 'en_attente' && (
                    <div className="flex gap-2 mt-3">
                      <Button onClick={() => approveMut.mutate(p.id)} disabled={approveMut.isPending} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                        <Check size={15} /> Valider & créditer
                      </Button>
                      <Button variant="outline" onClick={() => refuseMut.mutate(p.id)} disabled={refuseMut.isPending} className="gap-2 text-destructive hover:text-destructive">
                        <X size={15} /> Refuser
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'generations' && (
        genLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : generations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Aucune génération pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {generations.map((g) => (
              <div key={g.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {g.status === 'genere' && g.video_url ? (
                    <video src={g.video_url} className="w-full h-full object-cover" muted />
                  ) : g.status === 'echoue' ? (
                    <X size={16} className="text-destructive" />
                  ) : (
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{g.prompt || 'Sans action'}</p>
                  <p className="text-[10px] text-muted-foreground">{g.user_email} · {g.duration}s · {g.credits_used} cr · {new Date(g.created_date).toLocaleString('fr-FR')}</p>
                </div>
                {g.status === 'genere' && g.video_url && (
                  <a href={g.video_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px]">Voir</a>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'octroi' && (
        <div className="bg-card border border-border/50 rounded-2xl p-5 max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <Gift size={18} className="text-primary" />
            <p className="font-heading font-bold text-sm">Offrir des crédits à un utilisateur</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email de l'utilisateur</label>
              <Input value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="email@exemple.com" type="email" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nombre de crédits</label>
              <Input value={grantCredits} onChange={(e) => setGrantCredits(e.target.value)} placeholder="Ex : 5" type="number" min="1" />
            </div>
            <Button onClick={() => grantMut.mutate()} disabled={grantMut.isPending || !grantEmail.trim() || !grantCredits} className="bg-primary gap-2 w-full">
              {grantMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />} Offrir les crédits
            </Button>
            <p className="text-[11px] text-muted-foreground">L'utilisateur recevra une notification par email et dans l'app.</p>
          </div>
        </div>
      )}
    </div>
  );
}