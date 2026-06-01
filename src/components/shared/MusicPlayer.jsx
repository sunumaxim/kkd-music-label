import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  X, Music, ExternalLink, ChevronUp, ChevronDown, ListMusic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Persistent global player state via module-level ref
let globalSetPlayer = null;
export function openPlayer(tracks, startIndex = 0) {
  if (globalSetPlayer) globalSetPlayer({ tracks, currentIndex: startIndex, open: true });
}

function SpotifyEmbed({ url }) {
  const trackId = url.match(/spotify\.com\/(?:intl-[a-z]+\/)?(?:track|album)\/([a-zA-Z0-9]+)/)?.[1];
  const type = url.includes('/album/') ? 'album' : 'track';
  if (!trackId) return <a href={url} target="_blank" rel="noreferrer" className="text-green-400 underline text-sm">Ouvrir sur Spotify</a>;
  return (
    <iframe
      src={`https://open.spotify.com/embed/${type}/${trackId}?utm_source=generator&theme=0`}
      width="100%" height="152" frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="rounded-xl"
    />
  );
}

function YouTubeEmbed({ url, autoplay = false }) {
  const videoId = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
  if (!videoId) return <a href={url} target="_blank" rel="noreferrer" className="text-red-400 underline text-sm">Ouvrir sur YouTube</a>;
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0`}
      width="100%" height="315" frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="rounded-xl w-full"
    />
  );
}

// ── RELEASE CARD with Spotify embed ──
export function ReleaseCard({ release, allReleases = [], onPlayAll }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden group">
      <div className="relative aspect-square cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {release.cover_url
          ? <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full bg-primary/5 flex items-center justify-center"><Music size={28} className="text-primary/30" /></div>
        }
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          >
            <Play size={20} className="text-white ml-0.5" fill="white" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <p className="font-heading font-bold text-sm truncate">{release.title}</p>
        <p className="text-[11px] text-muted-foreground capitalize">{release.release_type} · {release.release_date?.slice(0,4)}</p>
        {release.spotify_url && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-medium"
          >
            {expanded ? <Pause size={11} /> : <Play size={11} fill="currentColor" />}
            {expanded ? 'Masquer' : 'Écouter'}
          </button>
        )}
      </div>
      <AnimatePresence>
        {expanded && release.spotify_url && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-3 pb-3"
          >
            <SpotifyEmbed url={release.spotify_url} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── VIDEO CARD with YouTube embed ──
export function VideoCard({ video, onClick }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden group">
      <div className="relative">
        {!playing ? (
          <div
            className="relative aspect-video cursor-pointer"
            onClick={() => setPlaying(true)}
          >
            <img
              src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_url.match(/v=([^&]+)/)?.[1]}/hqdefault.jpg`}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                <Play size={22} className="text-white ml-1" fill="white" />
              </button>
            </div>
            <div className="absolute top-2 left-2">
              <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full capitalize">
                {video.video_type?.replace('_', ' ')}
              </span>
            </div>
          </div>
        ) : (
          <YouTubeEmbed url={video.youtube_url} autoplay />
        )}
      </div>
      <div className="p-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading font-bold text-sm truncate">{video.title}</p>
          {video.artist_name && <p className="text-xs text-muted-foreground">{video.artist_name}</p>}
          {video.publish_date && <p className="text-[10px] text-muted-foreground/50 mt-0.5">{new Date(video.publish_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
        </div>
        <a href={video.youtube_url} target="_blank" rel="noreferrer"
          className="text-muted-foreground hover:text-red-400 transition-colors shrink-0 mt-0.5">
          <ExternalLink size={14} />
        </a>
      </div>
      {playing && (
        <div className="px-3 pb-3">
          <button onClick={() => setPlaying(false)} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X size={11} /> Fermer le lecteur
          </button>
        </div>
      )}
    </div>
  );
}

// ── PLAYLIST PLAYER (Spotify embeds) ──
export function PlaylistPlayer({ releases, artistName }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const releasesWithSpotify = releases.filter(r => r.spotify_url);

  if (releasesWithSpotify.length === 0) return null;

  const current = releasesWithSpotify[currentIndex];

  return (
    <div className="bg-card border border-primary/20 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ListMusic size={15} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="font-heading font-bold text-sm">
              Playlist {artistName ? `— ${artistName}` : ''}
            </p>
            <p className="text-xs text-muted-foreground">{releasesWithSpotify.length} titre{releasesWithSpotify.length > 1 ? 's' : ''} disponibles</p>
          </div>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Current track embed */}
              <SpotifyEmbed url={current.spotify_url} />

              {/* Track list */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {releasesWithSpotify.map((r, i) => (
                  <button
                    key={r.id || i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      i === currentIndex
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-secondary/50 text-foreground'
                    }`}
                  >
                    {r.cover_url ? (
                      <img src={r.cover_url} alt={r.title} className="w-8 h-8 rounded-md object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                        <Music size={12} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{r.release_type} · {r.release_date?.slice(0,4)}</p>
                    </div>
                    {i === currentIndex && (
                      <div className="flex gap-0.5 items-end h-4 shrink-0">
                        {[1,2,3].map(b => (
                          <div key={b} className="w-0.5 bg-primary rounded-full animate-bounce"
                            style={{ height: `${[12, 16, 10][b-1]}px`, animationDelay: `${b * 0.1}s` }} />
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}