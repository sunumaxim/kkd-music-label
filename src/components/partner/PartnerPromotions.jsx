import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Megaphone, Clock, CheckCircle, XCircle, PlayCircle } from 'lucide-react';
import PromoteReleaseForm from './PromoteReleaseForm';

const STATUS = {
  en_attente: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
  approuve: { label: 'Approuvée', color: 'bg-blue-500/10 text-blue-400', icon: CheckCircle },
  actif: { label: 'Active', color: 'bg-green-500/10 text-green-400', icon: PlayCircle },
  expire: { label: 'Expirée', color: 'bg-secondary text-muted-foreground', icon: Clock },
  refuse: { label: 'Refusée', color: 'bg-red-500/10 text-red-400', icon: XCircle },
};

const SECTION_LABEL = { hero: 'À la une', trending: 'Tendances', both: 'Les deux' };

export default function PartnerPromotions({ user }) {
  const [showForm, setShowForm] = useState(false);

  const { data: myPlacements = [] } = useQuery({
    queryKey: ['my-placements', user?.email],
    queryFn: () => base44.entities.SponsoredPlacement.filter({ partner_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold">Mises en avant</h2>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
          <Megaphone size={14} /> Promouvoir une sortie
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Payez pour mettre en avant votre sortie sur la page d'accueil KKD Music. Chaque demande est validée par notre équipe.
      </p>

      {myPlacements.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/30 rounded-2xl">
          <Megaphone size={40} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground mb-4">Aucune mise en avant demandée</p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Megaphone size={14} /> Promouvoir ma sortie
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {myPlacements.map((p) => {
            const st = STATUS[p.status] || STATUS.en_attente;
            const Icon = st.icon;
            return (
              <div key={p.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4">
                {p.cover_url ? (
                  <img src={p.cover_url} alt={p.release_title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Megaphone size={18} className="text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm truncate">{p.release_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {SECTION_LABEL[p.target_section] || p.target_section} · {p.requested_days} jours ·{' '}
                    {p.payment_method === 'wave' ? 'Wave' : 'Orange Money'}
                  </p>
                  {p.start_date && p.end_date && (
                    <p className="text-[11px] text-muted-foreground/70">
                      Du {new Date(p.start_date).toLocaleDateString('fr-FR')} au {new Date(p.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 flex items-center gap-1 ${st.color}`}>
                  <Icon size={11} /> {st.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <PromoteReleaseForm user={user} onClose={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}