import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, UserCheck } from 'lucide-react';
import ArtistSelector from './ArtistSelector';

export default function ArtistAccessRequestForm({ user, onClose }) {
  const queryClient = useQueryClient();
  const [artistId, setArtistId] = useState('');
  const [artistName, setArtistName] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  // Check if user already has an approved access
  const { data: existingRequests = [] } = useQuery({
    queryKey: ['my-access-requests', user?.email],
    queryFn: () => base44.entities.ArtistAccessRequest.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.ArtistAccessRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-access-requests'] });
      setDone(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!artistId) return;
    mutation.mutate({
      user_email: user.email,
      user_id: user.id,
      artist_id: artistId,
      artist_name: artistName,
      message,
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h3 className="font-display font-extrabold text-lg mb-2">Demande envoyée !</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          L'équipe KKD va examiner votre demande d'accès et vous notifier par email.
        </p>
        <Button variant="outline" onClick={onClose}>Fermer</Button>
      </div>
    );
  }

  const pendingForArtist = existingRequests.find(r => r.artist_id === artistId && r.status === 'en_attente');
  const approvedForArtist = existingRequests.find(r => r.artist_id === artistId && r.status === 'approuve');

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <UserCheck size={18} className="text-primary" />
          <h3 className="font-display font-extrabold text-lg">Réclamer un profil artiste</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Vous êtes cet artiste ? Demandez l'accès pour gérer votre profil et votre contenu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-xs mb-1.5 block">Choisir l'artiste *</Label>
          <ArtistSelector
            value={artistId}
            onChange={(id, name) => { setArtistId(id); setArtistName(name); }}
            placeholder="Sélectionnez votre profil artiste..."
          />
          {approvedForArtist && (
            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
              <CheckCircle size={11} /> Vous avez déjà accès à ce profil artiste
            </p>
          )}
          {pendingForArtist && (
            <p className="text-xs text-yellow-400 mt-1">⏳ Demande en attente de validation pour cet artiste</p>
          )}
        </div>

        <div>
          <Label className="text-xs mb-1.5 block">Message de justification (optionnel)</Label>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Expliquez pourquoi vous demandez l'accès à ce profil (lien vers vos réseaux, votre musique…)"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={!artistId || mutation.isPending || !!pendingForArtist || !!approvedForArtist}
            className="bg-primary hover:bg-primary/80 flex-1"
          >
            {mutation.isPending ? 'Envoi…' : 'Envoyer la demande'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}