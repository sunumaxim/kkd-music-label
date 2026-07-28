import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, MoreVertical } from 'lucide-react';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { buildEntitySlug } from '@/lib/slugify';

function streams(n) {
  if (!n) return '< 1000';
  if (n < 1000) return '< 1000';
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/**
 * Liste « Populaires » numérotée (style Spotify) : rang, pochette, titre, écoutes.
 */
export default function ArtistPopularList({ releases = [], max = 5 }) {
  const player = usePlayer();
  const navigate = useNavigate();

  const popular = useMemo(
    () =>
      [...releases]
        .sort((a, b) => (b.plays_count || 0) + (b.likes_count || 0) - ((a.plays_count || 0) + (a.likes_count || 0)))
        .slice(0, max),
    [releases, max]
  );

  if (!popular.length) return null;

  return (
    <section className="py-2">
      <h2 className="font-heading font-bold text-xl mb-2">Populaires</h2>
      <div>
        {popular.map((r, i) => {
          const tracks = getReleaseTracks(r);
          const hasLocal = tracks.length > 0;
          const isCurrent = hasLocal && tracks.some((t) => t.key === player.current?.key);
          const playing = isCurrent && player.isPlaying;
          const onRow = () => {
            if (hasLocal) {
              if (isCurrent) player.togglePlay();
              else player.playQueue(tracks, 0);
            } else {
              navigate(`/musique/${buildEntitySlug(r.title, r.id)}`);
            }
          };
          return (
            <div
              key={r.id}
              onClick={onRow}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/50 cursor-pointer group"
            >
              <span className="w-5 text-center text-sm font-mono text-muted-foreground shrink-0">{i + 1}</span>
              <div className="relative w-12 h-12 rounded-md overflow-hidden bg-secondary shrink-0">
                {r.cover_url ? (
                  <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={14} className="text-muted-foreground/40" />
                  </div>
                )}
                <div
                  className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity ${
                    playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {playing ? (
                    <Pause size={16} className="text-white" fill="white" />
                  ) : (
                    <Play size={16} className="text-white ml-0.5" fill="white" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-heading font-bold text-sm truncate ${isCurrent ? 'text-primary' : ''}`}>
                  {r.title}
                </p>
                <p className="text-xs text-muted-foreground">{streams(r.plays_count)} écoutes</p>
              </div>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Plus"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}