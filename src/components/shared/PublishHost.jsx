import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import PublishWizard from '@/components/partner/PublishWizard';

/**
 * Hôte global du bouton "Publier".
 * - Affiche un bouton flottant (FAB) pour tout utilisateur connecté.
 * - Ouvre l'assistant de publication simplifié via l'événement window `kkd:publish`
 *   (déclenché par la barre de navigation et l'espace partenaire).
 */
export default function PublishHost() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['publish-host-user'],
    queryFn: async () => {
      const auth = await base44.auth.isAuthenticated();
      if (!auth) return null;
      return base44.auth.me();
    },
    retry: false,
    staleTime: 60000,
  });

  useEffect(() => {
    const handler = () => {
      base44.auth.isAuthenticated().then((auth) => {
        if (!auth) { navigate('/login'); return; }
        setOpen(true);
      });
    };
    window.addEventListener('kkd:publish', handler);
    return () => window.removeEventListener('kkd:publish', handler);
  }, [navigate]);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Publier"
        className="fixed bottom-24 right-4 sm:right-6 z-40 h-14 px-5 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center gap-2 font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all"
      >
        <Plus size={22} strokeWidth={2.5} />
        <span className="hidden sm:inline">Publier</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
            <PublishWizard user={user} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}