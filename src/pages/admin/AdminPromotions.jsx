import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Megaphone, CheckCircle, XCircle, PlayCircle, Clock, Loader2, ExternalLink } from 'lucide-react';

const STATUS = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
  approuve: { label: 'Approuvée', color: 'bg-blue-500/10 text-blue-400', icon: CheckCircle },
  actif: { label: 'Active', color: 'bg-green-500/10 text-green-400', icon: PlayCircle },
  expire: { label: 'Expirée', color: 'bg-secondary text-muted-foreground', icon: Clock },
  refuse: { label: 'Refusée', color: 'bg-red-500/10 text-red-400', icon: XCircle },
};

const PAY_LABEL = { en_attente: 'En attente', paye: 'Payé', rembourse: 'Remboursé' };
const SECTION_LABEL = { hero: 'À la une', trending: 'Tendances', both: 'Les deux' };

export default function AdminPromotions() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: () => base44.entities.SponsoredPlacement.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SponsoredPlacement.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }),
  });

  const counts = useMemo(
    () => ({
      all: placements.length,
      en_attente: placements.filter((p) => p.status === 'en_attente').length,
      actif: placements.filter((p) => p.status === 'actif').length,
      refuse: placements.filter((p) => p.status === 'refuse').length,
    }),
    [placements]
  );

  const filtered = filter === 'all' ? placements : placements.filter((p) => p.status === filter);

  const activate = (p) => {
    const today = new Date();
    const end = new Date(today.getTime() + (p.requested_days || 7) * 86400000);
    updateMutation.mutate({
      id: p.id,
      data: {
        status: 'actif',
        payment_status: 'paye',
        start_date: today.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
      },
    });
  };

  const refuse = (p) => {
    const notes = window.prompt('Motif du refus (optionnel) :', p.admin_notes || '');
    if (notes === null) return;
    updateMutation.mutate({ id: p.id, data: { status: 'refuse', admin_notes: notes } });
  };

  const expire = (p) => updateMutation.mutate({ id: p.id, data: { status: 'expire' } });

  const setSection = (p, section) =>
    updateMutation.mutate({ id: p.id, data: { target_section: section } });

  const filters = [
    { key: 'all', label: 'Toutes', count: counts.all },
    { key: 'en_attente', label: 'En attente', count: counts.en_attente },
    { key: 'actif', label: 'Actives', count: counts.actif },
    { key: 'refuse', label: 'Refusées', count: counts.refuse },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
          <Megaphone size={22} className="text-primary" /> Promotions & Mises en avant
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Validez au cas par cas les demandes de mise en avant payantes des artistes (Orange Money / Wave).
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label} <span className="opacity-70">({f.count})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
          <Megaphone size={36} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Aucune demande dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const st = STATUS[p.status] || STATUS.en_attente;
            const Icon = st.icon;
            const isPending = p.status === 'en_attente' || p.status === 'approuve';
            return (
              <div key={p.id} className="bg-card border border-border/40 rounded-2xl p-4">
                <div className="flex items-start gap-4">
                  {p.cover_url ? (
                    <img src={p.cover_url} alt={p.release_title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Megaphone size={22} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-sm truncate">{p.release_title}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.artist_name || p.partner_name}</p>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 flex items-center gap-1 ${st.color}`}>
                        <Icon size={11} /> {st.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                      <span>Durée : <b className="text-foreground">{p.requested_days} j</b></span>
                      <span>Paiement : <b className="text-foreground">{p.payment_method === 'wave' ? 'Wave' : 'Orange Money'}</b></span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        p.payment_status === 'paye' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>{PAY_LABEL[p.payment_status]}</span>
                      {p.created_date && (
                        <span>{new Date(p.created_date).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                    {p.streaming_link && (
                      <a href={p.streaming_link} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-2">
                        <ExternalLink size={10} /> Voir le lien
                      </a>
                    )}
                    {p.start_date && p.end_date && (
                      <p className="text-[11px] text-green-400 mt-1">
                        Période : {new Date(p.start_date).toLocaleDateString('fr-FR')} → {new Date(p.end_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {p.admin_notes && (
                      <p className="text-xs bg-secondary/50 rounded-lg px-3 py-2 italic text-muted-foreground mt-2">
                        💬 {p.admin_notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions admin */}
                {isPending && (
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/30">
                    <span className="text-[11px] text-muted-foreground">Emplacement :</span>
                    <select
                      value={p.target_section || 'hero'}
                      onChange={(e) => setSection(p, e.target.value)}
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="hero">À la une</option>
                      <option value="trending">Tendances</option>
                      <option value="both">Les deux</option>
                    </select>
                    <Button size="sm" onClick={() => activate(p)} disabled={updateMutation.isPending}
                      className="gap-1.5 ml-auto">
                      <CheckCircle size={14} /> Approuver & activer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => refuse(p)} className="gap-1.5">
                      <XCircle size={14} /> Refuser
                    </Button>
                  </div>
                )}
                {p.status === 'actif' && (
                  <div className="flex justify-end mt-4 pt-3 border-t border-border/30">
                    <Button size="sm" variant="outline" onClick={() => expire(p)} className="gap-1.5">
                      <Clock size={14} /> Désactiver
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