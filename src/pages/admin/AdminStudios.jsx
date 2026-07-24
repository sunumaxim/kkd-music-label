import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Mic } from 'lucide-react';
import EntityForm from '@/components/admin/EntityForm';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';

const FIELDS = [
  { key: 'name', label: 'Nom', type: 'text', required: true, placeholder: 'Studio / Caméraman' },
  { key: 'type', label: 'Type', type: 'select', options: [
    { value: 'studio_enregistrement', label: "Studio d'enregistrement" },
    { value: 'cameraman', label: 'Caméraman' },
    { value: 'studio_mixage', label: 'Studio de mixage' },
    { value: 'autre', label: 'Autre prestataire' },
  ]},
  { key: 'photo_url', label: 'Photo / Logo', type: 'file' },
  { key: 'city', label: 'Ville', type: 'text' },
  { key: 'phone', label: 'Téléphone / WhatsApp', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'instagram_url', label: 'Lien Instagram', type: 'url', placeholder: 'https://...' },
  { key: 'portfolio_url', label: 'Lien portfolio / site', type: 'url', placeholder: 'https://...' },
  { key: 'description', label: 'Description / équipements', type: 'textarea' },
  { key: 'is_active', label: 'Actif', type: 'boolean', placeholder: 'Visible sur la page d\'accueil' },
  { key: 'is_featured', label: 'Mise en avant', type: 'boolean' },
  { key: 'order', label: 'Ordre', type: 'number' },
];

const typeLabels = {
  studio_enregistrement: "Studio d'enregistrement",
  cameraman: 'Caméraman',
  studio_mixage: 'Studio mixage',
  autre: 'Prestataire',
};

function FormWrapper({ editing, onSave, onCancel }) {
  const [isDirty, setIsDirty] = useState(false);
  useUnsavedGuard(isDirty);
  const handleCancel = () => {
    if (isDirty && !window.confirm('Modifications non enregistrées. Quitter quand même ?')) return;
    onCancel();
  };
  return (
    <EntityForm
      title={editing === 'new' ? 'Ajouter un prestataire' : 'Modifier le prestataire'}
      fields={FIELDS}
      initialData={editing === 'new' ? {} : editing}
      onSave={(data) => { setIsDirty(false); return onSave(data); }}
      onCancel={handleCancel}
      onDirtyChange={setIsDirty}
    />
  );
}

export default function AdminStudios() {
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['admin-studios'],
    queryFn: () => base44.entities.StudioProvider.list('order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StudioProvider.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-studios'] }); queryClient.invalidateQueries({ queryKey: ['studios-active'] }); setEditing(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StudioProvider.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-studios'] }); queryClient.invalidateQueries({ queryKey: ['studios-active'] }); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StudioProvider.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-studios'] }); queryClient.invalidateQueries({ queryKey: ['studios-active'] }); },
  });

  const handleSave = async (data) => {
    if (editing && editing !== 'new' && editing.id) {
      await updateMutation.mutateAsync({ id: editing.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (editing) {
    return <FormWrapper editing={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">Studios & Caméramans</h1>
          <p className="text-sm text-muted-foreground mt-1">Prestataires disponibles — affichés sur la page d'accueil</p>
        </div>
        <Button onClick={() => setEditing('new')} className="gap-2">
          <Plus size={16} /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : providers.length === 0 ? (
        <p className="text-muted-foreground text-center py-12 text-sm">Aucun prestataire. Cliquez sur « Ajouter ».</p>
      ) : (
        <div className="space-y-2">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center gap-4 bg-card border border-border/50 rounded-lg p-3">
              <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                {p.photo_url ? (
                  <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Mic size={18} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-heading font-bold text-sm truncate">{p.name}</p>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{typeLabels[p.type] || p.type}</span>
                  {p.is_active ? (
                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">Visible accueil</span>
                  ) : (
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Masqué</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {p.city ? `${p.city} · ` : ''}{p.phone || p.email || '—'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(p)}><Pencil size={14} /></Button>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm('Supprimer ce prestataire ?')) deleteMutation.mutate(p.id); }}>
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}