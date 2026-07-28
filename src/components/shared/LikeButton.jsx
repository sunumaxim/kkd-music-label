import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Bouton cœur : like / unlike persistant (par utilisateur) pour une sortie ou une vidéo.
 * Stocké dans l'entité Like (lecture limitée au propriétaire + admin).
 */
export default function LikeButton({ targetType, targetId, title, artistName, coverUrl, size = 18, className = '' }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: myLike } = useQuery({
    queryKey: ['my-like', targetType, targetId],
    queryFn: async () => {
      const res = await base44.entities.Like.filter({
        user_email: me.email,
        target_type: targetType,
        target_id: targetId,
      });
      return res[0] || null;
    },
    enabled: !!me,
  });

  const liked = !!myLike;

  const toggle = async () => {
    if (!me) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour ajouter à vos coups de cœur.', variant: 'destructive' });
      navigate('/login');
      return;
    }
    if (pending) return;
    setPending(true);
    try {
      if (liked) {
        await base44.entities.Like.delete(myLike.id);
      } else {
        await base44.entities.Like.create({
          user_email: me.email,
          target_type: targetType,
          target_id: targetId,
          target_title: title,
          artist_name: artistName,
          cover_url: coverUrl,
        });
      }
      qc.invalidateQueries({ queryKey: ['my-like', targetType, targetId] });
      qc.invalidateQueries({ queryKey: ['my-likes'] });
    } catch (err) {
      toast({ title: 'Action impossible', description: err?.message || 'Réessayez.', variant: 'destructive' });
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50 ${className}`}
      aria-label={liked ? 'Retirer des coups de cœur' : 'Ajouter aux coups de cœur'}
    >
      <Heart
        size={size}
        className={liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
        fill={liked ? 'currentColor' : 'none'}
      />
    </button>
  );
}