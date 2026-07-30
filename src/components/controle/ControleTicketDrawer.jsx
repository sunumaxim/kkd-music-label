import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  X, LogIn, LogOut, Clock, User, Phone, Mail, Hash, History, Loader2,
} from 'lucide-react';

/**
 * Panneau de détail d'un billet : infos acheteur, statut, compteur entrées/sorties,
 * historique complet des mouvements, et actions manuelles (entrée/sortie).
 */
export default function ControleTicketDrawer({ ticket, onClose, onAction, actionLoading }) {
  if (!ticket) return null;
  const log = Array.isArray(ticket.access_log) ? ticket.access_log : [];

  const statusConfig = ticket.checked_in
    ? { label: "Présent à l'intérieur", cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' }
    : ticket.checked_out
      ? { label: "A quitté l'événement", cls: 'bg-amber-500/10 border-amber-500/30 text-amber-600' }
      : { label: 'Pas encore entré', cls: 'bg-secondary border-border/50 text-muted-foreground' };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto" onClick={onClose}>
      <div className="max-w-md mx-auto px-4 py-8 min-h-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-extrabold">Détails du billet</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Statut */}
        <div className={`rounded-xl border p-4 mb-4 ${statusConfig.cls}`}>
          <p className="font-heading font-bold text-sm flex items-center gap-2">
            {ticket.checked_in ? <LogIn size={16} /> : ticket.checked_out ? <LogOut size={16} /> : <Clock size={16} />}
            {statusConfig.label}
          </p>
        </div>

        {/* Infos acheteur */}
        <div className="bg-card border border-border/50 rounded-xl p-4 space-y-2.5 mb-4">
          <div className="flex items-center gap-2">
            <User size={15} className="text-muted-foreground shrink-0" />
            <span className="font-heading font-bold text-sm">{ticket.buyer_name}</span>
          </div>
          {ticket.buyer_phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone size={13} /> {ticket.buyer_phone}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail size={13} /> {ticket.buyer_email}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Hash size={13} /> {ticket.ticket_number || 'En attente'}
          </div>
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
            <p className="font-display text-2xl font-extrabold text-emerald-500">{ticket.entry_count || 0}</p>
            <p className="text-[11px] text-muted-foreground">Entrée{ticket.entry_count > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
            <p className="font-display text-2xl font-extrabold text-amber-500">{ticket.exit_count || 0}</p>
            <p className="text-[11px] text-muted-foreground">Sortie{ticket.exit_count > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Action manuelle */}
        {ticket.status === 'valide' && (
          <div className="mb-4">
            {ticket.checked_in ? (
              <Button
                onClick={() => onAction(ticket, 'exit')}
                disabled={actionLoading}
                className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              >
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />} Enregistrer la sortie
              </Button>
            ) : (
              <Button
                onClick={() => onAction(ticket, 'entry')}
                disabled={actionLoading}
                className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />} Valider l'entrée
              </Button>
            )}
          </div>
        )}

        {/* Historique */}
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-1.5">
            <History size={13} /> Historique d'accès
          </p>
          {log.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun mouvement enregistré.</p>
          ) : (
            <div className="space-y-2">
              {[...log].reverse().map((entry, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    entry.action === 'entry' ? 'bg-emerald-500/15' : 'bg-amber-500/15'
                  }`}>
                    {entry.action === 'entry'
                      ? <LogIn size={13} className="text-emerald-500" />
                      : <LogOut size={13} className="text-amber-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{entry.action === 'entry' ? 'Entrée' : 'Sortie'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(entry.timestamp), 'dd MMM yyyy à HH:mm:ss', { locale: fr })}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{entry.by}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}