import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserPlus, UserCheck, Users } from 'lucide-react';

/**
 * FollowButton — bouton « Suivre » + compteur public d'abonnés.
 * variant="hero"  → affiché sur l'image héro (texte clair sur fond sombre)
 * variant="card"  → affiché dans une carte (texte standard)
 */
export default function FollowButton({ artistId, artistName, variant = 'hero' }) {
  const qc = useQueryClient();
  const [toggling, setToggling] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 60_000,
  });

  const { data: count = 0 } = useQuery({
    queryKey: ['artist-followers-count', artistId],
    queryFn: async () => {
      const list = await base44.entities.ArtistFollow.filter({ artist_id: artistId });
      return list.length;
    },
    enabled: !!artistId,
  });

  const { data: myFollow } = useQuery({
    queryKey: ['my-follow', artistId, me?.email],
    queryFn: async () => {
      const list = await base44.entities.ArtistFollow.filter({
        artist_id: artistId,
        user_email: me.email,
      });
      return list[0] || null;
    },
    enabled: !!me?.email && !!artistId,
  });

  const isFollowing = !!myFollow;

  const toggle = async () => {
    if (!me) {
      base44.auth.redirectToLogin?.(window.location.pathname);
      return;
    }
    setToggling(true);
    try {
      if (isFollowing) {
        await base44.entities.ArtistFollow.delete(myFollow.id);
      } else {
        await base44.entities.ArtistFollow.create({
          user_email: me.email,
          user_id: me.id,
          artist_id: artistId,
          artist_name: artistName,
        });
      }
      qc.invalidateQueries({ queryKey: ['artist-followers-count', artistId] });
      qc.invalidateQueries({ queryKey: ['my-follow', artistId] });
    } finally {
      setToggling(false);
    }
  };

  const btnCls =
    variant === 'hero'
      ? 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold shadow-lg hover:bg-primary/90 disabled:opacity-60'
      : 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60';

  const countCls =
    variant === 'hero' ? 'text-white/80' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-3 mt-3">
      <button onClick={toggle} disabled={toggling} className={btnCls}>
        {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
        {isFollowing ? 'Abonné' : 'Suivre'}
      </button>
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${countCls}`}>
        <Users size={13} />
        {count} abonné{count > 1 ? 's' : ''}
      </span>
    </div>
  );
}