import React from 'react';
import { Link } from 'react-router-dom';
import FollowButton from '@/components/artist/FollowButton';

function VerifiedMark() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--brand-accent)" strokeWidth="2" style={{ flexShrink: 0 }}>
      <path d="M9 12l2 2 4-4" />
      <path d="M12 2l2.4 1.4 2.8-.2 1 2.6 2.4 1.4-.6 2.8.6 2.8-2.4 1.4-1 2.6-2.8-.2L12 22l-2.4-1.4-2.8.2-1-2.6-2.4-1.4.6-2.8-.6-2.8 2.4-1.4 1-2.6 2.8.2z" />
    </svg>
  );
}

export default function ArtistCard({ artist: a }) {
  return (
    <Link to={`/artistes/${a.id}`} className="block h-full">
      <article className="kkd-card-artist">
        <div className="kkd-card-artist-avatar">
          {a.photo_url && <img src={a.photo_url} alt={a.name} loading="lazy" />}
        </div>
        <h3 className="kkd-card-artist-name">{a.name}{a.is_verified && <VerifiedMark />}</h3>
        {a.genre && <p className="kkd-card-artist-genre">{a.genre}</p>}
        {a.nationality && <p className="kkd-card-artist-stats">{a.nationality}</p>}
        <div onClick={(e) => e.preventDefault()}>
          <FollowButton artistId={a.id} artistName={a.name} variant="card" />
        </div>
      </article>
    </Link>
  );
}