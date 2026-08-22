import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { slugify } from '@/lib/slugify';

const TYPE_LABELS = { single: 'Single', album: 'Album', ep: 'EP', projet_special: 'Projet' };

export default function ReleaseCard({ release: r, playable = true }) {
  const slug = r.slug || slugify(r.title);
  const eyebrow = [TYPE_LABELS[r.release_type] || (r.release_type ? r.release_type.replace('_', ' ') : null), r.is_for_sale ? 'À vendre' : null].filter(Boolean).join(' · ');
  const paid = r.is_for_sale && Number(r.price) > 0;
  return (
    <Link to={`/musique/${slug}`} className="block h-full">
      <article className="kkd-card-release">
        <div className="kkd-card-release-media">
          {r.cover_url ? (
            <img src={r.cover_url} alt={r.title} loading="lazy" />
          ) : null}
          {r.is_featured && <span className="kkd-card-release-badge">Nouveau</span>}
          {playable && (
            <span className="kkd-card-release-play">
              <span className="kkd-btn-icon kkd-btn-icon-sm" aria-label="Écouter">
                <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />
              </span>
            </span>
          )}
        </div>
        <div className="kkd-card-release-body">
          {eyebrow && <span className="kkd-card-release-eyebrow">{eyebrow}</span>}
          <h3 className="kkd-card-release-title">{r.title}</h3>
          <p className="kkd-card-release-artist">{r.artist_name}</p>
          {paid && (
            <div className="kkd-card-release-row">
              <span className="kkd-card-release-price">{Number(r.price).toLocaleString('fr-FR')} F CFA</span>
              <button className="kkd-card-release-cta" type="button" onClick={(e) => e.preventDefault()}>Acheter</button>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}