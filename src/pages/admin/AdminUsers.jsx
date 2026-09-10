import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  ShieldCheck, UserCheck, Users, UserPlus, Search, X,
  Crown, AlertTriangle, Mail
} from 'lucide-react';
import PageMeta from '@/components/shared/PageMeta';

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: () => base44.users.list(),
  });

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const promoteMutation = useMutation({
    mutationFn: (emailOrId) => base44.users.promoteToAdmin(emailOrId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      toast({
        title: 'Rôle Administrateur accordé !',
        description: `${updated?.full_name || updated?.email} dispose désormais d'un accès total à la plateforme.`,
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ emailOrId, role, accountType }) =>
      base44.users.updateRole(emailOrId, role, accountType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      toast({ title: 'Rôle mis à jour avec succès' });
    },
  });

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    setIsSubmitting(true);
    try {
      const email = newAdminEmail.trim().toLowerCase();
      await base44.users.inviteUser(email, 'admin');
      await base44.users.promoteToAdmin(email);
      if (newAdminName.trim()) {
        const u = await base44.users.get(email);
        if (u) {
          await base44.users.update(u.id, { full_name: newAdminName.trim() });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setShowAddAdmin(false);
      setNewAdminEmail('');
      setNewAdminName('');
      toast({
        title: 'Administrateur ajouté !',
        description: `${email} a été configuré avec un accès total administrateur.`,
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err.message || "Échec de l'ajout",
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.artist_name || '').toLowerCase().includes(q)
    );
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const partnerCount = users.filter((u) => u.role === 'partner').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  return (
    <div className="space-y-6">
      <PageMeta title="Gestion des Utilisateurs & Rôles — Admin KKD" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-primary" />
            <h1 className="font-display text-2xl md:text-3xl font-extrabold">
              Utilisateurs & Contrôle des Rôles
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion stricte des profils : Administrateurs (accès total), Partenaires/Artistes vérifiés, et Auditeurs.
          </p>
        </div>

        <Button
          onClick={() => setShowAddAdmin(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 self-start sm:self-auto"
        >
          <UserPlus size={16} /> Ajouter un Administrateur
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-muted-foreground">Administrateurs (Accès Total)</p>
            <p className="text-2xl font-bold mt-1 text-primary">{adminCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Crown size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-muted-foreground">Partenaires (Artistes/Labels)</p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">{partnerCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-muted-foreground">Auditeurs / Acheteurs</p>
            <p className="text-2xl font-bold mt-1 text-zinc-300">{userCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* Modal Ajout Administrateur */}
      {showAddAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141821] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Crown size={20} className="text-primary" />
                <h2 className="font-bold text-lg text-white">Nommer un Administrateur</h2>
              </div>
              <button
                onClick={() => setShowAddAdmin(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Comme exigé, un administrateur aura un <strong>accès total et permanent</strong> à toutes les
              ressources de la plateforme : catalogue, événements, billetterie, validations, finances et gestion des utilisateurs.
            </p>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <Label className="text-xs text-zinc-300 mb-1 block">Nom complet (ou prénom)</Label>
                <Input
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Ex. Amadou Diop"
                  className="bg-black/30 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-300 mb-1 block">Adresse Email *</Label>
                <Input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin2@kkdmusic.com"
                  className="bg-black/30 border-white/10 text-white"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-amber-300 text-xs">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  Cet utilisateur disposera des droits les plus élevés sur l'application. Veillez à renseigner une adresse exacte.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddAdmin(false)}
                  className="border-white/10 text-zinc-300"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-white font-bold"
                >
                  {isSubmitting ? 'Attribution…' : 'Confirmer & Donner Accès Total'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, pseudo artiste…"
            className="pl-9 bg-card border-border/50 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'admin', label: 'Admins' },
            { id: 'partner', label: 'Partenaires' },
            { id: 'user', label: 'Auditeurs' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                roleFilter === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table / List */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-border/30">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Aucun utilisateur ne correspond à votre recherche.
            </div>
          ) : (
            filtered.map((u) => {
              const isSelf = me?.email?.toLowerCase() === u.email?.toLowerCase();
              const isAdmin = u.role === 'admin';
              const isPartner = u.role === 'partner';

              return (
                <div
                  key={u.id || u.email}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover shrink-0 ring-1 ring-border"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center shrink-0 font-bold text-foreground">
                        {(u.full_name || u.email || 'U')[0].toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-foreground truncate">
                          {u.full_name || u.email.split('@')[0]}
                        </p>
                        {isSelf && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                            Vous
                          </span>
                        )}
                        {isAdmin ? (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Crown size={11} /> Admin (Accès Total)
                          </span>
                        ) : isPartner ? (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <UserCheck size={11} /> Partenaire ({u.account_type || 'Artiste'})
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full font-medium bg-zinc-800 text-zinc-400 border border-white/5">
                            Auditeur / Client
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail size={12} /> {u.email}
                        </span>
                        {u.artist_name && (
                          <span>• Profil Artiste : <strong className="text-foreground">{u.artist_name}</strong></span>
                        )}
                        {u.payout_phone && (
                          <span>• Paiement Wave : {u.payout_phone}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {!isAdmin && (
                      <Button
                        size="sm"
                        onClick={() => promoteMutation.mutate(u.id || u.email)}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs gap-1.5 h-8 rounded-lg shadow-sm"
                      >
                        <Crown size={13} /> Donner Accès Total Admin
                      </Button>
                    )}

                    {!isAdmin && !isPartner && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateRoleMutation.mutate({
                            emailOrId: u.id || u.email,
                            role: 'partner',
                            accountType: 'artist',
                          })
                        }
                        className="text-xs h-8 border-border/60 hover:bg-secondary"
                      >
                        Passer Partenaire
                      </Button>
                    )}

                    {isPartner && !isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateRoleMutation.mutate({
                            emailOrId: u.id || u.email,
                            role: 'user',
                            accountType: 'user',
                          })
                        }
                        className="text-xs h-8 border-border/60 hover:bg-secondary text-zinc-400"
                      >
                        Rétrograder en Auditeur
                      </Button>
                    )}

                    {isAdmin && !isSelf && adminCount > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateRoleMutation.mutate({
                            emailOrId: u.id || u.email,
                            role: 'partner',
                            accountType: 'label',
                          })
                        }
                        className="text-xs h-8 text-zinc-400 hover:text-zinc-200"
                      >
                        Rétrograder Admin
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
