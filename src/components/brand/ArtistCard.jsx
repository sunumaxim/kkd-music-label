import React from 'react';
import { Link } from 'react-router-dom';
import FollowButton from '@/components/artist/FollowButton';
import VerifiedBadge from '@/components/shared/VerifiedBadge';

export default function ArtistCard({ artist: a }) {
  return (
    <Link to={`/artistes/${a.id}`} className="block h-full">
      <article className="kkd-card-artist">
        <div className="kkd-card-artist-avatar">
          {a.photo_url && <img src={a.photo_url} alt={a.name} loading="lazy" />}
        </div>
        <h3 className="kkd-card-artist-name">{a.name}{a.is_verified && <VerifiedBadge size={16} className="-mb-0.5" />}</h3>
        {a.genre && <p className="kkd-card-artist-genre">{a.genre}</p>}
        {a.nationality && <p className="kkd-card-artist-stats">{a.nationality}</p>}
        <div onClick={(e) => e.preventDefault()}>
          <FollowButton artistId={a.id} artistName={a.name} variant="card" />
        </div>
      </article>
    </Link>
  );
}