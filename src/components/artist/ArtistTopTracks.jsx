import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Music2, Play, Pause, ExternalLink, TrendingUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function PopularityBar({ value }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/70 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">{value}</span>
    </div>
  );
}

export default function ArtistTopTracks({ artist }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTrack, setExpandedTrack] = useState(null);
  const [previewTrack, setPreviewTrack] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!artist?.spotify_url) return;
    setLoading(true);
    setError(null);
    base44.functions.invoke('getArtistTopTracks', {
      spotify_url: artist.spotify_url,
      artist_name: artist.name,
    }).then((res) => {
      const data = res.data;
      if (data.error) setError(data.error);
      else setTracks(data.tracks || []);
    }).catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [artist?.spotify_url]);

  const togglePreview = (track) => {
    if (previewTrack?.id === track.id) {
      audioRef.current?.pause();
      setPreviewTrack(null);
    } else {
      setPreviewTrack(track);
      if (audioRef.current) {
        audioRef.current.src = track.preview_url;
        audioRef.current.play();
      }
    }
  };

  const toggleEmbed = (trackId) => {
    setExpandedTrack(expandedTrack === trackId ? null : trackId);
  };

  if (!artist?.spotify_url) return null;

  return (
    <div>
      <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-primary" /> Titres populaires
      </h2>

      {loading && (
        <div className="flex items-center gap-3 py-8 text-muted-foreground text-sm">
          <Loader2 size={18} className="animate-spin text-primary" />
          Chargement des titres Spotify…
        </div>
      )}

      {error && (
        <p className="text-sm text-muted-foreground bg-card border border-border/40 rounded-xl p-4">
          Impossible de charger les titres Spotify pour le moment.
        </p>
      )}

      {!loading && !error && tracks.length > 0 && (
        <>
          {/* Apple Music embed si disponible */}
          {artist.apple_music_url && (
            <div className="mb-6 rounded-xl overflow-hidden border border-border/40">
              <iframe
                src={artist.apple_music_url.replace('music.apple.com', 'embed.music.apple.com')}
                width="100%"
                height="175"
                frameBorder="0"
                allow="autoplay *; encrypted-media *; fullscreen *"
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
                loading="lazy"
                className="w-full block"
                title="Apple Music"
              />
            </div>
          )}

          <div className="space-y-1">
            {tracks.map((track, idx) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="rounded-xl overflow-hidden"
              >
                {/* Track row */}
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 group cursor-pointer hover:bg-card transition-colors ${expandedTrack === track.id ? 'bg-card' : ''}`}
                  onClick={() => toggleEmbed(track.id)}
                >
                  {/* Rank */}
                  <span className="w-5 text-center text-xs font-mono text-muted-foreground/50 shrink-0">
                    {idx + 1}
                  </span>

                  {/* Album art */}
                  <div className="relative shrink-0">
                    {track.album_image ? (
                      <img src={track.album_image} alt={track.album} className="w-10 h-10 rounded-md object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                        <Music2 size={14} className="text-muted-foreground" />
                      </div>
                    )}
                    {expandedTrack === track.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md">
                        <div className="flex gap-0.5">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-0.5 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title / album */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-heading font-bold truncate transition-colors ${expandedTrack === track.id ? 'text-primary' : 'group-hover:text-primary'}`}>
                      {track.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{track.album}</p>
                  </div>

                  {/* Popularity + duration */}
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <PopularityBar value={track.popularity} />
                    <span className="text-[10px] font-mono text-muted-foreground">{formatDuration(track.duration_ms)}</span>
                  </div>

                  {/* Preview button */}
                  {track.preview_url && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePreview(track); }}
                      className="shrink-0 w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
                      title="Aperçu 30s"
                    >
                      {previewTrack?.id === track.id
                        ? <Pause size={12} fill="currentColor" />
                        : <Play size={12} fill="currentColor" />}
                    </button>
                  )}

                  {/* Spotify external */}
                  {track.spotify_url && (
                    <a
                      href={track.spotify_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 text-muted-foreground hover:text-green-400 transition-colors"
                      title="Ouvrir dans Spotify"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                {/* Embedded Spotify player */}
                <AnimatePresence>
                  {expandedTrack === track.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <iframe
                        src={track.spotify_embed_url}
                        width="100%"
                        height="80"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="w-full block"
                        title={track.name}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground/50 mt-3 font-mono text-right">
            Données Spotify · Cliquer sur un titre pour l'écouter
          </p>
        </>
      )}

      {/* Audio preview player */}
      <audio ref={audioRef} onEnded={() => setPreviewTrack(null)} hidden />
    </div>
  );
}