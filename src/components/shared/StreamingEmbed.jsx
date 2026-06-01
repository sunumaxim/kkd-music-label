// Re-exports from UniversalPlayer for backward compatibility
export { default as UniversalPlayer, EmbeddedPlayer, detectPlatform } from './UniversalPlayer';

import UniversalPlayer from './UniversalPlayer';

// ── Backward-compat wrappers ──
export function SpotifyPlayer({ url, className }) {
  return <UniversalPlayer url={url} autoExpand className={className} />;
}

export function YouTubePlayer({ url, className }) {
  return <UniversalPlayer url={url} autoExpand className={className} />;
}

export function AudiomackPlayer({ url, className }) {
  return <UniversalPlayer url={url} autoExpand className={className} />;
}

export function AppleMusicPlayer({ url, className }) {
  return <UniversalPlayer url={url} autoExpand className={className} />;
}

export function StreamingLinks({ spotify, youtube, apple_music, audiomack, deezer, soundcloud }) {
  const links = [
    { url: spotify, label: 'Spotify', color: 'bg-green-600' },
    { url: youtube, label: 'YouTube', color: 'bg-red-600' },
    { url: apple_music, label: 'Apple Music', color: 'bg-pink-600' },
    { url: audiomack, label: 'Audiomack', color: 'bg-orange-500' },
    { url: deezer, label: 'Deezer', color: 'bg-purple-600' },
    { url: soundcloud, label: 'SoundCloud', color: 'bg-orange-600' },
  ].filter(l => l.url);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${link.color} text-white text-xs font-medium px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity`}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function YouTubeThumbnail(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  const videoId = match ? match[1] : null;
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}