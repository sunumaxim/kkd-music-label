import React, { useState } from 'react';
import { Play, Pause, ExternalLink, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Détection de plateforme et construction de l'URL d'embed ──
export function detectPlatform(url) {
  if (!url) return null;

  // Spotify — track, album, playlist, artist
  const spotify = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(?:embed\/)?(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
  if (spotify) return { platform: 'spotify', type: spotify[1], id: spotify[2] };

  // YouTube — watch?v=, youtu.be, /embed/, playlist
  const ytPlaylist = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  const ytVideo = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (ytVideo) return { platform: 'youtube', type: 'video', id: ytVideo[1], playlist: ytPlaylist?.[1] };
  if (ytPlaylist) return { platform: 'youtube', type: 'playlist', id: ytPlaylist[1] };

  // Apple Music
  if (url.includes('music.apple.com')) return { platform: 'apple_music', type: 'embed', id: url };

  // Audiomack
  const am = url.match(/audiomack\.com\/([^/]+)\/(song|album|playlist)\/([^/?#]+)/);
  if (am) return { platform: 'audiomack', type: am[2], artist: am[1], slug: am[3] };

  // Deezer — album, track, playlist (avec ou sans langue, avec ou sans www)
  const dz = url.match(/deezer\.com\/(?:[a-z]{2}\/)?(?:album|track|playlist|artist)\/([0-9]+)/);
  const dzType = url.match(/deezer\.com\/(?:[a-z]{2}\/)?(album|track|playlist|artist)\//);
  if (dz) return { platform: 'deezer', type: dzType ? dzType[1] : 'album', id: dz[1] };

  // SoundCloud
  if (url.includes('soundcloud.com')) return { platform: 'soundcloud', type: 'track', id: url };

  return null;
}

// ── Génération de l'URL d'embed ──
function buildEmbedUrl(info) {
  if (!info) return null;

  switch (info.platform) {
    case 'spotify':
      return `https://open.spotify.com/embed/${info.type}/${info.id}?utm_source=generator&theme=0`;

    case 'youtube':
      if (info.type === 'playlist')
        return `https://www.youtube.com/embed/videoseries?list=${info.id}&modestbranding=1`;
      if (info.playlist)
        return `https://www.youtube.com/embed/${info.id}?list=${info.playlist}&modestbranding=1&rel=0`;
      return `https://www.youtube.com/embed/${info.id}?modestbranding=1&rel=0`;

    case 'apple_music': {
      // Transform open URL → embed URL
      let u = info.id.replace('music.apple.com', 'embed.music.apple.com');
      // Ensure embed path
      if (!u.includes('/embed/')) {
        u = u.replace('embed.music.apple.com/', 'embed.music.apple.com/');
      }
      return u;
    }

    case 'audiomack':
      return `https://audiomack.com/embed/${info.type}/${info.artist}/${info.slug}?background=1&color=%23e50000`;

    case 'deezer': {
      const dzTypeMap = { album: 'album', track: 'track', playlist: 'playlist', artist: 'artist' };
      const deezerType = dzTypeMap[info.type] || 'album';
      return `https://widget.deezer.com/widget/dark/${deezerType}/${info.id}`;
    }

    case 'soundcloud':
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(info.id)}&color=%23e50000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;

    default:
      return null;
  }
}

// ── Hauteur de l'iframe selon le type ──
function getEmbedHeight(info) {
  if (!info) return 152;
  if (info.platform === 'youtube') return 315;
  if (info.platform === 'soundcloud') return 300;
  if (info.platform === 'deezer') return 300;
  if (info.platform === 'apple_music') return 175;
  if (info.platform === 'audiomack') return 252;
  // Spotify: album/playlist = tall, track = compact
  if (info.platform === 'spotify') {
    if (info.type === 'album' || info.type === 'playlist') return 450;
    if (info.type === 'artist') return 380;
    return 152;
  }
  return 152;
}

// ── Sandbox requis par plateforme ──
function getSandbox(info) {
  if (!info) return undefined;
  if (info.platform === 'apple_music')
    return 'allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation';
  return undefined;
}

const PLATFORM_LABELS = {
  spotify: 'Spotify',
  youtube: 'YouTube',
  apple_music: 'Apple Music',
  audiomack: 'Audiomack',
  deezer: 'Deezer',
  soundcloud: 'SoundCloud',
};

const PLATFORM_COLORS = {
  spotify: 'bg-green-500/10 text-green-400 border-green-500/20',
  youtube: 'bg-red-500/10 text-red-400 border-red-500/20',
  apple_music: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  audiomack: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  deezer: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  soundcloud: 'bg-orange-600/10 text-orange-300 border-orange-600/20',
};

// ── Composant principal ──
// url : n'importe quel lien (Spotify, YouTube, Apple Music, Audiomack, Deezer, SoundCloud)
// label : texte du bouton (ex: titre de la sortie)
// autoExpand : affiche le player directement sans clic
export default function UniversalPlayer({ url, label, autoExpand = false, className = '' }) {
  const [expanded, setExpanded] = useState(autoExpand);
  const info = detectPlatform(url);
  const embedUrl = buildEmbedUrl(info);

  if (!url) return null;

  // Si plateforme non reconnue → lien externe simple
  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/80 transition-colors ${className}`}
      >
        <ExternalLink size={14} />
        Écouter
      </a>
    );
  }

  const platformColor = PLATFORM_COLORS[info.platform] || 'bg-secondary text-foreground border-border/30';
  const platformLabel = PLATFORM_LABELS[info.platform] || 'Écouter';
  const embedHeight = getEmbedHeight(info);
  const sandbox = getSandbox(info);

  return (
    <div className={`space-y-2 ${className}`}>
      {!autoExpand && (
        <button
          onClick={() => setExpanded(v => !v)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-semibold transition-all w-full justify-center shadow-sm hover:shadow-md ${platformColor}`}
        >
          {expanded
            ? <><Pause size={13} /> Masquer le lecteur</>
            : <><Play size={13} fill="currentColor" /> Écouter sur {platformLabel}</>
          }
        </button>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-2xl border border-border/40 bg-card"
          >
            <iframe
              src={embedUrl}
              width="100%"
              height={embedHeight}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              sandbox={sandbox}
              loading="lazy"
              className="rounded-2xl w-full block"
              title={label || platformLabel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Version compacte pour afficher un player directement (sans bouton) ──
export function EmbeddedPlayer({ url, className = '' }) {
  const info = detectPlatform(url);
  const embedUrl = buildEmbedUrl(info);
  if (!embedUrl) return null;
  const embedHeight = getEmbedHeight(info);
  const sandbox = getSandbox(info);
  return (
    <div className={`rounded-2xl overflow-hidden border border-border/40 bg-card ${className}`}>
      <iframe
        src={embedUrl}
        width="100%"
        height={embedHeight}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        sandbox={sandbox}
        loading="lazy"
        className="rounded-2xl w-full block"
      />
    </div>
  );
}