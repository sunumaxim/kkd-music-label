import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Shuffle, Headphones } from 'lucide-react';
import UniversalPlayer from '@/components/shared/UniversalPlayer';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { buildEntitySlug } from '@/lib/slugify';

/**
 * Barre d'actions (Lecture aléatoire / Play) + "Chanson Populaire".
 * Lecture native via le lecteur global KKD quand l'audio est hébergé sur KKD ;
 * repli sur l'embed externe (Spotify/YouTube/Deezer…) sinon.
 */
export default function ArtistPopularTracks({ releases = [], artist, totalPlays = 0 }) {
  const player = usePlayer();
  const [activeId, setActiveId] = useState(null);
  const [shuffled, setShuffled] = useState(false);

  const popular = useMemo(
    () =>
      [...releases]
        .sort(
          (a, b) =>
            (b.plays_count || 0) + (b.likes_count || 0) - ((a.plays_count || 0) + (a.likes_count || 0))
        )
        .slice(0, 10),
    [releases]
  );

  const displayList = useMemo(
    () => (shuffled ? [...popular].sort(() => Math.random() - 0.5) : popular),
    [popular, shuffled]
  );

  const firstPlayable = displayList.find((r) => getReleaseTracks(r, { includeLocked: true }).length);
  const firstTracks = firstPlayable ? getReleaseTracks(firstPlayable, { includeLocked: true }) : [];
  const firstIsCurrent = firstTracks.some((t) => t.key === player.current?.key);
  const firstPlaying = firstIsCurrent && player.isPlaying;

  const playFirst = () => {
    if (!firstTracks.length) return;
    if (firstIsCurrent) player.togglePlay();
    else player.playQueue(firstTracks, 0);
  };

  return (
    <div>
      {/* Barre d'actions */}
      <div className="flex items-center gap-3 flex-wrap py-5">
        <button
          onClick={playFirst}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform disabled:opacity-40"
          aria-label="Lecture"
          disabled={!firstTracks.length}
        >
          {firstPlaying ? (
            <Pause size={22} fill="currentColor" />
          ) : (
            <Play size={22} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        <button
          onClick={() => setShuffled((s) => !s)}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
            shuffled
              ? 'bg-primary/20 text-primary'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Lecture aléatoire"
        >
          <Shuffle size={18} />
        </button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
          <Headphones size={13} className="text-primary" />
          <span className="font-bold text-foreground">{totalPlays.toLocaleString('fr-FR')}</span>{' '}
          Lectures
        </div>
      </div>

      {/* Chanson Populaire */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-lg">Chanson Populaire</h2>
      </div>
      <div className="space-y-1">
        {displayList.map((r) => {
          const tracks = getReleaseTracks(r, { includeLocked: true });
          const hasLocal = tracks.length > 0;
          const isCurrent = hasLocal && tracks.some((t) => t.key === player.current?.key);
          const playing = isCurrent && player.isPlaying;
          const streamUrl =
            r.spotify_url || r.deezer_url || r.audiomack_url || r.apple_music_url || r.youtube_url;
          const isActive = activeId === r.id;
          const onPlay = () => {
            if (hasLocal) {
              if (isCurrent) player.togglePlay();
              else player.playQueue(tracks, 0);
            } else {
              setActiveId(isActive ? null : r.id);
            }
          };
          return (
            <div key={r.id}>
              <div
                className={`flex items-center gap-3 p-2 rounded-xl group transition-colors ${
                  isCurrent ? 'bg-primary/10' : 'hover:bg-secondary/60'
                }`}
              >
                <button
                  onClick={onPlay}
                  className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0"
                  aria-label={playing ? 'Pause' : 'Lire'}
                >
                  {r.cover_url ? (
                    <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={14} className="text-muted-foreground/40" />
                    </div>
                  )}
                  <div
                    className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                      playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {playing ? (
                      <Pause size={16} className="text-white" fill="white" />
                    ) : (
                      <Play size={16} className="text-white ml-0.5" fill="white" />
                    )}
                  </div>
                </button>
                <Link to={`/musique/${buildEntitySlug(r.title, r.id)}`} className="flex-1 min-w-0">
                  <p
                    className={`font-heading font-bold text-sm truncate transition-colors ${
                      isCurrent ? 'text-primary' : 'group-hover:text-primary'
                    }`}
                  >
                    {r.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.artist_name}
                    {r.release_type ? ` — ${r.release_type}` : ''}
                  </p>
                </Link>
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:flex items-center gap-1">
                  <Headphones size={11} className="text-primary/70" />
                  {(r.plays_count || 0).toLocaleString('fr-FR')}
                </span>
              </div>
              {isActive && !hasLocal && streamUrl && (
                <div className="pl-16 pr-2 pb-2">
                  <UniversalPlayer url={streamUrl} label={r.title} className="w-full" />
                </div>
              )}
            </div>
          );
        })}
        {displayList.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">Aucune chanson disponible.</p>
        )}
      </div>
    </div>
  );
}